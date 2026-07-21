import React, { useState, useEffect, useRef } from 'react';
import { Borrower } from '../types';
import { getDaysUntilNextPayment, formatMoney } from '../utils';
import { Bell, Phone, Clock, Volume2 } from 'lucide-react';
import { useLanguage } from '../i18n';
import { motion, AnimatePresence } from 'motion/react';

// Beautiful Golden Cash Register / Traditional Bell Chime sound using Web Audio API
export const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Frequency combinations for a warm golden coin chime / resonance
    const playTone = (freq: number, type: OscillatorType, volume: number, duration: number, delay = 0) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      
      // Beautiful exponential decay to mimic physical bell vibration
      gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration + 0.05);
    };

    // Tone 1: High crisp golden strike (Bell attack)
    playTone(987.77, 'sine', 0.12, 0.4, 0); // B5 note
    
    // Tone 2: Warm harmonious core ring (Slight delay)
    playTone(1318.51, 'sine', 0.08, 0.6, 0.04); // E6 note
    
    // Tone 3: Metallic chime ring (Slight triangle warmth)
    playTone(1975.53, 'triangle', 0.04, 0.5, 0.08); // B6 note
  } catch (error) {
    console.warn('Audio feedback blocked or failed:', error);
  }
};

// Authentic Khmer Traditional Ornament (Kbach) Corner Vector for the Notification Popover
const KhmerCorner = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M 0 0 L 28 0 C 22 2, 18 6, 15 11 C 18 10.5, 20 9.5, 19.5 11.5 C 16 15, 13.5 16, 10 20 C 11.5 19.5, 13 18.5, 12.5 20 C 8.5 23.5, 6.5 24.5, 0 26.5 Z"
      fill="url(#bell-gold-grad)"
    />
    <path
      d="M 0 0 L 18 0 C 14 1.5, 11 3.5, 9 7 C 11 6.5, 12 6, 11.5 7.5 C 9 10, 7 11, 5 13 C 6 12.5, 7 12, 6.5 13 C 4 15, 3 15.5, 0 17 Z"
      fill="#FFE082"
      opacity="0.6"
    />
  </svg>
);

interface NotificationBellProps {
  borrowers: Borrower[];
  onSelectBorrower: (id: string) => void;
  isMobile?: boolean;
  sidebarMode?: boolean;
}

