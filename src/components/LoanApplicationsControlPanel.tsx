import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { LoanApplication, DEFAULT_LENDER_INFO } from '../types';
import { useLanguage } from '../i18n';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Check, X, FileText, Phone, DollarSign, Calendar, Copy, 
  ExternalLink, Eye, AlertCircle, CheckCircle, ChevronDown, 
  Trash2, Search, Sparkles, UserCheck, ShieldAlert, RefreshCw, AlertTriangle, CreditCard, MapPin,
  Volume2, VolumeX, Bell, BellOff, Lock, Navigation
} from 'lucide-react';
import { checkExpiryStatus } from '../utils/ocrHelper';
import { playNewApplicationAlertSound } from '../utils';
import DigitalLoanContractModal from './DigitalLoanContractModal';

interface LoanApplicationsControlPanelProps {
  currentUser: string;
  onApproveAndCreateBorrower: (application: LoanApplication) => void;
  showToast: (message: string, type: 'success' | 'info') => void;
}

export default function LoanApplicationsControlPanel({ 
  currentUser, 
  onApproveAndCreateBorrower, 
  showToast 
}: LoanApplicationsControlPanelProps) {
  const { language } = useLanguage();
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal previews
  const [selectedPhoto, setSelectedPhoto] = useState<{ title: string; src: string } | null>(null);
  const [rejectingApp, setRejectingApp] = useState<LoanApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [contractApp, setContractApp] = useState<LoanApplication | null>(null);

  // Sound Alert Notification option state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('loan_app_sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  // GPS Location Requirement option state
  const [requireGps, setRequireGps] = useState<boolean>(() => {
    const saved = localStorage.getItem('loan_app_require_gps');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleRequireGps = () => {
    const next = !requireGps;
    setRequireGps(next);
    localStorage.setItem('loan_app_require_gps', String(next));
    if (next) {
      showToast(
        language === 'kh' ? '📍 បានបើកការកំណត់៖ តម្រូវអោយបើកទីតាំង GPS (Require Location)' : '📍 Required GPS Location Enabled',
        'info'
      );
    } else {
      showToast(
        language === 'kh' ? '🔓 បានបិទការកំណត់៖ មិនទាមទារទីតាំង GPS (Optional Location)' : '🔓 GPS Location Requirement Disabled',
        'info'
      );
    }
  };

  const isInitialLoad = React.useRef(true);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('loan_app_sound_enabled', String(next));
    if (next) {
      playNewApplicationAlertSound();
      showToast(
        language === 'kh' ? '🔔 បានបើកសំឡេង Alert Notification' : '🔔 Sound Alert Enabled',
        'info'
      );
    } else {
      showToast(
        language === 'kh' ? '🔕 បានបិទសំឡេង Alert Notification' : '🔕 Sound Alert Disabled',
        'info'
      );
    }
  };

  const handleTestSound = () => {
    playNewApplicationAlertSound();
    showToast(
      language === 'kh' ? '🔔 សាកល្បងសំឡេង Alert Notification' : '🔔 Testing Sound Alert',
      'info'
    );
  };

  useEffect(() => {
    setLoading(true);
    const q = collection(db, 'loan_applications');

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: LoanApplication[] = [];
      let hasNewPendingApp = false;

      if (!isInitialLoad.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data() as LoanApplication;
            if (!data.status || data.status === 'pending') {
              hasNewPendingApp = true;
            }
          }
        });
      }

      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as LoanApplication);
      });

      // Sort by newest first
      list.sort((a, b) => (new Date(b.createdAt || 0).getTime() || 0) - (new Date(a.createdAt || 0).getTime() || 0));
      setApplications(list);
      setLoading(false);

      if (hasNewPendingApp && soundEnabled) {
        playNewApplicationAlertSound();
        showToast(
          language === 'kh' ? '🔔 មានសំណើសុំកម្ចីថ្មីទើបតែផ្ញើមក!' : '🔔 New loan application received!',
          'info'
        );
      }

      isInitialLoad.current = false;
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, soundEnabled]);

  const copyApplyLink = () => {
    const applyUrl = `${window.location.origin}/?apply=true&lender=${currentUser}`;
    navigator.clipboard.writeText(applyUrl);
    showToast(
      language === 'kh' 
        ? '📋 ចម្លងតំណភ្ជាប់ស្នើសុំកម្ចីរួចរាល់! អាចផ្ញើអោយកូនបំណុលបំពេញបាន។' 
        : '📋 Loan application link copied successfully!',
      'success'
    );
  };

  const handleApprove = async (app: LoanApplication) => {
    try {
      // 1. Update status in firestore
      const docRef = doc(db, 'loan_applications', app.id);
      await updateDoc(docRef, {
        status: 'approved',
        approvedAt: new Date().toISOString()
      });
      
      showToast(
        language === 'kh' 
          ? `✅ បានអនុម័តសំណើរបស់ ${app.name} រួចរាល់! កំពុងបើកផ្ទាំងបង្កើតអ្នកខ្ចី...` 
          : `✅ Approved ${app.name}! Opening add borrower page...`,
        'success'
      );

      // 2. Callback to App.tsx to load borrower template and open modal
      onApproveAndCreateBorrower(app);
    } catch (err) {
      console.error("Error approving loan application:", err);
      alert(language === 'kh' ? "មានបញ្ហាក្នុងការអនុម័ត!" : "Error approving application!");
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectingApp) return;
    try {
      const docRef = doc(db, 'loan_applications', rejectingApp.id);
      await updateDoc(docRef, {
        status: 'rejected',
        rejectedReason: rejectReason.trim() || (language === 'kh' ? 'លក្ខខណ្ឌមិនគ្រប់គ្រាន់' : 'Requirements not met')
      });
      showToast(
        language === 'kh' 
          ? `❌ បានបដិសេធសំណើសុំកម្ចីរបស់ ${rejectingApp.name}` 
          : `❌ Rejected loan application of ${rejectingApp.name}`,
        'info'
      );
      setRejectingApp(null);
      setRejectReason('');
    } catch (err) {
      console.error("Error rejecting loan application:", err);
      alert("Error rejecting application");
    }
  };

  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);

  // Clear selections when tab changes
  useEffect(() => {
    setSelectedAppIds([]);
  }, [activeTab]);

  const handleToggleSelect = (id: string) => {
    setSelectedAppIds(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const allFilteredIds = filteredApps.map(app => app.id);
    const areAllSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedAppIds.includes(id));

    if (areAllSelected) {
      setSelectedAppIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedAppIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const handleDeleteIndividual = async (app: LoanApplication) => {
    const confirmMessage = language === 'kh'
      ? `តើអ្នកប្រាកដជាចង់លុបសំណើសុំកម្ចីរបស់ ${app.name} ឬទេ? ការលុបនេះមិនអាចយកមកវិញបានឡើយ។`
      : `Are you sure you want to delete the loan application of ${app.name}? This action cannot be undone.`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const docRef = doc(db, 'loan_applications', app.id);
      await deleteDoc(docRef);

      setSelectedAppIds(prev => prev.filter(id => id !== app.id));

      showToast(
        language === 'kh'
          ? `🗑️ បានលុបសំណើសុំកម្ចីរបស់ ${app.name} រួចរាល់!`
          : `🗑️ Deleted loan application of ${app.name} successfully!`,
        'success'
      );
    } catch (err) {
      console.error("Error deleting loan application:", err);
      alert(language === 'kh' ? "មានបញ្ហាក្នុងការលុប!" : "Error deleting application!");
    }
  };

  const handleDeleteSelected = async () => {
    const confirmMessage = language === 'kh'
      ? `តើអ្នកប្រាកដជាចង់លុបសំណើសុំកម្ចីដែលបានជ្រើសរើសទាំង ${selectedAppIds.length} នេះឬទេ? ការលុបនេះមិនអាចយកមកវិញបានឡើយ។`
      : `Are you sure you want to delete the ${selectedAppIds.length} selected loan applications? This action cannot be undone.`;

    if (!window.confirm(confirmMessage)) return;

    try {
      await Promise.all(
        selectedAppIds.map(id => deleteDoc(doc(db, 'loan_applications', id)))
      );

      setSelectedAppIds([]);

      showToast(
        language === 'kh'
          ? `🗑️ បានលុបសំណើសុំកម្ចីចំនួន ${selectedAppIds.length} រួចរាល់!`
          : `🗑️ Deleted ${selectedAppIds.length} loan applications successfully!`,
        'success'
      );
    } catch (err) {
      console.error("Error deleting selected applications:", err);
      alert(language === 'kh' ? "មានបញ្ហាក្នុងការលុបសំណើដែលបានជ្រើសរើស!" : "Error deleting selected applications!");
    }
  };

  // 1. User specific applications list (case-insensitive lenderId check, admin sees all)
  const userApplications = applications.filter((app) => {
    if (app.lenderId && currentUser) {
      const appLender = app.lenderId.trim().toLowerCase();
      const currentLender = currentUser.trim().toLowerCase();
      if (currentLender !== 'sounravin' && appLender !== currentLender) {
        return false;
      }
    }
    return true;
  });

  // 2. Filtered applications based on tab & search
  const filteredApps = userApplications.filter((app) => {
    // Tab filter
    const appStatus = app.status || 'pending';
    if (activeTab !== 'all' && appStatus !== activeTab) return false;
    
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (app.name || '').toLowerCase().includes(q);
      const matchPhone = (app.phone || '').includes(q);
      return matchName || matchPhone;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle className="w-3 h-3" />
            {language === 'kh' ? 'បានអនុម័ត' : 'Approved'}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <ShieldAlert className="w-3 h-3" />
            {language === 'kh' ? 'បានបដិសេធ' : 'Rejected'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" />
            {language === 'kh' ? 'កំពុងរង់ចាំ' : 'Pending'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            ⚡️ {language === 'kh' ? 'ផ្ទាំងគ្រប់គ្រងសំណើសុំកម្ចី' : 'Loan Request Control Panel'}
          </h1>
          <p className="text-xs text-slate-400 font-semibold">
            {language === 'kh' 
              ? 'ត្រួតពិនិត្យ ពិនិត្យឯកសារអត្តសញ្ញាណប័ណ្ណ និងអនុម័តការសុំខ្ចីលុយឆក់របស់កូនបំណុល' 
              : 'Review submitted IDs, face selfies, and approve quick debtor loan applications.'}
          </p>
        </div>

        {/* Copy Apply Link Action Box */}
        <div className="w-full md:w-auto p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
          <div className="text-left space-y-0.5 flex-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
              {language === 'kh' ? 'តំណភ្ជាប់សុំកម្ចីសម្រាប់កូនបំណុល' : 'Client Application Link'}
            </p>
            <p className="text-xs font-bold text-slate-300 select-all truncate max-w-[200px]">
              {`${window.location.origin}/?apply=true&lender=${currentUser}`}
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={copyApplyLink}
              className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/10 active:scale-95"
            >
              <Copy className="w-3.5 h-3.5" />
              {language === 'kh' ? 'ចម្លងតំណភ្ជាប់' : 'Copy Link'}
            </button>
            <a
              href={`/?apply=true&lender=${currentUser}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-700"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {language === 'kh' ? 'បើកមើល' : 'Preview'}
            </a>
          </div>
        </div>
      </div>

      {/* Control Options Row (Sound & GPS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sound Alert Notification Option Control Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800/90 p-4 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border ${soundEnabled ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
              {soundEnabled ? <Volume2 className="w-5 h-5 animate-pulse" /> : <VolumeX className="w-5 h-5" />}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                  🔔 {language === 'kh' ? 'សំឡេង Alert Notification' : 'Alert Sound Option'}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${soundEnabled ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                  {soundEnabled ? (language === 'kh' ? '● បើកដំណើរការ (ON)' : '● ACTIVE') : (language === 'kh' ? '○ បានបិទ (OFF)' : '○ OFF')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {language === 'kh' ? 'លាន់សំឡេង alert ស្វ័យប្រវត្តិនៅពេលកូនបំណុលផ្ញើសំណើសុំកម្ចី' : 'Plays a sound alert when a borrower submits a loan request'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <button
              type="button"
              onClick={handleTestSound}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 border border-slate-700 cursor-pointer active:scale-95 shadow-sm"
              title="Test Sound"
            >
              <Bell className="w-3.5 h-3.5 text-cyan-400" />
              <span>{language === 'kh' ? 'សាកសំឡេង' : 'Test'}</span>
            </button>

            <button
              type="button"
              onClick={toggleSound}
              className={`px-3.5 py-2 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-95 ${
                soundEnabled 
                  ? 'bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300' 
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
              }`}
            >
              {soundEnabled ? (
                <>
                  <BellOff className="w-3.5 h-3.5" />
                  <span>{language === 'kh' ? 'បិទសំឡេង' : 'Disable'}</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5" />
                  <span>{language === 'kh' ? 'បើកសំឡេង' : 'Enable'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* GPS Location Requirement Option Control Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800/90 p-4 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border ${requireGps ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
              <MapPin className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                  📍 {language === 'kh' ? 'តម្រូវអោយបើកទីតាំង GPS' : 'Require GPS Location'}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${requireGps ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/15 border-amber-500/30 text-amber-300'}`}>
                  {requireGps ? (language === 'kh' ? '● ទាមទារ GPS (Required)' : '● REQUIRED') : (language === 'kh' ? '○ មិនទាមទារ (Optional)' : '○ OPTIONAL')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {language === 'kh' ? 'កំណត់អោយកូនបំណុលតម្រូវតែបើក Location/GPS ជាចាំបាច់នៅពេលសុំកម្ចី' : 'Mandate borrowers to enable GPS location when requesting a loan'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 justify-end">
            <button
              type="button"
              onClick={toggleRequireGps}
              className={`w-full sm:w-auto px-4 py-2 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-95 ${
                requireGps 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20' 
                  : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300'
              }`}
            >
              {requireGps ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>{language === 'kh' ? 'បើកដំណើរការ (ទាមទារ GPS)' : 'ON (Required)'}</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5 text-slate-400" />
                  <span>{language === 'kh' ? 'បានបិទ (មិនទាមទារ GPS)' : 'OFF (Optional)'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs and Search Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
        
        {/* Tabs Row */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800/80 gap-1 w-full md:w-auto overflow-x-auto shrink-0">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => {
            const count = userApplications.filter(a => tab === 'all' ? true : (a.status || 'pending') === tab).length;
            const tabName = {
              pending: language === 'kh' ? '⏳ រង់ចាំពិនិត្យ' : 'Pending',
              approved: language === 'kh' ? '✅ បានអនុម័ត' : 'Approved',
              rejected: language === 'kh' ? '❌ បានបដិសេធ' : 'Rejected',
              all: language === 'kh' ? '📂 ទាំងអស់' : 'All'
            }[tab];
            
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab
                    ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>{tabName}</span>
                <span className={`px-1.5 py-0.5 text-[9px] rounded-md font-black ${
                  activeTab === tab 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search bar input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'kh' ? 'ស្វែងរកឈ្មោះ ឬលេខទូរស័ព្ទ...' : 'Search applicant name/phone...'}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium text-slate-200 placeholder-slate-600"
          />
        </div>
      </div>

      {/* Bulk actions and select-all bar for Approved, Rejected, and All tabs */}
      {!loading && filteredApps.length > 0 && activeTab !== 'pending' && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="selectAllApps"
              checked={filteredApps.length > 0 && filteredApps.every(app => selectedAppIds.includes(app.id))}
              onChange={handleToggleSelectAll}
              className="w-4.5 h-4.5 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
            />
            <label htmlFor="selectAllApps" className="text-xs font-bold text-slate-300 cursor-pointer select-none flex items-center gap-2">
              {language === 'kh' 
                ? `ជ្រើសរើសទាំងអស់ (បានជ្រើសរើស ${selectedAppIds.length}/${filteredApps.length})` 
                : `Select All (Selected ${selectedAppIds.length}/${filteredApps.length})`}
            </label>
          </div>
          
          {selectedAppIds.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={handleDeleteSelected}
              className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/10 active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {language === 'kh' 
                ? `លុបសំណើដែលបានជ្រើសរើស (${selectedAppIds.length})` 
                : `Delete Selected (${selectedAppIds.length})`}
            </motion.button>
          )}
        </div>
      )}

      {/* Applications Grid / Table list */}
      {loading ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col items-center justify-center">
          <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mb-3" />
          <p className="text-sm font-bold text-slate-400 animate-pulse">កំពុងទាញយកឯកសារកូនបំណុល...</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-3">
          <div className="text-4xl">📂</div>
          <p className="text-sm font-extrabold text-slate-400">
            {language === 'kh' ? 'មិនមានសំណើសុំខ្ចីប្រាក់ឡើយ' : 'No loan applications found.'}
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">
            {language === 'kh' 
              ? 'រាល់ព័ត៌មានដែលកូនបំណុលបានបំពេញតាមរយៈតំណភ្ជាប់របស់អ្នក នឹងត្រូវបានបង្ហាញនៅទីនេះ។' 
              : 'All borrower quick loan forms submitted via your application link will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredApps.map((app) => (
              <motion.div
                key={app.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 hover:border-slate-750 transition flex flex-col justify-between"
              >
                {/* Header Information Card */}
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-start gap-3">
                      {/* Checkbox for Bulk Deletion - only for approved, rejected, or all tabs (non-pending) */}
                      {activeTab !== 'pending' && (
                        <input
                          type="checkbox"
                          checked={selectedAppIds.includes(app.id)}
                          onChange={() => handleToggleSelect(app.id)}
                          className="mt-1 w-4.5 h-4.5 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                        />
                      )}
                      <div className="space-y-1">
                        <h3 className="text-base font-black text-white tracking-tight">{app.name}</h3>
                        <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-blue-400" />
                          {app.phone}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusBadge(app.status)}
                      
                      {/* Individual Delete Option */}
                      {activeTab !== 'pending' && (
                        <button
                          onClick={() => handleDeleteIndividual(app)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg transition cursor-pointer border border-rose-500/10"
                          title={language === 'kh' ? 'លុបសំណើនេះ' : 'Delete this request'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Body stats block */}
                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-3 rounded-2xl border border-slate-800/50">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        {language === 'kh' ? 'ទឹកប្រាក់ស្នើសុំ' : 'Loan Requested'}
                      </span>
                      <p className="text-sm font-black text-emerald-400">${app.amountRequested.toLocaleString()} USD</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        {language === 'kh' ? 'កាលបរិច្ឆេទផ្ញើ' : 'Applied On'}
                      </span>
                      <p className="text-[11px] font-bold text-slate-300">
                        {new Date(app.createdAt).toLocaleDateString(language === 'kh' ? 'km-KH' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>

                    {app.paymentType && (
                      <div className="space-y-0.5 pt-1.5 border-t border-slate-800/40">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          {language === 'kh' ? 'ប្រភេទនៃការបង់ប្រាក់' : 'Payment Type'}
                        </span>
                        <p className="text-xs font-bold text-slate-300">
                          {app.paymentType === 'daily' ? (language === 'kh' ? 'បង់រាល់ថ្ងៃ' : 'Daily') :
                           app.paymentType === 'weekly' ? (language === 'kh' ? 'បង់រាល់សប្តាហ៍' : 'Weekly') :
                           app.paymentType === 'monthly' ? (language === 'kh' ? 'បង់រាល់ខែ' : 'Monthly') :
                           app.paymentType === 'every_2_days' ? (language === 'kh' ? 'បង់រាល់២ថ្ងៃ' : 'Every 2 days') :
                           (language === 'kh' ? 'ផ្សេងៗ' : 'Custom')}
                        </p>
                      </div>
                    )}

                    {app.interestMethod && (
                      <div className="space-y-0.5 pt-1.5 border-t border-slate-800/40">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          {language === 'kh' ? 'របៀបគណនាការប្រាក់' : 'Interest Method'}
                        </span>
                        <p className="text-xs font-bold text-slate-300">
                          {app.interestMethod === 'flat' ? (language === 'kh' ? 'ការប្រាក់ថេរ' : 'Flat Rate') :
                           app.interestMethod === 'declining' ? (language === 'kh' ? 'ការប្រាក់ថយចុះ' : 'Declining') :
                           (language === 'kh' ? 'គ្មានការប្រាក់' : 'No Interest')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Attachment Images Previews */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* ID Card image preview */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        📄 {language === 'kh' ? 'អត្តសញ្ញាណប័ណ្ណ' : 'National ID Card'}
                      </span>
                      <div className="relative h-28 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 group">
                        <img src={app.idCardPhoto} alt="ID Card" className="w-full h-full object-contain p-0.5" />
                        <button
                          onClick={() => setSelectedPhoto({ title: `${app.name} - ${language === 'kh' ? 'អត្តសញ្ញាណប័ណ្ណ' : 'ID Card'}`, src: app.idCardPhoto })}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-extrabold text-slate-100 gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {language === 'kh' ? 'មើលរូបធំច្បាស់' : 'View HD'}
                        </button>
                      </div>
                    </div>

                    {/* Selfie face preview */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        👤 {language === 'kh' ? 'រូបថតផ្ទៃមុខ' : 'Selfie Face'}
                      </span>
                      <div className="relative h-24 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 group">
                        <img src={app.selfiePhoto} alt="Selfie" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setSelectedPhoto({ title: `${app.name} - Selfie`, src: app.selfiePhoto })}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-extrabold text-slate-100 gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {language === 'kh' ? 'មើលធំ' : 'View'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Extracted ID Card Credentials & Expiry Status */}
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                      <span className="font-extrabold text-blue-400 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                        {language === 'kh' ? 'ទិន្នន័យអត្តសញ្ញាណប័ណ្ណ (Reendem Data)' : 'ID Credentials'}
                      </span>
                      {checkExpiryStatus(app.idExpiryDate) === 'expired' ? (
                        <span className="px-2 py-0.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 font-black rounded-md text-[10px] flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-rose-500" />
                          🔴 ផុតកំណត់ (Expired)
                        </span>
                      ) : checkExpiryStatus(app.idExpiryDate) === 'expiring_soon' ? (
                        <span className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 font-black rounded-md text-[10px] flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-400" />
                          🟡 ជិតផុតកំណត់ ត្រឹម ១ខែ
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black rounded-md text-[10px] flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          🟢 មានសុពលភាព (Valid)
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">លេខ ID Card:</span>
                        <span className="font-extrabold text-blue-300">{app.idCardNumber || 'មិនទាន់មាន'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">ថ្ងៃកំណើត:</span>
                        <span className="font-bold text-slate-300">{app.dob || 'មិនទាន់មាន'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">អាសយដ្ឋាន:</span>
                        <span className="font-semibold text-slate-300">{app.address || 'មិនទាន់មាន'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">ថ្ងៃផុតកំណត់ ID:</span>
                        <span className="font-bold text-slate-300">{app.idExpiryDate || 'មិនទាន់មាន'}</span>
                      </div>
                    </div>

                    {/* GPS Pin Location Option - Lenders Only */}
                    <div className="p-3 bg-slate-950 border border-blue-500/30 rounded-2xl space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="font-extrabold text-blue-400 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                          <MapPin className="w-3.5 h-3.5 text-blue-400 animate-bounce" />
                          {language === 'kh' ? 'ទីតាំង GPS កូនបំណុល (Location Service)' : 'Borrower GPS Pin Location'}
                        </span>
                        {app.latitude && app.longitude ? (
                          <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black rounded-md text-[10px] flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            🟢 GPS បានចាប់ (Captured)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 font-black rounded-md text-[10px] flex items-center gap-1">
                            🔴 គ្មានទិន្នន័យ GPS
                          </span>
                        )}
                      </div>

                      {app.latitude && app.longitude ? (
                        <div className="space-y-2 pt-1">
                          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase font-bold">Latitude:</span>
                              <span className="font-extrabold text-emerald-400">{app.latitude.toFixed(6)}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase font-bold">Longitude:</span>
                              <span className="font-extrabold text-emerald-400">{app.longitude.toFixed(6)}</span>
                            </div>
                            {app.locationAccuracy && (
                              <div className="col-span-2 text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-850 flex items-center justify-between">
                                <span>🎯 ភាពច្បាស់លាស់៖ ~{Math.round(app.locationAccuracy)}m</span>
                                {app.gpsCapturedAt && (
                                  <span className="text-slate-500">{new Date(app.gpsCapturedAt).toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' })}</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Direct Map Links & Interactive Map Embed */}
                          <div className="flex gap-2">
                            <a
                              href={`https://www.google.com/maps?q=${app.latitude},${app.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 active:scale-95"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                              <span>📍 Pin Location Google Map</span>
                              <ExternalLink className="w-3 h-3 opacity-80" />
                            </a>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${app.latitude},${app.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-emerald-600/20 active:scale-95"
                              title={language === 'kh' ? 'នាំផ្លូវទៅកាន់ទីតាំង' : 'Get Directions'}
                            >
                              🚀 នាំផ្លូវ
                            </a>
                          </div>

                          {/* Embedded Google Map Preview */}
                          <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900 mt-1">
                            <iframe
                              title={`Map preview for ${app.name}`}
                              width="100%"
                              height="130"
                              frameBorder="0"
                              style={{ border: 0 }}
                              src={`https://maps.google.com/maps?q=${app.latitude},${app.longitude}&z=15&output=embed`}
                              allowFullScreen
                              loading="lazy"
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic py-1 text-center">
                          {language === 'kh' ? 'សំណើកម្ចីនេះមិនមានទិន្នន័យ GPS ទីតាំងជាក់ស្តែងឡើយ។' : 'No GPS coordinates were captured for this request.'}
                        </p>
                      )}
                    </div>

                    {/* Action Button to Generate / Open Digital Contract */}
                    <button
                      onClick={() => setContractApp(app)}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-blue-400 border border-blue-500/30 hover:border-blue-500/60 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      <span>📄 {language === 'kh' ? 'បង្កើត/បោះពុម្ព លិខិតកម្ចី Digital' : 'Digital Loan Contract'}</span>
                    </button>
                  </div>

                  {/* Rejected Reason info bar if rejected */}
                  {app.status === 'rejected' && app.rejectedReason && (
                    <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-1.5 text-[11px] text-rose-400 font-bold leading-relaxed">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <p>
                        {language === 'kh' ? 'ហេតុផលបដិសេធ៖ ' : 'Reject reason: '}
                        <span className="font-semibold text-slate-300">{app.rejectedReason}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions row if pending */}
                {app.status === 'pending' && (
                  <div className="flex gap-2.5 pt-4 border-t border-slate-850 mt-4 shrink-0">
                    <button
                      onClick={() => setRejectingApp(app)}
                      className="flex-1 py-2.5 border border-rose-500/30 hover:border-rose-500/50 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      {language === 'kh' ? 'បដិសេធ' : 'Reject'}
                    </button>
                    <button
                      onClick={() => handleApprove(app)}
                      className="flex-[2] py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      {language === 'kh' ? 'អនុម័តសំណើ' : 'Approve Application'}
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Lightbox / Image Zoom Full Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800">
                <h3 className="text-sm font-black text-white">{selectedPhoto.title}</h3>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 bg-slate-950 flex items-center justify-center min-h-[300px] max-h-[70vh]">
                <img 
                  src={selectedPhoto.src} 
                  alt={selectedPhoto.title} 
                  className="max-w-full max-h-[65vh] object-contain rounded-xl" 
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reject Reason Dialog Modal */}
      <AnimatePresence>
        {rejectingApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-base font-black text-white flex items-center gap-1.5 text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                  {language === 'kh' ? 'ហេតុផលបដិសេធ' : 'Reject Loan Application'}
                </h3>
                <button
                  onClick={() => setRejectingApp(null)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                {language === 'kh' 
                  ? `សូមបញ្ជាក់មូលហេតុដែលអ្នកសម្រេចចិត្តបដិសេធសំណើខ្ចីប្រាក់របស់ ${rejectingApp.name} ៖` 
                  : `Specify why you decided to reject the loan request of ${rejectingApp.name}:`}
              </p>
              
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={language === 'kh' ? 'ឧទាហរណ៍៖ លក្ខខណ្ឌមិនគ្រប់គ្រាន់ / រូបថតអត្តសញ្ញាណប័ណ្ណមិនច្បាស់...' : 'e.g., Unclear ID card / insufficient credentials...'}
                className="w-full px-4 py-3 text-xs bg-slate-950 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition font-medium text-slate-200 placeholder-slate-600"
              />

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingApp(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-black rounded-xl transition cursor-pointer"
                >
                  {language === 'kh' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleRejectSubmit}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-md shadow-rose-600/10 active:scale-95"
                >
                  {language === 'kh' ? 'បដិសេធជាផ្លូវការ' : 'Confirm Reject'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Digital Loan Contract Modal */}
      <AnimatePresence>
        {contractApp && (
          <DigitalLoanContractModal
            application={contractApp}
            onClose={() => setContractApp(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
