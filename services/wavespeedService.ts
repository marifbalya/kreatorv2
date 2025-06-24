import { WAVESPEED_API_BASE_URL, SENSITIVE_CONTENT_KEYWORDS, SENSITIVE_CONTENT_ERROR_PREFIX } from '../constants';
import { UploadedFile } from '../types';
import { getActiveApiKey } from './apiKeyService'; // Import new service

interface WavespeedInitialResponse {
  data: {
    id: string;
    // other fields if relevant
  };
  // other top-level fields
}

interface WavespeedPollingResponse {
  data: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    outputs?: string[];
    error?: string;
    // other fields if relevant
  };
   // other top-level fields
}

const isSensitiveContentError = (errorMessage: string): boolean => {
  if (!errorMessage) return false;
  const lowerErrorMessage = errorMessage.toLowerCase();
  return SENSITIVE_CONTENT_KEYWORDS.some(keyword => lowerErrorMessage.includes(keyword));
};

const generateImageAndPoll = async ( 
  endpoint: string, 
  payload: object,
  onStatusUpdate: (status: string) => void
): Promise<string> => {
  const activeApiKeyEntry = getActiveApiKey();

  if (!activeApiKeyEntry || !activeApiKeyEntry.key || activeApiKeyEntry.key.trim() === "") {
    const errorMsg = "Kredit KreatorAI tidak aktif atau tidak valid. Silakan atur di halaman Pengaturan.";
    console.error(errorMsg);
    onStatusUpdate(errorMsg); 
    throw new Error(errorMsg);
  }
  const currentApiKey = activeApiKeyEntry.key;
  
  const headers = { 
    "Content-Type": "application/json", 
    "Authorization": `Bearer ${currentApiKey}` 
  };

  onStatusUpdate("Mengirim tugas ke KreatorAI...");
  let initialResponse;
  try {
    initialResponse = await fetch(`${WAVESPEED_API_BASE_URL}/${endpoint}`, { 
      method: 'POST', 
      headers, 
      body: JSON.stringify(payload) 
    });
  } catch (networkError: any) {
    console.error(`Kesalahan jaringan saat request awal untuk ${endpoint}:`, networkError);
    const userMessage = `Kesalahan jaringan saat menghubungi KreatorAI. Pastikan koneksi Anda stabil.`;
    onStatusUpdate(userMessage);
    throw new Error(userMessage);
  }


  if (!initialResponse.ok) {
    const errorText = await initialResponse.text().catch(() => "Gagal membaca detail error.");
    console.error(`Error KreatorAI (Initial) untuk ${endpoint}:`, initialResponse.status, errorText);
    if (isSensitiveContentError(errorText)) {
      const sensitiveUserMessage = "Konten terdeteksi sensitif oleh KreatorAI.";
      onStatusUpdate(sensitiveUserMessage);
      throw new Error(`${SENSITIVE_CONTENT_ERROR_PREFIX}${sensitiveUserMessage}`);
    }
    const userMessage = `Terjadi kesalahan awal dengan KreatorAI (Status: ${initialResponse.status}). Silakan coba lagi.`;
    onStatusUpdate(userMessage);
    throw new Error(userMessage);
  }

  const initialResult: WavespeedInitialResponse = await initialResponse.json();
  const requestId = initialResult.data.id;
  onStatusUpdate(`Tugas dikirim ke KreatorAI (ID: ${requestId.substring(0,8)}...). Menunggu hasil...`);

  let pollingAttempts = 0;
  const maxPollingAttempts = 120; 

  while (pollingAttempts < maxPollingAttempts) {
    await new Promise(resolve => setTimeout(resolve, 3000)); 
    pollingAttempts++;
    
    let resultResponse;
    try {
      resultResponse = await fetch(`${WAVESPEED_API_BASE_URL}/predictions/${requestId}/result`, { headers });
    } catch (networkError: any) {
        console.error("Kesalahan jaringan saat polling:", networkError);
        const userMessage = `Kesalahan jaringan saat memeriksa hasil dari KreatorAI. Pastikan koneksi Anda stabil.`;
        onStatusUpdate(userMessage);
        throw new Error(userMessage);
    }

    if (!resultResponse.ok) {
      const errorText = await resultResponse.text().catch(() => "Gagal membaca detail error polling.");
      console.error("Error KreatorAI (Polling):", resultResponse.status, errorText);
       if (isSensitiveContentError(errorText)) {
        const sensitiveUserMessage = "Konten terdeteksi sensitif oleh KreatorAI saat polling.";
        onStatusUpdate(sensitiveUserMessage);
        throw new Error(`${SENSITIVE_CONTENT_ERROR_PREFIX}${sensitiveUserMessage}`);
      }
      const userMessage = `Terjadi kesalahan saat memeriksa hasil dari KreatorAI (Status: ${resultResponse.status}). Silakan coba lagi.`;
      onStatusUpdate(userMessage);
      throw new Error(userMessage);
    }
    
    const resultJson: WavespeedPollingResponse = await resultResponse.json();
    const { status, outputs, error } = resultJson.data;
    onStatusUpdate(`Memproses di KreatorAI... (Status: ${status}, Percobaan: ${pollingAttempts}/${maxPollingAttempts})`);

    if (status === "completed") {
      if (!outputs || outputs.length === 0) {
        throw new Error("Proses di KreatorAI selesai tetapi tidak menghasilkan output yang diharapkan. Silakan coba lagi.");
      }
      return outputs[0];
    } else if (status === "failed") {
      const errorMessage = error || 'Unknown error';
      if (isSensitiveContentError(errorMessage)) {
        throw new Error(`${SENSITIVE_CONTENT_ERROR_PREFIX}Proses di KreatorAI gagal karena konten terdeteksi sensitif.`);
      }
      console.error(`Proses di KreatorAI gagal. Detail internal: ${errorMessage}`);
      throw new Error(`Proses di KreatorAI gagal. Silakan coba lagi.`);
    }
  }
  throw new Error("Proses di KreatorAI memakan waktu terlalu lama. Silakan coba lagi.");
};


