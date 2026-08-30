import { ChatData, Message } from "../types";

export interface PersonMetrics {
    name: string;
    messageCount: number;
    totalChars: number;
    avgChars: number;
    longestMessage: string;
    questions: number;
    emojis: number;
    responseRate: number;
    avgResponseMin: number;
    medianResponseMin: number;
    initiations: number;
}

export interface ConversationMetrics {
    participantA: PersonMetrics;
    participantB: PersonMetrics;
    lastMessageAuthor: string;
    lastMessageLagHours: number;
    activeDays: number;
    longestStreakDays: number;
    longestSilenceDays: number;
    pausesOver48h: number;
    citations: {
        conversationStart: string;
        conversationEnd: string;
        longestSilenceBreak?: string;
    };
}

interface Round {
    author: string;
    startDate: Date;
    endDate: Date;
}

const MINUTE_MS = 60000;
const HOUR_MS = 3600000;
const DAY_MS = 86400000;
const INITIATION_THRESHOLD_MIN = 1440;

const formatMinutes = (min: number): string => {
    if (min < 60) return `${min}min`;
    const h = Math.floor(min / 60);
    const rest = min % 60;
    return rest > 0 ? `${h}h${rest}min` : `${h}h`;
};

const formatLag = (hours: number): string => {
    if (hours < 1) return `${Math.round(hours * 60)}min`;
    if (hours < 24) return `${hours}h`;
    return `${Math.round((hours / 24) * 10) / 10} dias`;
};

export const formatMetricsBlock = (m: ConversationMetrics): string => {
    if (!m.participantA.name || !m.participantB.name) {
        return "DADOS MEDIDOS: conversa sem dois participantes para comparação.";
    }
    const a = m.participantA;
    const b = m.participantB;
    const lines = [
        "DADOS MEDIDOS (verdade absoluta da conversa; seja FIEL a eles):",
        `- Mensagens: ${a.name} ${a.messageCount}, ${b.name} ${b.messageCount}.`,
        `- Tempo médio de resposta: ${a.name} ${formatMinutes(a.avgResponseMin)} (mediana ${formatMinutes(a.medianResponseMin)}); ${b.name} ${formatMinutes(b.avgResponseMin)} (mediana ${formatMinutes(b.medianResponseMin)}).`,
        `- Taxa de resposta: ${a.name} ${Math.round(a.responseRate * 100)}%, ${b.name} ${Math.round(b.responseRate * 100)}%.`,
        `- Inícios após silêncio >=24h: ${a.name} ${a.initiations}, ${b.name} ${b.initiations}.`,
        `- Vácuo: a última mensagem é de ${m.lastMessageAuthor}, há ${formatLag(m.lastMessageLagHours)} sem resposta.`,
        `- Perguntas feitas: ${a.name} ${a.questions}, ${b.name} ${b.questions}. Emojis: ${a.name} ${a.emojis}, ${b.name} ${b.emojis}.`,
        `- Maior silêncio: ${m.longestSilenceDays} dias. Pausas >48h: ${m.pausesOver48h}.`,
        `- Dias ativos: ${m.activeDays}. Maior streak: ${m.longestStreakDays} dias.`,
        "",
        "CITAÇÕES LITERAIS (use EXATAMENTE como estão, sem alterar):",
    ];
    if (m.citations.conversationStart) lines.push(`- Início da conversa: "${m.citations.conversationStart}"`);
    if (m.citations.conversationEnd) lines.push(`- Fim da conversa: "${m.citations.conversationEnd}"`);
    if (m.citations.longestSilenceBreak) lines.push(`- Mensagem após o maior silêncio: "${m.citations.longestSilenceBreak}"`);
    return lines.join("\n");
};

const truncate = (text: string, max = 120): string =>
    text.length > max ? text.slice(0, max) + "…" : text;

const EMOJI_REGEX = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;

const countEmojis = (content: string): number => {
    const withoutVariationSelectors = content.replace(/\uFE0F/gu, "");
    return withoutVariationSelectors.match(EMOJI_REGEX)?.length || 0;
};

const median = (values: number[]): number => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

const emptyPerson = (name: string): PersonMetrics => ({
    name,
    messageCount: 0,
    totalChars: 0,
    avgChars: 0,
    longestMessage: "",
    questions: 0,
    emojis: 0,
    responseRate: 0,
    avgResponseMin: 0,
    medianResponseMin: 0,
    initiations: 0,
});

