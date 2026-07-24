import React, { useRef } from 'react';
import { X, Moon, Sun, Camera, FileText } from 'lucide-react';
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] ${currentThemeConfig.border} border-2 relative`}>
        
        {/* Glow effect for premium themes */}
        {(appTheme === 'angkor' || appTheme === 'apsara' || appTheme === 'emerald') && (
          <div className={`absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-br ${currentThemeConfig.colorClass}`} />
        )}

        <div className={`p-4 border-b dark:border-slate-800 flex justify-between items-center relative z-10 ${currentThemeConfig.bgLight} dark:bg-slate-800/50`}>
          <h2 className="text-lg font-black dark:text-white flex items-center gap-2">
            ⚙️ {language === 'kh' ? 'ការកំណត់ប្រព័ន្ធ' : 'System Settings'}
          </h2>
          <button onClick={() => { onClose(); playClickSound(); }} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto relative z-10">
          <div className="space-y-6">
            
            {/* Display / Themes */}
            <div>
              <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-3">
                {language === 'kh' ? 'រចនាបថ និងរូបរាង' : 'Display & Themes'}
              </h3>
              
              {/* App Colors */}
              <div className="mb-4">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{language === 'kh' ? 'ពណ៌ប្រព័ន្ធ:' : 'System Colors:'}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[ 
                    { id: "slate", nameKh: "លំនាំថ្មភក់", nameEn: "Classic Slate", icon: "⛰️", colorClass: "from-slate-600 to-slate-800 text-slate-100" },
                    { id: "angkor", nameKh: "រាជវាំងអង្គរមាស", nameEn: "Royal Angkor", icon: "🔱", colorClass: "from-[#dfb035] to-[#b37e1b] text-white font-black shadow-amber-500/15" },
                    { id: "apsara", nameKh: "រាត្រីទេពអប្សរា", nameEn: "Celestial Apsara", icon: "✨", colorClass: "from-[#100a25] to-[#251754] text-[#ebdcfc] shadow-purple-500/15" },
                    { id: "emerald", nameKh: "មេគង្គមរកត", nameEn: "Mekong Emerald", icon: "🌾", colorClass: "from-[#031d12] to-[#053c25] text-[#cbfce2] shadow-emerald-500/15" }
                  ].map(tPreset => (
                    <button
                      key={tPreset.id}
                      type="button"
                      onClick={() => setAppTheme(tPreset.id as AppThemeType)}
                      className={`p-3 rounded-2xl border text-left flex flex-col gap-1.5 transition duration-150 cursor-pointer shadow-xs ${
                        appTheme === tPreset.id
                          ? 'border-amber-500 ring-2 ring-amber-500/20 bg-gradient-to-br font-black ' + tPreset.colorClass
                          : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{tPreset.icon}</span>
                        <span className="text-sm leading-tight">{language === 'kh' ? tPreset.nameKh : tPreset.nameEn}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col">
                  <span className="text-sm font-bold dark:text-white">{language === 'kh' ? 'មុខងារងងឹត (Dark Mode)' : 'Dark Mode'}</span>
                </div>
                <div className="flex bg-slate-200 dark:bg-slate-900 rounded-lg p-1">
                  <button onClick={() => setTheme('light')} className={`px-3 py-1.5 rounded-md text-sm font-black transition cursor-pointer flex items-center gap-1.5 ${theme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                    <Sun className="w-4 h-4" /> ភ្លឺ
                  </button>
                  <button onClick={() => setTheme('dark')} className={`px-3 py-1.5 rounded-md text-sm font-black transition cursor-pointer flex items-center gap-1.5 ${theme === 'dark' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500'}`}>
                    <Moon className="w-4 h-4" /> ងងឹត
                  </button>
                </div>
              </div>
            </div>

            {/* General Preferences */}
            <div>
              <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-3">
                {language === 'kh' ? 'ការកំណត់ទូទៅ' : 'General Preferences'}
              </h3>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-bold dark:text-white">{language === 'kh' ? 'ភាសាប្រព័ន្ធ' : 'Language'}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setLanguage('kh')} className={`w-8 h-8 rounded-full overflow-hidden border-2 transition cursor-pointer ${language === 'kh' ? 'border-blue-500 scale-110 shadow-md' : 'border-transparent opacity-50'}`}>
                      <img src="https://flagcdn.com/w80/kh.png" alt="Khmer" className="w-full h-full object-cover" />
                    </button>
                    <button onClick={() => setLanguage('en')} className={`w-8 h-8 rounded-full overflow-hidden border-2 transition cursor-pointer ${language === 'en' ? 'border-blue-500 scale-110 shadow-md' : 'border-transparent opacity-50'}`}>
                      <img src="https://flagcdn.com/w80/us.png" alt="English" className="w-full h-full object-cover" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold dark:text-white">{language === 'kh' ? 'ចលនាអានីមេសិន' : 'UI Animations'}</span>
                    <span className="text-xs text-slate-500">{language === 'kh' ? 'បិទដើម្បីសន្សំថ្មនិងដើរលឿន' : 'Disable for performance'}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={enableAnimations} onChange={(e) => setEnableAnimations(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold dark:text-white">{language === 'kh' ? 'សំឡេងចុច (Click Sounds)' : 'Click Sound Effects'}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={enableSoundEffects} onChange={(e) => setEnableSoundEffects(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold dark:text-white">{language === 'kh' ? 'លាក់ស៊ុមរូបភាពកូនបំណុល' : 'Hide Borrower Avatar Frames'}</span>
                    <span className="text-xs text-slate-500">{language === 'kh' ? 'បិទស៊ុមផ្កា/ស៊ុមលម្អ' : 'Disable decorative avatar frames'}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={hideBorrowerAvatarFrames} onChange={(e) => setHideBorrowerAvatarFrames(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
                  </label>
                </div>

              </div>
            </div>

            {/* Organization / Brand settings */}
            {isAdmin && (
              <div>
                <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                  🏢 {language === 'kh' ? 'ការកំណត់ស្ថាប័ន' : 'Brand Profile'}
                </h3>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-3">
                  <div className="relative group cursor-pointer" onClick={triggerSystemLogoUpload}>
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden bg-white dark:bg-slate-800">
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
                  <p className="text-xs font-bold text-slate-500 text-center">
                    {language === 'kh' ? 'ចុចដើម្បីប្តូររូបភាព Logo ប្រព័ន្ធ' : 'Click to update system logo'}
                  </p>
                </div>
              </div>
            )}

            {/* Reset Area */}
            <div className="pt-4 border-t dark:border-slate-800">
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
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-sm font-black transition cursor-pointer"
              >
                {language === 'kh' ? 'ត្រឡប់ទៅការកំណត់ដើមវិញ (Reset)' : 'Reset Default Settings'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
