import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, ShieldCheck, Clock, Send, ChevronRight, X, Upload, Camera, FileText, Check, AlertCircle } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Member, SubscriptionRequest } from '../types';

interface PricingPanelProps {
  currentUser: string;
  userDisplayName: string;
  memberProfile: Member | null;
  language: 'kh' | 'en';
  getSubscriptionStatusInfo: (profile: Member | null) => { isExpired: boolean; text: string };
  showToast: (msg: string, type?: 'success' | 'info') => void;
  qrConfig?: any;
}

export default function PricingPanel({
  currentUser,
  userDisplayName,
  memberProfile,
  language,
  getSubscriptionStatusInfo,
  showToast,
  qrConfig
}: PricingPanelProps) {
  const [myRequests, setMyRequests] = useState<SubscriptionRequest[]>([]);

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

  // Modal payment state for selected plan
  const [selectedPlanModal, setSelectedPlanModal] = useState<'1_month' | '3_months' | '1_year' | null>(null);
  const [invoiceImage, setInvoiceImage] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [viewInvoiceUrl, setViewInvoiceUrl] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError(language === 'kh' ? 'ទំហំរូបភាពធំជាង 5MB!' : 'Image size exceeds 5MB!');
      return;
    }

    setUploadError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
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
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const base64Str = canvas.toDataURL('image/jpeg', 0.85);
          setInvoiceImage(base64Str);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleOpenPlanModal = (planId: '1_month' | '3_months' | '1_year') => {
    setSelectedPlanModal(planId);
    setInvoiceImage('');
    setUploadError('');
    setSubmitSuccess(false);
  };

  const handleSubmitSubscriptionRequest = async () => {
    if (!selectedPlanModal) return;

    setIsSubmitting(true);
    try {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const requestDoc: SubscriptionRequest = {
        id: requestId,
        username: currentUser,
        displayName: userDisplayName || currentUser,
        plan: selectedPlanModal,
        createdAt: new Date().toISOString(),
        status: 'pending',
        invoiceImageUrl: invoiceImage || undefined
      };

      await setDoc(doc(db, 'subscription_requests', requestId), requestDoc);
      showToast(
        language === 'kh' 
          ? 'បានផ្ញើសំណើទិញគម្រោង និងវិក្កយបត្ររួចរាល់! ក្រុមការងារនឹងពិនិត្យ និងអនុម័តជូនក្នុងពេលឆាប់ៗនេះ។' 
          : 'Purchase request & invoice submitted successfully! Our team will verify and approve shortly.',
        'success'
      );
      setSubmitSuccess(true);
    } catch (err) {
      console.error('Error submitting subscription request:', err);
      alert(language === 'kh' ? 'មានបញ្ហាក្នុងការផ្ញើសំណើ! សូមព្យាយាមឡើងវិញ។' : 'Failed to send request! Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Sync current user's subscription requests in real-time
    const q = query(
      collection(db, 'subscription_requests'),
      where('username', '==', currentUser)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: SubscriptionRequest[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as SubscriptionRequest);
      });
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setMyRequests(list);
    }, (err) => {
      console.error('Error listening to my subscription requests:', err);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const statusInfo = getSubscriptionStatusInfo(memberProfile);

  const plans = [
    {
      id: '1_month' as const,
      nameKh: 'គម្រោង ១ ខែ',
      nameEn: '1-Month Plan',
      priceDisplay: '$5',
      numericPrice: '$5.00',
      durationKh: 'រយៈពេល ៣០ ថ្ងៃ',
      durationEn: '30 Days Access',
      popular: false,
      color: 'border-slate-200 bg-white'
    },
    {
      id: '3_months' as const,
      nameKh: 'គម្រោង ៣ ខែ',
      nameEn: '3-Month Plan',
      priceDisplay: '$12',
      numericPrice: '$12.00',
      durationKh: 'រយៈពេល ៩០ ថ្ងៃ',
      durationEn: '90 Days Access',
      popular: true,
      color: 'border-blue-500 bg-blue-50/20 ring-2 ring-blue-500/10'
    },
    {
      id: '1_year' as const,
      nameKh: 'គម្រោង ១ ឆ្នាំ',
      nameEn: '1-Year Plan',
      priceDisplay: '$35',
      numericPrice: '$35.00',
      durationKh: 'រយៈពេល ៣៦៥ ថ្ងៃ',
      durationEn: '365 Days Access',
      popular: false,
      color: 'border-slate-200 bg-white'
    }
  ];

  const currentPlanInfo = plans.find(p => p.id === selectedPlanModal);

  const featuresKh = [
    'Cloud Synced Backups (រក្សាទុកទិន្នន័យលើ Cloud ស្វ័យប្រវត្ត)',
    'បន្ថែមចំនួនកូនបំណុល និងគណនីបានមិនកំណត់ (Infinite borrowers)',
    'គាំទ្រភាសាខ្មែរ និងអង់គ្លេសពេញលេញ (Khmer/English bilingual)',
    'ផ្ញើសារទាក់ទងផ្ទាល់ជាមួយកូនបំណុលតាមតេឡេក្រាម និងទូរស័ព្ទ',
    'ជូនដំណឹងស្វ័យប្រវត្តពេលកូនបំណុលដល់ថ្ងៃបង់ប្រាក់',
    'ផតថលផ្ទាល់ខ្លួនសម្រាប់កូនបំណុលចូលពិនិត្យមើល និងឆាតសួរ'
  ];

  const featuresEn = [
    'Cloud Synced Backups (Automatic safe backups)',
    'Infinite borrowers and loan records (No limit)',
    'Fully bilingual support (Khmer & English)',
    'Direct contact options with borrowers via Telegram/Phone',
    'Intelligent automatic reminders for upcoming payments',
    'Dynamic Client Portals for borrowers to view checks & live chat'
  ];

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      {/* Current Status Widget */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 text-xl shadow-sm shrink-0">
            💎
          </div>
          <div className="space-y-0.5">
            <h3 className="font-extrabold text-slate-900 text-base">
              {language === 'kh' ? 'ស្ថានភាពគម្រោងការប្រើប្រាស់បច្ចុប្បន្ន' : 'Current Subscription Status'}
            </h3>
            <p className="text-xs font-bold text-slate-500">
              {language === 'kh' ? `គណនី៖ ${userDisplayName} (${currentUser})` : `Account: ${userDisplayName} (${currentUser})`}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-2xl border text-xs font-black shadow-sm ${
            statusInfo.isExpired 
              ? 'bg-rose-50 text-rose-700 border-rose-100' 
              : memberProfile?.subscriptionExpires 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 animate-pulse' 
                : 'bg-blue-50 text-blue-700 border-blue-100'
          }`}>
            <span className="w-2 h-2 rounded-full bg-current"></span>
            {statusInfo.text}
          </span>
        </div>
      </div>

      {/* Pricing Header */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
          {language === 'kh' ? 'គម្រោងការប្រើប្រាស់' : 'PRICING PLANS'}
        </span>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          {language === 'kh' ? 'ជ្រើសរើសគម្រោងដើម្បីបន្តការប្រើប្រាស់' : 'Choose a Plan to Upgrade'}
        </h2>
        <p className="text-xs text-slate-500 font-bold">
          {language === 'kh' 
            ? 'បង់ប្រាក់ម្តង ប្រើប្រាស់បានពេញលេញលើគ្រប់មុខងារ ដោយមិនមានការលាក់លក្ខខណ្ឌបន្ថែមឡើយ។' 
            : 'One-time payment for complete unrestricted access to all client loan ledger features.'}
        </p>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div
            key={p.id}
            className={`border rounded-3xl p-6.5 flex flex-col justify-between relative shadow-sm hover:shadow-md transition duration-200 ${p.color}`}
          >
            {p.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                {language === 'kh' ? 'ពេញនិយមបំផុត' : 'Most Popular'}
              </span>
            )}

            <div className="space-y-4">
              <div className="text-left">
                <h4 className="text-sm font-black text-slate-800">
                  {language === 'kh' ? p.nameKh : p.nameEn}
                </h4>
                <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                  {language === 'kh' ? p.durationKh : p.durationEn}
                </p>
              </div>

              <div className="flex items-baseline gap-1 text-left">
                <span className="text-4xl font-black text-slate-900">{p.priceDisplay}</span>
                <span className="text-xs font-bold text-slate-400">
                  / {language === 'kh' ? 'ម្តង' : 'one-time'}
                </span>
              </div>

              {/* Bullet list */}
              <div className="border-t border-slate-100 pt-4 space-y-2.5">
                {(language === 'kh' ? featuresKh : featuresEn).map((f, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-left">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-600 font-semibold leading-relaxed">
                      {f}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleOpenPlanModal(p.id)}
              className={`w-full py-3 rounded-2xl font-black text-xs transition duration-150 mt-6 cursor-pointer flex items-center justify-center gap-1.5 ${
                p.popular
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/10'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {language === 'kh' ? 'ជ្រើសរើសគម្រោងនេះ' : 'Select Plan'}
              </span>
            </button>
          </div>
        ))}
      </div>

      {/* Plan Payment KHQR Modal */}
      {selectedPlanModal && currentPlanInfo && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#0B1521] text-white rounded-3xl overflow-hidden border border-slate-800 shadow-2xl max-w-md w-full relative flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div 
              className="py-4 px-6 flex items-center justify-between relative overflow-hidden select-none shrink-0"
              style={{ backgroundColor: currentQrConfig.bankColor || '#E61A22' }}
            >
              <div className="flex items-center gap-2">
                <span className="font-sans font-black tracking-widest text-lg">KH</span>
                <span 
                  className="bg-white font-black px-1.5 py-0.5 rounded text-xs"
                  style={{ color: currentQrConfig.bankColor || '#E61A22' }}
                >
                  QR
                </span>
                <span className="text-xs font-black text-white/90 ml-2 border-l border-white/30 pl-2">
                  {language === 'kh' ? currentPlanInfo.nameKh : currentPlanInfo.nameEn}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPlanModal(null)}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-center flex-1">
              {!submitSuccess ? (
                <>
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                      {language === 'kh' ? 'ទូទាត់ប្រាក់តាម KHQR' : 'Scan KHQR to Pay'}
                    </span>
                    <h4 className="text-base font-black text-white uppercase tracking-wide pt-1">
                      {currentQrConfig.accountName || 'SOUN RAVIN'}
                    </h4>
                    {/* Exact Plan Price matching selected plan */}
                    <div className="text-4xl font-black text-amber-400 font-mono tracking-tight my-1">
                      {currentPlanInfo.numericPrice}
                    </div>
                  </div>

                  {/* KHQR Image Container */}
                  <div className="bg-white p-3.5 rounded-2xl shadow-xl flex items-center justify-center relative select-none w-48 h-48 mx-auto border border-slate-200">
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
                        <div className="absolute inset-0 m-auto w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md p-1">
                          <div 
                            className="w-full h-full rounded-full flex items-center justify-center relative"
                            style={{ backgroundColor: currentQrConfig.bankColor || '#E61A22' }}
                          >
                            <svg className="w-5 h-5 text-white fill-none stroke-current stroke-[2]" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l2.5 2.5L17 5l.5 3.5 2.5 2.5-2.5 2.5-.5 3.5-3.5.5-2.5 2.5-2.5-2.5-3.5-.5-.5-3.5-2.5-2.5 2.5-2.5.5-3.5 3.5-.5z" />
                              <text x="12" y="15.5" textAnchor="middle" className="font-sans font-black text-[9px] fill-white stroke-none">
                                {currentQrConfig.bankLogoText || 'C'}
                              </text>
                            </svg>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* ID & Name Copy Tags */}
                  <div className="grid grid-cols-2 gap-2 w-full pt-1">
                    <div 
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(currentQrConfig.accountId || '000469096');
                          showToast(language === 'kh' ? 'ចម្លង ID គណនីរួចរាល់!' : 'Account ID copied!', 'success');
                        }
                      }}
                      className="py-2 px-3 bg-[#0F1C2E] hover:bg-slate-800 text-slate-300 rounded-xl text-center cursor-pointer border border-slate-800 flex flex-col items-center justify-center transition group"
                    >
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">ID</span>
                      <span className="text-xs font-mono font-black text-white group-hover:text-amber-400 truncate w-full">
                        {currentQrConfig.accountId || '000469096'}
                      </span>
                    </div>

                    <div 
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(currentQrConfig.accountName || 'SOUN RAVIN');
                          showToast(language === 'kh' ? 'ចម្លងឈ្មោះគណនីរួចរាល់!' : 'Account Name copied!', 'success');
                        }
                      }}
                      className="py-2 px-3 bg-[#0F1C2E] hover:bg-slate-800 text-slate-300 rounded-xl text-center cursor-pointer border border-slate-800 flex flex-col items-center justify-center transition group"
                    >
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Name</span>
                      <span className="text-xs font-sans font-black text-white group-hover:text-amber-400 truncate w-full">
                        {currentQrConfig.accountName || 'SOUN RAVIN'}
                      </span>
                    </div>
                  </div>

                  {/* Upload QR Invoice Section */}
                  <div className="space-y-1.5 text-left pt-2 border-t border-slate-800">
                    <label className="block text-[10px] font-black text-slate-300 uppercase tracking-wider flex items-center justify-between">
                      <span>{language === 'kh' ? 'ផ្ទុកឡើងរូបភាពវិក្កយបត្រ (Upload QR Invoice)' : 'Upload Payment Slip / Invoice'}</span>
                      <span className="text-rose-400 font-normal text-[9px]">* {language === 'kh' ? 'ចាំបាច់' : 'Required'}</span>
                    </label>
                    
                    <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-3 transition flex flex-col items-center justify-center gap-2 relative overflow-hidden bg-slate-900/80 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      />
                      {invoiceImage ? (
                        <div className="space-y-1.5 text-center w-full relative z-20">
                          <img
                            src={invoiceImage}
                            alt="Uploaded Receipt"
                            className="max-h-36 object-contain mx-auto rounded-lg shadow-md border border-slate-700"
                          />
                          <p className="text-[10px] text-emerald-400 font-black flex items-center justify-center gap-1">
                            <Check className="w-3.5 h-3.5" /> {language === 'kh' ? 'បានផ្ទុកឡើងវិក្កយបត្ររួចរាល់!' : 'Invoice uploaded!'}
                          </p>
                          <p className="text-[9px] text-slate-400">
                            {language === 'kh' ? 'ចុចទីនេះដើម្បីប្តូររូបភាព' : 'Click to change image'}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center space-y-1 py-2">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-xs text-slate-300 shadow">
                            <Upload className="w-4 h-4 text-blue-400" />
                          </div>
                          <p className="text-xs font-black text-white">
                            {language === 'kh' ? 'ជ្រើសរើស ឬទាញទម្លាក់រូបភាពវិក្កយបត្រទូទាត់' : 'Click or drag receipt image here'}
                          </p>
                          <p className="text-[9px] text-slate-400 font-medium">
                            {language === 'kh' ? 'គាំទ្ររូបភាព PNG, JPG (អតិបរមា 5MB)' : 'Supports PNG, JPG (Max 5MB)'}
                          </p>
                        </div>
                      )}
                    </div>
                    {uploadError && (
                      <p className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {uploadError}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="button"
                    onClick={handleSubmitSubscriptionRequest}
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-2xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{language === 'kh' ? 'កំពុងផ្ញើសំណើ...' : 'Submitting...'}</span>
                      </>
                    ) : (
                      <>
                        <span>✨</span>
                        <span>{language === 'kh' ? 'ផ្ញើសំណើទិញគម្រោងទៅ Admin' : 'Submit Subscription Request'}</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="py-6 space-y-5 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 border border-emerald-500/30 mx-auto">
                    <Check className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-base font-black text-emerald-400">
                      {language === 'kh' ? 'ផ្ញើសំណើ និងវិក្កយបត្រជោគជ័យ!' : 'Request Sent Successfully!'}
                    </h5>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-xs mx-auto">
                      {language === 'kh'
                        ? 'ក្រុមការងារពួកយើងបានទទួលសំណើ និងរូបភាពវិក្កយបត្ររបស់អ្នកហើយ! ពួកយើងនឹងពិនិត្យ និងអនុម័តជូនក្នុងពេលឆាប់ៗនេះ។'
                        : 'We have received your subscription request and invoice slip! Our team will verify and approve your account shortly.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPlanModal(null)}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-xl transition cursor-pointer"
                  >
                    {language === 'kh' ? 'បិទផ្ទាំងនេះ (Close)' : 'Close Window'}
                  </button>
                </div>
              )}
            </div>

            {/* Support Footer */}
            <div className="flex justify-between items-center border-t border-slate-800 p-3.5 px-6 text-[10px] text-slate-400 shrink-0 select-none bg-slate-900/60">
              <a
                href="https://t.me/laymeancamera"
                target="_blank"
                rel="noopener noreferrer"
                className="font-black text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Telegram: ឡាយមាន</span> <ChevronRight className="w-3 h-3" />
              </a>
              <span className="font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                INSTANT APPROVAL
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Request History Section (Full Width clean card) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6.5 shadow-sm space-y-4">
        <div className="text-left flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-blue-600" />
            <h3 className="font-extrabold text-slate-800 text-sm">
              {language === 'kh' ? 'ប្រវត្តិនៃការផ្ញើសំណើរបស់អ្នក' : 'Your Plan Requests History'}
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400">
            {myRequests.length} {language === 'kh' ? 'សំណើ' : 'requests'}
          </span>
        </div>

        {myRequests.length === 0 ? (
          <div className="py-10 text-center text-slate-400 font-semibold text-xs space-y-1">
            <p>{language === 'kh' ? 'មិនទាន់មានសំណើទិញណាមួយឡើយ' : 'No purchase requests made yet.'}</p>
            <p className="text-[10px] text-slate-400 font-medium">
              {language === 'kh' ? 'ចុចលើ «ជ្រើសរើសគម្រោង» ខាងលើដើម្បីផ្ញើសំណើទិញគម្រោង' : 'Click "Select Plan" above to request a subscription.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
            {myRequests.map((r) => {
              const reqPlan = plans.find((p) => p.id === r.plan);
              return (
                <div
                  key={r.id}
                  className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="text-left space-y-1">
                    <p className="font-extrabold text-slate-800">
                      {language === 'kh' ? reqPlan?.nameKh : reqPlan?.nameEn} ({reqPlan?.priceDisplay})
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      {new Date(r.createdAt).toLocaleString()}
                    </p>
                    {r.invoiceImageUrl && (
                      <button
                        onClick={() => setViewInvoiceUrl(r.invoiceImageUrl || null)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        <FileText className="w-3 h-3" />
                        <span>{language === 'kh' ? 'មើលរូបវិក្កយបត្រ' : 'View Receipt'}</span>
                      </button>
                    )}
                  </div>

                  <span className={`inline-flex items-center text-[10px] font-black px-2.5 py-1 rounded-xl border shrink-0 ${
                    r.status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : r.status === 'rejected'
                        ? 'bg-rose-50 text-rose-700 border-rose-100'
                        : 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse'
                  }`}>
                    {r.status === 'approved' 
                      ? (language === 'kh' ? 'បានអនុម័ត' : 'Approved') 
                      : r.status === 'rejected' 
                        ? (language === 'kh' ? 'បានបដិសេធ' : 'Rejected') 
                        : (language === 'kh' ? 'កំពុងរង់ចាំ' : 'Pending')}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-blue-50/40 p-3 rounded-2xl border border-blue-100/40 text-[10px] text-blue-800 font-semibold text-left flex items-start gap-2">
          <span className="text-xs">💡</span>
          <p className="leading-normal">
            {language === 'kh'
              ? 'បន្ទាប់ពីផ្ញើសំណើ និងអាប់ឡូតរូបភាពវិក្កយបត្ររួចរាល់ លោកអ្នកក៏អាចទាក់ទង Admin តាមតេឡេក្រាម ដើម្បីទទួលបានការអនុម័តដំណើរការលឿនរហ័ស!'
              : 'After submitting your request and uploading the payment slip, you can also notify Admin on Telegram for faster approval!'}
          </p>
        </div>
      </div>

      {/* Invoice Viewer Modal */}
      {viewInvoiceUrl && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => setViewInvoiceUrl(null)}
        >
          <div className="relative max-w-lg w-full bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-3">
            <div className="flex items-center justify-between text-white border-b border-slate-800 pb-2">
              <span className="text-xs font-black">{language === 'kh' ? 'រូបភាពវិក្កយបត្រដែលបានផ្ញើ' : 'Uploaded Payment Slip'}</span>
              <button 
                onClick={() => setViewInvoiceUrl(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img 
              src={viewInvoiceUrl} 
              alt="Payment Slip" 
              className="max-h-96 w-full object-contain rounded-2xl border border-slate-800 bg-black/40"
            />
          </div>
        </div>
      )}
    </div>
  );
}

