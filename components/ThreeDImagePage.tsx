/// <reference path="./model-viewer.d.ts" />
import React, { useState, ChangeEvent, useCallback } from 'react';
import { UploadedFile, HistoryItemType, ApiKeyEntry } from '../types';
import { processFileForUpload } from '../utils/fileUtils';
import { create3DModel } from '../services/wavespeedService';
import CssSpinner from './CssSpinner';
import { saveHistoryItem } from '../services/historyService';
import ContactAdminModal from './ContactAdminModal'; 
import { ADMIN_WHATSAPP_NUMBER, SENSITIVE_CONTENT_ERROR_PREFIX, FEATURE_DISPLAY_COSTS } from '../constants'; 
import SensitiveContentModal from './SensitiveContentModal';


interface ImageSlotProps {
  label: string;
  slotKey: 'front' | 'back' | 'left';
  uploadedFile: UploadedFile | null;
  onFileChange: (e: ChangeEvent<HTMLInputElement>, slotKey: 'front' | 'back' | 'left') => void;
}

const ImageUploadSlot: React.FC<ImageSlotProps> = ({ label, slotKey, uploadedFile, onFileChange }) => {
  const inputId = `image-file-${slotKey}`;
  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      <input 
        type="file" 
        id={inputId} 
        className="hidden" 
        accept="image/*" 
        onChange={(e) => onFileChange(e, slotKey)} 
      />
      <div
        className="w-full h-40 p-4 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:bg-gray-700/50 transition flex items-center justify-center"
        onClick={() => document.getElementById(inputId)?.click()}
        role="button"
        tabIndex={0}
        aria-label={`Upload ${label}`}
      >
        {uploadedFile ? (
          <img src={uploadedFile.previewUrl} className="max-h-full max-w-full object-contain rounded-lg" alt={`Pratinjau ${label}`} />
        ) : (
          <p className="text-gray-400">Klik untuk mengunggah {label}</p>
        )}
      </div>
    </div>
  );
};

interface ThreeDImagePageProps {
  onTriggerPromoModal: () => void;
  activeKreatorAiApiKey: ApiKeyEntry | null;
  onDisplayCreditDeduct: (featureKey: keyof typeof FEATURE_DISPLAY_COSTS) => void;
}

