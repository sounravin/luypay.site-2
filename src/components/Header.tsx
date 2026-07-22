import React from 'react';
import { LedgerStats, Borrower } from '../types';
import { formatMoney } from '../utils';
import { DollarSign, Percent, TrendingUp, Users, CheckCircle2, Zap, Sparkles, CalendarRange, Clock, ShieldAlert, Award, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { useLanguage } from '../i18n';
import { motion } from 'motion/react';
import { THEMES, getButtonStyleClass } from '../utils/theme';
import type { AppThemeType, ButtonStyleType } from '../utils/theme';

// Authentic Khmer Traditional Ornament (Kbach) Corner Vector
const KhmerCorner = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M 0 0 L 28 0 C 22 2, 18 6, 15 11 C 18 10.5, 20 9.5, 19.5 11.5 C 16 15, 13.5 16, 10 20 C 11.5 19.5, 13 18.5, 12.5 20 C 8.5 23.5, 6.5 24.5, 0 26.5 Z"
      fill="url(#khmer-gold)"
    />
    <path
      d="M 0 0 L 18 0 C 14 1.5, 11 3.5, 9 7 C 11 6.5, 12 6, 11.5 7.5 C 9 10, 7 11, 5 13 C 6 12.5, 7 12, 6.5 13 C 4 15, 3 15.5, 0 17 Z"
      fill="#FFE082"
      opacity="0.6"
    />
  </svg>
);

interface HeaderProps {
  stats: LedgerStats;
  onAddNewClick: () => void;
  onBackupClick: () => void;
  onImportClick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedCount: number;
  onBulkAutoCheck: () => void;
  borrowers: Borrower[];
  onSelectBorrower: (id: string) => void;
  appTheme?: AppThemeType;
  buttonStyle?: ButtonStyleType;
  onOpenShareholders?: () => void;
}

