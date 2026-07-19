import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { LoanApplication } from '../types';
import { useLanguage } from '../i18n';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Check, X, FileText, Phone, DollarSign, Calendar, Copy, 
  ExternalLink, Eye, AlertCircle, CheckCircle, ChevronDown, 
  Trash2, Search, Sparkles, UserCheck, ShieldAlert, RefreshCw 
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal previews
  const [selectedPhoto, setSelectedPhoto] = useState<{ title: string; src: string } | null>(null);
  const [rejectingApp, setRejectingApp] = useState<LoanApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'loan_applications'),
      where('lenderId', '==', currentUser)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: LoanApplication[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as LoanApplication);
      });
      // Sort by newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setApplications(list);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to loan applications:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

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

  const filteredApps = applications.filter((app) => {
    // Tab filter
    if (activeTab !== 'all' && app.status !== activeTab) return false;
    
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = app.name.toLowerCase().includes(q);
      const matchPhone = app.phone.includes(q);
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

      {/* Tabs and Search Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
        
        {/* Tabs Row */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800/80 gap-1 w-full md:w-auto overflow-x-auto shrink-0">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => {
            const count = applications.filter(a => tab === 'all' ? true : a.status === tab).length;
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
                    <div className="space-y-1">
                      <h3 className="text-base font-black text-white tracking-tight">{app.name}</h3>
                      <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-blue-400" />
                        {app.phone}
                      </p>
                    </div>
                    {getStatusBadge(app.status)}
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
                  </div>

                  {/* Attachment Images Previews */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* ID Card image preview */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        📄 {language === 'kh' ? 'អត្តសញ្ញាណប័ណ្ណ' : 'National ID Card'}
                      </span>
                      <div className="relative h-24 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 group">
                        <img src={app.idCardPhoto} alt="ID Card" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setSelectedPhoto({ title: `${app.name} - ID Card`, src: app.idCardPhoto })}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-extrabold text-slate-100 gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {language === 'kh' ? 'មើលធំ' : 'View'}
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

    </div>
  );
}
