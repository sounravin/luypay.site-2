import React, { useState } from 'react';
import { 
  Calculator, 
  Search, 
  Plus, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  FileText, 
  Sparkles, 
  ShieldAlert, 
  ChevronRight,
  TrendingUp,
  UserCheck,
  AlertTriangle,
  RotateCcw,
  Printer,
  Calendar,
  Phone,
  Eye,
  Edit3
} from 'lucide-react';
import { Borrower } from '../types';

interface InterestOnlyManagementPanelProps {
  borrowers: Borrower[];
  currentUser: string;
  language: 'kh' | 'en';
  onSelectBorrower: (id: string) => void;
  onAddNewInterestOnly: () => void;
  onUpdateBorrower: (updatedBorrower: Borrower) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const InterestOnlyManagementPanel: React.FC<InterestOnlyManagementPanelProps> = ({
  borrowers,
  currentUser,
  language,
  onSelectBorrower,
  onAddNewInterestOnly,
  onUpdateBorrower,
  showToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'late'>('all');
  const [editingBorrower, setEditingBorrower] = useState<Borrower | null>(null);
  const [editReason, setEditReason] = useState('');
  const [editNote, setEditNote] = useState('');

  // Helper to determine if a borrower is in "Interest-Only / Hardship" status and belongs to currentUser
  const isInterestOnlyBorrower = (b: Borrower) => {
    const bLender = ((b as any).createdBy || (b as any).lenderId || (b as any).lenderUsername || b.userId || '').toLowerCase();
    const userLower = (currentUser || 'sounravin').toLowerCase();
    const matchesAccount = !bLender || bLender === userLower;

    const isHardship = (
      b.loanType === 'hardship_settlement' ||
      b.interestOnlyExtension === true ||
      (b.notes && b.notes.includes('សុំឡើងតែដើម'))
    );

    return matchesAccount && isHardship;
  };

  // Filter interest-only borrowers
  const interestOnlyList = borrowers.filter(isInterestOnlyBorrower);

  // Filtered by status and search query
  const filteredList = interestOnlyList.filter((b) => {
    const totalPaid = Array.isArray(b.payments) ? b.payments.reduce((sum, p) => sum + (p?.amount || 0), 0) : 0;
    const isCompleted = totalPaid >= b.totalToPay;

    if (statusFilter === 'active' && (b.isArchived || isCompleted)) return false;
    if (statusFilter === 'completed' && (b.isArchived || !isCompleted)) return false;
    if (statusFilter === 'late' && b.statusTag !== 'late') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = b.name.toLowerCase().includes(q);
      const matchPhone = b.phone?.includes(q) || false;
      const matchNote = b.notes?.toLowerCase().includes(q) || b.interestOnlyExtensionNote?.toLowerCase().includes(q);
      return matchName || matchPhone || matchNote;
    }

    return true;
  });

  // Calculate Key Performance Indicators (KPIs)
  const totalCount = interestOnlyList.length;
  const activeCount = interestOnlyList.filter((b) => {
    const paid = Array.isArray(b.payments) ? b.payments.reduce((sum, p) => sum + (p?.amount || 0), 0) : 0;
    return !b.isArchived && paid < b.totalToPay;
  }).length;
  const completedCount = interestOnlyList.filter((b) => {
    const paid = Array.isArray(b.payments) ? b.payments.reduce((sum, p) => sum + (p?.amount || 0), 0) : 0;
    return paid >= b.totalToPay;
  }).length;

  // Currency breakdown
  const totalPrincipalUSD = interestOnlyList
    .filter((b) => b.currency !== 'KHR')
    .reduce((sum, b) => sum + (b.principal || 0), 0);

  const totalCollectedUSD = interestOnlyList
    .filter((b) => b.currency !== 'KHR')
    .reduce((sum, b) => {
      const paid = Array.isArray(b.payments) ? b.payments.reduce((pSum, p) => pSum + (p?.amount || 0), 0) : 0;
      return sum + paid;
    }, 0);

  const pendingUSD = Math.max(0, totalPrincipalUSD - totalCollectedUSD);

  const totalPrincipalKHR = interestOnlyList
    .filter((b) => b.currency === 'KHR')
    .reduce((sum, b) => sum + (b.principal || 0), 0);

  const totalCollectedKHR = interestOnlyList
    .filter((b) => b.currency === 'KHR')
    .reduce((sum, b) => {
      const paid = Array.isArray(b.payments) ? b.payments.reduce((pSum, p) => pSum + (p?.amount || 0), 0) : 0;
      return sum + paid;
    }, 0);

  const pendingKHR = Math.max(0, totalPrincipalKHR - totalCollectedKHR);

  const handleOpenEditModal = (b: Borrower) => {
    setEditingBorrower(b);
    setEditReason(b.interestOnlyExtensionReason || 'គ្រួសារជួបការលំបាក');
    setEditNote(b.interestOnlyExtensionNote || b.notes || '');
  };

  const handleSaveEdit = () => {
    if (!editingBorrower) return;

    const updated: Borrower = {
      ...editingBorrower,
      interestOnlyExtension: true,
      interestOnlyExtensionReason: editReason,
      interestOnlyExtensionNote: editNote,
      loanType: 'hardship_settlement',
    };

    onUpdateBorrower(updated);
    setEditingBorrower(null);
    showToast(
      language === 'kh'
        ? 'បានបច្ចុប្បន្នភាពព័ត៌មានសុំឡើងដើមជោគជ័យ!'
        : 'Interest-only details updated successfully!',
      'success'
    );
  };

  const handleSwitchToRegularLoan = (b: Borrower) => {
    if (
      confirm(
        language === 'kh'
          ? `តើអ្នកពិតជាចង់ផ្ទេរកូនបំណុល "${b.name}" ត្រឡប់ទៅជាប្រព័ន្ធកម្ចីធម្មតាវិញមែនទេ?`
          : `Switch borrower "${b.name}" back to regular loan system?`
      )
    ) {
      const updated: Borrower = {
        ...b,
        interestOnlyExtension: false,
        loanType: 'luy_chok',
      };
      onUpdateBorrower(updated);
      showToast(
        language === 'kh'
          ? `បានផ្ទេរ "${b.name}" ទៅកាន់កម្ចីធម្មតាវិញរួចរាល់!`
          : `Transferred "${b.name}" back to regular loan system!`,
        'info'
      );
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-amber-500/30">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-64 h-64 rounded-full bg-black/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-xs font-black tracking-wide text-amber-100">
              <Calculator className="w-3.5 h-3.5 text-amber-200" />
              <span>
                {language === 'kh'
                  ? 'ប្រព័ន្ធគ្រប់គ្រងសុំឡើងតែដើម ដាច់ដោយឡែក (0% Interest Dashboard)'
                  : 'Separate Interest-Only Management System'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {language === 'kh'
                ? 'ផ្ទាំងគ្រប់គ្រងប្រព័ន្ធគណនារយៈពេលសុំឡើងតែដើម'
                : 'Interest-Only Borrower Dashboard'}
            </h1>

            <p className="text-xs sm:text-sm text-amber-100 font-bold leading-relaxed">
              {language === 'kh'
                ? 'គ្រប់គ្រង និងតាមដានរាល់គណនីកូនបំណុលដែលបានស្នើសុំបង់តែប្រាក់ដើម (ការប្រាក់ 0%) ដោយស្វ័យប្រវត្ត។ ទិន្នន័យត្រូវបានបំបែកដាច់ដោយឡែកពីកម្ចីធម្មតាដើម្បីភាពងាយស្រួលក្នុងការគ្រប់គ្រង។'
                : 'Manage and track all borrowers with 0% interest rate principal repayment agreements separately from standard loans.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={onAddNewInterestOnly}
              className="px-5 py-3.5 bg-white hover:bg-amber-50 text-amber-950 font-black text-xs rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-white/80 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 text-amber-700" />
              <span>
                {language === 'kh'
                  ? '➕ បន្ថែមអ្នកខ្ចីសុំឡើងដើមថ្មី'
                  : 'Add Interest-Only Borrower'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Interest-Only Borrowers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {language === 'kh' ? 'កូនបំណុលសុំឡើងដើម' : 'Total Interest-Only'}
            </span>
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {totalCount} <span className="text-xs text-slate-500 font-bold">នាក់</span>
            </p>
            <div className="flex items-center gap-2 mt-1 text-[11px] font-extrabold text-slate-500">
              <span className="text-emerald-600 dark:text-emerald-400">🟢 {activeCount} កំពុងបង់</span>
              <span>•</span>
              <span className="text-blue-600 dark:text-blue-400">✅ {completedCount} បង់ចប់</span>
            </div>
          </div>
        </div>

        {/* Total Principal To Collect */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {language === 'kh' ? 'ប្រាក់ដើមត្រូវប្រមូល' : 'Total Principal'}
            </span>
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xl font-black text-slate-900 dark:text-white">
              ${totalPrincipalUSD.toLocaleString()}
            </p>
            {totalPrincipalKHR > 0 && (
              <p className="text-xs font-bold text-slate-500 mt-0.5">
                ៛{totalPrincipalKHR.toLocaleString()}
              </p>
            )}
            <span className="inline-block mt-1 text-[10px] font-black text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md">
              0% Interest
            </span>
          </div>
        </div>

        {/* Principal Collected */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {language === 'kh' ? 'ប្រាក់ដើមប្រមូលបាន' : 'Collected Principal'}
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              ${totalCollectedUSD.toLocaleString()}
            </p>
            {totalCollectedKHR > 0 && (
              <p className="text-xs font-bold text-slate-500 mt-0.5">
                ៛{totalCollectedKHR.toLocaleString()}
              </p>
            )}
            <p className="text-[11px] font-extrabold text-slate-500 mt-1">
              {totalPrincipalUSD > 0
                ? `${Math.round((totalCollectedUSD / totalPrincipalUSD) * 100)}% នៃប្រាក់ដើមសរុប`
                : '0%'}
            </p>
          </div>
        </div>

        {/* Pending Principal */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {language === 'kh' ? 'ប្រាក់ដើមនៅសល់' : 'Pending Principal'}
            </span>
            <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xl font-black text-orange-600 dark:text-orange-400">
              ${pendingUSD.toLocaleString()}
            </p>
            {pendingKHR > 0 && (
              <p className="text-xs font-bold text-slate-500 mt-0.5">
                ៛{pendingKHR.toLocaleString()}
              </p>
            )}
            <p className="text-[11px] font-extrabold text-slate-500 mt-1">
              {language === 'kh' ? 'ត្រូវបង់បន្តតាមកាលវិភាគ' : 'Scheduled to collect'}
            </p>
          </div>
        </div>
      </div>

      {/* Action and Filter Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 text-xs font-black rounded-2xl transition cursor-pointer flex-1 sm:flex-initial text-center ${
              statusFilter === 'all'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            📋 ទាំងអស់ ({interestOnlyList.length})
          </button>

          <button
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-2 text-xs font-black rounded-2xl transition cursor-pointer flex-1 sm:flex-initial text-center ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            🟢 កំពុងបង់ ({activeCount})
          </button>

          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 text-xs font-black rounded-2xl transition cursor-pointer flex-1 sm:flex-initial text-center ${
              statusFilter === 'completed'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            ✅ បានបង់ចប់ ({completedCount})
          </button>

          <button
            onClick={() => setStatusFilter('late')}
            className={`px-4 py-2 text-xs font-black rounded-2xl transition cursor-pointer flex-1 sm:flex-initial text-center ${
              statusFilter === 'late'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            🔴 យឺតយ៉ាវ ({interestOnlyList.filter((b) => b.statusTag === 'late').length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'kh'
                ? 'ស្វែងរកឈ្មោះ លេខទូរស័ព្ទ ឬមូលហេតុ...'
                : 'Search borrower name, phone or reason...'
            }
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>
      </div>

      {/* Main Borrowers List Grid */}
      {filteredList.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto shadow-sm my-6">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full flex items-center justify-center text-3xl mx-auto">
            🧮
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {language === 'kh'
                ? 'មិនទាន់មានទិន្នន័យកូនបំណុលសុំឡើងដើមឡើយ'
                : 'No Interest-Only Borrowers Found'}
            </h3>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
              {language === 'kh'
                ? 'លោកអ្នកអាចចុចប៊ូតុង "បន្ថែមអ្នកខ្ចីសុំឡើងដើមថ្មី" ដើម្បីបង្កើតគណនីបង់តែប្រាក់ដើម (ការប្រាក់ 0%) ដំបូង។'
                : 'Click "Add Interest-Only Borrower" to create your first 0% interest agreement.'}
            </p>
          </div>
          <button
            onClick={onAddNewInterestOnly}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-2xl shadow-md transition cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'kh' ? 'បន្ថែមអ្នកខ្ចីសុំឡើងដើមថ្មី' : 'Add First Interest-Only Borrower'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((b) => {
            const totalPaid = Array.isArray(b.payments) ? b.payments.reduce((sum, p) => sum + (p?.amount || 0), 0) : 0;
            const isCompleted = totalPaid >= b.totalToPay;
            const progressPercent = Math.min(100, Math.round((totalPaid / (b.totalToPay || 1)) * 100));

            return (
              <div
                key={b.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-200 space-y-4 flex flex-col justify-between relative group overflow-hidden"
              >
                {/* Top status bar */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {b.profilePhoto ? (
                      <img
                        src={b.profilePhoto}
                        alt={b.name}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-500/30 shadow-xs"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 font-black flex items-center justify-center text-lg">
                        {b.name.charAt(0)}
                      </div>
                    )}

                    <div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{b.name}</span>
                        {b.shortId && (
                          <span className="text-[10px] font-black text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                            #{b.shortId}
                          </span>
                        )}
                      </h4>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-amber-600" />
                        <span>{b.phone || 'គ្មានលេខទូរស័ព្ទ'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300">
                      🧮 សុំឡើងដើម 0%
                    </span>
                    {isCompleted ? (
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        ✅ បានបង់ចប់
                      </span>
                    ) : b.statusTag === 'late' ? (
                      <span className="text-[10px] font-black text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-md animate-pulse">
                        🔴 យឺតយ៉ាវ
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-md">
                        🟢 កំពុងបង់
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount and Progress */}
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-3.5 space-y-2">
                  <div className="flex justify-between items-baseline text-xs font-black">
                    <span className="text-slate-500 dark:text-slate-400">ប្រាក់ដើមត្រូវសង៖</span>
                    <span className="text-slate-900 dark:text-white text-sm">
                      {b.currency === 'KHR' ? '៛' : '$'}{b.principal?.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline text-xs font-bold">
                    <span className="text-emerald-600 dark:text-emerald-400">បានបង់រួច៖</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                      {b.currency === 'KHR' ? '៛' : '$'}{totalPaid.toLocaleString()}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1 pt-1">
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-black text-slate-400">
                      <span>{progressPercent}% បង់រួច</span>
                      <span>នៅសល់ {b.currency === 'KHR' ? '៛' : '$'}{Math.max(0, b.totalToPay - totalPaid).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Reason & Notes */}
                {(b.interestOnlyExtensionReason || b.interestOnlyExtensionNote || b.notes) && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-3 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-extrabold text-amber-900 dark:text-amber-300">
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                      <span>មូលហេតុសុំឡើងដើម៖</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed text-[11px]">
                      {b.interestOnlyExtensionReason && (
                        <span className="font-bold text-amber-800 dark:text-amber-400 mr-1">
                          [{b.interestOnlyExtensionReason}]
                        </span>
                      )}
                      {b.interestOnlyExtensionNote || b.notes}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => onSelectBorrower(b.id)}
                    className="py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>មើល/កត់ត្រា</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(b)}
                    className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                    <span>កែប្រែ</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Extension Modal */}
      {editingBorrower && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-600" />
                <span>កែប្រែព័ត៌មានសុំឡើងដើម៖ {editingBorrower.name}</span>
              </h3>
              <button
                onClick={() => setEditingBorrower(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  លក្ខខណ្ឌ/មូលហេតុសុំឡើងដើម៖
                </label>
                <select
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white"
                >
                  <option value="គ្រួសារជួបការលំបាក">គ្រួសារជួបការលំបាក (Family Hardship)</option>
                  <option value="អាជីវកម្មថយចុះ">អាជីវកម្មថយចុះ (Business Decline)</option>
                  <option value="សុំយកបន្ថែមថ្មីលើកម្ចីចាស់">សុំយកបន្ថែមថ្មីលើកម្ចីចាស់ (Refinance Top-Up)</option>
                  <option value="ជំងឺ/ព្យាបាល">ជំងឺ/ព្យាបាល (Medical Expenses)</option>
                  <option value="ការយល់ព្រមពិសេស">ការយល់ព្រមពិសេសពីម្ចាស់បំណុល (Special Lender Approval)</option>
                </select>
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  ចំណាំបន្ថែម (Notes):
                </label>
                <textarea
                  rows={3}
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="បញ្ចូលព័ត៌មានបន្ថែមអំពីកិច្ចព្រមព្រៀងសុំឡើងដើម..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-medium text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleSaveEdit}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-2xl shadow-md transition cursor-pointer"
              >
                💾 រក្សាទុកការផ្លាស់ប្តូរ
              </button>

              <button
                onClick={() => handleSwitchToRegularLoan(editingBorrower)}
                className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 font-extrabold text-xs rounded-2xl border border-rose-500/30 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ផ្ទេរទៅប្រព័ន្ធកម្ចីធម្មតាវិញ</span>
              </button>

              <button
                onClick={() => setEditingBorrower(null)}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-2xl hover:bg-slate-200 cursor-pointer"
              >
                បោះបង់
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
