import React, { useState, useRef, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { useLanguage } from '../i18n';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Camera, CheckCircle, AlertCircle, Phone, User, DollarSign, RefreshCw, ChevronLeft, Eye, X, ZoomIn, FileText, ShieldAlert, Sparkles, AlertTriangle, MapPin, Navigation, Calendar, CreditCard, Lock, Unlock } from 'lucide-react';
import { scanIdCardImage, checkExpiryStatus } from '../utils/ocrHelper';
import { playNewApplicationAlertSound } from '../utils';
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
  
  const [activeCameraType, setActiveCameraType] = useState<'id' | 'selfie' | null>(null);
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

  const startCamera = async (type: 'id' | 'selfie') => {
    try {
      stopCamera();
      setActiveCameraType(type);
      const facingMode = type === 'id' ? { ideal: 'environment' } : 'user';
      const width = type === 'id' ? 1280 : 600;
      const height = type === 'id' ? 810 : 600;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: width }, height: { ideal: height } },
        audio: false
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      alert(language === 'kh' ? 'មិនអាចបើកកាមេរ៉ាផ្សាយផ្ទាល់បានទេ! សូមប្រើប្រាស់ប៊ូតុងថតរូបពីកាមេរ៉ាទូរស័ព្ទ។' : 'Could not access live camera! Please use device camera button.');
      setActiveCameraType(null);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setActiveCameraType(null);
  };

  const captureLivePhoto = (type: 'id' | 'selfie') => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (type === 'id') {
          // Standard Cambodian National ID Card ratio (85.6mm x 53.98mm = 1.585:1)
          const targetWidth = 1280;
          const targetHeight = 808;
          const targetAspect = targetWidth / targetHeight;

          const vWidth = video.videoWidth || 1280;
          const vHeight = video.videoHeight || 810;
          const vAspect = vWidth / vHeight;

          let sx = 0, sy = 0, sWidth = vWidth, sHeight = vHeight;
          if (vAspect > targetAspect) {
            sWidth = vHeight * targetAspect;
            sx = (vWidth - sWidth) / 2;
          } else {
            sHeight = vWidth / targetAspect;
            sy = (vHeight - sHeight) / 2;
          }

          canvas.width = targetWidth;
          canvas.height = targetHeight;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          setIdCardPhoto(dataUrl);
          processIdCardOcr(dataUrl);
        } else {
          canvas.width = 600;
          canvas.height = 600;
          ctx.translate(600, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0, 600, 600);
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setSelfiePhoto(dataUrl);
        }
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

  // Mandatory GPS Location Gate: If location is not allowed/captured, block access to the form
  if (gpsStatus !== 'captured' || !latitude || !longitude) {
    return (
      <div className="max-w-md mx-auto my-6 bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl p-6 shadow-2xl text-center space-y-6 relative overflow-hidden font-sans">
        <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 -mt-6 -mx-6 mb-4" />
        
        <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-3xl flex items-center justify-center text-3xl mx-auto shadow-inner animate-pulse">
          <MapPin className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-amber-300 tracking-tight">
            {language === 'kh' ? '📍 តម្រូវអោយបើកទីតាំង GPS (Location Service)' : '📍 GPS Location Required'}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed font-medium px-2">
            {language === 'kh'
              ? 'ដើម្បីអាចបើកចូលទៅកាន់ផ្ទាំង ស្នើសុំកម្ចីរហ័ស (លុយឆក់) បាន លោកអ្នកត្រូវចុចអនុញ្ញាត (Allow Location) ទីតាំង GPS របស់ឧបករណ៍លោកអ្នកជាមុនសិន។ ទិន្នន័យទីតាំងនឹងត្រូវបញ្ជូនទៅកាន់ម្ចាស់បំណុលដោយស្វ័យប្រវត្តិ។'
              : 'To access the Fast Loan Application, you must allow GPS location access on your device. Your coordinates will be securely sent to the lender.'}
          </p>
        </div>

        {gpsErrorMessage && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-xs text-rose-300 font-bold text-left flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <p>{gpsErrorMessage}</p>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={requestGpsLocation}
            disabled={gpsStatus === 'requesting'}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black rounded-2xl text-sm transition shadow-lg shadow-orange-900/30 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            {gpsStatus === 'requesting' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{language === 'kh' ? 'កំពុងទាញយកទីតាំង GPS...' : 'Fetching Location...'}</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" />
                <span>{language === 'kh' ? '📍 ចុចទីនេះដើម្បីបើកទីតាំង GPS (Allow Location)' : '📍 Allow Location Access'}</span>
              </>
            )}
          </button>

          {onBackToPortal && (
            <button
              type="button"
              onClick={onBackToPortal}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold rounded-2xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{language === 'kh' ? 'ត្រឡប់ទៅវិញ' : 'Go Back'}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

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
      playNewApplicationAlertSound();
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

          {/* ID Card Upload Card with Cambodian National ID Security Frame */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[13px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-cyan-400" />
                {language === 'kh' ? 'រូបអត្តសញ្ញាណប័ណ្ណ (CAMBODIAN ID CARD)' : 'National ID Card Photo'} <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 flex items-center gap-1">
                📸 កាមេរ៉ាផ្ទាល់ (NO UPLOAD)
              </span>
            </div>

            <div className="relative border-2 border-dashed border-slate-800 hover:border-cyan-500/40 rounded-2xl bg-slate-950 p-3 transition text-center flex flex-col items-center justify-center space-y-2">
              
              {idCardPhoto ? (
                <div className="relative w-full max-w-md aspect-[1.585/1] bg-slate-900 rounded-xl overflow-hidden group border-2 border-cyan-500/60 flex items-center justify-center shadow-2xl mx-auto">
                  <img src={idCardPhoto} alt="Cambodian National ID Card" className="w-full h-full object-cover rounded-lg" />
                  
                  {/* Cambodian National ID Security Framing Overlay */}
                  <div className="absolute inset-2 border-2 border-dashed border-cyan-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-2.5 shadow-[inset_0_0_20px_rgba(6,182,212,0.3)]">
                    <div className="flex justify-between items-start">
                      <div className="bg-slate-950/90 backdrop-blur-md px-2 py-1 rounded border border-cyan-500/40 text-[9px] font-black text-cyan-300 space-y-0.5 shadow-md">
                        <div className="text-[8px] text-amber-300">🇰🇭 ព្រះរាជាណាចក្រកម្ពុជា</div>
                        <div>CAMBODIAN NATIONAL ID</div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/90 px-2 py-0.5 rounded border border-emerald-500/40 flex items-center gap-1 shadow-md">
                        ✓ {language === 'kh' ? 'ត្រូវតាមទម្រង់' : 'Frame Matched'}
                      </span>
                    </div>

                    {/* Bottom MRZ Security Bar Overlay matching Cambodian ID format */}
                    <div className="bg-slate-950/90 backdrop-blur-md px-2 py-1 rounded border border-cyan-500/40 text-left font-mono text-[9px] text-cyan-300/90 leading-tight tracking-wider shadow-md">
                      <div>IDKHM1708411864&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</div>
                      <div>9902196M2411048KHM&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;0</div>
                    </div>
                  </div>

                  {/* Laser Scanner animation during OCR scanning */}
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
                        <span>កំពុងស្កេនរូបថតអត្តសញ្ញាណប័ណ្ណ...</span>
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 p-2 z-20">
                    <button
                      type="button"
                      onClick={() => setPreviewModalImage({ title: language === 'kh' ? 'រូបថតអត្តសញ្ញាណប័ណ្ណសញ្ជាតិខ្មែរ (HD)' : 'Cambodian ID Card Photo (HD)', src: idCardPhoto })}
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
                      <Camera className="w-4 h-4" />
                      {language === 'kh' ? 'ថតសារថ្មី' : 'Retake Photo'}
                    </button>
                  </div>
                </div>
              ) : activeCameraType === 'id' ? (
                /* Live ID Card Camera Stream View */
                <div className="space-y-3 w-full max-w-md mx-auto flex flex-col items-center">
                  <div className="relative w-full aspect-[1.585/1] rounded-2xl border-2 border-cyan-400 overflow-hidden bg-black flex items-center justify-center shadow-2xl">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />

                    {/* Live Camera Cambodian ID Card Guide Frame */}
                    <div className="absolute inset-2 sm:inset-3 border-2 border-dashed border-cyan-300/80 rounded-xl pointer-events-none flex flex-col justify-between p-2.5 sm:p-3 shadow-[inset_0_0_25px_rgba(6,182,212,0.3)]">
                      <div className="flex justify-between items-start bg-slate-950/80 p-1.5 rounded-lg border border-cyan-500/40">
                        <span className="text-[10px] font-black text-amber-300">🇰🇭 ព្រះរាជាណាចក្រកម្ពុជា • CAMBODIAN ID</span>
                        <span className="text-[9px] font-extrabold text-cyan-300 animate-pulse">● LIVE CAMERA</span>
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-bold text-cyan-200/90 bg-slate-950/80 p-1.5 rounded-lg border border-cyan-500/40">
                        <span>👤 ដាក់អត្តសញ្ញាណប័ណ្ណអោយចំប្រអប់</span>
                        <span className="font-mono text-[9px] text-slate-400">IDKHM1708411864&lt;&lt;&lt;&lt;&lt;&lt;</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => captureLivePhoto('id')}
                      className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs rounded-xl transition cursor-pointer shadow-lg active:scale-98 flex items-center justify-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>📸 {language === 'kh' ? 'ថតរូបអត្តសញ្ញាណប័ណ្ណ (Snap ID)' : 'Snap ID Photo'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      {language === 'kh' ? 'បោះបង់' : 'Cancel'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Camera Trigger Area - Strictly NO GALLERY FILE UPLOAD */
                <div className="w-full py-5 flex flex-col items-center justify-center gap-3">
                  {/* Cambodian ID Card Guide Frame UI */}
                  <div className="w-56 h-36 border-2 border-dashed border-cyan-400/60 rounded-xl bg-cyan-950/20 flex flex-col items-center justify-between p-3 relative shadow-inner">
                    <div className="flex justify-between w-full text-[9px] font-black text-amber-300">
                      <span>🇰🇭 ព្រះរាជាណាចក្រកម្ពុជា</span>
                      <span className="text-cyan-300">SECURITY FRAME</span>
                    </div>
                    
                    <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 rounded-xl flex items-center justify-center shadow-inner">
                      <Lock className="w-5 h-5" />
                    </div>

                    <div className="text-[9px] font-mono text-cyan-300/80 bg-slate-950/90 px-2 py-0.5 rounded w-full text-center border border-cyan-500/30">
                      IDKHM1708411864&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
                    </div>
                  </div>

                  <div className="space-y-1 text-center">
                    <p className="text-xs font-black text-slate-200">
                      {language === 'kh' ? 'ថតរូបអត្តសញ្ញាណប័ណ្ណសញ្ជាតិខ្មែរ (Cambodian ID)' : 'Snap Cambodian National ID Card'}
                    </p>
                    <p className="text-[10px] text-amber-400 font-bold">
                      ⚠️ {language === 'kh' ? 'មិនអនុញ្ញាតអោយ Upload ទេ ត្រូវថតចេញពីកាមេរ៉ាដោយផ្ទាល់' : 'File upload disabled. Must snap photo with camera.'}
                    </p>
                  </div>

                  <div className="w-full max-w-xs pt-1">
                    {/* Live Stream Camera Button */}
                    <button
                      type="button"
                      onClick={() => startCamera('id')}
                      className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-98"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{language === 'kh' ? '📷 បើកកាមេរ៉ាថតផ្ទាល់' : 'Open Live Camera'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Selfie Capture Card - STRICTLY CAMERA ONLY */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[13px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-400" />
                {language === 'kh' ? 'ថតរូបមុខខ្លួនឯងផ្ទាល់ (Selfie Photo)' : 'Selfie Face Photo'} <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                📸 កាមេរ៉ាថតផ្ទាល់ (NO GALLERY)
              </span>
            </div>
            
            <div className="relative border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950 p-4 flex flex-col items-center justify-center text-center">
              
              {selfiePhoto ? (
                <div className="relative w-36 h-36 rounded-full border-4 border-emerald-500/40 overflow-hidden group shadow-lg">
                  <img src={selfiePhoto} alt="Selfie" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setSelfiePhoto('')}
                    className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-bold text-rose-400 cursor-pointer"
                  >
                    {language === 'kh' ? '🗑️ ថតសារថ្មី' : '🗑️ Retake Selfie'}
                  </button>
                </div>
              ) : activeCameraType === 'selfie' ? (
                <div className="space-y-4 w-full flex flex-col items-center">
                  <div className="relative w-52 h-52 rounded-full border-4 border-emerald-500/50 overflow-hidden bg-black flex items-center justify-center shadow-2xl">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover scale-x-[-1]"
                      playsInline
                      muted
                    />
                    <div className="absolute inset-2 border-2 border-dashed border-emerald-400/60 rounded-full pointer-events-none animate-pulse" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => captureLivePhoto('selfie')}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg active:scale-98"
                    >
                      <Camera className="w-4 h-4" />
                      <span>📸 {language === 'kh' ? 'ថតរូបមុខ' : 'Snap Selfie'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      {language === 'kh' ? 'បោះបង់' : 'Cancel'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full py-3 flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shadow-inner">
                    <User className="w-8 h-8" />
                  </div>

                  <div className="space-y-0.5 text-center">
                    <p className="text-xs font-bold text-slate-200">
                      {language === 'kh' ? 'សូមថតរូបថតផ្ទៃមុខអោយបានច្បាស់ល្អ' : 'Take a clear selfie face photo'}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-bold">
                      ⚠️ {language === 'kh' ? 'ត្រូវតែថតចេញពីកាមេរ៉ាដោយផ្ទាល់ មិនអនុញ្ញាតអោយជ្រើសរើសរូបពី Gallery ទេ' : 'Camera capture required. No gallery selection allowed.'}
                    </p>
                  </div>

                  <div className="w-full max-w-xs pt-1">
                    {/* Live Camera Button */}
                    <button
                      type="button"
                      onClick={() => startCamera('selfie')}
                      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-98"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{language === 'kh' ? '📷 បើកកាមេរ៉ាថត' : 'Open Camera'}</span>
                    </button>
                  </div>
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
