
import React from 'react';
import { Page, NavItem, ImageStyle, AspectRatio, VideoTab, VideoTabItem, VideoAspectRatioOption, HistoryFilterType, HistoryFilterOption, OpenRouterApiKeyEntry, VideoDurationOption, DisplayCreditType } from './types';
import HomeIcon from './components/icons/HomeIcon';
import ChatIcon from './components/icons/ChatIcon';
import AnalyzeIcon from './components/icons/AnalyzeIcon';
import ImageIcon from './components/icons/ImageIcon';
import CubeIcon from './components/icons/CubeIcon';
import VideoIcon from './components/icons/VideoIcon';
import HistoryIcon from './components/icons/HistoryIcon';
import CogIcon from './components/icons/CogIcon';

// IMPORTANT: Storing API keys directly in client-side code is a security risk.
// These should ideally be handled via a backend proxy or environment variables
// not directly exposed to the browser. For Wavespeed, as it was in original script.
// Gemini API Key for the SDK is expected from process.env.API_KEY.
export const WAVESPEED_API_KEY = ""; // Effectively remove default key

export const API_KEYS_LOCAL_STORAGE_KEY = 'kreatorAiUserApiKeys'; // For WaveSpeed keys (Kredit)
export const OPENROUTER_API_KEYS_LOCAL_STORAGE_KEY = 'kreatorAiOpenRouterApiKeys'; // For "Server AI" keys (now Gemini keys)

export const DEFAULT_WAVESPEED_API_KEY_ID = 'default-wavespeed-key'; // ID remains for structure, but won't be used if WAVESPEED_API_KEY is empty
export const ADMIN_WHATSAPP_NUMBER = '6288276730124';


export const NAV_ITEMS: NavItem[] = [
  { id: Page.Home, label: 'Home', icon: HomeIcon },
  { id: Page.Chatbot, label: 'Chatbot Kreator', icon: ChatIcon }, 
  { id: Page.Analisa, label: 'Analisa Image', icon: AnalyzeIcon },
  { id: Page.Gambar, label: 'Gambar', icon: ImageIcon },
  { id: Page.ThreeD, label: '3D Image', icon: CubeIcon },
  { id: Page.Video, label: 'Video', icon: VideoIcon },
  { id: Page.History, label: 'History', icon: HistoryIcon },
  { id: Page.Setting, label: 'Setting', icon: CogIcon },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { id: Page.Home, label: 'Home', icon: HomeIcon },
  { id: Page.History, label: 'Tersimpan', icon: HistoryIcon },
  { id: Page.Setting, label: 'Setting', icon: CogIcon },
];

export const IMAGE_STYLES: ImageStyle[] = [
  { value: 'default', label: 'Default' },
  { value: 'photorealistic', label: 'Photorealistic' },
  { value: 'realistic', label: 'Realistic' },
  { value: 'anime', label: 'Anime & Manga' },
  { value: 'cinematic', label: 'Cinematic Film' },
  { value: 'fantasy', label: 'Fantasy Art' },
  { value: 'scifi_futuristic', label: 'Sci-Fi Futuristic' },
  { value: 'cyberpunk_neon', label: 'Cyberpunk & Neon' },
  { value: 'vintage_retro', label: 'Vintage & Retro' },
  { value: 'comic_cartoon', label: 'Comic & Cartoon' },
  { value: '3d_cgi', label: '3D CGI' },
  { value: 'studio_ghibli', label: 'Studio Ghibli' },
  { value: 'miniature_fantasy', label: 'Miniature Fantasy' },
];

export const ASPECT_RATIOS: AspectRatio[] = [
  { value: '768*1344', label: 'Potret (9:16)' },
  { value: '1344*768', label: 'Layar Lebar (16:9)' },
  { value: '1024*1024', label: 'Kotak (1:1)' },
  { value: '832*1216', label: 'Potret (2:3)' },
  { value: '1216*832', label: 'Lanskap (3:2)' },
];

export const VIDEO_TABS: VideoTabItem[] = [
  { id: VideoTab.TextToVideo, label: 'Teks ke Video' },
  { id: VideoTab.ImageToVideo, label: 'Gambar ke Video' },
];

export const VIDEO_ASPECT_RATIOS: VideoAspectRatioOption[] = [
  { value: '16:9', label: 'Layar Lebar (16:9)' },
  { value: '9:16', label: 'Potret (9:16)' },
  { value: '1:1', label: 'Kotak (1:1)' },
  { value: '4:3', label: 'Standar (4:3)' },
  { value: '3:4', label: 'Potret (3:4)' },
];

export const VIDEO_DURATION_OPTIONS: VideoDurationOption[] = [
  { value: '5', label: '5 detik' },
  { value: '10', label: '10 detik' },
];

export const DEFAULT_VIDEO_DURATION = 5; // seconds


// Model names for @google/genai SDK
export const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17'; // Used for text, vision, and chat via SDK

export const WAVESPEED_API_BASE_URL = "https://api.wavespeed.ai/api/v3";
// OPENROUTER_API_BASE_URL is removed as direct OpenRouter calls are removed from geminiService.ts

