import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Zap, 
  QrCode, 
  Send, 
  Cloud, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Database, 
  CheckCircle2, 
  ArrowRight, 
  PhoneCall, 
  MessageSquare, 
  Smartphone, 
  Lock, 
  Award, 
  Layers, 
  Sparkles, 
  X, 
  ChevronRight, 
  BarChart3, 
  Calendar, 
  FileSpreadsheet,
  Check,
  Building2,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface WelcomeLandingProps {
  language: 'kh' | 'en';
  setLanguage: (lang: 'kh' | 'en') => void;
  onOpenLogin: () => void;
  renderSystemLogo: (className?: string) => React.ReactNode;
  systemName: string;
}

export const WelcomeLanding: React.FC<WelcomeLandingProps> = ({
  language,
  setLanguage,
  onOpenLogin,
  renderSystemLogo,
  systemName
}) => {
  // Active demo tab state
  const [activeDemoTab, setActiveDemoTab] = useState<'khqr' | 'schedule' | 'calculator' | 'telegram'>('khqr');
  
  // Interactive KHQR Demo Simulator state
  const [demoAmount, setDemoAmount] = useState<number>(15);
  const [demoBorrowerId, setDemoBorrowerId] = useState<string>('KH-8821');
  const [demoBorrowerName, setDemoBorrowerName] = useState<string>('លី សុខា');
  const [demoPaymentStatus, setDemoPaymentStatus] = useState<'idle' | 'checking' | 'paid'>('idle');
  const [demoLogs, setDemoLogs] = useState<string[]>([]);

  // Interactive Calculator Demo State
  const [calcPrincipal, setCalcPrincipal] = useState<number>(1000);
  const [calcRate, setCalcRate] = useState<number>(1.5); // % per week or month
  const [calcDuration, setCalcDuration] = useState<number>(30); // days

  // Contact / Buy Inquiry Modal State
  const [showInquiryModal, setShowInquiryModal] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('Professional');
  const [inquiryName, setInquiryName] = useState<string>('');
  const [inquiryPhone, setInquiryPhone] = useState<string>('');
  const [inquiryBusiness, setInquiryBusiness] = useState<string>('');
  const [inquiryNote, setInquiryNote] = useState<string>('');
  const [inquirySubmitted, setInquirySubmitted] = useState<boolean>(false);

  // Handle KHQR Simulation action
  const handleSimulatePayment = () => {
    setDemoPaymentStatus('checking');
    setDemoLogs(prev => [`[${new Date().toLocaleTimeString()}] 🏦 ទទួលនិន្ន័យបង់ប្រាក់ពី ABA Merchant Remark: "${demoBorrowerId}"...`, ...prev]);
    
    setTimeout(() => {
      setDemoPaymentStatus('paid');
      setDemoLogs(prev => [
        `[${new Date().toLocaleTimeString()}] ✅ ផ្ទៀងផ្ទាត់ជោគជ័យ! ប្រព័ន្ធបានកត់ត្រាការបង់ប្រាក់ $${demoAmount} ជូន ${demoBorrowerName} (${demoBorrowerId}) រួចរាល់!`,
        `[${new Date().toLocaleTimeString()}] 🤖 ផ្ញើសារបង្កាន់ដៃបង់ប្រាក់ស្វ័យប្រវត្តិទៅ Telegram Bot ជោគជ័យ!`,
        ...prev
      ]);
    }, 1200);
  };

  const handleResetDemo = () => {
    setDemoPaymentStatus('idle');
    setDemoLogs([]);
  };

  // Submit Buy Inquiry
  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName || !inquiryPhone) return;

    setInquirySubmitted(true);
    setTimeout(() => {
      // Construct Telegram deep link for direct instant message
      const msg = encodeURIComponent(
        `Bonjour Admin! ខ្ញុំចង់សាកសួរទិញប្រព័ន្ធ LUY-PAY:\n` +
        `👤 ឈ្មោះ: ${inquiryName}\n` +
        `📞 លេខទូរស័ព្ទ: ${inquiryPhone}\n` +
        `🏢 អាជីវកម្ម: ${inquiryBusiness || 'N/A'}\n` +
        `📦 កញ្ចប់: ${selectedPlan}\n` +
        `📝 ចំណាំ: ${inquiryNote || 'គ្មាន'}`
      );
      window.open(`https://t.me/laymeancamera?text=${msg}`, '_blank');
    }, 1000);
  };

  // Calculations for Calculator Demo
  const dailyInterest = (calcPrincipal * (calcRate / 100)) / 30;
  const totalInterest = dailyInterest * calcDuration;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      
      {/* Background Animated Glowing Orbs - Optimized for Mobile Performance */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Mobile-optimized static subtle glow */}
        <div className="md:hidden absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.12),transparent_40%),radial-gradient(circle_at_80%_60%,rgba(124,58,237,0.1),transparent_40%)]" />

        {/* Desktop animated glowing orbs with GPU acceleration */}
        <div className="hidden md:block">
          <motion.div
            animate={{
              x: [0, 60, -30, 0],
              y: [0, -40, 30, 0],
            }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -left-20 w-[450px] h-[450px] rounded-full bg-blue-600/10 blur-[90px] transform-gpu will-change-transform"
          />
          <motion.div
            animate={{
              x: [0, -50, 40, 0],
              y: [0, 40, -50, 0],
            }}
            transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/3 -right-20 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[100px] transform-gpu will-change-transform"
          />
          <motion.div
            animate={{
              x: [0, 40, -40, 0],
              y: [0, -30, 40, 0],
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-20 left-1/3 w-[450px] h-[450px] rounded-full bg-emerald-500/10 blur-[90px] transform-gpu will-change-transform"
          />
        </div>
        {/* Subtle Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
      </div>

      {/* Navigation Header - Mobile Optimized Backdrop */}
      <header className="sticky top-0 z-40 bg-[#030712]/95 backdrop-blur-md sm:backdrop-blur-xl border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="shrink-0 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              {renderSystemLogo("w-10 h-10 sm:w-11 sm:h-11 shadow-md shadow-blue-500/20")}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg sm:text-xl tracking-tight text-white">{systemName || 'LUY-PAY'}</span>
                <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>v4.8 Enterprise</span>
                </span>
              </div>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider hidden sm:block">
                {language === 'kh' ? 'ប្រព័ន្ធគ្រប់គ្រងការកម្ចី និងគណនេយ្យស្វ័យប្រវត្តិ' : 'Loan & Automated Debt Ledger Platform'}
              </p>
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-300">
            <a href="#overview" className="hover:text-blue-400 transition cursor-pointer">
              {language === 'kh' ? 'អំពីប្រព័ន្ធ' : 'Overview'}
            </a>
            <a href="#features" className="hover:text-blue-400 transition cursor-pointer">
              {language === 'kh' ? 'មុខងារពិសេស' : 'Features'}
            </a>
            <a href="#demos" className="hover:text-blue-400 transition cursor-pointer">
              {language === 'kh' ? 'សាកល្បង Demos' : 'Product Demos'}
            </a>
            <a href="#pricing" className="hover:text-blue-400 transition cursor-pointer">
              {language === 'kh' ? 'កញ្ចប់សេវាកម្ម' : 'Pricing Plans'}
            </a>
            <a href="#contact" className="hover:text-blue-400 transition cursor-pointer">
              {language === 'kh' ? 'ទាក់ទងទិញ' : 'Contact Sales'}
            </a>
          </nav>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setLanguage('kh')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  language === 'kh'
                    ? 'bg-blue-600 text-white font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🇰🇭 ខ្មែរ
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  language === 'en'
                    ? 'bg-blue-600 text-white font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🇺🇸 EN
              </button>
            </div>

            {/* Direct Login Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenLogin}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-black shadow-lg shadow-blue-600/25 border border-blue-400/30 flex items-center gap-2 cursor-pointer transition"
            >
              <Lock className="w-4 h-4" />
              <span>{language === 'kh' ? 'ចូលប្រើប្រព័ន្ធ' : 'Sign In'}</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-12 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Tag Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-black shadow-inner"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                {language === 'kh' 
                  ? 'LUY-PAY - ដំណោះស្រាយគ្រប់គ្រងការកម្ចីប្រាក់ទាន់សម័យ' 
                  : 'LUY-PAY - Next-Gen Loan & Debt Automation'}
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-white"
            >
              {language === 'kh' ? (
                <>
                  គ្រប់គ្រងការកម្ចី <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">ស្វ័យប្រវត្ត ១០០%</span> មិនបាច់ប្រើសៀវភៅ
                </>
              ) : (
                <>
                  Automate Loan Tracking & <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">KHQR Auto Sync</span>
                </>
              )}
            </motion.h1>

            {/* Description Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium"
            >
              {language === 'kh' ? (
                'LUY-PAY គឺជាប្រព័ន្ធគ្រប់គ្រងការកម្ចីប្រាក់ វគ្គសងប្រចាំថ្ងៃ/សប្តាហ៍/ខែ ផ្ទៀងផ្ទាត់ការបង់ប្រាក់ស្វ័យប្រវត្តិជាមួយ ABA Merchant KHQR, ផ្ញើសារបង្កាន់ដៃតាម Telegram Bot, គណនាប្រាក់ដើម-ការប្រាក់ និង Cloud Sync ១០០% សុវត្ថិភាពខ្ពស់បំផុត។'
              ) : (
                'LUY-PAY empowers lenders and loan managers with automated ABA Merchant KHQR payment detection, real-time Telegram Bot receipt alerts, multi-currency USD/KHR accounting, and 100% Cloud Firestore sync.'
              )}
            </motion.p>

            {/* Call to Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2"
            >
              <button
                onClick={onOpenLogin}
                className="px-6 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs sm:text-sm font-black shadow-xl shadow-blue-600/30 border border-blue-400/40 flex items-center gap-2.5 cursor-pointer transition transform hover:-translate-y-0.5"
              >
                <Lock className="w-4 h-4 text-blue-200" />
                <span>{language === 'kh' ? 'ចូលប្រព័ន្ធភ្លាមៗ (Sign In)' : 'Access Platform Now'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#demos"
                className="px-6 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white rounded-2xl text-xs sm:text-sm font-extrabold border border-slate-700/80 flex items-center gap-2 transition cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>{language === 'kh' ? 'មើល Demos ផ្ទាល់' : 'View Interactive Demos'}</span>
              </a>

              <button
                onClick={() => setShowInquiryModal(true)}
                className="px-6 py-3.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-2xl text-xs sm:text-sm font-extrabold border border-emerald-500/40 flex items-center gap-2 transition cursor-pointer"
              >
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                <span>{language === 'kh' ? 'ទាក់ទងទិញ / កញ្ចប់សេវា' : 'Buy / Contact Sales'}</span>
              </button>
            </motion.div>

            {/* Quick Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 max-w-lg mx-auto lg:mx-0 text-left"
            >
              <div>
                <p className="text-xl sm:text-2xl font-black text-white">100%</p>
                <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                  {language === 'kh' ? 'Cloud Sync គ្មានបាត់ទិន្នន័យ' : 'Cloud Sync Safety'}
                </p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-amber-400">0s</p>
                <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                  {language === 'kh' ? 'ABA Auto Checking' : 'Auto Payment Match'}
                </p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-emerald-400">24/7</p>
                <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                  {language === 'kh' ? 'Telegram Receipt Bot' : 'Telegram Alerts'}
                </p>
              </div>
            </motion.div>

          </div>

          {/* Right Preview Card Showcase */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative rounded-3xl bg-slate-900/95 sm:backdrop-blur-xl border border-slate-800 p-4 sm:p-6 shadow-2xl shadow-blue-900/20 space-y-4"
            >
              {/* Top Bar Decoration */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="text-xs font-mono text-slate-400 ml-2 font-bold">LUY-PAY Live Dashboard</span>
                </div>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Realtime Sync</span>
                </span>
              </div>

              {/* Sample Stats Card Inside Showcase */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{language === 'kh' ? 'ប្រាក់កម្ចីដើមសរុប' : 'Total Loans'}</p>
                  <p className="text-lg font-black text-white mt-1">$24,500.00</p>
                  <span className="text-[10px] text-emerald-400 font-bold">↑ +12.5% {language === 'kh' ? 'ខែនេះ' : 'this month'}</span>
                </div>
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{language === 'kh' ? 'ប្រមូលបានសរុប' : 'Total Collected'}</p>
                  <p className="text-lg font-black text-emerald-400 mt-1">$18,920.00</p>
                  <span className="text-[10px] text-slate-400 font-bold">92% {language === 'kh' ? 'អត្រាសង' : 'recovery'}</span>
                </div>
              </div>

              {/* Mini Simulated Live Payment Feed */}
              <div className="bg-slate-950/90 rounded-2xl border border-slate-800 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-extrabold flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-amber-400" />
                    <span>{language === 'kh' ? 'ផ្ទៀងផ្ទាត់ ABA KHQR ថ្មីៗ' : 'Live KHQR Verification'}</span>
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">Auto Checking</span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex items-center justify-between">
                    <div>
                      <p className="text-emerald-300 font-extrabold">លី សុខា (KH-8821)</p>
                      <p className="text-[10px] text-slate-400">ABA Merchant • $15.00</p>
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      ✓ Paid
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-slate-200 font-extrabold">ចាន់ ធារ៉ា (KH-1024)</p>
                      <p className="text-[10px] text-slate-400">Telegram Sync • $20.00</p>
                    </div>
                    <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      ✓ Paid
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Badge Overlay */}
              <div
                className="absolute -bottom-3 left-2 sm:-bottom-4 sm:-left-4 bg-slate-900 border border-blue-500/40 p-2.5 sm:p-3 rounded-2xl shadow-xl flex items-center gap-2.5 sm:gap-3"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                  <Send className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs font-extrabold text-white">Telegram Bot Alerts</p>
                  <p className="text-[9px] sm:text-[10px] text-slate-400">{language === 'kh' ? 'ផ្ញើសារបង្កាន់ដៃភ្លាមៗ 24/7' : 'Instant Receipts Sent'}</p>
                </div>
              </div>

            </motion.div>
          </div>

        </div>
      </section>

      {/* SYSTEM OVERVIEW SECTION */}
      <section id="overview" className="py-20 bg-slate-950/60 border-t border-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              {language === 'kh' ? 'អំពីប្រព័ន្ធ LUY-PAY (លុយផេ)' : 'About LUY-PAY System'}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              {language === 'kh' ? (
                'LUY-PAY ត្រូវបានបង្កើតឡើងយ៉ាងសម្រិតសម្រាំងបំផុតសម្រាប់អ្នកប្រកបអាជីវកម្មផ្តល់កម្ចីប្រាក់ គ្រឹះស្ថានកម្ចីតូចតាច និងម្ចាស់ដើមទុនទាំងអស់ ដើម្បីលុបបំបាត់ការកត់ត្រាលើសៀវភៅក្រដាសដែលប្រឈមនឹងការបាត់បង់ ឬច្រឡំលេខ។'
              ) : (
                'LUY-PAY is meticulously engineered for individual lenders, micro-loan teams, and fund owners to digitize repayment schedules, auto-verify KHQR receipts, and maintain error-free financial ledgers.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-3 hover:border-blue-500/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-white">
                {language === 'kh' ? 'គណនាប្រាក់ដើម-ការប្រាក់ស្វ័យប្រវត្តិ' : 'Automated Interest Calculation'}
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                {language === 'kh'
                  ? 'ប្រព័ន្ធគណនាការប្រាក់ប្រចាំថ្ងៃ សប្តាហ៍ ឬខែ ព្រមទាំងការកាត់ប្រាក់ដើមតាមវគ្គនីមួយៗដោយស្វ័យប្រវត្តិ មិនបាច់ចុចម៉ាស៊ីនគិតលេខ។'
                  : 'Automatic daily, weekly, or monthly interest schedule generation with precise principal deduction calculation.'}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-3 hover:border-blue-500/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-white">
                {language === 'kh' ? 'ABA Merchant KHQR Matching' : 'ABA Merchant Auto Matching'}
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                {language === 'kh'
                  ? 'អតិថិជនគ្រាន់តែបាញ់ QR Code ABA ហើយវាយលេខ ID កូនបំណុលក្នុង Remark នោះប្រព័ន្ធនឹង Auto Checking ភ្លាមៗ។'
                  : 'Borrowers scan ABA KHQR and include their Borrower ID in the Remark; the system detects and updates payments instantly.'}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-3 hover:border-blue-500/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <Cloud className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-white">
                {language === 'kh' ? 'Pure Cloud Sync ១០០%' : '100% Pure Cloud Sync'}
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                {language === 'kh'
                  ? 'ទិន្នន័យទាំងអស់ត្រូវបានរក្សាទុកនៅលើ Cloud Firestore ប្រកបដោយសុវត្ថិភាព អាចប្រើបានលើ Phone, Tablet, Laptop គ្រប់ពេលវេលា។'
                  : 'All records are securely persisted on Cloud Firestore, accessible seamlessly across phones, tablets, and laptops.'}
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ADVANCED FEATURES SECTION */}
      <section id="features" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              {language === 'kh' ? 'មុខងារពិសេសទំនើបៗ' : 'Advanced Capabilities'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              {language === 'kh' ? 'មុខងារពិសេសដែលធ្វើឲ្យ LUY-PAY ជឿជាក់បំផុត' : 'Advanced Features Powered by LUY-PAY'}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              {language === 'kh' ? 'រចនាឡើងយ៉ាងលម្អិតដើម្បីឆ្លើយតបគ្រប់តម្រូវការអាជីវកម្មផ្តល់កម្ចី' : 'Engineered for accuracy, speed, and maximum security'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 transition group space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-white group-hover:text-blue-400 transition">
                {language === 'kh' ? 'ABA Auto Checking ស្វ័យប្រវត្តិ' : 'ABA Auto-Checking Sync'}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                {language === 'kh'
                  ? 'មិនបាច់អង្គុយផ្ទៀងផ្ទាត់ដៃ! ប្រព័ន្ធត្រួតពិនិត្យប្រតិបត្តិការ ABA Merchant ស្វ័យប្រវត្តិនឹងបង់ប្រាក់ជូនកូនបំណុលដោយស្វ័យប្រវត្តិ។'
                  : 'Automate verification for all incoming ABA Merchant transactions using match keys directly.'}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 transition group space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-white group-hover:text-blue-400 transition">
                {language === 'kh' ? 'Telegram Bot Instant Notifications' : 'Telegram Bot Real-time Alerts'}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                {language === 'kh'
                  ? 'ផ្ញើសារបង្កាន់ដៃបង់ប្រាក់ និងរបាយការណ៍បង់ប្រាក់ប្រចាំថ្ងៃទៅកាន់ Telegram Group/Admin ភ្លាមៗ 24ម៉ោង។'
                  : 'Instantly dispatches styled Khmer receipts and daily collection reports to Telegram groups or channels.'}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 transition group space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-white group-hover:text-blue-400 transition">
                {language === 'kh' ? 'គណនេយ្យពីររូបិយវត្ថុ USD / KHR' : 'Dual-Currency USD & KHR Ledger'}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                {language === 'kh'
                  ? 'គាំទ្រការកម្ចីប្រាក់ជាដុល្លារ ($) និងប្រាក់រៀល (៛) ដោយមានអត្រាប្តូរប្រាក់ស្វ័យប្រវត្តិ និងសរុបបញ្ចូលគ្នាប្រកបដោយច្បាស់លាស់។'
                  : 'Full multi-currency support with automated currency conversion and consolidated financial reporting.'}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 transition group space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-white group-hover:text-blue-400 transition">
                {language === 'kh' ? 'Digital Interest Estimator' : 'Digital Interest Estimator'}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                {language === 'kh'
                  ? 'ឧបករណ៍ប៉ាន់ប្រមាណចំណូលការប្រាក់ប្រចាំថ្ងៃ សប្តាហ៍ 30ថ្ងៃ ឬ 365ថ្ងៃ របស់កូនបំណុលទាំងអស់ក្នុងពេល Real-time។'
                  : 'Real-time interest projection tool computing daily, weekly, monthly, and yearly expected revenue.'}
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 transition group space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-white group-hover:text-blue-400 transition">
                {language === 'kh' ? 'Shareholder & Member Portal' : 'Shareholder & Member Roles'}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                {language === 'kh'
                  ? 'បែងចែកសិទ្ធិប្រើប្រាស់សម្រាប់ Admin, ក្រុមការងារ (Members) និងភាគហ៊ុន (Shareholders សម្រាប់មើលរបាយការណ៍ផលចំណេញ)។'
                  : 'Granular permissions for Admins, Staff Members, and Investors/Shareholders with read-only report views.'}
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 transition group space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-white group-hover:text-blue-400 transition">
                {language === 'kh' ? 'Backup / Restore & Excel Export' : 'Cloud Backup & Excel Export'}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                {language === 'kh'
                  ? 'ទាញយកទិន្នន័យជា Excel/JSON ព្រមទាំង Restore ឡើងវិញបានគ្រប់ពេល ដោយមិនបារម្ភពីរឿងបាត់បង់ទិន្នន័យឡើយ។'
                  : 'One-click full system backup, JSON restoration, and Excel sheet export for external offline auditing.'}
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* INTERACTIVE PRODUCT DEMOS SECTION */}
      <section id="demos" className="py-20 bg-slate-950/80 border-t border-b border-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              {language === 'kh' ? 'ផ្ទាំងពិសោធន៍ Product Demos' : 'Interactive System Demos'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              {language === 'kh' ? 'សាកល្បងមុខងារសំខាន់ៗរបស់ LUY-PAY' : 'Test Drive Core Capabilities Live'}
            </h2>
            <p className="text-slate-400 text-sm">
              {language === 'kh' ? 'ចុចលើ Tab ខាងក្រោមដើម្បីសាកល្បងមុខងារនីមួយៗដោយផ្ទាល់' : 'Click the tabs below to simulate live system workflows'}
            </p>
          </div>

          {/* Demo Navigation Tabs - Mobile Touch Scroll Optimized */}
          <div className="flex items-center sm:justify-center gap-2 overflow-x-auto overscroll-x-contain pb-2 sm:pb-0 scrollbar-none bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 max-w-3xl mx-auto -mx-2 px-2 sm:mx-auto">
            <button
              onClick={() => setActiveDemoTab('khqr')}
              className={`shrink-0 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer flex items-center gap-1.5 sm:gap-2 ${
                activeDemoTab === 'khqr'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span>{language === 'kh' ? '1. ABA KHQR Auto Sync' : '1. KHQR Auto Match'}</span>
            </button>

            <button
              onClick={() => setActiveDemoTab('schedule')}
              className={`shrink-0 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer flex items-center gap-1.5 sm:gap-2 ${
                activeDemoTab === 'schedule'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span>{language === 'kh' ? '2. ផ្ទាំងកូនបំណុល' : '2. Borrower Card'}</span>
            </button>

            <button
              onClick={() => setActiveDemoTab('calculator')}
              className={`shrink-0 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer flex items-center gap-1.5 sm:gap-2 ${
                activeDemoTab === 'calculator'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
              <span>{language === 'kh' ? '3. ម៉ាស៊ីនគណនា' : '3. Calculator'}</span>
            </button>

            <button
              onClick={() => setActiveDemoTab('telegram')}
              className={`shrink-0 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer flex items-center gap-1.5 sm:gap-2 ${
                activeDemoTab === 'telegram'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
              <span>{language === 'kh' ? '4. Telegram Bot' : '4. Telegram Alert'}</span>
            </button>
          </div>

          {/* Demo Content Containers */}
          <div className="max-w-4xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative min-h-[380px] flex flex-col justify-center">
            
            {/* DEMO 1: ABA KHQR AUTO MATCH SIMULATOR */}
            {activeDemoTab === 'khqr' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <span>🏦 ABA Merchant KHQR Auto-Checking Simulator</span>
                      <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                        Interactive Demo
                      </span>
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">
                      {language === 'kh' 
                        ? 'សាកល្បងចុច Simulate ABA Payment ដើម្បីមើលរបៀបដែលប្រព័ន្ធផ្ទៀងផ្ទាត់ និងកត់ត្រាស្វ័យប្រវត្តិ!' 
                        : 'Test clicking Simulate Payment to see how LUY-PAY detects and approves KHQR receipts automatically!'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Controls */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400">ឈ្មោះកូនបំណុល (Borrower)</label>
                      <input
                        type="text"
                        value={demoBorrowerName}
                        onChange={(e) => setDemoBorrowerName(e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-400">Borrower Unique ID</label>
                        <input
                          type="text"
                          value={demoBorrowerId}
                          onChange={(e) => setDemoBorrowerId(e.target.value)}
                          className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-extrabold text-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400">ប្រាក់សង ($)</label>
                        <input
                          type="number"
                          value={demoAmount}
                          onChange={(e) => setDemoAmount(Number(e.target.value))}
                          className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-extrabold text-emerald-400"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={handleSimulatePayment}
                        disabled={demoPaymentStatus === 'checking'}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        <span>
                          {demoPaymentStatus === 'checking'
                            ? (language === 'kh' ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'Checking ABA...')
                            : (language === 'kh' ? 'Simulate ABA Payment' : 'Simulate ABA Payment')}
                        </span>
                      </button>
                      <button
                        onClick={handleResetDemo}
                        className="px-3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Right Live Simulation Feed Log */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Live System Event Console</p>
                      <div className="space-y-2 min-h-[140px] max-h-[180px] overflow-y-auto">
                        {demoLogs.length === 0 ? (
                          <p className="text-slate-600 text-center pt-8 italic">
                            {language === 'kh' ? 'ចុច "Simulate ABA Payment" ដើម្បីសាកល្បង...' : 'Click "Simulate ABA Payment" to test...'}
                          </p>
                        ) : (
                          demoLogs.map((log, idx) => (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={idx} className="text-slate-300 text-[11px] leading-relaxed">
                              {log}
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>

                    {demoPaymentStatus === 'paid' && (
                      <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 font-bold text-xs flex items-center justify-between">
                        <span>✓ Status: PAID ($15.00)</span>
                        <span className="text-[10px] text-slate-400">Telegram Notified</span>
                      </div>
                    )}
                  </div>

                </div>
              </motion.div>
            )}

            {/* DEMO 2: BORROWER CARD PREVIEW */}
            {activeDemoTab === 'schedule' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-lg font-black text-white">
                    {language === 'kh' ? 'ទម្រង់ផ្ទាំងកូនបំណុល និងការកត់ត្រាវគ្គសង' : 'Borrower Card & Schedule Tracking'}
                  </h3>
                  <span className="text-xs text-blue-400 font-bold">LUY-PAY UI Component</span>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-base shadow-md">
                        សុ
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-white">លី សុខា</p>
                          <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-500/30">
                            KH-8821
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">កម្ចីដើម: $1,000 | វគ្គសង: $10/ថ្ងៃ (30 វគ្គ)</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-slate-400 font-bold">{language === 'kh' ? 'នៅសល់ប្រាក់ដើម' : 'Remaining Balance'}</p>
                      <p className="text-base font-black text-amber-400">$700.00</p>
                    </div>
                  </div>

                  {/* Sample Installment Slots Grid */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {language === 'kh' ? 'វគ្គសងប្រចាំថ្ងៃ (30 ថ្ងៃ):' : 'Daily Installment Slots (30 Days):'}
                    </p>
                    <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 text-center text-[10px] font-mono font-black">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={`p-2 rounded-lg border ${
                            i < 3
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : i === 3
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
                              : 'bg-slate-900 text-slate-500 border-slate-800'
                          }`}
                        >
                          <div>#{i + 1}</div>
                          <div>{i < 3 ? '✓ $10' : i === 3 ? 'Today' : '$10'}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-900">
                    <span>{language === 'kh' ? 'បានសងរួច 3/30 វគ្គ (10%)' : 'Paid 3/30 slots (10%)'}</span>
                    <span className="text-emerald-400 font-extrabold">{language === 'kh' ? '✓ គ្មានថ្ងៃហួសកំណត់' : '✓ No Late Overdues'}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* DEMO 3: INTEREST CALCULATOR DEMO */}
            {activeDemoTab === 'calculator' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-lg font-black text-white">
                    {language === 'kh' ? 'ម៉ាស៊ីនគណនាប្រាក់ដើម និងការប្រាក់ (Interest Estimator)' : 'Real-time Interest Estimator'}
                  </h3>
                  <span className="text-xs text-purple-400 font-bold">Interactive Calculator</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <label className="text-xs font-bold text-slate-400">{language === 'kh' ? 'ប្រាក់ដើមកម្ចី ($)' : 'Principal Amount ($)'}</label>
                    <input
                      type="number"
                      value={calcPrincipal}
                      onChange={(e) => setCalcPrincipal(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-black text-white"
                    />
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <label className="text-xs font-bold text-slate-400">{language === 'kh' ? 'អត្រាការប្រាក់ (%/ខែ)' : 'Monthly Interest Rate (%)'}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={calcRate}
                      onChange={(e) => setCalcRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-black text-purple-400"
                    />
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <label className="text-xs font-bold text-slate-400">{language === 'kh' ? 'ចំនួនថ្ងៃកម្ចី (Days)' : 'Loan Period (Days)'}</label>
                    <input
                      type="number"
                      value={calcDuration}
                      onChange={(e) => setCalcDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-black text-amber-400"
                    />
                  </div>
                </div>

                {/* Calculation Output Box */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-slate-400 font-bold">{language === 'kh' ? 'ការប្រាក់ប្រចាំថ្ងៃ' : 'Daily Interest'}</p>
                    <p className="text-xl font-black text-emerald-400 mt-1">${dailyInterest.toFixed(2)}</p>
                    <p className="text-[10px] text-slate-500">៛{Math.round(dailyInterest * 4000).toLocaleString()}</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400 font-bold">{language === 'kh' ? 'សរុបការប្រាក់ទទួលបាន' : 'Total Interest Earned'}</p>
                    <p className="text-xl font-black text-purple-400 mt-1">${totalInterest.toFixed(2)}</p>
                    <p className="text-[10px] text-slate-500">៛{Math.round(totalInterest * 4000).toLocaleString()}</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400 font-bold">{language === 'kh' ? 'ប្រាក់សរុបត្រូវប្រមូល' : 'Total Outstanding'}</p>
                    <p className="text-xl font-black text-amber-400 mt-1">${(calcPrincipal + totalInterest).toFixed(2)}</p>
                    <p className="text-[10px] text-slate-500">៛{Math.round((calcPrincipal + totalInterest) * 4000).toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* DEMO 4: TELEGRAM BOT RECEIPT PREVIEW */}
            {activeDemoTab === 'telegram' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-md mx-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-cyan-400" />
                    <span>Telegram Receipt Format</span>
                  </h3>
                  <span className="text-xs text-cyan-400 font-bold">24/7 Bot Dispatched</span>
                </div>

                <div className="bg-[#18222d] p-4 rounded-2xl border border-slate-700/80 font-sans text-xs text-slate-200 space-y-2.5 shadow-xl">
                  <div className="flex items-center gap-2 border-b border-slate-700/60 pb-2">
                    <div className="w-7 h-7 rounded-full bg-blue-500 text-white font-black text-xs flex items-center justify-center">
                      🤖
                    </div>
                    <div>
                      <p className="font-extrabold text-white text-xs">LUY-PAY Payment Bot</p>
                      <p className="text-[9px] text-slate-400">bot @luypay_checking_bot</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 leading-relaxed font-mono text-[11px]">
                    <p className="text-emerald-400 font-bold"><b>✅ [ប្រព័ន្ធបានផ្ទៀងផ្ទាត់បង់ប្រាក់ស្វ័យប្រវត្ត - Telegram Sync]</b></p>
                    <p>👤 <b>កូនបំណុល:</b> លី សុខា (KH-8821)</p>
                    <p>💵 <b>ប្រាក់បង់:</b> $15.00 (វគ្គទី 4/30)</p>
                    <p>📅 <b>កាលបរិច្ឆេទ:</b> {new Date().toLocaleDateString()}</p>
                    <p>📝 <b>ចំណាំ:</b> ABA Merchant Auto Matching</p>
                    <p className="text-emerald-300 font-extrabold">✔️ <b>ស្ថានភាព:</b> បានបង់ប្រាក់រួចរាល់</p>
                  </div>

                  <div className="text-[9px] text-slate-500 text-right pt-1 border-t border-slate-700/40">
                    {new Date().toLocaleTimeString()} ✓✓
                  </div>
                </div>
              </motion.div>
            )}

          </div>

        </div>
      </section>

      {/* PRICING & SUBSCRIPTION PACKAGES SECTION */}
      <section id="pricing" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              {language === 'kh' ? 'កញ្ចប់សេវាកម្មទិញប្រើប្រាស់' : 'LUY-PAY License Pricing'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              {language === 'kh' ? 'ជ្រើសរើសកញ្ចប់ប្រព័ន្ធដែលសមស្របនឹងអាជីវកម្ម' : 'Choose Your LUY-PAY System License'}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              {language === 'kh' ? 'គ្មានថ្លៃសេវាកំបាំងមុខ គាំទ្របច្ចេកទេស និងបង្រៀនប្រើប្រាស់ដោយផ្ទាល់ ២៤/៧' : 'Transparent options with 24/7 dedicated Khmer technical setup'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Plan 1: Starter */}
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6 flex flex-col justify-between hover:border-slate-700 transition">
              <div className="space-y-4">
                <span className="text-xs font-black uppercase text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                  Starter Plan
                </span>
                <h3 className="text-xl font-black text-white">សម្រាប់ម្ចាស់ដើមទុនតូចតាច</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">$15</span>
                  <span className="text-xs text-slate-400">/ ខែ (Monthly)</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'kh' ? 'ស័ក្តិសមសម្រាប់អ្នកកម្ចីម្នាក់ឯង ឬដើមទុនដំបូង' : 'Ideal for solo individual lenders starting out.'}
                </p>

                <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>កត់ត្រាកូនបំណុលបានរហូតដល់ 50 នាក់</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Pure Cloud Sync 100% គ្មានបាត់ទិន្នន័យ</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>គណនាប្រាក់ដើម-ការប្រាក់ស្វ័យប្រវត្តិ</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Export របាយការណ៍ជា Excel</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setSelectedPlan('Starter Plan');
                  setShowInquiryModal(true);
                }}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold rounded-2xl text-xs transition cursor-pointer"
              >
                {language === 'kh' ? 'ជ្រើសរើស Starter' : 'Select Starter'}
              </button>
            </div>

            {/* Plan 2: Professional (RECOMMENDED) */}
            <div className="p-8 rounded-3xl bg-slate-900/90 border-2 border-blue-500/60 space-y-6 flex flex-col justify-between relative shadow-2xl shadow-blue-900/30 transform lg:-translate-y-2">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase px-4 py-1 rounded-full shadow-md">
                ⭐ ពេញនិយមបំផុត (Most Popular)
              </div>

              <div className="space-y-4">
                <span className="text-xs font-black uppercase text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                  Professional Plan
                </span>
                <h3 className="text-xl font-black text-white">សម្រាប់អាជីវកម្មកម្ចីទូទៅ</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-blue-400">$29</span>
                  <span className="text-xs text-slate-400">/ ខែ (Monthly)</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'kh' ? 'មុខងារពេញលេញ ជាមួយ ABA Auto Match & Telegram Bot' : 'Complete solution with KHQR Auto Match and Telegram Receipts.'}
                </p>

                <ul className="space-y-2.5 text-xs text-slate-200 pt-4 border-t border-slate-800">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-bold text-white">កត់ត្រាកូនបំណុលមិនកំណត់ (Unlimited Borrowers)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-bold text-amber-300">ABA Merchant KHQR Auto Checking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="font-bold text-cyan-300">Telegram Bot Dispatched Receipts 24/7</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>គណនេយ្យពីររូបិយវត្ថុ USD / KHR</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>សិទ្ធិប្រើប្រាស់ Member & Shareholder Views</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setSelectedPlan('Professional Plan');
                  setShowInquiryModal(true);
                }}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-2xl text-xs transition cursor-pointer shadow-lg shadow-blue-600/30"
              >
                {language === 'kh' ? 'ជ្រើសរើស Professional' : 'Select Professional'}
              </button>
            </div>

            {/* Plan 3: Enterprise / Lifetime */}
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6 flex flex-col justify-between hover:border-slate-700 transition">
              <div className="space-y-4">
                <span className="text-xs font-black uppercase text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                  Enterprise Unlimited
                </span>
                <h3 className="text-xl font-black text-white">សម្រាប់ក្រុមហ៊ុន / ទិញផ្ដាច់</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-purple-400">ទាក់ទងទិញ</span>
                  <span className="text-xs text-slate-400">(Custom/Lifetime)</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'kh' ? 'ទិញអាជ្ញាប័ណ្ណប្រើរហូត ព្រមទាំងរៀបចំ Domain ផ្ទាល់ខ្លួន' : 'Custom domain installation and lifetime server ownership.'}
                </p>

                <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>គ្រប់មុខងារទាំងអស់របស់ប្រព័ន្ធ LUY-PAY</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>ដំឡើងលើ Custom Domain / Brand ផ្ទាល់ខ្លួន</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>បណ្តុះបណ្តាល និង Setup ផ្ទាល់ដល់កន្លែង</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setSelectedPlan('Enterprise Unlimited');
                  setShowInquiryModal(true);
                }}
                className="w-full py-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-extrabold rounded-2xl text-xs border border-purple-500/30 transition cursor-pointer"
              >
                {language === 'kh' ? 'ទាក់ទង Enterprise' : 'Contact Enterprise'}
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* FOOTER & CONTACT SECTION */}
      <footer id="contact" className="py-16 bg-slate-950 border-t border-slate-900 text-slate-400 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center justify-between">
            <div className="md:col-span-6 space-y-3">
              <div className="flex items-center gap-3">
                {renderSystemLogo("w-9 h-9")}
                <span className="font-black text-xl text-white">{systemName || 'LUY-PAY'}</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-400 max-w-md">
                {language === 'kh' 
                  ? 'LUY-PAY - ប្រព័ន្ធគ្រប់គ្រងការកម្ចីប្រាក់ វគ្គសង និងគណនេយ្យស្វ័យប្រវត្តិកម្រិតខ្ពស់បំផុតក្នុងប្រទេសកម្ពុជា។' 
                  : 'LUY-PAY - Premier automated loan management and debt ledger platform in Cambodia.'}
              </p>
            </div>

            <div className="md:col-span-6 flex flex-wrap items-center justify-start md:justify-end gap-3">
              <button
                onClick={() => setShowInquiryModal(true)}
                className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>{language === 'kh' ? 'ទាក់ទងទិញប្រព័ន្ធ / សាកល្បង' : 'Contact Sales & Trial'}</span>
              </button>

              <a
                href="https://t.me/laymeancamera"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-bold border border-slate-800 flex items-center gap-2 transition"
              >
                <Send className="w-4 h-4 text-cyan-400" />
                <span>Telegram: @laymeancamera</span>
              </a>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 text-center text-[11px] text-slate-600 font-mono flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>© {new Date().getFullYear()} LUY-PAY System. All rights reserved.</p>
            <p>{language === 'kh' ? 'អភិវឌ្ឍន៍ដោយភាពសម្រិតសម្រាំងសម្រាប់ទីផ្សារកម្ពុជា' : 'Crafted with precision for Cambodian business lenders'}</p>
          </div>

        </div>
      </footer>

      {/* CONTACT & BUY INQUIRY MODAL */}
      <AnimatePresence>
        {showInquiryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-2xl"
            >
              <button
                onClick={() => {
                  setShowInquiryModal(false);
                  setInquirySubmitted(false);
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                  {language === 'kh' ? 'ទាក់ទងទិញ / សាកសួរព័ត៌មាន' : 'Purchase & Trial Inquiry'}
                </span>
                <h3 className="text-xl font-black text-white">
                  {language === 'kh' ? 'ស្នើសុំទិញប្រព័ន្ធ LUY-PAY' : 'Inquire for LUY-PAY License'}
                </h3>
                <p className="text-xs text-slate-400">
                  {language === 'kh' ? 'សូមបញ្ចូលព័ត៌មានខាងក្រោម ប្រព័ន្ធនឹងផ្ញើសារទៅកាន់ Telegram Admin ភ្លាមៗ' : 'Fill out details to connect with our Telegram technical team directly.'}
                </p>
              </div>

              {inquirySubmitted ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold">
                    ✓
                  </div>
                  <h4 className="text-lg font-black text-white">
                    {language === 'kh' ? 'បានផ្ញើការស្នើសុំជោគជ័យ!' : 'Inquiry Sent Successfully!'}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    {language === 'kh' ? 'ប្រព័ន្ធបានបើក Telegram ដើម្បីផ្ញើសារទៅ Admin ឡាយមាន រួចរាល់។' : 'Redirected to Telegram Admin @laymeancamera for quick chat.'}
                  </p>
                  <button
                    onClick={() => {
                      setShowInquiryModal(false);
                      setInquirySubmitted(false);
                    }}
                    className="mt-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl"
                  >
                    {language === 'kh' ? 'បិទផ្ទាំងនេះ' : 'Close'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitInquiry} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300">ឈ្មោះរបស់អ្នក (Your Name) *</label>
                    <input
                      type="text"
                      required
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      placeholder="ឧទាហរណ៍: សុខ ជា"
                      className="w-full mt-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300">លេខទូរស័ព្ទ / Telegram *</label>
                      <input
                        type="text"
                        required
                        value={inquiryPhone}
                        onChange={(e) => setInquiryPhone(e.target.value)}
                        placeholder="096 888 8xxx"
                        className="w-full mt-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300">កញ្ចប់សេវា (Plan Choice)</label>
                      <select
                        value={selectedPlan}
                        onChange={(e) => setSelectedPlan(e.target.value)}
                        className="w-full mt-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Starter Plan">Starter Plan ($15/mo)</option>
                        <option value="Professional Plan">Professional Plan ($29/mo)</option>
                        <option value="Enterprise Unlimited">Enterprise Unlimited</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300">ឈ្មោះអាជីវកម្ម / ក្រុមហ៊ុន (Business Name)</label>
                    <input
                      type="text"
                      value={inquiryBusiness}
                      onChange={(e) => setInquiryBusiness(e.target.value)}
                      placeholder="ឧទាហរណ៍: អាជីវកម្មកម្ចី សុខជា"
                      className="w-full mt-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300">ចំណាំ ឬសំណួរផ្សេងៗ (Optional Note)</label>
                    <textarea
                      rows={2}
                      value={inquiryNote}
                      onChange={(e) => setInquiryNote(e.target.value)}
                      placeholder="ចង់បានការបង្រៀនប្រើប្រាស់ដោយផ្ទាល់..."
                      className="w-full mt-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <Send className="w-4 h-4 text-cyan-300" />
                    <span>{language === 'kh' ? 'ផ្ញើសារទាក់ទងទិញតាម Telegram' : 'Send Inquiry via Telegram'}</span>
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default WelcomeLanding;
