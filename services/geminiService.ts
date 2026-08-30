import { GoogleGenAI, Type } from "@google/genai";
import { Message, AnalysisResult, DatingAnalysisResult, ChatData } from "../types.ts";
import { computeMetrics, formatMetricsBlock } from "../utils/metrics.ts";

const parseJson = (text: string) => {
    try {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start === -1 || end === -1) return null;
        const jsonStr = text.substring(start, end + 1);
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Falha ao parsear JSON da IA:", e, "Texto bruto:", text);
        return null;
    }
}

export const analyzeChat = async (messages: Message[]): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("Chave da API (Gemini) não configurada.");
  }

  const snippet = [...messages.slice(0, 15), ...messages.slice(-60)]
    .map(m => `[${m.date.toISOString()}] ${m.author}: ${m.content}`)
    .join('\n');

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise esta conversa de WhatsApp e retorne um JSON com summary (resumo em português), sentiment (sentimento geral em português) e topics (lista de assuntos).\n\nConversa:\n${snippet}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            sentiment: { type: Type.STRING },
            topics: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "sentiment", "topics"]
        }
      }
    });

    const result = parseJson(response.text);
    if (!result) throw new Error("Resposta da IA inválida.");
    return result;
  } catch (err: any) {
    console.error("Erro analyzeChat:", err);
    throw err;
  }
};

