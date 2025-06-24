import { GoogleGenAI, GenerateContentResponse, Part, Content } from "@google/genai";
import { 
    GEMINI_MODEL_NAME, 
    CHATBOT_SYSTEM_PROMPT,
    SENSITIVE_CONTENT_ERROR_PREFIX,
    SENSITIVE_CONTENT_KEYWORDS // Kept for potential fallback or additional checks
} from '../constants';
import { ChatMessage, ChatMessageContentPart, ChatRole, UploadedFile } from '../types';

// Initialize the GoogleGenAI client
// IMPORTANT: The API key MUST be obtained exclusively from process.env.API_KEY.
let ai: GoogleGenAI;
try {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set.");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} catch (e: any) {
    console.error("Failed to initialize GoogleGenAI:", e.message);
    // This creates a non-functional 'ai' object to prevent crashes if API_KEY is missing,
    // but operations will fail. Proper handling should ensure API_KEY is always available.
    ai = { models: {} } as GoogleGenAI; 
}


const createError = (message: string, operationName: string, originalError?: any): Error => {
    console.error(`Error during ${operationName}:`, originalError || message);
    return new Error(message);
};

export const optimizePrompt = async (promptText: string): Promise<string> => {
  const operationName = "Optimasi prompt";
  if (!promptText.trim()) return "";
  if (!ai.models.generateContent) throw createError("Layanan AI tidak terinisialisasi dengan benar.", operationName);

  const systemInstruction = "You are an expert prompt engineer. Your task is to expand and enrich a user's simple idea into a detailed, vivid, and descriptive prompt for an AI image generator. Add relevant keywords like styles (e.g., photorealistic, cinematic), lighting, composition, and mood. Only output the final, optimized prompt text, without any introductions, explanations, or quotation marks.";
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: promptText,
      config: {
        systemInstruction: systemInstruction,
        // Add other relevant config like temperature if needed
      }
    });

    if (response.candidates?.[0]?.finishReason === 'SAFETY') {
      throw createError(`${SENSITIVE_CONTENT_ERROR_PREFIX}${operationName} gagal karena konten terdeteksi sensitif.`, operationName);
    }
    
    const text = response.text;
    if (text) {
      return text.trim();
    }
    throw createError(`Respon tidak valid dari layanan AI pendukung saat ${operationName}.`, operationName);

  } catch (error: any) {
    if (error.message.startsWith(SENSITIVE_CONTENT_ERROR_PREFIX)) throw error;
    // Basic check for quota/billing, Gemini errors might be more complex
    if (error.message && (error.message.toLowerCase().includes("quota") || error.message.toLowerCase().includes("billing"))) {
        throw createError(`Kredit untuk layanan AI pendukung (${operationName}) tidak mencukupi atau masalah penagihan. Silakan hubungi Admin.`, operationName, error);
    }
    throw createError(`Gagal menghubungi layanan AI pendukung untuk ${operationName}. Periksa koneksi internet Anda atau coba lagi nanti.`, operationName, error);
  }
};

export const analyzeImageForPrompt = async (base64Image: string, mimeType: string): Promise<{ indonesianPrompt: string, englishPrompt: string }> => {
  const operationName = "Analisa gambar";
  if (!ai.models.generateContent) throw createError("Layanan AI tidak terinisialisasi dengan benar.", operationName);

  const systemInstruction = "You are a world-class promptographer AI. Your task is to analyze the user's uploaded image and generate an exceptionally detailed and powerful prompt for an AI image generator to recreate a similar image. The prompt should capture the essence of the subject, setting, composition, lighting, colors, artistic style, and any specific important details. Combine all these elements into a single, flowing paragraph for each language requested. Provide this complete prompt in two languages, clearly separated by '---'. First, the Indonesian version under a 'Versi Indonesia:' header. Second, the English version under an 'English Version:' header. Do not add any other text, explanation, introduction, or break down the prompt into components in your final output; only the complete paragraph for each language.";

  const imagePart: Part = {
    inlineData: {
      mimeType: mimeType,
      data: base64Image,
    },
  };
  const textPart: Part = {
    text: "Analyze this image and generate detailed prompts in Indonesian and English as per the system instructions."
  };
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: systemInstruction,
      }
    });

    if (response.candidates?.[0]?.finishReason === 'SAFETY') {
      throw createError(`${SENSITIVE_CONTENT_ERROR_PREFIX}${operationName} gagal karena konten terdeteksi sensitif.`, operationName);
    }

    const fullText = response.text;
    if (!fullText) {
        throw createError(`Respon tidak valid dari layanan AI pendukung saat ${operationName}.`, operationName);
    }

    const parts = fullText.split('---');
    let finalIndonesianPrompt = `Tidak dapat menghasilkan prompt versi Indonesia dari layanan AI pendukung.`;
    let finalEnglishPrompt = `Could not generate English version prompt from supporting AI service.`;

    if (parts[0]) {
        const cleaned = parts[0].trim().replace(/^Versi Indonesia:\s*/i, '').trim();
        if (cleaned) finalIndonesianPrompt = cleaned;
    }
    if (parts[1]) {
        const cleaned = parts[1].trim().replace(/^English Version:\s*/i, '').trim();
        if (cleaned) finalEnglishPrompt = cleaned;
    }
    
    return { indonesianPrompt: finalIndonesianPrompt, englishPrompt: finalEnglishPrompt };

  } catch (error: any) {
    if (error.message.startsWith(SENSITIVE_CONTENT_ERROR_PREFIX)) throw error;
    if (error.message && (error.message.toLowerCase().includes("quota") || error.message.toLowerCase().includes("billing"))) {
        throw createError(`Kredit untuk layanan AI pendukung (${operationName}) tidak mencukupi atau masalah penagihan. Silakan hubungi Admin.`, operationName, error);
    }
    throw createError(`Gagal menghubungi layanan AI pendukung untuk ${operationName}. Periksa koneksi internet Anda atau coba lagi nanti.`, operationName, error);
  }
};

