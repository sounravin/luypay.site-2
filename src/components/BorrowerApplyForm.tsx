import React, { useState, useRef, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { useLanguage } from '../i18n';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Camera, CheckCircle, AlertCircle, Phone, User, DollarSign, RefreshCw, ChevronLeft } from 'lucide-react';

interface BorrowerApplyFormProps {
  lenderId: string;
  onBackToPortal?: () => void;
  onSubmitSuccess?: (appId: string) => void;
}

export default function BorrowerApplyForm({ lenderId, onBackToPortal, onSubmitSuccess }: BorrowerApplyFormProps) {
  const { language } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [amountRequested, setAmountRequested] = useState('');
  const [loanDuration, setLoanDuration] = useState('30');
  const [lastCreatedAppId, setLastCreatedAppId] = useState('');
  
  const [idCardPhoto, setIdCardPhoto] = useState<string>('');
  const [selfiePhoto, setSelfiePhoto] = useState<string>('');
  
  const [useCameraForSelfie, setUseCameraForSelfie] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Clean up camera stream when component unmounts or view changes
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setUseCameraForSelfie(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 300, height: 300 },
        audio: false
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      alert(language === 'kh' ? 'មិនអាចបើកកាមេរ៉ាបានទេ! សូមជ្រើសរើសការ Upload ជំនួសវិញ។' : 'Could not access camera! Please upload a file instead.');
      setUseCameraForSelfie(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setUseCameraForSelfie(false);
  };

  const captureSelfie = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 300;
        canvas.height = 300;
        
        // Horizontal flip for mirroring selfie
        ctx.translate(300, 0);
        ctx.scale(-1, 1);
        
        ctx.drawImage(video, 0, 0, 300, 300);
        
        // Reset transform
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6); // Compress to 60% quality
        setSelfiePhoto(dataUrl);
        stopCamera();
      }
    }
  };

  // Helper to compress images selected from file system
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'id' | 'selfie') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 300; // Keep image dimensions small for faster uploads & compliance
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6); // Compress to 60% quality
        
        if (type === 'id') {
          setIdCardPhoto(dataUrl);
        } else {
          setSelfiePhoto(dataUrl);
        }
      };
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      return alert(language === 'kh' ? 'សូមបញ្ជាក់ឈ្មោះរបស់អ្នក!' : 'Please enter your name!');
    }
    if (!phone.trim()) {
      return alert(language === 'kh' ? 'សូមបញ្ជាក់លេខទូរស័ព្ទរបស់អ្នក!' : 'Please enter your phone number!');
    }
    const amt = parseFloat(amountRequested);
    if (isNaN(amt) || amt <= 0) {
      return alert(language === 'kh' ? 'សូមបញ្ជាក់ទឹកប្រាក់ស្នើសុំឱ្យបានត្រឹមត្រូវ!' : 'Please enter a valid requested amount!');
    }
    if (!idCardPhoto) {
      return alert(language === 'kh' ? 'សូមបង្ហោះរូបអត្តសញ្ញាណប័ណ្ណរបស់អ្នក!' : 'Please upload your ID Card photo!');
    }
    if (!selfiePhoto) {
      return alert(language === 'kh' ? 'សូមថតរូប ឬបង្ហោះរូបថតមុខរបស់អ្នក!' : 'Please take/upload a selfie photo!');
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const applicationId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const applicationData = {
        id: applicationId,
        name: name.trim(),
        phone: phone.trim(),
        idCardPhoto,
        selfiePhoto,
        amountRequested: amt,
        loanDuration: parseInt(loanDuration) || 30,
        lenderId,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'loan_applications', applicationId), applicationData);
      setLastCreatedAppId(applicationId);
      setSubmitStatus('success');
    } catch (err: any) {
      console.error("Error submitting loan request:", err);
      setSubmitStatus('error');
      setErrorMessage(err.message || 'Error occurred while saving your loan application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === 'success') {
    return (
      <div className="max-w-md mx-auto my-8 bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl p-8 shadow-xl text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-4xl mx-auto shadow-inner animate-bounce">
          <CheckCircle className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-emerald-400 tracking-tight">
            {language === 'kh' ? 'ផ្ញើសំណើជោគជ័យ!' : 'Submission Successful!'}
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed font-medium px-4">
            {language === 'kh' 
              ? `ព័ត៌មាន និងឯកសារស្នើសុំកម្ចីចំនួន $${parseFloat(amountRequested).toLocaleString()} របស់លោកអ្នក ត្រូវបានបញ្ជូនទៅកាន់ម្ចាស់បំណុលរួចរាល់ហើយ។ សូមរង់ចាំការទំនាក់ទំនងត្រឡប់ទៅវិញ!`
              : `Your loan application of $${parseFloat(amountRequested).toLocaleString()} and documents have been sent to the lender successfully. Please wait for the lender to review and contact you!`}
          </p>
        </div>

        <div className="p-4 bg-slate-800/40 border border-slate-800/80 rounded-2xl text-left text-xs space-y-2 font-medium">
          <div className="flex justify-between border-b border-slate-800 pb-1.5 text-slate-400">
            <span>{language === 'kh' ? 'ឈ្មោះកូនបំណុល' : 'Applicant Name'}</span>
            <span className="text-slate-200 font-bold">{name}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-1.5 text-slate-400">
            <span>{language === 'kh' ? 'លេខទូរស័ព្ទ' : 'Phone Number'}</span>
            <span className="text-slate-200 font-bold">{phone}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-1.5 text-slate-400">
            <span>{language === 'kh' ? 'រយះពេលនៃការខ្ចី' : 'Loan Duration'}</span>
            <span className="text-slate-200 font-bold">{loanDuration} {language === 'kh' ? 'ថ្ងៃ' : 'Days'}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>{language === 'kh' ? 'ទឹកប្រាក់ស្នើសុំ' : 'Amount Requested'}</span>
            <span className="text-emerald-400 font-bold">${parseFloat(amountRequested).toLocaleString()} USD</span>
          </div>
        </div>

        <button
          onClick={() => {
            if (onSubmitSuccess && lastCreatedAppId) {
              onSubmitSuccess(lastCreatedAppId);
            } else {
              setName('');
              setPhone('');
              setAmountRequested('');
              setLoanDuration('30');
              setIdCardPhoto('');
              setSelfiePhoto('');
              setSubmitStatus('idle');
            }
          }}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-sm transition cursor-pointer shadow-lg shadow-blue-600/20 active:scale-98"
        >
          {language === 'kh' ? 'បន្តទៅមុខ' : 'Continue / Track'}
        </button>

        {onBackToPortal && (
          <button
            onClick={onBackToPortal}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs transition cursor-pointer flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {language === 'kh' ? 'ត្រឡប់ទៅកាន់ទំព័រដើម' : 'Back to Portal'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-6 bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl overflow-hidden shadow-xl font-sans relative">
      
      {/* Top Banner Accent */}
      <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />

      <div className="p-6 space-y-6">
        <div className="space-y-1.5 text-center">
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            ⚡️ {language === 'kh' ? 'ស្នើសុំកម្ចីរហ័ស (លុយឆក់)' : 'Quick Loan Application'}
          </h2>
          <p className="text-xs text-slate-400 font-semibold px-4">
            {language === 'kh' 
              ? 'សូមបំពេញព័ត៌មានលម្អិត និងផ្ទុកឡើងឯកសារចាំបាច់ដើម្បីស្នើសុំកម្ចីងាយស្រួល' 
              : 'Please fill out your credentials and upload necessary documents to request a loan.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Full Name Input */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" />
              {language === 'kh' ? 'ឈ្មោះពេញរបស់កូនបំណុល' : 'Borrower Full Name'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === 'kh' ? 'ឧទាហរណ៍៖ ចាន់ ម៉ារី' : 'e.g., Chan Mary'}
              className="w-full px-4 py-3 text-sm bg-slate-950 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium placeholder-slate-600"
            />
          </div>

          {/* Phone Number Input */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-blue-400" />
              {language === 'kh' ? 'លេខទូរស័ព្ទកូនបំណុល' : 'Phone Number'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., 089 778 221"
              className="w-full px-4 py-3 text-sm bg-slate-950 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium placeholder-slate-600"
            />
          </div>

          {/* Amount Requested USD */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              {language === 'kh' ? 'ទឹកប្រាក់ដែលចង់ខ្ចី (គិតជាដុល្លារ)' : 'Requested Loan Amount ($)'} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min="1"
                step="any"
                value={amountRequested}
                onChange={(e) => setAmountRequested(e.target.value)}
                placeholder="e.g., 200"
                className="w-full pl-10 pr-4 py-3 text-sm bg-slate-950 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-bold text-emerald-400 placeholder-slate-600"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-bold">
                $
              </span>
            </div>
          </div>

          {/* Loan Duration in Days */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="text-blue-400">📅</span>
              {language === 'kh' ? 'រយះពេលនៃការខ្ចី (ចំនួនថ្ងៃ)' : 'Loan Duration (Days)'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              value={loanDuration}
              onChange={(e) => setLoanDuration(e.target.value)}
              placeholder={language === 'kh' ? 'ឧទាហរណ៍៖ ៣០' : 'e.g., 30'}
              className="w-full px-4 py-3 text-sm bg-slate-950 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-bold text-slate-100 placeholder-slate-600"
            />
          </div>

          {/* ID Card Upload Card */}
          <div className="space-y-2">
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider">
              {language === 'kh' ? 'រូបអត្តសញ្ញាណប័ណ្ណ (ID Card Photo)' : 'National ID Card Photo'} <span className="text-rose-500">*</span>
            </label>
            <div className="relative border-2 border-dashed border-slate-800 hover:border-blue-500/40 rounded-2xl bg-slate-950 p-4 transition text-center flex flex-col items-center justify-center space-y-2">
              {idCardPhoto ? (
                <div className="relative w-full h-32 rounded-xl overflow-hidden group">
                  <img src={idCardPhoto} alt="National ID Card" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setIdCardPhoto('')}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-bold text-rose-400 cursor-pointer"
                  >
                    {language === 'kh' ? '🗑️ លុប ដើម្បីបង្ហោះឡើងវិញ' : '🗑️ Remove and Redo'}
                  </button>
                </div>
              ) : (
                <label className="w-full py-4 cursor-pointer flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full flex items-center justify-center shadow-inner">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-300">
                      {language === 'kh' ? 'បង្ហោះ ឬថតរូបអត្តសញ្ញាណប័ណ្ណ' : 'Upload or snap ID card'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">PNG, JPG up to 10MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'id')}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Selfie Capture Card */}
          <div className="space-y-2">
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider">
              {language === 'kh' ? 'ថតរូបមុខខ្លួនឯងផ្ទាល់ (Selfie Photo)' : 'Selfie Face Photo'} <span className="text-rose-500">*</span>
            </label>
            
            <div className="relative border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950 p-4 flex flex-col items-center justify-center text-center">
              
              {selfiePhoto ? (
                <div className="relative w-36 h-36 rounded-full border-4 border-slate-800 overflow-hidden group">
                  <img src={selfiePhoto} alt="Selfie" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setSelfiePhoto('')}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-bold text-rose-400 cursor-pointer"
                  >
                    {language === 'kh' ? '🗑️ លុបរូបថត' : '🗑️ Delete'}
                  </button>
                </div>
              ) : useCameraForSelfie ? (
                <div className="space-y-4 w-full flex flex-col items-center">
                  <div className="relative w-48 h-48 rounded-full border-4 border-blue-500/30 overflow-hidden bg-black flex items-center justify-center">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover scale-x-[-1]"
                      playsInline
                      muted
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={captureSelfie}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      📸 {language === 'kh' ? 'ថតរូប' : 'Capture'}
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      {language === 'kh' ? 'បោះបង់' : 'Cancel'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full py-2 flex flex-col items-center justify-center gap-3">
                  <div className="flex gap-4">
                    {/* Live Camera Button */}
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      {language === 'kh' ? 'បើកកាមេរ៉ាថត' : 'Open Camera'}
                    </button>

                    {/* Standard File Picker */}
                    <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 border border-slate-700">
                      <Upload className="w-4 h-4" />
                      {language === 'kh' ? 'ជ្រើសរើសរូបភាព' : 'Choose File'}
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={(e) => handleImageUpload(e, 'selfie')}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    {language === 'kh' ? 'សូមថត ឬជ្រើសរើសរូបថតផ្ទៃមុខអោយបានច្បាស់ល្អ' : 'Take a clear camera selfie or select face photo'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Hidden Canvas for compression */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Display Error Message if any */}
          {submitStatus === 'error' && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-start gap-2 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{errorMessage || (language === 'kh' ? 'ការផ្ញើសំណើបរាជ័យ! សូមព្យាយាមម្តងទៀត។' : 'Submission failed! Please try again.')}</p>
            </div>
          )}

          {/* Submit Application Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-black rounded-2xl text-sm transition cursor-pointer shadow-lg shadow-blue-600/25 active:scale-98 flex items-center justify-center gap-2`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {language === 'kh' ? 'កំពុងផ្ញើសំណើ...' : 'Sending request...'}
              </>
            ) : (
              <>
                ⚡️ {language === 'kh' ? 'ផ្ញើសំណើសុំខ្ចីប្រាក់ឥឡូវនេះ' : 'Submit Loan Request Now'}
              </>
            )}
          </button>
        </form>

        {onBackToPortal && (
          <button
            onClick={onBackToPortal}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold rounded-2xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            {language === 'kh' ? 'ត្រឡប់ទៅកាន់ទំព័រដើម' : 'Back to Portal'}
          </button>
        )}
      </div>
    </div>
  );
}
