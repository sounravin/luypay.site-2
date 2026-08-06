import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  CheckCircle2, 
  QrCode, 
  Search, 
  Plus, 
  Settings, 
  Home, 
  FileText, 
  Bell, 
  Lock, 
  Star, 
  MessageCircle, 
  Zap, 
  ShieldCheck, 
  Send, 
  PhoneCall, 
  Check, 
  ExternalLink 
} from 'lucide-react';

interface IPhoneAppShowcaseProps {
  language: 'kh' | 'en';
}

export const IPhoneAppShowcase: React.FC<IPhoneAppShowcaseProps> = ({ language }) => {
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  const slideTitles = language === 'kh' ? [
    { title: 'ផ្ទាំងដើមប្រព័ន្ធ', subtitle: 'Home Header & Banner' },
    { title: 'បញ្ជីអ្នកខ្ចី & ស្ថានភាព', subtitle: 'Borrowers & Debt Filter' },
    { title: 'កាតគ្រឹះសងប្រាក់', subtitle: 'Installment Checkboard' },
    { title: 'លិខិតសងប្រាក់អនឡាញ', subtitle: 'Public Receipt Statement' }
  ] : [
    { title: 'System Home Dashboard', subtitle: 'Home Header & Banner' },
    { title: 'Borrowers & Debt Filter', subtitle: 'Borrower list & status' },
    { title: 'Installment Checkboard', subtitle: 'Interactive 15 installments' },
    { title: 'Public Receipt Page', subtitle: 'Live customer statement' }
  ];

  // Auto slide timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleNext = () => {
    setActiveSlide((prev) => (prev + 1) % 4);
  };

  const handlePrev = () => {
    setActiveSlide((prev) => (prev - 1 + 4) % 4);
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-md mx-auto py-2">
      {/* Ambient Background Aura Glow behind Phone */}
      <div className="absolute -inset-6 bg-gradient-to-r from-blue-600/30 via-amber-500/20 to-emerald-500/30 rounded-[3.5rem] blur-3xl opacity-80 animate-pulse pointer-events-none" />

      {/* Slide Navigation Header Bar */}
      <div className="relative z-20 w-full mb-5 flex items-center justify-between bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 p-2.5 sm:p-3 rounded-2xl shadow-xl shadow-black/40">
        <div className="flex items-center gap-2.5 pl-2">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 relative" />
          </div>
          <div>
            <p className="text-xs font-black text-white leading-tight flex items-center gap-1.5">
              <span>{slideTitles[activeSlide].title}</span>
            </p>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wide">
              {activeSlide + 1} / 4 • {slideTitles[activeSlide].subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* PHYSICAL IPHONE 16 PRO MAX CHASSIS */}
      <div className="relative w-full max-w-[340px] aspect-[9/18.8] bg-gradient-to-b from-slate-900 via-slate-950 to-black rounded-[52px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] border-[5px] border-slate-700/90 ring-1 ring-white/20 flex flex-col overflow-hidden">
        
        {/* Physical Side Buttons on Frame */}
        <div className="absolute top-24 -left-[7px] w-[3px] h-8 bg-slate-600/90 rounded-l-md shadow-sm" /> {/* Mute Switch */}
        <div className="absolute top-36 -left-[7px] w-[3px] h-12 bg-slate-600/90 rounded-l-md shadow-sm" /> {/* Vol Up */}
        <div className="absolute top-52 -left-[7px] w-[3px] h-12 bg-slate-600/90 rounded-l-md shadow-sm" /> {/* Vol Down */}
        <div className="absolute top-40 -right-[7px] w-[3px] h-16 bg-slate-600/90 rounded-r-md shadow-sm" /> {/* Power Button */}

        {/* Dynamic Island Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 w-28 h-5.5 bg-black rounded-full flex items-center justify-between px-2.5 shadow-md border border-slate-800/80">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-blue-500/80 animate-pulse" />
          </div>
          <div className="w-2 h-2 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center">
            <div className="w-0.5 h-0.5 rounded-full bg-emerald-400" />
          </div>
        </div>

        {/* Screen Top Status Bar */}
        <div className="relative z-30 pt-1 pb-2 px-5 flex items-center justify-between text-[11px] font-bold text-slate-200 font-mono select-none">
          <span>9:41</span>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="text-[9px] font-mono text-slate-400">5G</span>
            <div className="w-5 h-2.5 rounded-xs border border-slate-300 p-0.5 flex items-center">
              <div className="h-full w-[80%] bg-emerald-400 rounded-2xs" />
            </div>
          </div>
        </div>

        {/* SCREEN INNER CONTENT CONTAINER */}
        <div className="relative flex-1 w-full bg-[#060b17] rounded-[38px] overflow-hidden flex flex-col border border-slate-800/80 shadow-inner">
          <AnimatePresence mode="wait">
            
            {/* SLIDE 0: HOME DASHBOARD & PROMO BANNER */}
            {activeSlide === 0 && (
              <motion.div
                key="slide-0"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="h-full w-full flex flex-col justify-between p-3 text-white overflow-y-auto no-scrollbar space-y-2.5"
              >
                {/* Header Profile & System Logo */}
                <div className="p-2.5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/90 shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700/80 p-0.5 shadow-md flex items-center justify-center overflow-hidden">
                        <img 
                          src="/official_logo.svg" 
                          alt="លុយឆក&លុយឈ្នួល Logo" 
                          className="w-full h-full object-contain rounded-lg"
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white flex items-center gap-1 leading-tight">
                          លុយឆក&amp;លុយឈ្នួល
                        </h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[8.5px] text-slate-300 font-semibold truncate max-w-[110px]">
                            Soun Ravin (sounravin)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <div className="relative p-1.5 rounded-lg bg-slate-800 text-amber-400 border border-slate-700">
                        <Bell className="w-3.5 h-3.5" />
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center">
                          4
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Star Sponsor Banner Indicator */}
                  <div className="flex items-center justify-between text-[8.5px] text-amber-300 font-extrabold bg-amber-500/15 px-2.5 py-1 rounded-xl border border-amber-500/30">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> ឧកញ៉ាគាំទ្រ (VIP)
                    </span>
                    <span className="text-slate-200">ប្រព័ន្ធគ្រប់គ្រងលុយឆក</span>
                  </div>
                </div>

                {/* Promo Card Banner */}
                <div className="relative rounded-2xl bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 p-3 border border-blue-500/40 shadow-xl overflow-hidden space-y-2">
                  <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 w-20 h-20 bg-blue-500/20 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      ⚡
                    </div>
                    <span className="text-[10px] font-black text-emerald-400 tracking-wide uppercase">
                      លុយឆក & លុយឈ្នួល
                    </span>
                  </div>

                  <p className="text-[11px] font-black leading-snug text-white">
                    កម្មវិធីកត់ត្រាយលុយឆក&លុយឈ្នួល: ងាយស្រួល, សុវត្ថិភាព, លឿន!
                  </p>
                  <p className="text-[8.5px] text-slate-300 leading-tight">
                    គ្រប់គ្រងប្រាក់កម្ចី, គណនាសងប្រាក់, តាមដានចំណូលចំណាយ
                  </p>

                  <button className="w-full py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-xl text-[10px] font-black shadow-md flex items-center justify-center gap-1 cursor-pointer">
                    <span>ទិញឥឡូវនេះ BUY NOW</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* System Control Grid Action Buttons */}
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-1.5 text-[8.5px]">
                    <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-center gap-1 text-slate-200 font-bold">
                      <span>🇰🇭 ខ្មែរ</span>
                      <span className="text-slate-600">|</span>
                      <span>🇺🇸 English</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-center gap-1 text-slate-200 font-bold">
                      <span>📥 នាំចូលទិន្នន័យ (Import)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[8.5px]">
                    <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-center gap-1 text-slate-200 font-bold">
                      <span>⬆️ រក្សាទុក (Backup)</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-center gap-1 text-slate-200 font-bold">
                      <span>🔄 ទូទាត់ស្វ័យប្រវត្តិ</span>
                    </div>
                  </div>

                  <button className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black shadow-md flex items-center justify-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ បន្ថែមអ្នកខ្ចីថ្មី</span>
                  </button>
                </div>

                {/* Bottom App Navigation Dock */}
                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-5 gap-1 text-[8px] text-slate-400 text-center font-bold">
                  <div className="flex flex-col items-center text-emerald-400">
                    <Home className="w-3.5 h-3.5" />
                    <span>ទំព័រដើម</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <FileText className="w-3.5 h-3.5" />
                    <span>សំណើ</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-5.5 h-5.5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-md">
                      +
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <Settings className="w-3.5 h-3.5" />
                    <span>ការកំណត់</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Zap className="w-3.5 h-3.5" />
                    <span>ម៉ឺនុយ</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SLIDE 1: BORROWERS LIST & STATUS FILTERS */}
            {activeSlide === 1 && (
              <motion.div
                key="slide-1"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="h-full w-full flex flex-col justify-between p-3 text-white overflow-y-auto no-scrollbar space-y-2.5"
              >
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="text" 
                    readOnly 
                    value="🔍 ស្វែងរកតាមឈ្មោះ ឬលេខទូរស័ព្ទ..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-[9.5px] text-slate-300 font-medium select-none cursor-default"
                  />
                </div>

                {/* Standing Filters */}
                <div className="space-y-1">
                  <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider">
                    ស្ថានភាពកូនបំណុល (STANDING):
                  </p>
                  <div className="flex flex-wrap gap-1 text-[8px] font-bold">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-amber-500/30">
                      ⭐ ទាំងអស់ (1)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
                      🟢 ល្អ (Good) (1)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                      🟡 ធម្មតា (0)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                      ⏰ ជិតដល់ពេល (1)
                    </span>
                  </div>
                </div>

                {/* Borrower Card Showcase */}
                <div className="rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-blue-500/30 p-3 space-y-2 shadow-xl">
                  {/* Borrower Details Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 via-blue-500 to-emerald-400 p-0.5 shadow-md">
                        <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center font-black text-xs text-amber-300">
                          សុខដា
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs text-white">សុខដា</span>
                          <span className="text-[8.5px] font-mono text-blue-300 bg-blue-500/20 px-1.5 py-0.2 rounded border border-blue-500/30">
                            KH-1001
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[8.5px] text-slate-400 mt-0.5">
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-extrabold text-[7.5px]">
                            ⚡ លុយឆក
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-extrabold text-[7.5px]">
                            🟢 ល្អ
                          </span>
                        </div>
                        <p className="text-[8.5px] text-slate-400 font-mono mt-0.5">
                          📞 012348981
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[8.5px] text-blue-400 font-bold block">
                        កំពុងសង (0/15 វគ្គ)
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8.5px] font-bold">
                      <span className="text-slate-400">វឌ្ឍនភាព (Progress)</span>
                      <span className="text-blue-400 font-black">0%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full w-[6%] bg-blue-500 rounded-full" />
                    </div>
                  </div>

                  {/* Financial Stats Grid */}
                  <div className="grid grid-cols-2 gap-1.5 text-[8.5px] p-2 bg-slate-950/80 rounded-xl border border-slate-800/80">
                    <div>
                      <span className="text-slate-400 block text-[7.5px]">ប្រាក់បានសងសរុប</span>
                      <span className="font-black text-white text-xs">$0</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[7.5px]">ប្រាក់នៅសល់សរុប</span>
                      <span className="font-black text-amber-400 text-xs">$60</span>
                    </div>
                  </div>

                  {/* Borrower Quick Action Buttons */}
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    <button className="py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-[8.5px] flex items-center justify-center gap-1 shadow-sm">
                      <QrCode className="w-3 h-3" />
                      <span>បង្ហាញ QR</span>
                    </button>
                    <button className="py-1.5 rounded-xl bg-blue-600 text-white font-black text-[8.5px] flex items-center justify-center gap-1 shadow-sm">
                      <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                      <span>សងរហ័ស</span>
                    </button>
                  </div>
                </div>

                {/* Bottom App Navigation Dock */}
                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-5 gap-1 text-[8px] text-slate-400 text-center font-bold">
                  <div className="flex flex-col items-center">
                    <Home className="w-3.5 h-3.5" />
                    <span>ទំព័រដើម</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <FileText className="w-3.5 h-3.5" />
                    <span>សំណើ</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-5.5 h-5.5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-md">
                      +
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <Settings className="w-3.5 h-3.5" />
                    <span>ការកំណត់</span>
                  </div>
                  <div className="flex flex-col items-center text-emerald-400">
                    <Zap className="w-3.5 h-3.5" />
                    <span>ម៉ឺនុយ</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SLIDE 2: INSTALLMENT CHECKBOARD */}
            {activeSlide === 2 && (
              <motion.div
                key="slide-2"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="h-full w-full flex flex-col justify-between p-2.5 text-white overflow-y-auto no-scrollbar space-y-2"
              >
                {/* Borrower Header Banner */}
                <div className="p-2.5 rounded-2xl bg-white text-slate-900 space-y-1.5 shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                      សុខដា
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 leading-none">សុខដា</h4>
                      <p className="text-[8.5px] text-slate-500 font-mono mt-0.5">📞 012348981</p>
                    </div>
                  </div>

                  <button className="w-full py-1.5 bg-blue-600 text-white rounded-xl text-[9px] font-black flex items-center justify-center gap-1 shadow-sm">
                    <MessageCircle className="w-3 h-3" />
                    <span>ផ្ញើសាររំលឹក & គណសងប្រាក់</span>
                  </button>

                  <div className="grid grid-cols-2 gap-1 text-[8px] font-extrabold">
                    <div className="p-1 rounded bg-amber-100 text-amber-800 text-center">
                      បង្ហាញ QR សម្រាប់បង់លុយ
                    </div>
                    <div className="p-1 rounded bg-slate-100 text-slate-700 text-center">
                      ✏️ កែប្រែ
                    </div>
                  </div>
                </div>

                {/* 15 Installment Grid Cards */}
                <div className="rounded-2xl bg-slate-900 border border-slate-800 p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-[9.5px] font-black text-white flex items-center gap-1">
                        💳 កាតគ្រឹះសងប្រាក់ (Installment Checkboard)
                      </h5>
                      <p className="text-[7.5px] text-slate-400">
                        ចុចលើប្រអប់លេខនីមួយៗ ដើម្បីកត់ត្រាសងប្រាក់រហ័ស
                      </p>
                    </div>
                  </div>

                  <button className="w-full py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[8.5px] font-black">
                    ✓ ទូទាត់រហ័សគ្រប់វគ្គ
                  </button>

                  {/* 15 Installments Interactive Grid */}
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((num) => (
                      <div
                        key={num}
                        className="p-1 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400 transition flex flex-col items-center justify-center shadow-inner"
                      >
                        <span className="text-[7px] text-slate-400">វគ្គទី</span>
                        <span className="text-xs font-black text-slate-100">{num}</span>
                        <span className="text-[8px] font-mono text-amber-400">$4</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* SLIDE 3: PUBLIC RECEIPT / ELECTRONIC STATEMENT */}
            {activeSlide === 3 && (
              <motion.div
                key="slide-3"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="h-full w-full flex flex-col justify-between p-2.5 text-slate-900 bg-slate-100 overflow-y-auto no-scrollbar space-y-2"
              >
                {/* Top Ticker Notification */}
                <div className="p-2 rounded-xl bg-amber-400 text-slate-950 text-[8.5px] font-black flex items-center justify-between shadow-sm">
                  <span className="truncate max-w-[180px]">📢 Pich Rachana Telegram: 010 642 626</span>
                  <span className="bg-slate-950 text-amber-300 text-[7.5px] px-1.5 py-0.5 rounded shrink-0">
                    សេចក្តីជូនដំណឹង
                  </span>
                </div>

                {/* System Logo Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-700 p-0.5 shadow-sm overflow-hidden flex items-center justify-center">
                      <img 
                        src="/official_logo.svg" 
                        alt="លុយឆក&លុយឈ្នួល Logo" 
                        className="w-full h-full object-contain rounded"
                      />
                    </div>
                    <div>
                      <p className="text-[9.5px] font-black leading-none">លុយឆក&amp;លុយឈ្នួល</p>
                      <p className="text-[7px] text-slate-500 font-semibold">លិខិតសងប្រាក់អេឡិចត្រូនិក</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[7.5px] font-extrabold border border-blue-200">
                    🛡️ មើលតែប៉ុណ្ណោះ (Read-Only)
                  </span>
                </div>

                {/* Customer Receipt Statement Card */}
                <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-md space-y-2 text-center">
                  <div className="w-11 h-11 mx-auto rounded-full bg-gradient-to-tr from-pink-400 via-purple-500 to-indigo-500 p-0.5 shadow-md">
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center font-black text-xs text-purple-700">
                      សុខដា
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-slate-900">សុខដា</h4>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[8px] font-black border border-emerald-200">
                      🟢 ស្ថានភាព: ល្អណាស់ (Good)
                    </span>
                  </div>

                  <div className="text-[8.5px] text-slate-600 space-y-0.5 font-medium border-y border-slate-100 py-1.5">
                    <p>📞 012348981</p>
                    <p>📅 ថ្ងៃខ្ចី: 06/08/2026</p>
                    <p>🕒 វគ្គបង់: រាល់ថ្ងៃ (Daily)</p>
                  </div>

                  <div className="p-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/80 text-[8px] leading-snug">
                    📣 <strong>សាររំលឹក:</strong> សូមបង់ប្រាក់ឱ្យបានទៀងទាត់ និងទាន់ពេលវេលា។ សូមអរគុណ!
                  </div>

                  <button className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9px] flex items-center justify-center gap-1 shadow-md">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>ព័ត៌មានគណនី និង QR សងប្រាក់</span>
                  </button>
                </div>

                <div className="text-center text-[7.5px] text-slate-400 font-mono">
                  luypay.site — Verified Secure Statement
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom iPhone Home Indicator Bar */}
          <div className="w-full pt-1.5 pb-1 flex items-center justify-center">
            <div className="w-24 h-1 bg-slate-400/40 rounded-full" />
          </div>
        </div>

      </div>

      {/* Slide Navigation Dots */}
      <div className="relative z-20 flex items-center justify-center gap-2 mt-4">
        {[0, 1, 2, 3].map((index) => (
          <button
            key={index}
            onClick={() => setActiveSlide(index)}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              activeSlide === index
                ? 'w-8 h-2.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 shadow-md shadow-blue-500/30'
                : 'w-2.5 h-2.5 bg-slate-800 hover:bg-slate-700'
            }`}
            title={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

