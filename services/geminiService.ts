
import { GoogleGenAI } from "@google/genai";
import { WSTGTest } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
    throw new Error("API Key missing");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateSecurityAdvice = async (test: WSTGTest, userQuery?: string): Promise<string> => {
  try {
    const ai = getClient();
    
    // Updated prompt context to include new fields and request Vietnamese response
    // Payloads is now an array of objects {code, description}
    const payloadContext = test.payloads.map(p => `- ${p.code} (${p.description})`).join('\n');

    let prompt = `
      Bạn là một Chuyên gia Bảo mật Cấp cao và Chuyên gia Kiểm thử Xâm nhập (Pentester) chuyên về các tiêu chuẩn OWASP.
      Hãy trả lời hoàn toàn bằng Tiếng Việt.
      
      Thông tin ngữ cảnh về bài kiểm tra:
      ID: ${test.id}
      Tiêu đề: ${test.title}
      Danh mục: ${test.category}
      Mô tả: ${test.description}
      Mục tiêu: ${test.objectives.join(', ')}
      Hướng dẫn thực hiện: ${test.instructions}
      Chiến lược: ${test.strategy}
      Payload mẫu: 
      ${payloadContext}
      Mức độ nghiêm trọng điển hình: ${test.severity}
    `;

    if (userQuery) {
      prompt += `\n\nCâu hỏi của người dùng: ${userQuery}\n\nHãy trả lời câu hỏi của người dùng một cách cụ thể liên quan đến bài kiểm tra bảo mật này. Cung cấp các lệnh CLI, payload hoặc ví dụ code cụ thể nếu cần thiết.`;
    } else {
      prompt += `\n\nHãy giải thích chi tiết cách thực hiện bài kiểm tra này từng bước một (Step-by-step). Cung cấp thêm 2-3 vector tấn công cụ thể hoặc payload nâng cao để kiểm tra lỗ hổng này. Giữ văn phong kỹ thuật, chuyên nghiệp và ngắn gọn.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Không tạo được phản hồi.";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Lỗi khi tạo lời khuyên. Vui lòng kiểm tra API Key và thử lại.";
  }
};

interface GeneratedTestCase {
  title: string;
  wstgId: string;
  description: string;
  severity: 'Info' | 'Low' | 'Medium' | 'High' | 'Critical';
  target: string; // New field
}

export const analyzeRequestAndGenerateTests = async (requestRaw: string): Promise<GeneratedTestCase[]> => {
  try {
    const ai = getClient();
    
    const prompt = `
      Bạn là một chuyên gia Pentest tự động (Automated Security Analyzer).
      Nhiệm vụ: Phân tích HTTP Request thô (raw) được cung cấp dưới đây, xác định các tham số "untrusted data" (người dùng nhập vào) và đề xuất các Test Case bảo mật phù hợp theo chuẩn OWASP WSTG v4.2.

      HTTP Request:
      \`\`\`http
      ${requestRaw}
      \`\`\`

      Yêu cầu đầu ra:
      1. Phân tích các header, query params, body params.
      2. Xác định Endpoint (Target) của request (Ví dụ: "POST /login" hoặc "Function: User Search").
      3. Tạo danh sách các test cases cụ thể cho request này.
      4. Chỉ trả về định dạng JSON hợp lệ (không Markdown), là một mảng các object.
      
      Cấu trúc JSON mong muốn:
      [
        {
          "title": "Tiêu đề ngắn gọn (VD: Test SQLi trên tham số id)",
          "wstgId": "Mã WSTG chuẩn (VD: WSTG-INPV-05)",
          "description": "Mô tả chi tiết cách test: Inject payload gì vào đâu...",
          "severity": "Info" | "Low" | "Medium" | "High" | "Critical",
          "target": "GET /api/v1/users (hoặc tên chức năng)" 
        }
      ]

      Hãy tập trung vào các lỗi phổ biến: SQLi, XSS, IDOR, SSRF, Command Injection, Mass Assignment.
      Hãy trả lời hoàn toàn bằng JSON. Không thêm giải thích thừa.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed as GeneratedTestCase[];
      }
      return [];
    } catch (e) {
      console.error("Failed to parse JSON from AI:", e);
      return [];
    }

  } catch (error) {
    console.error("Error analyzing request:", error);
    throw error;
  }
};