export const analyzeDatingInsights = async (messages: Message[]): Promise<DatingAnalysisResult> => {
    if (!process.env.API_KEY) throw new Error("Chave da API (Gemini) não configurada.");

    const participants = Array.from(new Set(messages.filter(m => !m.isSystem).map(m => m.author)));
    if (participants.length < 2) throw new Error("Conversa precisa de pelo menos 2 participantes para o diagnóstico Pro.");

    // Amostragem distribuída: início, meio e fim da conversa
    let sampledMessages: Message[] = [];
    if (messages.length <= 150) {
        sampledMessages = messages;
    } else {
        const start = messages.slice(0, 35);
        const midIndex = Math.floor(messages.length / 2);
        const middle = messages.slice(midIndex - 20, midIndex + 20);
        const end = messages.slice(-75);
        sampledMessages = [...start, ...middle, ...end];
    }

    const snippet = sampledMessages
        .map(m => `[${m.author}]: ${m.content}`)
        .join('\n');

    const metrics = computeMetrics({ participants, messages, title: '' });
    const metricsBlock = formatMetricsBlock(metrics);

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `Aja como um renomado psicólogo comportamental, especialista em dinâmicas de relacionamento interpessoal, linguagem corporal/digital e estilos de apego.
Sua missão é produzir um LAUDO PSICOLÓGICO E COMPORTAMENTAL EXTREMAMENTE DETALHADO, PRECISO E PROFISSIONAL sobre a conversa entre ${participants.join(' e ')}.
Toda a análise deve ser em PORTUGUÊS DO BRASIL.

DADOS FACTUAIS MEDIDOS:
${metricsBlock}

DIRETRIZES FUNDAMENTAIS:
1. Resumo Executivo: Diagnóstico clínico de 2 a 3 parágrafos sobre a essência da relação e do vínculo.
2. Perfis Comportamentais: Mapeie o Estilo de Apego (Seguro, Ansioso, Evitativo, Desorganizado), Estilo de Comunicação, Investimento Emocional (0-100), Dinâmica de Poder e Comportamento-Chave de cada pessoa.
3. Decodificador de Subtexto: Identifique pelo menos 3 a 5 mensagens reais e decodifique o que estava nas entrelinhas (o que pareceu vs o que realmente significou psicologicamente). Use citações textuais fiéis da conversa.
4. Red Flags & Green Flags: Pontos de atenção e pontos fortes baseados em fatos reais da conversa com citação exata.
5. Termômetros de Conexão: Estime scores de 0 a 100 para Intimidade, Ansiedade/Cobrança, Compatibilidade de Vibe e Potencial Futuro.
6. Linha do Tempo: Identifique as 3 a 4 fases evolutivas da conversa (início, desenvolvimento, momento atual).
7. Playbook Estratégico de Ação: O que fazer de concreto agora, o que JAMAIS fazer e 2 a 3 sugestões de mensagens prontas para enviar.
8. Veredito e Conselho Final: Avaliação final realista e direta sobre o futuro e recomendações.

IMPORTANTE: Responda APENAS com o JSON estrito.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [{ text: prompt + "\n\nCONVERSA COMPLETA/AMOSTRADA:\n" + snippet }]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        executiveSummary: { type: Type.STRING },
                        relationshipHealth: { type: Type.NUMBER },
                        sentimentTrend: { 
                            type: Type.STRING, 
                            enum: ['Melhorando', 'Declinando', 'Estável', 'Vulnerável'] 
                        },
                        ghostingScore: {
                            type: Type.OBJECT,
                            properties: {
                                userA: { 
                                    type: Type.OBJECT, 
                                    properties: { 
                                        name: { type: Type.STRING }, 
                                        score: { type: Type.NUMBER }, 
                                        label: { type: Type.STRING },
                                        evidence: { type: Type.STRING }
                                    },
                                    required: ["name", "score", "label", "evidence"]
                                },
                                userB: { 
                                    type: Type.OBJECT, 
                                    properties: { 
                                        name: { type: Type.STRING }, 
                                        score: { type: Type.NUMBER }, 
                                        label: { type: Type.STRING },
                                        evidence: { type: Type.STRING }
                                    },
                                    required: ["name", "score", "label", "evidence"]
                                },
                                description: { type: Type.STRING }
                            },
                            required: ["userA", "userB", "description"]
                        },
                        behavioralProfiles: {
                            type: Type.OBJECT,
                            properties: {
                                userA: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        communicationStyle: { type: Type.STRING },
                                        attachmentStyle: { 
                                            type: Type.STRING, 
                                            enum: ['Seguro', 'Ansioso', 'Evitativo', 'Desorganizado'] 
                                        },
                                        emotionalInvestment: { type: Type.NUMBER },
                                        powerDynamic: { 
                                            type: Type.STRING, 
                                            enum: ['Dominante', 'Equilibrado', 'Passivo/Submisso', 'Evitativo/Indiferente'] 
                                        },
                                        keyBehavior: { type: Type.STRING }
                                    },
                                    required: ["name", "communicationStyle", "attachmentStyle", "emotionalInvestment", "powerDynamic", "keyBehavior"]
                                },
                                userB: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        communicationStyle: { type: Type.STRING },
                                        attachmentStyle: { 
                                            type: Type.STRING, 
                                            enum: ['Seguro', 'Ansioso', 'Evitativo', 'Desorganizado'] 
                                        },
                                        emotionalInvestment: { type: Type.NUMBER },
                                        powerDynamic: { 
                                            type: Type.STRING, 
                                            enum: ['Dominante', 'Equilibrado', 'Passivo/Submisso', 'Evitativo/Indiferente'] 
                                        },
                                        keyBehavior: { type: Type.STRING }
                                    },
                                    required: ["name", "communicationStyle", "attachmentStyle", "emotionalInvestment", "powerDynamic", "keyBehavior"]
                                },
                                dynamicSummary: { type: Type.STRING }
                            },
                            required: ["userA", "userB", "dynamicSummary"]
                        },
                        redFlags: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    severity: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
                                    description: { type: Type.STRING },
                                    citation: { type: Type.STRING }
                                },
                                required: ["severity", "description", "citation"]
                            }
                        },
                        greenFlags: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    description: { type: Type.STRING },
                                    citation: { type: Type.STRING }
                                },
                                required: ["description", "citation"]
                            }
                        },
                        subtextDecoders: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    quote: { type: Type.STRING },
                                    apparentMeaning: { type: Type.STRING },
                                    hiddenMeaning: { type: Type.STRING },
                                    psychologicalInsight: { type: Type.STRING }
                                },
                                required: ["quote", "apparentMeaning", "hiddenMeaning", "psychologicalInsight"]
                            }
                        },
                        connectionThermometers: {
                            type: Type.OBJECT,
                            properties: {
                                intimacyScore: { type: Type.NUMBER },
                                anxietyScore: { type: Type.NUMBER },
                                vibeCompatibility: { type: Type.NUMBER },
                                futurePotentialScore: { type: Type.NUMBER }
                            },
                            required: ["intimacyScore", "anxietyScore", "vibeCompatibility", "futurePotentialScore"]
                        },
                        relationshipTimeline: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    phase: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    sentiment: { type: Type.STRING, enum: ['Positivo', 'Neutro', 'Tenso', 'Frio'] }
                                },
                                required: ["phase", "description", "sentiment"]
                            }
                        },
                        actionPlaybook: {
                            type: Type.OBJECT,
                            properties: {
                                whatToDo: { type: Type.ARRAY, items: { type: Type.STRING } },
                                whatToAvoid: { type: Type.ARRAY, items: { type: Type.STRING } },
                                suggestedMessages: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            context: { type: Type.STRING },
                                            draft: { type: Type.STRING },
                                            objective: { type: Type.STRING }
                                        },
                                        required: ["context", "draft", "objective"]
                                    }
                                }
                            },
                            required: ["whatToDo", "whatToAvoid", "suggestedMessages"]
                        },
                        aiAdvice: { type: Type.STRING }
                    },
                    required: [
                        "executiveSummary",
                        "relationshipHealth",
                        "sentimentTrend",
                        "ghostingScore",
                        "behavioralProfiles",
                        "redFlags",
                        "greenFlags",
                        "subtextDecoders",
                        "connectionThermometers",
                        "relationshipTimeline",
                        "actionPlaybook",
                        "aiAdvice"
                    ]
                }
            }
        });

        const result = parseJson(response.text);
        if (!result) throw new Error("A IA gerou uma resposta que não pôde ser processada.");
        return result;
    } catch (err: any) {
        console.error("Erro analyzeDatingInsights:", err);
        throw err;
    }
};
