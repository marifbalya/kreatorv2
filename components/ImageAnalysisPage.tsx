
import React, { useState, ChangeEvent, useCallback } from 'react';
import { UploadedFile, HistoryItemType } from '../types';
import { processFileForUpload } from '../utils/fileUtils';
import { analyzeImageForPrompt } from '../services/geminiService';
import CssSpinner from './CssSpinner'; 
import { saveHistoryItem } from '../services/historyService';
import { SENSITIVE_CONTENT_ERROR_PREFIX } from '../constants'; // Import prefix
import SensitiveContentModal from './SensitiveContentModal'; // Import SensitiveContentModal

const ImageAnalysisPage: React.FC = () => {
  const [imageFile, setImageFile] = useState<UploadedFile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('');
  const [indonesianPrompt, setIndonesianPrompt] = useState<string>('');
  const [englishPrompt, setEnglishPrompt] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showSensitiveContentModal, setShowSensitiveContentModal] = useState<boolean>(false); // New state


  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const file = await processFileForUpload(e.target.files[0]);
        setImageFile(file);
        setIndonesianPrompt('');
        setEnglishPrompt('');
        setError(null);
        setStatusText(''); 
        setShowSensitiveContentModal(false);
      } catch (err) {
        console.error("Error processing file:", err);
        setError("Gagal memproses file gambar.");
        setStatusText("Gagal memproses file gambar.");
        setImageFile(null);
      }
    }
  };

  const handleAnalyzeClick = useCallback(async () => {
    if (!imageFile) {
      alert("Silakan unggah gambar terlebih dahulu.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setIndonesianPrompt('');
    setEnglishPrompt('');
    setStatusText("Menganalisa gambar...");
    setShowSensitiveContentModal(false);

    try {
      const { indonesianPrompt: idPrompt, englishPrompt: enPrompt } = await analyzeImageForPrompt(imageFile.base64, imageFile.mimeType);
      setIndonesianPrompt(idPrompt);
      setEnglishPrompt(enPrompt);
      setStatusText("Analisa selesai!");

      saveHistoryItem({
        type: HistoryItemType.Analysis,
        prompt: `Analisa Gambar: ${imageFile.file.name}`,
        resultUrl: imageFile.previewUrl,
        notes: `Hasil Analisa:\nVersi Indonesia:\n${idPrompt}\n\nEnglish Version:\n${enPrompt}`,
        thumbnailUrl: imageFile.previewUrl,
        originalImageUrls: [`data:${imageFile.mimeType};base64,${imageFile.base64}`],
      });
      alert("Hasil analisa disimpan ke riwayat!");

    } catch (err: any) {
      console.error("Analysis error:", err);
      const errorMessage = err.message || "Terjadi kesalahan saat menganalisa gambar.";
      setStatusText(errorMessage);
      if (errorMessage.startsWith(SENSITIVE_CONTENT_ERROR_PREFIX)) {
        setShowSensitiveContentModal(true);
        setError(null); // Clear generic error if it's sensitive content
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [imageFile]);

  const copyToClipboard = (text: string, lang: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`Prompt (${lang}) disalin!`);
    }).catch(err => {
      alert('Gagal menyalin prompt.');
      console.error('Clipboard copy failed: ', err);
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center text-white mb-4">Analisa Gambar untuk Prompt Detail</h2>
      <p className="text-gray-400 text-sm text-center">Unggah gambar untuk mendapatkan prompt detail dalam Bahasa Indonesia dan Inggris.</p>
      
      <input type="file" id="image-file-analisa" className="hidden" accept="image/*" onChange={handleFileChange} />
      <div 
        className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:bg-gray-700/50 transition min-h-[150px] flex items-center justify-center"
        onClick={() => document.getElementById('image-file-analisa')?.click()}
      >
        {imageFile ? (
          <img src={imageFile.previewUrl} className="mx-auto max-h-48 rounded-lg" alt="Pratinjau Analisa" />
        ) : (
          <p className="text-gray-400">Klik untuk mengunggah gambar</p>
        )}
      </div>

      <button 
        onClick={handleAnalyzeClick}
        disabled={isLoading || !imageFile}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg text-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-500 focus:ring-opacity-50 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
      >
        Buat Prompt dari Gambar
      </button>

      {isLoading && (
        <div className="mt-6 flex flex-col items-center justify-center min-h-[200px] bg-gray-700/50 rounded-xl p-4">
          <CssSpinner /> 
          <p className="text-gray-300 mt-4">{statusText || "Menganalisa..."}</p>
        </div>
      )}

      {!isLoading && error && ( // This error is for non-sensitive errors
        <div className="mt-6 p-4 bg-red-800/50 border border-red-700 rounded-lg text-red-300 text-center">
          {error}
        </div>
      )}

      {!isLoading && !error && (indonesianPrompt || englishPrompt) && (
        <div className="mt-6 space-y-6">
          {indonesianPrompt && (
            <div className="relative bg-gray-700/50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">Versi Indonesia</h3>
              <button 
                onClick={() => copyToClipboard(indonesianPrompt, 'ID')}
                className="absolute top-3 right-3 bg-gray-600 hover:bg-gray-500 text-gray-300 px-2 py-1 text-xs rounded-md transition-colors"
              >
                Salin
              </button>
              <pre className="text-left whitespace-pre-wrap text-gray-300 text-sm leading-relaxed">{indonesianPrompt}</pre>
            </div>
          )}
          {englishPrompt && (
            <div className="relative bg-gray-700/50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">English Version</h3>
              <button 
                onClick={() => copyToClipboard(englishPrompt, 'EN')}
                className="absolute top-3 right-3 bg-gray-600 hover:bg-gray-500 text-gray-300 px-2 py-1 text-xs rounded-md transition-colors"
              >
                Copy
              </button>
              <pre className="text-left whitespace-pre-wrap text-gray-300 text-sm leading-relaxed">{englishPrompt}</pre>
            </div>
          )}
        </div>
      )}
      <SensitiveContentModal
        isOpen={showSensitiveContentModal}
        onClose={() => setShowSensitiveContentModal(false)}
      />
    </div>
  );
};

export default ImageAnalysisPage;