
import React, { useState, useEffect } from 'react';
import CloseIcon from './icons/CloseIcon';

interface PromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminPhoneNumber: string;
}

const promoSliderImages = [
  "https://i.postimg.cc/TYnL0Chw/image-17.png",
  "https://i.postimg.cc/J7fHj9rv/image-18.png",
  "https://i.postimg.cc/g02xYpsX/image-20.png",
  "https://i.postimg.cc/L8TqK5tF/image-21.png",
];

const creditTiers = [
  { text: "1.000 kredit", price: "Rp. 5.000", bonus: "bonus 1.000 kredit" },
  { text: "2.000 kredit", price: "Rp. 10.000", bonus: "bonus 3.000 kredit" },
  { text: "3.000 kredit", price: "Rp. 15.000", bonus: "bonus 5.000 kredit" },
];

const PromoModal: React.FC<PromoModalProps> = ({ isOpen, onClose, adminPhoneNumber }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % promoSliderImages.length);
    }, 4000); // Change slide every 4 seconds
    return () => clearTimeout(timer);
  }, [currentSlide, isOpen]);

  if (!isOpen) return null;

  const whatsappMessage = encodeURIComponent("Halo Admin Kreator AI, saya tertarik dengan Promo Double Kredit yang sedang berlangsung!");
  const waChannelLink = "https://whatsapp.com/channel/0029Vb5TyHJ5K3zLVkdNoT36";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] p-3 sm:p-4 transition-opacity duration-300 ease-in-out">
      <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black p-4 sm:p-5 md:p-6 rounded-xl shadow-2xl w-full max-w-md space-y-3 sm:space-y-4 text-center border-2 border-yellow-500 transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-fadeInScaleUp">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 text-gray-400 hover:text-white transition-colors z-10 p-1"
          aria-label="Tutup promo"
        >
          <CloseIcon className="w-5 h-5" />
        </button>

        <style>
          {`
            @keyframes fadeInScaleUp {
              0% { opacity: 0; transform: scale(0.95); }
              100% { opacity: 1; transform: scale(1); }
            }
            .animate-fadeInScaleUp {
              animation: fadeInScaleUp 0.3s forwards;
            }
          `}
        </style>
        
        <div className="relative w-full h-36 sm:h-40 md:h-48 overflow-hidden rounded-lg shadow-md mb-2 sm:mb-3 bg-gray-700/30">
          {promoSliderImages.map((src, index) => (
            <div
              key={src}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img 
                src={src} 
                alt={`Promo KreatorAI Slide ${index + 1}`} 
                className="w-full h-full object-contain" 
              />
            </div>
          ))}
           <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 flex space-x-1.5">
            {promoSliderImages.map((_, index) => (
                <button
                    key={`dot-${index}`}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 ${
                        index === currentSlide ? 'bg-yellow-400 scale-125' : 'bg-gray-400/50 hover:bg-gray-300/80'
                    }`}
                    aria-label={`Go to promo slide ${index + 1}`}
                />
            ))}
        </div>
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-yellow-400 mt-1">Penawaran Spesial!</h3>
        <p className="text-xs sm:text-sm text-gray-300 leading-snug">
          Nikmati bonus kredit berlimpah! Jangan lewatkan kesempatan ini.
        </p>

        <div className="space-y-1.5 text-left px-1 sm:px-2">
          {creditTiers.map((tier, index) => (
            <div key={index} className="p-1.5 sm:p-2 bg-gray-700/50 rounded-md flex justify-between items-center text-xs">
              <span className="font-semibold text-white">{tier.text}</span>
              <div className="text-right">
                <span className="text-gray-300 block">{tier.price}</span>
                <span className="text-green-400 font-medium block">({tier.bonus})</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 mb-1 text-xs sm:text-sm text-gray-200">
          Mau Dapat Kredit Gratis?{' '}
          <a 
            href={waChannelLink}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-green-400 hover:text-green-300 underline transition-colors"
          >
            Join Saluran WA
          </a>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 pt-1 sm:pt-2">
          <a
            href={`https://wa.me/${adminPhoneNumber}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.385 2.22A8.136 8.136 0 002.25 10.353v.002c0 4.379 3.398 7.973 7.75 8.129h.017c.075 0 .149-.003.223-.005.918-.031 1.77-.208 2.536-.508l.338-.135.002.003.09.034c.063.024.126.042.19.054l1.624.296a.75.75 0 00.866-.866l-.296-1.623a4.707 4.707 0 01-.055-.192l-.033-.09-.003-.002.135-.338c.3-.765.477-1.617.508-2.536v-.223h.005A8.136 8.136 0 0010.385 2.22zM8.03 5.432c.03-.06.09-.105.153-.134.062-.03.13-.038.195-.022l2.365.666c.148.042.25.176.25.328v.002l-.001 1.63a.75.75 0 00.908.73l1.838-.452c.245-.06.495.045.6.275l.488 1.077a.64.64 0 01-.06.708l-.517.585a.759.759 0 01-.63.26h-.003c-.349 0-1.037-.168-1.92-.533a6.797 6.797 0 01-3.218-3.218c-.365-.883-.534-1.571-.534-1.92v-.002c0-.236.09-.457.26-.63l.585-.517a.64.64 0 01.709-.06l1.076.488c.23.104.336.353.276.6z"/>
            </svg>
            Chat Admin
          </a>
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm shadow-lg hover:shadow-xl"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromoModal;
