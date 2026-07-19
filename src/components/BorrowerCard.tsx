import React from 'react';
import { Borrower } from '../types';
import { formatMoney, formatKhmerDate } from '../utils';
import { Calendar, Phone, CheckCircle, Clock, Check } from 'lucide-react';
import { useLanguage } from '../i18n';
import AvatarWithFrame from './AvatarWithFrame';
import { motion } from 'motion/react';
import { getButtonStyleClass } from '../utils/theme';
import type { ButtonStyleType } from '../utils/theme';

interface BorrowerCardProps {
  borrower: Borrower;
  onSelect: (borrower: Borrower) => void;
  onQuickPay: (borrowerId: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (borrowerId: string) => void;
  buttonStyle?: ButtonStyleType;
}

export default function BorrowerCard({ borrower, onSelect, onQuickPay, isSelected = false, onToggleSelect, buttonStyle = 'kbach' }: BorrowerCardProps) {
  const { t } = useLanguage();

  // Calculate if the borrower is currently Online
  const isOnline = !!(
    borrower.isOnline && 
    borrower.lastActive && 
    borrower.lastActive > Date.now() - 3 * 60 * 1000
  );

  // Calculate payments
  const payments = Array.isArray(borrower.payments) ? borrower.payments : [];
  const totalPaid = payments.reduce((sum, p) => sum + (p?.amount || 0), 0);
  const remaining = Math.max(0, borrower.totalToPay - totalPaid);
  
  // Progress percentage
  const progressPercent = Math.min(100, Math.round((totalPaid / borrower.totalToPay) * 100));
  
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

  const cardBorderClass = isSelected
    ? 'border-emerald-500 ring-2 ring-emerald-500/10'
    : buttonStyle === 'kbach'
      ? 'border-[#dfb035]/40 hover:border-[#dfb035] bg-gradient-to-br from-white to-[#fffcf3] dark:from-[#1b1409] dark:to-[#3a2a12] shadow-inner'
      : buttonStyle === 'neon'
        ? 'border-cyan-500/30 hover:border-cyan-400 hover:shadow-cyan-500/10 dark:bg-[#071329] shadow-cyan-500/5 shadow-md'
        : 'border-slate-200 dark:border-slate-800 dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg';

  return (
    <div
      id={`borrower-card-${borrower.id}`}
      onClick={() => onSelect(borrower)}
      className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 shadow-sm relative overflow-hidden ${cardBorderClass}`}
    >
      {buttonStyle === 'kbach' && (
        <>
          <div className="absolute top-0 left-0 w-4 h-4 opacity-40 pointer-events-none">
            <svg viewBox="0 0 16 16" fill="none" className="text-[#dfb035] w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0 L16 0 C12 1, 8 3, 5 6 C3 8, 1 12, 0 16 Z" fill="currentColor"/>
            </svg>
          </div>
          <div className="absolute top-0 right-0 w-4 h-4 opacity-40 pointer-events-none rotate-90">
            <svg viewBox="0 0 16 16" fill="none" className="text-[#dfb035] w-full h-full" xmlns="http://www.w3.org/2000/svg">
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
          <span>{useLanguage().language === 'kh' ? 'បង់រួច' : 'Paid'}</span>
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
            {useLanguage().language === 'kh' ? 'បានជ្រើសរើស' : 'Selected'}
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
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50'
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
              frameId={borrower.avatarFrame}
              size="sm"
              className="shrink-0"
              hasWarning={!!borrower.interestOnlyExtension}
            />
            {isOnline && (
              <span 
                className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-sm animate-pulse z-10" 
                title={useLanguage().language === 'kh' ? 'កំពុងអនឡាញ (Online)' : 'Online Now'} 
              />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-800 text-base leading-tight">
                {borrower.name}
              </h3>
              {isOnline && (
                <span className="inline-flex items-center text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500 text-white border border-emerald-600 shadow-xs animate-pulse">
                  🟢 {useLanguage().language === 'kh' ? 'អនឡាញ' : 'Online'}
                </span>
              )}
              {borrower.statusTag && (
                <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  borrower.statusTag === 'good'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : borrower.statusTag === 'late'
                      ? 'bg-rose-50 text-rose-700 border border-rose-100 animate-pulse'
                      : 'bg-amber-50 text-amber-700 border border-amber-100'
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
                  ⚠️ {useLanguage().language === 'kh' ? 'កូនបំណុលសងការបន្តរ' : 'Paying Interest Only'}
                </span>
              )}
              {borrower.topUpLoanAmount !== undefined && borrower.topUpLoanAmount > 0 && (
                <span className="inline-flex items-center text-[10px] font-black px-1.5 py-0.5 rounded bg-indigo-600 text-white border border-indigo-700 shadow-sm shadow-indigo-600/25" title="កម្ចីបន្ថែម">
                  💸 {useLanguage().language === 'kh' ? `ថែម៖ ${formatMoney(borrower.topUpLoanAmount, borrower.currency)}` : `Top-up: ${formatMoney(borrower.topUpLoanAmount, borrower.currency)}`}
                </span>
              )}
            </div>
            {borrower.phone ? (
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{borrower.phone}</span>
              </div>
            ) : (
              <span className="text-xs text-slate-300 italic">{t('noPhone')}</span>
            )}
          </div>
        </div>

        {/* Status Badge */}
        {isCompleted ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 shrink-0">
            <CheckCircle className="w-3.5 h-3.5" />
            {t('completedLabel')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-700 rounded-full border border-blue-100 shrink-0">
            <Clock className="w-3.5 h-3.5" />
            {t('activeLabel')
              .replace('{current}', String(payments.length))
              .replace('{total}', String(borrower.duration))}
          </span>
        )}
      </div>

      {/* Progress Section */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-end text-xs font-semibold text-slate-500">
          <span>{t('progressLabel')}</span>
          <span className={isCompleted ? 'text-emerald-600 font-bold' : 'text-blue-600 font-bold'}>
            {progressPercent}%
          </span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${isCompleted ? 'bg-emerald-500' : 'bg-blue-600'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Money Statistics Row */}
      <div className="grid grid-cols-2 gap-3 py-1 bg-slate-50/80 rounded-xl p-3 text-xs border border-slate-100">
        <div>
          <span className="text-slate-400 block mb-0.5 font-medium">{t('paidAmountLabel')}</span>
          <span className="font-bold text-slate-700">
            {formatMoney(totalPaid, borrower.currency)}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5 font-medium">{t('remainingAmountLabel')}</span>
          <span className={`font-bold ${isCompleted ? 'text-slate-300' : 'text-orange-600'}`}>
            {formatMoney(remaining, borrower.currency)}
          </span>
        </div>
      </div>

      {/* Footer Info & Quick Action */}
      <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-3">
        <div className="flex items-center gap-1 text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          <span>{t('loanDateLabel')} {formatKhmerDate(borrower.loanDate)}</span>
        </div>
        
        {/* Quick payment check button */}
        {!isCompleted ? (
          <motion.button
            id={`quick-pay-btn-${borrower.id}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleQuickPayClick}
            className={`${getButtonStyleClass(buttonStyle, 'primary')} px-3 py-1 text-xs flex items-center gap-1.5 shadow-sm`}
            title={t('quickPay')}
          >
            <Check className="w-3 h-3 stroke-[3]" />
            <span>{t('quickPay')}</span>
          </motion.button>
        ) : (
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            {t('totalLabel')} {formatMoney(borrower.totalToPay, borrower.currency)}
          </span>
        )}
      </div>
    </div>
  );
}
