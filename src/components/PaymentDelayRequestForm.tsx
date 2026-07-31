import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, setDoc, doc, getDoc } from 'firebase/firestore';
import { Borrower, PaymentDelayRequest } from '../types';
import { useLanguage } from '../i18n';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, MapPin, Navigation, Send, CheckCircle2, AlertCircle, 
  Clock, FileText, Phone, User, ShieldCheck, RefreshCw, ChevronLeft,
  Copy, Check, Share2, Lock, ExternalLink
} from 'lucide-react';

interface PaymentDelayRequestFormProps {
  borrowerId?: string | null;
  lenderId?: string | null;
  borrowerNamePrefill?: string;
  borrowerPhonePrefill?: string;
  onSubmitSuccess?: (requestId: string) => void;
  onBackToPortal?: () => void;
}

const STANDARD_DELAY_REASONS = [
  'គ្រួសារមានធុរៈ ឬបញ្ហាសុខភាព (Family / Health Issue)',
  'អាជីវកម្មយឺតយ៉ាវ / មិនទាន់ប្រមូលលុយបាន (Business Delay / Outstanding Invoices)',
  'រង់ចាំប្រាក់ខែចេញ (Awaiting Monthly Salary)',
  'សុំយកកម្ចីបន្ថែមបូកបញ្ចូលកម្ចីចាស់ (Request Top-Up Loan Extension)',
  'ផ្សេងៗ (Other Reason)',
];

