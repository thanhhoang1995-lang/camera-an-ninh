
import { GoogleGenAI, Type } from "@google/genai";
import { Camera } from "../types";

export const getGeminiResponse = async (prompt: string, cameraData: Camera[]) => {
  // Always use process.env.API_KEY directly and instantiate before call per guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    Bạn là chuyên gia quản lý hệ thống camera giám sát của Phường Lâm Viên, Đà Lạt.
    Dữ liệu camera hiện tại: ${JSON.stringify(cameraData.filter(c => !c.deleted))}.
    Hãy hỗ trợ người dùng giải đáp các thắc mắc về tình trạng hệ thống, vị trí camera hoặc các thông tin liên quan đến an ninh.
    Sử dụng Google Search nếu người dùng hỏi về thời tiết, sự kiện hoặc tin tức mới nhất tại Đà Lạt.
    Luôn trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    // Extracting grounding URLs as required when using googleSearch tool.
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web)
      .filter((web: any) => web && web.uri)
      .map((web: any) => ({
        uri: web.uri,
        title: web.title || web.uri
      })) || [];

    return {
      text: response.text || "Xin lỗi, tôi không thể xử lý yêu cầu này lúc này.",
      sources
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "Có lỗi xảy ra khi kết nối với AI.", sources: [] };
  }
};
