import React from 'react';
import { Sparkles } from 'lucide-react';

export interface KhmerAvatarFrameOption {
  id: string;
  nameKh: string;
  nameEn: string;
  descKh: string;
  descEn: string;
  badge: string;
  themeColor: string;
}

export const KHMER_AVATAR_FRAMES: KhmerAvatarFrameOption[] = [
  {
    id: 'kbach_gold',
    nameKh: 'ក្បាច់ភ្ញីទេសមាស',
    nameEn: 'Golden Kbach Phni Des',
    descKh: 'ស៊ុមរចនាក្បាច់ភ្ញីទេសខ្មែរមាសចាំង រង្វង់វិល២ជាន់ អមដោយពន្លឺចែងចាំង',
    descEn: 'Dual-ring rotating Khmer golden ornament frame with sparkling aura',
    badge: '👑 ពេញនិយមបំផុត',
    themeColor: '#eab308'
  },
  {
    id: 'naga_emerald',
    nameKh: 'នាគរាជមាស',
    nameEn: 'Royal Naga Emerald',
    descKh: 'ស៊ុមពន្លឺពណ៌ត្បូងមរកត និងមាសរាជ អមដោយស្រមោលនាគរាជរះរលោង',
    descEn: 'Vibrant emerald dragon & gold glowing aura frame',
    badge: '🐉 នាគរាជ',
    themeColor: '#10b981'
  },
  {
    id: 'lotus_gold',
    nameKh: 'ឈូកមាសរលោង',
    nameEn: 'Glowing Golden Lotus',
    descKh: 'ស៊ុមស្រទាប់ផ្កាឈូកមាស និងរស្មីរលកពន្លឺរាលដាលស្វ័យប្រវត្តិ',
    descEn: 'Glowing lotus petal border with expanding pulse waves',
    badge: '🪷 ឈូកមាស',
    themeColor: '#f59e0b'
  },
  {
    id: 'angkor_jewel',
    nameKh: 'អង្គររតនៈ',
    nameEn: 'Angkor Royal Jewels',
    descKh: 'ស៊ុមត្បូងកណ្តៀង និងមាស អមដោយផ្កាយពន្លឺវិលជុំវិញជ្រុង៤',
    descEn: 'Royal sapphire blue & gold diamond frame with corner star flares',
    badge: '💎 រតនៈ',
    themeColor: '#3b82f6'
  },
  {
    id: 'fire_aura',
    nameKh: 'ព្រះអគ្គីរស្មី',
    nameEn: 'Sacred Flame Aura',
    descKh: 'ស៊ុមអណ្តាតភ្លើងមាសព្រះអគ្គី រស្មីឆ្វៀលវិលជុំវិញជាមួយនឹងកំទេចភ្លើង',
    descEn: 'Dynamic sacred golden flame ring with sparkling fire particles',
    badge: '🔥 ព្រះអគ្គី',
    themeColor: '#ef4444'
  },
  {
    id: 'lion_shield',
    nameKh: 'រាជសីហ៍មាស',
    nameEn: 'Royal Lion Gold Shield',
    descKh: 'ស៊ុមខែលមាសរាជសីហ៍ ក្បាច់លាក់ចម្លាក់ខ្មែរ និងរស្មីពន្លឺវិល',
    descEn: 'Majestic royal lion engraved gold shield with rotating neon light',
    badge: '🦁 រាជសីហ៍',
    themeColor: '#d97706'
  },
  {
    id: 'mermaid_cyan',
    nameKh: 'សុវណ្ណមច្ឆា',
    nameEn: 'Suvannamaccha Cyan',
    descKh: 'ស៊ុមពណ៌ទឹកសមុទ្រភ្លឺ និងមាស អមដោយរស្មីរលកទឹកហោះ',
    descEn: 'Cyan-blue & gold aquatic wave frame with shimmering particles',
    badge: '🧜‍♀️ សុវណ្ណមច្ឆា',
    themeColor: '#06b6d4'
  },
  {
    id: 'ruby_angkor',
    nameKh: 'ក្បាច់ភ្ញីអង្គរ',
    nameEn: 'Angkor Ruby Kbach',
    descKh: 'ស៊ុមត្បូងទទឹម និងក្បាច់អង្គរមាស អមដោយពន្លឺព្រះអាទិត្យចែងចាំង',
    descEn: 'Royal ruby red & gold Angkor court frame with solar ray effects',
    badge: '🏛️ អង្គរ',
    themeColor: '#e11d48'
  },
  {
    id: 'none',
    nameKh: 'គ្មានស៊ុម (ស្តង់ដារ)',
    nameEn: 'Standard (No Frame)',
    descKh: 'រាងរង្វង់ស្តង់ដារ ដោយគ្មានស៊ុមចលនា',
    descEn: 'Standard circle logo without animated frame',
    badge: '⚪ ស្តង់ដារ',
    themeColor: '#64748b'
  }
];

interface KhmerAvatarFrameProps {
  children: React.ReactNode;
  frameId?: string;
  sizeClass?: string;
  onClick?: () => void;
  showSelectorBadge?: boolean;
  interactive?: boolean;
  title?: string;
}

