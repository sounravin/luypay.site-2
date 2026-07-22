import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, X, Sparkles, Bell, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { playNotificationSound } from './NotificationBell';

interface PlanApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId?: '1_month' | '3_months' | '1_year' | string;
  language: 'kh' | 'en';
}

export default function PlanApprovalModal({
  isOpen,
  onClose,
  planId = '1_month',
  language
}: PlanApprovalModalProps) {
  const [countdown, setCountdown] = useState<number>(5);

  const planInfoMap: Record<string, { nameKh: string; nameEn: string; price: string; durationKh: string; durationEn: string }> = {
    '1_month': {
      nameKh: 'គម្រោង ១ ខែ',
      nameEn: '1-Month Plan',
      price: '$5',
      durationKh: '៣០ ថ្ងៃ',
      durationEn: '30 Days'
    },
    '3_months': {
      nameKh: 'គម្រោង ៣ ខែ',
      nameEn: '3-Month Plan',
      price: '$12',
      durationKh: '៩០ ថ្ងៃ',
      durationEn: '90 Days'
    },
    '1_year': {
      nameKh: 'គម្រោង ១ ឆ្នាំ',
      nameEn: '1-Year Plan',
      price: '$35',
      durationKh: '៣៦៥ ថ្ងៃ',
      durationEn: '365 Days'
    },
    'shareholder_addon': {
      nameKh: 'មុខងារ គ្រប់គ្រងម្ចាស់ភាគហ៊ុន (Shareholders)',
      nameEn: 'Shareholders Management Module',
      price: '$10',
      durationKh: 'ប្រើប្រាស់រហូត (Lifetime)',
      durationEn: 'Lifetime Access'
    }
  };

  const planInfo = planInfoMap[planId] || planInfoMap['1_month'];

  useEffect(() => {
    if (!isOpen) return;

    // Play chime sound on pop-up open
    playNotificationSound();

    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose(); // Auto close after 5 seconds
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-[999] animate-in fade-in duration-300">
      <div className="relative max-w-md w-full bg-[#0B1521] border-2 border-emerald-500/50 rounded-3xl p-6 text-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Glow background effects */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button at top right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700 z-10"
          title={language === 'kh' ? 'បិទ' : 'Close'}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-5 relative z-10">
          {/* Top Animated Notification Bell Badge */}
          <div className="relative inline-flex items-center justify-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/30 animate-bounce">
              <div className="w-full h-full bg-[#0B1521] rounded-[22px] flex items-center justify-center">
                <Bell className="w-10 h-10 text-emerald-400 animate-wiggle" />
              </div>
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === 'kh' ? 'ការជូនដំណឹងពិសេស 🔔' : 'Special Alert 🔔'}</span>
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight pt-1">
              {language === 'kh' ? '🎉 សូមអបអរសាទរ!' : '🎉 Congratulations!'}
            </h3>
            <p className="text-xs font-bold text-slate-300 leading-relaxed max-w-xs mx-auto">
              {language === 'kh'
                ? (planId === 'shareholder_addon'
                    ? 'សូមអបអរសាទរ ដែលបានទិញ ឬ Upgrade បន្ថែម មុខងារ គ្រប់គ្រងម្ចាស់ភាគហ៊ុន (Shareholders) ក្នុងតម្លៃ $10 ដោយជោគជ័យ!'
                    : 'គណនីរបស់អ្នកទទួលបានការអនុម័ត និងបើកដំណើរការគម្រោងដោយជោគជ័យ!')
                : (planId === 'shareholder_addon'
                    ? 'Congratulations on purchasing and upgrading the Shareholders Management Add-on module for $10!'
                    : 'Your account has been approved and your subscription is now active!')}
            </p>
          </div>

          {/* Plan Details Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-left space-y-3 shadow-inner">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="text-xs text-slate-400 font-bold">
                {language === 'kh' ? 'ឈ្មោះគម្រោង៖' : 'Plan Name:'}
              </span>
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wide">
                {language === 'kh' ? planInfo.nameKh : planInfo.nameEn}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="text-xs text-slate-400 font-bold">
                {language === 'kh' ? 'តម្លៃគម្រោង៖' : 'Plan Price:'}
              </span>
              <span className="text-sm font-black text-amber-400 font-mono">
                {planInfo.price}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400 font-bold">
                {language === 'kh' ? 'រយៈពេលទទួលបាន៖' : 'Plan Duration:'}
              </span>
              <span className="text-xs font-black text-blue-400">
                {language === 'kh' ? planInfo.durationKh : planInfo.durationEn}
              </span>
            </div>
          </div>

          {/* 5-second countdown progress indicator */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                {language === 'kh' ? 'បិទស្វ័យប្រវត្តិក្នុងរយៈពេល' : 'Auto closing in'}
              </span>
              <span className="text-amber-400 font-mono text-xs">{countdown}s</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / 5) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Action Close / Enter App Button */}
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 text-white rounded-2xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 border border-emerald-400/30"
          >
            <span>{language === 'kh' ? 'បិទ / ចូលទៅប្រើប្រាស់' : 'Close & Proceed to Use'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