export const sendChatMessage = async (
  chatHistory: ChatMessage[],
  currentUserInput: string,
  uploadedImageFile?: UploadedFile | null
): Promise<string> => {
  const operationName = "Chatbot";
  if (!ai.models.generateContent) throw createError("Layanan AI tidak terinisialisasi dengan benar.", operationName);

  const geminiContents: Content[] = [];

  // Map chatHistory to Gemini's Content[] format
  chatHistory.forEach(msg => {
    const parts: Part[] = [];
    if (msg.role === 'user') {
      if (typeof msg.content === 'string') {
        parts.push({ text: msg.content });
      } else if (Array.isArray(msg.content)) {
        msg.content.forEach(part => {
          if (part.type === 'text') {
            parts.push({ text: part.text });
          } else if (part.type === 'image_url' && part.image_url.url.startsWith('data:')) {
            const [meta, base64Data] = part.image_url.url.split(',');
            const mimeTypeFromUrl = meta.substring(meta.indexOf(':') + 1, meta.indexOf(';'));
            parts.push({ inlineData: { mimeType: mimeTypeFromUrl, data: base64Data } });
          }
        });
      }
      if (parts.length > 0) {
        geminiContents.push({ role: 'user', parts });
      }
    } else if (msg.role === 'assistant') {
      // Exclude previous error messages from assistant
      const contentStr = msg.content as string;
      if (!contentStr.startsWith('Maaf, terjadi kesalahan:') && 
          !contentStr.startsWith(SENSITIVE_CONTENT_ERROR_PREFIX) &&
          !contentStr.includes("layanan AI pendukung") &&
          !contentStr.startsWith("Kredit untuk layanan AI pendukung")) {
        parts.push({ text: contentStr });
      }
      if (parts.length > 0) {
        geminiContents.push({ role: 'model', parts });
      }
    }
  });

  // Add current user message
  const currentUserParts: Part[] = [];
  if (uploadedImageFile) {
    currentUserParts.push({
      inlineData: {
        mimeType: uploadedImageFile.mimeType,
        data: uploadedImageFile.base64,
      },
    });
  }
  if (currentUserInput.trim()) {
    currentUserParts.push({ text: currentUserInput.trim() });
  }
  if (currentUserParts.length > 0) {
    geminiContents.push({ role: 'user', parts: currentUserParts });
  }
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: geminiContents,
      config: {
        systemInstruction: CHATBOT_SYSTEM_PROMPT,
      }
    });

    if (response.candidates?.[0]?.finishReason === 'SAFETY') {
      throw createError(`${SENSITIVE_CONTENT_ERROR_PREFIX}${operationName} gagal karena konten terdeteksi sensitif.`, operationName);
    }
    
    const text = response.text;
    if (text) {
      return text.trim();
    }
    throw createError(`Respon tidak valid dari layanan AI pendukung untuk ${operationName}.`, operationName);

  } catch (error: any) {
    if (error.message.startsWith(SENSITIVE_CONTENT_ERROR_PREFIX)) throw error;
    if (error.message && (error.message.toLowerCase().includes("quota") || error.message.toLowerCase().includes("billing"))) {
         throw createError(`Kredit untuk layanan AI pendukung (${operationName}) tidak mencukupi atau masalah penagihan. Silakan hubungi Admin.`, operationName, error);
    }
    throw createError(`Gagal menghubungi layanan AI pendukung untuk ${operationName}. Periksa koneksi internet Anda atau coba lagi nanti.`, operationName, error);
  }
};