export const computeMetrics = (chat: ChatData): ConversationMetrics => {
    const base = chat.messages.filter((m) => !m.isSystem);

    const authors: string[] = [];
    for (const m of base) {
        if (!authors.includes(m.author)) authors.push(m.author);
    }
    const [authorA, authorB] = [authors[0] || "", authors[1] || ""];

    const messages = base.filter((m) => m.author === authorA || m.author === authorB);
    const computeFor = (name: string): PersonMetrics => {
        const mine = messages.filter((m) => m.author === name);
        if (mine.length === 0) return emptyPerson(name);

        const totalChars = mine.reduce((sum, m) => sum + m.content.length, 0);
        const longest = mine.reduce((best, m) => (m.content.length > best.content.length ? m : best), mine[0]);
        const questions = mine.filter((m) => m.content.trim().endsWith("?")).length;
        const emojis = mine.reduce((sum, m) => sum + countEmojis(m.content), 0);

        const rounds = buildRounds(messages);
        const myRounds = rounds.filter((r) => r.author === name);
        const latencies: number[] = [];
        for (let i = 0; i < rounds.length - 1; i++) {
            if (rounds[i].author !== name) continue;
            const diffMin = (rounds[i + 1].startDate.getTime() - rounds[i].endDate.getTime()) / MINUTE_MS;
            if (diffMin > 0) latencies.push(Math.round(diffMin));
        }

        const lastRoundIsMine = rounds.length > 0 && rounds[rounds.length - 1].author === name;
        const denominator = myRounds.length - (lastRoundIsMine ? 1 : 0);

        const initiations = myRounds.filter((r) => {
            const idx = rounds.indexOf(r);
            if (idx === 0) return true;
            const prevMsg = findMessageBefore(messages, r.startDate);
            if (!prevMsg) return true;
            return (r.startDate.getTime() - prevMsg.date.getTime()) / MINUTE_MS >= INITIATION_THRESHOLD_MIN;
        }).length;

        return {
            name,
            messageCount: mine.length,
            totalChars,
            avgChars: Math.round(totalChars / mine.length),
            longestMessage: longest.content,
            questions,
            emojis,
            responseRate: denominator > 0 ? latencies.length / denominator : 0,
            avgResponseMin: latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0,
            medianResponseMin: Math.round(median(latencies)),
            initiations,
        };
    };

    const empty: ConversationMetrics = {
        participantA: emptyPerson(authorA),
        participantB: emptyPerson(authorB),
        lastMessageAuthor: "",
        lastMessageLagHours: 0,
        activeDays: 0,
        longestStreakDays: 0,
        longestSilenceDays: 0,
        pausesOver48h: 0,
        citations: { conversationStart: "", conversationEnd: "" },
    };
    if (messages.length === 0) return empty;

    const lastMsg = messages[messages.length - 1];
    const prevMsg = messages.length > 1 ? messages[messages.length - 2] : null;
    const lastMessageLagHours =
        prevMsg ? Math.round(((lastMsg.date.getTime() - prevMsg.date.getTime()) / HOUR_MS) * 10) / 10 : 0;

    const activeDaysSet = new Set<string>();
    for (const m of messages) activeDaysSet.add(localDayKey(m.date));
    const activeDays = activeDaysSet.size;

    const daysBoth = [...activeDaysSet].sort();
    let streak = 0;
    let longestStreakDays = 0;
    const messagesOfDay = new Map<string, Set<string>>();
    for (const m of messages) {
        const key = localDayKey(m.date);
        if (!messagesOfDay.has(key)) messagesOfDay.set(key, new Set());
        messagesOfDay.get(key)!.add(m.author);
    }
    for (let i = 0; i < daysBoth.length; i++) {
        const hasBoth = messagesOfDay.get(daysBoth[i])?.size === 2;
        const consecutive = i > 0 && daysBetweenDays(daysBoth[i - 1], daysBoth[i]) === 1;
        if (hasBoth && consecutive) {
            streak++;
            longestStreakDays = Math.max(longestStreakDays, streak + 1);
        } else {
            if (hasBoth) longestStreakDays = Math.max(longestStreakDays, 1);
            streak = 0;
        }
    }

    let longestSilenceDays = 0;
    let pausesOver48h = 0;
    let longestGapStart: Date | null = null;
    for (let i = 0; i < messages.length - 1; i++) {
        const gapMs = messages[i + 1].date.getTime() - messages[i].date.getTime();
        const gapDays = Math.floor(gapMs / DAY_MS);
        if (gapDays > 0) {
            if (gapDays > longestSilenceDays) {
                longestSilenceDays = gapDays;
                longestGapStart = messages[i].date;
            }
            if (gapMs > 48 * HOUR_MS) pausesOver48h++;
        }
    }

    const withText = messages.filter((m) => m.content.trim().length > 0);
    const longestSilenceBreak = longestGapStart
        ? withText.find((m) => m.date > longestGapStart)
        : undefined;

    return {
        participantA: computeFor(authorA),
        participantB: computeFor(authorB),
        lastMessageAuthor: lastMsg.author,
        lastMessageLagHours,
        activeDays,
        longestStreakDays,
        longestSilenceDays,
        pausesOver48h,
        citations: {
            conversationStart: withText.length > 0 ? truncate(withText[0].content) : "",
            conversationEnd: withText.length > 0 ? truncate(withText[withText.length - 1].content) : "",
            longestSilenceBreak: longestSilenceBreak ? truncate(longestSilenceBreak.content) : undefined,
        },
    };
};

function buildRounds(messages: Message[]): Round[] {
    const rounds: Round[] = [];
    for (const m of messages) {
        const last = rounds[rounds.length - 1];
        if (last && last.author === m.author) {
            last.endDate = m.date;
        } else {
            rounds.push({ author: m.author, startDate: m.date, endDate: m.date });
        }
    }
    return rounds;
}

function findMessageBefore(messages: Message[], date: Date): Message | null {
    let candidate: Message | null = null;
    for (const m of messages) {
        if (m.date < date) candidate = m;
        else break;
    }
    return candidate;
}

function localDayKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function daysBetweenDays(a: string, b: string): number {
    const [ay, am, ad] = a.split("-").map(Number);
    const [by, bm, bd] = b.split("-").map(Number);
    const aDate = new Date(ay, am, ad);
    const bDate = new Date(by, bm, bd);
    return Math.round((bDate.getTime() - aDate.getTime()) / DAY_MS);
}