export default function KhmerAvatarFrame({
  children,
  frameId = 'kbach_gold',
  sizeClass = 'w-10 h-10',
  onClick,
  showSelectorBadge = true,
  interactive = true,
  title = 'ចុចដើម្បីប្ដូរស៊ុម Avatar Khmer'
}: KhmerAvatarFrameProps) {
  const isNone = frameId === 'none';

  return (
    <div
      onClick={onClick}
      title={title}
      className={`relative inline-flex items-center justify-center select-none group transition-all duration-300 ${
        interactive && onClick ? 'cursor-pointer hover:scale-105' : ''
      }`}
    >
      {/* 1. Golden Kbach Phni Des (ក្បាច់ភ្ញីទេសមាស) */}
      {frameId === 'kbach_gold' && (
        <>
          {/* Outer Ambient Glow */}
          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 opacity-70 blur-[5px] animate-pulse pointer-events-none" />
          
          {/* Rotating Outer Khmer Kbach Ring */}
          <div className="absolute -inset-2 rounded-full pointer-events-none animate-[spin_12s_linear_infinite] opacity-90">
            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="46" stroke="url(#kbach-gold-grad)" strokeWidth="2.5" strokeDasharray="6 4 12 4" />
              <path d="M 50 2 L 54 8 L 50 14 L 46 8 Z" fill="#FBBF24" />
              <path d="M 98 50 L 92 54 L 86 50 L 92 46 Z" fill="#FBBF24" />
              <path d="M 50 98 L 46 92 L 50 86 L 54 92 Z" fill="#FBBF24" />
              <path d="M 2 50 L 8 46 L 14 50 L 8 54 Z" fill="#FBBF24" />
            </svg>
          </div>

          {/* Reverse Counter-Rotating Inner Accent Ring */}
          <div className="absolute -inset-1 rounded-full pointer-events-none animate-[spin_8s_linear_infinite_reverse]">
            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
              <defs>
                <linearGradient id="kbach-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FEF08A" />
                  <stop offset="50%" stopColor="#EAB308" />
                  <stop offset="100%" stopColor="#CA8A04" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="48" stroke="#FEF08A" strokeWidth="1.5" strokeDasharray="3 6" opacity="0.8" />
            </svg>
          </div>

          {/* Khmer Kbach Corner Crowns */}
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 text-amber-300 filter drop-shadow-[0_0_4px_#f59e0b]">
            <span className="text-[11px] font-black leading-none text-yellow-300">៚</span>
          </div>
        </>
      )}

      {/* 2. Royal Naga Emerald (នាគរាជមាស) */}
      {frameId === 'naga_emerald' && (
        <>
          <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-amber-300 opacity-75 blur-[6px] animate-pulse pointer-events-none" />
          
          {/* Naga Dragon Ring Animation */}
          <div className="absolute -inset-2 rounded-full pointer-events-none animate-[spin_10s_linear_infinite]">
            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
              <defs>
                <linearGradient id="naga-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="50%" stopColor="#2DD4BF" />
                  <stop offset="100%" stopColor="#FBBF24" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="46" stroke="url(#naga-grad)" strokeWidth="3" strokeDasharray="8 6 4 6" />
            </svg>
          </div>

          <div className="absolute -inset-1 rounded-full pointer-events-none border-2 border-emerald-400/60 animate-[ping_3s_ease-in-out_infinite] opacity-40" />
          
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 text-emerald-300 filter drop-shadow-[0_0_6px_#10b981]">
            <span className="text-[10px] font-black">🐉</span>
          </div>
        </>
      )}

      {/* 3. Glowing Golden Lotus (ឈូកមាសរលោង) */}
      {frameId === 'lotus_gold' && (
        <>
          <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-300 opacity-80 blur-[6px] animate-pulse pointer-events-none" />
          
          {/* Lotus Petal Ring SVG */}
          <div className="absolute -inset-2.5 rounded-full pointer-events-none animate-[spin_16s_linear_infinite]">
            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <g key={deg} transform={`rotate(${deg} 50 50)`}>
                  <path d="M 50 4 C 53 12, 47 12, 50 4 Z" fill="#FBBF24" />
                  <circle cx="50" cy="3" r="2" fill="#FEF08A" />
                </g>
              ))}
              <circle cx="50" cy="50" r="44" stroke="#FBBF24" strokeWidth="1.5" strokeDasharray="4 4" />
            </svg>
          </div>

          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10 text-amber-300 filter drop-shadow-[0_0_4px_#f59e0b]">
            <span className="text-[10px] font-bold">🪷</span>
          </div>
        </>
      )}

      {/* 4. Angkor Royal Jewels (អង្គររតនៈ) */}
      {frameId === 'angkor_jewel' && (
        <>
          <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-blue-600 via-sky-400 to-amber-300 opacity-80 blur-[6px] animate-pulse pointer-events-none" />
          
          <div className="absolute -inset-2 rounded-full pointer-events-none animate-[spin_9s_linear_infinite]">
            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="46" stroke="#60A5FA" strokeWidth="2.5" strokeDasharray="10 5" />
              <circle cx="50" cy="50" r="48" stroke="#FBBF24" strokeWidth="1" />
              {[0, 90, 180, 270].map((deg) => (
                <g key={deg} transform={`rotate(${deg} 50 50)`}>
                  <polygon points="50,2 53,8 50,14 47,8" fill="#60A5FA" />
                  <circle cx="50" cy="8" r="1.5" fill="#FFFFFF" />
                </g>
              ))}
            </svg>
          </div>

          <div className="absolute -top-2 right-0 z-10 text-blue-300 filter drop-shadow-[0_0_6px_#3b82f6]">
            <span className="text-[10px]">💎</span>
          </div>
        </>
      )}

      {/* 5. Sacred Flame Aura (ព្រះអគ្គីរស្មី) */}
      {frameId === 'fire_aura' && (
        <>
          <div className="absolute -inset-2 rounded-full bg-gradient-to-t from-red-600 via-orange-500 to-yellow-300 opacity-85 blur-[7px] animate-pulse pointer-events-none" />
          
          <div className="absolute -inset-2 rounded-full pointer-events-none animate-[spin_6s_linear_infinite]">
            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
              <defs>
                <linearGradient id="fire-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="50%" stopColor="#F97316" />
                  <stop offset="100%" stopColor="#FBBF24" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="46" stroke="url(#fire-grad)" strokeWidth="3" strokeDasharray="12 4 6 4" />
            </svg>
          </div>

          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 text-orange-400 filter drop-shadow-[0_0_8px_#f97316]">
            <span className="text-[10px]">🔥</span>
          </div>
        </>
      )}

      {/* 6. Royal Lion Gold Shield (រាជសីហ៍មាស) */}
      {frameId === 'lion_shield' && (
        <>
          <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-amber-600 via-yellow-400 to-amber-700 opacity-80 blur-[5px] animate-pulse pointer-events-none" />
          
          <div className="absolute -inset-2.5 rounded-full pointer-events-none animate-[spin_14s_linear_infinite]">
            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="47" stroke="#D97706" strokeWidth="3" strokeDasharray="14 6" />
              <circle cx="50" cy="50" r="44" stroke="#FDE047" strokeWidth="1.5" strokeDasharray="4 4" />
            </svg>
          </div>

          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 text-amber-300 filter drop-shadow-[0_0_5px_#d97706]">
            <span className="text-[10px]">🦁</span>
          </div>
        </>
      )}

      {/* 7. Suvannamaccha Cyan (សុវណ្ណមច្ឆា) */}
      {frameId === 'mermaid_cyan' && (
        <>
          <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-cyan-500 via-teal-300 to-amber-300 opacity-80 blur-[6px] animate-pulse pointer-events-none" />
          
          <div className="absolute -inset-2 rounded-full pointer-events-none animate-[spin_8s_linear_infinite]">
            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="46" stroke="#22D3EE" strokeWidth="2.5" strokeDasharray="8 8 16 4" />
              <circle cx="50" cy="50" r="48" stroke="#FBBF24" strokeWidth="1" strokeDasharray="2 6" />
            </svg>
          </div>

          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 text-cyan-300 filter drop-shadow-[0_0_6px_#06b6d4]">
            <span className="text-[10px]">🧜‍♀️</span>
          </div>
        </>
      )}

      {/* 8. Angkor Ruby Kbach (ក្បាច់ភ្ញីអង្គរ) */}
      {frameId === 'ruby_angkor' && (
        <>
          <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-rose-600 via-red-500 to-amber-300 opacity-80 blur-[6px] animate-pulse pointer-events-none" />
          
          <div className="absolute -inset-2 rounded-full pointer-events-none animate-[spin_10s_linear_infinite_reverse]">
            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="46" stroke="#F43F5E" strokeWidth="3" strokeDasharray="6 6 12 4" />
              <circle cx="50" cy="50" r="48" stroke="#FBBF24" strokeWidth="1.5" strokeDasharray="4 8" />
            </svg>
          </div>

          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 text-rose-300 filter drop-shadow-[0_0_6px_#e11d48]">
            <span className="text-[10px]">🏛️</span>
          </div>
        </>
      )}

      {/* Avatar Content Wrapped Inside Frame */}
      <div className="relative z-10 flex items-center justify-center rounded-full overflow-hidden bg-slate-900 border border-amber-400/40 shadow-inner">
        {children}
      </div>

      {/* Small Edit Badge Overlay when interactive */}
      {interactive && showSelectorBadge && onClick && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="absolute -bottom-1 -right-1 z-20 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 p-1 rounded-full shadow-md border border-amber-200 hover:scale-115 transition transform cursor-pointer group-hover:rotate-12"
          title="ចុចដើម្បីប្ដូរស៊ុម Khmer Avatar"
        >
          <Sparkles className="w-3 h-3 stroke-[2.5]" />
        </div>
      )}
    </div>
  );
}
