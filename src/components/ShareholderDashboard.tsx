import React, { useState } from 'react';
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

export default function ShareholderDashboard({
  shareholder: initialShareholder,
  allShareholders = [],
  borrowers,
  language,
  onBackToMain,
  onEditBorrower,
}: ShareholderDashboardProps) {
  const [activeShareholder, setActiveShareholder] = useState<Shareholder>(initialShareholder);

  // Sync activeShareholder if initialShareholder changes
  React.useEffect(() => {
    if (initialShareholder && initialShareholder.id !== activeShareholder.id) {
      setActiveShareholder(initialShareholder);
    }
  }, [initialShareholder]);

  const listToSearch = allShareholders.length > 0 ? allShareholders : [activeShareholder];

  // Login auth state for shareholder portal
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const authKey = `luypay_partner_auth_${initialShareholder.id}`;
    if (localStorage.getItem(authKey) === 'true') return true;
    const globalAuth = localStorage.getItem('luypay_authenticated_partner_id');
    return !!globalAuth && listToSearch.some((s) => s.id === globalAuth);
  });

  const [inputUsername, setInputUsername] = useState(initialShareholder.username || 'admin');
  const [inputPassword, setInputPassword] = useState(initialShareholder.password || 'admin');
  const [loginError, setLoginError] = useState('');

  // Selected borrower for read-only detail view
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null);

  const shareholder = activeShareholder;
  const stats = calculateShareholderStats(shareholder, borrowers);
  const linkedBorrowers = borrowers.filter(
    (b) =>
      (b.shareholderId && b.shareholderId === shareholder.id) ||
      (b.shareholderName && shareholder.name && b.shareholderName.trim().toLowerCase() === shareholder.name.trim().toLowerCase())
  );

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

  // Collect all payments from linked borrowers sorted by date descending
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

  // If not authenticated yet, show Login Screen
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
            <h2 className="text-xl font-black text-white">
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

  // If viewing a read-only borrower profile
  if (selectedBorrower) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 space-y-4">
        {/* Banner header for read-only mode */}
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 max-w-6xl mx-auto space-y-6">
      
      {/* Top Portal Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-2xl shadow-inner overflow-hidden">
            {shareholder.profilePhoto ? (
              <img src={shareholder.profilePhoto} alt={shareholder.name} className="w-full h-full object-cover" />
            ) : (
              '🤝'
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">
                {shareholder.name}
              </h1>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-black rounded-lg border border-emerald-500/30">
                {shareholder.calculationType === 'percent'
                  ? `ភាគហ៊ុន ${shareholder.sharePercent}%`
                  : `💵 $${(shareholder.dailyProfitUSD ?? 1.0).toFixed(2)} / ថ្ងៃ`}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-400 mt-0.5">
              {language === 'kh'
                ? `របាយការណ៍ប្រាក់ចំណូលភាគហ៊ុន - ដើមទុនដើម៖ $${shareholder.capitalUSD.toLocaleString()} USD`
                : `Partner Revenue Report - Initial Investment: $${shareholder.capitalUSD.toLocaleString()} USD`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onBackToMain && (
            <button
              onClick={onBackToMain}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              🏠 {language === 'kh' ? 'កម្មវិធីដើម' : 'Main App'}
            </button>
          )}
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            🚪 {language === 'kh' ? 'ចាកចេញ' : 'Log Out'}
          </button>
        </div>
      </div>

      {/* Financial Metrics Overview & Capital Balance Tracker */}
      <div className="space-y-3">
        {/* Row 1: Capital Balance Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1 shadow-md">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block flex items-center justify-between">
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
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 block flex items-center justify-between">
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
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 block flex items-center justify-between">
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
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-2">
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
      </div>

      {/* Split & Daily Profit Rate Explanation Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 p-4 rounded-2xl space-y-2">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">💡</span>
          <div className="text-xs space-y-1">
            <p className="font-black text-emerald-400 text-sm">
              {language === 'kh' ? 'គោលការណ៍គណនាផលចំណេញប្រចាំថ្ងៃ (Daily Profit Policy & Rate):' : 'Daily USD Profit Calculation Policy:'}
            </p>
            <p className="text-slate-300 font-bold leading-relaxed">
              {language === 'kh'
                ? 'រាល់ពេលកូនបំណុលបង់ប្រាក់ប្រចាំថ្ងៃ ដៃគូភាគហ៊ុននឹងទទួលបានផលចំណេញជាដុល្លារតាមអត្រាដែលបានកំណត់ (ឧទាហរណ៍ $100 ខ្ចី ➔ $4.00/ថ្ងៃ, $200 ខ្ចី ➔ $8.00/ថ្ងៃ, $500 ខ្ចី ➔ $20.00/ថ្ងៃ)។'
                : 'Whenever a borrower makes a daily payment, the shareholder partner receives a calculated daily profit rate (e.g. $100 lent = $4.00/day, $200 lent = $8.00/day).'}
            </p>
            <div className="pt-1 flex flex-wrap gap-2 text-[11px] font-mono">
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 rounded border border-emerald-500/20 font-black">
                $100 ខ្ចី ➔ $4/ថ្ងៃ
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 rounded border border-emerald-500/20 font-black">
                $200 ខ្ចី ➔ $8/ថ្ងៃ
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 rounded border border-emerald-500/20 font-black">
                $500 ខ្ចី ➔ $20/ថ្ងៃ
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Linked Borrowers Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span>📋</span> {language === 'kh' ? `កូនបំណុលក្នុងកញ្ចប់ភាគហ៊ុន (${linkedBorrowers.length})` : `Assigned Borrowers (${linkedBorrowers.length})`}
          </h3>
          <span className="text-xs font-bold text-slate-400">
            {language === 'kh' ? 'ចុចលើ Profile ដើម្បីមើលព័ត៌មានលម្អិត' : 'Click profile to view read-only detail'}
          </span>
        </div>

        {linkedBorrowers.length === 0 ? (
          <div className="p-8 bg-slate-900 border border-dashed border-slate-800 rounded-2xl text-center space-y-2">
            <span className="text-3xl block">👤</span>
            <p className="text-xs font-bold text-slate-400">
              {language === 'kh'
                ? 'មិនទាន់មានកូនបំណុលត្រូវបានភ្ជាប់មកកាន់កញ្ចប់ភាគហ៊ុននេះនៅឡើយទេ'
                : 'No borrowers assigned to this shareholder yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {linkedBorrowers.map((b) => {
              const totalPaid = (b.payments || []).reduce((acc, p) => acc + p.amount, 0);
              const remaining = Math.max(0, b.totalToPay - totalPaid);
              const totalInterest = Math.max(0, b.totalToPay - b.principal);
              const calcMode = b.shareholderCalculationType || shareholder.calculationType || 'daily_usd';
              const partnerDailyShare = calcMode === 'percent'
                ? (b.duration > 0 ? ((totalInterest / b.duration) * (b.shareholderSharePercent ?? 50)) / 100 : 0)
                : (b.shareholderDailyUSD ?? shareholder.dailyProfitUSD ?? 1.0);

              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBorrower(b)}
                  className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-2xl space-y-3 transition cursor-pointer group shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                        {b.profilePhoto ? (
                          <img src={b.profilePhoto} alt={b.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-black text-slate-300">{b.name.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white group-hover:text-emerald-400 transition">
                          {b.name}
                        </h4>
                        <p className="text-xs font-bold text-slate-400">📞 {b.phone}</p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black rounded-xl">
                      {language === 'kh' ? '👁️ មើល Profile' : 'View Profile'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl text-center border border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        {language === 'kh' ? 'ប្រាក់ដើម' : 'Principal'}
                      </span>
                      <span className="text-xs font-black font-mono text-slate-200">
                        ${b.principal.toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        {language === 'kh' ? 'ការសរុប' : 'Total Interest'}
                      </span>
                      <span className="text-xs font-black font-mono text-amber-400">
                        ${totalInterest.toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-emerald-400 uppercase font-black block">
                        {language === 'kh' ? 'ចំណេញភាគហ៊ុន/ថ្ងៃ' : 'Partner Share/Day'}
                      </span>
                      <span className="text-xs font-black font-mono text-emerald-400">
                        +${partnerDailyShare.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-400">
                      <span>{language === 'kh' ? 'បានបង់រួច៖' : 'Paid:'} ${totalPaid.toLocaleString()}</span>
                      <span>{language === 'kh' ? 'នៅសល់៖' : 'Remaining:'} ${remaining.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300"
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

    </div>
  );
}
