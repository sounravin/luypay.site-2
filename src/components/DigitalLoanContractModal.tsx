import React, { useState } from 'react';
import { LoanApplication, Borrower, DEFAULT_LENDER_INFO, LenderInfo } from '../types';
import { useLanguage } from '../i18n';
import { motion } from 'motion/react';
import { Printer, X, Shield, FileText, CheckCircle, AlertTriangle, AlertCircle, Edit3, Save, Download, UserCheck, Calendar, MapPin, DollarSign, Clock, Phone } from 'lucide-react';

interface DigitalLoanContractModalProps {
  application?: LoanApplication | null;
  borrower?: Borrower | null;
  onClose: () => void;
  showToast?: (message: string, type: 'success' | 'info' | 'error') => void;
}

export default function DigitalLoanContractModal({
  application,
  borrower,
  onClose,
  showToast
}: DigitalLoanContractModalProps) {
  const { language } = useLanguage();

  // Lender info (Defaults to user's exact specifications)
  const [lender, setLender] = useState<LenderInfo>(
    application?.lenderInfo || borrower?.lenderInfo || DEFAULT_LENDER_INFO
  );

  // Borrower info
  const [borrowerName, setBorrowerName] = useState(
    application?.name || borrower?.name || ''
  );
  const [borrowerId, setBorrowerId] = useState(
    application?.idCardNumber || borrower?.idCardNumber || 'មិនទាន់មាន'
  );
  const [borrowerDob, setBorrowerDob] = useState(
    application?.dob || borrower?.dob || '20.05.1995'
  );
  const [borrowerAddress, setBorrowerAddress] = useState(
    application?.address || borrower?.address || 'ភូមិ-សង្កាត់ ក្រុងបាត់ដំបង'
  );
  const [borrowerIdExpiry, setBorrowerIdExpiry] = useState(
    application?.idExpiryDate || borrower?.idExpiryDate || ''
  );
  const [borrowerIdExpiryStatus, setBorrowerIdExpiryStatus] = useState<
    'valid' | 'expiring_soon' | 'expired'
  >(application?.idExpiryStatus || borrower?.idExpiryStatus || 'valid');
  const [borrowerPhone, setBorrowerPhone] = useState(
    application?.phone || borrower?.phone || ''
  );

  // Loan contract details
  const [amountUSD, setAmountUSD] = useState<number>(
    application?.amountRequested || borrower?.principal || 100
  );
  const [durationDays, setDurationDays] = useState<number>(
    application?.loanDuration || borrower?.duration || 30
  );
  const [paymentType, setPaymentType] = useState<string>(
    application?.paymentType || borrower?.frequency || 'daily'
  );
  const [interestMethod, setInterestMethod] = useState<string>(
    application?.interestMethod || borrower?.interestCalculation || 'flat'
  );

  // Edit mode toggle
  const [isEditing, setIsEditing] = useState(false);

  // Contract Creation Date
  const contractDate = new Date().toLocaleDateString('km-KH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      {/* CSS to hide modal UI controls during print and make print layout pristine A4 */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-contract, .printable-contract * {
            visibility: visible;
          }
          .printable-contract {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: black !important;
            font-family: 'Kantumruy Pro', 'Khmer OS Battambang', 'Segoe UI', Tahoma, sans-serif !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto"
      >
        {/* Modal Header / Action Toolbar */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-inner">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                <span>លិខិតកម្ចីប្រាក់លុយឆក់ Digital</span>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  PDF & Print Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                កិច្ចសន្យាផ្លូវការរវាងម្ចាស់បំណុល នឹងកូនបំណុល (រួមមានកន្លែងផ្ដិតមេដៃ)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                isEditing
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4 text-amber-400" />
                  <span>រក្សាទុក</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4 text-blue-400" />
                  <span>កែប្រែទិន្នន័យ</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>បោះពុម្ពលិខិត (Print)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer border border-slate-700"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-950/40 space-y-6 text-slate-200">
          
          {/* Edit Form Drawer if Editing is Active */}
          {isEditing && (
            <div className="p-4 bg-slate-900 border border-amber-500/30 rounded-2xl space-y-4 text-xs no-print shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4" />
                  កែប្រែទិន្នន័យសម្រាប់ចេញកិច្ចសន្យា (Editable Contract Details)
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-slate-400 hover:text-white"
                >
                  បិទផ្ទាំងកែប្រែ ✖️
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Borrower Name */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">ឈ្មោះកូនបំណុល (Borrower Name)</label>
                  <input
                    type="text"
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold"
                  />
                </div>

                {/* Borrower ID Number */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">លេខអត្តសញ្ញាណប័ណ្ណកូនបំណុល (Borrower ID)</label>
                  <input
                    type="text"
                    value={borrowerId}
                    onChange={(e) => setBorrowerId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold"
                  />
                </div>

                {/* Borrower DOB */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">ថ្ងៃខែឆ្នាំកំណើត (DOB)</label>
                  <input
                    type="text"
                    value={borrowerDob}
                    onChange={(e) => setBorrowerDob(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold"
                  />
                </div>

                {/* Borrower Address */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">អាសយដ្ឋានកូនបំណុល (Address)</label>
                  <input
                    type="text"
                    value={borrowerAddress}
                    onChange={(e) => setBorrowerAddress(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold"
                  />
                </div>

                {/* ID Expiry */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">សុពលភាព ID កូនបំណុល (Expiry Date)</label>
                  <input
                    type="text"
                    value={borrowerIdExpiry}
                    onChange={(e) => setBorrowerIdExpiry(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold"
                  />
                </div>

                {/* Loan Amount */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">ទឹកប្រាក់ខ្ចី ($ USD)</label>
                  <input
                    type="number"
                    value={amountUSD}
                    onChange={(e) => setAmountUSD(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Printable Document Sheet Container */}
          <div className="printable-contract bg-white text-slate-900 p-6 sm:p-10 rounded-2xl shadow-xl space-y-6 border border-slate-200">
            
            {/* Header / Emblem */}
            <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900">
              <p className="font-black text-sm sm:text-base tracking-widest text-slate-900 uppercase">
                ព្រះរាជាណាចក្រកម្ពុជា
              </p>
              <p className="font-black text-xs sm:text-sm tracking-wider text-slate-800">
                ជាតិ សាសនា ព្រះមហាក្សត្រ
              </p>
              <div className="pt-3">
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                  លិខិតកិច្ចសន្យាខ្ចីប្រាក់ (លុយឆក់ Digital)
                </h1>
                <p className="text-[11px] text-slate-600 font-bold mt-0.5">
                  DIGITAL QUICK LOAN AGREEMENT CONTRACT
                </p>
              </div>
            </div>

            {/* Date & Location */}
            <div className="text-right text-xs font-bold text-slate-700 italic">
              ធ្វើនៅបាត់ដំបង, ថ្ងៃទី {contractDate}
            </div>

            {/* Parties Details */}
            <div className="space-y-5 text-xs sm:text-sm leading-relaxed text-slate-900 font-medium">
              
              {/* Party A: Lender (ម្ចាស់បំណុល) */}
              <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-2">
                <div className="flex items-center justify-between border-b border-slate-300 pb-1.5">
                  <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                    <span>ភាគី "ក" (ម្ចាស់បំណុល / LENDER):</span>
                  </h3>
                  <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold">
                    ទិន្នន័យផ្លូវការក្នុងប្រព័ន្ធ
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-slate-800">
                  <p><span className="font-bold text-slate-900">គោត្តនាម និងនាម៖</span> {lender.name}</p>
                  <p><span className="font-bold text-slate-900">លេខអត្តសញ្ញាណប័ណ្ណ៖</span> {lender.idCardNumber}</p>
                  <p><span className="font-bold text-slate-900">ថ្ងៃខែឆ្នាំកំណើត៖</span> {lender.dob}</p>
                  <p><span className="font-bold text-slate-900">ភេទ៖</span> {lender.gender} (<span className="font-bold">កម្ពស់៖</span> {lender.height})</p>
                  <p className="sm:col-span-2"><span className="font-bold text-slate-900">អាសយដ្ឋានបច្ចុប្បន្ន៖</span> {lender.address}</p>
                </div>
              </div>

              {/* Party B: Borrower (កូនបំណុល) */}
              <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between border-b border-blue-200 pb-1.5">
                  <h3 className="font-black text-blue-950 text-sm flex items-center gap-1.5">
                    <span>ភាគី "ខ" (អ្នកខ្ចីប្រាក់ / BORROWER):</span>
                  </h3>
                  <div className="flex items-center gap-1.5">
                    {/* Expiry Badge Status */}
                    {borrowerIdExpiryStatus === 'expired' && (
                      <span className="text-[10px] bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded font-black flex items-center gap-1">
                        🔴 ID ផុតកំណត់
                      </span>
                    )}
                    {borrowerIdExpiryStatus === 'expiring_soon' && (
                      <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-black flex items-center gap-1">
                        🟡 ID ជិតផុតកំណត់
                      </span>
                    )}
                    {borrowerIdExpiryStatus === 'valid' && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded font-black flex items-center gap-1">
                        🟢 ID មានសុពលភាព
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-slate-800">
                  <p><span className="font-bold text-slate-900">គោត្តនាម និងនាម៖</span> <span className="font-black text-blue-900">{borrowerName || '................................'}</span></p>
                  <p><span className="font-bold text-slate-900">លេខអត្តសញ្ញាណប័ណ្ណ៖</span> <span className="font-black text-blue-900">{borrowerId || '................................'}</span></p>
                  <p><span className="font-bold text-slate-900">ថ្ងៃខែឆ្នាំកំណើត៖</span> {borrowerDob || '....................'}</p>
                  <p><span className="font-bold text-slate-900">លេខទូរស័ព្ទទំនាក់ទំនង៖</span> {borrowerPhone || '....................'}</p>
                  <p><span className="font-bold text-slate-900">សុពលភាព ID៖</span> {borrowerIdExpiry || 'មិនទាន់បញ្ជាក់'}</p>
                  <p className="sm:col-span-2"><span className="font-bold text-slate-900">អាសយដ្ឋានបច្ចុប្បន្ន៖</span> {borrowerAddress || '................................................'}</p>
                </div>
              </div>

              {/* Loan Clauses */}
              <div className="space-y-3 pt-2">
                <h4 className="font-black text-slate-950 underline text-sm">
                  ភាគីទាំងពីរបានព្រមព្រៀងគ្នាលើប្រការដូចខាងក្រោម៖
                </h4>

                <div className="space-y-2 text-xs sm:text-sm text-slate-800 leading-relaxed">
                  <p>
                    <span className="font-black text-slate-950">ប្រការ ១ (ចំនួនទឹកប្រាក់កម្ចី)៖</span> ភាគី "ក" បានយល់ព្រមអោយ ភាគី "ខ" ខ្ចីប្រាក់ចំនួន <span className="font-black text-emerald-800 text-base">${amountUSD.toLocaleString()} USD</span> (ប្រាក់ដុល្លារអាមេរិក) ដោយគិតចាប់ពីថ្ងៃចុះកិច្ចសន្យានេះតទៅ។
                  </p>

                  <p>
                    <span className="font-black text-slate-950">ប្រការ ២ (រយៈពេល និងការបង់ប្រាក់)៖</span> ភាគី "ខ" សន្យាសងប្រាក់ដើម និងការប្រាក់មក ភាគី "ក" វិញក្នុងរយៈពេល <span className="font-black text-slate-950">{durationDays} ថ្ងៃ</span> ដោយបង់ជាប្រភេទ <span className="font-bold text-slate-900">បង់រាល់ថ្ងៃ (Daily)</span> តាមគំរូគណនា {interestMethod === 'flat' ? 'ការប្រាក់ថេរ' : interestMethod === 'declining' ? 'ការប្រាក់ថយចុះ' : 'គ្មានការប្រាក់'}។
                  </p>

                  <p>
                    <span className="font-black text-slate-950">ប្រការ ៣ (សុពលភាពអត្តសញ្ញាណប័ណ្ណ)៖</span> ភាគី "ខ" ធានាថា អត្តសញ្ញាណប័ណ្ណសញ្ជាតិខ្មែរ ដែលបានផ្តល់ជូនក្នុងប្រព័ន្ធ គឺជាឯកសារពិតប្រាកដ មានសុពលភាព និងត្រឹមត្រូវតាមច្បាប់។
                  </p>

                  <p>
                    <span className="font-black text-slate-950">ប្រការ ៤ (កាតព្វកិច្ចផ្លូវច្បាប់)៖</span> ប្រសិនបើ ភាគី "ខ" គេចវេស មិនព្រមសងប្រាក់តាមការកំណត់ ឬផ្តល់ព័ត៌មានភូតភរ ភាគី "ក" មានសិទ្ធិពេញលេញក្នុងការចាត់វិធានការតាមផ្លូវច្បាប់ជាធរមាន ដើម្បីទាមទារសំណងប្រាក់ដើម ការប្រាក់ និងសេវាច្បាប់ផ្សេងៗ។
                  </p>
                </div>
              </div>

              {/* Fingerprint & Signatures Section */}
              <div className="pt-6 border-t-2 border-slate-900 space-y-4">
                <p className="text-center font-bold text-xs text-slate-700">
                  កិច្ចសន្យានេះ ធ្វើឡើងជា ២ ច្បាប់ មានតម្លៃច្បាប់ស្មើៗគ្នា ហើយភាគីទាំងពីរបានអាន យល់ព្រម និងផ្ដិតស្នាមមេដៃទុកជាភស្តុតាង។
                </p>

                <div className="grid grid-cols-2 gap-6 pt-4 text-center">
                  
                  {/* Thumbprint Party A (Lender) */}
                  <div className="space-y-2 flex flex-col items-center">
                    <p className="font-black text-xs text-slate-900 uppercase">
                      ស្នាមមេដៃស្តាំ/ឆ្វេង ភាគី "ក" (ម្ចាស់បំណុល)
                    </p>
                    <p className="font-bold text-slate-800 text-xs">{lender.name}</p>
                    <div className="w-28 h-36 border-2 border-dashed border-slate-400 rounded-xl flex flex-col items-center justify-center bg-slate-50 text-[10px] text-slate-400 font-bold p-2">
                      <span>កន្លែងផ្ដិតមេដៃ</span>
                      <span className="text-[9px] text-slate-400 mt-1">( Thumbprint Box )</span>
                    </div>
                  </div>

                  {/* Thumbprint Party B (Borrower) */}
                  <div className="space-y-2 flex flex-col items-center">
                    <p className="font-black text-xs text-slate-900 uppercase">
                      ស្នាមមេដៃស្តាំ/ឆ្វេង ភាគី "ខ" (កូនបំណុល)
                    </p>
                    <p className="font-bold text-slate-800 text-xs">{borrowerName || 'អ្នកខ្ចីប្រាក់'}</p>
                    <div className="w-28 h-36 border-2 border-dashed border-slate-400 rounded-xl flex flex-col items-center justify-center bg-slate-50 text-[10px] text-slate-400 font-bold p-2">
                      <span>កន្លែងផ្ដិតមេដៃ</span>
                      <span className="text-[9px] text-slate-400 mt-1">( Thumbprint Box )</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between no-print text-xs">
          <div className="text-slate-400 font-medium">
            💡 ព័ត៌មានម្ចាស់បំណុល៖ <span className="text-white font-bold">{lender.name} ({lender.idCardNumber})</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition cursor-pointer"
          >
            បិទ (Close)
          </button>
        </div>
      </motion.div>
    </div>
  );
}
