import React, { useState, useEffect } from 'react';
import { Borrower, Payment, ReportedPayment } from '../types';
import { formatMoney, formatKhmerDate, getFrequencyLabel } from '../utils';
import { Phone, Calendar, ArrowLeft, ShieldCheck, Check, Clock, TrendingUp, DollarSign, RefreshCw, AlertCircle, MessageCircle, QrCode, X, Upload, Camera, CheckCircle2, Sparkles, Copy } from 'lucide-react';
import { useLanguage } from '../i18n';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import LiveChat from './LiveChat';
import AvatarWithFrame from './AvatarWithFrame';
import FrameSelectorModal from './FrameSelectorModal';

interface BorrowerPortalProps {
  borrower: Borrower;
  onBackToLender?: () => void;
  isLenderLoggedIn?: boolean;
}

export default function BorrowerPortal({ borrower, onBackToLender, isLenderLoggedIn }: BorrowerPortalProps) {
  const { language } = useLanguage();
  const payments = Array.isArray(borrower.payments) ? borrower.payments : [];
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isQrZoomOpen, setIsQrZoomOpen] = useState(false);
  const [isFrameModalOpen, setIsFrameModalOpen] = useState(false);
  const [lenderProfile, setLenderProfile] = useState<any>(null);
  const [globalQrConfig, setGlobalQrConfig] = useState<any>(null);
  
  // Real-time QR Configuration from Firestore settings/qr_config
  useEffect(() => {
    const unsubscribeQr = onSnapshot(doc(db, 'settings', 'qr_config'), (docSnap) => {
      if (docSnap.exists()) {
        setGlobalQrConfig(docSnap.data());
      }
    }, (err) => {
      console.error('Error listening to qr config in BorrowerPortal:', err);
    });
    return () => unsubscribeQr();
  }, []);

  const activePaymentQr = borrower.paymentQr || lenderProfile?.paymentQr || globalQrConfig?.qrImageUrl;
  
  // Payment reporting states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [receiptBase64, setReceiptBase64] = useState<string>('');
  const [reportNote, setReportNote] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | null>(null);
  
  // Real-time Portal Configuration from Firestore settings/portal_config
  const [portalConfig, setPortalConfig] = useState<any>({
    logoType: 'text',
    logoText: 'LP',
    logoBgColor: '#2563EB',
    logoTextColor: '#FFFFFF',
    logoImageUrl: '',
    portalTitle: 'Luypay Ledger',
    marqueeText: 'មានទទួលដាក់លុយឈរលុយឆក់ ចាប់ពី 50$ រហូតដល់ 500$ | Facebook: ឈ្មោះ Pich Rachana',
    noticeTitle: 'សេចក្តីជូនដំណឹងអំពីគណនេយ្យ',
    noticeText: 'ទំព័រនេះសម្រាប់ត្រួតពិនិត្យសមតុល្យ និងប្រវត្តិសងប្រាក់ផ្ទាល់ខ្លួន។ រាល់ការបង់ប្រាក់ដែលលោកអ្នកបានវេរ ឬប្រគល់ជូន នឹងត្រូវម្ចាស់បំណុលបញ្ជាក់ និងកត់ត្រាចូលក្នុងប្រព័ន្ធនេះភ្លាមៗ។',
    sponsorEnabled: true,
    sponsorImageUrl: '',
    sponsorLinkUrl: '',
    sponsorTitle: ''
  });

  useEffect(() => {
    const unsubscribePortal = onSnapshot(doc(db, 'settings', 'portal_config'), (docSnap) => {
      if (docSnap.exists()) {
        setPortalConfig(docSnap.data());
      }
    }, (err) => {
      console.error('Error listening to portal config in BorrowerPortal:', err);
    });
    return () => {
      unsubscribePortal();
    };
  }, []);

  // Fetch Lender Profile to get global payment QR code if individual is not set
  useEffect(() => {
    if (!borrower.userId) return;
    const unsubscribeLender = onSnapshot(doc(db, 'members', borrower.userId), (docSnap) => {
      if (docSnap.exists()) {
        setLenderProfile(docSnap.data());
      }
    }, (err) => {
      console.error('Error listening to lender profile in BorrowerPortal:', err);
    });
    return () => unsubscribeLender();
  }, [borrower.userId]);

  // Online Status and Heartbeat Tracking (Only when real borrower is visiting, i.e., not when lender is logged in/viewing)
  useEffect(() => {
    if (isLenderLoggedIn) return;

    const docRef = doc(db, 'borrowers', borrower.id);

    const markOnline = async () => {
      try {
        await updateDoc(docRef, {
          isOnline: true,
          lastActive: Date.now()
        });
      } catch (err) {
        console.error("Error setting borrower online status:", err);
      }
    };

    const markOffline = async () => {
      try {
        await updateDoc(docRef, {
          isOnline: false,
          lastActive: Date.now()
        });
      } catch (err) {
        console.error("Error setting borrower offline status:", err);
      }
    };

    // Set online instantly on load
    markOnline();

    // Heartbeat every 20 seconds to renew lastActive timestamp
    const interval = setInterval(() => {
      markOnline();
    }, 20000);

    // Event listener for tab/browser closing (Best effort)
    const handleUnload = () => {
      // In firestore, let's try direct promise or sendBeacon isn't directly compatible, but standard async in unload works frequently
      markOffline();
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
      markOffline();
    };
  }, [borrower.id, isLenderLoggedIn]);

  const handleUpdateBorrower = async (updatedFields: Partial<Borrower>) => {
    try {
      const docRef = doc(db, 'borrowers', borrower.id);
      await updateDoc(docRef, updatedFields);
    } catch (err) {
      console.error("Error updating chat messages from borrower portal:", err);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
      setToastType(null);
    }, 4000);
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;
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
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const base64Str = canvas.toDataURL('image/jpeg', 0.8);
          setReceiptBase64(base64Str);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitReport = async () => {
    if (!receiptBase64) {
      showToast(language === 'kh' ? 'សូមបញ្ចូលរូបភាពវិក្កយបត្របង់ប្រាក់!' : 'Please upload the payment receipt image!', 'error');
      return;
    }

    setIsSubmittingReport(true);
    try {
      const amountToPay = selectedInstallment === -1 
        ? parseFloat(customAmount) || borrower.installmentAmount 
        : borrower.installmentAmount;

      const newReport: ReportedPayment = {
        id: 'rep_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        installmentIndex: selectedInstallment,
        amount: amountToPay,
        date: new Date().toISOString(),
        receiptImage: receiptBase64,
        status: 'pending',
        note: reportNote.trim()
      };

      const docRef = doc(db, 'borrowers', borrower.id);
      const existingReports = Array.isArray(borrower.reportedPayments) ? borrower.reportedPayments : [];
      await updateDoc(docRef, {
        reportedPayments: [...existingReports, newReport]
      });

      setReceiptBase64('');
      setReportNote('');
      setCustomAmount('');
      setIsReportModalOpen(false);
      showToast(
        language === 'kh' 
          ? 'បានផ្ញើវិក្កយបត្របង់ប្រាក់ជោគជ័យ! ម្ចាស់បំណុលនឹងពិនិត្យឆាប់ៗនេះ។' 
          : 'Receipt submitted successfully! The lender will review it shortly.', 
        'success'
      );
    } catch (err) {
      console.error('Error submitting payment report:', err);
      showToast(
        language === 'kh' 
          ? 'មានបញ្ហាក្នុងការផ្ញើវិក្កយបត្រ សូមព្យាយាមម្តងទៀត!' 
          : 'Failed to submit payment report. Please try again.', 
        'error'
      );
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Calculate stats
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, borrower.totalToPay - totalPaid);
  const progressPercent = Math.min(100, Math.round((totalPaid / borrower.totalToPay) * 100));
  const isCompleted = remaining <= 0;

  // Map payments by installment index for easy grid lookup
  const paymentBySlot: Record<number, Payment> = {};
  payments.forEach((p) => {
    if (p && p.installmentIndex !== -1) {
      paymentBySlot[p.installmentIndex] = p;
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12 flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 border text-xs font-bold ${
            toastType === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-emerald-500/10' 
              : 'bg-rose-50 border-rose-200 text-rose-850 shadow-rose-500/10'
          }`}>
            <CheckCircle2 className={`w-4 h-4 ${toastType === 'success' ? 'text-emerald-600' : 'text-rose-500'}`} />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Marquee Banner */}
      <div id="portal-marquee-banner" className="bg-amber-500 text-slate-950 font-bold text-xs py-2 shadow-sm border-b border-amber-600/20 select-none shrink-0 z-40 overflow-hidden w-full">
        <div className="animate-marquee-smooth flex">
          <span className="inline-block mr-12 shrink-0">
            ✨ <span className="font-extrabold text-amber-950">{language === 'kh' ? 'សេចក្តីជូនដំណឹង៖' : 'Announcement:'}</span> {portalConfig.marqueeText || 'មានទទួលដាក់លុយឈរលុយឆក់ ចាប់ពី 50$ រហូតដល់ 500$'}
          </span>
          <span className="inline-block mr-12 shrink-0">
            ✨ <span className="font-extrabold text-amber-950">{language === 'kh' ? 'សេចក្តីជូនដំណឹង៖' : 'Announcement:'}</span> {portalConfig.marqueeText || 'មានទទួលដាក់លុយឈរលុយឆក់ ចាប់ពី 50$ រហូតដល់ 500$'}
          </span>
          <span className="inline-block mr-12 shrink-0">
            ✨ <span className="font-extrabold text-amber-950">{language === 'kh' ? 'សេចក្តីជូនដំណឹង៖' : 'Announcement:'}</span> {portalConfig.marqueeText || 'មានទទួលដាក់លុយឈរលុយឆក់ ចាប់ពី 50$ រហូតដល់ 500$'}
          </span>
          <span className="inline-block mr-12 shrink-0">
            ✨ <span className="font-extrabold text-amber-950">{language === 'kh' ? 'សេចក្តីជូនដំណឹង៖' : 'Announcement:'}</span> {portalConfig.marqueeText || 'មានទទួលដាក់លុយឈរលុយឆក់ ចាប់ពី 50$ រហូតដល់ 500$'}
          </span>
        </div>
      </div>

      {/* Top Banner / Navigation */}
      <header className="bg-slate-900 text-white py-4 px-6 sticky top-0 z-40 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {portalConfig.logoType === 'image' && portalConfig.logoImageUrl ? (
              <img
                src={portalConfig.logoImageUrl}
                alt="Logo"
                className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-lg"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-base shadow-lg"
                style={{
                  backgroundColor: portalConfig.logoBgColor || '#2563EB',
                  color: portalConfig.logoTextColor || '#FFFFFF'
                }}
              >
                {portalConfig.logoText || 'LP'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black tracking-wider uppercase">{portalConfig.portalTitle || 'Luypay Ledger'}</h1>
                <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700/50">
                  <a
                    href="https://www.facebook.com/share/1F4p12PfJx/?mibextid=wwXIfr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-blue-400 transition"
                    title="Facebook Link"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z"/>
                    </svg>
                  </a>
                  <a
                    href="https://t.me/laymeancamera"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-sky-400 transition"
                    title="Telegram Link"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.36-.49.99-.75 3.88-1.69 6.47-2.8 7.77-3.32 3.7-1.49 4.47-1.75 4.97-1.76.11 0 .36.03.52.16.14.11.18.26.19.38 0 .09-.01.27-.02.39z"/>
                    </svg>
                  </a>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-bold -mt-0.5">{language === 'kh' ? 'លិខិតសងប្រាក់អេឡិចត្រូនិច' : 'Digital Debt Receipt'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-950 text-blue-400 text-[10px] font-extrabold border border-blue-800/30">
              <ShieldCheck className="w-3.5 h-3.5 animate-pulse" />
              <span>{language === 'kh' ? 'មើលតែប៉ុណ្ណោះ (Read-Only)' : 'Read-Only'}</span>
            </span>

            {/* If the lender is logged in, show a way to return to dashboard */}
            {isLenderLoggedIn && onBackToLender && (
              <button
                onClick={onBackToLender}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{language === 'kh' ? 'ផ្ទាំងគ្រប់គ្រង (Dashboard)' : 'Dashboard'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-6 space-y-6">
        {/* Notice Info alert bar */}
        <div className="bg-blue-50 border border-blue-200/60 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider">{portalConfig.noticeTitle || 'សេចក្តីជូនដំណឹងអំពីគណនេយ្យ'}</h4>
            <p className="text-xs text-blue-800 leading-relaxed font-medium">
              {portalConfig.noticeText || 'ទំព័រនេះសម្រាប់ត្រួតពិនិត្យសមតុល្យ និងប្រវត្តិសងប្រាក់ផ្ទាល់ខ្លួន។'}
            </p>
          </div>
        </div>

        {/* Borrower Hero Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
            {/* Profile Photo */}
            <div className="shrink-0 z-30">
              <AvatarWithFrame
                photoUrl={borrower.profilePhoto}
                name={borrower.name}
                frameId={borrower.avatarFrame}
                size="md"
                editable={true}
                onClick={() => setIsFrameModalOpen(true)}
                hasWarning={!!borrower.interestOnlyExtension}
              />
            </div>
            
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-black text-slate-900">{borrower.name}</h2>
                {borrower.statusTag && (
                  <span className={`inline-flex items-center text-xs font-extrabold px-2.5 py-1 rounded-xl border ${
                    borrower.statusTag === 'good'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : borrower.statusTag === 'late'
                        ? 'bg-rose-50 text-rose-700 border-rose-100'
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {borrower.statusTag === 'good' ? '🟢 ស្ថានភាព៖ ល្អណាស់ (Good)' : borrower.statusTag === 'late' ? '🔴 ស្ថានភាព៖ យឺតយ៉ាវ (Late)' : '🟡 ស្ថានភាព៖ ធម្មតា (Regular)'}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                {borrower.phone && (
                  <a href={`tel:${borrower.phone}`} className="flex items-center gap-1.5 text-blue-600 hover:underline">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{borrower.phone}</span>
                  </a>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>ថ្ងៃខ្ចី៖ {formatKhmerDate(borrower.loanDate)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>វគ្គបង់៖ {getFrequencyLabel(borrower.frequency)}</span>
                </div>
              </div>
            </div>
          </div>



          {/* Custom notice from Lender */}
          <div className="flex-1 max-w-md bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start shadow-sm mx-0 md:mx-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="text-xl shrink-0">📣</span>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">
                {language === 'kh' ? 'សារជូនដំណឹងរំលឹកពីម្ចាស់បំណុល' : 'Notice from Lender'}
              </span>
              <p className="text-xs font-bold text-slate-700 leading-relaxed whitespace-pre-line">
                {borrower.noticeMessage || (language === 'kh' ? 'សូមបង់ប្រាក់ឱ្យបានទៀងទាត់ និងទាន់ពេលវេលា។ សូមអរគុណ!' : 'Please make payments on time and regularly. Thank you!')}
              </p>
            </div>
          </div>

          <div className="text-left md:text-right border-t md:border-t-0 border-slate-100 pt-4 md:pt-0 shrink-0">
            <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider mb-0.5">ស្ថានភាពកិច្ចសន្យា</span>
            <span className={`text-sm font-black px-3.5 py-1.5 rounded-full inline-block ${
              isCompleted 
                ? 'bg-slate-100 text-slate-500 border border-slate-200' 
                : 'bg-blue-50 text-blue-700 border border-blue-100'
            }`}>
              {isCompleted ? '🎉 បានទូទាត់សងរួចរាល់ (Completed)' : '📈 កំពុងសងប្រាក់ (Active)'}
            </span>
          </div>
        </div>

        {borrower.interestOnlyExtension && (
          <div className="p-5 bg-amber-50 border-2 border-amber-500/30 rounded-3xl flex flex-col gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">⚠️</span>
              <div className="space-y-1 w-full">
                <h4 className="text-sm font-black text-amber-900 flex items-center gap-1.5 flex-wrap">
                  <span>{language === 'kh' ? 'កូនបំណុលបានស្នើសុំពន្យារពេល (បង់ការបន្តរ)' : 'Borrower Requested Extension (Interest-Only)'}</span>
                  <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                </h4>
                
                {borrower.interestOnlyExtensionReason && (
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                    <span>📢 {language === 'kh' ? 'លក្ខខណ្ឌស្នើសុំ៖' : 'Reason:'}</span>
                    <span className="font-extrabold">{borrower.interestOnlyExtensionReason}</span>
                  </div>
                )}

                {borrower.interestOnlyExtensionNote && (
                  <p className="text-xs font-bold text-slate-600 bg-white p-3 border border-slate-100 rounded-2xl whitespace-pre-line leading-relaxed mt-2 shadow-sm">
                    {language === 'kh' ? 'កំណត់ចំណាំបន្ថែម៖ ' : 'Extension Note: '}{borrower.interestOnlyExtensionNote}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {borrower.topUpLoanAmount !== undefined && borrower.topUpLoanAmount > 0 && (
          <div className="p-5 bg-indigo-50 border-2 border-indigo-500/30 rounded-3xl flex flex-col gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">💸</span>
              <div className="space-y-1 w-full">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-sm font-black text-indigo-900">
                    {language === 'kh' ? 'កម្ចីឌីជីថលបន្ថែមលើកម្ចីចាស់ (Top-up Loan)' : 'Digital Top-up Loan Active'}
                  </h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                    borrower.topUpSeparate !== false
                      ? 'bg-purple-100 text-purple-800 border-purple-200'
                      : 'bg-blue-100 text-blue-800 border-blue-200'
                  }`}>
                    {borrower.topUpSeparate !== false
                      ? (language === 'kh' ? '🔍 ចែកដាច់ពីកម្ចីចាស់ (Separate)' : '🔍 Separate Loan')
                      : (language === 'kh' ? '🔗 បូកបញ្ចូលគ្នា (Merged)' : '🔗 Merged Loan')
                    }
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  <div className="bg-white p-3 rounded-2xl border border-indigo-100 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {language === 'kh' ? 'ទឹកប្រាក់ខ្ចីបន្ថែម' : 'Top-up Amount'}
                      </span>
                      <span className="text-base font-black text-indigo-900">
                        {formatMoney(borrower.topUpLoanAmount, borrower.currency)}
                      </span>
                    </div>
                    {borrower.topUpSeparate === false && (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                        {language === 'kh' ? '+បូកបញ្ចូលរួច' : '+Already Merged'}
                      </span>
                    )}
                  </div>

                  {borrower.topUpDate && (
                    <div className="bg-white p-3 rounded-2xl border border-indigo-100 shadow-sm">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {language === 'kh' ? 'កាលបរិច្ឆេទបន្ថែមប្រាក់' : 'Top-up Date'}
                      </span>
                      <span className="text-sm font-bold text-slate-700">
                        {formatKhmerDate(borrower.topUpDate)}
                      </span>
                    </div>
                  )}
                </div>

                {borrower.topUpNotes && (
                  <div className="mt-3 bg-white p-3 border border-indigo-100 rounded-2xl shadow-sm">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      {language === 'kh' ? 'កំណត់ចំណាំកម្ចីបន្ថែម៖' : 'Top-up Notes:'}
                    </span>
                    <p className="text-xs font-bold text-indigo-950 whitespace-pre-line leading-relaxed">
                      {borrower.topUpNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Financial Overview Grid & Repayment Checklist */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Stats column (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Beautiful KHQR Payment Card Frame */}
            {activePaymentQr && (
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-blue-600" />
                    <span>{language === 'kh' ? 'ព័ត៌មានគណនី និង QR សងប្រាក់' : 'Account Details & QR Code'}</span>
                  </h3>
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {language === 'kh' ? 'បង់លុយសង' : 'REPAY'}
                  </span>
                </div>

                {/* KHQR Card Frame */}
                <div className="bg-[#071324] text-white p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4 flex flex-col items-center relative overflow-hidden group">
                  {/* Bank Banner Accent */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-2"
                    style={{ backgroundColor: globalQrConfig?.bankColor || '#E61A22' }}
                  />
                  
                  <div className="text-center space-y-1 w-full pt-1">
                    <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: globalQrConfig?.bankColor || '#E61A22' }}>
                      {globalQrConfig?.bankName || (language === 'kh' ? 'គណនីទទួលប្រាក់' : 'RECEIVING BANK')}
                    </p>
                    <h4 className="text-base font-black text-white tracking-wide uppercase truncate max-w-full">
                      {globalQrConfig?.accountName || 'SOUN RAVIN'}
                    </h4>
                    {/* KHQR standard big bold "0" */}
                    <div className="text-4xl font-black text-white select-none font-mono leading-none">0</div>
                  </div>

                  {/* Dotted Divider */}
                  <div className="w-full border-t border-dashed border-slate-800/80" />

                  {/* QR Image Container (Guaranteed square and never cut off) */}
                  <div 
                    onClick={() => setIsQrZoomOpen(true)}
                    className="bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center relative select-none cursor-zoom-in transition hover:scale-[1.02] active:scale-[0.98] w-full max-w-[190px] aspect-square mx-auto overflow-hidden"
                  >
                    <img
                      src={activePaymentQr}
                      alt="Payment QR"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Copyable account details inside card */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-1">
                    <div className="py-2 px-3 bg-[#0C1A2E] text-slate-300 rounded-xl text-center border border-slate-850 flex flex-col items-center justify-center gap-0.5">
                      <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">{language === 'kh' ? 'លេខគណនី' : 'Account ID'}</span>
                      <div className="flex items-center gap-1.5 min-w-0 max-w-full">
                        <span className="text-xs font-mono font-black text-white truncate">{globalQrConfig?.accountId || '000469096'}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(globalQrConfig?.accountId || '000469096');
                            setToastMessage(language === 'kh' ? 'បានចម្លងលេខគណនីជោគជ័យ!' : 'Copied account ID!');
                            setToastType('success');
                            setTimeout(() => setToastMessage(null), 3000);
                          }}
                          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="py-2 px-3 bg-[#0C1A2E] text-slate-300 rounded-xl text-center border border-slate-850 flex flex-col items-center justify-center gap-0.5">
                      <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">{language === 'kh' ? 'ឈ្មោះគណនី' : 'Account Name'}</span>
                      <span className="text-[10px] font-black text-white truncate max-w-full block uppercase">{globalQrConfig?.accountName || 'SOUN RAVIN'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Financial Stats box */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-5 shadow-sm">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-slate-500" />
                <span>របាយការណ៍សមតុល្យគណនេយ្យ</span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">ប្រាក់ខ្ចីដើម</span>
                  <span className="text-base font-black text-slate-800">{formatMoney(borrower.principal, borrower.currency)}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">ប្រាក់សរុបត្រូវសង</span>
                  <span className="text-base font-black text-slate-800">{formatMoney(borrower.totalToPay, borrower.currency)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-600 block mb-1">បានសងសរុបរួច</span>
                  <span className="text-base font-black text-emerald-600">{formatMoney(totalPaid, borrower.currency)}</span>
                </div>
                <div className="bg-orange-50/60 p-4 rounded-2xl border border-orange-100">
                  <span className="text-[10px] font-bold text-orange-600 block mb-1">ប្រាក់នៅសល់ខ្វះ</span>
                  <span className={`text-base font-black ${isCompleted ? 'text-slate-300 line-through' : 'text-orange-600'}`}>
                    {formatMoney(remaining, borrower.currency)}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-500">វឌ្ឍនភាពនៃការសងប្រាក់</span>
                  <span className="text-blue-600 font-black">{progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200/50 p-[1px]">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Additional loan terms details */}
              <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs text-slate-500 font-bold">
                {borrower.interestValue !== undefined && (
                  <div className="flex justify-between">
                    <span>ការប្រាក់ (Interest Rate)៖</span>
                    <span className="text-slate-800">
                      {borrower.interestType === 'percent' ? `${borrower.interestValue}%` : formatMoney(borrower.interestValue, borrower.currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>គណនាការប្រាក់៖</span>
                  <span className="text-slate-800">
                    {borrower.interestCalculation === 'per-period' ? '🔄 ការប្រាក់ប្រចាំវគ្គ' : '🎯 ការប្រាក់សរុប (Flat)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>របៀបសងប្រាក់៖</span>
                  <span className="text-blue-700">
                    {borrower.paymentMode === 'interest-only' ? '📈 បង់តែការសុទ្ធ (Interest Only)' : '💵 បង់ទាំងដើមទាំងការ'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>ប្រាក់ត្រូវបង់ក្នុងមួយវគ្គ៖</span>
                  <span className="text-blue-600 font-black">{formatMoney(borrower.installmentAmount, borrower.currency)}</span>
                </div>
                {borrower.notes && (
                  <div className="pt-3 text-[11px] text-slate-400 border-t border-slate-100">
                    <span className="font-bold block text-slate-500 mb-1">កំណត់ចំណាំពីម្ចាស់បំណុល៖</span>
                    <p className="whitespace-pre-line text-slate-600 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {borrower.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Report KHQR Payment Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4 shadow-sm">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>រាយការណ៍ការបង់ប្រាក់តាម KHQR</span>
              </h3>

              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                បន្ទាប់ពីលោកអ្នកបានធ្វើការស្កេន KHQR ដើម្បីបង់ប្រាក់សងរួចរាល់ សូមផ្ញើវិក្កយបត្រ (Receipt) មកកាន់ពួកយើងដើម្បីប្រព័ន្ធបញ្ជាក់ការបង់ប្រាក់ដោយស្វ័យប្រវត្តិ។
              </p>

              <button
                type="button"
                onClick={() => {
                  // Find first unpaid installment to pre-select
                  let firstUnpaid = 0;
                  for (let i = 0; i < borrower.duration; i++) {
                    if (!paymentBySlot[i]) {
                      firstUnpaid = i;
                      break;
                    }
                  }
                  setSelectedInstallment(firstUnpaid);
                  setIsReportModalOpen(true);
                }}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-[0.99] text-white text-xs font-extrabold rounded-2xl shadow-md shadow-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/20"
              >
                <Upload className="w-4 h-4" />
                <span>{language === 'kh' ? 'ផ្ញើវិក្កយបត្របង់ប្រាក់ (Upload Receipt)' : 'Upload Payment Receipt'}</span>
              </button>

              {/* List of reported payments */}
              {borrower.reportedPayments && borrower.reportedPayments.length > 0 && (
                <div className="space-y-2.5 pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">
                    ប្រវត្តិផ្ញើវិក្កយបត្រផ្ទៀងផ្ទាត់ ({borrower.reportedPayments.length})
                  </span>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {[...borrower.reportedPayments].reverse().map((rep) => (
                      <div key={rep.id} className="p-3 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-center justify-between gap-3 text-xs">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-700">
                              {rep.installmentIndex === -1 ? 'បង់តាមចិត្ត' : `វគ្គទី ${rep.installmentIndex + 1}`}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {new Date(rep.date).toLocaleDateString('km-KH', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div className="text-blue-600 font-black">
                            {formatMoney(rep.amount, borrower.currency)}
                          </div>
                          {rep.note && (
                            <div className="text-[10px] text-slate-400 font-medium truncate">
                              "{rep.note}"
                            </div>
                          )}
                          {rep.status === 'rejected' && rep.rejectedReason && (
                            <div className="text-[10px] text-rose-500 font-bold bg-rose-50 p-1.5 rounded-lg border border-rose-100/50 mt-1">
                              មូលហេតុ៖ {rep.rejectedReason}
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 text-right">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black border ${
                            rep.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : rep.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>
                            {rep.status === 'pending' && '⏱️ រង់ចាំពិនិត្យ'}
                            {rep.status === 'approved' && '✅ បានអនុម័ត'}
                            {rep.status === 'rejected' && '❌ ត្រូវបដិសេធ'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Repayment Checkboard (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 flex-1 flex flex-col shadow-sm">
              <div>
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>កាតគ្រីស្គូរបង់ប្រាក់ (Installment Calendar)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ប្រអប់ពណ៌បៃតងតំណាងឱ្យវគ្គដែលលោកអ្នកបានទូទាត់រួចរាល់។
                </p>
              </div>

              {/* Installment Boxes Grid - static/disabled */}
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-6 gap-3 pt-1 overflow-y-auto max-h-[300px] md:max-h-[380px] p-1 border border-slate-100 rounded-2xl">
                {Array.from({ length: borrower.duration }).map((_, index) => {
                  const payment = paymentBySlot[index];
                  const isPaid = !!payment;

                  return (
                    <div
                      key={index}
                      className={`aspect-square p-2.5 rounded-xl flex flex-col justify-between items-center border transition-all duration-150 ${
                        isPaid 
                          ? 'bg-emerald-500 border-emerald-600 text-white shadow-md shadow-emerald-500/10' 
                          : 'bg-slate-50 border-slate-200/80 text-slate-600'
                      }`}
                    >
                      <span className="text-[9px] font-black opacity-75 uppercase">វគ្គទី</span>
                      <span className="text-base font-black leading-none">{index + 1}</span>
                      {isPaid ? (
                        <Check className="w-4 h-4 mt-0.5 text-white stroke-[3px]" />
                      ) : (
                        <span className="text-[9px] font-black opacity-50">
                          {formatMoney(borrower.installmentAmount, borrower.currency).replace('៛', '៛').split(' ')[0]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend details */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 text-xs text-slate-400 font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-emerald-500 rounded-lg border border-emerald-600 shadow-sm" />
                  <span className="text-slate-600">បានទូទាត់រួច (Paid)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-slate-50 rounded-lg border border-slate-200" />
                  <span>មិនទាន់ទូទាត់ (Unpaid)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions / Payment Logs table */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>ប្រវត្តិនៃការបង់ប្រាក់សរុប (Detailed Payment Ledger)</span>
          </h3>

          {payments.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              មិនទាន់មានកាលកំណត់ ឬកត់ត្រាបង់ប្រាក់ណាមួយនៅឡើយទេ។
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">ថ្ងៃខែឆ្នាំបង់</th>
                    <th className="py-3 px-4">ចំនួនទឹកប្រាក់</th>
                    <th className="py-3 px-4">ប្រភេទនៃការបង់</th>
                    <th className="py-3 px-4">កំណត់សម្គាល់បន្ថែម</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-600">
                  {[...payments].reverse().map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/50 transition duration-100">
                      <td className="py-3 px-4 text-slate-800">{formatKhmerDate(pay.date)}</td>
                      <td className="py-3 px-4 text-blue-600 font-black text-sm">{formatMoney(pay.amount, borrower.currency)}</td>
                      <td className="py-3 px-4">
                        {pay.installmentIndex !== -1 ? (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[9px] font-black">
                            បង់វគ្គទី {pay.installmentIndex + 1}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-[9px] font-black">
                            បង់ប្រាក់តាមចិត្ត
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 italic font-medium">{pay.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dynamic Sponsor Banner / Promotion Block */}
        {portalConfig.sponsorEnabled && portalConfig.sponsorImageUrl && (
          <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm space-y-3 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {language === 'kh' ? 'Sponsored / ការផ្សព្វផ្សាយពាណិជ្ជកម្ម' : 'Sponsored / Promotion'}
              </span>
              {portalConfig.sponsorTitle && (
                <span className="text-[10px] font-black text-indigo-600 truncate max-w-[200px]">
                  {portalConfig.sponsorTitle}
                </span>
              )}
            </div>

            {portalConfig.sponsorLinkUrl ? (
              <a 
                href={portalConfig.sponsorLinkUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block hover:opacity-95 transition"
              >
                <div className="w-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center">
                  <img
                    src={portalConfig.sponsorImageUrl}
                    alt="Sponsor Banner"
                    className="w-full h-auto max-h-[350px] object-contain block"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </a>
            ) : (
              <div className="w-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center">
                <img
                  src={portalConfig.sponsorImageUrl}
                  alt="Sponsor Banner"
                  className="w-full h-auto max-h-[350px] object-contain block"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Info box */}
      <footer className="text-center text-xs font-bold text-slate-400 mt-12 space-y-1">
        <p>© {new Date().getFullYear()} Luypay Ledger. រក្សាសិទ្ធិគ្រប់យ៉ាង។</p>
        <p className="text-[10px] opacity-75">រចនានិងអភិវឌ្ឍន៍ដោយ៖ <span className="text-blue-600 font-extrabold">ឡាយមាន (Lay Mean)</span> សម្រាប់ផ្ទាំងកូនបំណុលដែលគ្មានសិទ្ធិកែប្រែទិន្នន័យ។</p>
      </footer>

      {/* Floating Live Chat Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer border border-emerald-500/30 shadow-emerald-600/20"
        title={language === 'kh' ? 'ជជែកផ្ទាល់ (Live Chat)' : 'Live Chat'}
      >
        <MessageCircle className="w-6 h-6 animate-pulse" />
        {borrower.chatMessages && borrower.chatMessages.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
            {borrower.chatMessages.length}
          </span>
        )}
      </button>

      {/* Report Payment Modal */}
      {isReportModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => setIsReportModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsReportModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                <Upload className="w-5 h-5 text-emerald-600" />
                <span>{language === 'kh' ? 'ផ្ញើវិក្កយបត្របង់ប្រាក់សង' : 'Upload Repayment Receipt'}</span>
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-1">
                សូមបំពេញព័ត៌មាន និងផ្ទុកឡើងវិក្កយបត្រផ្ទេរប្រាក់ខាងក្រោម។
              </p>
            </div>

            <div className="space-y-4">
              {/* Select Installment */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                  វគ្គដែលត្រូវទូទាត់ (Repayment Installment)
                </label>
                <select
                  value={selectedInstallment}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setSelectedInstallment(val);
                    if (val === -1) {
                      setCustomAmount(borrower.installmentAmount.toString());
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
                >
                  {Array.from({ length: borrower.duration }).map((_, index) => {
                    const isPaid = !!paymentBySlot[index];
                    return (
                      <option key={index} value={index} disabled={isPaid}>
                        វគ្គទី {index + 1} ({formatMoney(borrower.installmentAmount, borrower.currency)}) {isPaid ? ' - (បានបង់រួច)' : ''}
                      </option>
                    );
                  })}
                  <option value={-1}>បង់ប្រាក់តាមចិត្ត (Custom Amount)</option>
                </select>
              </div>

              {/* Custom Amount if selected */}
              {selectedInstallment === -1 && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                    ចំនួនទឹកប្រាក់ដែលបានបង់
                  </label>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="បញ្ចូលចំនួនទឹកប្រាក់..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              )}

              {/* Image Receipt File Upload */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                  រូបភាពវិក្កយបត្រ (Receipt Screenshot)
                </label>
                
                {receiptBase64 ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-[4/3] bg-slate-50 flex items-center justify-center group">
                    <img 
                      src={receiptBase64} 
                      alt="Receipt Preview" 
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setReceiptBase64('')}
                      className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded-xl transition cursor-pointer shadow-md"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-blue-400/60 bg-slate-50/50 hover:bg-slate-50 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 group">
                    <div className="w-10 h-10 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition">
                      <Camera className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-center space-y-0.5">
                      <span className="text-xs font-extrabold text-slate-700 block">
                        {language === 'kh' ? 'អាប់ឡូតរូបភាពវិក្កយបត្រ' : 'Upload Receipt Screenshot'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold block">
                        JPEG ឬ PNG, ទំហំតូចជាង 5MB
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Note input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                  កំណត់សម្គាល់បន្ថែម (Note - Option)
                </label>
                <textarea
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder="ឧ. វេររួចរាល់ហើយបងពីគណនី ABA..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-extrabold rounded-2xl transition cursor-pointer"
              >
                {language === 'kh' ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSubmitReport}
                disabled={isSubmittingReport}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-extrabold rounded-2xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSubmittingReport ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{language === 'kh' ? 'ផ្ញើរបាយការណ៍' : 'Submit Report'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zoomed QR Code Modal */}
      {isQrZoomOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => setIsQrZoomOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsQrZoomOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1.5 border-b border-slate-100 pb-2">
              <QrCode className="w-4 h-4 text-blue-600" />
              <span>{language === 'kh' ? 'ស្កេនដើម្បីទូទាត់ប្រាក់' : 'Scan to Repay'}</span>
            </h3>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner flex items-center justify-center aspect-square w-full max-w-[260px] sm:max-w-[280px] mx-auto overflow-hidden bg-white">
              <img
                src={activePaymentQr}
                alt="Payment QR Code"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-xs font-bold text-slate-500 leading-relaxed max-w-xs mx-auto">
              {language === 'kh' 
                ? 'សូមរក្សាទុករូបភាព QR នេះ ឬស្កេនដើម្បីទូទាត់ប្រាក់សង។ បន្ទាប់ពីវេររួច សូមផ្ញើវិក្កយបត្រមកកាន់ម្ចាស់បំណុល។' 
                : 'Please save this QR image or scan to repay. After transferring, please send the receipt to the lender.'}
            </div>
            <button
              onClick={() => setIsQrZoomOpen(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-850 text-white text-xs font-extrabold rounded-xl shadow-md transition cursor-pointer"
            >
              {language === 'kh' ? 'យល់ព្រម' : 'Done'}
            </button>
          </div>
        </div>
      )}

      {/* Live Chat Drawer */}
      <LiveChat
        borrower={borrower}
        sender="borrower"
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onUpdateBorrower={handleUpdateBorrower}
      />

      {/* Frame Selection Modal for Borrower Self-Selection */}
      <FrameSelectorModal
        isOpen={isFrameModalOpen}
        onClose={() => setIsFrameModalOpen(false)}
        currentFrameId={borrower.avatarFrame}
        onSelectFrame={(frameId) => {
          handleUpdateBorrower({ avatarFrame: frameId });
        }}
        borrowerName={borrower.name}
        photoUrl={borrower.profilePhoto}
      />
    </div>
  );
}
