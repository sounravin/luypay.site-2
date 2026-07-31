import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Navigation, ExternalLink, Copy, Check, ShieldCheck, Clock, Smartphone, Compass } from 'lucide-react';
import { useLanguage } from '../i18n';

interface GPSLocationViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationData: {
    latitude?: number;
    longitude?: number;
    locationAccuracy?: number;
    locationAddress?: string;
    gpsCapturedAt?: string;
    deviceInfo?: string;
    borrowerName?: string;
    borrowerPhone?: string;
    reason?: string;
  } | null;
  title?: string;
}

export default function GPSLocationViewerModal({
  isOpen,
  onClose,
  locationData,
  title,
}: GPSLocationViewerModalProps) {
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !locationData) return null;

  const lat = locationData.latitude;
  const lng = locationData.longitude;
  const hasCoordinates = typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);

  const googleMapsUrl = hasCoordinates ? `https://www.google.com/maps?q=${lat},${lng}` : '';
  const googleNavUrl = hasCoordinates ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` : '';

  const handleCopy = () => {
    if (!hasCoordinates) return;
    const text = `${lat}, ${lng}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = locationData.gpsCapturedAt
    ? new Date(locationData.gpsCapturedAt).toLocaleString(language === 'kh' ? 'km-KH' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl shadow-2xl overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-emerald-950 via-slate-900 to-cyan-950 p-5 border-b border-emerald-900/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <MapPin className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  {title || (language === 'kh' ? 'ទីតាំង GPS របស់កូនបំណុល' : 'Borrower Verified GPS Location')}
                </h3>
                {locationData.borrowerName && (
                  <p className="text-xs text-emerald-400 font-medium">
                    {locationData.borrowerName} {locationData.borrowerPhone ? `(${locationData.borrowerPhone})` : ''}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Status Card */}
            {hasCoordinates ? (
              <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-emerald-300">
                      {language === 'kh' ? 'ទីតាំងបានផ្ទៀងផ្ទាត់ (GPS Verified)' : 'Verified GPS Location'}
                    </div>
                    <div className="text-[11px] text-emerald-400/80">
                      {language === 'kh' ? 'កូអរដោនេច្បាស់លាស់ពីឧបករណ៍កូនបំណុល' : 'Exact coordinates captured via borrower device'}
                    </div>
                  </div>
                </div>
                {locationData.locationAccuracy && (
                  <span className="px-2.5 py-1 bg-emerald-900/60 text-emerald-200 border border-emerald-700/50 rounded-xl text-xs font-mono font-bold shrink-0">
                    ±{Math.round(locationData.locationAccuracy)}m
                  </span>
                )}
              </div>
            ) : (
              <div className="bg-amber-950/40 border border-amber-800/40 rounded-2xl p-4 flex items-center gap-3 text-amber-300 text-xs">
                <MapPin className="w-5 h-5 shrink-0 text-amber-400" />
                <span>
                  {language === 'kh'
                    ? 'មិនមានព័ត៌មានកូអរដោនេ GPS សម្រាប់សំណើនេះទេ'
                    : 'No valid GPS location coordinates found for this request'}
                </span>
              </div>
            )}

            {/* Coordinates Box */}
            {hasCoordinates && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    {language === 'kh' ? 'កូអរដោនេ GPS (Lat, Lng)' : 'GPS Coordinates'}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">{language === 'kh' ? 'បានចម្លង!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{language === 'kh' ? 'ចម្លង' : 'Copy'}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="font-mono text-base font-black text-amber-300 bg-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span>{lat?.toFixed(6)}, {lng?.toFixed(6)}</span>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                    title="Open Map"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Meta details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  {formattedDate && (
                    <div className="flex items-center gap-2 text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{formattedDate}</span>
                    </div>
                  )}
                  {locationData.deviceInfo && (
                    <div className="flex items-center gap-2 text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                      <Smartphone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate">{locationData.deviceInfo}</span>
                    </div>
                  )}
                </div>

                {locationData.reason && (
                  <div className="text-xs bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-slate-300">
                    <span className="font-bold text-amber-400">{language === 'kh' ? 'មូលហេតុ៖ ' : 'Reason: '}</span>
                    {locationData.reason}
                  </div>
                )}
              </div>
            )}

            {/* Embedded Map Visual Card */}
            {hasCoordinates && (
              <div className="relative h-44 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center group">
                {/* Visual grid / pins */}
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40 pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center gap-2 text-center p-4">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute w-12 h-12 rounded-full bg-emerald-500/20 animate-ping" />
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/30">
                      <MapPin className="w-5 h-5 fill-slate-950" />
                    </div>
                  </div>
                  <div className="text-xs font-bold text-slate-200">
                    {locationData.locationAddress || (language === 'kh' ? 'ទីតាំង GPS ផ្លូវការ' : 'Official Verified GPS Pin')}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {lat?.toFixed(5)}, {lng?.toFixed(5)}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {hasCoordinates && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-2xl border border-slate-700 shadow-md transition active:scale-95 text-center"
                >
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>{language === 'kh' ? 'មើលលើ Google Maps' : 'View on Google Maps'}</span>
                </a>

                <a
                  href={googleNavUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-950 transition active:scale-95 text-center"
                >
                  <Navigation className="w-4 h-4" />
                  <span>{language === 'kh' ? 'នាំផ្លូវទៅកាន់ GPS (Navigate)' : 'Navigate with GPS'}</span>
                </a>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
