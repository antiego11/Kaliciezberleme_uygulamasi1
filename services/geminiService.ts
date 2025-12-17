import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

const getClient = () => {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return client;
};

export const sendMessageToGemini = async (
  history: { role: 'user' | 'model'; text: string }[],
  newMessage: string
): Promise<string> => {
  try {
    const ai = getClient();
    
    // Transform history for the chat API
    // Note: The specific Chat API abstraction might vary, but we can use generateContent with history context usually,
    // or use the proper chats.create method if maintaining session state.
    // For simplicity in this stateless service call, we'll use a chat session.
    
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: "Sen yardımsever bir öğrenme asistanısın. Kullanıcının öğrendiği konuları pekiştirmesine yardımcı oluyorsun. Türkçe cevap ver.",
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "Üzgünüm, boş bir cevap aldım.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Bir hata oluştu. Lütfen API anahtarınızı kontrol edin veya daha sonra tekrar deneyin.";
  }
};
