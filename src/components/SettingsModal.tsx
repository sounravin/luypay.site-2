import React, { useRef, useState, useEffect } from 'react';
import { X, Moon, Sun, Camera, FileText } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import type { AppThemeType, ButtonStyleType } from '../utils/theme';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'kh' | 'en';
  setLanguage: (lang: 'kh' | 'en') => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  appTheme: AppThemeType;
  setAppTheme: (t: AppThemeType) => void;
  buttonStyle: ButtonStyleType;
  setButtonStyle: (s: ButtonStyleType) => void;
  enableAnimations: boolean;
  setEnableAnimations: (e: boolean) => void;
  enableSoundEffects: boolean;
  setEnableSoundEffects: (e: boolean) => void;
  hideBorrowerAvatarFrames: boolean;
  setHideBorrowerAvatarFrames: (h: boolean) => void;
  showAdminContactSettings: boolean;
  setShowAdminContactSettings: (s: boolean) => void;
  playClickSound: () => void;
  currentThemeConfig: any;
  appThemes: any[];
  systemLogo: string | null;
  triggerSystemLogoUpload: () => void;
  handleSystemLogoUpload: (e: any) => void;
  systemLogoInputRef: any;
  isAdmin: boolean;
}

export default function SettingsModal({
  isOpen, onClose, language, setLanguage, theme, setTheme,
  appTheme, setAppTheme, buttonStyle, setButtonStyle,
  enableAnimations, setEnableAnimations, enableSoundEffects, setEnableSoundEffects,
  hideBorrowerAvatarFrames, setHideBorrowerAvatarFrames,
  showAdminContactSettings, setShowAdminContactSettings,
  playClickSound, currentThemeConfig, appThemes,
  systemLogo, triggerSystemLogoUpload, handleSystemLogoUpload,
  systemLogoInputRef, isAdmin
}: SettingsModalProps) {
  const [gpsRequired, setGpsRequired] = useState<boolean>(() => {
    const saved = localStorage.getItem('loan_app_require_gps');
    return saved !== null ? saved === 'true' : false;
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'gps_config'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && typeof data.requireGps === 'boolean') {
          setGpsRequired(data.requireGps);
          localStorage.setItem('loan_app_require_gps', String(data.requireGps));
        }
      }
    }, (err) => {
      console.warn("Error listening to gps_config in SettingsModal:", err);
    });
    return () => unsub();
  }, []);

  const handleToggleGps = async (checked: boolean) => {
    setGpsRequired(checked);
    localStorage.setItem('loan_app_require_gps', String(checked));
    window.dispatchEvent(new Event('storage'));
    try {
      await setDoc(doc(db, 'settings', 'gps_config'), { requireGps: checked, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn("Error updating gps_config in SettingsModal:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh] border border-slate-200/90 dark:border-slate-800 relative text-slate-900 dark:text-slate-100">
        
        {/* Glow effect for premium themes */}
        {(appTheme === 'angkor' || appTheme === 'apsara' || appTheme === 'emerald') && (
          <div className={`absolute inset-0 pointer-events-none opacity-15 bg-gradient-to-br ${currentThemeConfig.colorClass}`} />
        )}

        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0 relative z-10">
          <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <span className="p-1.5 bg-blue-600/30 text-blue-400 rounded-xl text-sm flex items-center justify-center">⚙️</span>
            <span>{language === 'kh' ? 'ការកំណត់ប្រព័ន្ធ' : 'System Settings'}</span>
          </h2>
          <button
            onClick={() => { onClose(); playClickSound(); }}
            className="p-1.5 bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto relative z-10 bg-slate-50/70 dark:bg-slate-950/90 space-y-5">
          
          {/* Display / Themes */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>{language === 'kh' ? 'រចនាបថ និងរូបរាង' : 'Display & Themes'}</span>
            </h3>
            
            {/* App Colors */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 rounded-2xl shadow-2xs mb-3 space-y-3">
              <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                {language === 'kh' ? 'ពណ៌ប្រព័ន្ធ (System Colors):' : 'System Colors:'}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {[ 
                  { id: "slate", nameKh: "លំនាំថ្មភក់", nameEn: "Classic Slate", icon: "⛰️", colorClass: "from-slate-700 to-slate-900 text-white border-slate-800 shadow-slate-900/20" },
                  { id: "angkor", nameKh: "រាជវាំងអង្គរមាស", nameEn: "Royal Angkor", icon: "🔱", colorClass: "from-[#dfb035] to-[#b37e1b] text-white border-amber-600 shadow-amber-500/20" },
                  { id: "apsara", nameKh: "រាត្រីទេពអប្សរា", nameEn: "Celestial Apsara", icon: "✨", colorClass: "from-[#100a25] to-[#251754] text-[#ebdcfc] border-purple-700 shadow-purple-500/20" },
                  { id: "emerald", nameKh: "មេគង្គមរកត", nameEn: "Mekong Emerald", icon: "🌾", colorClass: "from-[#031d12] to-[#053c25] text-[#cbfce2] border-emerald-700 shadow-emerald-500/20" }
                ].map(tPreset => {
                  const isSelected = appTheme === tPreset.id;
                  return (
                    <button
                      key={tPreset.id}
                      type="button"
                      onClick={() => { setAppTheme(tPreset.id as AppThemeType); playClickSound(); }}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition duration-150 cursor-pointer shadow-2xs relative overflow-hidden ${
                        isSelected
                          ? 'ring-2 ring-blue-500/40 border-transparent bg-gradient-to-br font-black ' + tPreset.colorClass
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/90 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      <span className="text-xl shrink-0">{tPreset.icon}</span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm font-black leading-tight truncate">{language === 'kh' ? tPreset.nameKh : tPreset.nameEn}</span>
                        <span className={`text-[10px] font-medium opacity-70 ${isSelected ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>{tPreset.nameEn}</span>
                      </div>
                      {isSelected && (
                        <span className="ml-auto w-2 h-2 rounded-full bg-white shadow-xs shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-3.5 rounded-2xl shadow-2xs flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-black text-slate-800 dark:text-slate-100">{language === 'kh' ? 'មុខងារងងឹត (Dark Mode)' : 'Dark Mode'}</span>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-800/90 rounded-xl p-1 border border-slate-200/80 dark:border-slate-700/80">
                <button onClick={() => { setTheme('light'); playClickSound(); }} className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${theme === 'light' ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                  <Sun className="w-4 h-4 text-amber-500" /> {language === 'kh' ? 'ភ្លឺ' : 'Light'}
                </button>
                <button onClick={() => { setTheme('dark'); playClickSound(); }} className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${theme === 'dark' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                  <Moon className="w-4 h-4" /> {language === 'kh' ? 'ងងឹត' : 'Dark'}
                </button>
              </div>
            </div>
          </div>

          {/* General Preferences */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span>{language === 'kh' ? 'ការកំណត់ទូទៅ' : 'General Preferences'}</span>
            </h3>
            
            <div className="space-y-2.5">
              {/* Language */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-3.5 rounded-2xl shadow-2xs flex items-center justify-between">
                <span className="text-sm font-black text-slate-800 dark:text-slate-100">{language === 'kh' ? 'ភាសាប្រព័ន្ធ' : 'Language'}</span>
                <div className="flex gap-2">
                  <button onClick={() => { setLanguage('kh'); playClickSound(); }} className={`px-3 py-1.5 rounded-xl border-2 text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${language === 'kh' ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 shadow-2xs' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
                    <span>🇰🇭</span>
                    <span>ខ្មែរ</span>
                  </button>
                  <button onClick={() => { setLanguage('en'); playClickSound(); }} className={`px-3 py-1.5 rounded-xl border-2 text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${language === 'en' ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 shadow-2xs' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
                    <span>🇺🇸</span>
                    <span>English</span>
                  </button>
                </div>
              </div>

              {/* Animations */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-3.5 rounded-2xl shadow-2xs flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-800 dark:text-slate-100">{language === 'kh' ? 'ចលនាអានីមេសិន' : 'UI Animations'}</span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{language === 'kh' ? 'បិទដើម្បីសន្សំថ្មនិងដើរលឿន' : 'Disable for performance'}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={enableAnimations} onChange={(e) => setEnableAnimations(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Click Sound */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-3.5 rounded-2xl shadow-2xs flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-800 dark:text-slate-100">{language === 'kh' ? 'សំឡេងចុច (Click Sounds)' : 'Click Sound Effects'}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={enableSoundEffects} onChange={(e) => setEnableSoundEffects(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Borrower Avatar Frames */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-3.5 rounded-2xl shadow-2xs flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-800 dark:text-slate-100">{language === 'kh' ? 'លាក់ស៊ុមរូបភាពកូនបំណុល' : 'Hide Borrower Avatar Frames'}</span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{language === 'kh' ? 'បិទស៊ុមផ្កា/ស៊ុមលម្អ' : 'Disable decorative avatar frames'}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={hideBorrowerAvatarFrames} onChange={(e) => setHideBorrowerAvatarFrames(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* GPS Location */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-3.5 rounded-2xl shadow-2xs flex items-center justify-between">
                <div className="flex flex-col pr-2">
                  <span className="text-sm font-black text-slate-800 dark:text-slate-100">{language === 'kh' ? 'តម្រូវអោយបើកទីតាំង GPS' : 'Require GPS Location'}</span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{language === 'kh' ? 'បើបិទ កូនបំណុលអាចបំពេញព័ត៌មានសុំកម្ចីបានដោយមិនបាច់ Allow Location Services ឡើយ' : 'If disabled, borrowers can apply without activating GPS location'}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={gpsRequired}
                    onChange={(e) => handleToggleGps(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                </label>
              </div>

            </div>
          </div>

          {/* Organization / Brand settings */}
          {isAdmin && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>🏢 {language === 'kh' ? 'ការកំណត់ស្ថាប័ន' : 'Brand Profile'}</span>
              </h3>
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs flex flex-col items-center gap-3">
                <div className="relative group cursor-pointer" onClick={triggerSystemLogoUpload}>
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-800 shadow-inner">
                    {systemLogo ? (
                      <img src={systemLogo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <input type="file" ref={systemLogoInputRef} onChange={handleSystemLogoUpload} accept="image/*" className="hidden" />
                </div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300 text-center">
                  {language === 'kh' ? 'ចុចដើម្បីប្តូររូបភាព Logo ប្រព័ន្ធ' : 'Click to update system logo'}
                </p>
              </div>
            </div>
          )}

          {/* Reset Area */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800">
            <button 
              onClick={() => {
                if(window.confirm(language === 'kh' ? 'តើអ្នកពិតជាចង់កំណត់ប្រព័ន្ធទៅសភាពដើមវិញមែនទេ?' : 'Reset to default settings?')) {
                  setTheme('light');
                  setAppTheme('slate');
                  setLanguage('kh');
                  setEnableAnimations(true);
                  setEnableSoundEffects(true);
                  onClose();
                }
              }}
              className="w-full py-3 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800/80 shadow-2xs flex items-center justify-center gap-2"
            >
              {language === 'kh' ? 'ត្រឡប់ទៅការកំណត់ដើមវិញ (Reset Default)' : 'Reset Default Settings'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
