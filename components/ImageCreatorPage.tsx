import React, { useState, useCallback, ChangeEvent, FormEvent, useRef } from 'react';
import { ImageTab, TabItem, UploadedFile, HistoryItemType, GabungCategorizedData, ApiKeyEntry } from '../types';
import { IMAGE_STYLES, ASPECT_RATIOS, ADMIN_WHATSAPP_NUMBER, SENSITIVE_CONTENT_ERROR_PREFIX, FEATURE_DISPLAY_COSTS } from '../constants';
import CustomSelect from './CustomSelect';
import OptimizePromptButton from './OptimizePromptButton';
import CssSpinner from './CssSpinner';
import { processFileForUpload } from '../utils/fileUtils';
import { optimizePrompt } from '../services/geminiService';
import { createImage, editImage, mergeImages } from '../services/wavespeedService';
import { saveHistoryItem } from '../services/historyService';
import ContactAdminModal from './ContactAdminModal';
import SensitiveContentModal from './SensitiveContentModal';
import CloseIcon from './icons/CloseIcon'; // For remove image button

const TABS: TabItem[] = [
  { id: ImageTab.BuatGambar, label: 'Buat' },
  { id: ImageTab.EditGambar, label: 'Edit' },
  { id: ImageTab.GabungGambar, label: 'Gabung' },
];

const initialGabungData: GabungCategorizedData = {
  mergeImages: [], // Initialize with an empty array for dynamic additions
};

const MAX_MERGE_IMAGES = 5;

interface ImageCreatorPageProps {
  onTriggerPromoModal: () => void;
  activeKreatorAiApiKey: ApiKeyEntry | null;
  onDisplayCreditDeduct: (featureKey: keyof typeof FEATURE_DISPLAY_COSTS) => void;
}

