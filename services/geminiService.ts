
import { GoogleGenAI } from "@google/genai";
import { Camera } from "../types";

export const analyzeSystemSecurity = async (cameraData: Camera[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const activeCameras = cameraData.filter(c => !c.deleted);
  const prompt = `
    Dựa trên danh sách camera sau tại Phường Lâm Viên, Đà Lạt:
    ${JSON.stringify(activeCameras.map(c => ({ name: c.name, address: c.address, status: c.status })))}
    
    Hãy thực hiện:
    1. Đánh giá độ phủ sóng an ninh hiện tại.
    2. Chỉ ra các "điểm mù" hoặc khu vực trọng điểm có thể đang thiếu sự giám sát (ví dụ: các ngõ nhỏ, khu vực công viên, hoặc chợ).
    3. Gợi ý 3 vị trí cụ thể cần lắp thêm camera để tối ưu hóa an ninh.
    
    Trả lời bằng tiếng Việt, định dạng Markdown chuyên nghiệp, có các tiêu mục rõ ràng.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 2000 }
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Security Analysis Error:", error);
    return "Không thể thực hiện phân tích AI lúc này. Vui lòng kiểm tra lại kết nối mạng.";
  }
};
