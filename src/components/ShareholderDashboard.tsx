import React, { useState, useEffect } from 'react';
import { Borrower, Shareholder } from '../types';
import { calculateShareholderStats, calculatePaymentInterestSplit } from '../utils/shareholderUtils';
import BorrowerDetail from './BorrowerDetail';

interface ShareholderDashboardProps {
  shareholder: Shareholder;
  allShareholders?: Shareholder[];
  borrowers: Borrower[];
  language: 'kh' | 'en';
  onBackToMain?: () => void;
  onEditBorrower?: (borrowerId: string, updatedFields: Partial<Borrower>) => Promise<void> | void;
}

// Web Audio API synthesized audio chime alert
function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.15); // A5
    gain2.gain.setValueAtTime(0.35, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.6);
  } catch (e) {
    // Audio context may require user interaction gesture
  }
}

export default function ShareholderDashboard({
  shareholder: initialShareholder,
  allShareholders = [],
  borrowers,
  language,
  onBackToMain,
  onEditBorrower,
}: ShareholderDashboardProps) {
  const [activeShareholder, setActiveShareholder] = useState<Shareholder>(initialShareholder);

  // Sync activeShareholder if initialShareholder prop updates
  useEffect(() => {
    if (initialShareholder && initialShareholder.id !== activeShareholder.id) {
      setActiveShareholder(initialShareholder);
    }
  }, [initialShareholder]);

  const listToSearch = allShareholders.length > 0 ? allShareholders : [activeShareholder];

  // Login auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const authKey = `luypay_partner_auth_${initialShareholder.id}`;
    if (localStorage.getItem(authKey) === 'true') return true;
    const globalAuth = localStorage.getItem('luypay_authenticated_partner_id');
    return !!globalAuth && listToSearch.some((s) => s.id === globalAuth);
  });

  const [inputUsername, setInputUsername] = useState(initialShareholder.username || 'admin');
  const [inputPassword, setInputPassword] = useState(initialShareholder.password || 'admin');
  const [loginError, setLoginError] = useState('');

  // Mobile App active tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'borrowers'>('dashboard');

  // Change Password state
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search query for borrowers
  const [searchQuery, setSearchQuery] = useState('');

  // Selected borrower for read-only profile detail
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null);

  // iOS PWA Add to Home Screen Modal state
  const [showIosInstallModal, setShowIosInstallModal] = useState<boolean>(false);
  const [copiedLinkToast, setCopiedLinkToast] = useState<boolean>(false);

  const handleCopyPortalLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLinkToast(true);
      setTimeout(() => setCopiedLinkToast(false), 3000);
    } catch (e) {
      alert(language === 'kh' ? 'បានចម្លង Link ជោគជ័យ!' : 'Portal Link copied successfully!');
    }
  };

  const handleNotificationClick = (borrowerId?: string) => {
    if (!borrowerId) return;
    const target = borrowers.find((b) => b.id === borrowerId);
    if (target) {
      setSelectedBorrower(target);
      playNotificationChime();
    }
  };

  const shareholder = activeShareholder;
  const stats = calculateShareholderStats(shareholder, borrowers);
  const linkedBorrowers = borrowers.filter(
    (b) =>
      (b.shareholderId && b.shareholderId === shareholder.id) ||
      (b.shareholderName && shareholder.name && b.shareholderName.trim().toLowerCase() === shareholder.name.trim().toLowerCase())
  );

  // Collect notifications for linked borrowers & payments
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);

  const paymentHistory: Array<{
    id: string;
    borrowerName: string;
    borrowerId: string;
    date: string;
    amount: number;
    partnerShare: number;
    mainLenderShare: number;
    actualInterest: number;
  }> = [];

  linkedBorrowers.forEach((b) => {
    (b.payments || []).forEach((p) => {
      const split = calculatePaymentInterestSplit(b, p);
      paymentHistory.push({
        id: `${b.id}_${p.id}`,
        borrowerName: b.name,
        borrowerId: b.id,
        date: p.date,
        amount: p.amount,
        partnerShare: split.partnerShare,
        mainLenderShare: split.mainLenderShare,
        actualInterest: split.actualInterest,
      });
    });
  });

  paymentHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Generate notifications list
  const notificationList: Array<{
    id: string;
    borrowerId?: string;
    type: 'payment' | 'new_borrower';
    title: string;
    body: string;
    time: string;
    amount?: number;
  }> = [];

  linkedBorrowers.forEach((b) => {
    notificationList.push({
      id: `borrower_${b.id}`,
      borrowerId: b.id,
      type: 'new_borrower',
      title: language === 'kh' ? 'កូនបំណុលថ្មីត្រូវបានភ្ជាប់' : 'New Linked Borrower',
      body: language === 'kh'
        ? `កូនបំណុល "${b.name}" ខ្ចីប្រាក់ចំនួន $${b.principal.toLocaleString()} (ការប្រាក់ $${(b.totalToPay - b.principal).toLocaleString()})`
        : `Borrower "${b.name}" principal $${b.principal.toLocaleString()} (Interest $${(b.totalToPay - b.principal).toLocaleString()})`,
      time: b.loanDate || '—',
      amount: b.principal,
    });
  });

  paymentHistory.forEach((p) => {
    notificationList.push({
      id: `pay_${p.id}`,
      borrowerId: p.borrowerId,
      type: 'payment',
      title: language === 'kh' ? 'កូនបំណុលបានបង់ប្រាក់' : 'Payment Received',
      body: language === 'kh'
        ? `កូនបំណុល "${p.borrowerName}" បានបង់ប្រាក់ចំនួន $${p.amount.toFixed(2)} (ចំណូលភាគហ៊ុនទទួលបាន +$${p.partnerShare.toFixed(2)})`
        : `Borrower "${p.borrowerName}" paid $${p.amount.toFixed(2)} (Partner Share +$${p.partnerShare.toFixed(2)})`,
      time: p.date,
      amount: p.partnerShare,
    });
  });

  notificationList.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const uInput = inputUsername.trim().toLowerCase();
    const pInput = inputPassword.trim();

    const matched = listToSearch.find((s) => {
      const u = (s.username || 'admin').trim().toLowerCase();
      const p = (s.password || 'admin').trim();
      return u === uInput && p === pInput;
    });

    if (matched) {
      setActiveShareholder(matched);
      localStorage.setItem(`luypay_partner_auth_${matched.id}`, 'true');
      localStorage.setItem('luypay_authenticated_partner_id', matched.id);
      setIsAuthenticated(true);
      setLoginError('');
      playNotificationChime();
    } else {
      setLoginError(
        language === 'kh'
          ? 'ឈ្មោះគណនី ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ! (សូមពិនិត្យមើល Username និង Password ដែលម្ចាស់បំណុលបង្កើតឱ្យ)'
          : 'Invalid username or password! Please check the credentials created for your partner account.'
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(`luypay_partner_auth_${shareholder.id}`);
    localStorage.removeItem('luypay_authenticated_partner_id');
    setIsAuthenticated(false);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    const currentPass = shareholder.password || 'admin';
    if (currentPasswordInput.trim() !== currentPass.trim()) {
      setPasswordMsg({
        type: 'error',
        text: language === 'kh' ? 'ពាក្យសម្ងាត់ចាស់មិនត្រឹមត្រូវទេ!' : 'Current password is incorrect!',
      });
      return;
    }

    if (newPasswordInput.trim().length < 3) {
      setPasswordMsg({
        type: 'error',
        text: language === 'kh' ? 'ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោចណាស់ 3 តួអក្សរ!' : 'New password must be at least 3 characters!',
      });
      return;
    }

    if (newPasswordInput.trim() !== confirmPasswordInput.trim()) {
      setPasswordMsg({
        type: 'error',
        text: language === 'kh' ? 'ពាក្យសម្ងាត់ថ្មី និងបញ្ជាក់ពាក្យសម្ងាត់មិនត្រូវគ្នាតែ!' : 'New passwords do not match!',
      });
      return;
    }

    const updatedSh: Shareholder = {
      ...shareholder,
      password: newPasswordInput.trim(),
    };

    setActiveShareholder(updatedSh);

    try {
      const rawGlobal = localStorage.getItem('luypay_shareholders_global');
      if (rawGlobal) {
        const list = JSON.parse(rawGlobal);
        const updatedList = list.map((s: any) => (s.id === updatedSh.id ? { ...s, password: updatedSh.password } : s));
        localStorage.setItem('luypay_shareholders_global', JSON.stringify(updatedList));
      }
    } catch (err) {
      console.error('Error saving new password:', err);
    }

    setPasswordMsg({
      type: 'success',
      text: language === 'kh' ? 'បានផ្លាស់ប្ដូរពាក្យសម្ងាត់ដោយជោគជ័យ!' : 'Password updated successfully!',
    });

    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    playNotificationChime();
  };

  // Filter borrowers by search
  const filteredBorrowers = linkedBorrowers.filter((b) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return b.name.toLowerCase().includes(q) || (b.phone && b.phone.includes(q));
  });

  // If not authenticated, show Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-inner text-emerald-400 overflow-hidden">
              {shareholder.profilePhoto ? (
                <img src={shareholder.profilePhoto} alt={shareholder.name} className="w-full h-full object-cover" />
              ) : (
                '🤝'
              )}
            </div>
            <h2 className="text-2xl font-black text-white">
              {language === 'kh' ? 'ចូលមើលគណនីភាគហ៊ុន' : 'Shareholder Partner Portal'}
            </h2>
            <p className="text-xs font-bold text-slate-400">
              {shareholder.name} ({language === 'kh' ? `ដើមទុន $${shareholder.capitalUSD.toLocaleString()}` : `Capital $${shareholder.capitalUSD.toLocaleString()}`})
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-bold text-center">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
                {language === 'kh' ? 'ឈ្មោះគណនី (Username)' : 'Username'}
              </label>
              <input
                type="text"
                required
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-sm font-bold text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
                {language === 'kh' ? 'ពាក្យសម្ងាត់ (Password)' : 'Password'}
              </label>
              <input
                type="password"
                required
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                placeholder="admin"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-sm font-bold text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-400 font-bold text-center leading-relaxed">
              💡 {language === 'kh'
                ? `សូមបញ្ចូល Username (${shareholder.username || 'admin'}) និង Password ដែលម្ចាស់បំណុលផ្តល់ឱ្យ`
                : `Enter Username (${shareholder.username || 'admin'}) and Password assigned by main lender`}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl transition shadow-lg shadow-emerald-500/20 cursor-pointer text-sm"
            >
              🔐 {language === 'kh' ? 'ចូលប្រព័ន្ធ (Login)' : 'Log In'}
            </button>
          </form>

          {onBackToMain && (
            <button
              onClick={onBackToMain}
              className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer text-center"
            >
              ← {language === 'kh' ? 'ត្រឡប់ទៅកម្មវិធីដើម' : 'Back to Main Ledger'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // If viewing read-only borrower profile
  if (selectedBorrower) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 space-y-4">
        <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-amber-300">
          <div className="flex items-center gap-2">
            <span className="text-xl">👁️</span>
            <div>
              <p className="text-xs font-black uppercase tracking-wider">
                {language === 'kh' ? 'ផ្ទាំងមើលព័ត៌មានកូនបំណុល (Read-Only Shareholder View)' : 'Read-Only Borrower Profile View'}
              </p>
              <p className="text-[11px] text-amber-300/80 font-bold">
                {language === 'kh' ? 'លោកអ្នកអាចមើលទិន្នន័យរបាយការណ៍ និងប្រាក់ចំណូលបាន តែមិនអាចកែប្រែបានឡើយ' : 'You can view reports and income details, but cannot edit fields.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedBorrower(null)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition border border-amber-500/30 cursor-pointer"
          >
            ← {language === 'kh' ? 'ត្រឡប់ទៅ Dashboard ភាគហ៊ុន' : 'Back to Partner Dashboard'}
          </button>
        </div>

        <BorrowerDetail
          borrower={selectedBorrower}
          onBack={() => setSelectedBorrower(null)}
          onDeleteBorrower={() => {}}
          onEditBorrower={onEditBorrower}
          isReadOnlyShareholder={true}
          shareholders={[shareholder]}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 sm:pb-8 max-w-5xl mx-auto space-y-4 sm:space-y-6 p-3 sm:p-6">
      
      {/* Top Mobile App Bar / Portal Header */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-2xl shadow-inner overflow-hidden shrink-0">
            {shareholder.profilePhoto ? (
              <img src={shareholder.profilePhoto} alt={shareholder.name} className="w-full h-full object-cover" />
            ) : (
              '🤝'
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white">
                {shareholder.name}
              </h1>
              {shareholder.calculationType === 'percent' && (
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-black rounded-lg border border-emerald-500/30">
                  {`ភាគហ៊ុន ${shareholder.sharePercent}%`}
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-slate-400 mt-0.5">
              {language === 'kh'
                ? `ដើមទុនដើម៖ $${shareholder.capitalUSD.toLocaleString()} USD`
                : `Initial Investment: $${shareholder.capitalUSD.toLocaleString()} USD`}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            🚪 <span className="hidden sm:inline">{language === 'kh' ? 'ចាកចេញ' : 'Log Out'}</span>
          </button>
        </div>
      </div>

      {/* Mobile App View Navigation Tabs */}
      <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`py-2.5 px-2 rounded-xl text-xs font-black transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <span className="text-base">📊</span>
          <span className="text-[11px] sm:text-xs">{language === 'kh' ? 'ផ្ទាំងដើម' : 'Dashboard'}</span>
        </button>

        <button
          onClick={() => setActiveTab('borrowers')}
          className={`py-2.5 px-2 rounded-xl text-xs font-black transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'borrowers'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <span className="text-base">👥</span>
          <span className="text-[11px] sm:text-xs">
            {language === 'kh' ? `កូនបំណុល (${linkedBorrowers.length})` : `Borrowers (${linkedBorrowers.length})`}
          </span>
        </button>
      </div>

      {/* TAB 1: DASHBOARD OVERVIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Row 1: Capital Balance Flow */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1 shadow-md">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>💰 {language === 'kh' ? 'ដើមទុនសរុប (Total)' : 'Total Capital'}</span>
                <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md">100%</span>
              </span>
              <p className="text-2xl font-black font-mono text-white">
                ${stats.initialCapital.toLocaleString()} <span className="text-xs font-normal text-slate-500">USD</span>
              </p>
              <span className="text-[10px] text-slate-400 font-bold block">
                {language === 'kh' ? 'ដើមទុនបញ្ចូលមកកាន់យើង' : 'Provided Investment Capital'}
              </span>
            </div>

            <div className="bg-slate-900 border border-amber-500/30 p-4 rounded-2xl space-y-1 shadow-md">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center justify-between">
                <span>📤 {language === 'kh' ? 'លុយដកអោយខ្ចី (Deployed)' : 'Capital Deployed'}</span>
                <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20">
                  {stats.initialCapital > 0 ? ((stats.activeCapitalDeployed / stats.initialCapital) * 100).toFixed(0) : 0}%
                </span>
              </span>
              <p className="text-2xl font-black font-mono text-amber-400">
                -${stats.activeCapitalDeployed.toLocaleString()} <span className="text-xs font-normal text-amber-500/70">USD</span>
              </p>
              <span className="text-[10px] text-amber-300/80 font-bold block">
                {language === 'kh' ? `ដកទៅកូនបំណុលខ្ចី (${stats.activeBorrowersCount} កម្ចីសកម្ម)` : `Lent out to ${stats.activeBorrowersCount} active loans`}
              </span>
            </div>

            <div className="bg-slate-900 border border-emerald-500/40 p-4 rounded-2xl space-y-1 shadow-md relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center justify-between">
                <span>📥 {language === 'kh' ? 'ដើមទុននៅសល់ (Available)' : 'Remaining Capital'}</span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-md border border-emerald-500/30 font-bold">
                  {stats.initialCapital > 0 ? ((stats.remainingCapital / stats.initialCapital) * 100).toFixed(0) : 100}%
                </span>
              </span>
              <p className="text-2xl font-black font-mono text-emerald-400">
                ${stats.remainingCapital.toLocaleString()} <span className="text-xs font-normal text-emerald-500/70">USD</span>
              </p>
              <span className="text-[10px] text-emerald-300/80 font-bold block">
                {language === 'kh' ? 'ដើមទុននៅសល់មិនទាន់ប្រើ' : 'Available Unused Fund Balance'}
              </span>
            </div>
          </div>

          {/* Visual Capital Allocation Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-md">
            <div className="flex justify-between text-xs font-extrabold text-slate-300">
              <span className="flex items-center gap-1.5">
                <span>📊</span>
                <span>
                  {language === 'kh'
                    ? `ស្ថានភាពដើមទុន៖ $${stats.initialCapital.toLocaleString()} USD (ដក $${stats.activeCapitalDeployed.toLocaleString()} ➔ នៅសល់ $${stats.remainingCapital.toLocaleString()})`
                    : `Capital Allocation: $${stats.initialCapital.toLocaleString()} USD (Used $${stats.activeCapitalDeployed.toLocaleString()} ➔ Left $${stats.remainingCapital.toLocaleString()})`}
                </span>
              </span>
              <span className="text-emerald-400 font-mono font-black">
                {stats.initialCapital > 0 ? ((stats.remainingCapital / stats.initialCapital) * 100).toFixed(1) : '100'}% {language === 'kh' ? 'នៅសល់' : 'Available'}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, stats.initialCapital > 0 ? (stats.activeCapitalDeployed / stats.initialCapital) * 100 : 0)}%` }}
                title={`ដកអោយខ្ចី: $${stats.activeCapitalDeployed}`}
              />
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500 ml-0.5"
                style={{ width: `${Math.min(100, stats.initialCapital > 0 ? (stats.remainingCapital / stats.initialCapital) * 100 : 100)}%` }}
                title={`នៅសល់: $${stats.remainingCapital}`}
              />
            </div>
          </div>

          {/* Row 2: Profit & Daily Share Performance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                {language === 'kh' ? '📈 ប្រាក់ចំណេញទទួលបាន' : 'My Profit Share'}
              </span>
              <p className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                +${stats.partnerProfitEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-500">USD</span>
              </p>
              <span className="text-[10px] text-emerald-500/80 font-bold block">
                {shareholder.calculationType === 'percent'
                  ? (language === 'kh' ? `ភាគលាភរបស់អ្នក (${shareholder.sharePercent}%)` : `Your Dividend (${shareholder.sharePercent}%)`)
                  : (language === 'kh' ? 'ប្រាក់ចំណេញភាគហ៊ុនទទួលបានសរុប' : 'Total Earned Dividend')}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                {language === 'kh' ? '💵 ផលចំណេញប្រចាំថ្ងៃសរុប' : 'Total Daily Profit'}
              </span>
              <p className="text-xl sm:text-2xl font-black font-mono text-blue-400">
                ${stats.totalDailyProfitUSD.toFixed(2)} <span className="text-xs font-normal text-slate-500">/ {language === 'kh' ? 'ថ្ងៃ' : 'day'}</span>
              </p>
              <span className="text-[10px] text-blue-400/80 font-bold block">
                {language === 'kh' ? 'គណនាជា ដុល្លារ/ថ្ងៃ លើកម្ចីសកម្ម' : 'Daily Rate on Active Loans'}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                {language === 'kh' ? '👥 កូនបំណុលក្នុងកញ្ចប់' : 'Linked Borrowers'}
              </span>
              <p className="text-xl sm:text-2xl font-black font-mono text-amber-400">
                {stats.activeBorrowersCount} <span className="text-xs font-normal text-slate-500">{language === 'kh' ? 'នាក់' : 'active'}</span>
              </p>
              <span className="text-[10px] text-slate-500 font-bold block">
                {language === 'kh' ? `សរុបទាំងអស់ ${stats.linkedBorrowersCount} នាក់` : `Total ${stats.linkedBorrowersCount} loans`}
              </span>
            </div>
          </div>

          {/* Profit Split Explanation Banner */}
          <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 p-4 rounded-2xl space-y-2">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">💡</span>
              <div className="text-xs space-y-1">
                <p className="font-black text-emerald-400 text-sm">
                  {language === 'kh' ? 'គោលការណ៍គណនាផលចំណេញប្រចាំថ្ងៃ (Daily Profit Policy & Rate):' : 'Daily Profit Calculation Policy:'}
                </p>
                <p className="text-slate-300 font-bold leading-relaxed">
                  {language === 'kh'
                    ? 'រាល់ពេលកូនបំណុលបង់ប្រាក់ប្រចាំថ្ងៃ ប្រព័ន្ធនឹងបែងចែកផលចំណេញរវាងម្ចាស់ដើម និងដៃគូភាគហ៊ុនតាមអត្រាដែលបានកំណត់ (ឧទាហរណ៍ ៥០% ម្នាក់ ឬ $4/ថ្ងៃ ចែកជា ២$ ក្នុងមួយនាក់)។'
                    : 'Whenever a borrower pays, interest revenue is split 50/50 between the main lender and partner account.'}
                </p>
              </div>
            </div>
          </div>

          {/* Official Sponsor & Partner Spotlight Panel */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/50 border border-indigo-500/30 p-5 rounded-3xl space-y-4 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🌟</span>
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <span>{language === 'kh' ? 'ម្ចាស់ឧបត្ថម្ភ និងដៃគូសហការផ្លូវការ' : 'Official Sponsors & Financial Partners'}</span>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[9px] rounded-full font-black">PRO</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-bold">
                    {language === 'kh' ? 'ប្រព័ន្ធបច្ចេកវិទ្យាហិរញ្ញវត្ថុ និងដៃគូវិនិយោគគាំទ្រ' : 'Financial Tech Infrastructure & Partner Network'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIosInstallModal(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/30 rounded-xl text-xs font-black transition cursor-pointer"
              >
                📱 Install App
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-black text-sm shrink-0">
                  ABA
                </div>
                <div>
                  <h5 className="text-xs font-black text-white flex items-center gap-1">
                    <span>ABA PAY KHQR</span>
                    <span className="text-sky-400 text-[10px]">✓ Verified</span>
                  </h5>
                  <p className="text-[10px] text-slate-400 font-bold">Instant Automated Settlement</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-sm shrink-0">
                  💎
                </div>
                <div>
                  <h5 className="text-xs font-black text-white flex items-center gap-1">
                    <span>LUYPAY LEDGER</span>
                    <span className="text-amber-400 text-[10px]">⭐ Sponsor</span>
                  </h5>
                  <p className="text-[10px] text-slate-400 font-bold">Smart Microfinance Engine</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-sm shrink-0">
                  🤝
                </div>
                <div>
                  <h5 className="text-xs font-black text-white flex items-center gap-1">
                    <span>CAMBODIA PARTNER</span>
                    <span className="text-emerald-400 text-[10px]">● Active</span>
                  </h5>
                  <p className="text-[10px] text-slate-400 font-bold">Investor Capital Network</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: LINKED BORROWERS WITH PRINCIPAL & SPLIT DETAIL */}
      {activeTab === 'borrowers' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Search bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'kh' ? "ស្វែងរកកូនបំណុល (តាមឈ្មោះ ឬលេខទូរស័ព្ទ)..." : "Search borrower by name or phone..."}
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="absolute left-3.5 top-3.5 text-slate-400 text-sm">🔍</span>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-3 py-3 bg-slate-800 text-slate-400 hover:text-white rounded-2xl text-xs font-bold transition"
              >
                ✕
              </button>
            )}
          </div>

          {filteredBorrowers.length === 0 ? (
            <div className="p-10 bg-slate-900 border border-dashed border-slate-800 rounded-3xl text-center space-y-2">
              <span className="text-4xl block">👤</span>
              <p className="text-sm font-black text-slate-300">
                {language === 'kh' ? 'រកមិនឃើញកូនបំណុលក្នុងកញ្ចប់ភាគហ៊ុនទេ' : 'No borrowers found.'}
              </p>
              <p className="text-xs text-slate-500 font-bold">
                {language === 'kh' ? 'កូនបំណុលដែលបានបង្កើត និងភ្ជាប់ជាមួយភាគហ៊ុនរបស់អ្នក នឹងបង្ហាញនៅទីនេះ' : 'Borrowers assigned to your partner account will appear here.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredBorrowers.map((b) => {
                const totalPaid = (b.payments || []).reduce((acc, p) => acc + p.amount, 0);
                const remaining = Math.max(0, b.totalToPay - totalPaid);
                const totalInterest = Math.max(0, b.totalToPay - b.principal);
                const calcMode = b.shareholderCalculationType || shareholder.calculationType || 'daily_usd';
                
                const dVal = b.duration || 1;
                const totalDailyInterest = dVal > 0 ? totalInterest / dVal : 0;

                const partnerDailyShare = calcMode === 'percent'
                  ? (dVal > 0 ? ((totalInterest / dVal) * (b.shareholderSharePercent ?? 50)) / 100 : 0)
                  : (b.shareholderDailyUSD ?? shareholder.dailyProfitUSD ?? (totalDailyInterest > 0 ? totalDailyInterest / 2 : 1.0));

                const ownerDailyShare = Math.max(0, totalDailyInterest - partnerDailyShare);

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBorrower(b)}
                    className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-3xl space-y-3.5 transition cursor-pointer group shadow-lg relative overflow-hidden"
                  >
                    {/* Top card header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                          {b.profilePhoto ? (
                            <img src={b.profilePhoto} alt={b.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl font-black text-slate-300">{b.name.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-base font-black text-white group-hover:text-emerald-400 transition">
                            {b.name}
                          </h4>
                          <p className="text-xs font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                            <span>📞 {b.phone || '—'}</span>
                          </p>
                        </div>
                      </div>

                      <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black rounded-xl group-hover:bg-emerald-500 group-hover:text-slate-950 transition">
                        {language === 'kh' ? '👁️ មើល Profile' : 'View Profile'}
                      </span>
                    </div>

                    {/* PROMINENT BORROWER PRINCIPAL & INTEREST SPLIT BOX */}
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <div>
                          <span className="text-[10px] font-black uppercase text-slate-400 block">
                            💵 {language === 'kh' ? 'ប្រាក់ដើមខ្ចី (Principal)' : 'Loan Principal'}
                          </span>
                          <span className="text-lg font-black font-mono text-emerald-400">
                            ${b.principal.toLocaleString()} <span className="text-xs font-normal text-slate-500">{b.currency}</span>
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-black uppercase text-amber-400 block">
                            📊 {language === 'kh' ? 'ការប្រាក់សរុប (Total Interest)' : 'Total Interest'}
                          </span>
                          <span className="text-lg font-black font-mono text-amber-400">
                            ${totalInterest.toLocaleString()} <span className="text-xs font-normal text-slate-500">{b.currency}</span>
                          </span>
                        </div>
                      </div>

                      {/* 2-Way 50/50 Split Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div className="p-2 bg-slate-900 rounded-xl border border-blue-500/20">
                          <span className="text-[9px] font-black uppercase text-blue-400 block">
                            👑 {language === 'kh' ? 'ម្ចាស់ដើម' : 'Main Owner'}
                          </span>
                          <span className="text-xs font-black font-mono text-blue-400">
                            ${ownerDailyShare.toFixed(2)}/ថ្ងៃ
                          </span>
                        </div>

                        <div className="p-2 bg-slate-900 rounded-xl border border-emerald-500/20">
                          <span className="text-[9px] font-black uppercase text-emerald-400 block">
                            🤝 {language === 'kh' ? 'ភាគហ៊ុនខ្ញុំ' : 'My Partner Share'}
                          </span>
                          <span className="text-xs font-black font-mono text-emerald-400">
                            +${partnerDailyShare.toFixed(2)}/ថ្ងៃ
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress & Remaining */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-300">
                        <span>{language === 'kh' ? 'បានបង់៖' : 'Paid:'} ${totalPaid.toLocaleString()}</span>
                        <span className="text-amber-400">{language === 'kh' ? 'នៅសល់៖' : 'Remaining:'} ${remaining.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                          style={{ width: `${Math.min(100, (totalPaid / (b.totalToPay || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* iOS iPhone PWA Install Instructions Modal */}
      {showIosInstallModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowIosInstallModal(false)}
              className="absolute top-4 right-4 w-9 h-9 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full flex items-center justify-center font-bold text-sm transition"
            >
              ✕
            </button>

            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-gradient-to-tr from-sky-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-lg shadow-sky-500/20 text-white">
                📲
              </div>
              <h3 className="text-lg font-black text-white">
                {language === 'kh' ? 'របៀប Add to Home Screen លើ iPhone / iOS' : 'Add Shareholder Portal to iPhone Home Screen'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'kh'
                  ? 'បង្កើត App Icon លើអេក្រង់ iPhone របស់អ្នកដើម្បិចូលមើលផលចំណេញ និងកូនបំណុលបានលឿនដូច App ដើម!'
                  : 'Install this portal directly onto your iPhone home screen for instant one-tap access like a native app.'}
              </p>
            </div>

            <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 text-xs">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-black flex items-center justify-center shrink-0">1</span>
                <p className="text-slate-300 font-bold leading-relaxed">
                  {language === 'kh' ? (
                    <>បើក Safari រួចចុចប៊ូតុងចែករំលែក <b>Share</b> <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-sky-400 rounded font-mono">⎋ / ⬆️</span> នៅខាងក្រោមគេនៃ Safari App</>
                  ) : (
                    <>Open in Safari, then tap the <b>Share button</b> <span className="px-1 py-0.5 bg-slate-800 rounded text-sky-400">⎋</span> at the bottom bar.</>
                  )}
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-black flex items-center justify-center shrink-0">2</span>
                <p className="text-slate-300 font-bold leading-relaxed">
                  {language === 'kh' ? (
                    <>អូសចុះក្រោម រួចជ្រើសរើសយក <b>«បន្ថែមទៅអេក្រង់ដើម» (Add to Home Screen ➕)</b></>
                  ) : (
                    <>Scroll down the menu and select <b>"Add to Home Screen ➕"</b>.</>
                  )}
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-black flex items-center justify-center shrink-0">3</span>
                <p className="text-slate-300 font-bold leading-relaxed">
                  {language === 'kh' ? (
                    <>ចុចប៊ូតុង <b>«បន្ថែម» (Add)</b> នៅផ្នែកខាងលើខាងស្តាំ ជាការស្រេច!</>
                  ) : (
                    <>Tap <b>"Add"</b> in the top right corner. The Shareholder App icon will appear on your iPhone!</>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleCopyPortalLink}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>📋</span>
                <span>{copiedLinkToast ? (language === 'kh' ? 'បានចម្លងរួចរាល់!' : 'Copied!') : (language === 'kh' ? 'ចម្លង Link Portal' : 'Copy Portal Link')}</span>
              </button>
              <button
                onClick={() => setShowIosInstallModal(false)}
                className="flex-1 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-2xl text-xs transition cursor-pointer shadow-lg shadow-sky-500/20"
              >
                {language === 'kh' ? 'យល់ព្រម (Done)' : 'Got it!'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
