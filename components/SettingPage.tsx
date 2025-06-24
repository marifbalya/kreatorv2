
import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { ApiKeyEntry, OpenRouterApiKeyEntry, DisplayCreditType } from '../types';
import { getApiKeys, saveApiKey, deleteApiKey, setActiveApiKey } from '../services/apiKeyService';
import { getOpenRouterApiKeys, setActiveOpenRouterApiKey } from '../services/openRouterService';
import ServerIcon from './icons/ServerIcon'; // Import ServerIcon
import CustomSelect from './CustomSelect';
import { DISPLAY_CREDIT_TYPE_OPTIONS, ADMIN_CODE_CREDIT_MAP } from '../constants';

interface SettingPageProps {
  userApiKeys: ApiKeyEntry[]; // Received from App.tsx
  updateUserApiKeys: (keys: ApiKeyEntry[]) => void; // Callback to update App.tsx state
}

const SettingPage: React.FC<SettingPageProps> = ({ userApiKeys, updateUserApiKeys }) => {
  const [isKreatorAiModalOpen, setIsKreatorAiModalOpen] = useState<boolean>(false);
  const [kreatorAiModalMode, setKreatorAiModalMode] = useState<'add' | 'edit'>('add');
  const [currentEditingKreatorAiKey, setCurrentEditingKreatorAiKey] = useState<ApiKeyEntry | null>(null);
  const [formKreatorAiName, setFormKreatorAiName] = useState<string>('');
  const [formKreatorAiKey, setFormKreatorAiKey] = useState<string>('');
  const [formDisplayCreditType, setFormDisplayCreditType] = useState<DisplayCreditType>(DISPLAY_CREDIT_TYPE_OPTIONS[0].value);
  const [formAdminCode, setFormAdminCode] = useState<string>('');
  const [showKreatorAiKeyValue, setShowKreatorAiKeyValue] = useState<Record<string, boolean>>({});

  const [serverAiApiKeys, setServerAiApiKeys] = useState<OpenRouterApiKeyEntry[]>([]);

  const loadServerAiApiKeys = useCallback(() => {
    setServerAiApiKeys(getOpenRouterApiKeys());
  }, []);

  useEffect(() => {
    loadServerAiApiKeys();
  }, [loadServerAiApiKeys]);

  const openKreatorAiModal = (mode: 'add' | 'edit', keyToEdit?: ApiKeyEntry) => {
    setKreatorAiModalMode(mode);
    if (mode === 'edit' && keyToEdit) {
      setCurrentEditingKreatorAiKey(keyToEdit);
      setFormKreatorAiName(keyToEdit.name);
      setFormKreatorAiKey(keyToEdit.key);
      setFormDisplayCreditType(keyToEdit.displayCreditType);
      setFormAdminCode(keyToEdit.adminCode || '');
    } else {
      setCurrentEditingKreatorAiKey(null);
      setFormKreatorAiName('');
      setFormKreatorAiKey('');
      setFormDisplayCreditType(DISPLAY_CREDIT_TYPE_OPTIONS[0].value);
      setFormAdminCode('');
    }
    setIsKreatorAiModalOpen(true);
  };

  const closeKreatorAiModal = () => {
    setIsKreatorAiModalOpen(false);
  };

  const handleSaveKreatorAiKey = () => {
    if (!formKreatorAiName.trim() || !formKreatorAiKey.trim()) {
      alert("Nama Kredit dan Kode Kredit KreatorAI tidak boleh kosong.");
      return;
    }
    if (formDisplayCreditType === 'custom' && !formAdminCode.trim()) {
      alert("Kode Kredit tidak boleh kosong untuk tipe Custom Kredit.");
      return;
    }
    if (formDisplayCreditType === 'custom' && !ADMIN_CODE_CREDIT_MAP[formAdminCode.toUpperCase()]) {
        alert("Kode Kredit tidak valid. Periksa kembali kode yang Anda masukkan.");
        return;
    }

    const updatedKeys = saveApiKey(
      { 
        name: formKreatorAiName, 
        key: formKreatorAiKey, 
        displayCreditType: formDisplayCreditType,
        adminCode: formDisplayCreditType === 'custom' ? formAdminCode.toUpperCase() : undefined,
      }, 
      currentEditingKreatorAiKey?.id
    );
    updateUserApiKeys(updatedKeys); // Update state in App.tsx
    closeKreatorAiModal();
  };

  const handleDeleteKreatorAiKey = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus Kredit AI ini?")) {
      const updatedKeys = deleteApiKey(id);
      updateUserApiKeys(updatedKeys);
    }
  };

  const handleSetActiveKreatorAiKey = (id: string) => {
    const updatedKeys = setActiveApiKey(id);
    updateUserApiKeys(updatedKeys);
  };

  const toggleShowKreatorAiKey = (id: string) => {
    setShowKreatorAiKeyValue(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const obscureApiKey = (key: string) => {
    if (!key || key.length <= 8) return '********';
    return `${key.substring(0, 6)}...${key.substring(key.length - 4)}`;
  };

  const copyToClipboard = (text: string, type: string) => {
    if (!text) {
        alert(`Tidak ada ${type} untuk disalin.`);
        return;
    }
    navigator.clipboard.writeText(text)
      .then(() => alert(`${type} disalin ke clipboard!`))
      .catch(err => alert(`Gagal menyalin ${type}.`));
  };

  const handleSetActiveServerAiKey = (id: string) => {
    const updatedKeys = setActiveOpenRouterApiKey(id); 
    setServerAiApiKeys(updatedKeys);
  };

  const getDisplayCreditText = (key: ApiKeyEntry): string => {
    if (key.displayCreditType === 'free') {
      return "Gratis (Tanpa Batas Tampilan)";
    }
    if (key.initialDisplayCredit === 0) {
      return "Kode Admin Tidak Valid"; 
    }
    return `${key.currentDisplayCredit} / ${key.initialDisplayCredit} Kredit Tersisa`;
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-white text-center">Pengaturan KreatorAI</h2>

      <section className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl border border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h3 className="text-xl sm:text-2xl font-semibold text-indigo-400">Kredit AI</h3>
          <button
            onClick={() => openKreatorAiModal('add')}
            className="mt-3 sm:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
          >
            + Tambah Kredit
          </button>
        </div>

        {userApiKeys.length === 0 && (
          <div className="text-center py-6 px-4 bg-gray-700/50 rounded-md border border-yellow-600">
              <h4 className="text-lg font-semibold text-yellow-400 mb-1">Perhatian!</h4>
              <p className="text-gray-300 text-sm">
              Anda belum menambahkan Kredit AI. Fitur pembuatan Gambar, 3D, dan Video memerlukan Kredit ini.
              </p>
          </div>
        )}

        <div className="space-y-4">
          {userApiKeys.map((apiKey) => (
            <div key={apiKey.id} className={`p-3 sm:p-4 rounded-lg shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 ${apiKey.isActive ? 'bg-green-800/40 border border-green-500' : 'bg-gray-700/60 border border-gray-600'}`}>
              <div className="flex-grow space-y-1">
                <h4 className="text-md sm:text-lg font-semibold text-white">
                  {apiKey.name} 
                  {apiKey.isActive && apiKey.key && apiKey.key.trim() !== "" && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full ml-2 align-middle">Aktif</span>}
                  {(!apiKey.key || apiKey.key.trim() === "") && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full ml-2 align-middle">Kode Tidak Valid</span>}
                </h4>
                <div className="flex items-center gap-2 flex-wrap">
                   <p className="text-xs sm:text-sm text-gray-400 font-mono break-all" style={{ filter: showKreatorAiKeyValue[apiKey.id] || !apiKey.key ? 'none' : 'blur(3px)' }}>
                     {showKreatorAiKeyValue[apiKey.id] || !apiKey.key ? (apiKey.key || "Kode Kosong") : obscureApiKey(apiKey.key)}
                   </p>
                   {apiKey.key && apiKey.key.trim() !== "" && (
                      <>
                          <button onClick={() => toggleShowKreatorAiKey(apiKey.id)} className="text-xs text-indigo-400 hover:text-indigo-300">
                          {showKreatorAiKeyValue[apiKey.id] ? 'Sembunyikan' : 'Tampilkan'}
                          </button>
                          <button onClick={() => copyToClipboard(apiKey.key, 'Kode Kredit')} className="text-xs text-sky-400 hover:text-sky-300">
                          Salin
                          </button>
                      </>
                   )}
                </div>
                <p className="text-xs text-gray-400">Tampilan Kredit: {getDisplayCreditText(apiKey)}</p>
              </div>
              <div className="flex flex-shrink-0 gap-2 mt-2 md:mt-0 flex-wrap">
                {!apiKey.isActive && apiKey.key && apiKey.key.trim() !== "" && (
                  <button
                    onClick={() => handleSetActiveKreatorAiKey(apiKey.id)}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-1.5 px-3 rounded-md transition-colors"
                  >
                    Jadikan Aktif
                  </button>
                )}
                <button
                  onClick={() => openKreatorAiModal('edit', apiKey)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1.5 px-3 rounded-md transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteKreatorAiKey(apiKey.id)}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-1.5 px-3 rounded-md transition-colors"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl border border-gray-700">
        <h3 className="text-xl sm:text-2xl font-semibold text-teal-400 mb-4">Server AI</h3>
        <div className="bg-sky-800/30 border border-sky-700 p-3 rounded-md text-sm text-sky-300 mb-6">
          <p className="font-semibold">Informasi:</p>
          <p>Server AI ini digunakan untuk fitur Chatbot, Analisa Gambar, dan Optimasi Prompt. Ganti server jika fitur tersebut mengalami error atau tidak merespon.</p>
        </div>
        <div className="space-y-3">
          {serverAiApiKeys.map((serverKey) => (
            <div 
              key={serverKey.id} 
              className={`p-3 sm:p-4 rounded-lg shadow-md flex items-center justify-between gap-3 transition-all duration-300 ease-in-out
                          ${serverKey.isActive 
                            ? 'bg-cyan-700/50 border-2 border-cyan-500 ring-2 ring-cyan-500/50 transform scale-[1.01]' 
                            : 'bg-gray-700/60 border border-gray-600 hover:bg-gray-600/70'}`}
            >
              <div className="flex items-center gap-3">
                <ServerIcon className={`h-6 w-6 sm:h-8 sm:w-8 ${serverKey.isActive ? 'text-cyan-400' : 'text-gray-500'}`} />
                <div>
                  <h4 className={`text-sm sm:text-md font-semibold ${serverKey.isActive ? 'text-white' : 'text-gray-300'}`}>
                    {serverKey.name}
                  </h4>
                  {serverKey.isActive && (
                    <span className="text-xs bg-cyan-500 text-white px-2 py-0.5 rounded-full mt-1 inline-block">Aktif</span>
                  )}
                </div>
              </div>
              {!serverKey.isActive && (
                <button
                  onClick={() => handleSetActiveServerAiKey(serverKey.id)}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold py-2 px-3 sm:px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75"
                >
                  Aktifkan
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {isKreatorAiModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md space-y-4 border border-indigo-500">
            <h3 className="text-xl font-bold text-white">
              {kreatorAiModalMode === 'add' ? 'Tambah Kredit AI Baru' : 'Edit Kredit AI'}
            </h3>
            <div>
              <label htmlFor="modal-ws-name" className="block text-sm font-medium text-gray-300 mb-1">Nama Kredit</label>
              <input
                type="text" id="modal-ws-name" value={formKreatorAiName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormKreatorAiName(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Kredit Utama"
              />
            </div>
            <div>
              <label htmlFor="modal-ws-key" className="block text-sm font-medium text-gray-300 mb-1">Kode Kredit KreatorAI</label>
              <input
                type="password" id="modal-ws-key" value={formKreatorAiKey}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormKreatorAiKey(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Masukkan Kode Kredit KreatorAI..."
              />
            </div>
            <CustomSelect
                label="Tipe Kode Kredit"
                id="display-credit-type"
                options={DISPLAY_CREDIT_TYPE_OPTIONS}
                value={formDisplayCreditType}
                onChange={(e) => setFormDisplayCreditType(e.target.value as DisplayCreditType)}
            />
            {formDisplayCreditType === 'custom' && (
                <div>
                    <label htmlFor="modal-admin-code" className="block text-sm font-medium text-gray-300 mb-1">Kode Kredit</label>
                    <input
                        type="text" id="modal-admin-code" value={formAdminCode}
                        onChange={(e) => setFormAdminCode(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Isi Kode dari Admin"
                    />
                     <p className="text-xs text-gray-400 mt-1">Kode ini menentukan nominal kredit tampilan awal. Pastikan kode valid.</p>
                </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={closeKreatorAiModal}
                className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button onClick={handleSaveKreatorAiKey}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingPage;
