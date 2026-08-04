import React, { useState, useRef } from 'react';
import { useLanguage } from '../i18n';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, X, Calendar, DollarSign, Clock, CheckCircle2, 
  Copy, Share2, Printer, Download, Sparkles, AlertCircle, FileText,
  User, Phone, ChevronRight, RefreshCw, Send, Check
} from 'lucide-react';
import { toPng, toJpeg } from 'html-to-image';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface HardshipPrincipalCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBorrowerName?: string;
  defaultBorrowerPhone?: string;
  defaultPrincipal?: number;
  currentUser?: string;
  showToast?: (message: string, type: 'success' | 'info' | 'error') => void;
}

export default function HardshipPrincipalCalculatorModal({
  isOpen,
  onClose,
  defaultBorrowerName = '',
  defaultBorrowerPhone = '',
  defaultPrincipal = 0,
  currentUser = 'sounravin',
  showToast
}: HardshipPrincipalCalculatorModalProps) {
  const { language } = useLanguage();

  // Inputs - empty by default for easy borrower entry
  const [borrowerName, setBorrowerName] = useState(defaultBorrowerName);
  const [borrowerPhone, setBorrowerPhone] = useState(defaultBorrowerPhone);
  const [principalAmount, setPrincipalAmount] = useState<number | ''>(defaultPrincipal || '');
  const [dailyRate, setDailyRate] = useState<number | ''>('');
  const [currency, setCurrency] = useState<'USD' | 'KHR'>('USD');
  const [startDate, setStartDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [frequency, setFrequency] = useState<'daily' | 'every_2_days' | 'weekly' | 'semi_monthly' | 'monthly'>('daily');
  const [agreementNote, setAgreementNote] = useState<string>('');

  // UI States
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Preset Daily Amount Chips
  const presetDailyAmounts = [5, 10, 15, 20, 25, 30, 50];

  // Frequency Days mapping
  const getStepDays = () => {
    switch (frequency) {
      case 'every_2_days': return 2;
      case 'weekly': return 7;
      case 'semi_monthly': return 15;
      case 'monthly': return 30;
      case 'daily':
      default: return 1;
    }
  };

  const stepDays = getStepDays();

  // Calculations
  const validPrincipal = Math.max(0, Number(principalAmount) || 0);
  const validDailyRate = Math.max(0, Number(dailyRate) || 0);

  // Total Installments
  const fullPaymentsCount = validDailyRate > 0 ? Math.floor(validPrincipal / validDailyRate) : 0;
  const remainder = validDailyRate > 0 ? validPrincipal % validDailyRate : 0;
  const totalInstallments = validDailyRate > 0 ? (remainder > 0.001 ? fullPaymentsCount + 1 : fullPaymentsCount) : 0;

  // Dates calculation
  const startDateObj = new Date(startDate || Date.now());
  
  // Schedule Array Generation
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

    // Advance date for next step
    currentDate.setDate(currentDate.getDate() + stepDays);
  }

  // Final Completion Date
  const endDateFormatted = scheduleItems.length > 0 
    ? scheduleItems[scheduleItems.length - 1].dateFormatted 
    : '-';
  const endDateIso = scheduleItems.length > 0 
    ? scheduleItems[scheduleItems.length - 1].isoDate 
    : '-';

  // Currency Symbol
  const currSymbol = currency === 'USD' ? '$' : currency === 'KHR' ? '៛' : '฿';

  // Format Telegram Text Message
  const generateTelegramMessage = () => {
    const bName = borrowerName.trim() || 'កូនបំណុល';
    const bPhone = borrowerPhone.trim() ? ` (${borrowerPhone})` : '';

    return `🤝 **កាលវិភាគសងប្រាក់ដើមពិសេស (សុំឡើងតែដើម)**
----------------------------------
👤 **ឈ្មោះកូនបំណុល:** ${bName}${bPhone}
💵 **ប្រាក់ដើមត្រូវសងសរុប:** ${currSymbol}${validPrincipal.toLocaleString()} ${currency}
🗓 **ប្រាក់សុំឡើងក្នងមួយថ្ងៃ:** ${currSymbol}${validDailyRate.toLocaleString()} ${currency} / ថ្ងៃ
⏱ **ចំនួនថ្ងៃត្រូវសងសរុប:** ${totalInstallments} ថ្ងៃ (${scheduleItems.length > 0 ? scheduleItems[0].isoDate : ''} ដល់ ${endDateIso})
📝 **ចំណាំ:** ${agreementNote}

----------------------------------
📋 **កាលវិភាគបង់ប្រាក់លម្អិត:**
${scheduleItems.map(item => {
  const isFinal = item.step === totalInstallments;
  return `• ថ្ងៃទី ${item.step}: ${item.isoDate} ➡️ ចំនួន ${currSymbol}${item.amount.toFixed(2)}${isFinal ? ' (ថ្ងៃចុងក្រោយ)' : ''} | នៅសល់: ${currSymbol}${item.remaining.toFixed(2)}`;
}).join('\n')}

----------------------------------
🙏🏻 សូមបង់ប្រាក់អោយបានទៀងទាត់តាមការសន្យា! អរគុណ!`;
  };

  const handleCopyTelegramText = () => {
    const text = generateTelegramMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);

    if (showToast) {
      showToast(
        language === 'kh' ? '📋 ចម្លងកាលវិភាគរួចរាល់! អាចផ្ញើចូល Telegram បាន' : '📋 Schedule copied to clipboard!',
        'success'
      );
    }
  };

  const handleSaveToFirestore = async () => {
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'hardship_settlement_agreements'), {
        borrowerName: borrowerName || 'កូនបំណុល',
        borrowerPhone,
        principalAmount: validPrincipal,
        dailyRate: validDailyRate,
        currency,
        startDate,
        endDate: endDateIso,
        totalInstallments,
        frequency,
        agreementNote,
        createdAt: new Date().toISOString(),
        createdBy: currentUser,
        scheduleSummary: scheduleItems
      });

      if (showToast) {
        showToast(
          language === 'kh' ? '💾 រក្សាទុកកិច្ចសន្យាសុំឡើងដើមចូលក្នុងប្រព័ន្ធរួចរាល់!' : '💾 Saved hardship agreement to database!',
          'success'
        );
      }
    } catch (err) {
      console.error("Error saving hardship agreement:", err);
      if (showToast) {
        showToast(language === 'kh' ? '❌ បរាជ័យក្នុងការរក្សាទុក' : '❌ Failed to save agreement', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadImage = async (format: 'png' | 'jpg') => {
    if (!printRef.current) return;
    setIsExporting(true);

    try {
      const cleanName = (borrowerName || 'Borrower').trim().replace(/[\s/\\?%*:|"<>]/g, '_');
      const fileName = `Hardship_Settlement_${cleanName}_${startDate}.${format}`;
      const element = printRef.current;

      const exportOptions = {
        quality: 0.98,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff'
      };

      let dataUrl = '';
      if (format === 'png') {
        dataUrl = await toPng(element, exportOptions);
      } else {
        dataUrl = await toJpeg(element, exportOptions);
      }

      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (showToast) {
        showToast(
          language === 'kh' ? `✅ ទាញយក File ${format.toUpperCase()} រួចរាល់!` : `✅ Downloaded ${format.toUpperCase()}!`,
          'success'
        );
      }
    } catch (err) {
      console.error(`Error downloading ${format}:`, err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      
      {/* Print-only layout rules */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-hardship-sheet, .printable-hardship-sheet * {
            visibility: visible;
          }
          .printable-hardship-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-4xl bg-slate-900 border border-slate-750 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col my-auto max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950/80 via-slate-900 to-indigo-950/80 border-b border-slate-800 flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 font-bold shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>{language === 'kh' ? 'ប្រព័ន្ធគណនារយៈពេលសុំឡើងតែដើម' : 'Hardship Principal Settlement Calculator'}</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-mono font-bold">
                  សុំឡើងតែដើម
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {language === 'kh' 
                  ? 'គណនាចំនួនថ្ងៃសរុប តាមចំនួនប្រាក់សុំឡើងក្នុងមួយថ្ងៃ និងបែងចែកកាលវិភាគបង់ប្រាក់ច្បាស់លាស់' 
                  : 'Calculate repayment days when a borrower requests principal-only daily installments.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Grid View */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Controls Input Form Card */}
          <div className="bg-slate-950 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-4 no-print shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                {language === 'kh' ? 'បញ្ចូលព័ត៌មានគណនាប្រាក់ដើម' : 'Input Calculation Parameters'}
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">
                {language === 'kh' ? 'ឧទាហរណ៍៖ ប្រាក់ដើម $550, សុំឡើង $15/ថ្ងៃ' : 'Example: $550 principal, $15/day rate'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              
              {/* Borrower Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>{language === 'kh' ? 'ឈ្មោះកូនបំណុល' : 'Borrower Name'}</span>
                </label>
                <input
                  type="text"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  placeholder="ឧ. វីរៈ"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-750 rounded-xl font-semibold text-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              {/* Borrower Phone */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === 'kh' ? 'លេខទូរស័ព្ទ (មិនបាច់បាន)' : 'Phone Number'}</span>
                </label>
                <input
                  type="text"
                  value={borrowerPhone}
                  onChange={(e) => setBorrowerPhone(e.target.value)}
                  placeholder="070 XXX XXX"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-750 rounded-xl font-semibold text-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              {/* Currency Selector */}
              <div className="space-y-1">
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
                          ? 'bg-amber-600 text-white shadow' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {curr === 'USD' ? '$ USD' : '៛ KHR'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Principal Amount */}
              <div className="space-y-1 sm:col-span-1">
                <label className="font-bold text-slate-300 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === 'kh' ? 'ប្រាក់ដើមត្រូវសងសរុប' : 'Outstanding Principal'}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-emerald-400 text-sm">
                    {currSymbol}
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    placeholder={language === 'kh' ? 'បញ្ចូលចំនួនប្រាក់ដើម' : 'Enter amount'}
                    value={principalAmount}
                    onChange={(e) => setPrincipalAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-900 border border-slate-750 rounded-xl font-black text-amber-300 text-sm focus:outline-none focus:border-amber-500 transition placeholder:text-slate-600 font-sans"
                  />
                </div>
              </div>

              {/* Daily Rate Amount */}
              <div className="space-y-1 sm:col-span-1">
                <label className="font-bold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{language === 'kh' ? 'ប្រាក់សុំឡើងក្នុងមួយថ្ងៃ' : 'Daily Payment Request'}</span>
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono">/ ថ្ងៃ</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-amber-400 text-sm">
                    {currSymbol}
                  </span>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    placeholder={language === 'kh' ? 'បញ្ចូលចំនួនប្រាក់សុំឡើង' : 'Enter daily rate'}
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-900 border border-slate-750 rounded-xl font-black text-emerald-300 text-sm focus:outline-none focus:border-amber-500 transition placeholder:text-slate-600 font-sans"
                  />
                </div>
              </div>

              {/* Start Repayment Date */}
              <div className="space-y-1 sm:col-span-1">
                <label className="font-bold text-slate-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{language === 'kh' ? 'កាលបរិច្ឆេទចាប់ផ្តើមសង' : 'Start Repayment Date'}</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-750 rounded-xl font-semibold text-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>

            </div>

            {/* Quick Preset Buttons for Daily Amount */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-400">
                ⚡️ {language === 'kh' ? 'ជ្រើសរើសចំនួនប្រាក់លឿន៖' : 'Quick Rate Chips:'}
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
          </div>

          {/* Key Calculation Results Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 no-print">
            
            <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                {language === 'kh' ? 'ប្រាក់ដើមត្រូវសង' : 'Total Principal'}
              </p>
              <p className="text-xl font-black text-white">
                {currSymbol}{validPrincipal.toLocaleString()} <span className="text-xs text-slate-400 font-normal">{currency}</span>
              </p>
            </div>

            <div className="p-4 bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-800/40 rounded-2xl space-y-1">
              <p className="text-[10px] font-black text-amber-300 uppercase tracking-wider">
                {language === 'kh' ? 'ប្រាក់សុំឡើងក្នុងមួយថ្ងៃ' : 'Daily Payment Rate'}
              </p>
              <p className="text-xl font-black text-amber-300">
                {currSymbol}{validDailyRate.toLocaleString()} <span className="text-xs text-amber-200/70 font-normal">/ ថ្ងៃ</span>
              </p>
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-950/40 to-slate-900 border border-blue-800/40 rounded-2xl space-y-1">
              <p className="text-[10px] font-black text-blue-300 uppercase tracking-wider">
                {language === 'kh' ? 'ចំនួនថ្ងៃត្រូវសងសរុប' : 'Total Days Required'}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-blue-400">{totalInstallments}</span>
                <span className="text-xs font-bold text-blue-300">ថ្ងៃ ({totalInstallments} ដង)</span>
              </div>
              {remainder > 0.001 && (
                <p className="text-[10px] text-blue-200/80 font-medium">
                  ({fullPaymentsCount} ថ្ងៃ x {currSymbol}{validDailyRate} + ថ្ងៃចុងក្រោយ {currSymbol}{remainder.toFixed(2)})
                </p>
              )}
            </div>

            <div className="p-4 bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-800/40 rounded-2xl space-y-1">
              <p className="text-[10px] font-black text-emerald-300 uppercase tracking-wider">
                {language === 'kh' ? 'ថ្ងៃបញ្ចប់ការសង' : 'Expected Completion Date'}
              </p>
              <p className="text-sm font-black text-emerald-300">
                {endDateFormatted}
              </p>
              <p className="text-[10px] text-emerald-400/80 font-mono">
                {endDateIso}
              </p>
            </div>

          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950 border border-slate-800 rounded-2xl no-print">
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyTelegramText}
                className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-sky-500/20 active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Send className="w-4 h-4" />}
                <span>{copied ? 'បានចម្លងរួចរាល់!' : 'ចម្លងកាលវិភាគផ្ញើតាម Telegram'}</span>
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveToFirestore}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-slate-700"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>{isSaving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកក្នុងប្រព័ន្ធ'}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleDownloadImage('png')}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-emerald-100" />
                <span>Save PNG</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print/PDF</span>
              </button>
            </div>

          </div>

          {/* Printable Sheet View / Breakdown Table */}
          <div ref={printRef} className="printable-hardship-sheet bg-white text-slate-900 p-6 sm:p-8 rounded-2xl shadow-xl space-y-5 border border-slate-200">
            
            {/* Header Document */}
            <div className="text-center space-y-1 pb-3 border-b-2 border-slate-900">
              <p className="font-black text-xs sm:text-sm tracking-widest text-slate-900 uppercase">
                ព្រះរាជាណាចក្រកម្ពុជា - ជាតិ សាសនា ព្រះមហាក្សត្រ
              </p>
              <h1 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight pt-1">
                កាលវិភាគសងប្រាក់ដើមពិសេស (សុំឡើងតែដើម)
              </h1>
              <p className="text-[11px] text-slate-600 font-bold">
                HARDSHIP PRINCIPAL-ONLY REPAYMENT SCHEDULE
              </p>
            </div>

            {/* Contract Borrower & Loan Summary Table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-amber-50/60 p-4 rounded-xl border border-amber-200">
              <div className="space-y-1">
                <p><span className="font-bold text-slate-900">ឈ្មោះកូនបំណុល៖</span> <span className="font-black text-blue-900">{borrowerName || '................................'}</span></p>
                <p><span className="font-bold text-slate-900">លេខទូរស័ព្ទ៖</span> {borrowerPhone || '....................'}</p>
                <p><span className="font-bold text-slate-900">ថ្ងៃចាប់ផ្តើមសង៖</span> {startDate}</p>
              </div>
              <div className="space-y-1">
                <p><span className="font-bold text-slate-900">ប្រាក់ដើមត្រូវសងសរុប៖</span> <span className="font-black text-emerald-800 text-sm">{currSymbol}{validPrincipal.toLocaleString()} {currency}</span></p>
                <p><span className="font-bold text-slate-900">ប្រាក់សុំឡើងក្នុងមួយថ្ងៃ៖</span> <span className="font-black text-amber-800">{currSymbol}{validDailyRate.toLocaleString()} {currency} / ថ្ងៃ</span></p>
                <p><span className="font-bold text-slate-900">ចំនួនថ្ងៃសរុប៖</span> <span className="font-black text-slate-950">{totalInstallments} ថ្ងៃ (បញ្ចប់ថ្ងៃ {endDateIso})</span></p>
              </div>
            </div>

            {/* Agreement Terms */}
            <div className="text-xs text-slate-800 space-y-1 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-900">
                📝 <span className="underline">កិច្ចព្រមព្រៀងសុំឡើងតែដើម៖</span>
              </p>
              <p>
                ដោយសារកូនបំណុលឈ្មោះ <span className="font-bold">{borrowerName || '................'}</span> ជួបការលំបាកផ្នែកហិរញ្ញវត្ថុ ម្ចាស់បំណុលបានយល់ព្រមអោយកូនបំណុលសងតែប្រាក់ដើមចំនួន <span className="font-bold">{currSymbol}{validPrincipal.toLocaleString()} {currency}</span> ដោយបង់ជាប្រចាំថ្ងៃចំនួន <span className="font-bold">{currSymbol}{validDailyRate} {currency} / ថ្ងៃ</span> រហូតដល់គ្រប់ចំនួនថ្ងៃសរុប <span className="font-bold">{totalInstallments} ថ្ងៃ</span>។
              </p>
            </div>

            {/* Schedule Table */}
            <div className="space-y-2">
              <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>📋 កាលវិភាគបង់ប្រាក់ប្រចាំថ្ងៃ ({totalInstallments} ថ្ងៃ)</span>
                <span className="text-[10px] text-slate-500 font-normal">គណនាត្រឹមត្រូវតាមប្រព័ន្ធ</span>
              </h3>

              <div className="overflow-x-auto rounded-xl border border-slate-300">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-black">
                      <th className="p-2.5 border-b border-slate-800 text-center w-12">លើកទី</th>
                      <th className="p-2.5 border-b border-slate-800">កាលបរិច្ឆេទ</th>
                      <th className="p-2.5 border-b border-slate-800 text-right">ចំនួនប្រាក់ត្រូវបង់</th>
                      <th className="p-2.5 border-b border-slate-800 text-right">ប្រាក់ដើមនៅសល់</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                    {scheduleItems.map((item) => {
                      const isFinal = item.step === totalInstallments;
                      return (
                        <tr key={item.step} className={isFinal ? 'bg-amber-100/80 font-bold' : item.step % 2 === 0 ? 'bg-slate-50/80' : 'bg-white'}>
                          <td className="p-2 text-center font-bold text-slate-700">{item.step}</td>
                          <td className="p-2">
                            <div className="font-bold text-slate-900">{item.dateFormatted}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{item.isoDate}</div>
                          </td>
                          <td className="p-2 text-right font-black text-emerald-800">
                            {currSymbol}{item.amount.toFixed(2)}
                            {isFinal && <span className="text-[9px] block text-amber-800 font-bold">(ថ្ងៃចុងក្រោយ)</span>}
                          </td>
                          <td className="p-2 text-right font-bold text-slate-800">
                            {currSymbol}{item.remaining.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signature Block */}
            <div className="pt-4 border-t border-slate-300 grid grid-cols-2 gap-4 text-center text-xs">
              <div className="space-y-1">
                <p className="font-bold text-slate-900">ស្នាមមេដៃ/ហត្ថលេខា ម្ចាស់បំណុល</p>
                <div className="h-16 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[10px] text-slate-400">
                  ( ភាគី "ក" )
                </div>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-slate-900">ស្នាមមេដៃ/ហត្ថលេខា កូនបំណុល</p>
                <div className="h-16 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[10px] text-slate-400">
                  ( ភាគី "ខ" )
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between no-print text-xs shrink-0">
          <div className="text-slate-400 font-medium">
            💡 ប្រព័ន្ធគណនាសម្រាប់កូនបំណុលសុំឡើងតែដើម (Hardship Settlement System)
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition cursor-pointer border border-slate-700"
          >
            បិទ (Close)
          </button>
        </div>

      </motion.div>
    </div>
  );
}