const ImageCreatorPage: React.FC<ImageCreatorPageProps> = ({ 
  onTriggerPromoModal, 
  activeKreatorAiApiKey,
  onDisplayCreditDeduct
}) => {
  const [activeTab, setActiveTab] = useState<ImageTab>(ImageTab.BuatGambar);
  
  const [promptBuat, setPromptBuat] = useState<string>('');
  const [imageStyle, setImageStyle] = useState<string>(IMAGE_STYLES[0].value);
  const [aspectRatio, setAspectRatio] = useState<string>(ASPECT_RATIOS[0].value);
  const [isOptimizingBuat, setIsOptimizingBuat] = useState<boolean>(false);

  const [promptEdit, setPromptEdit] = useState<string>('');
  const [editImageFile, setEditImageFile] = useState<UploadedFile | null>(null);
  const [isOptimizingEdit, setIsOptimizingEdit] = useState<boolean>(false);

  const [promptGabung, setPromptGabung] = useState<string>('');
  const [gabungData, setGabungData] = useState<GabungCategorizedData>(initialGabungData);
  const [isOptimizingGabung, setIsOptimizingGabung] = useState<boolean>(false);
  const gabungFileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('');
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showContactAdminModal, setShowContactAdminModal] = useState<boolean>(false);
  const [showSensitiveContentModal, setShowSensitiveContentModal] = useState<boolean>(false);


  const resetCommonStates = () => {
    setResultImageUrl(null);
    setErrorMessage(null);
    setStatusText('');
    setShowContactAdminModal(false);
    setShowSensitiveContentModal(false);
  };

  const handleTabChange = (newTab: ImageTab) => {
    setActiveTab(newTab);
    resetCommonStates();
    setIsLoading(false); 
    if (newTab !== ImageTab.GabungGambar) { // Reset gabung data if navigating away
      setGabungData(initialGabungData);
    }
  };

  const handleOptimizePrompt = useCallback(async (
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
    setShowSensitiveContentModal(false);
    setShowContactAdminModal(false);
    
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

  const handleFileChange = async (
    e: ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<UploadedFile | null>>
  ) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const file = await processFileForUpload(e.target.files[0]);
        setFile(file);
        resetCommonStates();
      } catch (err) {
        console.error("Error processing file:", err);
        setErrorMessage("Gagal memproses file gambar.");
        setFile(null);
      }
    }
  };
  
  const handleAddGabungImage = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && gabungData.mergeImages.length < MAX_MERGE_IMAGES) {
      try {
        const file = await processFileForUpload(e.target.files[0]);
        setGabungData(prev => ({
          ...prev,
          mergeImages: [...prev.mergeImages, file]
        }));
        resetCommonStates();
        // Clear the file input so the same file can be re-selected if removed and added again
        if (e.target) e.target.value = ""; 
      } catch (err) {
        console.error("Error processing file for gabung:", err);
        setErrorMessage("Gagal memproses file gambar untuk digabung.");
      }
    }
  };

  const handleRemoveGabungImage = (indexToRemove: number) => {
    setGabungData(prev => ({
      ...prev,
      mergeImages: prev.mergeImages.filter((_, index) => index !== indexToRemove)
    }));
  };
  
  const handleErrorAndModal = (error: any) => {
    console.error("Image operation error:", error);
    const specificError = error.message || "Terjadi kesalahan.";
    setErrorMessage(specificError);
    setStatusText(specificError);

    if (specificError.startsWith(SENSITIVE_CONTENT_ERROR_PREFIX)) {
      setShowSensitiveContentModal(true);
    } else if (specificError.toLowerCase().includes("kredit") || specificError.toLowerCase().includes("api") || specificError.toLowerCase().includes("kreatorai")) {
      setShowContactAdminModal(true);
    }
  };

  const handleCloseContactAdminModal = () => {
    setShowContactAdminModal(false);
    onTriggerPromoModal();
  };

  const handleGenerateSuccess = (featureKey: keyof typeof FEATURE_DISPLAY_COSTS) => {
    onDisplayCreditDeduct(featureKey);
    alert("Gambar berhasil disimpan ke riwayat!");
  };

  const handleGenerateImage = async (e: FormEvent) => {
    e.preventDefault();
    if (!promptBuat.trim()) {
      alert("Prompt tidak boleh kosong.");
      return;
    }
    setIsLoading(true);
    resetCommonStates();
    setStatusText("Membuat gambar dari teks...");

    try {
      const imageUrl = await createImage(promptBuat, imageStyle, aspectRatio, setStatusText);
      setResultImageUrl(imageUrl);
      setStatusText("Gambar berhasil dibuat!");
      saveHistoryItem({
        type: HistoryItemType.Image,
        prompt: promptBuat,
        resultUrl: imageUrl,
        notes: `Gaya: ${imageStyle}, Rasio: ${aspectRatio}`,
        thumbnailUrl: imageUrl,
      });
      handleGenerateSuccess('buat_gambar');
    } catch (error) {
      handleErrorAndModal(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePerformEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editImageFile || !promptEdit.trim()) {
      alert("Gambar dan prompt untuk edit tidak boleh kosong.");
      return;
    }
    setIsLoading(true);
    resetCommonStates();
    setStatusText("Mengedit gambar...");

    try {
      const imageUrl = await editImage(editImageFile.base64, promptEdit, setStatusText);
      setResultImageUrl(imageUrl);
      setStatusText("Gambar berhasil diedit!");
      saveHistoryItem({
        type: HistoryItemType.Image,
        prompt: promptEdit,
        resultUrl: imageUrl,
        notes: `Edit dari: ${editImageFile.file.name}`,
        originalImageUrls: [`data:${editImageFile.mimeType};base64,${editImageFile.base64}`],
        thumbnailUrl: imageUrl,
      });
      handleGenerateSuccess('edit_gambar');
    } catch (error) {
      handleErrorAndModal(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePerformMerge = async (e: FormEvent) => {
    e.preventDefault();
    const allGabungImages: UploadedFile[] = gabungData.mergeImages;

    if (allGabungImages.length < 2) {
      alert("Minimal 2 gambar harus diunggah untuk penggabungan.");
      return;
    }
    if (!promptGabung.trim()) {
      alert("Prompt untuk penggabungan tidak boleh kosong.");
      return;
    }

    setIsLoading(true);
    resetCommonStates();
    setStatusText("Menggabungkan gambar...");

    try {
      const base64Datas = allGabungImages.map(f => f.base64);
      const imageUrl = await mergeImages(base64Datas, promptGabung, setStatusText);
      setResultImageUrl(imageUrl);
      setStatusText("Gambar berhasil digabung!");
      saveHistoryItem({
        type: HistoryItemType.Image,
        prompt: promptGabung,
        resultUrl: imageUrl,
        notes: `Gabungan dari ${allGabungImages.length} gambar.`,
        originalImageUrls: allGabungImages.map(f => `data:${f.mimeType};base64,${f.base64}`),
        thumbnailUrl: imageUrl,
      });
      handleGenerateSuccess('gabung_gambar');
    } catch (error) {
      handleErrorAndModal(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderFileInput = (
    id: string, 
    currentFile: UploadedFile | null, 
    onChange: (e: ChangeEvent<HTMLInputElement>) => void,
    label: string = "Klik untuk mengunggah gambar"
  ) => (
    <>
      <input type="file" id={id} className="hidden" accept="image/*" onChange={onChange} />
      <div 
        className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:bg-gray-700/50 transition min-h-[150px] flex items-center justify-center"
        onClick={() => document.getElementById(id)?.click()}
        role="button" tabIndex={0} aria-label={label}
      >
        {currentFile ? (
          <img src={currentFile.previewUrl} className="mx-auto max-h-48 rounded-lg" alt="Pratinjau" />
        ) : (
          <p className="text-gray-400">{label}</p>
        )}
      </div>
    </>
  );

  const getButtonTextWithCost = (baseText: string, featureKey: keyof typeof FEATURE_DISPLAY_COSTS) => {
    if (!activeKreatorAiApiKey || activeKreatorAiApiKey.displayCreditType === 'free') {
      return baseText;
    }
    const cost = FEATURE_DISPLAY_COSTS[featureKey];
    return `${baseText} (${cost} Kredit)`;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case ImageTab.BuatGambar:
        return (
          <form onSubmit={handleGenerateImage} className="space-y-6">
            <p className="text-gray-400 text-sm">Jelaskan gambar yang ingin Anda buat.</p>
            <div className="relative">
              <textarea
                value={promptBuat}
                onChange={(e) => setPromptBuat(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 pr-12 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                rows={4}
                placeholder="e.g., Kucing astronot di bulan, memegang bendera, gaya kartun..."
              />
              <OptimizePromptButton onClick={() => handleOptimizePrompt(promptBuat, setPromptBuat, setIsOptimizingBuat)} isLoading={isOptimizingBuat} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomSelect label="Gaya Gambar" id="image-style" options={IMAGE_STYLES} value={imageStyle} onChange={(e) => setImageStyle(e.target.value)} />
              <CustomSelect label="Rasio Aspek" id="aspect-ratio" options={ASPECT_RATIOS} value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} />
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg text-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 disabled:bg-gray-500">
              {getButtonTextWithCost('Buat Gambar', 'buat_gambar')}
            </button>
          </form>
        );
      case ImageTab.EditGambar:
        return (
          <form onSubmit={handlePerformEdit} className="space-y-6">
            <p className="text-gray-400 text-sm">Unggah gambar dan berikan instruksi perubahan.</p>
            {renderFileInput('edit-image-file', editImageFile, (e) => handleFileChange(e, setEditImageFile), "Unggah Gambar untuk Diedit")}
            <div className="relative">
              <textarea
                value={promptEdit}
                onChange={(e) => setPromptEdit(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 pr-12 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                rows={3}
                placeholder="e.g., Ganti warna rambut jadi biru, tambahkan kacamata..."
              />
              <OptimizePromptButton onClick={() => handleOptimizePrompt(promptEdit, setPromptEdit, setIsOptimizingEdit)} isLoading={isOptimizingEdit} />
            </div>
            <button type="submit" disabled={isLoading || !editImageFile} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg text-lg transition disabled:bg-gray-500">
              {getButtonTextWithCost('Edit Gambar', 'edit_gambar')}
            </button>
          </form>
        );
      case ImageTab.GabungGambar:
        return (
          <form onSubmit={handlePerformMerge} className="space-y-6">
            <p className="text-gray-400 text-sm">Unggah hingga {MAX_MERGE_IMAGES} gambar dan jelaskan bagaimana AI harus menggabungkannya. Minimal 2 gambar diperlukan.</p>
            
            <input type="file" id="gabung-image-file-input" ref={gabungFileInputRef} className="hidden" accept="image/*" onChange={handleAddGabungImage} />
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {gabungData.mergeImages.map((uploadedFile, index) => (
                <div key={index} className="relative group aspect-square">
                  <img 
                    src={uploadedFile.previewUrl} 
                    alt={`Gabung Gambar ${index + 1}`} 
                    className="w-full h-full object-cover rounded-lg shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveGabungImage(index)}
                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:opacity-100"
                    aria-label={`Hapus gambar ${index + 1}`}
                  >
                    <CloseIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {gabungData.mergeImages.length < MAX_MERGE_IMAGES && (
                 <button
                    type="button"
                    onClick={() => gabungFileInputRef.current?.click()}
                    className="w-full aspect-square border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:bg-gray-700/50 hover:border-gray-500 transition-colors"
                    aria-label="Tambah Foto untuk Digabung"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Tambah Foto
                    <span className="text-xs">({gabungData.mergeImages.length}/{MAX_MERGE_IMAGES})</span>
                </button>
              )}
            </div>
            {gabungData.mergeImages.length === 0 && gabungData.mergeImages.length < MAX_MERGE_IMAGES && (
                 <div className="text-center text-gray-500 text-sm py-4">
                    Belum ada gambar yang diunggah. Klik "Tambah Foto" di atas.
                 </div>
            )}


            <div className="relative">
              <textarea
                value={promptGabung}
                onChange={(e) => setPromptGabung(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 pr-12 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                rows={3}
                placeholder="e.g., Gabungkan karakter-karakter ini dalam satu adegan fantasi..."
              />
              <OptimizePromptButton onClick={() => handleOptimizePrompt(promptGabung, setPromptGabung, setIsOptimizingGabung)} isLoading={isOptimizingGabung} />
            </div>
            <button 
                type="submit" 
                disabled={isLoading || gabungData.mergeImages.length < 2} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg text-lg transition disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {getButtonTextWithCost('Gabung Gambar', 'gabung_gambar')}
            </button>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-center text-white mb-6">Gambar AI Generator</h2>
      <div className="mb-6 border-b border-gray-700">
        <nav className="flex flex-wrap gap-y-2 -mb-px" aria-label="Image Tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
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

      {(isLoading || resultImageUrl || errorMessage) && (
        <div className="mt-10 text-center">
          <h3 className="text-xl font-semibold text-white mb-4">Hasil</h3>
          {isLoading && (
            <div className="flex flex-col items-center justify-center min-h-[200px] bg-gray-700/50 rounded-xl p-4">
              <CssSpinner />
              <p className="text-gray-300 mt-4">{statusText || "Memproses..."}</p>
            </div>
          )}
          {!isLoading && resultImageUrl && !errorMessage && (
            <div className="bg-gray-700/30 p-4 rounded-xl">
              <img src={resultImageUrl} alt="Generated Image" className="rounded-lg mx-auto max-w-full h-auto shadow-lg max-h-[70vh]" />
              {statusText && <p className="text-gray-300 mt-2 text-sm">{statusText}</p>}
              <div className="mt-6">
                <a
                  href={resultImageUrl}
                  download={`kreator-ai-image-${Date.now()}.png`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-50"
                >
                  Unduh Gambar
                </a>
              </div>
            </div>
          )}
           {!isLoading && errorMessage && !showSensitiveContentModal && ( 
             <div className="flex flex-col items-center justify-center min-h-[100px] bg-gray-700/50 rounded-xl p-4">
                <p className="text-red-400 text-lg">{errorMessage}</p>
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

export default ImageCreatorPage;