export default function PaymentDelayRequestForm({
  borrowerId,
  lenderId = 'sounravin',
  borrowerNamePrefill = '',
  borrowerPhonePrefill = '',
  onSubmitSuccess,
  onBackToPortal,
}: PaymentDelayRequestFormProps) {
  const { language } = useLanguage();

  const [borrowerName, setBorrowerName] = useState(borrowerNamePrefill);
  const [borrowerPhone, setBorrowerPhone] = useState(borrowerPhonePrefill);
  const [selectedReason, setSelectedReason] = useState(STANDARD_DELAY_REASONS[0]);
  const [customReasonNote, setCustomReasonNote] = useState('');
  const [requestedDate, setRequestedDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 3);
    return today.toISOString().split('T')[0];
  });
  const [linkedBorrower, setLinkedBorrower] = useState<Borrower | null>(null);

  // GPS Location state
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [locationCaptured, setLocationCaptured] = useState(false);
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [locationAccuracy, setLocationAccuracy] = useState<number | undefined>(undefined);
  const [gpsCapturedAt, setGpsCapturedAt] = useState<string | undefined>(undefined);
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);

  // Standalone Share Link State
  const [copiedLink, setCopiedLink] = useState(false);

  // Form Submission
  const [submitting, setSubmitting] = useState(false);
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);

  // Handle GPS location capture with clear permission feedback
  const handleVerifyLocation = () => {
    setGpsErrorMsg(null);

    if (!navigator.geolocation) {
      setGpsErrorMsg(
        language === 'kh'
          ? 'កម្មវិធីបើកអ៊ីនធឺណិតរបស់អ្នកមិនគាំទ្រ GPS ទេ'
          : 'Geolocation is not supported by your browser'
      );
      return;
    }

    setIsCapturingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocationAccuracy(position.coords.accuracy);
        setGpsCapturedAt(new Date().toISOString());
        setLocationCaptured(true);
        setIsCapturingLocation(false);
      },
      (error) => {
        setIsCapturingLocation(false);
        console.warn('Geolocation capture error:', error);
        let errorText =
          language === 'kh'
            ? 'មិនអាចចាប់ទីតាំងបានទេ! សូមចុច អនុញ្ញាត (Allow Location) លើ Browser Pop-up របស់អ្នក'
            : 'Unable to acquire location. Please grant Browser Location Permission.';

        if (error.code === error.PERMISSION_DENIED) {
          errorText =
            language === 'kh'
              ? '⚠️ អ្នកបានបដិសេធសិទ្ធិទីតាំង! សូមចូលទៅកាន់ Settings របស់ Browser ដើម្បីបើកសិទ្ធិ Location (Allow Location Access) រួចចុចព្យាយាមម្ដងទៀត។'
              : '⚠️ Location permission denied. Please enable location permissions in browser settings.';
        } else if (error.code === error.TIMEOUT) {
          errorText =
            language === 'kh'
              ? '⚠️ ការចាប់ទីតាំងផុតកំណត់! សូមចុចព្យាយាមម្ដងទៀត'
              : '⚠️ Location acquisition timed out. Please try again.';
        }

        setGpsErrorMsg(errorText);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // Automatically request GPS location on component mount
  useEffect(() => {
    handleVerifyLocation();
  }, []);

  // Auto load borrower info if borrowerId is provided
  useEffect(() => {
    if (!borrowerId) return;

    const fetchBorrower = async () => {
      try {
        const bDoc = await getDoc(doc(db, 'borrowers', borrowerId));
        if (bDoc.exists()) {
          const bData = bDoc.data() as Borrower;
          setLinkedBorrower(bData);
          if (bData.name) setBorrowerName(bData.name);
          if (bData.phone) setBorrowerPhone(bData.phone);
        }
      } catch (e) {
        console.warn('Error pre-loading borrower for delay form:', e);
      }
    };

    fetchBorrower();
  }, [borrowerId]);

  const handleCopyDirectLink = () => {
    const standaloneUrl = `${window.location.origin}${window.location.pathname}?delay=true&lender=${encodeURIComponent(lenderId || 'sounravin')}`;
    navigator.clipboard.writeText(standaloneUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!borrowerName.trim()) {
      alert(language === 'kh' ? 'សូមបញ្ចូលឈ្មោះកូនបំណុល!' : 'Please enter borrower name!');
      return;
    }

    setSubmitting(true);

    try {
      const requestId = 'pdr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const finalReason = selectedReason === 'ផ្សេងៗ (Other Reason)' && customReasonNote.trim()
        ? `ផ្សេងៗ៖ ${customReasonNote.trim()}`
        : customReasonNote.trim()
        ? `${selectedReason} - ${customReasonNote.trim()}`
        : selectedReason;

      const rawRequest = {
        id: requestId,
        borrowerId: borrowerId || linkedBorrower?.id || '',
        borrowerName: borrowerName.trim(),
        borrowerPhone: borrowerPhone.trim() || '',
        lenderId: (lenderId || 'sounravin').toLowerCase(),
        reason: finalReason || 'ពន្យារពេលបង់ប្រាក់',
        notes: customReasonNote.trim() || '',
        requestedDate: requestedDate || new Date().toISOString().split('T')[0],
        latitude: latitude !== undefined ? latitude : 0,
        longitude: longitude !== undefined ? longitude : 0,
        locationAccuracy: locationAccuracy !== undefined ? locationAccuracy : 0,
        gpsCapturedAt: gpsCapturedAt || new Date().toISOString(),
        deviceInfo: (navigator?.userAgent || 'Browser').split(' ')[0] + ' (' + (navigator?.platform || 'Mobile') + ')',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      // Sanitize payload to strip any undefined values that cause Firestore to fail
      const cleanPayload = JSON.parse(JSON.stringify(rawRequest));

      await setDoc(doc(db, 'payment_delay_requests', requestId), cleanPayload);

      setSubmittedRequestId(requestId);
      setSubmitting(false);

      if (onSubmitSuccess) {
        onSubmitSuccess(requestId);
      }
    } catch (err: any) {
      console.error('Error submitting delay request:', err);
      setSubmitting(false);
      alert(
        language === 'kh'
          ? `មានបញ្ហាក្នុងការផ្ញើសំណើ៖ ${err?.message || 'សូមព្យាយាមម្ដងទៀត'}`
          : `Error submitting request: ${err?.message || 'Please try again.'}`
      );
    }
  };

  if (submittedRequestId) {
    return (
      <div className="w-full max-w-lg mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center text-slate-100 shadow-2xl relative overflow-hidden my-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 animate-bounce" />
        </div>

        <h3 className="text-xl font-black text-white mb-2">
          {language === 'kh' ? 'សំណើសុំពន្យារត្រូវបានផ្ញើរជោគជ័យ!' : 'Payment Extension Request Sent!'}
        </h3>

        <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
          {language === 'kh'
            ? 'សំណើសុំពន្យារពេលបង់ប្រាក់ និងព័ត៌មានទីតាំង GPS របស់អ្នកត្រូវបានផ្ញើទៅកាន់ផ្ទាំងគ្រប់គ្រងម្ចាស់កម្ចីរួចរាល់។ ម្ចាស់កម្ចីនឹងពិនិត្យ និងឆ្លើយតបក្នុងពេលឆាប់ៗនេះ។'
            : 'Your extension request and verified GPS location have been sent to the lender control panel.'}
        </p>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left space-y-2 mb-6 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>{language === 'kh' ? 'កូដសំណើ៖' : 'Request Code:'}</span>
            <span className="font-mono text-amber-400 font-bold">{submittedRequestId}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>{language === 'kh' ? 'កាលបរិច្ឆេទស្នើសុំពន្យារ៖' : 'Requested Extension Date:'}</span>
            <span className="font-bold text-white">{requestedDate}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>{language === 'kh' ? 'ស្ថានភាព GPS៖' : 'GPS Status:'}</span>
            <span className="font-bold text-emerald-400">
              {locationCaptured ? (language === 'kh' ? '✓ បានផ្ទៀងផ្ទាត់' : '✓ Verified') : (language === 'kh' ? 'មិនមាន GPS' : 'No GPS')}
            </span>
          </div>
        </div>

        {onBackToPortal && (
          <button
            onClick={onBackToPortal}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-sm rounded-2xl shadow-xl transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>{language === 'kh' ? 'ត្រឡប់ទៅកាន់ទំព័រកូនបំណុល' : 'Back to Borrower Portal'}</span>
          </button>
        )}
      </div>
    );
  }

  // Gate: Required Location Access
  if (!locationCaptured) {
    return (
      <div className="w-full max-w-lg mx-auto bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl shadow-2xl p-6 sm:p-8 my-6 relative overflow-hidden text-center">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
          {isCapturingLocation ? (
            <Navigation className="w-10 h-10 animate-spin text-amber-400" />
          ) : (
            <MapPin className="w-10 h-10 text-rose-400 animate-bounce" />
          )}
        </div>

        <h3 className="text-lg sm:text-xl font-black text-white mb-2">
          {isCapturingLocation
            ? (language === 'kh' ? 'កំពុងស្នើសុំទីតាំង GPS (Allow Location)...' : 'Requesting GPS Location...')
            : (language === 'kh' ? 'ទាមទារការអនុញ្ញាតទីតាំង GPS' : 'GPS Location Permission Required')}
        </h3>

        <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed max-w-md mx-auto">
          {language === 'kh'
            ? 'ដើម្បីបើកផ្ទាំងទម្រង់ស្នើសុំពន្យារពេលបង់ប្រាក់នេះ អ្នកត្រូវតែអនុញ្ញាត (Allow Location) ទីតាំង GPS របស់ Browser របស់អ្នកជាមុនសិន។'
            : 'To access this standalone payment extension request form, you must grant GPS Location access on your browser.'}
        </p>

        {gpsErrorMsg && (
          <div className="p-4 bg-rose-950/70 border border-rose-800/80 rounded-2xl text-rose-200 text-xs mb-6 text-left space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{language === 'kh' ? 'សូមពិនិត្យសិទ្ធិទីតាំង៖' : 'Permission Error:'}</span>
            </div>
            <p className="leading-relaxed">{gpsErrorMsg}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleVerifyLocation}
          disabled={isCapturingLocation}
          className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-sm rounded-2xl shadow-xl transition active:scale-95 cursor-pointer flex items-center justify-center gap-2.5"
        >
          {isCapturingLocation ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin text-amber-300" />
              <span>{language === 'kh' ? 'កំពុងស្វែងរកទីតាំង...' : 'Fetching Location...'}</span>
            </>
          ) : (
            <>
              <Navigation className="w-5 h-5 text-amber-300 animate-pulse" />
              <span>{language === 'kh' ? '📍 ចុចអនុញ្ញាតទីតាំង GPS (Allow Location)' : '📍 Allow GPS Location Access'}</span>
            </>
          )}
        </button>

        {/* Copy standalone link helper */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Share2 className="w-3.5 h-3.5 text-slate-400" />
            {language === 'kh' ? 'លីងផ្ទាំងដាច់ដោយឡែក' : 'Standalone Link'}
          </span>
          <button
            onClick={handleCopyDirectLink}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            <span>{copiedLink ? (language === 'kh' ? 'បានចម្លង!' : 'Copied!') : (language === 'kh' ? 'ចម្លង Link' : 'Copy Link')}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl shadow-2xl overflow-hidden my-4 sm:my-8 relative">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-slate-900 p-6 border-b border-amber-500/20 relative">
        <div className="flex items-center justify-between mb-3">
          {onBackToPortal ? (
            <button
              onClick={onBackToPortal}
              className="px-3 py-1.5 bg-slate-950/60 hover:bg-slate-950/80 text-white text-xs font-bold rounded-xl border border-white/20 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{language === 'kh' ? 'ត្រឡប់ក្រោយ' : 'Back'}</span>
            </button>
          ) : (
            <div className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-xl text-[11px] font-bold flex items-center gap-1">
              <Share2 className="w-3.5 h-3.5" />
              <span>{language === 'kh' ? 'ផ្ទាំងដាច់ដោយឡែក' : 'Standalone Request'}</span>
            </div>
          )}

          <button
            onClick={handleCopyDirectLink}
            className="px-3 py-1.5 bg-slate-950/60 hover:bg-slate-950/80 text-white text-xs font-bold rounded-xl border border-white/20 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="Copy Standalone Extension Form Link"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-300" />}
            <span>{copiedLink ? (language === 'kh' ? 'បានចម្លង!' : 'Copied!') : (language === 'kh' ? 'ចម្លង Link' : 'Copy Link')}</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-amber-300 shrink-0">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              {language === 'kh' ? 'ទម្រង់ស្នើសុំពន្យារពេលបង់ប្រាក់' : 'Payment Extension Request Form'}
            </h2>
            <p className="text-xs text-amber-200/90 font-medium mt-0.5">
              {language === 'kh' ? 'បំពេញមូលហេតុនិងផ្ទៀងផ្ទាត់' : 'Submit reason and verify request'}
            </p>
          </div>
        </div>
      </div>



      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
        {/* Borrower Name & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-400" />
              {language === 'kh' ? 'ឈ្មោះកូនបំណុល *' : 'Borrower Name *'}
            </label>
            <input
              type="text"
              required
              value={borrowerName}
              onChange={(e) => setBorrowerName(e.target.value)}
              placeholder={language === 'kh' ? 'បញ្ចូលឈ្មោះរបស់អ្នក...' : 'Enter your name...'}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 text-xs sm:text-sm font-semibold focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emerald-400" />
              {language === 'kh' ? 'លេខទូរស័ព្ទ' : 'Phone Number'}
            </label>
            <input
              type="text"
              value={borrowerPhone}
              onChange={(e) => setBorrowerPhone(e.target.value)}
              placeholder={language === 'kh' ? 'បញ្ចូលលេខទូរស័ព្ទ...' : 'Enter phone number...'}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 text-xs sm:text-sm font-semibold focus:outline-none focus:border-amber-500 transition"
            />
          </div>
        </div>

        {/* Reason Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-cyan-400" />
            {language === 'kh' ? 'ជ្រើសរើសមូលហេតុស្នើសុំពន្យារពេល *' : 'Reason for Extension Request *'}
          </label>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 text-xs sm:text-sm font-bold focus:outline-none focus:border-amber-500 transition cursor-pointer"
          >
            {STANDARD_DELAY_REASONS.map((reason, idx) => (
              <option key={idx} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </div>

        {/* Requested Date */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-purple-400" />
            {language === 'kh' ? 'កាលបរិច្ឆេទស្នើសុំពន្យារបង់ *' : 'Requested Extension Date *'}
          </label>
          <input
            type="date"
            required
            value={requestedDate}
            onChange={(e) => setRequestedDate(e.target.value)}
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 text-xs sm:text-sm font-bold focus:outline-none focus:border-amber-500 transition cursor-pointer"
          />
        </div>

        {/* Additional Custom Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-slate-400" />
            {language === 'kh' ? 'ព័ត៌មានលម្អិត ឬកំណត់ហេតុបន្ថែម' : 'Additional Notes / Detail'}
          </label>
          <textarea
            rows={2}
            value={customReasonNote}
            onChange={(e) => setCustomReasonNote(e.target.value)}
            placeholder={language === 'kh' ? 'សរសេរព័ត៌មានលម្អិតបន្ថែម...' : 'Write any additional explanation...'}
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 text-xs sm:text-sm font-medium focus:outline-none focus:border-amber-500 transition resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-gradient-to-r from-amber-500 via-rose-600 to-amber-600 hover:from-amber-400 hover:to-rose-500 text-white font-black text-sm rounded-2xl shadow-xl transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin text-white" />
              <span>{language === 'kh' ? 'កំពុងផ្ញើសំណើ...' : 'Sending Request...'}</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5 text-amber-200" />
              <span>{language === 'kh' ? 'ផ្ញើសំណើសុំពន្យារពេលបង់ប្រាក់' : 'Submit Extension Request'}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

