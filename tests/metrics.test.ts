import { describe, it, expect } from "vitest";
import { computeMetrics, formatMetricsBlock } from "../utils/metrics";
import { ANABRUNO_CHAT } from "./fixtures/chat";

describe("computeMetrics", () => {
    const m = computeMetrics(ANABRUNO_CHAT);

    it("nomeia A e B pela ordem cronológica", () => {
        expect(m.participantA.name).toBe("Ana");
        expect(m.participantB.name).toBe("Bruno");
    });

    it("conta mensagens, caracteres e maior mensagem", () => {
        expect(m.participantA.messageCount).toBe(9);
        expect(m.participantB.messageCount).toBe(9);
        expect(m.participantA.totalChars).toBe(199);
        expect(m.participantB.totalChars).toBe(203);
        expect(m.participantA.avgChars).toBe(22);
        expect(m.participantB.avgChars).toBe(23);
        expect(m.participantA.longestMessage).toBe("melhor agora que você respondeu hehe");
        expect(m.participantB.longestMessage).toBe("sem problema, me conta da viagem!");
    });

    it("mede latências de resposta por round (round same-minute não conta como resposta)", () => {
        expect(m.participantA.avgResponseMin).toBe(572);
        expect(m.participantA.medianResponseMin).toBe(180);
        expect(m.participantB.avgResponseMin).toBe(421);
        expect(m.participantB.medianResponseMin).toBe(20);
    });

    it("calcula taxa de resposta (último round de Ana não conta no denominador)", () => {
        expect(m.participantA.responseRate).toBe(7 / 8);
        expect(m.participantB.responseRate).toBe(1);
    });

    it("conta inícios de conversa (>=24h de silêncio ou primeira mensagem)", () => {
        expect(m.participantA.initiations).toBe(2);
        expect(m.participantB.initiations).toBe(1);
    });

    it("conta perguntas e emojis", () => {
        expect(m.participantA.questions).toBe(2);
        expect(m.participantB.questions).toBe(3);
        expect(m.participantA.emojis).toBe(4);
        expect(m.participantB.emojis).toBe(2);
    });

    it("detecta o vácuo final", () => {
        expect(m.lastMessageAuthor).toBe("Ana");
        expect(m.lastMessageLagHours).toBe(0.5);
    });

    it("mede dias ativos, streaks e silêncios", () => {
        expect(m.activeDays).toBe(4);
        expect(m.longestStreakDays).toBe(1);
        expect(m.longestSilenceDays).toBe(2);
        expect(m.pausesOver48h).toBe(1);
    });

    it("produz citações literais exatas", () => {
        expect(m.citations.conversationStart).toBe("oi amor, tudo bem?");
        expect(m.citations.conversationEnd).toBe("foi ótima, muita praia e sol ☀️");
        expect(m.citations.longestSilenceBreak).toBe("foi mal a demora, tava viajando");
    });

    it("não quebra com conversa vazia ou 1 participante", () => {
        const empty = computeMetrics({ participants: [], messages: [], title: "" });
        expect(empty.participantA.messageCount).toBe(0);
        expect(empty.participantA.name).toBe("");
        const single = computeMetrics({
            participants: ["Ana"],
            messages: [{ id: "x", date: new Date(2026, 7, 1, 10, 0), author: "Ana", content: "oi", isSystem: false }],
            title: "",
        });
        expect(single.participantA.messageCount).toBe(1);
        expect(single.lastMessageAuthor).toBe("Ana");
    });
});

describe("formatMetricsBlock", () => {
    it("contém nomes, números e seção de citações", () => {
        const block = formatMetricsBlock(computeMetrics(ANABRUNO_CHAT));
        expect(block).toContain("Ana");
        expect(block).toContain("Bruno");
        expect(block).toContain("Mensagens: Ana 9, Bruno 9");
        expect(block).toContain("CITAÇÕES LITERAIS");
        expect(block).toContain("oi amor, tudo bem?");
    });
});