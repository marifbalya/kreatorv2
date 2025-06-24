
import React from 'react';

interface ContactAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminPhoneNumber: string;
  // errorMessage prop removed as the text is now standardized for credit issues
}

const ContactAdminModal: React.FC<ContactAdminModalProps> = ({ isOpen, onClose, adminPhoneNumber }) => {
  if (!isOpen) return null;

  const primaryMessage = (
    <>
      Kredit KreatorAI tidak aktif atau tidak valid. Silakan atur di halaman <strong className="font-bold">Pengaturan</strong>.
    </>
  );
  const secondaryMessage = "Jika Anda belum memiliki Kredit, silakan hubungi Admin untuk melakukan pembelian.";
  const whatsappMessage = encodeURIComponent("Halo min saya ingin beli kredit KreatorAI.");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-xl w-full max-w-md space-y-6 text-center border border-yellow-500">
        <h3 className="text-2xl font-bold text-yellow-400">Masalah Kredit!</h3>
        <p className="text-gray-300">
          {primaryMessage}
        </p>
        <p className="text-gray-300 mt-3">
          {secondaryMessage}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
          <a
            href={`https://wa.me/${adminPhoneNumber}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.385 2.22A8.136 8.136 0 002.25 10.353v.002c0 4.379 3.398 7.973 7.75 8.129h.017c.075 0 .149-.003.223-.005.918-.031 1.77-.208 2.536-.508l.338-.135.002.003.09.034c.063.024.126.042.19.054l1.624.296a.75.75 0 00.866-.866l-.296-1.623a4.707 4.707 0 01-.055-.192l-.033-.09-.003-.002.135-.338c.3-.765.477-1.617.508-2.536v-.223h.005A8.136 8.136 0 0010.385 2.22zM8.03 5.432c.03-.06.09-.105.153-.134.062-.03.13-.038.195-.022l2.365.666c.148.042.25.176.25.328v.002l-.001 1.63a.75.75 0 00.908.73l1.838-.452c.245-.06.495.045.6.275l.488 1.077a.64.64 0 01-.06.708l-.517.585a.759.759 0 01-.63.26h-.003c-.349 0-1.037-.168-1.92-.533a6.797 6.797 0 01-3.218-3.218c-.365-.883-.534-1.571-.534-1.92v-.002c0-.236.09-.457.26-.63l.585-.517a.64.64 0 01.709-.06l1.076.488c.23.104.336.353.276.6z"/>
            </svg>
            Hubungi Admin
          </a>
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactAdminModal;