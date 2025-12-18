
import { GoogleGenAI, Type } from "@google/genai";
import { Message, AnalysisResult, DatingAnalysisResult } from "../types.ts";

const parseJson = (text: string) => {
    try {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start === -1 || end === -1) return null;
        return JSON.parse(text.substring(start, end + 1));
    } catch (e) {
        console.error("Failed to parse JSON", e);
        return null;
    }
}

export const analyzeChat = async (messages: Message[]): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const snippet = [...messages.slice(0, 15), ...messages.slice(-60)]
    .map(m => `[${m.date.toISOString()}] ${m.author}: ${m.content}`)
    .join('\n');

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Aja como um analista de relacionamentos. Analise esta conversa de WhatsApp e retorne um JSON com summary (resumo em português), sentiment (sentimento geral em português, ex: "Interesse Mútuo", "Frio", "Conflituoso") e topics (lista de assuntos em português).\n\nToda a resposta deve ser em PORTUGUÊS BRASILEIRO.\n\nConversa:\n${snippet}`,
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

  return parseJson(response.text);
};

export const analyzeDatingInsights = async (messages: Message[]): Promise<DatingAnalysisResult> => {
    if (!process.env.API_KEY) throw new Error("API Key is missing.");

    const participants = Array.from(new Set(messages.filter(m => !m.isSystem).map(m => m.author)));
    const snippet = [...messages.slice(0, 50), ...messages.slice(-150)]
        .map(m => `[${m.author}]: ${m.content}`)
        .join('\n');

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
        Aja como um renomado psicólogo especializado em análise comportamental forense.
        Analise profundamente esta conversa entre ${participants.join(' e ')}.
        Toda a análise deve ser feita em PORTUGUÊS BRASILEIRO.
        
        IMPORTANTE: Para cada Red Flag e Green Flag identificada, você DEVE fornecer uma citação direta (campo 'citation') 
        extraída do texto original que comprove sua análise. Mencione quem falou e o que foi dito (ex: "User B disse: 'Kkkk'").
        
        Gere um relatório "VibeCheck Premium" contendo:
        1. Ghosting Score: Analise iniciativa, tempo de resposta e interações.
        2. Red Flags: Pontos negativos com citação direta da evidência.
        3. Green Flags: Pontos positivos com citação direta da evidência.
        4. Saúde do Relacionamento: Score de 0 a 100.
        5. Tendência de Sentimento.
        6. Conselho Sincero da IA.

        Responda APENAS JSON seguindo o esquema rigorosamente.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt + "\n\nConversa:\n" + snippet,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    ghostingScore: {
                        type: Type.OBJECT,
                        properties: {
                            userA: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, score: { type: Type.NUMBER }, label: { type: Type.STRING } } },
                            userB: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, score: { type: Type.NUMBER }, label: { type: Type.STRING } } },
                            description: { type: Type.STRING }
                        }
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
                }
            }
        }
    });

    return parseJson(response.text);
};
