/// <reference path="./model-viewer.d.ts" />
import React, { useState, useEffect, useCallback } from 'react';
import { HistoryItem, HistoryItemType, HistoryFilterType, HistoryFilterOption } from '../types';
import { getHistoryItems, deleteHistoryItem, clearAllHistory } from '../services/historyService';
import { HISTORY_PAGE_FILTERS } from '../constants';

// model-viewer is globally declared by the triple-slash reference above

const HistoryPage: React.FC = () => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<HistoryItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<HistoryFilterType>(HistoryFilterType.All);

  useEffect(() => {
    const items = getHistoryItems();
    setHistoryItems(items);
  }, []);

  useEffect(() => {
    if (activeFilter === HistoryFilterType.All) {
      setFilteredItems(historyItems);
    } else {
      setFilteredItems(historyItems.filter(item => item.type === (activeFilter as unknown as HistoryItemType)));
    }
  }, [historyItems, activeFilter]);

  const handleDeleteItem = useCallback((id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus item riwayat ini?")) {
      const updatedItems = deleteHistoryItem(id);
      setHistoryItems(updatedItems);
    }
  }, []);

  const handleClearAll = useCallback(() => {
    if (window.confirm("Apakah Anda yakin ingin menghapus semua riwayat? Tindakan ini tidak dapat diurungkan.")) {
      clearAllHistory();
      setHistoryItems([]);
    }
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const triggerDownload = (blob: Blob, fileName: string) => {
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
  };

  const handleDownload = async (item: HistoryItem) => {
    if (!item.resultUrl && item.type !== HistoryItemType.Analysis && item.type !== HistoryItemType.Chat) {
      alert("URL hasil tidak ditemukan atau tidak berlaku untuk tipe item ini.");
      return;
    }

    let fileName = `${item.type.replace(/\s+/g, '_')}-${item.id.substring(0,8)}`;

    try {
      switch (item.type) {
        case HistoryItemType.Image:
          fileName += item.resultUrl.includes('.gif') ? '.gif' : '.png';
          const imageResponse = await fetch(item.resultUrl);
          if (!imageResponse.ok) throw new Error(`Gagal mengambil gambar: ${imageResponse.status}`);
          const imageBlob = await imageResponse.blob();
          triggerDownload(imageBlob, fileName);
          break;

        case HistoryItemType.Video:
          const videoUrlParts = item.resultUrl.split('.');
          const videoExtension = videoUrlParts.length > 1 ? videoUrlParts.pop()?.split('?')[0] : 'mp4';
          fileName += `.${videoExtension || 'mp4'}`;
          const videoResponse = await fetch(item.resultUrl);
          if (!videoResponse.ok) throw new Error(`Gagal mengambil video: ${videoResponse.status}`);
          const videoBlob = await videoResponse.blob();
          triggerDownload(videoBlob, fileName);
          break;

        case HistoryItemType.ThreeD:
          fileName += '.glb';
          const a3d = document.createElement('a');
          a3d.href = item.resultUrl;
          a3d.download = fileName;
          document.body.appendChild(a3d);
          a3d.click();
          document.body.removeChild(a3d);
          break;

        case HistoryItemType.Analysis:
        case HistoryItemType.Chat:
          fileName += '.txt';
          const textContent = item.notes || item.prompt || (item.type === HistoryItemType.Chat && item.chatMessages ? item.chatMessages.map(m => `${m.role}: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`).join('\n\n') : "Tidak ada detail tersimpan.");
          const textBlob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
          triggerDownload(textBlob, fileName);
          break;

        default:
          alert("Tipe item tidak didukung untuk pengunduhan.");
          return;
      }
    } catch (error) {
      console.error("Download error:", error);
      alert(`Gagal mengunduh: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    if (!text || text.trim() === "") {
        alert(`${type} kosong, tidak ada yang disalin.`);
        return;
    }
    navigator.clipboard.writeText(text)
      .then(() => alert(`${type} berhasil disalin!`))
      .catch(err => {
        alert(`Gagal menyalin ${type}.`);
        console.error('Clipboard copy failed: ', err);
      });
  };

  const parseAnalysisPrompts = (notes: string | undefined): { indonesian: string, english: string } => {
    const defaultResult = { indonesian: '', english: '' };
    if (!notes) return defaultResult;

    const idMarker = "Versi Indonesia:";
    const enMarker = "English Version:";

    const idIndex = notes.indexOf(idMarker);
    const enIndex = notes.indexOf(enMarker);

    if (idIndex !== -1) {
        const idEndIndex = enIndex !== -1 ? enIndex : notes.length;
        defaultResult.indonesian = notes.substring(idIndex + idMarker.length, idEndIndex).trim();
    }
    if (enIndex !== -1) {
        defaultResult.english = notes.substring(enIndex + enMarker.length).trim();
    }
    return defaultResult;
  };

  const renderPreview = (item: HistoryItem) => {
    const commonClasses = "w-full h-48 object-contain rounded-t-lg bg-gray-700";
    const modelViewerContainerClasses = "w-full h-48 rounded-t-lg bg-gray-700 flex items-center justify-center";
    
    switch (item.type) {
      case HistoryItemType.Image:
        return <img src={item.thumbnailUrl || item.resultUrl} alt="Hasil Gambar" className={commonClasses} onError={(e) => (e.currentTarget.src = 'https://placehold.co/300x200/ef4444/ffffff?text=Error+Image')} />;
      case HistoryItemType.Video:
        return (
          <video controls src={item.resultUrl} className={commonClasses} preload="metadata" poster={item.thumbnailUrl}>
            Browser Anda tidak mendukung tag video. Coba: <a href={item.resultUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Unduh Video</a>
          </video>
        );
      case HistoryItemType.ThreeD:
        if (!item.resultUrl) {
            return <div className={`${modelViewerContainerClasses} text-gray-400`}>URL Model 3D tidak tersedia.</div>;
        }
        return (
          <div className={modelViewerContainerClasses}>
            <model-viewer
                src={item.resultUrl}
                alt={`Pratinjau Model 3D: ${item.prompt || 'Model 3D'}`}
                camera-controls
                auto-rotate
                ar
                ios-src={item.resultUrl} 
                poster={item.thumbnailUrl || 'https://placehold.co/300x200/7c3aed/ffffff?text=3D+Model'}
                style={{ width: '100%', height: '100%' }}
            >
                <div slot="poster" className="w-full h-full flex items-center justify-center bg-gray-600">
                    {item.thumbnailUrl && !item.thumbnailUrl.startsWith('https://placehold.co')? 
                        <img src={item.thumbnailUrl} alt="Poster 3D" className="max-h-full max-w-full object-contain"/> : 
                        <span className="text-white text-xs text-center p-2">Memuat Pratinjau 3D...</span>
                    }
                </div>
                <div slot="progress-bar" className="absolute bottom-0 left-0 w-full h-1 bg-indigo-500 animate-pulse"></div>
            </model-viewer>
          </div>
        );
      case HistoryItemType.Analysis:
         return <img src={item.thumbnailUrl || item.resultUrl} alt="Gambar Analisa" className={commonClasses} onError={(e) => (e.currentTarget.src = 'https://placehold.co/300x200/10b981/ffffff?text=Analysis')} />;
      case HistoryItemType.Chat:
        return (
            <div className={`${commonClasses} flex items-center justify-center text-gray-300 p-4`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 5.523-4.477 10-10 10S1 17.523 1 12s4.477-10 10-10c.995 0 1.951.143 2.855.405M17.595 17.595A9.957 9.957 0 0112 20c-5.523 0-10-4.477-10-10S6.477 2 12 2c2.722 0 5.21.999 7.071 2.629" /></svg>
            </div>
        );
      default:
        return <div className={`${commonClasses} flex items-center justify-center text-gray-400`}>Tipe tidak dikenal</div>;
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Riwayat Pembuatan</h2>
        {historyItems.length > 0 && (
          <button
            onClick={handleClearAll}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          >
            Hapus Semua Riwayat
          </button>
        )}
      </div>

      {historyItems.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {HISTORY_PAGE_FILTERS.map((filterOpt: HistoryFilterOption) => (
            <button
              key={filterOpt.value}
              onClick={() => setActiveFilter(filterOpt.value)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors
                ${activeFilter === filterOpt.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                }`}
            >
              {filterOpt.label}
            </button>
          ))}
        </div>
      )}

      {filteredItems.length === 0 ? (
        <p className="text-gray-400 text-center py-10">
          {historyItems.length === 0 ? "Belum ada riwayat yang tersimpan." : "Tidak ada item yang cocok dengan filter ini."}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredItems.map((item) => {
            const analysisPrompts = item.type === HistoryItemType.Analysis ? parseAnalysisPrompts(item.notes) : null;
            return (
            <div key={item.id} className="bg-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col">
              {renderPreview(item)}
              <div className="p-3 sm:p-4 flex flex-col flex-grow">
                <p className="text-xs text-gray-400 mb-1">{item.type.toUpperCase()} - {formatDate(item.timestamp)}</p>
                {item.type === HistoryItemType.Analysis && analysisPrompts && (
                    <div className="flex gap-2 mb-2">
                        <button
                            onClick={() => copyToClipboard(analysisPrompts.indonesian, "Prompt Indonesia")}
                            className="flex-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold py-1 px-2 rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
                            disabled={!analysisPrompts.indonesian}
                        >
                            Salin ID
                        </button>
                        <button
                            onClick={() => copyToClipboard(analysisPrompts.english, "Prompt English")}
                            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold py-1 px-2 rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                            disabled={!analysisPrompts.english}
                        >
                            Salin ENG
                        </button>
                    </div>
                )}
                <p className="text-sm text-gray-300 mb-2 truncate" title={item.prompt}>
                  <strong>Prompt:</strong> {item.prompt || (item.type === HistoryItemType.Chat ? "Sesi Chat" : "-")}
                </p>
                {item.notes && item.type !== HistoryItemType.Analysis && (
                  <details className="text-xs text-gray-400 mb-2 italic">
                    <summary className="cursor-pointer hover:text-gray-200"><strong>Catatan</strong> (klik untuk lihat)</summary>
                    <pre className="whitespace-pre-wrap mt-1 p-2 bg-gray-700/50 rounded-md text-gray-300 max-h-24 overflow-y-auto">{item.notes}</pre>
                  </details>
                )}
                
                <div className="mt-auto pt-3 flex gap-2">
                   <button
                    onClick={() => handleDownload(item)}
                    disabled={!item.resultUrl && item.type !== HistoryItemType.Analysis && item.type !== HistoryItemType.Chat}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-1.5 px-3 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-500 disabled:cursor-not-allowed"
                  >
                    Unduh
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="flex-1 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold py-1.5 px-3 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;