const applyStyleToPrompt = (prompt: string, selectedStyle: string): string => {
    if (selectedStyle === 'default' || !prompt) return prompt;
    
    const styleKeywords: { [key: string]: string } = {
        photorealistic: ', Natural Human Portrait',
        realistic: ', Hyperrealistic',
        anime: ', gaya anime, manga, warna cerah, ilustrasi detail',
        cinematic: ', pencahayaan sinematik, dramatis, seperti adegan film, butiran film halus',
        fantasy: ', seni fantasi, epik, magis, makhluk mitos, dunia khayalan, detail rumit',
        scifi_futuristic: ', sci-fi, futuristik, teknologi canggih, pesawat luar angkasa, kota masa depan, robotik',
        cyberpunk_neon: ', cyberpunk, lampu neon terang, malam perkotaan dystopian, teknologi tinggi kehidupan rendah, suasana gelap',
        vintage_retro: ', gaya vintage, retro, tampilan klasik tahun 60an 70an, warna sepia atau pudar, nostalgia',
        comic_cartoon: ', gaya komik, kartun, garis tebal yang jelas, warna solid cerah, cell shading, ekspresif',
        '3d_cgi': ', Cinematic 3D Fantasy Realism/Final Fantasy Style',
        studio_ghibli: ', gaya Studio Ghibli, anime, pemandangan alam yang indah, cat air, atmosfer whimsical dan menawan',
        miniature_fantasy: ', miniatur, diorama, efek tilt-shift, dunia fantasi skala kecil, detail halus seperti mainan',
    };
    return prompt + (styleKeywords[selectedStyle] || '');
};

export const createImage = (
  basePrompt: string, 
  style: string, 
  aspectRatio: string, 
  onStatusUpdate: (status: string) => void
): Promise<string> => {
  const finalPrompt = applyStyleToPrompt(basePrompt, style);
  const payload = { 
    prompt: finalPrompt, 
    size: aspectRatio, 
    loras: [{ "path": "linoyts/yarn_art_Flux_LoRA", "scale": 1 }], 
    strength: 0.8, 
    num_inference_steps: 28, 
    seed: -1, 
    guidance_scale: 3.5, 
    num_images: 1, 
    enable_base64_output: false, 
    enable_safety_checker: true 
  };
  return generateImageAndPoll("wavespeed-ai/flux-dev-lora-ultra-fast", payload, onStatusUpdate);
};

export const editImage = (
  base64ImageData: string,
  prompt: string, 
  onStatusUpdate: (status: string) => void
): Promise<string> => {
  const payload = { 
    image: `data:image/png;base64,${base64ImageData}`, 
    prompt, 
    guidance_scale: 3.5, 
    safety_tolerance: "2" 
  };
  return generateImageAndPoll("wavespeed-ai/flux-kontext-pro", payload, onStatusUpdate);
};

export const mergeImages = (
  base64ImageDatas: string[],
  prompt: string, 
  onStatusUpdate: (status: string) => void
): Promise<string> => {
  const imagesAsDataUrls = base64ImageDatas.map(data => `data:image/png;base64,${data}`); 
  const payload = { 
    images: imagesAsDataUrls, 
    prompt, 
    guidance_scale: 3.5, 
    safety_tolerance: "2" 
  };
  return generateImageAndPoll("wavespeed-ai/flux-kontext-pro/multi", payload, onStatusUpdate);
};

export const create3DModel = (
  images: Partial<Record<'front' | 'back' | 'left', UploadedFile>>, // 'right' removed from type
  onStatusUpdate: (status: string) => void
): Promise<string> => {
  const payload: { [key: string]: any } = {
    guidance_scale: 7.5,
    num_inference_steps: 50,
    octree_resolution: 256,
    textured_mesh: true, // Changed to true for potentially better GLB output
  };
  if (images.front) payload.front_image_url = `data:${images.front.mimeType};base64,${images.front.base64}`;
  if (images.back) payload.back_image_url = `data:${images.back.mimeType};base64,${images.back.base64}`;
  if (images.left) payload.left_image_url = `data:${images.left.mimeType};base64,${images.left.base64}`;
  // Removed: if (images.right) payload.right_image_url = ...;
  
  if (!Object.values(payload).some(value => typeof value === 'string' && value.startsWith('data:'))) {
    const errorMsg = "At least one image view (front, back, or left) must be provided for 3D model generation.";
    onStatusUpdate(errorMsg);
    return Promise.reject(new Error(errorMsg));
  }
  return generateImageAndPoll("wavespeed-ai/hunyuan3d-v2-multi-view", payload, onStatusUpdate);
};

export const createTextToVideo = (
  prompt: string,
  aspectRatio: string,
  duration: number,
  onStatusUpdate: (status: string) => void
): Promise<string> => {
  const payload = {
    prompt,
    aspect_ratio: aspectRatio,
    duration,
    seed: -1, 
  };
  return generateImageAndPoll("bytedance/seedance-v1-lite-t2v-480p", payload, onStatusUpdate);
};

export const createImageToVideo = (
  imageFile: UploadedFile,
  prompt: string,
  duration: number,
  onStatusUpdate: (status: string) => void
): Promise<string> => {
  const payload = {
    image: `data:${imageFile.mimeType};base64,${imageFile.base64}`,
    prompt,
    duration,
    seed: -1, 
  };
  return generateImageAndPoll("bytedance/seedance-v1-lite-i2v-480p", payload, onStatusUpdate);
};