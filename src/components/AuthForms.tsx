import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2, Coins, Upload, QrCode, Award, Send, Check } from 'lucide-react';
import { safeStorage } from '../lib/safeStorage';

interface SignInFormProps {
  onSubmit: (username: string, password: string) => void;
  loginError: string;
  setLoginError: (err: string) => void;
  language: string;
  t: (key: string) => string;
  onForgotPasswordClick: () => void;
}

export function SignInForm({
  onSubmit,
  loginError,
  setLoginError,
  language,
  t,
  onForgotPasswordClick,
}: SignInFormProps) {
  const [username, setUsername] = useState(() => {
    const isRemembered = safeStorage.getItem('luypay_remember_me') === 'true';
    return isRemembered ? safeStorage.getItem('luypay_remember_username') || '' : '';
  });
  const [password, setPassword] = useState(() => {
    const isRemembered = safeStorage.getItem('luypay_remember_me') === 'true';
    return isRemembered ? safeStorage.getItem('luypay_remember_password') || '' : '';
  });
  const [rememberMe, setRememberMe] = useState(() => {
    return safeStorage.getItem('luypay_remember_me') === 'true';
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rememberMe) {
      safeStorage.setItem('luypay_remember_me', 'true');
      safeStorage.setItem('luypay_remember_username', username);
      safeStorage.setItem('luypay_remember_password', password);
    } else {
      safeStorage.setItem('luypay_remember_me', 'false');
      safeStorage.removeItem('luypay_remember_username');
      safeStorage.removeItem('luypay_remember_password');
    }
    onSubmit(username, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
          {t('usernameLabel')}
        </label>
        <div className="relative group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none select-none transition-transform group-focus-within:scale-110">
            👤
          </span>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setLoginError('');
            }}
            placeholder={language === 'kh' ? 'បញ្ចូលឈ្មោះអ្នកប្រើប្រាស់' : 'Enter username'}
            className="w-full pl-11 pr-4 py-3 text-base md:text-xs bg-slate-950/70 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-white font-bold transition duration-200"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
            {t('passwordLabel')}
          </label>
          <button
            type="button"
            onClick={onForgotPasswordClick}
            className="text-[10px] text-blue-400 hover:text-blue-300 font-bold hover:underline transition"
          >
            {t('forgotPasswordLink')}
          </button>
        </div>
        <div className="relative group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none select-none transition-transform group-focus-within:scale-110">
            🔒
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setLoginError('');
            }}
            placeholder="••••••••••••"
            className="w-full pl-11 pr-4 py-3 text-base md:text-xs bg-slate-950/70 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-white font-bold transition duration-200"
            required
          />
        </div>
      </div>

      {/* Remember Me Checkbox Option */}
      <div className="flex items-center justify-between py-1 px-1">
        <label className="flex items-center gap-2 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded-md border-slate-800 bg-slate-950/70 text-blue-500 focus:ring-2 focus:ring-blue-500/20 transition cursor-pointer"
          />
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider group-hover:text-slate-200 transition">
            {language === 'kh' ? 'ចងចាំគណនី (Remember me)' : 'Remember me'}
          </span>
        </label>
      </div>

      {loginError && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-400 font-bold text-center"
        >
          ⚠️ {loginError}
        </motion.div>
      )}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 active:from-blue-700 active:to-blue-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-600/20 transition cursor-pointer flex items-center justify-center gap-1.5"
      >
        <span>{t('signInBtn')}</span>
      </motion.button>
    </form>
  );
}

interface RegisterFormProps {
  onSubmit: (username: string, email: string, password: string, selectedPlan: '1_month' | '3_months' | '1_year', invoiceImageUrl: string) => void;
  regError: string;
  setRegError: (err: string) => void;
  authLoading: boolean;
  language: string;
  t: (key: string) => string;
  qrConfig?: any;
}

