import React, { useState, useCallback, ChangeEvent } from 'react';
import { VideoTab, UploadedFile, HistoryItemType, VideoDurationOption, ApiKeyEntry } from '../types';
import { VIDEO_TABS, VIDEO_ASPECT_RATIOS, DEFAULT_VIDEO_DURATION, ADMIN_WHATSAPP_NUMBER, VIDEO_DURATION_OPTIONS, SENSITIVE_CONTENT_ERROR_PREFIX, FEATURE_DISPLAY_COSTS } from '../constants';
import CustomSelect from './CustomSelect';
import CssSpinner from './CssSpinner';
import { processFileForUpload } from '../utils/fileUtils';
import { createTextToVideo, createImageToVideo } from '../services/wavespeedService';
import OptimizePromptButton from './OptimizePromptButton';
import { optimizePrompt } from '../services/geminiService';
import { saveHistoryItem } from '../services/historyService'; 
import ContactAdminModal from './ContactAdminModal'; 
import SensitiveContentModal from './SensitiveContentModal';

interface VideoPageProps {
  onTriggerPromoModal: () => void;
  activeKreatorAiApiKey: ApiKeyEntry | null;
  onDisplayCreditDeduct: (featureKey: keyof typeof FEATURE_DISPLAY_COSTS | string) => void;
}