export default function NotificationBell({ borrowers, onSelectBorrower, isMobile = false, sidebarMode = false }: NotificationBellProps) {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'payments' | 'online'>('payments');
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter borrowers who are due soon or overdue (days left <= 1) and not archived
  const dueSoonList = borrowers.filter((b) => {
    const dl = getDaysUntilNextPayment(b);
    return dl !== null && dl <= 1;
  });

  // Filter borrowers who are currently online
  const onlineList = borrowers.filter((b) => b.isOnline === true);

  // Toggle notification panel and play sound
  const toggleDropdown = () => {
    if (!isOpen && (dueSoonList.length > 0 || onlineList.length > 0)) {
      playNotificationSound();
    }
    setIsOpen(!isOpen);
  };

  // Play chime once on the very first user interaction if there are due soon/overdue cases
  useEffect(() => {
    if (dueSoonList.length === 0 && onlineList.length === 0) return;

    let hasPlayed = false;
    const playOnce = () => {
      if (hasPlayed) return;
      hasPlayed = true;
      playNotificationSound();
      
      // Clean up listeners
      window.removeEventListener('click', playOnce);
      window.removeEventListener('touchstart', playOnce);
    };

    window.addEventListener('click', playOnce);
    window.addEventListener('touchstart', playOnce);

    return () => {
      window.removeEventListener('click', playOnce);
      window.removeEventListener('touchstart', playOnce);
    };
  }, [dueSoonList.length, onlineList.length]);

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className="z-50 relative">
      {/* SVG definitions for beautiful golden gradients */}
      <svg className="absolute w-0 h-0 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bell-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DFB035" />
            <stop offset="30%" stopColor="#FFF2A3" />
            <stop offset="70%" stopColor="#B37E1B" />
            <stop offset="100%" stopColor="#FAD860" />
          </linearGradient>
        </defs>
      </svg>

      {/* Notification Bell Trigger Button: Unified Premium Khmer Golden Style */}
      <button
        onClick={toggleDropdown}
        className={`relative flex items-center justify-center rounded-xl transition-all duration-300 cursor-pointer border select-none focus:outline-none shadow-lg bg-[#0c1836] hover:bg-amber-950/40 border-[#dfb035]/50 text-[#FFE082] hover:border-[#dfb035] hover:text-amber-300 ${
          sidebarMode ? 'p-2' : 'p-2.5'
        }`}
        title={language === 'kh' ? 'ការជូនដំណឹងត្រូវទូទាត់ប្រាក់' : 'Payment Notifications'}
      >
        <Bell className={`${sidebarMode ? 'w-4 h-4' : 'w-4.5 h-4.5'} ${dueSoonList.length > 0 ? 'animate-wiggle text-amber-400' : ''}`} />
        
        {/* Count Badge Alert with Ping Effect for Payments */}
        {dueSoonList.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 h-4.5 w-4.5 flex">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full bg-rose-500 text-white items-center justify-center shadow-md font-black h-4.5 w-4.5 text-[9px]">
              {dueSoonList.length}
            </span>
          </span>
        )}

        {/* Pulsing Green Indicator Badge when Borrower is Online */}
        {onlineList.length > 0 && (
          <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 flex">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full bg-emerald-500 shadow-md h-3.5 w-3.5 border-2 border-[#0c1836]"></span>
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel: Clean Relative Absolute Alignment */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay background to capture clicks and close smoothly */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 z-[90]"
            />
            
            <motion.div
              initial={
                sidebarMode
                  ? { opacity: 0, x: -20, scale: 0.95 }
                  : { opacity: 0, y: 12, scale: 0.95 }
              }
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={
                sidebarMode
                  ? { opacity: 0, x: -16, scale: 0.95 }
                  : { opacity: 0, y: 8, scale: 0.95 }
              }
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`border-2 rounded-2xl shadow-2xl overflow-hidden z-[100] ${
                sidebarMode
                  ? 'absolute left-full top-0 ml-4 w-88 md:w-96 origin-left'
                  : 'fixed md:absolute top-24 md:top-auto md:mt-2.5 left-4 right-4 md:left-auto md:right-0 w-auto md:w-96 max-w-sm md:max-w-md mx-auto md:mx-0 origin-top md:origin-top-right'
              } bg-[#070c19] border-[#b37e1b]/70 text-slate-100 dark-glow-amber`}
            >
              {/* Decorative Double Border Outline */}
              <div className="absolute inset-[3px] border border-[#dfb035]/20 rounded-[13px] pointer-events-none z-10" />

              {/* Authentic Khmer Corner Ornaments */}
              <KhmerCorner className="absolute top-[3px] left-[3px] w-5 h-5 pointer-events-none z-10" />
              <KhmerCorner className="absolute top-[3px] right-[3px] w-5 h-5 pointer-events-none rotate-90 z-10" />
              <KhmerCorner className="absolute bottom-[3px] left-[3px] w-5 h-5 pointer-events-none -rotate-90 z-10" />
              <KhmerCorner className="absolute bottom-[3px] right-[3px] w-5 h-5 pointer-events-none rotate-180 z-10" />

              {/* Custom Watermark Pattern for the popover panel */}
              <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath d='M16 0 L32 16 L16 32 L0 16 Z M16 6 L26 16 L16 26 L6 16 Z M16 11 L21 16 L16 21 L11 16 Z' fill='%23dfb035' fill-opacity='1'/%3E%3C/svg%3E")`,
                  backgroundSize: '16px 16px'
                }}
              />

              {/* Header */}
              <div className="bg-gradient-to-r from-[#101b36] via-[#16274e] to-[#101b36] px-5 py-3 text-white flex items-center justify-between border-b border-[#dfb035]/30 relative z-10 pl-6">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400 animate-wiggle" />
                  <h3 className="font-extrabold text-xs tracking-wider uppercase text-[#FFE082]">
                    {language === 'kh' ? 'មជ្ឈមណ្ឌលជូនដំណឹង' : 'Notification Center'}
                  </h3>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playNotificationSound();
                  }}
                  className="flex items-center gap-1 bg-[#1a2e5d] hover:bg-[#254284] border border-[#dfb035]/40 text-[#FFE082] hover:text-amber-300 text-[9px] px-2 py-0.5 rounded-md transition-all cursor-pointer select-none active:scale-95 shadow-inner"
                  title={language === 'kh' ? 'តេស្តសំឡេងជួង' : 'Test chime sound'}
                >
                  <Volume2 className="w-3 h-3 text-amber-400" />
                  <span>{language === 'kh' ? 'តេស្តសំឡេង' : 'Sound Test'}</span>
                </button>
              </div>

              {/* Segmented Tabs for Payments vs Online Status */}
              <div className="flex border-b border-[#dfb035]/20 relative z-10 bg-[#070e20] text-[11px] font-black uppercase">
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`flex-1 py-2.5 text-center transition-all cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
                    activeTab === 'payments'
                      ? 'border-[#dfb035] text-[#FFE082] bg-amber-950/10'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{language === 'kh' ? '🔔 ត្រូវទូទាត់' : '🔔 Payments'}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                    dueSoonList.length > 0 ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {dueSoonList.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('online')}
                  className={`flex-1 py-2.5 text-center transition-all cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
                    activeTab === 'online'
                      ? 'border-[#dfb035] text-[#FFE082] bg-emerald-950/10'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span>{language === 'kh' ? '🟢 កំពុងអនឡាញ' : '🟢 Online'}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                    onlineList.length > 0 ? 'bg-emerald-500 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {onlineList.length}
                  </span>
                </button>
              </div>

              {/* List Content */}
              <div className="max-h-80 overflow-y-auto divide-y divide-[#dfb035]/15 relative z-10">
                {activeTab === 'payments' ? (
                  dueSoonList.length === 0 ? (
                    <div className="p-10 text-center flex flex-col items-center justify-center space-y-3">
                      <div className="text-3xl animate-bounce">🎉</div>
                      <p className="text-xs font-bold text-amber-200">
                        {language === 'kh' ? 'គ្មានការជូនដំណឹងថ្មីៗទេ' : 'No new notifications'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium max-w-xs leading-relaxed">
                        {language === 'kh' ? 'រាល់កូនបំណុលទាំងអស់បានទូទាត់ទាន់ពេលវេលា!' : 'All active borrowers have settled on schedule!'}
                      </p>
                    </div>
                  ) : (
                    dueSoonList.map((b) => {
                      const daysLeft = getDaysUntilNextPayment(b);
                      const isOverdue = daysLeft !== null && daysLeft < 0;
                      const isToday = daysLeft === 0;

                      // Format status string
                      let statusText = '';
                      let statusColorClass = '';
                      if (isOverdue) {
                        statusText = language === 'kh' 
                          ? `ហួសកំណត់ ${Math.abs(daysLeft!)} ថ្ងៃ`
                          : `Overdue by ${Math.abs(daysLeft!)}d`;
                        statusColorClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                      } else if (isToday) {
                        statusText = language === 'kh' ? 'ត្រូវបង់ថ្ងៃនេះ' : 'Due Today';
                        statusColorClass = 'bg-amber-500 text-slate-950 border-amber-400';
                      } else {
                        statusText = language === 'kh' ? 'ត្រូវបង់ថ្ងៃស្អែក' : 'Due Tomorrow';
                        statusColorClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                      }

                      const totalPaid = Array.isArray(b.payments) ? b.payments.reduce((sum, p) => sum + (p?.amount || 0), 0) : 0;
                      const remaining = Math.max(0, b.totalToPay - totalPaid);

                      return (
                        <div
                          key={`bell-item-${b.id}`}
                          onClick={() => {
                            onSelectBorrower(b.id);
                            setIsOpen(false);
                          }}
                          className="p-4 hover:bg-amber-950/20 cursor-pointer transition-all duration-200 flex items-start justify-between gap-3 group border-l-2 border-transparent hover:border-[#dfb035]"
                        >
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 group-hover:scale-125 transition-transform shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
                              <h4 className="font-extrabold text-xs text-[#FFE082] group-hover:text-amber-300 transition-colors truncate">
                                {b.name}
                              </h4>
                            </div>
                            
                            {b.phone && (
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold pl-3.5">
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{b.phone}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-2 mt-2.5 pl-3.5">
                              <div className="bg-[#122042]/80 border border-[#dfb035]/20 px-2.5 py-1 rounded-lg">
                                <span className="text-[8px] text-slate-400 block font-bold uppercase leading-none">{language === 'kh' ? 'ត្រូវបង់' : 'Installment'}</span>
                                <span className="font-extrabold text-[10.5px] text-[#FFE082] leading-none block mt-1">
                                  {b.installmentAmount.toLocaleString()} {b.currency === 'USD' ? '$' : '៛'}
                                </span>
                              </div>
                              <div className="bg-amber-950/30 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                                <span className="text-[8px] text-amber-500 block font-bold uppercase leading-none">{language === 'kh' ? 'នៅខ្វះ' : 'Remaining'}</span>
                                <span className="font-extrabold text-[10.5px] text-amber-300 leading-none block mt-1">
                                  {remaining.toLocaleString()} {b.currency === 'USD' ? '$' : '៛'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border shrink-0 text-center ${statusColorClass}`}>
                              {statusText}
                            </span>
                            {b.dueTime && (
                              <span className="text-[9px] font-bold text-slate-300 bg-slate-900/80 border border-slate-800 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-inner">
                                <Clock className="w-2.5 h-2.5 text-amber-400" />
                                {b.dueTime}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )
                ) : (
                  // Online tab
                  onlineList.length === 0 ? (
                    <div className="p-10 text-center flex flex-col items-center justify-center space-y-3">
                      <div className="text-3xl animate-pulse">💤</div>
                      <p className="text-xs font-bold text-slate-400">
                        {language === 'kh' ? 'គ្មានកូនបំណុលអនឡាញទេ' : 'No borrowers online'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium max-w-xs leading-relaxed">
                        {language === 'kh' ? 'នៅពេលកូនបំណុលបើកតំណភ្ជាប់ (Link) ពួកគេនឹងបង្ហាញនៅទីនេះ!' : 'When a borrower opens their link, they will appear here!'}
                      </p>
                    </div>
                  ) : (
                    onlineList.map((b) => {
                      return (
                        <div
                          key={`bell-online-${b.id}`}
                          onClick={() => {
                            onSelectBorrower(b.id);
                            setIsOpen(false);
                          }}
                          className="p-4 hover:bg-emerald-950/15 cursor-pointer transition-all duration-200 flex items-start justify-between gap-3 group border-l-2 border-transparent hover:border-emerald-500"
                        >
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              <h4 className="font-extrabold text-xs text-emerald-300 group-hover:text-emerald-200 transition-colors truncate">
                                {b.name}
                              </h4>
                            </div>
                            
                            {b.phone && (
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold pl-3.5">
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{b.phone}</span>
                              </div>
                            )}

                            <div className="text-[9px] text-emerald-400/80 bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 rounded pl-3.5 inline-block font-semibold mt-1">
                              {language === 'kh' ? '🟢 កំពុងអនឡាញពិនិត្យមើលគណនី' : '🟢 Online viewing details'}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className="text-[9.5px] font-black px-2 py-0.5 rounded-md border shrink-0 text-center bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse uppercase">
                              {language === 'kh' ? 'កំពុងមើល' : 'ACTIVE'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )
                )}
              </div>

              {/* Footer text */}
              <div className="bg-gradient-to-r from-[#101b36] to-[#16274e] p-3 text-center text-[10px] text-[#FFE082]/90 border-t border-[#dfb035]/30 font-bold relative z-10 leading-normal pl-6">
                {language === 'kh' ? '🔔 ចុចលើគណនីដើម្បីពិនិត្យសមតុល្យ និងប្រវត្តិលម្អិត' : '🔔 Click on borrower to view detail & records'}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
