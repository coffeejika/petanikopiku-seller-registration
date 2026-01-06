
import React, { useState, useCallback, useEffect } from 'react';
import { CoffeeIcon, UserIcon, ShieldIcon, CheckIcon, BotIcon } from './components/Icons';
import { RegistrationData, Step } from './types';
import { getSellerAssistance, generateProfessionalSummary } from './services/geminiService';

const ADMIN_WA_NUMBER = "+6287725071919";

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('profile');
  const [data, setData] = useState<RegistrationData>({
    profile: { fullName: '', phone: '', email: '', address: '', province: '', regency: '' },
    store: { storeName: '', storeAddress: '', annualSales: '' },
    verification: { ktpNumber: '', ktpPhoto: null, ktpPhotoPreview: null }
  });

  const [aiResponse, setAiResponse] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: 'Profil Penjual', icon: <UserIcon className="w-5 h-5" /> },
    { key: 'store', label: 'Rincian Toko', icon: <CoffeeIcon className="w-5 h-5" /> },
    { key: 'verification', label: 'Verifikasi Keamanan', icon: <ShieldIcon className="w-5 h-5" /> },
  ];

  const updateProfile = (fields: Partial<RegistrationData['profile']>) => {
    setData(prev => ({ ...prev, profile: { ...prev.profile, ...fields } }));
  };

  const updateStore = (fields: Partial<RegistrationData['store']>) => {
    setData(prev => ({ ...prev, store: { ...prev.store, ...fields } }));
  };

  const updateVerification = (fields: Partial<RegistrationData['verification']>) => {
    setData(prev => ({ ...prev, verification: { ...prev.verification, ...fields } }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateVerification({ ktpPhoto: file, ktpPhotoPreview: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (currentStep === 'profile') setCurrentStep('store');
    else if (currentStep === 'store') setCurrentStep('verification');
    else if (currentStep === 'verification') setCurrentStep('summary');
  };

  const handleBack = () => {
    if (currentStep === 'store') setCurrentStep('profile');
    else if (currentStep === 'verification') setCurrentStep('store');
    else if (currentStep === 'summary') setCurrentStep('verification');
  };

  const askAI = async () => {
    setIsAiLoading(true);
    const context = `Seller is at step ${currentStep}. Data so far: ${JSON.stringify(data[currentStep === 'summary' ? 'profile' : currentStep])}`;
    const res = await getSellerAssistance("Jelaskan langkah ini dan apa yang harus saya siapkan sebagai pemilik toko?", context);
    setAiResponse(res);
    setIsAiLoading(false);
  };

  const submitToWhatsApp = async () => {
    setIsSubmitting(true);
    const professionalSummary = await generateProfessionalSummary(data);
    
    const baseMessage = professionalSummary || `
*Pendaftaran Mitra Penjual Baru - Petanikopiku*

*Profil Penjual:*
- Nama: ${data.profile.fullName}
- No. HP: ${data.profile.phone}
- Domisili: ${data.profile.regency}, ${data.profile.province}

*Rincian Toko:*
- Nama Toko: ${data.store.storeName}
- Alamat Toko: ${data.store.storeAddress}
- Estimasi Penjualan: ${data.store.annualSales} kg/tahun

*Verifikasi:*
- No KTP: ${data.verification.ktpNumber}
    `.trim();

    const encodedMessage = encodeURIComponent(baseMessage);
    const waLink = `https://wa.me/${ADMIN_WA_NUMBER.replace('+', '')}?text=${encodedMessage}`;
    
    window.open(waLink, '_blank');
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4 bg-[#fdfbf7]">
      {/* Header */}
      <div className="w-full max-w-2xl mb-10 text-center">
        <div className="flex justify-center items-center gap-2 mb-2">
          <div className="p-2 bg-emerald-800 rounded-lg text-white">
            <CoffeeIcon className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">Petanikopiku</h1>
        </div>
        <p className="text-emerald-700/80 font-medium">Registrasi Mitra Strategis Penjual Kopi</p>
      </div>

      {/* Progress Stepper */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex justify-between relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-emerald-100 -translate-y-1/2 z-0"></div>
          {steps.map((s, idx) => {
            const isActive = currentStep === s.key;
            const isCompleted = steps.findIndex(st => st.key === currentStep) > idx || currentStep === 'summary';
            return (
              <div key={s.key} className="relative z-10 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isActive ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 
                  isCompleted ? 'bg-green-500 text-white' : 'bg-white border-2 border-emerald-200 text-emerald-300'
                }`}>
                  {isCompleted ? <CheckIcon className="w-6 h-6" /> : s.icon}
                </div>
                <span className={`text-[10px] mt-2 font-bold uppercase tracking-wider ${isActive ? 'text-emerald-800' : 'text-emerald-400'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl shadow-emerald-900/5 p-8 border border-emerald-50 relative overflow-hidden">
        
        {/* Step 1: Profile */}
        {currentStep === 'profile' && (
          <div className="step-transition">
            <h2 className="text-xl font-bold text-emerald-900 mb-6">Informasi Dasar Penjual</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-emerald-800 ml-1">Nama Lengkap Sesuai KTP</label>
                <input 
                  type="text"
                  value={data.profile.fullName}
                  onChange={e => updateProfile({ fullName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="Contoh: Budi Santoso"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-emerald-800 ml-1">Nomor WhatsApp</label>
                <input 
                  type="tel"
                  value={data.profile.phone}
                  onChange={e => updateProfile({ phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="62812xxx"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-semibold text-emerald-800 ml-1">Alamat Domisili</label>
                <textarea 
                  value={data.profile.address}
                  onChange={e => updateProfile({ address: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all h-24"
                  placeholder="Nama Jalan, No. Rumah, Desa/Kelurahan"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-emerald-800 ml-1">Provinsi</label>
                <input 
                  type="text"
                  value={data.profile.province}
                  onChange={e => updateProfile({ province: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="Sumatera Selatan"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-emerald-800 ml-1">Kabupaten/Kota</label>
                <input 
                  type="text"
                  value={data.profile.regency}
                  onChange={e => updateProfile({ regency: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="Lahat"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Store */}
        {currentStep === 'store' && (
          <div className="step-transition">
            <h2 className="text-xl font-bold text-emerald-900 mb-6">Informasi Toko Kopi</h2>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-emerald-800 ml-1">Nama Toko</label>
                <input 
                  type="text"
                  value={data.store.storeName}
                  onChange={e => updateStore({ storeName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="Contoh: Kopi Jaya Makmur"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-emerald-800 ml-1">Alamat Lengkap Toko</label>
                <textarea 
                  value={data.store.storeAddress}
                  onChange={e => updateStore({ storeAddress: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all h-24"
                  placeholder="Alamat operasional toko..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-emerald-800 ml-1">Estimasi Penjualan Per Tahun (Kg)</label>
                <input 
                  type="number"
                  value={data.store.annualSales}
                  onChange={e => updateStore({ annualSales: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="Misal: 1000"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Verification */}
        {currentStep === 'verification' && (
          <div className="step-transition">
            <h2 className="text-xl font-bold text-emerald-900 mb-6">Verifikasi Identitas Penjual</h2>
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-emerald-800 ml-1">Nomor NIK KTP (16 Digit)</label>
                <input 
                  type="text"
                  maxLength={16}
                  value={data.verification.ktpNumber}
                  onChange={e => updateVerification({ ktpNumber: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="16 digit nomor induk kependudukan"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-emerald-800 ml-1">Foto KTP Asli</label>
                <div className={`relative w-full h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                  data.verification.ktpPhotoPreview ? 'border-green-400 bg-green-50' : 'border-emerald-200 bg-emerald-50'
                }`}>
                  {data.verification.ktpPhotoPreview ? (
                    <div className="relative w-full h-full p-2">
                      <img src={data.verification.ktpPhotoPreview} alt="KTP Preview" className="w-full h-full object-contain rounded-lg" />
                      <button 
                        onClick={() => updateVerification({ ktpPhoto: null, ktpPhotoPreview: null })}
                        className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <ShieldIcon className="w-12 h-12 text-emerald-300 mb-2" />
                      <p className="text-emerald-600 text-sm font-medium">Klik untuk Unggah Foto KTP</p>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      />
                    </>
                  )}
                </div>
                <p className="text-[10px] text-emerald-500 italic">*Data Anda aman dan hanya digunakan untuk verifikasi mitra internal.</p>
              </div>
            </div>
          </div>
        )}

        {/* Final Step: Summary */}
        {currentStep === 'summary' && (
          <div className="step-transition">
            <h2 className="text-xl font-bold text-emerald-900 mb-4">Konfirmasi Pendaftaran</h2>
            <div className="bg-emerald-50 rounded-2xl p-6 mb-6 space-y-4 border border-emerald-100">
              <div className="flex justify-between items-center border-b border-emerald-200 pb-2">
                <span className="text-sm text-emerald-700 font-medium">Nama Penjual</span>
                <span className="text-sm text-emerald-900 font-bold">{data.profile.fullName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-emerald-200 pb-2">
                <span className="text-sm text-emerald-700 font-medium">Nama Toko</span>
                <span className="text-sm text-emerald-900 font-bold">{data.store.storeName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-emerald-200 pb-2">
                <span className="text-sm text-emerald-700 font-medium">Estimasi Sales</span>
                <span className="text-sm text-emerald-900 font-bold">{data.store.annualSales} kg/tahun</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-emerald-700 font-medium">Status Dokumen</span>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-bold uppercase">Terunggah</span>
              </div>
            </div>
            <p className="text-sm text-emerald-800 mb-6 text-center">
              Informasi Toko Anda akan dikirimkan langsung ke admin melalui WhatsApp untuk verifikasi instan.
            </p>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="mt-10 flex gap-4">
          {currentStep !== 'profile' && (
            <button 
              onClick={handleBack}
              className="flex-1 py-4 px-6 rounded-2xl font-bold text-emerald-700 border-2 border-emerald-100 hover:bg-emerald-50 transition-all"
            >
              Kembali
            </button>
          )}
          {currentStep !== 'summary' ? (
            <button 
              onClick={handleNext}
              className="flex-[2] py-4 px-6 rounded-2xl font-bold text-white bg-emerald-800 hover:bg-emerald-900 shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
            >
              Lanjutkan
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          ) : (
            <button 
              onClick={submitToWhatsApp}
              disabled={isSubmitting}
              className="flex-[2] py-4 px-6 rounded-2xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Ke WhatsApp Admin'}
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.012 2c-5.508 0-9.987 4.479-9.987 9.987 0 1.763.459 3.419 1.264 4.859L2 22l5.313-1.393a9.92 9.92 0 004.699 1.18c5.508 0 9.987-4.479 9.987-9.987s-4.479-9.987-9.987-9.987zm5.727 14.126c-.235.666-1.353 1.221-1.861 1.295-.469.068-.469.315-2.731-.588-2.261-.903-3.708-3.197-3.819-3.344-.112-.147-.91-1.21-.91-2.308s.574-1.637.778-1.859c.204-.222.444-.278.593-.278s.296.002.426.006c.141.004.33-.053.515.393.193.463.66 1.61.716 1.722.056.112.093.24.018.389-.074.148-.112.241-.222.371-.112.13-.235.291-.334.391-.112.112-.229.234-.1.455.129.222.571.94 1.228 1.524.847.754 1.56.987 1.782 1.098.222.112.352.093.481-.056.13-.148.556-.648.704-.87.148-.222.296-.185.5-.112.204.074 1.295.611 1.517.722s.37.166.426.259c.056.093.056.537-.179 1.203z"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* AI Assistant FAB */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 max-w-[300px]">
        {aiResponse && (
          <div className="bg-white p-4 rounded-2xl shadow-xl border border-emerald-100 text-sm text-emerald-900 relative">
            <button 
              onClick={() => setAiResponse('')}
              className="absolute -top-2 -right-2 bg-emerald-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs"
            >
              ✕
            </button>
            <p className="font-bold text-emerald-700 mb-1 flex items-center gap-1">
              <BotIcon className="w-4 h-4" /> AI Asisten:
            </p>
            {aiResponse}
          </div>
        )}
        <button 
          onClick={askAI}
          disabled={isAiLoading}
          className="w-14 h-14 bg-emerald-800 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all group overflow-hidden"
        >
          {isAiLoading ? (
             <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          ) : (
            <BotIcon className="w-7 h-7" />
          )}
          <span className="absolute right-full mr-3 bg-emerald-900 text-white px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Butuh Bantuan?
          </span>
        </button>
      </div>
    </div>
  );
};

export default App;