export default function Header({ 
  stats, 
  onAddNewClick, 
  onBackupClick, 
  onImportClick, 
  selectedCount, 
  onBulkAutoCheck,
  borrowers,
  onSelectBorrower,
  appTheme = 'slate',
  buttonStyle = 'kbach',
  onOpenShareholders
}: HeaderProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { t, language, setLanguage } = useLanguage();
  const [customHorizon, setCustomHorizon] = React.useState<number>(30);
  const currentThemeConfig = THEMES[appTheme];

  const activeBorrowers = React.useMemo(() => {
    return (borrowers || []).filter(b => {
      const totalPaid = Array.isArray(b.payments) ? b.payments.reduce((sum, p) => sum + (p?.amount || 0), 0) : 0;
      return !b.isArchived && totalPaid < b.totalToPay;
    });
  }, [borrowers]);

  const interestMetrics = React.useMemo(() => {
    let dailyInterestUSD = 0;
    let dailyInterestKHR = 0;
    let weeklyInterestUSD = 0;
    let weeklyInterestKHR = 0;

    activeBorrowers.forEach(b => {
      const pVal = b.principal || 0;
      const dVal = b.duration || 1;
      const isInterestOnly = b.paymentMode === 'interest-only';
      
      // Total interest for this loan is totalToPay minus principal, unless it's an interest-only loan
      const totalInterest = isInterestOnly ? b.totalToPay : Math.max(0, b.totalToPay - pVal);
      
      // Interest per period (per installment)
      const interestPerPeriod = totalInterest / dVal;

      let daily = 0;
      let weekly = 0;

      if (b.frequency === 'daily') {
        daily = interestPerPeriod;
        weekly = interestPerPeriod * 7;
      } else if (b.frequency === 'weekly') {
        daily = interestPerPeriod / 7;
        weekly = interestPerPeriod;
      } else if (b.frequency === 'monthly') {
        daily = interestPerPeriod / 30;
        weekly = (interestPerPeriod / 30) * 7;
      }

      // Check if borrower is linked to a shareholder partner
      const isLinkedToShareholder = Boolean(
        (b.shareholderId && b.shareholderId !== 'sh_default' && b.shareholderId !== 'default') ||
        (b.shareholderName && b.shareholderName.trim() !== '')
      );

      let ownerDaily = daily;
      let ownerWeekly = weekly;

      if (isLinkedToShareholder) {
        const calcMode = b.shareholderCalculationType || 'daily_usd';
        let partnerDailyShare = 0;

        if (calcMode === 'percent') {
          const sharePct = b.shareholderSharePercent ?? 50;
          partnerDailyShare = (daily * sharePct) / 100;
        } else {
          if (typeof b.shareholderDailyUSD === 'number' && b.shareholderDailyUSD > 0) {
            partnerDailyShare = b.shareholderDailyUSD;
          } else {
            // Default 50/50 split of daily interest
            partnerDailyShare = daily / 2;
          }
        }

        ownerDaily = Math.max(0, daily - partnerDailyShare);
        ownerWeekly = ownerDaily * (b.frequency === 'monthly' ? 7 : b.frequency === 'weekly' ? 1 : 7);
      }

      if (b.currency === 'USD') {
        dailyInterestUSD += ownerDaily;
        weeklyInterestUSD += ownerWeekly;
      } else {
        dailyInterestKHR += ownerDaily;
        weeklyInterestKHR += ownerWeekly;
      }
    });

    return {
      dailyInterestUSD,
      dailyInterestKHR,
      weeklyInterestUSD,
      weeklyInterestKHR,
    };
  }, [activeBorrowers]);

  const handleImportButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div id="app-header" className="space-y-6">
      {/* Traditional Theme Specific Banner Displays */}
      {appTheme === 'apsara' && (
        <div className="relative rounded-3xl p-6 overflow-hidden bg-gradient-to-r from-[#100a25] to-[#251754] border border-purple-500/30 text-[#ebdcfc] shadow-lg mb-6 animate-in fade-in duration-350">
          {/* Ornate backdrops */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-4 h-full flex items-center justify-end select-none opacity-20 md:opacity-30 pointer-events-none">
            {/* Mystical White Horse SVG Illustration with golden Apsara crown details */}
            <svg className="w-56 h-56 text-purple-300 filter drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]" viewBox="0 0 100 100" fill="currentColor">
              <path d="M75 35 C70 30, 60 28, 55 25 C50 22, 45 15, 38 12 C30 9, 22 15, 20 22 C18 28, 22 35, 25 38 C28 41, 35 43, 35 45 C35 48, 28 52, 25 55 C20 60, 18 68, 22 75 C25 82, 35 85, 45 82 C55 80, 62 70, 68 62 C75 55, 80 42, 75 35 Z" fill="white" opacity="0.8" />
              <path d="M40 35 C38 30, 32 25, 25 25 C20 25, 18 28, 20 32 C22 36, 30 40, 35 40 Z" fill="#dfb035" />
              <path d="M55 45 C52 40, 48 35, 42 35 C38 35, 36 38, 38 42 C40 46, 48 50, 52 50 Z" fill="#dfb035" />
              <path d="M55 25 C58 20, 56 12, 60 8 C62 5, 68 5, 70 10 C72 15, 68 20, 65 22 Z" fill="#dfb035" />
              <path d="M60 24 C62 26, 68 28, 72 32 C75 35, 78 40, 75 45 C72 48, 65 44, 60 38 Z" fill="#dfb035" />
            </svg>
          </div>

          <div className="relative z-10 space-y-2 max-w-lg">
            <span className="text-[10px] font-black uppercase tracking-widest bg-purple-500/20 border border-purple-400/30 px-3 py-1 rounded-full text-purple-200">
              ✨ {language === 'kh' ? 'រចនាប័ទ្ម រាត្រីទេពអប្សរា' : 'Celestial Apsara Night Theme'}
            </span>
            <h3 className="text-2xl font-black text-white leading-tight">
              {language === 'kh' ? 'អរុណសួស្តី! សហគ្រិនឆ្នើម' : 'Arun Soursei! Welcome,'} <span className="text-amber-300 font-extrabold">លុយផេ Luypay</span>
            </h3>
            <p className="text-xs text-purple-200/80 font-medium leading-relaxed">
              {language === 'kh' 
                ? 'សូមរីករាយជាមួយប្រព័ន្ធគ្រប់គ្រងបំណុលបែបបុរាណខ្មែរ ដែលរចនាឡើងយ៉ាងរស់រវើក ដើម្បីសម្រួលដល់ការគ្រប់គ្រងហិរញ្ញវត្ថុរបស់អ្នក។' 
                : 'Enjoy the vibrant traditional Khmer-style ledger dashboard crafted to optimize your debt tracking experience.'}
            </p>
          </div>
        </div>
      )}

      {appTheme === 'angkor' && (
        <div className="relative rounded-3xl p-6 overflow-hidden bg-gradient-to-r from-[#1b1409] to-[#3a2a12] border border-[#e2b037]/30 text-[#faeec8] shadow-lg mb-6 animate-in fade-in duration-350">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-4 h-full flex items-center justify-end select-none opacity-20 md:opacity-30 pointer-events-none">
            {/* Angkor Wat towers illustration using simple clean SVG */}
            <svg className="w-56 h-56 text-[#e2b037] filter drop-shadow-[0_0_10px_rgba(226,176,55,0.3)]" viewBox="0 0 100 100" fill="currentColor">
              <path d="M10 90 L90 90 L85 60 L75 60 L70 40 L60 40 L55 20 L45 20 L40 40 L30 40 L25 60 L15 60 Z" opacity="0.2" />
              <path d="M25 90 L75 90 L70 50 L65 50 L60 30 L50 30 L45 50 L35 50 L30 90" opacity="0.4" />
              <path d="M40 90 L60 90 L55 40 L45 40 Z" opacity="0.6" />
            </svg>
          </div>

          <div className="relative z-10 space-y-2 max-w-lg">
            <span className="text-[10px] font-black uppercase tracking-widest bg-[#e2b037]/20 border border-[#e2b037]/30 px-3 py-1 rounded-full text-amber-200">
              🔱 {language === 'kh' ? 'រចនាប័ទ្ម រាជវាំងអង្គរមាស' : 'Royal Angkor Golden Theme'}
            </span>
            <h3 className="text-2xl font-black text-white leading-tight">
              {language === 'kh' ? 'សួស្តីឆ្នាំថ្មី! អាជីវករអង្គរ' : 'Soursei! Angkorian Trader,'} <span className="text-[#dfb035] font-extrabold">លុយផេ Luypay</span>
            </h3>
            <p className="text-xs text-amber-200/80 font-medium leading-relaxed">
              {language === 'kh' 
                ? 'គ្រប់គ្រងហិរញ្ញវត្ថុរបស់អ្នកដោយមោទនភាពជាតិខ្មែរ ជាមួយការកត់ត្រាដែលមានសុវត្ថិភាពខ្ពស់ដូចប្រាសាទថ្មបុរាណ។' 
                : 'Manage your ledger with pride. Secure and solid records, built for long-term growth.'}
            </p>
          </div>
        </div>
      )}

      {appTheme === 'emerald' && (
        <div className="relative rounded-3xl p-6 overflow-hidden bg-gradient-to-r from-[#031d12] to-[#053c25] border border-emerald-500/30 text-[#cbfce2] shadow-lg mb-6 animate-in fade-in duration-350">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-4 h-full flex items-center justify-end select-none opacity-20 md:opacity-30 pointer-events-none">
            {/* Rice stalk / Bamboo leaf SVG */}
            <svg className="w-56 h-56 text-emerald-400 filter drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]" viewBox="0 0 100 100" fill="currentColor">
              <path d="M10 90 Q30 50 80 10 Q60 40 40 90 Z" opacity="0.3" />
              <path d="M20 90 Q40 60 90 20 Q70 50 50 90 Z" opacity="0.5" />
            </svg>
          </div>

          <div className="relative z-10 space-y-2 max-w-lg">
            <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 rounded-full text-emerald-200">
              🌾 {language === 'kh' ? 'រចនាប័ទ្ម មេគង្គមរកត' : 'Mekong Emerald Theme'}
            </span>
            <h3 className="text-2xl font-black text-white leading-tight">
              {language === 'kh' ? 'សួស្តី! អាជីវកម្មរីកចម្រើន' : 'Soursei! Prosperous Partner,'} <span className="text-emerald-300 font-extrabold">លុយផេ Luypay</span>
            </h3>
            <p className="text-xs text-emerald-200/80 font-medium leading-relaxed">
              {language === 'kh' 
                ? 'ប្រមូលផលនិងគ្រប់គ្រងប្រាក់កាក់ប្រកបដោយភាពរីកចម្រើនត្រឈឹងត្រឈៃ ដូចដើមឫស្សីមាត់ទន្លេមេគង្គ។' 
                : 'Grow and yield rich benefits with organic financial stability, matching the Mekong breeze.'}
            </p>
          </div>
        </div>
      )}

      {/* Sleek top header title area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div>
          <h2 className="text-3xl font-black text-black dark:text-white tracking-tight">{t('mainTitle')}</h2>
          <p className="text-black dark:text-white text-sm font-bold mt-1 opacity-90 dark:opacity-100">{t('mainSubtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Elegant Language switcher option */}
          <div id="language-switcher" className="flex bg-slate-200/80 dark:bg-slate-800 border border-slate-300/30 p-1 rounded-xl items-center shadow-xs shrink-0 mr-1.5">
            <motion.button
              id="lang-kh"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLanguage('kh')}
              className={`px-3 py-1.5 text-[10px] font-extrabold rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1 ${
                language === 'kh'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-600'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>🇰🇭</span>
              <span>{t('langKhmer')}</span>
            </motion.button>
            <motion.button
              id="lang-en"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 text-[10px] font-extrabold rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1 ${
                language === 'en'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-600'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>🇺🇸</span>
              <span>{t('langEnglish')}</span>
            </motion.button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={onImportClick}
            accept=".json"
            className="hidden"
          />
          <motion.button
            id="import-data-btn"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleImportButtonClick}
            className={`${getButtonStyleClass(buttonStyle, 'secondary')} px-4 py-2.5 text-xs flex items-center gap-1.5`}
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>{t('importBtn')}</span>
          </motion.button>
          <motion.button
            id="export-data-btn"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBackupClick}
            className={`${getButtonStyleClass(buttonStyle, 'secondary')} px-4 py-2.5 text-xs flex items-center gap-1.5`}
          >
            <ArrowUpFromLine className="w-3.5 h-3.5" />
            <span>{t('backupBtn')}</span>
          </motion.button>
          <motion.button
            id="bulk-auto-check-btn"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBulkAutoCheck}
            className={selectedCount > 0 
              ? `${getButtonStyleClass(buttonStyle, 'success')} px-4 py-2.5 text-xs flex items-center gap-1.5`
              : `${getButtonStyleClass(buttonStyle, 'secondary')} px-4 py-2.5 text-xs opacity-50 flex items-center gap-1.5`
            }
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {language === 'kh' ? 'ទូទាត់ស្វ័យប្រវត្ត' : 'Auto Checking'}
              {selectedCount > 0 ? ` (${selectedCount})` : ''}
            </span>
          </motion.button>
          {onOpenShareholders && (
            <motion.button
              id="shareholders-btn"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenShareholders}
              className={`${getButtonStyleClass(buttonStyle, 'amber')} px-4 py-2.5 text-xs flex items-center gap-1.5 font-black text-amber-950 bg-gradient-to-r from-amber-400 to-yellow-400 border border-amber-300 shadow-sm`}
            >
              <Users className="w-4 h-4 text-amber-950" />
              <span>🤝 {language === 'kh' ? 'ដៃគូភាគហ៊ុន' : 'Shareholders'}</span>
            </motion.button>
          )}
          <motion.button
            id="add-borrower-btn"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAddNewClick}
            className={`${getButtonStyleClass(buttonStyle, 'primary')} px-5 py-2.5 text-xs flex items-center gap-1.5`}
          >
            <span>{t('addBtn')}</span>
          </motion.button>
        </div>
      </div>

      {/* 🚀 COMPACT DIGITAL INTEREST REVENUE ESTIMATOR DASHBOARD */}
      <motion.div
        id="digital-interest-estimator-terminal"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#070c19] border-2 border-[#b37e1b]/60 rounded-xl px-5 py-3 shadow-lg shadow-amber-950/20 relative overflow-hidden text-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-xs select-none"
      >
        {/* SVG Definition of our beautiful gradients */}
        <svg className="absolute w-0 h-0 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="khmer-gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#DFB035" />
              <stop offset="30%" stopColor="#FFF2A3" />
              <stop offset="70%" stopColor="#B37E1B" />
              <stop offset="100%" stopColor="#FAD860" />
            </linearGradient>
          </defs>
        </svg>

        {/* Traditional Khmer Watermark Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath d='M16 0 L32 16 L16 32 L0 16 Z M16 6 L26 16 L16 26 L6 16 Z M16 11 L21 16 L16 21 L11 16 Z' fill='%23dfb035' fill-opacity='1'/%3E%3C/svg%3E")`,
            backgroundSize: '20px 20px'
          }}
        />

        {/* Dynamic sweeping golden shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 pointer-events-none"
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Floating magical gold star sparkles */}
        {[
          { id: 1, left: '12%', delay: 0.1, size: 4 },
          { id: 2, left: '32%', delay: 1.8, size: 5 },
          { id: 3, left: '54%', delay: 0.9, size: 4 },
          { id: 4, left: '76%', delay: 2.7, size: 6 },
          { id: 5, left: '92%', delay: 1.4, size: 5 },
        ].map((spark) => (
          <motion.span
            key={spark.id}
            className="absolute bottom-0 bg-amber-400 rounded-full pointer-events-none opacity-0"
            style={{
              left: spark.left,
              width: spark.size,
              height: spark.size,
            }}
            animate={{
              y: [-10, -110],
              opacity: [0, 0.7, 0.7, 0],
              scale: [0.8, 1.3, 0.8],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              delay: spark.delay,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Blinking 4-point stars */}
        {[
          { id: 'star-1', top: '15%', left: '22%' },
          { id: 'star-2', top: '75%', left: '8%' },
          { id: 'star-3', top: '20%', left: '86%' },
          { id: 'star-4', top: '80%', left: '62%' },
        ].map((star) => (
          <motion.svg
            key={star.id}
            className="absolute w-2 h-2 text-amber-300 pointer-events-none"
            style={{ top: star.top, left: star.left }}
            animate={{
              scale: [0.4, 1.1, 0.4],
              opacity: [0.1, 0.8, 0.1],
            }}
            transition={{
              duration: 2.5 + Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
          </motion.svg>
        ))}

        {/* Inner double border outline frame */}
        <div className="absolute inset-[3px] border border-[#dfb035]/25 rounded-[9px] pointer-events-none" />

        {/* Authentic Khmer Corner Ornaments */}
        <KhmerCorner className="absolute top-[3px] left-[3px] w-5 h-5 pointer-events-none" />
        <KhmerCorner className="absolute top-[3px] right-[3px] w-5 h-5 pointer-events-none rotate-90" />
        <KhmerCorner className="absolute bottom-[3px] left-[3px] w-5 h-5 pointer-events-none -rotate-90" />
        <KhmerCorner className="absolute bottom-[3px] right-[3px] w-5 h-5 pointer-events-none rotate-180" />

        {/* Left Side: Live Title */}
        <div className="flex items-center gap-2 shrink-0 relative z-10 pl-2">
          <span className="flex h-1.5 w-1.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#FFE082] font-mono flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{language === 'kh' ? 'ចំណូលការប្រាក់ឌីជីថល' : 'Digital Interest Estimator'}</span>
          </span>
        </div>

        {/* Center Side: Real-time Output Panel */}
        <div className="flex flex-wrap items-center justify-center gap-4 font-mono relative z-10">
          {/* Daily */}
          <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-900/80 border border-[#dfb035]/20 rounded-lg shadow-inner">
            <span className="text-[10px] text-slate-400 font-bold uppercase">{language === 'kh' ? 'ប្រចាំថ្ងៃ' : 'Daily'}:</span>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white">
                +${interestMetrics.dailyInterestUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold">
                +៛{Math.round(interestMetrics.dailyInterestKHR).toLocaleString('en-US')}
              </span>
            </div>
          </div>

          {/* Weekly */}
          <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-900/80 border border-[#dfb035]/20 rounded-lg shadow-inner">
            <span className="text-[10px] text-slate-400 font-bold uppercase">{language === 'kh' ? 'ប្រចាំសប្តាហ៍' : 'Weekly'}:</span>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white">
                +${interestMetrics.weeklyInterestUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-cyan-400 font-semibold">
                +៛{Math.round(interestMetrics.weeklyInterestKHR).toLocaleString('en-US')}
              </span>
            </div>
          </div>

          {/* Projection Horizon Control & Result */}
          <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-900/80 border border-[#dfb035]/35 rounded-lg ring-1 ring-amber-500/30 shadow-inner">
            <select
              value={customHorizon}
              onChange={(e) => setCustomHorizon(Number(e.target.value))}
              className="bg-transparent text-[10px] text-amber-400 font-bold uppercase border-none focus:ring-0 cursor-pointer outline-none pr-1"
            >
              <option value="1" className="bg-[#0b1329] text-slate-100">1 {language === 'kh' ? 'ថ្ងៃ' : 'Day'}</option>
              <option value="7" className="bg-[#0b1329] text-slate-100">7 {language === 'kh' ? 'ថ្ងៃ' : 'Days'}</option>
              <option value="30" className="bg-[#0b1329] text-slate-100">30 {language === 'kh' ? 'ថ្ងៃ' : 'Days'}</option>
              <option value="90" className="bg-[#0b1329] text-slate-100">90 {language === 'kh' ? 'ថ្ងៃ' : 'Days'}</option>
              <option value="365" className="bg-[#0b1329] text-slate-100">365 {language === 'kh' ? 'ថ្ងៃ' : 'Days'}</option>
            </select>
            <div className="flex items-center gap-2 border-l border-slate-800 pl-2">
              <span className="font-extrabold text-amber-300">
                +${(interestMetrics.dailyInterestUSD * customHorizon).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-amber-200/80 font-semibold">
                +៛{Math.round(interestMetrics.dailyInterestKHR * customHorizon).toLocaleString('en-US')}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Small count */}
        <div className="text-[10px] text-slate-400 font-mono shrink-0 hidden lg:block border-l border-[#dfb035]/20 pl-3 pr-2 relative z-10">
          {language === 'kh' ? `កូនបំណុលសកម្ម៖ ${activeBorrowers.length}` : `Active: ${activeBorrowers.length}`}
        </div>
      </motion.div>

      {/* Grid statistics cards matching Sleek Interface theme */}
      <div id="stats-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Active Borrowers */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.01 }}
          className={`${currentThemeConfig.cardClass} p-5 rounded-2xl flex items-center gap-4 transition-all duration-200 hover:shadow-md`}
        >
          <div className="w-12 h-12 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-xs ${currentThemeConfig.textMuted} font-bold uppercase tracking-wider`}>{t('statsActive')}</p>
            <h3 className={`text-xl font-extrabold ${currentThemeConfig.textTitle} mt-0.5`}>
              {stats.totalActiveLoansCount} <span className="text-xs font-normal text-slate-500">{t('personCount')}</span>
            </h3>
            <p className={`text-[10px] ${currentThemeConfig.textMuted} opacity-80 font-semibold mt-0.5`}>
              {stats.totalCompletedLoansCount} {t('statsCompleted')}
            </p>
          </div>
        </motion.div>

        {/* Card 2: Total Principal */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.01 }}
          className={`${currentThemeConfig.cardClass} p-5 rounded-2xl flex items-center gap-4 transition-all duration-200 hover:shadow-md`}
        >
          <div className="w-12 h-12 bg-amber-500/10 dark:bg-amber-500/20 text-amber-650 dark:text-amber-400 rounded-full flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className={`text-xs ${currentThemeConfig.textMuted} font-bold uppercase tracking-wider`}>{t('statsPrincipal')}</p>
            <div className="mt-1 space-y-0.5">
              <div className={`text-xs font-bold ${currentThemeConfig.textTitle} flex justify-between`}>
                <span>USD:</span>
                <span>{formatMoney(stats.totalPrincipalUSD, 'USD')}</span>
              </div>
              <div className={`text-xs font-bold ${currentThemeConfig.textTitle} flex justify-between`}>
                <span>Riel:</span>
                <span>{formatMoney(stats.totalPrincipalKHR, 'KHR')}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Total Collected */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.01 }}
          className={`${currentThemeConfig.cardClass} p-5 rounded-2xl flex items-center gap-4 transition-all duration-200 hover:shadow-md`}
        >
          <div className="w-12 h-12 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className={`text-xs ${currentThemeConfig.textMuted} font-bold uppercase tracking-wider`}>{t('statsCollected')}</p>
            <div className="mt-1 space-y-0.5">
              <div className="text-xs font-extrabold text-emerald-650 dark:text-emerald-400 flex justify-between">
                <span>USD:</span>
                <span>{formatMoney(stats.totalCollectedUSD, 'USD')}</span>
              </div>
              <div className="text-xs font-extrabold text-emerald-650 dark:text-emerald-400 flex justify-between">
                <span>Riel:</span>
                <span>{formatMoney(stats.totalCollectedKHR, 'KHR')}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Card 4: Total Remaining */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.01 }}
          className={`${currentThemeConfig.cardClass} p-5 rounded-2xl flex items-center gap-4 transition-all duration-200 hover:shadow-md`}
        >
          <div className="w-12 h-12 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center shrink-0">
            <Percent className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className={`text-xs ${currentThemeConfig.textMuted} font-bold uppercase tracking-wider`}>{t('statsRemaining')}</p>
            <div className="mt-1 space-y-0.5">
              <div className="text-xs font-extrabold text-rose-600 dark:text-rose-400 flex justify-between">
                <span>USD:</span>
                <span>{formatMoney(stats.totalExpectedUSD - stats.totalCollectedUSD, 'USD')}</span>
              </div>
              <div className="text-xs font-extrabold text-rose-600 dark:text-rose-400 flex justify-between">
                <span>Riel:</span>
                <span>{formatMoney(stats.totalExpectedKHR - stats.totalCollectedKHR, 'KHR')}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
