
import React, { useState, useCallback, useEffect } from 'react';
import { Page, ApiKeyEntry } from './types';
import Sidebar from './components/Sidebar';
import MenuIcon from './components/icons/MenuIcon';
import HomePage from './components/HomePage';
import ImageCreatorPage from './components/ImageCreatorPage';
import ImageAnalysisPage from './components/ImageAnalysisPage';
import ThreeDImagePage from './components/ThreeDImagePage';
import VideoPage from './components/VideoPage';
import HistoryPage from './components/HistoryPage'; 
import SettingPage from './components/SettingPage';
import ChatbotPage from './components/ChatbotPage';
import PromoModal from './components/PromoModal';
import BottomNavBar from './components/BottomNavBar';
import { KREATOR_AI_LOGO_URL, ADMIN_WHATSAPP_NUMBER, FEATURE_DISPLAY_COSTS } from './constants';
import { getApiKeys, getActiveApiKey, deductDisplayCredit as deductDisplayCreditService } from './services/apiKeyService';


const joinNowGradients = [
  "bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600",
  "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600",
  "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
  "bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600",
];

const PROMO_SEEN_FLAG = 'kreatorAiPromoSeenFlag';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>(Page.Home);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [joinButtonGradientIndex, setJoinButtonGradientIndex] = useState(0);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState<boolean>(false);
  
  const [userApiKeys, setUserApiKeys] = useState<ApiKeyEntry[]>([]);
  const [activeKreatorAiApiKey, setActiveKreatorAiApiKey] = useState<ApiKeyEntry | null>(null);

  const updateUserApiKeysState = useCallback(() => {
    const keys = getApiKeys();
    setUserApiKeys(keys);
    setActiveKreatorAiApiKey(getActiveApiKey());
  }, []);

  useEffect(() => {
    updateUserApiKeysState(); // Initial load

    const intervalId = setInterval(() => {
      setJoinButtonGradientIndex(prevIndex => (prevIndex + 1) % joinNowGradients.length);
    }, 4000); 

    const promoSeen = localStorage.getItem(PROMO_SEEN_FLAG);
    if (promoSeen !== 'true') {
      setIsPromoModalOpen(true); 
    }

    return () => clearInterval(intervalId); 
  }, [updateUserApiKeysState]);

  const handleNavigate = useCallback((page: Page) => {
    setActivePage(page);
    setIsSidebarOpen(false);
    const mainContent = document.getElementById('main-content-area');
    if (mainContent) {
        mainContent.scrollTop = 0;
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const closeAndMarkPromoModalSeen = () => {
    setIsPromoModalOpen(false);
    localStorage.setItem(PROMO_SEEN_FLAG, 'true');
  };

  const triggerPromoModal = () => {
    setIsPromoModalOpen(true);
  };

  const handleDisplayCreditDeduction = useCallback((featureKey: keyof typeof FEATURE_DISPLAY_COSTS) => {
    if (activeKreatorAiApiKey && activeKreatorAiApiKey.displayCreditType !== 'free') {
      const updatedKeys = deductDisplayCreditService(activeKreatorAiApiKey.id, featureKey);
      updateUserApiKeysState(); // Re-fetch all keys and active key to update UI
    }
  }, [activeKreatorAiApiKey, updateUserApiKeysState]);

  const renderActivePage = () => {
    const commonPageProps = { 
      onTriggerPromoModal: triggerPromoModal,
      activeKreatorAiApiKey: activeKreatorAiApiKey,
      onDisplayCreditDeduct: handleDisplayCreditDeduction,
    };
    const settingsPageProps = {
      userApiKeys: userApiKeys,
      updateUserApiKeys: updateUserApiKeysState, // Pass the function to update keys
    };

    switch (activePage) {
      case Page.Home:
        return <HomePage onNavigate={handleNavigate} />;
      case Page.Chatbot:
        return <ChatbotPage {...commonPageProps} />; 
      case Page.Gambar:
        return <ImageCreatorPage {...commonPageProps} />;
      case Page.Analisa:
        // Analisa uses Server AI, not Kredit AI for display cost
        return <ImageAnalysisPage />; 
      case Page.ThreeD:
        return <ThreeDImagePage {...commonPageProps} />;
      case Page.Video:
        return <VideoPage {...commonPageProps} />;
      case Page.History:
        return <HistoryPage />; 
      case Page.Setting:
        return <SettingPage {...settingsPageProps} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };
  
  const currentJoinButtonGradient = joinNowGradients[joinButtonGradientIndex];
  
  const getDisplayCreditHeaderText = (): string => {
    if (!activeKreatorAiApiKey || !activeKreatorAiApiKey.key) return "Kredit AI Tidak Aktif";
    if (activeKreatorAiApiKey.displayCreditType === 'free') return "Kredit AI: Gratis";
    return `Kredit AI: ${activeKreatorAiApiKey.currentDisplayCredit}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-['Inter'] flex flex-col">
      <Sidebar 
        isOpen={isSidebarOpen} 
        activePage={activePage}
        onClose={() => setIsSidebarOpen(false)} 
        onNavigate={handleNavigate} 
      />
      
      <a
        href="https://santridigital.net/program-aplikasi"
        target="_blank"
        rel="noopener noreferrer"
        className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-[60] px-3 py-2 sm:px-5 sm:py-2.5 text-white font-bold rounded-lg shadow-xl text-xs sm:text-sm transition-all duration-1000 ease-in-out transform hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-400 ${currentJoinButtonGradient}`}
      >
        Join Kelas
      </a>

      <div className="sticky top-0 z-20 bg-gray-900 shadow-md">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-gray-800 rounded-t-2xl shadow-lg relative mt-4 sm:mt-6">
            <button 
              id="menu-btn" 
              className="absolute top-4 left-4 sm:top-6 sm:left-6 text-gray-300 hover:text-white z-30 p-2"
              onClick={toggleSidebar}
              aria-label="Toggle Menu"
              aria-expanded={isSidebarOpen}
              aria-controls="sidebar"
            >
              <MenuIcon />
            </button>
            <div className="p-4 sm:p-6 md:p-8 flex flex-col"> {/* Removed justify-between and min-h */}
              {/* Top part: Logo and Title */}
              <div> 
                <div className="flex flex-row items-center justify-center sm:justify-center gap-2 sm:gap-3"> {/* Ensured sm:justify-center */}
                  <img src={KREATOR_AI_LOGO_URL} alt="KreatorAI Logo" className="h-8 w-8 sm:h-10 md:h-12 rounded-full flex-shrink-0" />
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500 whitespace-nowrap">
                    KreatorAI
                  </h1>
                </div>
                <p className="text-gray-400 mt-1 sm:mt-2 text-center sm:text-center text-sm sm:text-base"> {/* Ensured sm:text-center */}
                  Buat Khayalan Jadi Kenyataan
                </p>
              </div>
              
              {/* Bottom part: Credit AI Display, aligned to bottom-right */}
              <div className="self-end mt-2"> {/* mt-2 for spacing from elements above */}
                <p className="text-yellow-400 text-xs sm:text-sm font-semibold whitespace-nowrap">
                  {getDisplayCreditHeaderText()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div id="main-content-area" className="flex-grow overflow-y-auto pb-24 flex flex-col">
        <div className="container mx-auto px-4 flex flex-col flex-grow">
          <div className="max-w-4xl mx-auto bg-gray-800 rounded-b-2xl shadow-lg flex flex-col flex-grow w-full">
            <div className="p-4 sm:p-6 md:p-10 flex flex-col flex-grow">
              <main id="main-content" className="flex flex-col flex-grow">
                {renderActivePage()}
              </main>
            </div>
          </div>
          
          <footer className="text-center mt-8 text-gray-500 text-sm flex-shrink-0">
            <p>Dipersembahkan oleh KreatorAI</p>
          </footer>
        </div>
      </div>
      <BottomNavBar activePage={activePage} onNavigate={handleNavigate} />
      <PromoModal 
        isOpen={isPromoModalOpen}
        onClose={closeAndMarkPromoModalSeen}
        adminPhoneNumber={ADMIN_WHATSAPP_NUMBER}
      />
    </div>
  );
};

export default App;