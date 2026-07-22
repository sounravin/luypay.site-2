import React, { useState } from 'react';
import { Borrower, Shareholder } from '../types';
import { calculateShareholderStats } from '../utils/shareholderUtils';

interface ShareholderManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareholders: Shareholder[];
  onSaveShareholders: (updated: Shareholder[]) => void;
  borrowers: Borrower[];
  language: 'kh' | 'en';
}

export default function ShareholderManagementModal({
  isOpen,
  onClose,
  shareholders,
  onSaveShareholders,
  borrowers,
  language,
}: ShareholderManagementModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [capitalUSD, setCapitalUSD] = useState('500');
  const [calculationType, setCalculationType] = useState<'daily_usd' | 'percent'>('daily_usd');
  const [dailyProfitUSD, setDailyProfitUSD] = useState('1.00');
  const [sharePercent, setSharePercent] = useState('50');
  const [notes, setNotes] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setPhone('');
    const nextNum = shareholders.length + 1;
    setUsername(`partner${nextNum}`);
    setPassword(`${Math.floor(100000 + Math.random() * 900000)}`);
    setCapitalUSD('500');
    setCalculationType('daily_usd');
    setDailyProfitUSD('1.00');
    setSharePercent('50');
    setNotes('');
    setIsEditing(true);
  };

  const handleOpenEdit = (s: Shareholder) => {
    setEditingId(s.id);
    setName(s.name);
    setPhone(s.phone || '');
    setUsername(s.username || 'admin');
    setPassword(s.password || 'admin');
    setCapitalUSD(s.capitalUSD.toString());
    setCalculationType(s.calculationType || 'daily_usd');
    setDailyProfitUSD((s.dailyProfitUSD ?? 1.0).toString());
    setSharePercent((s.sharePercent ?? 50).toString());
    setNotes(s.notes || '');
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const cap = parseFloat(capitalUSD) || 0;
    const dailyProfit = parseFloat(dailyProfitUSD) || 1.0;
    const split = parseFloat(sharePercent) || 50;

    if (editingId) {
      const updated = shareholders.map((s) =>
        s.id === editingId
          ? {
              ...s,
              name: name.trim(),
              phone: phone.trim(),
              username: username.trim() || 'admin',
              password: password.trim() || 'admin',
              capitalUSD: cap,
              calculationType,
              dailyProfitUSD: dailyProfit,
              sharePercent: split,
              notes: notes.trim(),
            }
          : s
      );
      onSaveShareholders(updated);
    } else {
      const newShareholder: Shareholder = {
        id: `sh_${Date.now()}`,
        name: name.trim(),
        phone: phone.trim(),
        username: username.trim() || 'admin',
        password: password.trim() || 'admin',
        capitalUSD: cap,
        calculationType,
        dailyProfitUSD: dailyProfit,
        sharePercent: split,
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
      };
      onSaveShareholders([...shareholders, newShareholder]);
    }

    setEditingId(null);
    setName('');
    setPhone('');
    setUsername('admin');
    setPassword('admin');
    setCapitalUSD('500');
    setCalculationType('daily_usd');
    setDailyProfitUSD('1.00');
    setSharePercent('50');
    setNotes('');
    setIsEditing(false);
  };

  const handleDelete = (id: string) => {
    if (
      window.confirm(
        language === 'kh'
          ? 'តើអ្នកពិតជាចង់លុបម្ចាស់ភាគហ៊ុននេះមែនទេ?'
          : 'Are you sure you want to delete this shareholder?'
      )
    ) {
      onSaveShareholders(shareholders.filter((s) => s.id !== id));
    }
  };

  const copyPortalLink = (s: Shareholder) => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const link = `${origin}${pathname}?partner=${s.id}`;
    const textToCopy = `🤝 ព័ត៌មាន Login ចូលមើលគណនីភាគហ៊ុន (${s.name})\n🌐 Link: ${link}\n👤 Username: ${s.username || 'admin'}\n🔑 Password: ${s.password || 'admin'}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(s.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-2xl text-xl">🤝</span>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {language === 'kh' ? 'គ្រប់គ្រងម្ចាស់ភាគហ៊ុន (Shareholders)' : 'Shareholder Partners Management'}
              </h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'kh'
                  ? 'គ្រប់គ្រងដើមទុន ភាគលាភ និងបង្កើត Link ចូលមើលសម្រាប់ដៃគូវិនិយោគ'
                  : 'Manage capital investments, profit share & partner login links'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {shareholders.length > 0 && (
              <a
                href={`${window.location.origin}${window.location.pathname}?partner=${shareholders[0].id}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm border border-amber-300"
              >
                <span>🌐</span>
                <span>{language === 'kh' ? 'បើក Link ដៃគូភាគហ៊ុន' : 'Open Partner Link'}</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">

          {/* Quick Access Top Banner for Partner Link */}
          {shareholders.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-blue-500/15 border-2 border-amber-400/40 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🚀</span>
                  <h4 className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                    {language === 'kh' ? 'Link សម្រាប់ចូល Login ដៃគូភាគហ៊ុន' : 'Partner Portal Login Link'}
                  </h4>
                </div>
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  {language === 'kh'
                    ? 'ចុចប៊ូតុងខាងក្រោមដើម្បីបើកផ្ទាំង Login ដៃគូភាគហ៊ុន ឬចម្លង Link ផ្ញើទៅកាន់ដៃគូ'
                    : 'Click below to open the partner portal view or copy the link for your partner'}
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <a
                  href={`${window.location.origin}${window.location.pathname}?partner=${shareholders[0].id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 text-xs font-black rounded-xl transition shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>🌐</span>
                  <span>{language === 'kh' ? 'បើកមើល Link ដៃគូ' : 'Open Partner Portal'}</span>
                </a>
                <button
                  type="button"
                  onClick={() => copyPortalLink(shareholders[0])}
                  className="px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 text-xs font-black rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                >
                  <span>{copiedId === shareholders[0].id ? '✅' : '📋'}</span>
                  <span className="hidden sm:inline">{copiedId === shareholders[0].id ? (language === 'kh' ? 'បានចម្លង!' : 'Copied!') : (language === 'kh' ? 'ចម្លង Link' : 'Copy')}</span>
                </button>
              </div>
            </div>
          )}
          {isEditing ? (
            /* Add/Edit Form */
            <form onSubmit={handleSave} className="space-y-4 bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
                <span>📝</span> {editingId ? (language === 'kh' ? 'កែប្រែព័ត៌មានភាគហ៊ុន' : 'Edit Shareholder') : (language === 'kh' ? 'បន្ថែមម្ចាស់ភាគហ៊ុនថ្មី' : 'Add New Shareholder')}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'kh' ? 'ឈ្មោះម្ចាស់ភាគហ៊ុន' : 'Shareholder Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={language === 'kh' ? 'ឧទាហរណ៍៖ សុក ចាន់ (ដៃគូ $500)' : 'e.g. Partner John'}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'kh' ? 'លេខទូរស័ព្ទ' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="012 345 678"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'kh' ? 'ដើមទុនវិនិយោគ ($ USD)' : 'Invested Capital ($ USD)'} *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={capitalUSD}
                    onChange={(e) => setCapitalUSD(e.target.value)}
                    placeholder="500"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 bg-emerald-500/10 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-500/20 space-y-2">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                    {language === 'kh' ? 'របៀបគណនាផលចំណេញ (Calculation Mode)' : 'Calculation Mode'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCalculationType('daily_usd')}
                      className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        calculationType === 'daily_usd'
                          ? 'bg-emerald-500 text-slate-950 shadow-md'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <span>💵</span> {language === 'kh' ? 'គណនាជា ដុល្លារ/ថ្ងៃ ($)' : 'Fixed USD / Day'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalculationType('percent')}
                      className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        calculationType === 'percent'
                          ? 'bg-emerald-500 text-slate-950 shadow-md'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <span>📊</span> {language === 'kh' ? 'គណនាជា ភាគរយ (%)' : 'Profit Split %'}
                    </button>
                  </div>
                </div>

                {calculationType === 'daily_usd' ? (
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      {language === 'kh' ? 'ផលចំណេញប្រចាំថ្ងៃ ($ USD / ថ្ងៃ)' : 'Daily Profit ($ USD / Day)'} *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-mono font-bold text-slate-400">$</span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="any"
                        value={dailyProfitUSD}
                        onChange={(e) => setDailyProfitUSD(e.target.value)}
                        placeholder="1.00"
                        className="w-full pl-7 pr-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 block">
                      {language === 'kh' ? '💡 ឧទាហរណ៍៖ $1.00 / ថ្ងៃ ឬ $2.00 / ថ្ងៃ សម្រាប់កម្ចី' : 'e.g., $1.00 or $2.00 per active day loan'}
                    </span>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      {language === 'kh' ? 'ភាគរយបែងចែកការ (Profit Share %)' : 'Profit Share %'}
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      value={sharePercent}
                      onChange={(e) => setSharePercent(e.target.value)}
                      placeholder="50"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-black text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 font-bold mt-1 block">
                      {language === 'kh' ? 'កំណត់ 50% = ចែកគ្នាម្នាក់ពាក់កណ្តាល' : '50% = 50/50 Profit Split'}
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'kh' ? 'ឈ្មោះគណនី Login (Username)' : 'Login Username'}
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'kh' ? 'ពាក្យសម្ងាត់ Login (Password)' : 'Login Password'}
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="admin"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  {language === 'kh' ? 'កំណត់ចំណាំផ្សេងៗ' : 'Notes / Description'}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder={language === 'kh' ? 'ឧទាហរណ៍៖ ដើម $500 ដាក់វិនិយោគលើកម្ចី 20ថ្ងៃ' : 'Notes...'}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  {language === 'kh' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-black transition cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  {language === 'kh' ? 'រក្សាទុក' : 'Save Shareholder'}
                </button>
              </div>
            </form>
          ) : (
            /* List of Shareholders */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {language === 'kh' ? `បញ្ជីម្ចាស់ភាគហ៊ុន (${shareholders.length})` : `Shareholders List (${shareholders.length})`}
                </h4>
                <button
                  onClick={handleOpenAdd}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  <span>➕</span> {language === 'kh' ? 'បន្ថែមម្ចាស់ភាគហ៊ុន' : 'Add Partner'}
                </button>
              </div>

              {shareholders.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-850 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <span className="text-3xl block mb-2">🤝</span>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {language === 'kh'
                      ? 'មិនទាន់មានទិន្នន័យម្ចាស់ភាគហ៊ុននៅឡើយទេ។ សូមចុច «បន្ថែមម្ចាស់ភាគហ៊ុន» ដើម្បីបង្កើត!'
                      : 'No shareholders added yet. Click "Add Partner" to create one!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shareholders.map((s) => {
                    const stats = calculateShareholderStats(s, borrowers);
                    const portalLink = `${window.location.origin}${window.location.pathname}?partner=${s.id}`;

                    return (
                      <div
                        key={s.id}
                        className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 hover:border-emerald-500/40 transition"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-black text-slate-900 dark:text-white">
                                {s.name}
                              </span>
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-black border border-emerald-500/20">
                                {s.calculationType === 'percent'
                                  ? `${s.sharePercent}% ${language === 'kh' ? 'ភាគលាភ' : 'Share'}`
                                  : `💵 $${(s.dailyProfitUSD ?? 1.0).toFixed(2)}/ថ្ងៃ`}
                              </span>
                            </div>
                            {s.phone && (
                              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                                📞 {s.phone}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(s)}
                              className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-bold transition cursor-pointer"
                            >
                              ✏️ {language === 'kh' ? 'កែប្រែ' : 'Edit'}
                            </button>
                            <button
                              onClick={() => handleDelete(s.id)}
                              className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-[11px] font-bold transition cursor-pointer"
                            >
                              🗑️ {language === 'kh' ? 'លុប' : 'Delete'}
                            </button>
                          </div>
                        </div>

                        {/* Financial metrics grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              {language === 'kh' ? 'ដើមទុនវិនិយោគ' : 'Invested Capital'}
                            </span>
                            <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                              ${stats.initialCapital.toLocaleString()} USD
                            </span>
                          </div>

                          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              {language === 'kh' ? 'ចំណេញប្រចាំថ្ងៃ' : 'Daily Profit USD'}
                            </span>
                            <span className="text-sm font-black font-mono text-blue-600 dark:text-blue-400">
                              ${stats.totalDailyProfitUSD.toFixed(2)} / ថ្ងៃ
                            </span>
                          </div>

                          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              {language === 'kh' ? 'ប្រាក់ចំណេញទទួលបាន' : 'Partner Profit'}
                            </span>
                            <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                              +${stats.partnerProfitEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                            </span>
                          </div>

                          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              {language === 'kh' ? 'កូនបំណុល' : 'Linked Loans'}
                            </span>
                            <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                              {stats.activeBorrowersCount} {language === 'kh' ? 'នាក់' : 'active'}
                            </span>
                          </div>
                        </div>

                        {/* Credentials & Copy Portal Link */}
                        <div className="bg-emerald-500/5 border border-emerald-500/20 p-3.5 rounded-2xl space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                              🔑 {language === 'kh' ? 'ព័ត៌មាន Login ម្ចាស់ភាគហ៊ុន៖' : 'Partner Credentials:'}
                              <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-emerald-500/30 text-slate-900 dark:text-slate-100">
                                Username: <b>{s.username || 'admin'}</b> | Password: <b>{s.password || 'admin'}</b>
                              </span>
                            </p>

                            <button
                              onClick={() => copyPortalLink(s)}
                              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                            >
                              <span>{copiedId === s.id ? '✅' : '🔗'}</span>
                              {copiedId === s.id
                                ? language === 'kh'
                                  ? 'បានចម្លង Link រួចរាល់!'
                                  : 'Copied Link!'
                                : language === 'kh'
                                ? 'ចម្លង Link ចូលមើល Portal'
                                : 'Copy Partner Link'}
                            </button>
                          </div>

                          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-emerald-500/20 font-mono text-[11px] text-slate-600 dark:text-slate-300 overflow-x-auto">
                            <span className="text-emerald-500 font-bold shrink-0">🌐 Link Portal:</span>
                            <span className="truncate select-all">{portalLink}</span>
                            <a
                              href={portalLink}
                              target="_blank"
                              rel="noreferrer"
                              className="ml-auto text-xs text-blue-500 hover:underline font-sans font-bold shrink-0"
                            >
                              {language === 'kh' ? 'បើក Link ↗' : 'Open ↗'}
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-bold">
            {language === 'kh' ? '💡 កូនបំណុលដែលភ្ជាប់ជាមួយភាគហ៊ុន នឹងបង្ហាញការបែងចែកប្រាក់ចំណេញដោយស្វ័យប្រវត្តិ' : '💡 Linked borrowers automatically split profit on each payment'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold transition cursor-pointer"
          >
            {language === 'kh' ? 'បិទ' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
}
