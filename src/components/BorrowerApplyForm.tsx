import React, { useState, useRef, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { useLanguage } from '../i18n';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Camera, CheckCircle, AlertCircle, Phone, User, DollarSign, RefreshCw, ChevronLeft, Eye, X, ZoomIn, FileText, ShieldAlert, Sparkles, AlertTriangle, MapPin, Navigation, Calendar, CreditCard, Lock, Unlock } from 'lucide-react';
import { scanIdCardImage, checkExpiryStatus } from '../utils/ocrHelper';
import { DEFAULT_LENDER_INFO, LoanApplication } from '../types';
import DigitalLoanContractModal from './DigitalLoanContractModal';

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
  const [loanDuration, setLoanDuration] = useState('0');
  const [paymentType, setPaymentType] = useState('daily');
  const [interestMethod, setInterestMethod] = useState('flat');
  const [lastCreatedAppId, setLastCreatedAppId] = useState('');

  // OCR Extracted ID Card State
  const [idCardNumber, setIdCardNumber] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [idExpiryDate, setIdExpiryDate] = useState('');
  const [idExpiryStatus, setIdExpiryStatus] = useState<'valid' | 'expiring_soon' | 'expired'>('valid');
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [isDataLocked, setIsDataLocked] = useState(true);
  const [showDigitalContractModal, setShowDigitalContractModal] = useState(false);
  
  const [idCardPhoto, setIdCardPhoto] = useState<string>('');
  const [selfiePhoto, setSelfiePhoto] = useState<string>('');
  const [previewModalImage, setPreviewModalImage] = useState<{ title: string; src: string } | null>(null);
  
  const [useCameraForSelfie, setUseCameraForSelfie] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // GPS Location State for Borrower
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'requesting' | 'captured' | 'denied' | 'error'>('idle');
  const [gpsErrorMessage, setGpsErrorMessage] = useState('');

  // Request GPS Location from Browser / Mobile device
  const requestGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      setGpsErrorMessage(language === 'kh' ? 'ឧបករណ៍ ឬកម្មវិធីរុករករបស់អ្នកមិនគាំទ្រ GPS ទេ!' : 'Device or browser does not support Geolocation.');
      return;
    }

    setGpsStatus('requesting');
    setGpsErrorMessage('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocationAccuracy(position.coords.accuracy);
        setGpsStatus('captured');
        setGpsErrorMessage('');
      },
      (err) => {
        console.warn("GPS Location error:", err);
        setGpsStatus('denied');
        if (err.code === 1) { // PERMISSION_DENIED
          setGpsErrorMessage(
            language === 'kh'
              ? 'លោកអ្នកបានបដិសេធសិទ្ធិចូលមើលទីតាំង (Permission Denied)! សូមចុចលើរូបសោក្នុង Browser ឬចូលទៅកាន់ Device Settings ដើម្បីបើក Location Access!'
              : 'Location permission denied. Please allow location access in your browser/device settings.'
          );
        } else {
          setGpsErrorMessage(
            language === 'kh'
              ? 'មិនអាចទាញយកទីតាំង GPS បានទេ! សូមពិនិត្យមើលថា Location Service (GPS) លើទូរស័ព្ទត្រូវបានបើករួចរាល់!'
              : 'Could not fetch GPS location. Please check if Location Service (GPS) is enabled on your device.'
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  // Automatically request GPS location on mount
  useEffect(() => {
    requestGpsLocation();
  }, []);

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

  const processIdCardOcr = async (imgDataUrl: string) => {
    setIsOcrScanning(true);
    try {
      const res = await scanIdCardImage(imgDataUrl);
      if (res.idCardNumber) setIdCardNumber(res.idCardNumber);
      if (res.name) setName(res.name);
      if (res.dob) setDob(res.dob);
      if (res.address) setAddress(res.address);
      if (res.idExpiryDate) {
        setIdExpiryDate(res.idExpiryDate);
        setIdExpiryStatus(checkExpiryStatus(res.idExpiryDate));
      }
    } catch (err) {
      console.error("OCR Scanning Error:", err);
    } finally {
      setIsOcrScanning(false);
    }
  };

  // Helper to process high quality image uploads with optimal HD resolution for ID card clarity
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
        // ID Card needs high resolution (1600px max) so all Khmer text and numbers stay crisp and clear
        // Selfie face photo uses 800px max
        const MAX_SIZE = type === 'id' ? 1600 : 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round(height * (MAX_SIZE / width));
            width = MAX_SIZE;
          } else {
            width = Math.round(width * (MAX_SIZE / height));
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
        }
        
        // High JPEG quality (0.90 for ID cards, 0.85 for selfie)
        const quality = type === 'id' ? 0.90 : 0.85;
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        if (type === 'id') {
          setIdCardPhoto(dataUrl);
          processIdCardOcr(dataUrl);
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
      const calculatedExpiryStatus = checkExpiryStatus(idExpiryDate);
      const applicationId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const applicationData = {
        id: applicationId,
        name: name.trim(),
        phone: phone.trim(),
        idCardPhoto,
        selfiePhoto,
        amountRequested: amt,
        loanDuration: parseInt(loanDuration) || 0,
        paymentType,
        interestMethod,
        lenderId,
        status: 'pending',
        createdAt: new Date().toISOString(),
        idCardNumber: idCardNumber.trim(),
        extractedName: name.trim(),
        dob: dob.trim(),
        address: address.trim(),
        idExpiryDate: idExpiryDate.trim(),
        idExpiryStatus: calculatedExpiryStatus,
        latitude: latitude,
        longitude: longitude,
        locationAccuracy: locationAccuracy ?? undefined,
        gpsCapturedAt: new Date().toISOString(),
        lenderInfo: DEFAULT_LENDER_INFO
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
          <div className="flex justify-between border-b border-slate-800 pb-1.5 text-slate-400">
            <span>{language === 'kh' ? 'ប្រភេទនៃការបង់ប្រាក់' : 'Payment Type'}</span>
            <span className="text-slate-200 font-bold">
              {paymentType === 'daily' ? (language === 'kh' ? 'បង់រាល់ថ្ងៃ' : 'Daily') :
               paymentType === 'weekly' ? (language === 'kh' ? 'បង់រាល់សប្តាហ៍' : 'Weekly') :
               paymentType === 'monthly' ? (language === 'kh' ? 'បង់រាល់ខែ' : 'Monthly') :
               paymentType === 'every_2_days' ? (language === 'kh' ? 'បង់រាល់២ថ្ងៃ' : 'Every 2 days') :
               (language === 'kh' ? 'ផ្សេងៗ' : 'Custom')}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-1.5 text-slate-400">
            <span>{language === 'kh' ? 'របៀបគណនាការប្រាក់' : 'Interest Method'}</span>
            <span className="text-slate-200 font-bold">
              {interestMethod === 'flat' ? (language === 'kh' ? 'ការប្រាក់ថេរ' : 'Flat Rate') :
               interestMethod === 'declining' ? (language === 'kh' ? 'ការប្រាក់ថយចុះ' : 'Declining') :
               (language === 'kh' ? 'គ្មានការប្រាក់' : 'No Interest')}
            </span>
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
              setLoanDuration('0');
              setPaymentType('daily');
              setInterestMethod('flat');
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
            <label className="block text-[13px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-400" />
              {language === 'kh' ? 'ឈ្មោះពេញរបស់កូនបំណុល' : 'Borrower Full Name'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === 'kh' ? 'ឧទាហរណ៍៖ ចាន់ ម៉ារី' : 'e.g., Chan Mary'}
              className="w-full px-4 py-3 text-base bg-slate-950 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium placeholder-slate-600"
            />
          </div>

          {/* Phone Number Input */}
          <div className="space-y-1.5">
            <label className="block text-[13px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-blue-400" />
              {language === 'kh' ? 'លេខទូរស័ព្ទកូនបំណុល' : 'Phone Number'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., 089 778 221"
              className="w-full px-4 py-3 text-base bg-slate-950 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium placeholder-slate-600"
            />
          </div>

          {/* Amount Requested USD */}
          <div className="space-y-1.5">
            <label className="block text-[13px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
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
                className="w-full pl-10 pr-4 py-3 text-base bg-slate-950 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-bold text-emerald-400 placeholder-slate-600"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-slate-500 font-bold">
                $
              </span>
            </div>
          </div>

          {/* Loan Duration in Days */}
          <div className="space-y-1.5">
            <label className="block text-[13px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="text-blue-400 text-sm">📅</span>
              {language === 'kh' ? 'រយះពេលនៃការខ្ចី (ចំនួនថ្ងៃ)' : 'Loan Duration (Days)'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              value={loanDuration}
              onChange={(e) => setLoanDuration(e.target.value)}
              placeholder={language === 'kh' ? 'ឧទាហរណ៍៖ ៣០' : 'e.g., 30'}
              className="w-full px-4 py-3 text-base bg-slate-950 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-bold text-slate-100 placeholder-slate-600"
            />

            {/* Quick Template Options for Duration */}
            <div className="pt-1 flex flex-wrap gap-1.5">
              {[5, 7, 10, 15, 20, 25, 30].map((days) => {
                const isSelected = loanDuration === days.toString();
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setLoanDuration(days.toString())}
                    className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-400 shadow-xs shadow-blue-500/20 scale-105'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-blue-500/50 hover:bg-slate-900'
                    }`}
                  >
                    {days} {language === 'kh' ? 'ថ្ងៃ' : 'Days'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Type Option - Fixed to Daily only */}
          <div className="space-y-1.5">
            <label className="block text-[13px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="text-blue-400 text-sm">🔄</span>
              {language === 'kh' ? 'ប្រភេទនៃការបង់ប្រាក់' : 'Payment Type'} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                disabled
                value="daily"
                className="w-full px-4 py-3 text-base bg-slate-950/80 border border-slate-800 rounded-2xl font-bold text-slate-300 appearance-none cursor-not-allowed opacity-90"
              >
                <option value="daily">{language === 'kh' ? 'បង់រាល់ថ្ងៃ (Daily)' : 'Daily'}</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                {language === 'kh' ? 'បង់រាល់ថ្ងៃ' : 'Daily Only'}
              </div>
            </div>
          </div>

          {/* New Interest Calculation Method Select Option */}
          <div className="space-y-1.5">
            <label className="block text-[13px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="text-blue-400 text-sm">📈</span>
              {language === 'kh' ? 'របៀបគណនាការប្រាក់' : 'Interest Calculation'} <span className="text-rose-500">*</span>
            </label>
            <select
              value={interestMethod}
              onChange={(e) => setInterestMethod(e.target.value)}
              className="w-full px-4 py-3 text-base bg-slate-950 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-bold text-slate-100"
            >
              <option value="flat">{language === 'kh' ? 'ការប្រាក់ថេរ (Flat Rate)' : 'Flat Rate'}</option>
              <option value="declining">{language === 'kh' ? 'ការប្រាក់ថយចុះ (Declining Rate)' : 'Declining Rate'}</option>
              <option value="none">{language === 'kh' ? 'គ្មានការប្រាក់ (No Interest)' : 'No Interest'}</option>
            </select>
          </div>

          {/* ID Card Upload Card */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[13px] font-black text-slate-300 uppercase tracking-wider">
                {language === 'kh' ? 'រូបអត្តសញ្ញាណប័ណ្ណ (ID CARD PHOTO)' : 'National ID Card Photo'} <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                {language === 'kh' ? 'គុណភាពច្បាស់ HD' : 'HD Clarity'}
              </span>
            </div>
            <div className="relative border-2 border-dashed border-slate-800 hover:border-blue-500/40 rounded-2xl bg-slate-950 p-3 transition text-center flex flex-col items-center justify-center space-y-2">
              {idCardPhoto ? (
                <div className="relative w-full h-48 sm:h-56 bg-slate-900 rounded-xl overflow-hidden group border border-slate-800 flex items-center justify-center">
                  <img src={idCardPhoto} alt="National ID Card" className="w-full h-full object-contain p-1" />
                  
                  {/* Laser Scanner animation during scanning */}
                  {isOcrScanning && (
                    <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden bg-cyan-950/30 border-2 border-cyan-400/60 shadow-[0_0_25px_rgba(6,182,212,0.4)] z-10">
                      <motion.div
                        initial={{ top: '0%' }}
                        animate={{ top: ['0%', '92%', '0%'] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                        className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_20px_#06b6d4,0_0_35px_#06b6d4]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/15 via-transparent to-cyan-500/15 animate-pulse" />
                      <div className="absolute top-2 left-2 bg-slate-950/90 backdrop-blur-md border border-cyan-400/50 text-cyan-300 text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-xl">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                        <span>កំពុងស្កេនរូបថតអត្តសញ្ញាណប័ណ្ណ (Scanning Progress)...</span>
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 p-2 z-20">
                    <button
                      type="button"
                      onClick={() => setPreviewModalImage({ title: language === 'kh' ? 'រូបថតអត្តសញ្ញាណប័ណ្ណ (HD)' : 'ID Card Photo (HD)', src: idCardPhoto })}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
                    >
                      <Eye className="w-4 h-4" />
                      {language === 'kh' ? 'មើលរូបធំច្បាស់' : 'View HD Image'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIdCardPhoto('')}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
                    >
                      {language === 'kh' ? 'លុបដើម្បីបង្ហោះថ្មី' : 'Remove & Redo'}
                    </button>
                  </div>
                </div>
              ) : (
                <label className="w-full py-6 cursor-pointer flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center shadow-inner">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-200">
                      {language === 'kh' ? 'បង្ហោះ ឬថតរូបអត្តសញ្ញាណប័ណ្ណ' : 'Upload or snap ID card'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">PNG, JPG (រក្សាទុករូបភាពច្បាស់ HD រហូតដល់ 10MB)</p>
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

          {/* OCR Extracted ID Card Details Section */}
          {(idCardPhoto || isOcrScanning) && (
            <div className="p-4 bg-slate-950 border border-blue-500/30 rounded-2xl space-y-3.5 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    {language === 'kh' ? 'ព័ត៌មានអត្តសញ្ញាណប័ណ្ណ (REENDEM ID DATA)' : 'Extracted ID Card Credentials'}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  {isOcrScanning ? (
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      កំពុង Read / Scan...
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      ✓ Scan ស្វ័យប្រវត្តិ
                    </span>
                  )}
                </div>
              </div>

              {/* ID Number */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                  {language === 'kh' ? 'លេខអត្តសញ្ញាណប័ណ្ណ' : 'ID Card Number'}
                </label>
                <input
                  type="text"
                  value={idCardNumber}
                  onChange={(e) => setIdCardNumber(e.target.value)}
                  placeholder={language === 'kh' ? 'ឧទាហរណ៍៖ 171135765' : 'e.g. 171135765'}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-xl text-blue-400 font-bold focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Date of Birth */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    {language === 'kh' ? 'ថ្ងៃខែឆ្នាំកំណើត' : 'Date of Birth'}
                  </label>
                  <input
                    type="text"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    placeholder="e.g. 22.06.2001"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-semibold focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition"
                  />
                </div>

                {/* Expiry Date */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    {language === 'kh' ? 'សុពលភាព ID (ថ្ងៃផុតកំណត់)' : 'ID Expiry Date'}
                  </label>
                  <input
                    type="text"
                    value={idExpiryDate}
                    onChange={(e) => {
                      setIdExpiryDate(e.target.value);
                      setIdExpiryStatus(checkExpiryStatus(e.target.value));
                    }}
                    placeholder="e.g. 2028.12.31"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-semibold focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition"
                  />
                </div>
              </div>

              {/* ID Expiry Status Indicator Badge */}
              <div className="p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs font-bold bg-slate-900 border-slate-800">
                <span className="text-slate-400">ស្ថានភាពសុពលភាព ID៖</span>
                {checkExpiryStatus(idExpiryDate) === 'expired' ? (
                  <div className="px-2.5 py-1 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-lg flex items-center gap-1.5 font-black">
                    <AlertTriangle className="w-4 h-4 text-rose-500 animate-bounce" />
                    <span>🔴 ID ផុតកំណត់ (Expired)</span>
                  </div>
                ) : checkExpiryStatus(idExpiryDate) === 'expiring_soon' ? (
                  <div className="px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-lg flex items-center gap-1.5 font-black">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>🟡 ID ជិតផុតកំណត់ ត្រឹម ១ខែ (Expiring Soon)</span>
                  </div>
                ) : (
                  <div className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg flex items-center gap-1.5 font-black">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>🟢 ID មានសុពលភាព (Valid)</span>
                  </div>
                )}
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  {language === 'kh' ? 'អាសយដ្ឋាន' : 'Address'}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={language === 'kh' ? 'ឧទាហរណ៍៖ ភូមិចំការឬស្សី សង្កាត់ព្រែកព្រះស្ដេច ក្រុងបាត់ដំបង' : 'e.g. Battambang'}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-semibold focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition"
                />
              </div>
            </div>
          )}

          {/* Selfie Capture Card */}
          <div className="space-y-2">
            <label className="block text-[13px] font-black text-slate-300 uppercase tracking-wider">
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
                        onChange={(e) => handleImageUpload(e, 'selfie')}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-400 font-semibold">
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

      {/* Digital Loan Contract Modal */}
      <AnimatePresence>
        {showDigitalContractModal && (
          <DigitalLoanContractModal
            application={{
              id: 'draft',
              name: name || 'ចាន់ ម៉ារី',
              phone: phone || '089778221',
              idCardPhoto: idCardPhoto,
              selfiePhoto: selfiePhoto,
              amountRequested: parseFloat(amountRequested) || 100,
              lenderId: lenderId,
              status: 'pending',
              createdAt: new Date().toISOString(),
              loanDuration: parseInt(loanDuration) || 30,
              paymentType,
              interestMethod,
              idCardNumber,
              dob,
              address,
              idExpiryDate,
              idExpiryStatus,
              lenderInfo: DEFAULT_LENDER_INFO
            }}
            onClose={() => setShowDigitalContractModal(false)}
          />
        )}
      </AnimatePresence>

      {/* HD Image Preview Modal */}
      <AnimatePresence>
        {previewModalImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-0"
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  {previewModalImage.title}
                </h3>
                <button
                  type="button"
                  onClick={() => setPreviewModalImage(null)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3 bg-black flex items-center justify-center min-h-[300px] max-h-[75vh] overflow-auto">
                <img
                  src={previewModalImage.src}
                  alt={previewModalImage.title}
                  className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
