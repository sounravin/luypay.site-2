import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, addDoc, setDoc } from 'firebase/firestore';
import { LoanApplication, DEFAULT_LENDER_INFO } from '../types';
import { useLanguage } from '../i18n';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, Users, Check, X, FileText, Phone, DollarSign, Calendar, Copy, 
  ExternalLink, Eye, AlertCircle, CheckCircle, ChevronDown, 
  Trash2, Search, Sparkles, ShieldAlert, RefreshCw, AlertTriangle, MapPin,
  Clock, Share2, Send, ChevronRight, User, UserCheck, ShieldCheck, Download, Printer
} from 'lucide-react';
import DigitalLoanContractModal from './DigitalLoanContractModal';
import GPSLocationViewerModal from './GPSLocationViewerModal';

interface HardshipControlPanelProps {
  currentUser: string;
  onApproveAndCreateBorrower: (application: LoanApplication) => void;
  showToast: (message: string, type: 'success' | 'info' | 'error') => void;
}

export default function HardshipControlPanel({
  currentUser,
  onApproveAndCreateBorrower,
  showToast
}: HardshipControlPanelProps) {
  const { language } = useLanguage();

  // Requests State
  const [requests, setRequests] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Preview
  const [selectedPhoto, setSelectedPhoto] = useState<{ title: string; src: string } | null>(null);
  const [rejectingApp, setRejectingApp] = useState<LoanApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [contractApp, setContractApp] = useState<LoanApplication | null>(null);

  // GPS Viewer Modal
  const [isGpsModalOpen, setIsGpsModalOpen] = useState(false);
  const [gpsData, setGpsData] = useState<any | null>(null);

  // Hardship Calculator Drawer/Tab
  const [activeSubView, setActiveSubView] = useState<'requests' | 'calculator'>('requests');

  // Calculator Internal State
  const [calcBorrowerName, setCalcBorrowerName] = useState('');
  const [calcBorrowerPhone, setCalcBorrowerPhone] = useState('');
  const [calcPrincipal, setCalcPrincipal] = useState<number | ''>('');
  const [calcDailyRate, setCalcDailyRate] = useState<number | ''>('');
  const [calcCurrency, setCalcCurrency] = useState<'USD' | 'KHR'>('USD');
  const [calcStartDate, setCalcStartDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [calcFrequency, setCalcFrequency] = useState<'daily' | 'every_2_days' | 'weekly' | 'semi_monthly' | 'monthly'>('daily');
  const [calcNote, setCalcNote] = useState('');
  const [copiedTelegram, setCopiedTelegram] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Realtime Firestore Listener for Hardship Settlement Requests
  useEffect(() => {
    const q = collection(db, 'loan_applications');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: LoanApplication[] = [];
      const userLower = (currentUser || 'sounravin').toLowerCase();

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as LoanApplication;
        // Filter specifically for Hardship Settlement requests
        const isHardshipType = data.loanType === 'hardship_settlement' || (data as any).isHardship === true;
        
        if (isHardshipType) {
          const reqLender = (data.lenderId || data.lenderUsername || 'sounravin').toLowerCase();
          if (reqLender === userLower) {
            list.push({ id: docSnap.id, ...data });
          }
        }
      });

      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setRequests(list);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching hardship requests:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Public Hardship Form URL
  const publicHardshipUrl = `${window.location.origin}${window.location.pathname}?hardship=true&lender=${encodeURIComponent(currentUser)}`;

  const handleCopyPublicLink = () => {
    navigator.clipboard.writeText(publicHardshipUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    showToast(
      language === 'kh' ? '📋 បានចម្លងតំណសុំឡើងតែដើមរួចរាល់! អាចផ្ញើជូនអតិថិជនបាន' : '📋 Public Hardship Request link copied!',
      'success'
    );
  };

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-max">
            <CheckCircle className="w-3 h-3" />
            <span>{language === 'kh' ? 'បានអនុម័ត' : 'Approved'}</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1 w-max">
            <AlertCircle className="w-3 h-3" />
            <span>{language === 'kh' ? 'បានបដិសេធ' : 'Rejected'}</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 w-max animate-pulse">
            <Clock className="w-3 h-3" />
            <span>{language === 'kh' ? 'រង់ចាំពិនិត្យ' : 'Pending'}</span>
          </span>
        );
    }
  };

  // Status Handlers
  const handleApprove = async (app: LoanApplication) => {
    try {
      await updateDoc(doc(db, 'loan_applications', app.id), {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: currentUser
      });
      showToast(language === 'kh' ? 'បានអនុម័តសំណើសុំឡើងតែដើមរួចរាល់!' : 'Hardship request approved!', 'success');
      onApproveAndCreateBorrower(app);
    } catch (err) {
      console.error("Error approving hardship request:", err);
      showToast(language === 'kh' ? 'បរាជ័យក្នុងការអនុម័ត' : 'Approval failed', 'error');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingApp) return;
    try {
      await updateDoc(doc(db, 'loan_applications', rejectingApp.id), {
        status: 'rejected',
        rejectReason: rejectReason || 'មិនគ្រប់លក្ខខណ្ឌសុំឡើងតែដើម',
        rejectedAt: new Date().toISOString(),
        rejectedBy: currentUser
      });
      showToast(language === 'kh' ? 'បានបដិសេធសំណើសុំឡើងតែដើម' : 'Hardship request rejected', 'info');
      setRejectingApp(null);
      setRejectReason('');
    } catch (err) {
      console.error("Error rejecting hardship request:", err);
      showToast(language === 'kh' ? 'បរាជ័យក្នុងការបដិសេធ' : 'Rejection failed', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(language === 'kh' ? 'តើអ្នកពិតជាចង់លុបសំណើសុំឡើងតែដើមនេះមែនទេ?' : 'Are you sure you want to delete this hardship request?')) return;
    try {
      await deleteDoc(doc(db, 'loan_applications', id));
      showToast(language === 'kh' ? 'បានលុបសំណើសុំឡើងតែដើមរួចរាល់' : 'Hardship request deleted', 'success');
    } catch (err) {
      console.error("Error deleting request:", err);
    }
  };

  // Filter Logic
  const filteredRequests = requests.filter((app) => {
    const matchesTab = activeTab === 'all' || app.status === activeTab;
    const matchesQuery = !searchQuery || 
      app.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.phone?.includes(searchQuery) ||
      app.id?.includes(searchQuery);
    return matchesTab && matchesQuery;
  });

  // Calculation Math Logic
  const validPrincipal = Math.max(0, Number(calcPrincipal) || 0);
  const validDailyRate = Math.max(0, Number(calcDailyRate) || 0);
  const fullPaymentsCount = validDailyRate > 0 ? Math.floor(validPrincipal / validDailyRate) : 0;
  const remainder = validDailyRate > 0 ? validPrincipal % validDailyRate : 0;
  const totalInstallments = validDailyRate > 0 ? (remainder > 0.001 ? fullPaymentsCount + 1 : fullPaymentsCount) : 0;

  const getStepDays = () => {
    switch (calcFrequency) {
      case 'every_2_days': return 2;
      case 'weekly': return 7;
      case 'semi_monthly': return 15;
      case 'monthly': return 30;
      case 'daily': default: return 1;
    }
  };

  const stepDays = getStepDays();
  const startDateObj = new Date(calcStartDate || Date.now());
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

    currentDate.setDate(currentDate.getDate() + stepDays);
  }

  const endDateIso = scheduleItems.length > 0 ? scheduleItems[scheduleItems.length - 1].isoDate : '-';
  const currSymbol = calcCurrency === 'USD' ? '$' : calcCurrency === 'KHR' ? '៛' : '฿';

  const generateTelegramMessage = () => {
    const bName = calcBorrowerName.trim() || 'កូនបំណុល';
    const bPhone = calcBorrowerPhone.trim() ? ` (${calcBorrowerPhone})` : '';

    return `🤝 **កាលវិភាគសងប្រាក់ដើមពិសេស (សុំឡើងតែដើម)**
----------------------------------
👤 **ឈ្មោះកូនបំណុល:** ${bName}${bPhone}
💵 **ប្រាក់ដើមត្រូវសងសរុប:** ${currSymbol}${validPrincipal.toLocaleString()} ${calcCurrency}
🗓 **ប្រាក់សុំឡើងក្នងមួយថ្ងៃ:** ${currSymbol}${validDailyRate.toLocaleString()} ${calcCurrency} / ថ្ងៃ
⏱ **ចំនួនថ្ងៃត្រូវសងសរុប:** ${totalInstallments} ថ្ងៃ (${scheduleItems.length > 0 ? scheduleItems[0].isoDate : ''} ដល់ ${endDateIso})
📝 **ចំណាំ:** ${calcNote}

----------------------------------
📋 **កាលវិភាគបង់ប្រាក់លម្អិត:**
${scheduleItems.map(item => {
  const isFinal = item.step === totalInstallments;
  return `• ថ្ងៃទី ${item.step}: ${item.isoDate} ➡️ ចំនួន ${currSymbol}${item.amount.toFixed(2)}${isFinal ? ' (ថ្ងៃចុងក្រោយ)' : ''} | នៅសល់: ${currSymbol}${item.remaining.toFixed(2)}`;
}).join('\n')}

----------------------------------
🙏🏻 សូមបង់ប្រាក់អោយបានទៀងទាត់តាមការសន្យា! អរគុណ!`;
  };

  const handleCopyTelegramSchedule = () => {
    navigator.clipboard.writeText(generateTelegramMessage());
    setCopiedTelegram(true);
    setTimeout(() => setCopiedTelegram(false), 2500);
    showToast(language === 'kh' ? '📋 ចម្លងកាលវិភាគរួចរាល់! អាចផ្ញើចូល Telegram បាន' : '📋 Schedule copied!', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Standalone Control Panel Header Banner */}
      <div className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-8 overflow-hidden bg-gradient-to-r from-amber-950 via-orange-950 to-slate-950 border border-amber-500/30 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] sm:text-xs font-black uppercase tracking-wider">
              <Calculator className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{language === 'kh' ? 'ប្រព័ន្ធគ្រប់គ្រងសុំឡើងតែដើមដាច់ដោយឡែក' : 'Hardship Principal Settlement Panel'}</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-snug">
              {language === 'kh' ? '🧮 ផ្ទាំងគ្រប់គ្រងប្រព័ន្ធគណនារយៈពេលសុំឡើងតែដើម' : 'Hardship Settlement Workspace'}
            </h2>
            <p className="text-xs sm:text-sm text-amber-200/80 font-medium leading-relaxed">
              {language === 'kh'
                ? 'គ្រប់គ្រងសំណើសុំឡើងតែដើមរបស់កូនបំណុល គណនាថ្ងៃបង់សងប្រាក់ដើមលម្អិត បង្កើតកិច្ចសន្យា 0% វ៉ៃអត្រាប្រាក់ និងចែករំលែកតំណសុំឡើងតែដើម។'
                : 'Manage borrower hardship requests, compute principal repayment schedules, draft 0% contracts, and share public settlement forms.'}
            </p>
          </div>

          {/* Quick Stats & Action Cards */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t border-amber-500/20 sm:border-0">
            <div className="bg-slate-900/80 backdrop-blur-md p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-amber-500/30 text-center">
              <span className="text-[10px] sm:text-xs font-bold text-amber-300 block truncate">{language === 'kh' ? 'សំណើរង់ចាំ' : 'Pending Requests'}</span>
              <span className="text-xl sm:text-2xl font-black text-amber-400">{requests.filter(r => r.status === 'pending').length}</span>
            </div>

            <button
              onClick={handleCopyPublicLink}
              className="px-3 sm:px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-[11px] sm:text-xs rounded-xl sm:rounded-2xl shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
            >
              <Copy className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{copiedLink ? (language === 'kh' ? 'បានចម្លង!' : 'Copied!') : (language === 'kh' ? 'ចម្លងតំណសុំឡើងដើម' : 'Copy Public Form Link')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Workspace View Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 sm:pb-4 gap-3">
        <div className="grid grid-cols-2 sm:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setActiveSubView('requests')}
            className={`px-3 sm:px-4 py-2.5 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubView === 'requests'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{language === 'kh' ? 'បញ្ជីសំណើសុំឡើងដើម' : 'Settlement Requests'}</span>
            <span className="bg-amber-950/20 px-1.5 py-0.5 rounded-full text-[9px] font-bold">
              {requests.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubView('calculator')}
            className={`px-3 sm:px-4 py-2.5 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubView === 'calculator'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{language === 'kh' ? 'ម៉ាស៊ីនគណនារយៈពេល' : 'Settlement Calculator'}</span>
          </button>
        </div>

        {/* Public Form Direct URL preview */}
        <div className="flex items-center justify-between gap-2 bg-slate-900 text-amber-300 px-3 py-2 rounded-xl border border-amber-500/30 text-[11px] sm:text-xs font-mono w-full sm:max-w-md overflow-hidden">
          <div className="flex items-center gap-2 overflow-hidden min-w-0">
            <Share2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{publicHardshipUrl}</span>
          </div>
          <a
            href={publicHardshipUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 hover:bg-amber-500/20 rounded text-amber-300 hover:text-white shrink-0"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* MAIN VIEW 1: Hardship Requests List */}
      {activeSubView === 'requests' && (
        <div className="space-y-4">
          {/* Filters and Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 rounded-xl text-[11px] sm:text-xs font-black transition cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === tab
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab === 'all' && (language === 'kh' ? 'ទាំងអស់' : 'All')}
                  {tab === 'pending' && (language === 'kh' ? 'រង់ចាំពិនិត្យ' : 'Pending')}
                  {tab === 'approved' && (language === 'kh' ? 'បានអនុម័ត' : 'Approved')}
                  {tab === 'rejected' && (language === 'kh' ? 'បានបដិសេធ' : 'Rejected')}
                  <span className="ml-1 opacity-80 font-normal">
                    ({tab === 'all' ? requests.length : requests.filter(r => r.status === tab).length})
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'kh' ? 'ស្វែងរកឈ្មោះ ឬលេខទូរស័ព្ទ...' : 'Search name or phone...'}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Cards Display */}
          {loading ? (
            <div className="p-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-400">{language === 'kh' ? 'កំពុងទាញយកទិន្នន័យ...' : 'Loading requests...'}</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <Calculator className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-200">
                {language === 'kh' ? 'មិនមានសំណើសុំឡើងតែដើមទេ' : 'No Hardship Requests Found'}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                {language === 'kh' 
                  ? 'អ្នកអាចផ្ញើតំណសុំឡើងតែដើមជូនអតិថិជនដើម្បីអោយពួកគាត់បំពេញសំណើបាន។' 
                  : 'You can copy and send the public hardship request form link to your borrowers.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {filteredRequests.map((app) => {
                const pAmt = app.amountRequested || 0;
                const dAmt = (app as any).dailyInstallmentRequested || 15;
                const daysCalculated = pAmt > 0 && dAmt > 0 ? Math.ceil(pAmt / dAmt) : 0;

                return (
                  <div
                    key={app.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm space-y-3.5 hover:border-amber-500/50 transition duration-200 relative overflow-hidden"
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {app.selfiePhoto ? (
                          <img
                            src={app.selfiePhoto}
                            alt={app.name}
                            className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl object-cover border-2 border-amber-500/40 shadow-xs cursor-pointer shrink-0"
                            onClick={() => setSelectedPhoto({ title: `រូបថត៖ ${app.name}`, src: app.selfiePhoto! })}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-base sm:text-lg border border-amber-500/20 shrink-0">
                            {app.name ? app.name.slice(0, 2).toUpperCase() : 'HB'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                            <span className="truncate">{app.name}</span>
                            <span className="text-[9px] sm:text-[10px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full shrink-0">
                              0% Interest
                            </span>
                          </h4>
                          <p className="text-[11px] sm:text-xs font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-amber-500 shrink-0" />
                            <span className="truncate">{app.phone}</span>
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {getStatusBadge(app.status)}
                      </div>
                    </div>

                    {/* Principal & Calculation Breakdown Box */}
                    <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 p-3 sm:p-4 rounded-xl sm:rounded-2xl space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs">
                      <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 gap-2">
                        <span className="font-bold">{language === 'kh' ? 'ប្រាក់ដើមត្រូវសង៖' : 'Principal Amount:'}</span>
                        <span className="font-black text-amber-600 dark:text-amber-400 text-xs sm:text-sm">${pAmt.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 gap-2">
                        <span className="font-bold">{language === 'kh' ? 'ប្រាក់សុំឡើងក្នុង១ថ្ងៃ៖' : 'Daily Rate:'}</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">${dAmt.toLocaleString()} / ថ្ងៃ</span>
                      </div>

                      <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 pt-1.5 border-t border-amber-200/60 dark:border-amber-900/40 gap-2">
                        <span className="font-bold">{language === 'kh' ? 'រយៈពេលគណនាថ្ងៃត្រូវសង៖' : 'Calculated Payoff Days:'}</span>
                        <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{daysCalculated} {language === 'kh' ? 'ថ្ងៃ' : 'Days'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Address & Reason Notes */}
                    <div className="space-y-1.5 text-xs">
                      {app.address && (
                        <p className="text-slate-600 dark:text-slate-400 flex items-center gap-1 text-[11px] sm:text-xs">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{app.address}</span>
                        </p>
                      )}

                      {app.notes && (
                        <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                          <span className="font-bold text-amber-600 dark:text-amber-400">{language === 'kh' ? 'មូលហេតុសុំឡើងដើម៖ ' : 'Hardship Reason: '}</span>
                          {app.notes}
                        </div>
                      )}
                    </div>

                    {/* Attachments / GPS Controls */}
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {app.idCardPhoto && (
                        <button
                          type="button"
                          onClick={() => setSelectedPhoto({ title: `អត្តសញ្ញាណប័ណ្ណ៖ ${app.name}`, src: app.idCardPhoto! })}
                          className="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] sm:text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-amber-500 shrink-0" />
                          <span className="truncate">{language === 'kh' ? 'មើលអត្តសញ្ញាណ' : 'View ID'}</span>
                        </button>
                      )}

                      {(app.latitude && app.longitude) || (app as any).locationUrl ? (
                        <button
                          type="button"
                          onClick={() => {
                            const lat = app.latitude || (app as any).gpsLocation?.latitude;
                            const lng = app.longitude || (app as any).gpsLocation?.longitude;
                            setGpsData({
                              latitude: lat,
                              longitude: lng,
                              accuracy: app.locationAccuracy || (app as any).gpsLocation?.accuracy,
                              capturedAt: app.gpsCapturedAt || app.createdAt,
                              applicantName: app.name,
                              borrowerName: app.name,
                              borrowerPhone: app.phone
                            });
                            setIsGpsModalOpen(true);
                          }}
                          className="px-2.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] sm:text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="truncate">{language === 'kh' ? 'ទីតាំង GPS' : 'View GPS'}</span>
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => setContractApp(app)}
                        className="col-span-2 sm:col-span-1 px-2.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl text-[10px] sm:text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer sm:ml-auto"
                      >
                        <FileText className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="truncate">{language === 'kh' ? 'កិច្ចសន្យា 0%' : '0% Contract'}</span>
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {app.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApprove(app)}
                            className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] sm:text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            <Check className="w-4 h-4 shrink-0" />
                            <span className="truncate">{language === 'kh' ? 'អនុម័ត & បញ្ចូលបញ្ជីកម្ចី' : 'Approve & Add'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRejectingApp(app)}
                            className="py-2.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-xs rounded-xl transition cursor-pointer shrink-0"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(app.id)}
                        className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition cursor-pointer ml-auto shrink-0"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MAIN VIEW 2: Embedded Interactive Calculator */}
      {activeSubView === 'calculator' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm space-y-5 sm:space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 sm:pb-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2.5 sm:p-3 bg-amber-500/10 text-amber-500 rounded-xl sm:rounded-2xl shrink-0">
                <Calculator className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                  {language === 'kh' ? 'ម៉ាស៊ីនគណនារយៈពេល & ប្រាក់សុំឡើងតែដើម' : 'Settlement Calculator'}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  {language === 'kh' ? 'គណនាថ្ងៃត្រូវសង ប្រាក់ត្រូវបង់ប្រចាំថ្ងៃ និងបង្កើតកាលវិភាគផ្ញើចូល Telegram' : 'Calculate payoff timeline, daily installment, and generate formatted schedule text.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            {/* Form Inputs */}
            <div className="space-y-3.5 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'kh' ? 'ឈ្មោះកូនបំណុល' : 'Borrower Name'}
                  </label>
                  <input
                    type="text"
                    value={calcBorrowerName}
                    onChange={(e) => setCalcBorrowerName(e.target.value)}
                    placeholder="ឧ. សុខ ចាន់"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'kh' ? 'លេខទូរស័ព្ទ' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    value={calcBorrowerPhone}
                    onChange={(e) => setCalcBorrowerPhone(e.target.value)}
                    placeholder="ឧ. 012 345 678"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate block">
                    {language === 'kh' ? 'ប្រាក់ដើមត្រូវសងសរុប' : 'Total Principal'}
                  </label>
                  <input
                    type="number"
                    placeholder={language === 'kh' ? 'ចំនួនប្រាក់ដើម' : 'Enter principal'}
                    value={calcPrincipal}
                    onChange={(e) => setCalcPrincipal(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-400 font-sans"
                  />
                </div>

                <div className="space-y-1 col-span-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate block">
                    {language === 'kh' ? 'រូបិយប័ណ្ណ' : 'Currency'}
                  </label>
                  <select
                    value={calcCurrency}
                    onChange={(e) => setCalcCurrency(e.target.value as any)}
                    className="w-full px-2 sm:px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="KHR">KHR (៛)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'kh' ? 'ប្រាក់សុំឡើងក្នុងមួយថ្ងៃ' : 'Daily Installment Rate'}
                </label>
                <input
                  type="number"
                  placeholder={language === 'kh' ? 'បញ្ចូលចំនួនប្រាក់សុំឡើង' : 'Enter daily rate'}
                  value={calcDailyRate}
                  onChange={(e) => setCalcDailyRate(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-400 font-sans"
                />
                
                {/* Preset Chips */}
                <div className="flex items-center gap-1.5 pt-1.5 overflow-x-auto scrollbar-none py-1">
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">{language === 'kh' ? 'ជ្រើសលឿន៖' : 'Presets:'}</span>
                  {[5, 10, 15, 20, 25, 30, 50].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCalcDailyRate(amt)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer shrink-0 ${
                        calcDailyRate === amt
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {currSymbol}{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'kh' ? 'កាលបរិច្ឆេទចាប់ផ្តើម' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    value={calcStartDate}
                    onChange={(e) => setCalcStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'kh' ? 'ភពញឹកញាប់នៃការបង់' : 'Payment Frequency'}
                  </label>
                  <select
                    value={calcFrequency}
                    onChange={(e) => setCalcFrequency(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="daily">{language === 'kh' ? 'រៀងរាល់ថ្ងៃ (Daily)' : 'Every Day'}</option>
                    <option value="every_2_days">{language === 'kh' ? '២ថ្ងៃម្ដង (Every 2 Days)' : 'Every 2 Days'}</option>
                    <option value="weekly">{language === 'kh' ? '១សប្ដាហ៍ម្ដង (Weekly)' : 'Weekly'}</option>
                    <option value="monthly">{language === 'kh' ? '១ខែម្ដង (Monthly)' : 'Monthly'}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'kh' ? 'ចំណាំ / លក្ខខណ្ឌបន្ថែម' : 'Agreement Notes'}
                </label>
                <textarea
                  rows={2}
                  value={calcNote}
                  onChange={(e) => setCalcNote(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Results Output Box */}
            <div className="bg-slate-950 text-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-amber-500/30 space-y-4 flex flex-col justify-between">
              <div className="space-y-3.5 sm:space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="text-[11px] sm:text-xs font-black uppercase text-amber-400 tracking-wider">
                    {language === 'kh' ? '📊 លទ្ធផលនៃការគណនា' : 'Calculation Summary'}
                  </span>
                  <span className="text-[10px] sm:text-xs font-mono text-slate-400">0% Interest</span>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs">
                  <div className="bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-800">
                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold block">{language === 'kh' ? 'ប្រាក់ដើមសរុប' : 'Total Principal'}</span>
                    <span className="text-base sm:text-lg font-black text-amber-400">{currSymbol}{validPrincipal.toLocaleString()}</span>
                  </div>

                  <div className="bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-800">
                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold block">{language === 'kh' ? 'ចំនួនលើកបង់សរុប' : 'Total Installments'}</span>
                    <span className="text-base sm:text-lg font-black text-emerald-400">{totalInstallments} {language === 'kh' ? 'លើក' : 'times'}</span>
                  </div>

                  <div className="bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-800">
                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold block">{language === 'kh' ? 'ថ្ងៃចាប់ផ្តើម' : 'Start Date'}</span>
                    <span className="text-[11px] sm:text-xs font-extrabold text-white">{scheduleItems.length > 0 ? scheduleItems[0].isoDate : '-'}</span>
                  </div>

                  <div className="bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-800">
                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold block">{language === 'kh' ? 'ថ្ងៃបញ្ចប់ការសង' : 'Final Completion'}</span>
                    <span className="text-[11px] sm:text-xs font-extrabold text-amber-300">{endDateIso}</span>
                  </div>
                </div>

                {/* Schedule Items Preview List */}
                <div className="space-y-1.5">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">{language === 'kh' ? 'កាលវិភាគបង់ប្រាក់សង្ខេប៖' : 'Schedule Preview:'}</span>
                  <div className="bg-slate-900/90 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 max-h-40 sm:max-h-44 overflow-y-auto space-y-1.5 border border-slate-800 text-[10px] sm:text-[11px] font-mono">
                    {scheduleItems.map((item) => (
                      <div key={item.step} className="flex justify-between items-center text-slate-300 hover:text-white">
                        <span>• {language === 'kh' ? `លើកទី ${item.step}` : `Step ${item.step}`}: {item.isoDate}</span>
                        <span className="text-amber-400 font-bold">{currSymbol}{item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCopyTelegramSchedule}
                  className="w-full py-3 px-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-[11px] sm:text-xs rounded-xl sm:rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Send className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {copiedTelegram 
                      ? (language === 'kh' ? 'បានចម្លងរួចរាល់!' : 'Copied!') 
                      : (language === 'kh' ? 'ចម្លងកាលវិភាគផ្ញើចូល Telegram' : 'Copy Schedule for Telegram')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingApp && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span>{language === 'kh' ? 'បដិសេធសំណើសុំឡើងតែដើម' : 'Reject Hardship Request'}</span>
            </h3>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={language === 'kh' ? 'បញ្ចូលមូលហេតុនៃការបដិសេធ...' : 'Enter reason for rejection...'}
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingApp(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                {language === 'kh' ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
              >
                {language === 'kh' ? 'បញ្ជាក់បដិសេធ' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-3xl p-4 border border-slate-800 text-white space-y-3">
            <div className="flex justify-between items-center px-2">
              <h4 className="font-extrabold text-sm text-amber-400">{selectedPhoto.title}</h4>
              <button onClick={() => setSelectedPhoto(null)} className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <img src={selectedPhoto.src} alt="Preview" className="w-full h-auto max-h-[75vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}

      {/* Digital Loan Contract Modal */}
      {contractApp && (
        <DigitalLoanContractModal
          application={contractApp}
          onClose={() => setContractApp(null)}
          showToast={showToast}
        />
      )}

      {/* GPS Location Viewer Modal */}
      {isGpsModalOpen && gpsData && (
        <GPSLocationViewerModal
          isOpen={isGpsModalOpen}
          onClose={() => setIsGpsModalOpen(false)}
          locationData={{
            latitude: gpsData.latitude,
            longitude: gpsData.longitude,
            locationAccuracy: gpsData.accuracy,
            gpsCapturedAt: gpsData.capturedAt,
            borrowerName: gpsData.applicantName
          }}
          title={language === 'kh' ? 'ទីតាំង GPS សំណើសុំឡើងតែដើម' : 'GPS Location for Hardship Request'}
        />
      )}
    </div>
  );
}
