
import React from 'react';
import CloseIcon from './icons/CloseIcon';

interface SensitiveContentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SensitiveContentModal: React.FC<SensitiveContentModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-xl w-full max-w-md space-y-5 text-center border border-orange-500">
        <div className="flex justify-center mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-orange-400">Konten Terdeteksi Sensitif</h3>
        <p className="text-gray-300 text-sm sm:text-base">
          Operasi tidak dapat dilanjutkan karena konten yang Anda berikan (prompt atau gambar) terdeteksi sebagai berpotensi sensitif atau melanggar kebijakan.
        </p>
        <p className="text-gray-300 text-sm sm:text-base">
          Silakan coba gunakan prompt atau gambar yang berbeda.
        </p>
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default SensitiveContentModal;