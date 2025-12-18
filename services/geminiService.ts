
import { GoogleGenAI, Type } from "@google/genai";
import { Message, AnalysisResult, DatingAnalysisResult } from "../types.ts";

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
    // Pegamos mais contexto para a análise premium
    const snippet = [...messages.slice(0, 40), ...messages.slice(-120)]
        .map(m => `[${m.author}]: ${m.content}`)
        .join('\n');

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `Aja como um renomado psicólogo especializado em relacionamentos e análise comportamental.
Analise profundamente esta conversa entre ${participants.join(' e ')}.
Toda a análise deve ser feita em PORTUGUÊS BRASILEIRO.

CRITÉRIOS:
1. Ghosting Score: Avalie quem demonstra mais interesse, quem responde mais rápido e quem inicia mais os assuntos (0 a 100).
2. Red Flags: Pontos de atenção baseados em fatos na conversa. O campo 'citation' deve ser o trecho exato.
3. Green Flags: Pontos positivos comprovados. O campo 'citation' deve ser o trecho exato.
4. Relationship Health: Pontuação geral de 0 a 100 baseada na reciprocidade.
5. Sentiment Trend: Evolução da conversa.
6. AI Advice: Um conselho direto, sem rodeios, sobre o futuro dessa relação.

IMPORTANTE: Responda APENAS com o JSON.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [{ text: prompt + "\n\nCONVERSA:\n" + snippet }]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        ghostingScore: {
                            type: Type.OBJECT,
                            properties: {
                                userA: { 
                                    type: Type.OBJECT, 
                                    properties: { 
                                        name: { type: Type.STRING }, 
                                        score: { type: Type.NUMBER }, 
                                        label: { type: Type.STRING } 
                                    },
                                    required: ["name", "score", "label"]
                                },
                                userB: { 
                                    type: Type.OBJECT, 
                                    properties: { 
                                        name: { type: Type.STRING }, 
                                        score: { type: Type.NUMBER }, 
                                        label: { type: Type.STRING } 
                                    },
                                    required: ["name", "score", "label"]
                                },
                                description: { type: Type.STRING }
                            },
                            required: ["userA", "userB", "description"]
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
                        relationshipHealth: { type: Type.NUMBER },
                        sentimentTrend: { type: Type.STRING },
                        aiAdvice: { type: Type.STRING }
                    },
                    required: ["ghostingScore", "redFlags", "greenFlags", "relationshipHealth", "sentimentTrend", "aiAdvice"]
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
