import React from 'react';
import { Borrower } from '../types';
import { BorrowerOverdueDetails, formatMoney, formatKhmerDate } from '../utils';
import { AlertTriangle, Clock, Calendar, DollarSign, User, Phone, CheckCircle, X, ShieldAlert, CreditCard, ArrowRight } from 'lucide-react';
import { useLanguage } from '../i18n';
import { motion, AnimatePresence } from 'motion/react';
import AvatarWithFrame from './AvatarWithFrame';

interface OverduePaymentAlertModalProps {
  borrower: Borrower;
  overdueDetails: BorrowerOverdueDetails;
  onClose: () => void;
  onPayNow?: () => void;
  isPortalView?: boolean;
}

export default function OverduePaymentAlertModal({
  borrower,
  overdueDetails,
  onClose,
  onPayNow,
  isPortalView = false
}: OverduePaymentAlertModalProps) {
  const { language } = useLanguage();

  const formattedDueDate = overdueDetails.dueDateTime 
    ? formatKhmerDate(overdueDetails.dueDateTime.toISOString().split('T')[0])
    : (language === 'kh' ? 'មិនទាន់កំណត់' : 'Not set');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="max-w-lg w-full bg-slate-900 border-2 border-rose-500/80 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(225,29,72,0.4)] flex flex-col my-auto relative"
      >
        {/* Animated Top Glow Bar */}
        <div className="h-2 bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 animate-pulse w-full shrink-0" />

        {/* Modal Header */}
        <div className="px-6 py-5 bg-slate-950/90 border-b border-rose-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-2xl animate-bounce">
              <ShieldAlert className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <h3 className="text-base font-black text-rose-400 flex items-center gap-1.5 uppercase tracking-wide">
                <span>🚨 {language === 'kh' ? 'ការព្រមាន៖ ការបង់ប្រាក់យឺតយ៉ាវ!' : 'Overdue Payment Alert!'}</span>
              </h3>
              <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                {language === 'kh' ? 'កូនបំណុលបានហួសកាលបរិច្ឆេទ & ម៉ោងត្រូវបង់ប្រាក់' : 'Payment is overdue past the due date and cutoff time'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
            title={language === 'kh' ? 'បិទ' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh] custom-scrollbar">
          
          {/* Borrower Profile Card Header inside Pop-up */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center gap-3.5">
            <AvatarWithFrame
              photoUrl={borrower.profilePhoto}
              name={borrower.name}
              frameId={borrower.avatarFrame}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded-md">
                  {borrower.shortId || borrower.id}
                </span>
                <span className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  {language === 'kh' ? 'យឺតយ៉ាវ' : 'Overdue'}
                </span>
              </div>
              <h4 className="text-base font-black text-white truncate mt-1">
                {borrower.name}
              </h4>
              {borrower.phone && (
                <p className="text-xs font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{borrower.phone}</span>
                </p>
              )}
            </div>
          </div>

          {/* Overdue Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Overdue Term */}
            <div className="p-3 bg-rose-950/30 border border-rose-900/40 rounded-2xl space-y-1">
              <p className="text-[10px] font-black text-rose-400/90 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{language === 'kh' ? 'វគ្គត្រូវបង់យឺតយ៉ាវ' : 'Overdue Term'}</span>
              </p>
              <p className="text-base font-black text-rose-300">
                {language === 'kh' ? `វគ្គទី ${overdueDetails.nextTermIndex + 1}` : `Term #${overdueDetails.nextTermIndex + 1}`}
              </p>
            </div>

            {/* Amount Due */}
            <div className="p-3 bg-rose-950/30 border border-rose-900/40 rounded-2xl space-y-1">
              <p className="text-[10px] font-black text-rose-400/90 uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                <span>{language === 'kh' ? 'ប្រាក់ត្រូវបង់វគ្គនេះ' : 'Term Amount Due'}</span>
              </p>
              <p className="text-base font-black text-amber-400 font-mono">
                {formatMoney(overdueDetails.installmentAmount, overdueDetails.currency)}
              </p>
            </div>

            {/* Cutoff Due Date & Time */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{language === 'kh' ? 'កាលបរិច្ឆេទ & ម៉ោង' : 'Scheduled Cutoff'}</span>
              </p>
              <p className="text-xs font-black text-slate-200">
                {formattedDueDate}
              </p>
              <p className="text-[11px] font-bold text-amber-400">
                {language === 'kh' ? `វេលាម៉ោង ${overdueDetails.dueTimeStr}` : `At ${overdueDetails.dueTimeStr}`}
              </p>
            </div>

            {/* Duration Overdue */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>{language === 'kh' ? 'រយៈពេលយឺតយ៉ាវ' : 'Late Duration'}</span>
              </p>
              <p className="text-xs font-black text-rose-400">
                {overdueDetails.daysOverdue > 0 
                  ? (language === 'kh' 
                      ? `${overdueDetails.daysOverdue} ថ្ងៃ ${overdueDetails.hoursOverdue} ម៉ោង` 
                      : `${overdueDetails.daysOverdue}d ${overdueDetails.hoursOverdue}h late`)
                  : (language === 'kh' 
                      ? `${overdueDetails.totalHoursOverdue} ម៉ោង` 
                      : `${overdueDetails.totalHoursOverdue} hours late`)}
              </p>
            </div>
          </div>

          {/* Callout Warning Banner */}
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs space-y-1">
            <p className="font-black text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>
                {language === 'kh' 
                  ? 'សូមប្រញាប់ទូទាត់ប្រាក់ឱ្យបានឆាប់រហ័ស!' 
                  : 'Please process the payment immediately!'}
              </span>
            </p>
            <p className="text-slate-300 font-medium leading-relaxed pl-5">
              {isPortalView
                ? (language === 'kh' 
                    ? 'ការបង់ប្រាក់យឺតយ៉ាវលើសម៉ោងកំណត់អាចបណ្តាលឱ្យមានការផាកពិន័យ ឬប៉ះពាល់ដល់ប្រវត្តិឥណទានរបស់អ្នក។ សូមចុចប៊ូតុង "បង់ប្រាក់ឥឡូវនេះ" ដើម្បីផ្ញើវិក្កយបត្រ។'
                    : 'Overdue payment past cutoff time may incur late fees or affect your credit status. Click "Pay Now" to scan QR code and submit your payment receipt.')
                : (language === 'kh'
                    ? 'កូនបំណុលរូបនេះមិនទាន់បានបង់ប្រាក់តាមម៉ោងកំណត់ឡើយ។ អ្នកអាចចុច "កត់ត្រាការបង់ប្រាក់" ដើម្បីបញ្ចូលការបង់ប្រាក់ ឬផ្ញើសាររំលឹក។'
                    : 'This borrower has not paid past the scheduled cutoff time. You can record payment or send a reminder message.')}
            </p>
          </div>

          {/* Summary Balance Row */}
          <div className="flex justify-between items-center px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs">
            <span className="font-bold text-slate-400">
              {language === 'kh' ? 'សមតុល្យប្រាក់នៅសល់សរុប:' : 'Total Loan Balance Remaining:'}
            </span>
            <span className="font-black text-emerald-400 font-mono text-sm">
              {formatMoney(overdueDetails.totalRemaining, overdueDetails.currency)}
            </span>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-2xl transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>{language === 'kh' ? 'បិទការជូនដំណឹង' : 'Dismiss Alert'}</span>
          </button>

          {onPayNow && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onPayNow();
              }}
              className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs rounded-2xl transition shadow-lg shadow-rose-600/30 active:scale-95 cursor-pointer flex items-center justify-center gap-2 border border-rose-400/40"
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {isPortalView 
                  ? (language === 'kh' ? '💳 បង់ប្រាក់ឥឡូវនេះ' : '💳 Pay Now') 
                  : (language === 'kh' ? '✔️ កត់ត្រាការបង់ប្រាក់' : '✔️ Log Payment')}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </motion.div>
    </div>
  );
}
