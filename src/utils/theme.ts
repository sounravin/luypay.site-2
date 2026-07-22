export type AppThemeType = 'slate' | 'angkor' | 'apsara' | 'emerald';
export type ButtonStyleType = 'modern' | 'kbach' | 'neon';

export interface ThemeConfig {
  id: AppThemeType;
  nameKh: string;
  nameEn: string;
  bgLight: string;
  bgDark: string;
  sidebarClass: string;
  cardClass: string;
  inputClass: string;
  textMuted: string;
  textTitle: string;
  borderClass: string;
  accent: string;
  accentBtn: string;
  kbachBorder: string;
}

export const THEMES: Record<AppThemeType, ThemeConfig> = {
  slate: {
    id: 'slate',
    nameKh: 'ស្លេតបុរាណ (Classic Slate)',
    nameEn: 'Classic Slate',
    bgLight: 'bg-slate-50 text-slate-800',
    bgDark: 'bg-[#0b1329] text-slate-100',
    sidebarClass: 'bg-[#070c17] text-white border-slate-800/80',
    cardClass: 'bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800/90 shadow-sm',
    inputClass: 'bg-slate-50 dark:bg-[#070c17] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:ring-blue-500/20 focus:border-blue-500',
    textMuted: 'text-slate-500 dark:text-slate-400',
    textTitle: 'text-slate-800 dark:text-slate-100',
    borderClass: 'border-slate-200 dark:border-slate-800/80',
    accent: 'from-blue-600 to-indigo-600 text-white shadow-blue-600/20',
    accentBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
    kbachBorder: '',
  },
  angkor: {
    id: 'angkor',
    nameKh: 'រាជវាំងអង្គរមាស (Royal Angkor)',
    nameEn: 'Royal Angkor Golden',
    bgLight: 'bg-[#faf6eb] text-amber-950',
    bgDark: 'bg-[#120e06] text-[#faeec8]',
    sidebarClass: 'bg-[#1b1409] text-[#faeec8] border-[#3a2a12]',
    cardClass: 'bg-[#fffdf9] dark:bg-[#1a130a] border-[#e2b037]/25 dark:border-[#e2b037]/20 shadow-md shadow-amber-900/5',
    inputClass: 'bg-[#fcf7ee] dark:bg-[#120c04] border-[#e2b037]/30 dark:border-[#e2b037]/25 text-amber-950 dark:text-[#faeec8] focus:ring-[#e2b037]/20 focus:border-[#e2b037]',
    textMuted: 'text-amber-700 dark:text-[#d5b35c]/75',
    textTitle: 'text-[#5c4008] dark:text-[#f3d37a]',
    borderClass: 'border-[#e2b037]/15 dark:border-[#e2b037]/10',
    accent: 'from-[#b37e1b] to-[#dfb035] text-white shadow-amber-950/40',
    accentBtn: 'bg-[#b37e1b] hover:bg-[#966712] text-white border border-[#dfb035]/30',
    kbachBorder: 'border-2 border-[#dfb035]/30 rounded-2xl',
  },
  apsara: {
    id: 'apsara',
    nameKh: 'រាត្រីទេពអប្សរា (Celestial Apsara Night)',
    nameEn: 'Celestial Apsara Night',
    bgLight: 'bg-[#f4f1fc] text-purple-950',
    bgDark: 'bg-[#080514] text-[#ebdcfc]',
    sidebarClass: 'bg-[#100a25] text-[#ebdcfc] border-[#251754]',
    cardClass: 'bg-[#faf8fe] dark:bg-[#110c26] border-purple-500/20 dark:border-purple-500/15 shadow-md shadow-purple-900/5',
    inputClass: 'bg-[#f5f0fc] dark:bg-[#0c071d] border-purple-500/30 dark:border-purple-500/25 text-purple-950 dark:text-[#ebdcfc] focus:ring-purple-500/20 focus:border-purple-500',
    textMuted: 'text-purple-700/80 dark:text-[#b48bf5]/75',
    textTitle: 'text-[#3c1d6d] dark:text-[#d3adff]',
    borderClass: 'border-purple-500/15 dark:border-purple-500/10',
    accent: 'from-[#5b21b6] to-[#7c3aed] text-white shadow-purple-950/40',
    accentBtn: 'bg-[#6d28d9] hover:bg-[#5b21b6] text-white border border-purple-500/30',
    kbachBorder: 'border-2 border-purple-500/30 rounded-2xl',
  },
  emerald: {
    id: 'emerald',
    nameKh: 'មេគង្គមរកត (Mekong Emerald)',
    nameEn: 'Mekong Emerald Bamboo',
    bgLight: 'bg-[#f0fcf5] text-emerald-950',
    bgDark: 'bg-[#02120b] text-[#cbfce2]',
    sidebarClass: 'bg-[#031d12] text-[#cbfce2] border-emerald-900/80',
    cardClass: 'bg-[#f7fdfa] dark:bg-[#052216] border-emerald-500/20 dark:border-emerald-500/15 shadow-md shadow-emerald-900/5',
    inputClass: 'bg-[#edfbf2] dark:bg-[#02140c] border-emerald-500/30 dark:border-emerald-500/25 text-emerald-950 dark:text-[#cbfce2] focus:ring-emerald-500/20 focus:border-emerald-500',
    textMuted: 'text-emerald-700 dark:text-[#6ee7b7]/75',
    textTitle: 'text-[#065f46] dark:text-[#a7f3d0]',
    borderClass: 'border-emerald-500/15 dark:border-emerald-500/10',
    accent: 'from-[#047857] to-[#059669] text-white shadow-emerald-950/40',
    accentBtn: 'bg-[#047857] hover:bg-[#065f46] text-white border border-emerald-500/30',
    kbachBorder: 'border-2 border-emerald-500/30 rounded-2xl',
  },
};

