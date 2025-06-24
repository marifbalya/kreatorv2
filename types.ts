
import type React from 'react';

export enum Page {
  Home = 'page-home',
  Chatbot = 'page-chatbot', // Added Chatbot page
  Gambar = 'page-gambar',
  ThreeD = 'page-3d',
  Video = 'page-video',
  Analisa = 'page-analisa',
  History = 'page-history',
  Setting = 'page-setting',
}

export enum ImageTab {
  BuatGambar = 'buat-gambar',
  EditGambar = 'edit-gambar',
  GabungGambar = 'gabung-gambar',
}

export enum VideoTab {
  TextToVideo = 'text-to-video',
  ImageToVideo = 'image-to-video',
}

export interface NavItem {
  id: Page;
  label: string;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>; // Added icon property
}

export interface TabItem {
  id: ImageTab; // Used for ImageCreatorPage tabs
  label: string;
}

export interface VideoTabItem { // Specific for VideoPage tabs
  id: VideoTab;
  label: string;
}

export interface ImageStyle {
  value: string;
  label: string;
}

export interface AspectRatio {
  value: string;
  label: string;
}

export interface VideoAspectRatioOption {
  value: string;
  label: string;
}

export interface VideoDurationOption {
  value: string; // e.g., "5", "10"
  label: string; // e.g., "5 detik", "10 detik"
}

export interface UploadedFile {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

// --- Gabung Gambar Categorized Types ---
export interface GabungCategorizedData {
  mergeImages: UploadedFile[]; // Simplified to a single array for merge images
}
// --- End Gabung Gambar Categorized Types ---


export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  // other types of chunks can be added here if needed
}

// --- History Feature Types ---
export enum HistoryItemType {
  Image = 'image',
  ThreeD = '3d',
  Video = 'video',
  Analysis = 'analysis', // Added for image analysis results
  Chat = 'chat', // Added for chatbot history
}

export interface HistoryItem {
  id: string; // Unique ID, e.g., timestamp or UUID
  type: HistoryItemType;
  prompt: string; // Can be input prompt or a description (e.g., "Analisa Gambar: filename.jpg")
  resultUrl: string; // URL to the generated image, 3D model, video, or preview of analyzed image
  timestamp: number; // Unix timestamp of when it was saved
  originalImageUrls?: string[]; // Optional: For 3D, Image-to-Video, or analysis storing input image data URLs
  notes?: string; // Optional: e.g., "Edit dari gambar X", "Gabungan gambar", "Hasil Analisa: <details>", "Chat session details"
  thumbnailUrl?: string; // Optional: For videos, could be a frame; for 3D, a placeholder, for analysis, the input image
  chatMessages?: ChatMessage[]; // Optional: For chatbot history items
}

export enum HistoryFilterType {
  All = 'all',
  Image = HistoryItemType.Image,
  ThreeD = HistoryItemType.ThreeD,
  Video = HistoryItemType.Video,
  Analysis = HistoryItemType.Analysis,
  Chat = HistoryItemType.Chat, // Added for chatbot history filter
}

export interface HistoryFilterOption {
  value: HistoryFilterType;
  label: string;
}

// --- Setting Page Types ---
// For WaveSpeed API Keys (Kredit)
export type DisplayCreditType = 'free' | 'fixed_1000' | 'custom';

export interface ApiKeyEntry {
  id: string; 
  name: string; 
  key: string; 
  isActive: boolean;
  isUserManaged: boolean; 
  displayCreditType: DisplayCreditType;
  adminCode?: string; // Only if displayCreditType is 'custom'
  initialDisplayCredit: number; // e.g., 0 for free, 1000 for fixed, or value from ADMIN_CODE_CREDIT_MAP
  currentDisplayCredit: number; // Current displayed credit, can be reduced by feature usage
}

// For OpenRouter API Keys (Server AI)
export interface OpenRouterApiKeyEntry {
  id: string; // e.g., 'server-1'
  name: string; // e.g., 'Server 1'
  key: string; // The OpenRouter API key
  isActive: boolean;
}

// --- Chatbot Types ---
export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessageContentPartText {
  type: 'text';
  text: string;
}
export interface ChatMessageContentPartImage {
  type: 'image_url';
  image_url: {
    url: string; // data:mime/type;base64,BASE64_STRING
  };
}
export type ChatMessageContentPart = ChatMessageContentPartText | ChatMessageContentPartImage;


export interface ChatMessage {
  id: string; // Unique ID for each message
  role: ChatRole;
  content: string | ChatMessageContentPart[]; // String for assistant, array for user (if image included)
  timestamp: number;
  imagePreviewUrl?: string; // For UI display of user-uploaded images in chat
  isLoading?: boolean; // For assistant messages while waiting for response
}