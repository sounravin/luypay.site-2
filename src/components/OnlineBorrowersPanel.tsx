import React, { useMemo, useState } from 'react';
import { Borrower } from '../types';
import { useLanguage } from '../i18n';
import { Activity, Wifi, Circle, Clock, MessageSquare, ArrowRight, UserCheck, Play, Power } from 'lucide-react';
import { formatMoney } from '../utils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface OnlineBorrowersPanelProps {
  borrowers: Borrower[];
  onSelectBorrower: (id: string) => void;
}

export default function OnlineBorrowersPanel({ borrowers, onSelectBorrower }: OnlineBorrowersPanelProps) {
  const { language } = useLanguage();
  const [isSimulating, setIsSimulating] = useState(false);

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

  // Handle live demo simulation: set 1-2 existing borrowers to online
  const startSimulation = async () => {
    if (borrowers.length === 0) return;
    setIsSimulating(true);
    
    // Choose up to 2 random borrowers
    const shuffled = [...borrowers].sort(() => 0.5 - Math.random());
    const targets = shuffled.slice(0, Math.min(2, shuffled.length));

    for (const target of targets) {
      try {
        const docRef = doc(db, 'borrowers', target.id);
        await updateDoc(docRef, {
          isOnline: true,
          lastActive: Date.now()
        });
      } catch (err) {
        console.error("Simulation error:", err);
      }
    }
  };

  // Turn off simulation: set everyone offline
  const stopSimulation = async () => {
    setIsSimulating(false);
    const activeBorrowers = borrowers.filter(b => b.isOnline);
    for (const b of activeBorrowers) {
      try {
        const docRef = doc(db, 'borrowers', b.id);
        await updateDoc(docRef, {
          isOnline: false,
          lastActive: Date.now() - 5 * 60 * 1000 // 5 minutes ago to put in recently active
        });
      } catch (err) {
        console.error("Stop simulation error:", err);
      }
    }
  };

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
    // If no one is online or recently active, render a mini clean banner so we don't waste space but keep simulation button
    return (
      <div className="mx-0 p-4.5 bg-gradient-to-br from-slate-900/95 via-slate-950 to-slate-900 border border-slate-200/20 dark:border-indigo-500/10 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-3xs text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#4338ca_1px,transparent_1px)] [background-size:16px_16px] opacity-5 pointer-events-none" />
        <div className="flex items-center gap-3 text-center md:text-left relative z-10">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
            <Wifi className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-100 flex items-center gap-2 justify-center md:justify-start">
              <span>{language === 'kh' ? 'មិនទាន់មានកូនបំណុលអនឡាញបច្ចុប្បន្ន' : 'No Borrowers Online Currently'}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
            </h4>
            <p className="text-[10px] text-slate-400 font-bold">
              {language === 'kh' 
                ? 'ប្រព័ន្ធកំពុងរង់ចាំកូនបំណុលបើកតំណភ្ជាប់។ បងអាចចុចប៊ូតុង "តេស្តអនឡាញ" ដើម្បីសាកល្បងមើលផ្ទាំង Digital Onilne បាន។' 
                : 'Waiting for clients to open their links. Click "Simulate Live" to test the live online panel.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 relative z-10 w-full md:w-auto justify-center">
          <button
            onClick={startSimulation}
            disabled={borrowers.length === 0}
            className="px-3.5 py-1.5 text-[10px] font-black bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded-xl transition duration-150 cursor-pointer text-white flex items-center gap-1.5 shadow-md shadow-indigo-500/20 disabled:opacity-50"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>{language === 'kh' ? 'តេស្តអនឡាញ (Simulate Live)' : 'Simulate Live'}</span>
          </button>
          <div className="text-[10px] bg-slate-800 px-3 py-1 rounded-full text-indigo-400 font-black flex items-center gap-1.5 border border-slate-700">
            <Circle className="w-1.5 h-1.5 fill-indigo-500 text-indigo-500 animate-pulse" />
            <span>{language === 'kh' ? 'ត្រួតពិនិត្យផ្សាយផ្ទាល់' : 'Monitoring Live'}</span>
          </div>
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

        <div className="flex items-center gap-3.5 flex-wrap">
          {/* Simulation Controllers */}
          {isSimulating ? (
            <button
              onClick={stopSimulation}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-xl text-[10px] font-black text-rose-300 transition duration-150 flex items-center gap-1 cursor-pointer"
            >
              <Power className="w-3 h-3" />
              <span>{language === 'kh' ? 'បិទការតេស្ត' : 'Stop Test'}</span>
            </button>
          ) : (
            <button
              onClick={startSimulation}
              className="px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-[10px] font-black text-indigo-300 transition duration-150 flex items-center gap-1 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{language === 'kh' ? 'តេស្តអនឡាញ' : 'Test Simulation'}</span>
            </button>
          )}

          <div className="flex items-center gap-2">
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