const ThreeDImagePage: React.FC<ThreeDImagePageProps> = ({ 
  onTriggerPromoModal, 
  activeKreatorAiApiKey,
  onDisplayCreditDeduct
}) => {
  const [imageFiles, setImageFiles] = useState<{
    front: UploadedFile | null;
    back: UploadedFile | null;
    left: UploadedFile | null;
  }>({ front: null, back: null, left: null });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('');
  const [resultUrl, setResultUrl] = useState<string | null>(null); 
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showContactAdminModal, setShowContactAdminModal] = useState<boolean>(false);
  const [showSensitiveContentModal, setShowSensitiveContentModal] = useState<boolean>(false);


  const handleFileChange = useCallback(async (
    e: ChangeEvent<HTMLInputElement>, 
    slotKey: 'front' | 'back' | 'left' 
  ) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const file = await processFileForUpload(e.target.files[0]);
        setImageFiles(prev => ({ ...prev, [slotKey]: file }));
        setErrorMessage(null); 
        setShowContactAdminModal(false);
        setShowSensitiveContentModal(false);
      } catch (err) {
        console.error("Error processing file:", err);
        setErrorMessage("Gagal memproses file gambar.");
      }
    }
  }, []);

  const autoSaveToHistory = (modelUrl: string) => {
    if (!modelUrl) {
      console.warn("Auto-save skipped: No valid 3D model URL.");
      return;
    }
    const uploadedCount = Object.values(imageFiles).filter(f => f !== null).length;
    const originalImageUrls = (Object.values(imageFiles) as (UploadedFile | null)[])
      .filter((file): file is UploadedFile => file !== null)
      .map(file => `data:${file.mimeType};base64,${file.base64}`);

    saveHistoryItem({
        type: HistoryItemType.ThreeD,
        prompt: `Model 3D dibuat dari ${uploadedCount} gambar tampilan.`,
        resultUrl: modelUrl,
        notes: "3D Model (Multi-view)",
        originalImageUrls: originalImageUrls.length > 0 ? originalImageUrls : undefined,
        thumbnailUrl: imageFiles.front?.previewUrl || imageFiles.left?.previewUrl || 'https://placehold.co/100x100/7c3aed/ffffff?text=3D',
    });
    alert("Model 3D berhasil disimpan ke riwayat!");
  };

  const handleGenerate3D = async () => {
    if (!Object.values(imageFiles).some(file => file !== null)) {
      alert("Silakan unggah setidaknya satu gambar (depan, belakang, atau kiri).");
      return;
    }

    setIsLoading(true);
    setResultUrl(null);
    setErrorMessage(null);
    setStatusText("Mempersiapkan pembuatan model 3D...");
    setShowContactAdminModal(false);
    setShowSensitiveContentModal(false);

    try {
      const uploadedImagesForApi: Partial<Record<'front' | 'back' | 'left', UploadedFile>> = {};
      (Object.keys(imageFiles) as Array<keyof typeof imageFiles>).forEach(key => {
        if (imageFiles[key]) {
          uploadedImagesForApi[key] = imageFiles[key]!;
        }
      });
      
      const modelUrl = await create3DModel(uploadedImagesForApi, setStatusText);
      setResultUrl(modelUrl); 
      setStatusText("Model 3D berhasil dibuat!");
      autoSaveToHistory(modelUrl);
      onDisplayCreditDeduct('image_to_3d');
    } catch (error: any) {
      console.error("3D Model generation error:", error);
      const specificError = error.message || "Terjadi kesalahan saat membuat model 3D.";
      setErrorMessage(specificError);
      setStatusText(specificError); 
      if (specificError.startsWith(SENSITIVE_CONTENT_ERROR_PREFIX)) {
        setShowSensitiveContentModal(true);
      } else if (specificError.toLowerCase().includes("kredit") || specificError.toLowerCase().includes("api") || specificError.toLowerCase().includes("kreatorai")) {
        setShowContactAdminModal(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseContactAdminModal = () => {
    setShowContactAdminModal(false);
    onTriggerPromoModal();
  };

  const getButtonTextWithCost = () => {
    if (!activeKreatorAiApiKey || activeKreatorAiApiKey.displayCreditType === 'free') {
      return "Buat Model 3D";
    }
    const cost = FEATURE_DISPLAY_COSTS['image_to_3d'];
    return `Buat Model 3D (${cost} Kredit)`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center text-white mb-2">Image to 3D Generator</h2>
      <p className="text-gray-400 text-sm text-center mb-4">
        Unggah gambar untuk tampilan depan, belakang, dan kiri untuk membuat model 3D.
      </p>
      <p className="text-yellow-300 text-xs text-center mb-6 bg-yellow-900/50 p-3 rounded-md border border-yellow-700 shadow-md">
        💡 <span className="font-semibold">Tips:</span> Untuk hasil terbaik, coba gunakan gambar dengan latar belakang yang sudah dihapus atau transparan. Ini akan membantu AI fokus pada objek utama.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <ImageUploadSlot label="Gambar Depan (Front)" slotKey="front" uploadedFile={imageFiles.front} onFileChange={handleFileChange} />
        <ImageUploadSlot label="Gambar Belakang (Back)" slotKey="back" uploadedFile={imageFiles.back} onFileChange={handleFileChange} />
        <ImageUploadSlot label="Gambar Kiri (Left)" slotKey="left" uploadedFile={imageFiles.left} onFileChange={handleFileChange} />
      </div>

      <button
        onClick={handleGenerate3D}
        disabled={isLoading || !Object.values(imageFiles).some(f => f !== null)}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg text-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50 disabled:bg-gray-500 disabled:cursor-not-allowed"
      >
        {getButtonTextWithCost()}
      </button>

      {(isLoading || resultUrl || errorMessage) && (
        <div className="mt-10 text-center">
          <h3 className="text-xl font-semibold text-white mb-4">Status Pembuatan</h3>
          {isLoading && (
            <div className="flex flex-col items-center justify-center min-h-[150px] bg-gray-700/50 rounded-xl p-4">
              <CssSpinner />
              <p className="text-gray-300 mt-4">{statusText || "Memproses..."}</p>
            </div>
          )}
          {!isLoading && resultUrl && !errorMessage && ( 
            <div className="p-4 bg-gray-800 rounded-xl shadow-lg">
              <p className="text-green-400 mb-3 text-lg font-semibold">Model 3D berhasil dibuat!</p>
              
              <div className="mb-4">
                <model-viewer
                  src={resultUrl}
                  alt="3D Model Preview"
                  camera-controls
                  auto-rotate
                  ar
                  ios-src={resultUrl} 
                  className="w-full h-96 rounded-lg border border-gray-700 shadow-inner"
                  poster={imageFiles.front?.previewUrl || imageFiles.left?.previewUrl || 'https://placehold.co/600x400?text=Loading+3D+Model'}
                ></model-viewer>
              </div>
              
              <p className="text-gray-300 mb-1 text-sm">URL Model (GLB):</p>
              <a 
                href={resultUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-indigo-400 hover:text-indigo-300 break-all underline text-sm"
              >
                {resultUrl}
              </a>
              <p className="text-gray-400 mt-3 text-xs">Anda bisa mengunduh model melalui link di atas atau berinteraksi dengan pratinjau.</p>
              {statusText && <p className="text-gray-300 mt-2 text-sm">{statusText}</p>}
            </div>
          )}
          {!isLoading && errorMessage && !showSensitiveContentModal && (
            <div className="p-4 bg-red-800/50 border border-red-700 rounded-lg text-red-300">
              <p>{errorMessage}</p>
              {statusText !== errorMessage && <p className="text-gray-400 mt-1 text-sm">{statusText}</p>}
            </div>
          )}
        </div>
      )}
      <ContactAdminModal
        isOpen={showContactAdminModal}
        onClose={handleCloseContactAdminModal}
        adminPhoneNumber={ADMIN_WHATSAPP_NUMBER}
      />
      <SensitiveContentModal
        isOpen={showSensitiveContentModal}
        onClose={() => setShowSensitiveContentModal(false)}
      />
    </div>
  );
};

export default ThreeDImagePage;