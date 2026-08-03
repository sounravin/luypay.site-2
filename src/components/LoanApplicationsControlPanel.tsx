import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { LoanApplication, PaymentDelayRequest, DEFAULT_LENDER_INFO } from '../types';
import { useLanguage } from '../i18n';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Check, X, FileText, Phone, DollarSign, Calendar, Copy, 
  ExternalLink, Eye, AlertCircle, CheckCircle, ChevronDown, 
  Trash2, Search, Sparkles, UserCheck, ShieldAlert, RefreshCw, AlertTriangle, CreditCard, MapPin,
  Volume2, VolumeX, Bell, BellOff, Lock, Navigation, Plus, Camera, Upload, User, Clock, Compass, ShieldCheck
} from 'lucide-react';
import { checkExpiryStatus, scanIdCardImage } from '../utils/ocrHelper';
import { playNewApplicationAlertSound } from '../utils';
import DigitalLoanContractModal from './DigitalLoanContractModal';
import GPSLocationViewerModal from './GPSLocationViewerModal';


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

  // New or Edit Application Modal
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<LoanApplication | null>(null);

  // Sound Alert Notification option state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('loan_app_sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  // Mode Switcher: Loan Applications vs Payment Delay Requests
  const [panelMode, setPanelMode] = useState<'applications' | 'delay_requests'>('applications');
  const [delayRequests, setDelayRequests] = useState<PaymentDelayRequest[]>([]);
  const [delayActiveTab, setDelayActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('all');
  const [delaySearchQuery, setDelaySearchQuery] = useState('');

  // GPS Modal Viewer State
  const [isGpsModalOpen, setIsGpsModalOpen] = useState(false);
  const [selectedGpsModalData, setSelectedGpsModalData] = useState<any | null>(null);

  // GPS Location Requirement option state
  const [requireGps, setRequireGps] = useState<boolean>(() => {
    const saved = localStorage.getItem('loan_app_require_gps');
    return saved !== null ? saved === 'true' : false;
  });

  // Real-time listener for Payment Delay Requests
  useEffect(() => {
    const q = collection(db, 'payment_delay_requests');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: PaymentDelayRequest[] = [];
      const userLower = (currentUser || 'sounravin').toLowerCase();

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as PaymentDelayRequest;
        if (currentUser === 'sounravin' || !data.lenderId || (data.lenderId && data.lenderId.toLowerCase() === userLower)) {
          list.push({ id: docSnap.id, ...data });
        }
      });

      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setDelayRequests(list);
    }, (err) => {
      console.warn('Error subscribing to payment_delay_requests:', err);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'gps_config'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && typeof data.requireGps === 'boolean') {
          setRequireGps(data.requireGps);
          localStorage.setItem('loan_app_require_gps', String(data.requireGps));
        }
      }
    }, (err) => {
      console.warn("Error subscribing to gps_config:", err);
    });
    return () => unsub();
  }, []);

  const toggleRequireGps = async () => {
    const next = !requireGps;
    setRequireGps(next);
    localStorage.setItem('loan_app_require_gps', String(next));
    window.dispatchEvent(new Event('storage'));
    try {
      await setDoc(doc(db, 'settings', 'gps_config'), { requireGps: next, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn("Error saving gps_config to Firestore:", err);
    }
    if (next) {
      showToast(
        language === 'kh' ? '🔒 បានបើកការកំណត់៖ ទាមទារទីតាំង GPS (Require Location)' : '🔒 Required GPS Location Enabled',
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

  const copyDelayLink = () => {
    const delayUrl = `${window.location.origin}/?delay=true&lender=${currentUser}`;
    navigator.clipboard.writeText(delayUrl);
    showToast(
      language === 'kh' 
        ? '📋 ចម្លងតំណភ្ជាប់ស្នើសុំពន្យារពេលបង់ប្រាក់រួចរាល់! អាចផ្ញើអោយកូនបំណុលបាន។' 
        : '📋 Payment extension link copied successfully!',
      'success'
    );
  };

  const handleApproveDelayRequest = async (req: PaymentDelayRequest) => {
    try {
      await updateDoc(doc(db, 'payment_delay_requests', req.id), {
        status: 'approved',
        approvedAt: new Date().toISOString(),
      });
      showToast(
        language === 'kh' ? '✅ បានអនុម័តសំណើសុំពន្យារពេលបង់ប្រាក់រួចរាល់!' : '✅ Approved extension request!',
        'success'
      );
    } catch (e) {
      console.error('Error approving delay request:', e);
    }
  };

  const handleRejectDelayRequest = async (req: PaymentDelayRequest) => {
    try {
      await updateDoc(doc(db, 'payment_delay_requests', req.id), {
        status: 'rejected',
      });
      showToast(
        language === 'kh' ? '❌ បានបដិសេធសំណើសុំពន្យារពេលបង់ប្រាក់' : '❌ Rejected extension request',
        'info'
      );
    } catch (e) {
      console.error('Error rejecting delay request:', e);
    }
  };

  const handleDeleteDelayRequest = async (reqId: string) => {
    if (!window.confirm(language === 'kh' ? 'តើអ្នកពិតជាចង់លុបសំណើពន្យារនេះមែនទេ?' : 'Delete this extension request?')) return;
    try {
      await deleteDoc(doc(db, 'payment_delay_requests', reqId));
      showToast(language === 'kh' ? '🗑️ បានលុបសំណើពន្យាររួចរាល់' : '🗑️ Deleted request', 'info');
    } catch (e) {
      console.error('Error deleting delay request:', e);
    }
  };

  const filteredDelayRequests = delayRequests.filter((req) => {
    if (delayActiveTab !== 'all' && (req.status || 'pending') !== delayActiveTab) return false;
    if (delaySearchQuery.trim()) {
      const q = delaySearchQuery.toLowerCase();
      const matchName = (req.borrowerName || '').toLowerCase().includes(q);
      const matchPhone = (req.borrowerPhone || '').includes(q);
      const matchReason = (req.reason || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchReason;
    }
    return true;
  });

  const pendingDelayCount = delayRequests.filter((r) => r.status === 'pending').length;


  return (
    <div className="space-y-6">
      
      {/* Mode Switcher Tabs */}
      <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-3xl shadow-2xl gap-2">
        <button
          onClick={() => setPanelMode('applications')}
          className={`flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-2 ${
            panelMode === 'applications'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>{language === 'kh' ? '⚡️ សំណើសុំកម្ចី' : '⚡️ Loan Applications'}</span>
          <span className="px-2 py-0.5 bg-blue-950/80 text-blue-300 rounded-md text-xs border border-blue-800/60 font-mono">
            {userApplications.length}
          </span>
        </button>

        <button
          onClick={() => setPanelMode('delay_requests')}
          className={`flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-2 relative ${
            panelMode === 'delay_requests'
              ? 'bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 text-white shadow-lg shadow-amber-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{language === 'kh' ? '⏰ សំណើសុំពន្យារពេលបង់ប្រាក់ (GPS Track)' : '⏰ Payment Extension Requests'}</span>
          {pendingDelayCount > 0 && (
            <span className="px-2 py-0.5 bg-rose-500 text-white rounded-md text-xs font-mono font-bold animate-pulse shadow-md">
              {pendingDelayCount}
            </span>
          )}
        </button>
      </div>

      {panelMode === 'delay_requests' ? (
        <div className="space-y-6">
          {/* Header Block for Delay Requests */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
                ⏰ {language === 'kh' ? 'ផ្ទាំងគ្រប់គ្រងសំណើសុំពន្យារពេលបង់ប្រាក់' : 'Payment Extension Requests Dashboard'}
              </h1>
              <p className="text-xs text-slate-400 font-semibold">
                {language === 'kh' 
                  ? 'ពិនិត្យមើលសំណើសុំពន្យារពេលបង់ប្រាក់ពីកូនបំណុល និងទីតាំង GPS ដែលបានផ្ទៀងផ្ទាត់' 
                  : 'Review payment delay requests submitted by borrowers along with verified GPS location data.'}
              </p>
            </div>

            {/* Shareable Link Box */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="text-left space-y-0.5 flex-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  {language === 'kh' ? 'តំណភ្ជាប់សំណើសុំពន្យារពេលបង់' : 'Delay Request Link'}
                </p>
                <p className="text-xs font-bold text-amber-300 select-all truncate max-w-[200px]">
                  {`${window.location.origin}/?delay=true&lender=${currentUser}`}
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto shrink-0">
                <button
                  onClick={copyDelayLink}
                  className="flex-1 sm:flex-none px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {language === 'kh' ? 'ចម្លង Link' : 'Copy Link'}
                </button>
                <a
                  href={`/?delay=true&lender=${currentUser}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-700"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {language === 'kh' ? 'មើល' : 'Preview'}
                </a>
              </div>
            </div>
          </div>

          {/* Filter Tabs & Search for Delay Requests */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
            <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800/80 gap-1 w-full md:w-auto overflow-x-auto shrink-0">
              {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => {
                const count = delayRequests.filter(r => tab === 'all' ? true : (r.status || 'pending') === tab).length;
                const tabName = {
                  pending: language === 'kh' ? '⏳ រង់ចាំពិនិត្យ' : 'Pending',
                  approved: language === 'kh' ? '✅ បានអនុម័ត' : 'Approved',
                  rejected: language === 'kh' ? '❌ បានបដិសេធ' : 'Rejected',
                  all: language === 'kh' ? '📂 ទាំងអស់' : 'All'
                }[tab];

                return (
                  <button
                    key={tab}
                    onClick={() => setDelayActiveTab(tab)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      delayActiveTab === tab
                        ? 'bg-amber-600 text-white shadow-md border border-amber-500'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <span>{tabName}</span>
                    <span className={`px-1.5 py-0.5 text-[9px] rounded-md font-black ${
                      delayActiveTab === tab 
                        ? 'bg-amber-950 text-amber-200' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={delaySearchQuery}
                onChange={(e) => setDelaySearchQuery(e.target.value)}
                placeholder={language === 'kh' ? 'ស្វែងរកឈ្មោះ លេខទូរស័ព្ទ ឬមូលហេតុ...' : 'Search name, phone, or reason...'}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition font-medium text-slate-200 placeholder-slate-600"
              />
            </div>
          </div>

          {/* Delay Requests List */}
          {filteredDelayRequests.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
              <Clock className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-300">
                {language === 'kh' ? 'មិនទាន់មានសំណើសុំពន្យារពេលបង់ប្រាក់នៅឡើយទេ' : 'No payment extension requests found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {language === 'kh' ? 'នៅពេលកូនបំណុលបំពេញទម្រង់ស្នើសុំពន្យារពេលបង់ ព័ត៌មាន និងទីតាំង GPS នឹងបង្ហាញនៅទីនេះ។' : 'When borrowers submit delay requests, their information and verified GPS coordinates will appear here.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDelayRequests.map((req) => {
                const hasGps = typeof req.latitude === 'number' && typeof req.longitude === 'number';

                return (
                  <div
                    key={req.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-xl space-y-4 flex flex-col justify-between relative overflow-hidden group transition"
                  >
                    <div className="space-y-3">
                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div>
                          <h4 className="font-extrabold text-base text-white flex items-center gap-1.5">
                            <User className="w-4 h-4 text-amber-400" />
                            {req.borrowerName}
                          </h4>
                          {req.borrowerPhone && (
                            <p className="text-xs font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-emerald-400" />
                              <a href={`tel:${req.borrowerPhone}`} className="hover:underline">
                                {req.borrowerPhone}
                              </a>
                            </p>
                          )}
                        </div>

                        <div>{getStatusBadge(req.status)}</div>
                      </div>

                      {/* Reason & Date Details */}
                      <div className="space-y-2 text-xs">
                        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1">
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                            {language === 'kh' ? 'មូលហេតុស្នើសុំពន្យារ៖' : 'Extension Reason:'}
                          </span>
                          <p className="text-xs font-semibold text-slate-200 leading-relaxed">
                            {req.reason}
                          </p>
                        </div>

                        <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60 text-slate-300">
                          <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-purple-400" />
                            {language === 'kh' ? 'សុំពន្យារដល់៖' : 'Extension Date:'}
                          </span>
                          <span className="font-bold text-amber-300">{req.requestedDate}</span>
                        </div>

                        {req.createdAt && (
                          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
                            <span>{language === 'kh' ? 'ថ្ងៃផ្ញើសំណើ៖' : 'Submitted At:'}</span>
                            <span>{new Date(req.createdAt).toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      {/* GPS Badge Bar */}
                      <div className="pt-1">
                        {hasGps ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedGpsModalData(req);
                              setIsGpsModalOpen(true);
                            }}
                            className="w-full p-2.5 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/50 rounded-2xl flex items-center justify-between gap-2 text-xs text-emerald-300 transition cursor-pointer active:scale-98"
                          >
                            <span className="flex items-center gap-1.5 font-bold">
                              <MapPin className="w-4 h-4 text-emerald-400 animate-pulse" />
                              {language === 'kh' ? '📍 មើលទីតាំង GPS (GPS Verified)' : '📍 View Verified GPS'}
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-900/80 text-emerald-200 rounded-lg text-[10px] font-mono font-bold">
                              ±{Math.round(req.locationAccuracy || 0)}m
                            </span>
                          </button>
                        ) : (
                          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-2 text-xs text-slate-500">
                            <MapPin className="w-4 h-4 text-slate-600" />
                            <span>{language === 'kh' ? 'ពុំមានព័ត៌មាន GPS ឡើយ' : 'No GPS coordinates attached'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      {req.status === 'pending' && (
                        <div className="flex gap-2 w-full">
                          <button
                            type="button"
                            onClick={() => handleApproveDelayRequest(req)}
                            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-emerald-600/20 active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{language === 'kh' ? 'អនុម័ត' : 'Approve'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRejectDelayRequest(req)}
                            className="flex-1 py-2 px-3 bg-rose-950/80 hover:bg-rose-900/80 text-rose-300 font-bold text-xs rounded-xl transition cursor-pointer border border-rose-800/60 flex items-center justify-center gap-1 active:scale-95"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>{language === 'kh' ? 'បដិសេធ' : 'Reject'}</span>
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteDelayRequest(req.id)}
                        className="p-2 bg-slate-950 hover:bg-rose-950 text-slate-500 hover:text-rose-400 rounded-xl transition border border-slate-800 hover:border-rose-800/50 cursor-pointer ml-auto"
                        title="Delete Request"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
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


        {/* Header Action Controls */}
        <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Button to Add / Create New Application with ID Card */}
          <button
            type="button"
            onClick={() => {
              setEditingApp(null);
              setIsAppModalOpen(true);
            }}
            className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 border border-blue-400/30 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <CreditCard className="w-4 h-4" />
            <span>{language === 'kh' ? '+ បង្កើតសំណើកម្ចី (Upload ID Card)' : '+ New Application (Upload ID)'}</span>
          </button>

          {/* Copy Apply Link Action Box */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
            <div className="text-left space-y-0.5 flex-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                {language === 'kh' ? 'តំណភ្ជាប់សុំកម្ចីសម្រាប់កូនបំណុល' : 'Client Application Link'}
              </p>
              <p className="text-xs font-bold text-slate-300 select-all truncate max-w-[180px]">
                {`${window.location.origin}/?apply=true&lender=${currentUser}`}
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto shrink-0">
              <button
                onClick={copyApplyLink}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/10 active:scale-95"
              >
                <Copy className="w-3.5 h-3.5" />
                {language === 'kh' ? 'ចម្លង' : 'Copy'}
              </button>
              <a
                href={`/?apply=true&lender=${currentUser}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-700"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {language === 'kh' ? 'មើល' : 'Preview'}
              </a>
            </div>
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
            <div className={`p-2.5 rounded-2xl border ${requireGps ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
              <MapPin className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                  📍 {language === 'kh' ? 'តម្រូវអោយបើកទីតាំង GPS' : 'Require GPS Location'}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${requireGps ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/15 border-amber-500/30 text-amber-300'}`}>
                  {requireGps ? (language === 'kh' ? '● ទាមទារ GPS (ON)' : '● REQUIRED') : (language === 'kh' ? '○ មិនទាមទារ (OFF)' : '○ OPTIONAL')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {language === 'kh'
                  ? 'នៅពេលបិទ កូនបំណុលអាចចូលបំពេញព័ត៌មានស្នើសុំកម្ចីបានដោយមិនបាច់ Allow Location Services ឡើយ'
                  : 'When disabled, borrowers can fill form and apply without activating location services'}
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
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
              }`}
            >
              {requireGps ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>{language === 'kh' ? '🔒 បើកដំណើរការ (ទាមទារ GPS)' : '🔒 ON (Required)'}</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{language === 'kh' ? '🔓 បានបិទ (មិនទាមទារ GPS)' : '🔓 OFF (Optional)'}</span>
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

                    {/* Action Buttons Row */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingApp(app);
                          setIsAppModalOpen(true);
                        }}
                        className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 hover:border-amber-500/60 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                      >
                        <Camera className="w-3.5 h-3.5 text-amber-400" />
                        <span>✏️ {language === 'kh' ? 'កែប្រែ/Upload ID Card' : 'Edit / Upload ID'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setContractApp(app)}
                        className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-blue-400 border border-blue-500/30 hover:border-blue-500/60 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span>📄 {language === 'kh' ? 'លិខិតកម្ចី Digital' : 'Digital Contract'}</span>
                      </button>
                    </div>
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

                {/* Direct Action for Approved / Existing Registered Borrowers */}
                {app.status === 'approved' && (
                  <div className="pt-3 border-t border-slate-800 mt-3 shrink-0 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{language === 'kh' ? 'កូនបំណុលនេះបានចុះឈ្មោះរួចរាល់' : 'Registered Applicant Profile'}</span>
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-md font-black">
                        {language === 'kh' ? 'រួចរាល់' : 'Approved'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        showToast(
                          language === 'kh' 
                            ? `⚡ បានទាញយកទិន្នន័យ ${app.name} ស្វ័យប្រវត្តិ! កំពុងបើកផ្ទាំងបន្ថែមអ្នកខ្ចី...` 
                            : `⚡ Loaded ${app.name}'s profile! Opening add borrower page...`,
                          'success'
                        );
                        onApproveAndCreateBorrower(app);
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-98"
                    >
                      <Plus className="w-4 h-4" />
                      <span>
                        {language === 'kh' 
                          ? `⚡ បង្កើតកម្ចីថ្មីសម្រាប់ ${app.name} (មិនបាច់បំពេញឡើងវិញ)` 
                          : `⚡ Create New Loan for ${app.name}`}
                      </span>
                    </button>
                  </div>
                )}

                {/* Direct Action for Rejected Applications if lender wants to create loan anyway */}
                {app.status === 'rejected' && (
                  <div className="pt-3 border-t border-slate-800 mt-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        showToast(
                          language === 'kh' 
                            ? `⚡ ទាញយកទិន្នន័យ ${app.name} ស្វ័យប្រវត្តិ! កំពុងបើកផ្ទាំងបន្ថែមអ្នកខ្ចី...` 
                            : `⚡ Loaded ${app.name}'s profile! Opening add borrower page...`,
                          'info'
                        );
                        onApproveAndCreateBorrower(app);
                      }}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-emerald-500/30 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>
                        {language === 'kh' 
                          ? `⚡ បង្កើតកម្ចីថ្មីពីទិន្នន័យស្រាប់ (សម្រាប់ ${app.name})` 
                          : `⚡ Create Loan from Profile (${app.name})`}
                      </span>
                    </button>
                  </div>
                )}

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
                      {language === 'kh' ? 'អនុម័ត & បង្កើតកម្ចី' : 'Approve & Create Loan'}
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
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

      {/* Add / Edit Loan Application Modal */}
      <AnimatePresence>
        {isAppModalOpen && (
          <AddOrEditLoanAppModal
            editingApp={editingApp}
            currentUser={currentUser}
            onClose={() => {
              setIsAppModalOpen(false);
              setEditingApp(null);
            }}
            showToast={showToast}
          />
        )}
      </AnimatePresence>

      {/* GPS Location Viewer Modal */}
      <GPSLocationViewerModal
        isOpen={isGpsModalOpen}
        onClose={() => setIsGpsModalOpen(false)}
        locationData={selectedGpsModalData}
      />

    </div>
  );
}

interface AddOrEditLoanAppModalProps {
  editingApp: LoanApplication | null;
  currentUser: string;
  onClose: () => void;
  showToast: (message: string, type: 'success' | 'info') => void;
}

function AddOrEditLoanAppModal({
  editingApp,
  currentUser,
  onClose,
  showToast
}: AddOrEditLoanAppModalProps) {
  const { language } = useLanguage();
  const [name, setName] = useState(editingApp?.name || '');
  const [phone, setPhone] = useState(editingApp?.phone || '');
  const [amountRequested, setAmountRequested] = useState(editingApp?.amountRequested ? String(editingApp.amountRequested) : '');
  const [loanDuration, setLoanDuration] = useState(editingApp?.loanDuration ? String(editingApp.loanDuration) : '30');
  const [paymentType, setPaymentType] = useState(editingApp?.paymentType || 'daily');
  const [interestMethod, setInterestMethod] = useState(editingApp?.interestMethod || 'flat');
  const [status, setStatus] = useState<'pending' | 'approved'>(editingApp?.status === 'approved' ? 'approved' : 'pending');

  // Photo & OCR
  const [idCardPhoto, setIdCardPhoto] = useState<string>(editingApp?.idCardPhoto || '');
  const [selfiePhoto, setSelfiePhoto] = useState<string>(editingApp?.selfiePhoto || '');
  const [idCardNumber, setIdCardNumber] = useState(editingApp?.idCardNumber || '');
  const [dob, setDob] = useState(editingApp?.dob || '');
  const [address, setAddress] = useState(editingApp?.address || '');
  const [idExpiryDate, setIdExpiryDate] = useState(editingApp?.idExpiryDate || '');
  const [idExpiryStatus, setIdExpiryStatus] = useState<'valid' | 'expiring_soon' | 'expired'>(editingApp?.idExpiryStatus || 'valid');
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Live Camera Stream
  const [activeCameraType, setActiveCameraType] = useState<'id' | 'selfie' | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [cameraStream]);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setActiveCameraType(null);
  };

  const startCamera = async (type: 'id' | 'selfie') => {
    try {
      stopCamera();
      setActiveCameraType(type);
      const facingMode = type === 'id' ? { ideal: 'environment' } : 'user';
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 810 } },
        audio: false
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn("Camera failed:", err);
      alert(language === 'kh' ? 'មិនអាចបើកកាមេរ៉ាបានទេ! សូមប្រើប្រាស់ប៊ូតុងជ្រើសរើសរូបថតចេញពី Album' : 'Could not start camera! Please pick photo from gallery.');
      setActiveCameraType(null);
    }
  };

  const captureLivePhoto = (type: 'id' | 'selfie') => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (type === 'id') {
          canvas.width = 1280;
          canvas.height = 808;
          ctx.drawImage(video, 0, 0, 1280, 808);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          setIdCardPhoto(dataUrl);
          processOcr(dataUrl);
        } else {
          canvas.width = 600;
          canvas.height = 600;
          ctx.drawImage(video, 0, 0, 600, 600);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setSelfiePhoto(dataUrl);
        }
        stopCamera();
      }
    }
  };

  const processOcr = async (dataUrl: string) => {
    setIsOcrScanning(true);
    try {
      const res = await scanIdCardImage(dataUrl);
      if (res.idCardNumber) setIdCardNumber(res.idCardNumber);
      if (res.name && !name) setName(res.name);
      if (res.dob) setDob(res.dob);
      if (res.address) setAddress(res.address);
      if (res.idExpiryDate) {
        setIdExpiryDate(res.idExpiryDate);
        setIdExpiryStatus(checkExpiryStatus(res.idExpiryDate));
      }
    } catch (err) {
      console.error("OCR Failed:", err);
    } finally {
      setIsOcrScanning(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'id' | 'selfie') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (evt) => {
      const img = new Image();
      img.src = evt.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
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
        const quality = type === 'id' ? 0.90 : 0.85;
        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        if (type === 'id') {
          setIdCardPhoto(dataUrl);
          processOcr(dataUrl);
        } else {
          setSelfiePhoto(dataUrl);
        }
      };
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert(language === 'kh' ? 'សូមបញ្ចូលឈ្មោះកូនបំណុល!' : 'Please enter applicant name!');
      return;
    }
    if (!phone.trim()) {
      alert(language === 'kh' ? 'សូមបញ្ចូលលេខទូរស័ព្ទ!' : 'Please enter phone number!');
      return;
    }
    const amt = parseFloat(amountRequested);
    if (isNaN(amt) || amt <= 0) {
      alert(language === 'kh' ? 'សូមបញ្ចូលទឹកប្រាក់ស្នើសុំឱ្យបានត្រឹមត្រូវ!' : 'Please enter valid requested amount!');
      return;
    }

    setIsSaving(true);
    try {
      const targetId = editingApp ? editingApp.id : `app_${Date.now()}`;
      const updatedData: Partial<LoanApplication> = {
        id: targetId,
        name: name.trim(),
        phone: phone.trim(),
        amountRequested: amt,
        loanDuration: parseInt(loanDuration, 10) || 30,
        paymentType,
        interestMethod,
        lenderId: editingApp ? (editingApp.lenderId || currentUser) : currentUser,
        status,
        createdAt: editingApp ? editingApp.createdAt : new Date().toISOString(),
        idCardPhoto: idCardPhoto || '',
        selfiePhoto: selfiePhoto || '',
        idCardNumber: idCardNumber.trim(),
        dob: dob.trim(),
        address: address.trim(),
        idExpiryDate: idExpiryDate.trim(),
        idExpiryStatus: checkExpiryStatus(idExpiryDate.trim())
      };

      await setDoc(doc(db, 'loan_applications', targetId), updatedData, { merge: true });

      showToast(
        editingApp
          ? (language === 'kh' ? '✅ បានបច្ចុប្បន្នភាពទិន្នន័យ ID Card និងកម្ចីជោគជ័យ!' : '✅ Loan application and ID card updated!')
          : (language === 'kh' ? '✅ បានបង្កើតសំណើសុំកម្ចីថ្មី និង Upload ID Card រួចរាល់!' : '✅ Loan application created successfully!'),
        'success'
      );

      stopCamera();
      onClose();
    } catch (err) {
      console.error("Save Application Error:", err);
      alert(language === 'kh' ? 'មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ!' : 'Failed to save application!');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] my-auto"
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2 text-blue-400 font-black text-sm">
            <CreditCard className="w-5 h-5 text-blue-400" />
            <span>
              {editingApp 
                ? (language === 'kh' ? 'កែប្រែព័ត៌មានសំណើ & Upload ID Card' : 'Edit Application & ID Card') 
                : (language === 'kh' ? 'បង្កើតសំណើសុំកម្ចីថ្មី (Upload ID Card)' : 'New Loan Application (Upload ID)')}
            </span>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Scrollable */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* Section 1: Basic Applicant & Loan Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <User className="w-4 h-4 text-blue-400" />
              <span>{language === 'kh' ? '១. ព័ត៌មានអ្នកស្នើសុំ & កម្ចី' : '1. Applicant & Loan Details'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">
                  {language === 'kh' ? 'ឈ្មោះកូនបំណុល *' : 'Applicant Name *'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={language === 'kh' ? 'ឧ. សុខ ជា' : 'e.g. John Doe'}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">
                  {language === 'kh' ? 'លេខទូរស័ព្ទ *' : 'Phone Number *'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="012 345 678"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Amount Requested */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">
                  {language === 'kh' ? 'ទឹកប្រាក់ស្នើសុំ ($ USD) *' : 'Requested Amount ($ USD) *'}
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="number"
                    step="any"
                    required
                    value={amountRequested}
                    onChange={(e) => setAmountRequested(e.target.value)}
                    placeholder="100"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-black text-amber-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Loan Duration */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">
                  {language === 'kh' ? 'រយៈពេលកម្ចី (ថ្ងៃ)' : 'Loan Duration (Days)'}
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="number"
                    value={loanDuration}
                    onChange={(e) => setLoanDuration(e.target.value)}
                    placeholder="30"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Payment Type */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">
                  {language === 'kh' ? 'ប្រភេទនៃការបង់' : 'Payment Schedule'}
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="daily">{language === 'kh' ? 'បង់រៀងរាល់ថ្ងៃ (Daily)' : 'Daily'}</option>
                  <option value="weekly">{language === 'kh' ? 'បង់រៀងរាល់សប្តាហ៍ (Weekly)' : 'Weekly'}</option>
                  <option value="monthly">{language === 'kh' ? 'បង់រៀងរាល់ខែ (Monthly)' : 'Monthly'}</option>
                  <option value="every_2_days">{language === 'kh' ? 'បង់ 2 ថ្ងៃម្តង (Every 2 Days)' : 'Every 2 Days'}</option>
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">
                  {language === 'kh' ? 'ស្ថានភាពសំណើ' : 'Application Status'}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'pending' | 'approved')}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="pending">⏳ {language === 'kh' ? 'រង់ចាំការពិនិត្យ (Pending)' : 'Pending'}</option>
                  <option value="approved">✅ {language === 'kh' ? 'បានអនុម័ត (Approved)' : 'Approved'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: ID Card Upload & Camera & OCR */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>{language === 'kh' ? '២. អត្តសញ្ញាណប័ណ្ណ (National ID Card)' : '2. National ID Card & OCR'}</span>
              </div>
              {isOcrScanning && (
                <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  {language === 'kh' ? 'កំពុងស្កេនទិន្នន័យ OCR...' : 'OCR Scanning...'}
                </span>
              )}
            </h4>

            {/* Live Camera Stream Display */}
            {activeCameraType === 'id' && (
              <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 bg-black aspect-video flex flex-col items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute bottom-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => captureLivePhoto('id')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{language === 'kh' ? 'ថតយករូបភាព' : 'Capture ID Photo'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                  >
                    {language === 'kh' ? 'បិទកាមេរ៉ា' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}

            {/* ID Card Photo Preview & Upload Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="relative border-2 border-dashed border-slate-800 hover:border-blue-500/50 bg-slate-950 rounded-2xl p-3 flex flex-col items-center justify-center min-h-[140px]">
                  {idCardPhoto ? (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden group">
                      <img src={idCardPhoto} alt="ID Preview" className="w-full h-full object-contain bg-slate-900" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <label className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl cursor-pointer text-xs font-bold flex items-center gap-1">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{language === 'kh' ? 'ប្តូររូប' : 'Change'}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'id')} />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-2 py-2">
                      <CreditCard className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-400 font-bold">
                        {language === 'kh' ? 'មិនទាន់មានរូបអត្តសញ្ញាណប័ណ្ណ' : 'No ID Card Photo'}
                      </p>
                      <div className="flex gap-2 justify-center">
                        <label className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1 shadow-md">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{language === 'kh' ? 'Upload រូបភាព' : 'Upload File'}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'id')} />
                        </label>
                        <button
                          type="button"
                          onClick={() => startCamera('id')}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1 border border-slate-700"
                        >
                          <Camera className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{language === 'kh' ? 'ថតផ្ទាល់' : 'Live Camera'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {idCardPhoto && (
                  <button
                    type="button"
                    onClick={() => processOcr(idCardPhoto)}
                    disabled={isOcrScanning}
                    className="w-full py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{language === 'kh' ? 'ស្កេនទិន្នន័យ ID Card ដោយ AI' : 'Re-scan ID Card with AI'}</span>
                  </button>
                )}
              </div>

              {/* OCR Extracted Input Fields */}
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    {language === 'kh' ? 'លេខអត្តសញ្ញាណប័ណ្ណ' : 'ID Card Number'}
                  </label>
                  <input
                    type="text"
                    value={idCardNumber}
                    onChange={(e) => setIdCardNumber(e.target.value)}
                    placeholder="123456789"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    {language === 'kh' ? 'ថ្ងៃខែឆ្នាំកំណើត' : 'Date of Birth'}
                  </label>
                  <input
                    type="text"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    placeholder="22.06.1995"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>{language === 'kh' ? 'ថ្ងៃផុតកំណត់ ID Card' : 'ID Expiry Date'}</span>
                    {idExpiryDate && (
                      <span className={`text-[10px] font-bold ${
                        idExpiryStatus === 'expired' ? 'text-rose-400' :
                        idExpiryStatus === 'expiring_soon' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {idExpiryStatus === 'expired' ? '🔴 Expired' :
                         idExpiryStatus === 'expiring_soon' ? '🟡 Expiring Soon' : '🟢 Valid'}
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={idExpiryDate}
                    onChange={(e) => {
                      setIdExpiryDate(e.target.value);
                      setIdExpiryStatus(checkExpiryStatus(e.target.value));
                    }}
                    placeholder="22.06.2030"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    {language === 'kh' ? 'អាសយដ្ឋាន' : 'Address'}
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={language === 'kh' ? 'ភូមិ/ឃុំ/ស្រុក/ខេត្ត' : 'Village/Commune/District'}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Selfie / Face Photo */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <User className="w-4 h-4 text-purple-400" />
              <span>{language === 'kh' ? '៣. រូបថតផ្ទៃមុខ (Selfie Face Photo)' : '3. Selfie Face Photo'}</span>
            </h4>

            {activeCameraType === 'selfie' && (
              <div className="relative rounded-2xl overflow-hidden border-2 border-purple-500 bg-black aspect-square max-w-xs mx-auto flex flex-col items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                <div className="absolute bottom-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => captureLivePhoto('selfie')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{language === 'kh' ? 'ថតយករូបថត' : 'Capture Selfie'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                  >
                    {language === 'kh' ? 'បិទ' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}

            <div className="border-2 border-dashed border-slate-800 bg-slate-950 rounded-2xl p-3 flex flex-col items-center justify-center min-h-[120px]">
              {selfiePhoto ? (
                <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-purple-500 group">
                  <img src={selfiePhoto} alt="Selfie Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <label className="p-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg cursor-pointer text-[10px] font-bold">
                      {language === 'kh' ? 'ប្តូររូប' : 'Change'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'selfie')} />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2 py-2">
                  <User className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-bold">
                    {language === 'kh' ? 'មិនទាន់មានរូបថតផ្ទៃមុខ' : 'No Selfie Photo'}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <label className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1 shadow-md">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{language === 'kh' ? 'Upload រូបថត' : 'Upload File'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'selfie')} />
                    </label>
                    <button
                      type="button"
                      onClick={() => startCamera('selfie')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1 border border-slate-700"
                    >
                      <Camera className="w-3.5 h-3.5 text-purple-400" />
                      <span>{language === 'kh' ? 'ថតផ្ទាល់' : 'Live Camera'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {/* Modal Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              {language === 'kh' ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl transition shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{language === 'kh' ? 'កំពុងរក្សាទុក...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>
                    {editingApp 
                      ? (language === 'kh' ? 'រក្សាទុកការកែប្រែ' : 'Save Changes') 
                      : (language === 'kh' ? 'បង្កើតសំណើកម្ចីថ្មី' : 'Create Loan Request')}
                  </span>
                </>
              )}
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