export const getButtonStyleClass = (
  style: ButtonStyleType,
  variant: 'primary' | 'secondary' | 'danger' | 'success' | 'amber'
) => {
  let base = 'font-extrabold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ';

  if (style === 'kbach') {
    base += 'rounded-2xl border-b-4 border-r-2 active:translate-y-0.5 active:translate-x-0.25 ';
    if (variant === 'primary') {
      return base + 'bg-gradient-to-r from-[#dfb035] to-[#b37e1b] hover:from-[#f3c552] hover:to-[#dfb035] text-slate-950 border-amber-900/50 shadow-lg shadow-amber-500/10';
    } else if (variant === 'secondary') {
      return base + 'bg-slate-800 hover:bg-slate-700 text-[#faeec8] border-slate-950';
    } else if (variant === 'danger') {
      return base + 'bg-rose-700 hover:bg-rose-800 text-white border-rose-950';
    } else if (variant === 'amber') {
      return base + 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300';
    } else {
      return base + 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-850';
    }
  } else if (style === 'neon') {
    base += 'rounded-xl border hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(255,255,255,0.05)] ';
    if (variant === 'primary') {
      return base + 'bg-blue-650 hover:bg-blue-600 text-white border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]';
    } else if (variant === 'secondary') {
      return base + 'bg-slate-900 hover:bg-slate-800 text-cyan-400 border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]';
    } else if (variant === 'danger') {
      return base + 'bg-rose-950 hover:bg-rose-900 text-rose-400 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]';
    } else if (variant === 'amber') {
      return base + 'bg-amber-950 hover:bg-amber-900 text-amber-400 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]';
    } else {
      return base + 'bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]';
    }
  } else {
    // 'modern' style
    base += 'rounded-xl shadow-md hover:translate-y-[-1px] active:translate-y-0 ';
    if (variant === 'primary') {
      return base + 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/10';
    } else if (variant === 'secondary') {
      return base + 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-755 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 active:bg-slate-100';
    } else if (variant === 'danger') {
      return base + 'bg-rose-600 hover:bg-rose-700 text-white';
    } else if (variant === 'amber') {
      return base + 'bg-amber-500 hover:bg-amber-600 text-white';
    } else {
      return base + 'bg-emerald-600 hover:bg-emerald-700 text-white';
    }
  }
};