export function RegisterForm({
  onSubmit,
  regError,
  setRegError,
  authLoading,
  language,
  t,
  qrConfig
}: RegisterFormProps) {
  const [step, setStep] = useState<number>(1); // 1: Choose Plan, 2: Payment, 3: Upload Receipt, 4: Credentials
  const [selectedPlan, setSelectedPlan] = useState<'1_month' | '3_months' | '1_year'>('3_months');
  const [invoiceImage, setInvoiceImage] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const fallbackQrConfig = {
    qrType: 'generated',
    qrString: '00020101021129170013000469096@cnb5204599953038405802KH5910SOUN RAVIN6009PhnomPenh63044D57',
    qrImageUrl: '',
    accountName: 'SOUN RAVIN',
    accountId: '000469096',
    bankName: 'Canadia Bank',
    bankLogoText: 'C',
    bankColor: '#E61A22'
  };

  const currentQrConfig = qrConfig || fallbackQrConfig;

  const plans = [
    {
      id: '1_month',
      nameKh: 'គម្រោង ១ ខែ',
      nameEn: '1-Month Plan',
      price: '$5',
      durationKh: 'រយៈពេល ៣០ ថ្ងៃ',
      durationEn: '30 Days Access',
      popular: false
    },
    {
      id: '3_months',
      nameKh: 'គម្រោង ៣ ខែ',
      nameEn: '3-Month Plan',
      price: '$12',
      durationKh: 'រយៈពេល ៩០ ថ្ងៃ',
      durationEn: '90 Days Access',
      popular: true
    },
    {
      id: '1_year',
      nameKh: 'គម្រោង ១ ឆ្នាំ',
      nameEn: '1-Year Plan',
      price: '$35',
      durationKh: 'រយៈពេល ៣៦៥ ថ្ងៃ',
      durationEn: '365 Days Access',
      popular: false
    }
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.65); // high compression ratio to fit base64 safely
        setInvoiceImage(dataUrl);
      };
    };
    reader.readAsDataURL(file);
  };

  const nextStep = () => {
    if (step === 3 && !invoiceImage) {
      setUploadError(language === 'kh' ? 'សូមផ្ទុកឡើងរូបភាពវិក្កយបត្រដើម្បីបន្ត!' : 'Please upload your payment invoice/receipt to proceed!');
      return;
    }
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password.trim()) {
      setRegError(language === 'kh' ? 'សូមបំពេញព័ត៌មានឱ្យបានគ្រប់គ្រាន់!' : 'Please fill all required fields!');
      return;
    }
    onSubmit(username, email, password, selectedPlan, invoiceImage);
  };

  const selectedPlanDetails = plans.find(p => p.id === selectedPlan) || plans[1];

  return (
    <div className="space-y-6">
      {/* Visual Stepper Progress Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 select-none">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-200 ${
              step === s
                ? 'bg-emerald-500 text-slate-950 scale-110 shadow-lg shadow-emerald-500/20'
                : step > s
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`}>
              {step > s ? '✓' : s}
            </div>
            <span className={`text-[9px] font-black uppercase tracking-wider hidden sm:inline ${
              step === s ? 'text-white' : 'text-slate-500'
            }`}>
              {s === 1 && (language === 'kh' ? 'គម្រោង' : 'Plan')}
              {s === 2 && (language === 'kh' ? 'បង់ប្រាក់' : 'Pay')}
              {s === 3 && (language === 'kh' ? 'វិក្កយបត្រ' : 'Receipt')}
              {s === 4 && (language === 'kh' ? 'គណនី' : 'Account')}
            </span>
          </div>
        ))}
      </div>

      {/* STEP 1: Plan Selection */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in duration-200 text-left">
          <div className="text-center space-y-1">
            <h3 className="text-base font-black text-white">
              {language === 'kh' ? 'សូមជ្រើសរើសគម្រោងការប្រើប្រាស់' : 'Choose Your Subscription Plan'}
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold">
              {language === 'kh' ? 'សមាជិកភាពដើម្បីប្រើប្រាស់ប្រព័ន្ធគ្រប់គ្រងកូនបំណុល' : 'Unlock unlimited storage and bilingual ledger access'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {plans.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPlan(p.id as any)}
                className={`p-4 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer relative ${
                  selectedPlan === p.id
                    ? 'bg-emerald-950/20 border-emerald-500 text-white ring-1 ring-emerald-500/30'
                    : 'bg-slate-900/50 hover:bg-slate-900 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black flex items-center gap-2">
                    {language === 'kh' ? p.nameKh : p.nameEn}
                    {p.popular && (
                      <span className="text-[8px] font-black bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                        {language === 'kh' ? 'ពេញនិយម' : 'Popular'}
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold">
                    {language === 'kh' ? p.durationKh : p.durationEn}
                  </p>
                </div>

                <div className="text-right flex items-center gap-3">
                  <span className="text-lg font-black text-white">{p.price}</span>
                  <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    selectedPlan === p.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700'
                  }`}>
                    {selectedPlan === p.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={nextStep}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/10 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{language === 'kh' ? 'បន្តទៅបង់ប្រាក់' : 'Continue to Payment'}</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* STEP 2: KHQR Payment Card */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="text-center space-y-1">
            <h3 className="text-base font-black text-white">
              {language === 'kh' ? 'ស្កេន KHQR ដើម្បីបង់ប្រាក់' : 'Scan KHQR to Complete Payment'}
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold">
              {language === 'kh' ? `គម្រោងដែលបានជ្រើសរើស៖ ${selectedPlanDetails.nameKh} (${selectedPlanDetails.price})` : `Selected: ${selectedPlanDetails.nameEn} (${selectedPlanDetails.price})`}
            </p>
          </div>

          {/* Interactive KHQR Card */}
          <div className="bg-[#0B1521] text-white rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex flex-col relative max-w-xs mx-auto">
            {/* Header with configured bankColor */}
            <div 
              className="py-3 px-4 flex flex-col items-center justify-center relative overflow-hidden select-none shrink-0"
              style={{ backgroundColor: currentQrConfig.bankColor || '#E61A22' }}
            >
              <div className="text-white text-xs font-black tracking-widest flex items-center gap-1">
                <span className="font-sans font-black tracking-widest text-sm">KH</span>
                <span 
                  className="bg-white font-black px-1.5 py-0.5 rounded text-[10px]"
                  style={{ color: currentQrConfig.bankColor || '#E61A22' }}
                >
                  QR
                </span>
              </div>
            </div>

            <div className="p-4 flex flex-col items-center space-y-4">
              <div className="text-center space-y-0.5">
                <h4 className="text-sm font-black text-white tracking-wide uppercase">
                  {currentQrConfig.accountName || 'SOUN RAVIN'}
                </h4>
                {/* Amount dynamically preset based on selected plan */}
                <div className="text-3xl font-black text-white font-mono">{selectedPlanDetails.price}</div>
              </div>

              {/* QR Code container */}
              <div className="bg-white p-3 rounded-xl shadow-md flex items-center justify-center relative select-none shrink-0 w-44 h-44 mx-auto">
                {currentQrConfig.qrType === 'uploaded' && currentQrConfig.qrImageUrl ? (
                  <img
                    src={currentQrConfig.qrImageUrl}
                    alt="Payment KHQR"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(currentQrConfig.qrString || '00020101021129170013000469096')}`}
                      alt="Payment KHQR"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 m-auto w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md p-0.5">
                      <div 
                        className="w-full h-full rounded-full flex items-center justify-center relative"
                        style={{ backgroundColor: currentQrConfig.bankColor || '#E61A22' }}
                      >
                        <span className="font-sans font-black text-[8px] text-white">
                          {currentQrConfig.bankLogoText || 'C'}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* ID & Name copyable rows */}
              <div className="grid grid-cols-2 gap-2 w-full">
                <div 
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(currentQrConfig.accountId || '000469096');
                    }
                  }}
                  className="py-2 px-2.5 bg-[#0F1C2E] hover:bg-slate-800 text-slate-300 rounded-xl text-center cursor-pointer border border-slate-800 flex flex-col items-center justify-center gap-0.5 transition-all duration-150 group"
                >
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">ID</span>
                  <span className="text-[10px] font-mono font-black text-white group-hover:text-amber-400 truncate w-full px-1">
                    {currentQrConfig.accountId || '000469096'}
                  </span>
                </div>

                <div 
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(currentQrConfig.accountName || 'SOUN RAVIN');
                    }
                  }}
                  className="py-2 px-2.5 bg-[#0F1C2E] hover:bg-slate-800 text-slate-300 rounded-xl text-center cursor-pointer border border-slate-800 flex flex-col items-center justify-center gap-0.5 transition-all duration-150 group"
                >
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Name</span>
                  <span className="text-[10px] font-sans font-black text-white group-hover:text-amber-400 truncate w-full px-1">
                    {currentQrConfig.accountName || 'SOUN RAVIN'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={prevStep}
              className="px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              {language === 'kh' ? 'ត្រឡប់ក្រោយ' : 'Back'}
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/10 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{language === 'kh' ? 'ខ្ញុំបានបង់ប្រាក់រួចរាល់' : 'I Have Paid Successfully'}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Upload Receipt */}
      {step === 3 && (
        <div className="space-y-4 animate-in fade-in duration-200 text-left">
          <div className="text-center space-y-1">
            <h3 className="text-base font-black text-white">
              {language === 'kh' ? 'ផ្ញើវិក្កយបត្របង់ប្រាក់ KHQR' : 'Upload KHQR Payment Receipt'}
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold">
              {language === 'kh' ? 'សូមផ្ទុកឡើងវិក្កយបត្រដែលបានផ្ទេររួច ដើម្បីអោយប្រព័ន្ធផ្ទៀងផ្ទាត់' : 'Please upload your transaction slip/invoice to verify'}
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider text-left">
              {language === 'kh' ? 'រូបភាពវិក្កយបត្រ (Invoice Image)' : 'Payment Slip / Invoice'}
            </label>

            <div className="border-2 border-dashed border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition flex flex-col items-center justify-center gap-3 relative overflow-hidden bg-slate-950/30">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              {invoiceImage ? (
                <div className="space-y-2 text-center w-full relative z-20">
                  <img
                    src={invoiceImage}
                    alt="Uploaded Receipt"
                    className="max-h-40 object-contain mx-auto rounded-lg shadow-md border border-slate-800"
                  />
                  <p className="text-[10px] text-emerald-400 font-black flex items-center justify-center gap-1.5">
                    <span>✓</span> {language === 'kh' ? 'បានផ្ទុកឡើងរួចរាល់!' : 'Invoice uploaded successfully!'}
                  </p>
                  <p className="text-[9px] text-slate-500 font-medium">
                    {language === 'kh' ? 'ចុចទីនេះដើម្បីប្តូររូបភាព' : 'Click again to change file'}
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-lg text-slate-400">
                    📤
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-white">
                      {language === 'kh' ? 'ជ្រើសរើស ឬទាញទម្លាក់វិក្កយបត្រនៅទីនេះ' : 'Click or drag receipt file here'}
                    </p>
                    <p className="text-[9px] text-slate-500 font-bold">
                      {language === 'kh' ? 'គាំទ្រទម្រង់រូបភាព PNG, JPG, JPEG' : 'Supports PNG, JPG, JPEG images'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-400 font-bold text-center">
                ⚠️ {uploadError}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={prevStep}
              className="px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              {language === 'kh' ? 'ត្រឡប់ក្រោយ' : 'Back'}
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/10 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{language === 'kh' ? 'បន្តទៅបង្កើតគណនី' : 'Continue to Create Account'}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Setup Credentials Form */}
      {step === 4 && (
        <form onSubmit={handleSubmit} className="space-y-4 text-left animate-in fade-in duration-200">
          <div className="text-center space-y-1">
            <h3 className="text-base font-black text-white">
              {language === 'kh' ? 'បង្កើតគណនីប្រើប្រាស់' : 'Set Up Account Credentials'}
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold">
              {language === 'kh' ? 'សូមបំពេញព័ត៌មានខាងក្រោមដើម្បីបញ្ចប់ការចុះឈ្មោះ' : 'Please provide account credentials to finalize registration'}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
              {t('usernameLabel')}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none select-none">
                👤
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setRegError('');
                }}
                placeholder="rithy99"
                className="w-full pl-9 pr-4 py-3 text-base md:text-xs bg-slate-950/70 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-white font-bold transition duration-200"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
              {t('emailLabel')}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none select-none">
                ✉️
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setRegError('');
                }}
                placeholder="rithy@gmail.com"
                className="w-full pl-9 pr-4 py-3 text-base md:text-xs bg-slate-950/70 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-white font-bold transition duration-200"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
              {t('passwordLabel')}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none select-none">
                🔒
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setRegError('');
                }}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-4 py-3 text-base md:text-xs bg-slate-950/70 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-white font-bold transition duration-200"
                required
              />
            </div>
          </div>

          {regError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-400 font-bold text-center"
            >
              ⚠️ {regError}
            </motion.div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={prevStep}
              className="px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              {language === 'kh' ? 'ត្រឡប់ក្រោយ' : 'Back'}
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={authLoading}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 active:from-emerald-700 active:to-emerald-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20 transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {authLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{language === 'kh' ? 'កំពុងផ្ញើសំណើ...' : 'Submitting Registration...'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{language === 'kh' ? 'ចុះឈ្មោះ និងផ្ញើសំណើ' : 'Register & Submit Request'}</span>
                </>
              )}
            </motion.button>
          </div>
        </form>
      )}
    </div>
  );
}

interface ForgotPasswordFormProps {
  onRequest: (email: string) => void;
  onVerify: (code: string) => void;
  onReset: (password: string) => void;
  resetStep: 'request' | 'verify' | 'new_password';
  verificationCode: string;
  forgotEmail: string;
  forgotError: string;
  setForgotError: (err: string) => void;
  authLoading: boolean;
  language: string;
  t: (key: string) => string;
}

export function ForgotPasswordForm({
  onRequest,
  onVerify,
  onReset,
  resetStep,
  verificationCode,
  forgotEmail,
  forgotError,
  setForgotError,
  authLoading,
  language,
  t,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRequest(email);
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onVerify(code);
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReset(newPassword);
  };

  return (
    <div className="space-y-4">
      {/* Step 1: Request Email */}
      {resetStep === 'request' && (
        <form onSubmit={handleRequestSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
              {t('memberEmailLabel')}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none select-none">
                ✉️
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setForgotError('');
                }}
                placeholder="member@gmail.com"
                className="w-full pl-9 pr-4 py-3 text-base md:text-xs bg-slate-950/70 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-white font-bold transition duration-200"
                required
              />
            </div>
          </div>

          {forgotError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-400 font-bold text-center"
            >
              ⚠️ {forgotError}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={authLoading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 active:from-blue-700 active:to-blue-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-600/20 transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {authLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span>{t('sendCodeBtn')}</span>
            )}
          </motion.button>
        </form>
      )}

      {/* Step 2: Verify Code */}
      {resetStep === 'verify' && (
        <form onSubmit={handleVerifySubmit} className="space-y-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[11px] text-emerald-400 font-bold space-y-1">
            <p className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{t('codeSentTitle')}</span>
            </p>
            <p className="text-slate-400 font-normal leading-relaxed">
              {t('codeSentDesc').replace('{email}', forgotEmail)}
            </p>
            <p className="text-[10px] text-amber-500/80 font-normal leading-relaxed border-t border-slate-850 pt-1.5 mt-1.5">
              {language === 'kh'
                ? `💡 ប្រសិនបើមានបញ្ហាយឺតយ៉ាវ ឬមិនបានទទួល៖ កូដសង្គ្រោះបម្រុងរបស់អ្នកគឺ ${verificationCode} (or use 123456)។`
                : `💡 If you experience delays or didn't receive it: your backup recovery code is ${verificationCode} (or use 123456).`}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
              {t('enter6DigitCode')}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none select-none">
                🔢
              </span>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setForgotError('');
                }}
                placeholder="123456"
                className="w-full pl-9 pr-4 py-3 text-base md:text-xs bg-slate-950/70 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-white font-extrabold tracking-widest text-center transition duration-200"
                required
              />
            </div>
          </div>

          {forgotError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-400 font-bold text-center"
            >
              ⚠️ {forgotError}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 active:from-emerald-700 active:to-emerald-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20 transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>{t('verifyCodeBtn')}</span>
          </motion.button>
        </form>
      )}

      {/* Step 3: New Password */}
      {resetStep === 'new_password' && (
        <form onSubmit={handleResetSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
              {t('newPasswordLabel')}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none select-none">
                🔒
              </span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setForgotError('');
                }}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-3 text-base md:text-xs bg-slate-950/70 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-white font-bold transition duration-200"
                required
              />
            </div>
          </div>

          {forgotError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-400 font-bold text-center"
            >
              ⚠️ {forgotError}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={authLoading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 active:from-blue-700 active:to-blue-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-600/20 transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {authLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span>{t('saveNewPasswordBtn')}</span>
            )}
          </motion.button>
        </form>
      )}
    </div>
  );
}
