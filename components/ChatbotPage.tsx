
import React, { useState, useEffect, useRef, useCallback, ChangeEvent } from 'react';
import { UploadedFile, ChatMessage, ChatMessageContentPart, HistoryItemType } from '../types';
import { processFileForUpload } from '../utils/fileUtils';
import { sendChatMessage } from '../services/geminiService';
import CssSpinner from './CssSpinner';
import PaperclipIcon from './icons/PaperclipIcon';
import SendIcon from './icons/SendIcon';
import { ADMIN_WHATSAPP_NUMBER, SENSITIVE_CONTENT_ERROR_PREFIX } from '../constants';
import ContactAdminModal from './ContactAdminModal';
import SensitiveContentModal from './SensitiveContentModal'; // Import SensitiveContentModal
import { saveHistoryItem } from '../services/historyService';

interface ChatbotPageProps {
  onTriggerPromoModal: () => void;
}

const ChatbotPage: React.FC<ChatbotPageProps> = ({ onTriggerPromoModal }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<UploadedFile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null); // General error for UI, not for modals specifically
  const [showContactAdminModal, setShowContactAdminModal] = useState<boolean>(false);
  const [showSensitiveContentModal, setShowSensitiveContentModal] = useState<boolean>(false); // New state


  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    setMessages([
      {
        id: 'initial-greeting-' + Date.now(),
        role: 'assistant',
        content: "Halo! Saya Kreator Asisten. Ada yang bisa saya bantu untuk ide konten Anda hari ini?",
        timestamp: Date.now()
      }
    ]);
  }, []);


  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      try {
        const file = await processFileForUpload(event.target.files[0]);
        setUploadedImage(file);
        setError(null); // Clear previous errors
        setShowContactAdminModal(false);
        setShowSensitiveContentModal(false);
      } catch (err) {
        console.error("Error processing image for chat:", err);
        setError("Gagal memproses gambar.");
        setUploadedImage(null);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() && !uploadedImage) return;

    const userMessageContentParts: ChatMessageContentPart[] = [];
    if (uploadedImage) {
      userMessageContentParts.push({
        type: 'image_url',
        image_url: { url: `data:${uploadedImage.mimeType};base64,${uploadedImage.base64}` }
      });
    }
    if (userInput.trim()) {
      userMessageContentParts.push({ type: 'text', text: userInput.trim() });
    }
    
    const newUserMessage: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: userMessageContentParts,
      timestamp: Date.now(),
      imagePreviewUrl: uploadedImage?.previewUrl,
    };

    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setUserInput('');
    setUploadedImage(null);
    if(fileInputRef.current) fileInputRef.current.value = ""; 
    setIsLoading(true);
    setError(null);
    setShowContactAdminModal(false);
    setShowSensitiveContentModal(false);

    const apiHistory = messages.filter(msg => msg.id !== newUserMessage.id);

    try {
      const assistantResponseText = await sendChatMessage(apiHistory, userInput.trim(), uploadedImage);
      const assistantMessage: ChatMessage = {
        id: 'assistant-' + Date.now(),
        role: 'assistant',
        content: assistantResponseText,
        timestamp: Date.now(),
      };
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
    } catch (err: any) {
      console.error("Chatbot API error:", err);
      const specificError = err.message || "Terjadi kesalahan pada Chatbot.";
      
      let chatErrorMessage = `Maaf, terjadi kesalahan: ${specificError}`;
      if (specificError.startsWith(SENSITIVE_CONTENT_ERROR_PREFIX)) {
        setShowSensitiveContentModal(true);
        // More user-friendly message for chat display
        chatErrorMessage = "Maaf, saya tidak bisa merespon permintaan ini karena terdeteksi konten sensitif. Silakan coba lagi dengan topik atau gambar yang berbeda.";
      } else if (specificError.toLowerCase().includes("server ai") || specificError.toLowerCase().includes("kredit") || specificError.toLowerCase().includes("api")) {
        setShowContactAdminModal(true);
      } else {
        setError(specificError); // Set general error for other cases if needed
      }

      const errorMessageInChat: ChatMessage = {
        id: 'error-' + Date.now(),
        role: 'assistant', 
        content: chatErrorMessage,
        timestamp: Date.now(),
      };
      setMessages(prevMessages => [...prevMessages, errorMessageInChat]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveChat = () => {
    if (messages.length <= 1) { 
        alert("Tidak ada percakapan yang cukup untuk disimpan.");
        return;
    }
    saveHistoryItem({
        type: HistoryItemType.Chat,
        prompt: `Sesi Chatbot - ${new Date(messages[0].timestamp).toLocaleDateString()}`,
        resultUrl: '', 
        notes: `Percakapan dengan Kreator Asisten (${messages.length} pesan).`,
        chatMessages: messages, 
        thumbnailUrl: 'https://placehold.co/100x100/8b5cf6/ffffff?text=Chat', 
    });
    alert("Sesi chat berhasil disimpan ke riwayat!");
  };

  const handleCloseContactAdminModal = () => {
    setShowContactAdminModal(false);
    onTriggerPromoModal();
  };

  return (
    <div className="flex flex-col flex-grow bg-gray-800 rounded-lg shadow-xl overflow-hidden"> 
      <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-700 flex-shrink-0">
        <h2 className="text-lg sm:text-xl font-bold text-white">Chatbot Kreator Asisten</h2>
        <button
            onClick={handleSaveChat}
            disabled={messages.length <=1}
            className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-semibold py-1.5 px-3 sm:py-2 sm:px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
        >
            Simpan Chat
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-3 sm:p-4 space-y-4 pb-24"> 
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs sm:max-w-md md:max-w-lg p-3 rounded-lg shadow ${
              msg.role === 'user' ? 'bg-indigo-500 text-white' 
              : (msg.content as string).startsWith('Maaf, saya tidak bisa merespon permintaan ini karena terdeteksi konten sensitif') ? 'bg-orange-700 text-white' // Sensitive content warning style
              : (msg.content as string).startsWith('Maaf, terjadi kesalahan:') ? 'bg-red-700 text-white' // Other errors
              : 'bg-gray-700 text-gray-200' // Normal assistant message
            }`}>
              {msg.imagePreviewUrl && (
                <img src={msg.imagePreviewUrl} alt="Uploaded content" className="rounded-md mb-2 max-h-48 w-auto" />
              )}
              {typeof msg.content === 'string' ? (
                <p className="text-sm sm:text-base whitespace-pre-wrap">{msg.content}</p>
              ) : (
                (msg.content as ChatMessageContentPart[]).map((part, index) =>
                  part.type === 'text' ? <p key={index} className="text-sm sm:text-base whitespace-pre-wrap">{part.text}</p> : null
                )
              )}
              <p className="text-xs opacity-70 mt-1 text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-xs sm:max-w-md md:max-w-lg p-3 rounded-lg shadow bg-gray-700 text-gray-200 flex items-center">
              <CssSpinner />
              <p className="text-sm sm:text-base ml-2">Asisten sedang mengetik...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 sm:p-4 border-t border-gray-700 bg-gray-800 flex-shrink-0">
        {uploadedImage && (
          <div className="mb-2 flex items-center gap-2 p-2 bg-gray-700 rounded-md">
            <img src={uploadedImage.previewUrl} alt="Preview" className="h-10 w-10 rounded object-cover" />
            <span className="text-xs text-gray-300 truncate flex-grow">{uploadedImage.file.name}</span>
            <button
              onClick={() => {
                setUploadedImage(null);
                if(fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="text-red-400 hover:text-red-300 text-xs p-1"
              aria-label="Hapus gambar"
            >
              &times; Hapus
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 sm:gap-3">
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" id="chat-image-upload"/>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-indigo-400 transition rounded-full hover:bg-gray-700"
            aria-label="Unggah gambar"
          >
            <PaperclipIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ketik pesan Anda atau unggah gambar..."
            className="flex-grow bg-gray-700 border border-gray-600 rounded-lg p-2 sm:p-2.5 text-sm sm:text-base text-white placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
            rows={1}
            style={{ maxHeight: '80px', overflowY: 'auto' }} 
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || (!userInput.trim() && !uploadedImage)}
            className="p-2 sm:p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Kirim pesan"
          >
            <SendIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>
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

export default ChatbotPage;