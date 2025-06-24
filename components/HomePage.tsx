
import React, { useState, useEffect } from 'react';
import { Page, NavItem } from '../types';
import { NAV_ITEMS } from '../constants'; // Assuming NAV_ITEMS has icons
import ChatIcon from './icons/ChatIcon';
import AnalyzeIcon from './icons/AnalyzeIcon';
import ImageIcon from './icons/ImageIcon';
import CubeIcon from './icons/CubeIcon';
import VideoIcon from './icons/VideoIcon';
import CogIcon from './icons/CogIcon';

interface HomePageProps {
  onNavigate: (page: Page) => void;
}

const sliderImages = [
  "https://i.postimg.cc/TYnL0Chw/image-17.png",
  "https://i.postimg.cc/J7fHj9rv/image-18.png",
  "https://i.postimg.cc/g02xYpsX/image-20.png",
  "https://i.postimg.cc/L8TqK5tF/image-21.png",
  "https://i.postimg.cc/63TtP50c/image-22.png",
  "https://i.postimg.cc/YSdt8m1j/image-23.png",
  "https://i.postimg.cc/pLYWhSrf/image-24.png",
  "https://i.postimg.cc/Y9SCwxp1/image-25.png",
  "https://i.postimg.cc/Y0G2vqL0/image-26.png",
  "https://i.postimg.cc/mrjgqnGL/image-27.png",
  "https://i.postimg.cc/G2Sh3s26/image-28.png",
  "https://i.postimg.cc/zXH3BpT7/image-29.png"
];

const featurePages: { page: Page; title: string; description: string; Icon: React.FC<React.SVGProps<SVGSVGElement>>; bgColor: string }[] = [
  { page: Page.Chatbot, title: "Chatbot Kreator", description: "Asisten AI untuk ide & draf konten.", Icon: ChatIcon, bgColor: "bg-purple-600 hover:bg-purple-700" },
  { page: Page.Analisa, title: "Analisa Image", description: "Dapatkan prompt detail dari gambar.", Icon: AnalyzeIcon, bgColor: "bg-teal-600 hover:bg-teal-700" },
  { page: Page.Gambar, title: "Buat Gambar", description: "Ciptakan gambar unik dari teks.", Icon: ImageIcon, bgColor: "bg-indigo-600 hover:bg-indigo-700" },
  { page: Page.ThreeD, title: "3D Image", description: "Ubah gambar 2D menjadi model 3D.", Icon: CubeIcon, bgColor: "bg-pink-600 hover:bg-pink-700" },
  { page: Page.Video, title: "Video AI", description: "Buat video dari teks atau gambar.", Icon: VideoIcon, bgColor: "bg-sky-600 hover:bg-sky-700" },
  { page: Page.Setting, title: "Pengaturan", description: "Setting kredit dan server AI.", Icon: CogIcon, bgColor: "bg-gray-600 hover:bg-gray-700" },
];

const visualStyles = [
  { name: "Photorealistic", image: "https://i.postimg.cc/MT1dq1dp/kreator-ai-1750677134663.jpg" },
  { name: "Realistic", image: "https://i.postimg.cc/DfdBNdSC/image-31.png" },
  { name: "Anime & Manga", image: "https://i.postimg.cc/zvj7R8mm/image-32.png" },
  { name: "Cinematic Film", image: "https://i.postimg.cc/k50f0TNH/kreator-ai-1750677259930.jpg" },
  { name: "Fantasy Art", image: "https://i.postimg.cc/mrzmpv9M/kreator-ai-1750677330323.jpg" },
  { name: "Sci-Fi Futuristic", image: "https://i.postimg.cc/jSk8XxDt/kreator-ai-1750677490556.jpg" },
  { name: "Cyberpunk & Neon", image: "https://i.postimg.cc/L8sCLY6x/kreator-ai-1750677535906.jpg" },
  { name: "Vintage & Retro", image: "https://i.postimg.cc/vHbS8SRF/kreator-ai-1750677605909.jpg" },
  { name: "Comic & Cartoon", image: "https://i.postimg.cc/yYjpDXBJ/kreator-ai-1750677670186.jpg" },
  { name: "3D CGI", image: "https://i.postimg.cc/3NCSC2vc/kreator-ai-1750677931462.jpg" },
  { name: "Studio Ghibli", image: "https://i.postimg.cc/L4zbpFb3/kreator-ai-1750677976051.jpg" },
  { name: "Miniature Fantasy", image: "https://i.postimg.cc/QCrYTfH7/kreator-ai-1750678969868.jpg" },
];


const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % sliderImages.length);
    }, 4000); // Change slide every 4 seconds
    return () => clearTimeout(timer);
  }, [currentSlide]);

  return (
    <div className="space-y-10 sm:space-y-16">
      {/* Image Slider Section */}
      <section className="relative w-full h-48 sm:h-64 md:h-80 lg:h-96 overflow-hidden rounded-xl shadow-2xl group">
        {sliderImages.map((src, index) => (
          <div
            key={src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img 
              src={src} 
              alt={`Slide ${index + 1}`} 
              className="w-full h-full object-cover" 
            />
             <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-10 transition-all duration-300"></div>
          </div>
        ))}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {sliderImages.map((_, index) => (
                <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 ${
                        index === currentSlide ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                />
            ))}
        </div>
      </section>

      {/* Feature Cards Section */}
      <section>
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-6 sm:mb-8">Fitur Unggulan KreatorAI</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {featurePages.map(({ page, title, description, Icon, bgColor }) => {
            const navItemDetails = NAV_ITEMS.find(item => item.id === page);
            const DisplayIcon = navItemDetails?.icon || Icon; // Capitalized for JSX

            return (
              <button
                key={page}
                onClick={() => onNavigate(page)}
                className={`p-4 sm:p-6 rounded-xl shadow-lg text-white transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-opacity-50 ${bgColor} focus:ring-current flex flex-col items-center text-center`}
              >
                {DisplayIcon && <DisplayIcon className="w-8 h-8 sm:w-10 sm:h-10 mb-2 sm:mb-3" />}
                <h3 className="text-sm sm:text-md font-semibold mb-1 sm:mb-1.5 whitespace-nowrap">{title}</h3>
                <p className="text-xs sm:text-sm opacity-80 leading-tight">{description}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Visual Style Showcase Section */}
      <section>
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-6 sm:mb-8">Visual Tiap Style Gambar</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {visualStyles.map((style) => (
            <div key={style.name} className="flex flex-col items-center text-center group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden shadow-lg border-2 border-transparent group-hover:border-indigo-500 transition-all duration-300 transform group-hover:scale-105 mb-2">
                <img 
                  src={style.image} 
                  alt={style.name} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{style.name}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;