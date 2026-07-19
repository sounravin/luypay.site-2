import React, { useMemo } from 'react';
import { Borrower } from '../types';
import { useLanguage } from '../i18n';
import { Activity, Wifi, Circle, Clock, MessageSquare, ArrowRight, UserCheck } from 'lucide-react';
import { formatMoney } from '../utils';

interface OnlineBorrowersPanelProps {
  borrowers: Borrower[];
  onSelectBorrower: (id: string) => void;
}

export default function OnlineBorrowersPanel({ borrowers, onSelectBorrower }: OnlineBorrowersPanelProps) {
  const { language } = useLanguage();

  // Determine who is Online (isOnline is true and lastActive is within 3 minutes)
  const onlineBorrowers = useMemo(() => {
    const threeMinutesAgo = Date.now() - 3 * 60 * 1000;
    return borrowers.filter(b => 
      b.isOnline && 
      b.lastActive && 
      b.lastActive > threeMinutesAgo
    );
  }, [borrowers]);

  // Determine who was Recently Active (visited in the last 24 hours but is currently offline)
  const recentlyActiveBorrowers = useMemo(() => {
    const threeMinutesAgo = Date.now() - 3 * 60 * 1000;
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    return borrowers.filter(b => {
      const isActuallyOnline = b.isOnline && b.lastActive && b.lastActive > threeMinutesAgo;
      return !isActuallyOnline && b.lastActive && b.lastActive > twentyFourHoursAgo;
    }).sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));
  }, [borrowers]);

  // Helper to format relative time in Khmer/English
  const formatRelativeTime = (timestamp?: number) => {
    if (!timestamp) return '';
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));

    if (diffMins < 1) {
      return language === 'kh' ? 'មុននេះបន្តិច' : 'just now';
    }
    if (diffMins < 60) {
      return language === 'kh' 
        ? `មុននេះ ${diffMins} នាទី` 
        : `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return language === 'kh' 
        ? `មុននេះ ${diffHours} ម៉ោង` 
        : `${diffHours}h ago`;
    }
    return language === 'kh' ? '១ ថ្ងៃមុន' : '1 day ago';
  };

  if (onlineBorrowers.length === 0 && recentlyActiveBorrowers.length === 0) {
    // If no one is online or recently active, render a mini clean banner so we don't waste space
    return (
      <div className="mx-0 p-4.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-3xs">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Wifi className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">
              {language === 'kh' ? 'មិនមានសកម្មភាពថ្មីៗពីកូនបំណុល' : 'No Recent Borrower Activity'}
            </h4>
            <p className="text-[10px] text-slate-400 font-bold">
              {language === 'kh' 
                ? 'ប្រព័ន្ធកំពុងរង់ចាំកូនបំណុលបើកតំណភ្ជាប់សងប្រាក់ក្នុងតំណភ្ជាប់ពិតប្រាកដ។' 
                : 'LuyPay will track borrower presence here when they visit their payment portal links.'}
            </p>
          </div>
        </div>
        <div className="text-[10px] bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-500 font-black flex items-center gap-1.5 border border-slate-200/50">
          <Circle className="w-2 h-2 fill-slate-300 text-slate-300" />
          <span>{language === 'kh' ? 'បច្ចុប្បន្នភាពស្វ័យប្រវត្ត' : 'Live Sync Active'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-indigo-950/95 via-slate-900/98 to-slate-950 border-2 border-indigo-500/25 rounded-3xl shadow-lg p-5 text-white overflow-hidden relative group">
      {/* Background cyber grid detail */}
      <div className="absolute inset-0 bg-[radial-gradient(#4338ca_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

      {/* Header section with Glowing Online badge */}
      <div className="flex items-center justify-between flex-wrap gap-4 relative z-10 border-b border-indigo-500/10 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-inner">
            <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-100 flex items-center gap-2">
              {language === 'kh' ? 'សកម្មភាពកូនបំណុលតាមតំណភ្ជាប់' : 'Real-time Portal Presence'}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h3>
            <p className="text-[10px] text-indigo-300 font-bold">
              {language === 'kh' 
                ? 'ត្រួតពិនិត្យវត្តមានកូនបំណុលក្នុងពេលបច្ចុប្បន្នពេលពួកគេបើកតំណភ្ជាប់' 
                : 'Monitor active and recently active debtors as they check their portal links'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-black text-xs px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-sm">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>
              {onlineBorrowers.length} {language === 'kh' ? 'កំពុង Online' : 'Online'}
            </span>
          </span>
          {recentlyActiveBorrowers.length > 0 && (
            <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-black text-xs px-3 py-1 rounded-xl flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {recentlyActiveBorrowers.length} {language === 'kh' ? 'សកម្មថ្មីៗ' : 'Recent'}
              </span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 relative z-10">
        {/* ONLINE SECTION */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400 uppercase tracking-wider pl-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{language === 'kh' ? '🟢 កំពុងប្រើប្រាស់ (Online Now)' : '🟢 Active Portal Visitors'}</span>
          </div>
          
          {onlineBorrowers.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 text-center">
              <p className="text-xs text-slate-400 font-semibold italic">
                {language === 'kh' ? 'មិនទាន់មានកូនបំណុលណាម្នាក់ចូលមើលទេ' : 'No active visitors at the moment'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {onlineBorrowers.map(b => (
                <button
                  key={b.id}
                  onClick={() => onSelectBorrower(b.id)}
                  className="bg-slate-900/80 hover:bg-slate-800/80 border border-indigo-500/20 hover:border-emerald-500/40 rounded-2xl p-3 text-left transition duration-200 cursor-pointer flex items-center gap-3 group/item shadow-md"
                >
                  <div className="relative">
                    {b.profilePhoto ? (
                      <img 
                        src={b.profilePhoto} 
                        alt={b.name} 
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-800 flex items-center justify-center border-2 border-emerald-400 text-xs font-extrabold uppercase">
                        {b.name.slice(0, 2)}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-white truncate group-hover/item:text-emerald-400 transition-colors">
                      {b.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold truncate">
                      {b.phone || (language === 'kh' ? 'គ្មានទូរស័ព្ទ' : 'No phone')}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-emerald-400 font-black">
                      <span className="inline-flex h-1 w-1 rounded-full bg-emerald-400 animate-ping" />
                      <span>{language === 'kh' ? 'កំពុងមើលតំណភ្ជាប់...' : 'Viewing Portal...'}</span>
                    </div>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover/item:text-emerald-400 group-hover/item:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RECENTLY ACTIVE SECTION */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-indigo-300 uppercase tracking-wider pl-1">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{language === 'kh' ? '🕒 ចូលមើលថ្មីៗ (Recently Active)' : '🕒 Recent Portal Activity'}</span>
          </div>

          {recentlyActiveBorrowers.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 text-center">
              <p className="text-xs text-slate-500 font-semibold italic">
                {language === 'kh' ? 'មិនទាន់មានកូនបំណុលចូលមើលក្នុងរយៈពេល ២៤ ម៉ោងនេះទេ' : 'No portal visits in the last 24h'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {recentlyActiveBorrowers.map(b => (
                <button
                  key={b.id}
                  onClick={() => onSelectBorrower(b.id)}
                  className="bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800 hover:border-indigo-500/30 rounded-2xl p-3 text-left transition duration-200 cursor-pointer flex items-center gap-3 group/item"
                >
                  <div className="relative opacity-80 group-hover/item:opacity-100 transition-opacity">
                    {b.profilePhoto ? (
                      <img 
                        src={b.profilePhoto} 
                        alt={b.name} 
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border-2 border-slate-700" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border-2 border-slate-700 text-xs font-extrabold uppercase text-slate-300">
                        {b.name.slice(0, 2)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-200 truncate group-hover/item:text-indigo-300 transition-colors">
                      {b.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold truncate">
                      {formatMoney(b.principal, b.currency)}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold mt-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-slate-500" />
                      <span>{formatRelativeTime(b.lastActive)}</span>
                    </p>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover/item:text-indigo-300 group-hover/item:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
