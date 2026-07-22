import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, CheckCircle2, ShieldCheck, Palette, Crown } from 'lucide-react';
import KhmerAvatarFrame, { KHMER_AVATAR_FRAMES, KhmerAvatarFrameOption } from './KhmerAvatarFrame';
import { useLanguage } from '../i18n';
import { playClickSound } from '../utils';

interface KhmerAvatarFrameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFrameId: string;
  onSelectFrame: (frameId: string) => void;
  renderLogoPreview: (sizeClass?: string) => React.ReactNode;
}

export default function KhmerAvatarFrameModal({
  isOpen,
  onClose,
  currentFrameId,
  onSelectFrame,
  renderLogoPreview
}: KhmerAvatarFrameModalProps) {
  const { language } = useLanguage();
  const [selectedFrame, setSelectedFrame] = React.useState<string>(currentFrameId || 'kbach_gold');

  React.useEffect(() => {
    setSelectedFrame(currentFrameId || 'kbach_gold');
  }, [currentFrameId, isOpen]);

  if (!isOpen) return null;

  const handleApply = (frameId: string) => {
    playClickSound();
    setSelectedFrame(frameId);
    onSelectFrame(frameId);
    onClose();
  };

  const activeOption = KHMER_AVATAR_FRAMES.find((f) => f.id === selectedFrame) || KHMER_AVATAR_FRAMES[0];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-3xl bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Top Decorative Khmer Gradient Bar */}
          <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-yellow-300 via-emerald-400 via-sky-400 to-amber-500 animate-[marquee-scroll_15s_linear_infinite]" />

          {/* Modal Header */}
          <div className="p-5 md:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
                <Crown className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg md:text-xl font-black text-white tracking-tight">
                    {language === 'kh' ? 'ជ្រើសរើស ក្បាច់ស៊ុម Khmer Avatar' : 'Select Khmer Avatar Frame'}
                  </h3>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    Khmer Edition
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  {language === 'kh'
                    ? 'បន្ថែមស៊ុមចលនាបែបក្បាច់ខ្មែរចែងចាំងលើ Logo / Avatar គណនីរបស់អ្នក'
                    : 'Add animated Khmer traditional ornament frames to your account logo & avatar'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Live Big Preview Section */}
          <div className="bg-slate-950/70 p-6 border-b border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div
              className="absolute inset-0 opacity-20 blur-2xl transition-all duration-500 pointer-events-none"
              style={{ backgroundColor: activeOption.themeColor }}
            />

            <div className="flex items-center gap-6 relative z-10">
              {/* Big Avatar Frame Preview */}
              <div className="p-3">
                <KhmerAvatarFrame
                  frameId={selectedFrame}
                  sizeClass="w-20 h-20"
                  showSelectorBadge={false}
                  interactive={false}
                >
                  {renderLogoPreview("w-20 h-20")}
                </KhmerAvatarFrame>
              </div>

              <div>
                <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-1.5">
                  {activeOption.badge}
                </span>
                <h4 className="text-lg font-black text-white">{activeOption.nameKh}</h4>
                <p className="text-xs text-slate-300 font-medium max-w-md mt-1 leading-relaxed">
                  {language === 'kh' ? activeOption.descKh : activeOption.descEn}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleApply(selectedFrame)}
              className="relative z-10 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-yellow-200 shrink-0"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>{language === 'kh' ? 'រក្សាទុក & ប្រើប្រាស់' : 'Save & Apply Frame'}</span>
            </button>
          </div>

          {/* Frame Options Grid */}
          <div className="p-5 md:p-6 overflow-y-auto max-h-[50vh] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 custom-scrollbar">
            {KHMER_AVATAR_FRAMES.map((option) => {
              const isSelected = selectedFrame === option.id;
              const isActiveInApp = currentFrameId === option.id;

              return (
                <div
                  key={option.id}
                  onClick={() => {
                    playClickSound();
                    setSelectedFrame(option.id);
                  }}
                  className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${
                    isSelected
                      ? 'bg-slate-800/90 border-amber-400 shadow-lg shadow-amber-500/10 scale-[1.02]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  {/* Small Frame Preview */}
                  <div className="shrink-0">
                    <KhmerAvatarFrame
                      frameId={option.id}
                      sizeClass="w-12 h-12"
                      showSelectorBadge={false}
                      interactive={false}
                    >
                      {renderLogoPreview("w-12 h-12")}
                    </KhmerAvatarFrame>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h5 className="text-xs font-black text-white truncate">{option.nameKh}</h5>
                      {isActiveInApp && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                          {language === 'kh' ? 'សកម្ម' : 'Active'}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                      {option.nameEn}
                    </p>
                    <span className="inline-block text-[9px] font-bold text-amber-300/80 mt-1">
                      {option.badge}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="absolute top-2 right-2 text-amber-400">
                      <CheckCircle2 className="w-4 h-4 fill-amber-400 text-slate-950" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{language === 'kh' ? 'ស៊ុមចលនាត្រូវបានរក្សាទុកស្វ័យប្រវត្តិ' : 'Frame persistence enabled'}</span>
            </div>
            <button
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition"
            >
              {language === 'kh' ? 'បិទ' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