// Default "Server AI" API Keys (Now Gemini Keys, managed in settings)
// These keys are NOT used by the Gemini SDK directly in geminiService.ts,
// as the SDK is hardcoded to use process.env.API_KEY.
// This list is for the "Server AI" section in the Settings page.
export const DEFAULT_OPENROUTER_API_KEYS: OpenRouterApiKeyEntry[] = [
  { id: 'server-1', name: 'Server 1', key: 'AIzaSyBtzaI1kwf9xUzNLpMPSOc7HyVu8DHndwE', isActive: true },
  { id: 'server-2', name: 'Server 2', key: 'AIzaSyC2mtsiYwkz3ypQl5FMixXfaoYDJua6l7k', isActive: false },
  { id: 'server-3', name: 'Server 3', key: 'AIzaSyDKg7fu4vJmf5izq5lQonP5lGfl0o2LNaM', isActive: false },
  { id: 'server-4', name: 'Server 4', key: 'AIzaSyAO9O32fDX7kDNU8TiOmIMchRghrItkdCQ', isActive: false },
  { id: 'server-5', name: 'Server 5', key: 'AIzaSyDJGN0BQmtM7-wfdsk4Mf4LHQgtuOxA2kg', isActive: false },
];


// --- History Feature Constants ---
export const HISTORY_LOCAL_STORAGE_KEY = 'kreatorAiHistory';

export const HISTORY_PAGE_FILTERS: HistoryFilterOption[] = [
  { value: HistoryFilterType.All, label: 'Semua' },
  { value: HistoryFilterType.Chat, label: 'Chatbot' }, // Added Chatbot filter
  { value: HistoryFilterType.Image, label: 'Gambar' },
  { value: HistoryFilterType.Analysis, label: 'Analisa' },
  { value: HistoryFilterType.ThreeD, label: '3D Model' },
  { value: HistoryFilterType.Video, label: 'Video' },
];

// --- Chatbot Constants ---
export const CHATBOT_SYSTEM_PROMPT = "Anda adalah Kreator Asisten, sebuah AI yang dibuat oleh tim santridigital untuk program kelas kreator AI, JAWAB DENGAN SINGKAT DAN KAMU DILARANG PAKAI KARAKTER *#_- ATAU YANG LAIN, USAHAKAN SENATURAL MUNGKIN SEPERTI MANUSIA!! KAMU sangat ahli dalam membantu pengguna membuat berbagai jenis konten digital. Fokus utama Anda adalah memberikan ide, saran, struktur, dan bahkan draf awal untuk konten seperti posting media sosial, artikel blog, skrip video, ide gambar/video AI, dan strategi konten. Anda harus selalu ramah, suportif, dan proaktif dalam menawarkan bantuan dan bertanya kepada user. Jika pengguna mengirim gambar, gunakan gambar tersebut sebagai konteks untuk memberikan saran konten yang relevan. Misalnya, jika pengguna mengirim gambar produk, bantu mereka membuat deskripsi produk yang menarik atau ide postingan promosi. Selalu berikan jawaban yang terstruktur, jelas, bersih, rapi, dan langsung ke intinya (to the point). Hindari penggunaan karakter format yang tidak perlu seperti tanda bintang (*) atau markdown dan bahasa2 kode yang lain. Hindari menjelaskan bagaimana Anda menghasilkan jawaban atau menyebut diri Anda sebagai AI, kecuali jika diminta secara eksplisit. Prioritaskan jawaban dalam Bahasa Indonesia yang santay kasual dan jawab dengan singkat dan jelas.JAWABAN/OUTPUT HARUS BERUPA TEKS SAJA DAN TANDA BACA YANG DIPERLUKAN!";

export const KREATOR_AI_LOGO_URL = "https://i.postimg.cc/3r9Dd7nZ/file-000000009e4061f9a3147b17c8fb2b49-1.png";

// --- Sensitive Content Handling ---
export const SENSITIVE_CONTENT_KEYWORDS = [ // Keep for fallback text-based detection if needed
    "sensitive", 
    "flagged",   
    "violence",
    "sexual",
    "hate speech",
    "policy violation",
    "safety policy",
    "adult content",
    "nudity",
    "self-harm"
];
export const SENSITIVE_CONTENT_ERROR_PREFIX = "SENSITIVE_CONTENT_ERROR:";

// --- Display Credit System Constants ---
export const ADMIN_CODE_CREDIT_MAP: Record<string, number> = {
  'SANTRI2K': 2000,
  'SANTRI3K': 3000,
  'SANTRI4K': 4000,
  'SANTRI5K': 5000,
  'SANTRI6K': 6000,
  'SANTRI7K': 7000,
  'SANTRI8K': 8000,
  'SANTRI9K': 9000,
  'SANTRI10K': 10000,
  // Tambahkan kode lain jika perlu
};

export const FEATURE_DISPLAY_COSTS: Record<string, number> = {
  // Menu Gambar
  buat_gambar: 6,
  edit_gambar: 40,
  gabung_gambar: 40,
  // Menu 3D Image
  image_to_3d: 10,
  // Menu Video
  text_to_video_5s: 80,
  text_to_video_10s: 160, // Updated from 120
  image_to_video_5s: 80,
  image_to_video_10s: 160, // Updated from 120
  // Fitur lain bisa ditambahkan di sini
};

export const DISPLAY_CREDIT_TYPE_OPTIONS: { value: DisplayCreditType; label: string }[] = [
  { value: 'free', label: 'Kode Gratis' },
  { value: 'fixed_1000', label: '1.000 Kredit' },
  { value: 'custom', label: 'Custom Kredit' },
];