const VideoPage: React.FC<VideoPageProps> = ({ 
  onTriggerPromoModal,
  activeKreatorAiApiKey,
  onDisplayCreditDeduct
}) => {
  const [activeTab, setActiveTab] = useState<VideoTab>(VideoTab.TextToVideo);
  
  const [t2vPrompt, setT2vPrompt] = useState<string>('');
  const [t2vAspectRatio, setT2vAspectRatio] = useState<string>(VIDEO_ASPECT_RATIOS[0].value);
  const [t2vDuration, setT2vDuration] = useState<number>(DEFAULT_VIDEO_DURATION);
  const [isOptimizingT2vPrompt, setIsOptimizingT2vPrompt] = useState<boolean>(false);

  const [i2vPrompt, setI2vPrompt] = useState<string>('');
  const [i2vImageFile, setI2vImageFile] = useState<UploadedFile | null>(null);
  const [i2vDuration, setI2vDuration] = useState<number>(DEFAULT_VIDEO_DURATION);
  const [isOptimizingI2vPrompt, setIsOptimizingI2vPrompt] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('');
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showContactAdminModal, setShowContactAdminModal] = useState<boolean>(false);
  const [showSensitiveContentModal, setShowSensitiveContentModal] = useState<boolean>(false);


  const handleOptimizeVideoPrompt = useCallback(async (
    currentPrompt: string,
    setPrompt: React.Dispatch<React.SetStateAction<string>>,
    setIsOptimizing: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (!currentPrompt.trim()) {
      alert("Silakan masukkan prompt terlebih dahulu.");
      return;
    }
    setIsOptimizing(true);
    setErrorMessage(null); 
    setShowContactAdminModal(false);
    setShowSensitiveContentModal(false);
    try {
      const optimized = await optimizePrompt(currentPrompt);
      setPrompt(optimized);
    } catch (error: any) {
      const specificError = error.message || "Gagal mengoptimasi prompt.";
      setErrorMessage(specificError);
      setStatusText(specificError);
      if (specificError.startsWith(SENSITIVE_CONTENT_ERROR_PREFIX)) {
        setShowSensitiveContentModal(true);
      } else if (specificError.toLowerCase().includes("server ai")) {
         alert(specificError + "\nMohon periksa pengaturan Server AI Anda.");
      } else {
        alert(specificError);
      }
    } finally {
      setIsOptimizing(false);
    }
  }, []);
  
  const handleI2vFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const file = await processFileForUpload(e.target.files[0]);
        setI2vImageFile(file);
        setErrorMessage(null); 
        setShowContactAdminModal(false);
        setShowSensitiveContentModal(false);
      } catch (err) {
        console.error("Error processing file for I2V:", err);
        setErrorMessage("Gagal memproses file gambar.");
        setI2vImageFile(null);
      }
    }
  };
  
  const resetResultStateAndModal = () => {
    setResultVideoUrl(null);
    setErrorMessage(null);
    setStatusText('');
    setShowContactAdminModal(false); 
    setShowSensitiveContentModal(false);
  };

  const autoSaveToHistory = (generatedVideoUrl: string) => {
    if (!generatedVideoUrl) {
        console.warn("Auto-save skipped: No valid video URL.");
        return;
    }
    let promptToSave = '';
    let notesToSave = '';
    let originalUrlsToSave: string[] = [];
    let videoThumbnail = generatedVideoUrl; 

    if (activeTab === VideoTab.TextToVideo) {
        promptToSave = t2vPrompt;
        notesToSave = `Teks ke Video - Durasi: ${t2vDuration}s, Rasio: ${t2vAspectRatio}`;
    } else { // ImageToVideo
        promptToSave = i2vPrompt;
        notesToSave = `Gambar ke Video - Durasi: ${i2vDuration}s`;
        if (i2vImageFile) {
          originalUrlsToSave.push(`data:${i2vImageFile.mimeType};base64,${i2vImageFile.base64}`);
          videoThumbnail = i2vImageFile.previewUrl; 
        }
    }

    saveHistoryItem({
        type: HistoryItemType.Video,
        prompt: promptToSave,
        resultUrl: generatedVideoUrl,
        notes: notesToSave,
        originalImageUrls: originalUrlsToSave.length > 0 ? originalUrlsToSave : undefined,
        thumbnailUrl: videoThumbnail,
    });
    alert("Video berhasil disimpan ke riwayat!");
  };

  const handleGenerateVideo = async () => {
    setIsLoading(true); 
    setResultVideoUrl(null);
    setErrorMessage(null);
    setStatusText('');
    setShowContactAdminModal(false);
    setShowSensitiveContentModal(false);
    
    let featureKey: string;
    let currentDuration: number;

    try {
      let videoUrl: string;
      if (activeTab === VideoTab.TextToVideo) {
        if (!t2vPrompt.trim()) {
          alert("Silakan masukkan prompt.");
          setIsLoading(false);
          return;
        }
        setStatusText("Membuat video dari teks...");
        currentDuration = t2vDuration;
        featureKey = `text_to_video_${currentDuration}s`;
        videoUrl = await createTextToVideo(t2vPrompt, t2vAspectRatio, t2vDuration, setStatusText);
      } else { 
        if (!i2vPrompt.trim() || !i2vImageFile) {
          alert("Silakan unggah gambar dan masukkan prompt.");
          setIsLoading(false);
          return;
        }
        setStatusText("Membuat video dari gambar...");
        currentDuration = i2vDuration;
        featureKey = `image_to_video_${currentDuration}s`;
        videoUrl = await createImageToVideo(i2vImageFile, i2vPrompt, i2vDuration, setStatusText);
      }
      setResultVideoUrl(videoUrl);
      setStatusText("Video berhasil dibuat!");
      autoSaveToHistory(videoUrl); 
      onDisplayCreditDeduct(featureKey);
    } catch (error: any) {
      console.error("Video generation error:", error);
      const specificError = error.message || "Terjadi kesalahan saat membuat video.";
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
  
  const handleDownloadVideo = async () => {
    if (!resultVideoUrl) return;
    try {
      setStatusText("Mengunduh video...");
      const response = await fetch(resultVideoUrl);
      if (!response.ok) throw new Error(`Gagal mengunduh: ${response.status} ${response.statusText}`);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      const extension = resultVideoUrl.split('.').pop()?.split('?')[0] || 'mp4';
      a.download = `kreator-ai-video-${Date.now()}.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      a.remove();
      setStatusText("Video berhasil diunduh.");
    } catch (error: any) {
      console.error("Download failed:", error);
      setErrorMessage(error.message || "Gagal mengunduh video.");
      setStatusText(error.message || "Gagal mengunduh video.");
    }
  };

  const handleCloseContactAdminModal = () => {
    setShowContactAdminModal(false);
    onTriggerPromoModal();
  };

  const getButtonTextWithCost = () => {
    const baseText = "Generate Video";
    if (!activeKreatorAiApiKey || activeKreatorAiApiKey.displayCreditType === 'free') {
      return baseText;
    }
    
    const duration = activeTab === VideoTab.TextToVideo ? t2vDuration : i2vDuration;
    const baseFeatureKey = activeTab === VideoTab.TextToVideo ? 'text_to_video' : 'image_to_video';
    const featureKeyWithDuration = `${baseFeatureKey}_${duration}s`;
    
    const cost = FEATURE_DISPLAY_COSTS[featureKeyWithDuration as keyof typeof FEATURE_DISPLAY_COSTS];
    
    if (cost === undefined) {
      console.warn(`Cost not found for feature: ${featureKeyWithDuration}`);
      return baseText; // Fallback if cost isn't defined for some reason
    }
    return `${baseText} (${cost} Kredit)`;
  };


  const renderTabContent = () => {
    if (activeTab === VideoTab.TextToVideo) {
      return (
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">Jelaskan video yang Anda inginkan.</p>
          <div className="relative">
            <textarea
              value={t2vPrompt}
              onChange={(e) => setT2vPrompt(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 pr-12 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              rows={4}
              placeholder="e.g., Astronot berjalan di Mars, gaya sinematik..."
            />
            <OptimizePromptButton 
              onClick={() => handleOptimizeVideoPrompt(t2vPrompt, setT2vPrompt, setIsOptimizingT2vPrompt)} 
              isLoading={isOptimizingT2vPrompt} 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CustomSelect
              label="Rasio Aspek Video"
              id="video-aspect-ratio"
              options={VIDEO_ASPECT_RATIOS}
              value={t2vAspectRatio}
              onChange={(e) => setT2vAspectRatio(e.target.value)}
            />
            <CustomSelect
              label="Durasi Video"
              id="video-duration-t2v"
              options={VIDEO_DURATION_OPTIONS}
              value={String(t2vDuration)}
              onChange={(e) => setT2vDuration(parseInt(e.target.value, 10))}
            />
          </div>
        </div>
      );
    } 
    return (
      <div className="space-y-4">
        <p className="text-gray-400 text-sm">Unggah gambar dan jelaskan video yang Anda inginkan.</p>
        <input type="file" id="image-file-i2v" className="hidden" accept="image/*" onChange={handleI2vFileChange} />
        <div 
          className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:bg-gray-700/50 transition min-h-[150px] flex items-center justify-center"
          onClick={() => document.getElementById('image-file-i2v')?.click()}
          role="button"
          tabIndex={0}
          aria-label="Unggah Gambar untuk Video"
        >
          {i2vImageFile ? (
            <img src={i2vImageFile.previewUrl} className="mx-auto max-h-48 rounded-lg" alt="Pratinjau Gambar untuk Video" />
          ) : (
            <p className="text-gray-400">Klik untuk mengunggah gambar</p>
          )}
        </div>
        <div className="relative">
          <textarea
            value={i2vPrompt}
            onChange={(e) => setI2vPrompt(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 pr-12 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            rows={3}
            placeholder="e.g., Animasikan gambar ini, buat terlihat seperti sedang hujan..."
          />
          <OptimizePromptButton 
            onClick={() => handleOptimizeVideoPrompt(i2vPrompt, setI2vPrompt, setIsOptimizingI2vPrompt)} 
            isLoading={isOptimizingI2vPrompt}
          />
        </div>
        <CustomSelect
          label="Durasi Video"
          id="video-duration-i2v"
          options={VIDEO_DURATION_OPTIONS}
          value={String(i2vDuration)}
          onChange={(e) => setI2vDuration(parseInt(e.target.value, 10))}
        />
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-center text-white mb-6">Video AI Generator</h2>
      <div className="mb-6 border-b border-gray-700">
        <nav className="flex flex-wrap gap-y-2 -mb-px" aria-label="Video Tabs">
          {VIDEO_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                resetResultStateAndModal(); 
                setIsLoading(false); 
              }}
              className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm rounded-t-lg transition-colors duration-200
                ${activeTab === tab.id ? 'border-indigo-500 text-white bg-indigo-600' : 'border-gray-600 text-gray-400 bg-gray-800 hover:text-gray-200 hover:border-gray-500'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {renderTabContent()}

      <div className="mt-8">
        <button
          onClick={handleGenerateVideo}
          disabled={isLoading || (activeTab === VideoTab.ImageToVideo && !i2vImageFile)}
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg text-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-500 focus:ring-opacity-50 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {getButtonTextWithCost()}
        </button>
      </div>

      {(isLoading || resultVideoUrl || errorMessage) && (
        <div className="mt-10 text-center">
          <h3 className="text-xl font-semibold text-white mb-4">Hasil Video</h3>
          {isLoading && (
            <div className="flex flex-col items-center justify-center min-h-[200px] bg-gray-700/50 rounded-xl p-4">
              <CssSpinner /> 
              <p className="text-gray-300 mt-4">{statusText || "Memproses video..."}</p>
            </div>
          )}
          {!isLoading && resultVideoUrl && !errorMessage && ( 
            <div className="bg-gray-700/30 p-4 rounded-xl">
              <video 
                controls 
                src={resultVideoUrl} 
                className="rounded-lg mx-auto max-w-full h-auto shadow-lg max-h-[70vh]"
                onError={(e) => {
                  console.error("Video playback error", e);
                  setErrorMessage("Gagal memuat pratinjau video. Coba unduh.");
                }}
              >
                Browser Anda tidak mendukung tag video.
              </video>
              {statusText && <p className="text-gray-300 mt-2 text-sm">{statusText}</p>}
              <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={handleDownloadVideo}
                  disabled={!resultVideoUrl}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-50 disabled:bg-gray-500"
                >
                  Unduh Video
                </button>
              </div>
            </div>
          )}
           {!isLoading && errorMessage && !showSensitiveContentModal && ( 
             <div className="flex flex-col items-center justify-center min-h-[200px] bg-gray-700/50 rounded-xl p-4">
                <p className="text-red-400 mt-4 text-lg">{errorMessage}</p>
                 {statusText !== errorMessage && <p className="text-gray-300 mt-2">{statusText}</p>}
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

export default VideoPage;