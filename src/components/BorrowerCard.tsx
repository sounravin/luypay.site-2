import React, { useState, useEffect } from 'react';
import { Borrower } from '../types';
import { formatMoney, formatKhmerDate } from '../utils';
import { Calendar, Phone, CheckCircle, Clock, Check, QrCode } from 'lucide-react';
import { useLanguage } from '../i18n';
import AvatarWithFrame from './AvatarWithFrame';
import { motion } from 'motion/react';
import { getButtonStyleClass, THEMES } from '../utils/theme';
import type { ButtonStyleType, AppThemeType } from '../utils/theme';

interface BorrowerCardProps {
  borrower: Borrower;
  onSelect: (borrower: Borrower) => void;
  onQuickPay: (borrowerId: string) => void;
  onShowPaymentQr?: (borrower: Borrower) => void;
  isSelected?: boolean;
  onToggleSelect?: (borrowerId: string) => void;
  buttonStyle?: ButtonStyleType;
  appTheme?: AppThemeType;
  isDark?: boolean;
  hideAvatarFrame?: boolean;
}

export default function BorrowerCard({ 
  borrower, 
  onSelect, 
  onQuickPay, 
  onShowPaymentQr,
  isSelected = false, 
  onToggleSelect, 
  buttonStyle = 'kbach',
  appTheme = 'slate',
  isDark = false,
  hideAvatarFrame = false
}: BorrowerCardProps) {
  // 10-second ticker to keep cards status up to date in real-time
  const [tick, setTick] = useState<number>(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const { t, language } = useLanguage();

  // Calculate if the borrower is currently Online (with clock drift protection)
  const isOnline = !!(
    borrower.isOnline && 
    borrower.lastActive && 
    Math.abs(Date.now() - borrower.lastActive) < 10 * 60 * 1000
  );

  // Calculate payments
  const payments = Array.isArray(borrower.payments) ? borrower.payments : [];
  const totalPaid = payments.reduce((sum, p) => sum + (p?.amount || 0), 0);
  
  // Calculate top-up total if it is separate and active
  let topUpTotalToPay = 0;
  if (borrower.topUpLoanAmount !== undefined && borrower.topUpLoanAmount > 0 && borrower.topUpSeparate !== false) {
    const topUpAmt = borrower.topUpLoanAmount;
    const iVal = borrower.interestValue || 0;
    const dVal = borrower.duration || 1;
    const interestType = borrower.interestType || 'percent';
    const interestCalculation = borrower.interestCalculation || 'per-period';
    const paymentMode = borrower.paymentMode || 'all';

    const interestAmt = interestType === 'percent' ? topUpAmt * (iVal / 100) : iVal;
    const safeInterestAmt = isNaN(interestAmt) ? 0 : interestAmt;

    if (interestCalculation === 'per-period') {
      if (paymentMode === 'all') {
        topUpTotalToPay = topUpAmt + (safeInterestAmt * dVal);
      } else {
        topUpTotalToPay = safeInterestAmt * dVal;
      }
    } else { // flat
      if (paymentMode === 'all') {
        topUpTotalToPay = topUpAmt + safeInterestAmt;
      } else {
        topUpTotalToPay = safeInterestAmt;
      }
    }

    if (borrower.currency === 'KHR') {
      topUpTotalToPay = Math.round(topUpTotalToPay);
    } else {
      topUpTotalToPay = parseFloat(topUpTotalToPay.toFixed(2));
    }
  }

  const overallTotalToPay = borrower.totalToPay + topUpTotalToPay;
  const remaining = Math.max(0, overallTotalToPay - totalPaid);
  
  // Progress percentage
  const progressPercent = overallTotalToPay > 0 ? Math.min(100, Math.round((totalPaid / overallTotalToPay) * 100)) : 0;
  
  const isCompleted = remaining <= 0;
  
  // Find if there is an installment left
  const paidIndices = payments.map(p => p?.installmentIndex);
  let nextInstallmentIndex = -1;
  for (let i = 0; i < borrower.duration; i++) {
    if (!paidIndices.includes(i)) {
      nextInstallmentIndex = i;
      break;
    }
  }

  const handleQuickPayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleted) return;
    onQuickPay(borrower.id);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect(borrower.id);
    }
  };

  const themeConfig = THEMES[appTheme] || THEMES.slate;

  // Dynamic Kbach corners ornament color
  const kbachColor = appTheme === 'angkor'
    ? 'text-[#dfb035]'
    : appTheme === 'apsara'
      ? 'text-[#b48bf5]'
      : appTheme === 'emerald'
        ? 'text-[#6ee7b7]'
        : 'text-slate-400 dark:text-slate-500';

  // Dynamic Card Background (combining Theme background with Button Style structure)
  const cardBgClass = isSelected
    ? (buttonStyle === 'kbach'
        ? (appTheme === 'angkor' ? 'bg-[#fffdf9] dark:bg-[#1e160a]' : appTheme === 'apsara' ? 'bg-[#faf8fe] dark:bg-[#140e2b]' : appTheme === 'emerald' ? 'bg-[#f7fdfa] dark:bg-[#06291a]' : 'bg-white dark:bg-slate-900')
        : (appTheme === 'angkor' ? 'bg-[#faf6eb]/90 dark:bg-[#120e06]/90' : appTheme === 'apsara' ? 'bg-[#f4f1fc]/90 dark:bg-[#080514]/90' : appTheme === 'emerald' ? 'bg-[#f0fcf5]/90 dark:bg-[#02120b]/90' : 'bg-slate-50 dark:bg-slate-900/95'))
    : buttonStyle === 'kbach'
      ? (appTheme === 'angkor'
          ? 'bg-gradient-to-br from-[#fffdf9] to-[#faf6eb] dark:from-[#1c140a] dark:to-[#332511]'
          : appTheme === 'apsara'
            ? 'bg-gradient-to-br from-[#faf8fe] to-[#f4f1fc] dark:from-[#110c26] dark:to-[#22164d]'
            : appTheme === 'emerald'
              ? 'bg-gradient-to-br from-[#f7fdfa] to-[#f0fcf5] dark:from-[#052216] dark:to-[#093c26]'
              : 'bg-gradient-to-br from-white to-slate-50 dark:from-[#1e293b] dark:to-slate-900')
      : buttonStyle === 'neon'
        ? (appTheme === 'angkor'
            ? 'bg-[#faf6eb]/80 dark:bg-[#120e06]/95'
            : appTheme === 'apsara'
              ? 'bg-[#f4f1fc]/80 dark:bg-[#080514]/95'
              : appTheme === 'emerald'
                ? 'bg-[#f0fcf5]/80 dark:bg-[#02120b]/95'
                : 'bg-white/80 dark:bg-slate-900/95')
        : (appTheme === 'angkor'
            ? 'bg-[#fffdf9] dark:bg-[#1a130a]'
            : appTheme === 'apsara'
              ? 'bg-[#faf8fe] dark:bg-[#110c26]'
              : appTheme === 'emerald'
                ? 'bg-[#f7fdfa] dark:bg-[#052216]'
                : 'bg-white dark:bg-slate-900');

  // Dynamic Card Border & Shadow (giving exact contrast, theme colors and styles)
  const cardBorderClass = isSelected
    ? (appTheme === 'angkor'
        ? 'border-[#dfb035] ring-2 ring-[#dfb035]/30'
        : appTheme === 'apsara'
          ? 'border-[#b48bf5] ring-2 ring-[#b48bf5]/30'
          : appTheme === 'emerald'
            ? 'border-[#6ee7b7] ring-2 ring-[#6ee7b7]/30'
            : 'border-blue-500 ring-2 ring-blue-500/30')
    : buttonStyle === 'kbach'
      ? (appTheme === 'angkor'
          ? 'border-[#dfb035]/40 hover:border-[#dfb035] shadow-md shadow-amber-950/5'
          : appTheme === 'apsara'
            ? 'border-purple-500/40 hover:border-purple-400 shadow-md shadow-purple-950/5'
            : appTheme === 'emerald'
              ? 'border-emerald-500/40 hover:border-emerald-400 shadow-md shadow-emerald-950/5'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700')
      : buttonStyle === 'neon'
        ? (appTheme === 'angkor'
            ? 'border-amber-500/30 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.06)]'
            : appTheme === 'apsara'
              ? 'border-purple-500/30 hover:border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.06)]'
              : appTheme === 'emerald'
                ? 'border-emerald-500/30 hover:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.06)]'
                : 'border-blue-500/30 hover:border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.06)]')
        : (appTheme === 'angkor'
            ? 'border-[#e2b037]/25 dark:border-[#e2b037]/20 hover:border-[#dfb035] shadow-xs'
            : appTheme === 'apsara'
              ? 'border-purple-500/25 dark:border-purple-500/20 hover:border-purple-400 shadow-xs'
              : appTheme === 'emerald'
                ? 'border-emerald-500/25 dark:border-emerald-500/20 hover:border-emerald-400 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs');

  return (
    <div
      id={`borrower-card-${borrower.id}`}
      onClick={() => onSelect(borrower)}
      className={`${cardBgClass} border rounded-2xl p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 relative overflow-hidden ${cardBorderClass}`}
    >
      {buttonStyle === 'kbach' && (
        <>
          <div className="absolute top-0 left-0 w-4 h-4 opacity-40 pointer-events-none">
            <svg viewBox="0 0 16 16" fill="none" className={`${kbachColor} w-full h-full`} xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0 L16 0 C12 1, 8 3, 5 6 C3 8, 1 12, 0 16 Z" fill="currentColor"/>
            </svg>
          </div>
          <div className="absolute top-0 right-0 w-4 h-4 opacity-40 pointer-events-none rotate-90">
            <svg viewBox="0 0 16 16" fill="none" className={`${kbachColor} w-full h-full`} xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0 L16 0 C12 1, 8 3, 5 6 C3 8, 1 12, 0 16 Z" fill="currentColor"/>
            </svg>
          </div>
        </>
      )}

      {/* Dynamic Top-Left Badge requested by user */}
      {isCompleted ? (
        <div className={`absolute top-1.5 left-1.5 z-10 text-white text-[10px] font-black px-2.5 py-0.5 rounded-md shadow-md flex items-center gap-1 transition-all duration-300 ${
          isSelected
            ? 'bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 border border-amber-400 ring-2 ring-emerald-500/30'
            : 'bg-gradient-to-r from-teal-600 to-emerald-600 border border-teal-400/40'
        }`}>
          <CheckCircle className={`w-3.5 h-3.5 stroke-[3] ${isSelected ? 'text-amber-300 animate-pulse' : 'text-teal-200'}`} />
          <span>{language === 'kh' ? 'បង់រួច' : 'Paid'}</span>
          {isSelected && (
            <span className="text-[8px] bg-white/20 px-1 rounded text-white ml-0.5">
              ✓
            </span>
          )}
        </div>
      ) : isSelected ? (
        <div className="absolute top-1.5 left-1.5 z-10 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-md border border-emerald-400/40 flex items-center gap-1 animate-in fade-in zoom-in duration-150">
          <Check className="w-2.5 h-2.5 stroke-[4]" />
          <span>
            {language === 'kh' ? 'បានជ្រើសរើស' : 'Selected'}
          </span>
        </div>
      ) : null}

      {/* Top Header Row */}
      <div className="flex items-start gap-3 justify-between">
        <div className="flex items-center gap-3">
          {/* Styled Checkbox */}
          {onToggleSelect && (
            <button
              onClick={handleCheckboxClick}
              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                isSelected
                  ? (appTheme === 'angkor' ? 'bg-[#b37e1b] border-[#dfb035] text-white' : appTheme === 'apsara' ? 'bg-[#6d28d9] border-[#b48bf5] text-white' : appTheme === 'emerald' ? 'bg-[#047857] border-[#6ee7b7] text-white' : 'bg-blue-600 border-blue-500 text-white')
                  : (appTheme === 'angkor' ? 'border-amber-600/45 dark:border-[#dfb035]/30 hover:border-[#dfb035] bg-amber-50/50 dark:bg-amber-950/20' : appTheme === 'apsara' ? 'border-purple-600/45 dark:border-purple-500/30 hover:border-purple-500 bg-purple-50/50 dark:bg-purple-950/20' : appTheme === 'emerald' ? 'border-emerald-600/45 dark:border-emerald-500/30 hover:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-900/50')
              }`}
            >
              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>
          )}

          {/* Avatar Container with Animated Frame support and Online Indicator */}
          <div className="relative">
            <AvatarWithFrame
              photoUrl={borrower.profilePhoto}
              name={borrower.name}
              frameId={hideAvatarFrame ? 'none' : borrower.avatarFrame}
              size="sm"
              className="shrink-0"
              hasWarning={!!borrower.interestOnlyExtension}
            />
            {isOnline && (
              <span 
                className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-sm animate-pulse z-10" 
                title={language === 'kh' ? 'កំពុងអនឡាញ (Online)' : 'Online Now'} 
              />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-bold text-base leading-tight ${themeConfig.textTitle}`}>
                {borrower.name}
              </h3>
              {borrower.shortId && (
                <span className="inline-flex items-center text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 uppercase tracking-wider font-mono shadow-xs">
                  {borrower.shortId}
                </span>
              )}
              {isOnline && (
                <span className="inline-flex items-center text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500 text-white border border-emerald-600 shadow-xs animate-pulse">
                  🟢 {language === 'kh' ? 'អនឡាញ' : 'Online'}
                </span>
              )}
              {borrower.statusTag && (
                <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  borrower.statusTag === 'good'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                    : borrower.statusTag === 'late'
                      ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/20 animate-pulse'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                }`}>
                  {borrower.statusTag === 'good'
                    ? t('goodLabel')
                    : borrower.statusTag === 'late'
                      ? t('lateLabel')
                      : t('regularLabel')}
                </span>
              )}
              {borrower.interestOnlyExtension && (
                <span className="inline-flex items-center text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-white border border-amber-600 animate-pulse" title="កូនបំណុលសងការបន្តរ">
                  ⚠️ {language === 'kh' ? 'កូនបំណុលសងការបន្តរ' : 'Paying Interest Only'}
                </span>
              )}
              {borrower.topUpLoanAmount !== undefined && borrower.topUpLoanAmount > 0 && (
                <span className="inline-flex items-center text-[10px] font-black px-1.5 py-0.5 rounded bg-indigo-600 text-white border border-indigo-700 shadow-sm shadow-indigo-600/25" title="កម្ចីបន្ថែម">
                  💸 {language === 'kh' ? `ថែម៖ ${formatMoney(borrower.topUpLoanAmount, borrower.currency)}` : `Top-up: ${formatMoney(borrower.topUpLoanAmount, borrower.currency)}`}
                </span>
              )}
              {borrower.shareholderName && (
                <span className="inline-flex items-center text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25" title="ដៃគូភាគហ៊ុន">
                  🤝 {borrower.shareholderName} ({borrower.shareholderCalculationType === 'percent' ? `${borrower.shareholderSharePercent ?? 50}%` : `$${(borrower.shareholderDailyUSD ?? 1.0).toFixed(2)}/ថ្ងៃ`})
                </span>
              )}
            </div>
            {borrower.phone ? (
              <div className={`flex items-center gap-1 text-xs ${themeConfig.textMuted}`}>
                <Phone className="w-3.5 h-3.5 shrink-0 opacity-80" />
                <span>{borrower.phone}</span>
              </div>
            ) : (
              <span className={`text-xs italic ${themeConfig.textMuted} opacity-60`}>{t('noPhone')}</span>
            )}
          </div>
        </div>

        {/* Status Badge */}
        {isCompleted ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20 shrink-0">
            <CheckCircle className="w-3.5 h-3.5" />
            {t('completedLabel')}
          </span>
        ) : (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full border shrink-0 ${
            appTheme === 'angkor'
              ? 'bg-amber-500/10 text-amber-700 dark:text-[#f3d37a] border-amber-500/20'
              : appTheme === 'apsara'
                ? 'bg-purple-500/10 text-purple-700 dark:text-[#d3adff] border-purple-500/20'
                : appTheme === 'emerald'
                  ? 'bg-emerald-500/10 text-[#065f46] dark:text-[#a7f3d0] border-emerald-500/20'
                  : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            {t('activeLabel')
              .replace('{current}', String(payments.length))
              .replace('{total}', String(borrower.duration))}
          </span>
        )}
      </div>

      {/* Progress Section */}
      <div className="space-y-1.5">
        <div className={`flex justify-between items-end text-xs font-semibold ${themeConfig.textMuted}`}>
          <span>{t('progressLabel')}</span>
          <span className={isCompleted ? 'text-emerald-600 dark:text-emerald-400 font-bold' : (
            appTheme === 'angkor' ? 'text-amber-600 dark:text-[#dfb035] font-bold' :
            appTheme === 'apsara' ? 'text-purple-600 dark:text-[#b48bf5] font-bold' :
            appTheme === 'emerald' ? 'text-emerald-600 dark:text-[#6ee7b7] font-bold' :
            'text-blue-600 dark:text-blue-400 font-bold'
          )}>
            {progressPercent}%
          </span>
        </div>
        <div className={`w-full h-2 rounded-full overflow-hidden ${
          appTheme === 'angkor'
            ? 'bg-amber-100/50 dark:bg-amber-950/45'
            : appTheme === 'apsara'
              ? 'bg-purple-100/50 dark:bg-purple-950/45'
              : appTheme === 'emerald'
                ? 'bg-emerald-100/50 dark:bg-emerald-950/45'
                : 'bg-slate-100 dark:bg-slate-800'
        }`}>
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isCompleted
                ? 'bg-emerald-500'
                : appTheme === 'angkor'
                  ? 'bg-gradient-to-r from-[#b37e1b] to-[#dfb035]'
                  : appTheme === 'apsara'
                    ? 'bg-gradient-to-r from-[#5b21b6] to-[#7c3aed]'
                    : appTheme === 'emerald'
                      ? 'bg-gradient-to-r from-[#047857] to-[#059669]'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Money Statistics Row */}
      <div className={`grid grid-cols-2 gap-3 py-1 rounded-xl p-3 text-xs ${
        appTheme === 'angkor'
          ? 'bg-amber-50/60 dark:bg-[#120c04]/60 border border-amber-200/20 dark:border-[#dfb035]/15'
          : appTheme === 'apsara'
            ? 'bg-purple-50/60 dark:bg-[#0c071d]/60 border border-purple-200/20 dark:border-purple-500/15'
            : appTheme === 'emerald'
              ? 'bg-emerald-50/60 dark:bg-[#02140c]/60 border border-emerald-200/20 dark:border-emerald-500/15'
              : 'bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80'
      }`}>
        <div>
          <span className={`block mb-0.5 font-medium ${themeConfig.textMuted} opacity-85`}>{t('paidAmountLabel')}</span>
          <span className={`font-bold ${themeConfig.textTitle}`}>
            {formatMoney(totalPaid, borrower.currency)}
          </span>
        </div>
        <div>
          <span className={`block mb-0.5 font-medium ${themeConfig.textMuted} opacity-85`}>{t('remainingAmountLabel')}</span>
          <span className={`font-bold ${
            isCompleted 
              ? 'text-slate-400/60 dark:text-slate-500/60' 
              : 'text-orange-600 dark:text-orange-400'
          }`}>
            {formatMoney(remaining, borrower.currency)}
          </span>
        </div>
      </div>

      {/* Footer Info & Quick Action */}
      <div className={`flex items-center justify-between text-xs border-t pt-3 ${themeConfig.borderClass}`}>
        <div className={`flex items-center gap-1 ${themeConfig.textMuted}`}>
          <Calendar className="w-3.5 h-3.5 opacity-80" />
          <span>{t('loanDateLabel')} {formatKhmerDate(borrower.loanDate)}</span>
        </div>
        
        {/* Dynamic Payment Status when checked */}
        {isSelected && (
          <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[11px] font-black border border-emerald-500/20 animate-in fade-in zoom-in duration-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
            <span>{language === 'kh' ? 'បានបង់រួចរាល់' : 'Paid'}</span>
          </div>
        )}
        
        {/* Quick payment check button */}
        {!isCompleted ? (
          <div className="flex items-center gap-1.5">
            {onShowPaymentQr && (
              <motion.button
                id={`qr-code-btn-${borrower.id}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onShowPaymentQr(borrower);
                }}
                className="px-2 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm shadow-amber-500/10 cursor-pointer"
                title={language === 'kh' ? 'បង្ហាញ QR សម្រាប់បង់លុយ' : 'Show Payment QR Code'}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{language === 'kh' ? 'បង្ហាញ QR' : 'QR'}</span>
              </motion.button>
            )}
            <motion.button
              id={`quick-pay-btn-${borrower.id}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleQuickPayClick}
              className={`${getButtonStyleClass(buttonStyle, 'primary')} px-2.5 py-1 text-xs flex items-center gap-1.5 shadow-sm`}
              title={t('quickPay')}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{t('quickPay')}</span>
            </motion.button>
          </div>
        ) : (
          <span className={`font-semibold flex items-center gap-1 ${themeConfig.textMuted}`}>
            {t('totalLabel')} <strong className={themeConfig.textTitle}>{formatMoney(borrower.totalToPay, borrower.currency)}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
