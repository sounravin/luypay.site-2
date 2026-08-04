import React, { useState, useRef } from 'react';
import { LoanApplication, Borrower, DEFAULT_LENDER_INFO, LenderInfo } from '../types';
import { useLanguage } from '../i18n';
import { motion } from 'motion/react';
import { Printer, X, Shield, FileText, CheckCircle, AlertTriangle, AlertCircle, Edit3, Save, Download, UserCheck, Calendar, MapPin, DollarSign, Clock, Phone, Image as ImageIcon, Loader2, Smartphone, ExternalLink } from 'lucide-react';
import { toPng, toJpeg } from 'html-to-image';

interface DigitalLoanContractModalProps {
  application?: LoanApplication | null;
  borrower?: Borrower | null;
  onClose: () => void;
  showToast?: (message: string, type: 'success' | 'info' | 'error') => void;
}

interface ExportedPreviewModalState {
  blobUrl: string;
  dataUrl: string;
  fileName: string;
  format: 'png' | 'jpg';
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

  // Ref for contract DOM element to convert to PNG / JPG
  const contractRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg' | null>(null);
  const [exportedPreview, setExportedPreview] = useState<ExportedPreviewModalState | null>(null);

  // Contract Creation Date
  const contractDate = new Date().toLocaleDateString('km-KH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const dataUrlToBlob = (dataUrl: string): Blob => {
    const parts = dataUrl.split(';base64,');
    const contentType = parts[0].split(':')[1] || 'image/png';
    const raw = window.atob(parts[1]);
    const uInt8Array = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  };

  const handleDownloadImage = async (format: 'png' | 'jpg') => {
    if (!contractRef.current) return;
    setIsExporting(true);
    setExportFormat(format);

    try {
      const cleanBorrowerName = (borrowerName || 'Borrower').trim().replace(/[\s/\\?%*:|"<>]/g, '_');
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `LuyChok_Contract_${cleanBorrowerName}_${dateStr}.${format}`;

      const element = contractRef.current;

      // Calculate natural full height of contract element so no content/text is ever clipped or cut off
      const contentHeight = Math.max(element.scrollHeight, 1131);

      // Render HD output (800px width with dynamic auto-fitting height and 2x pixel ratio)
      const exportOptions = {
        quality: 0.98,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: contentHeight,
        style: {
          width: '800px',
          maxWidth: '800px',
          minWidth: '800px',
          height: `${contentHeight}px`,
          minHeight: `${contentHeight}px`,
          maxHeight: 'none',
          margin: '0 auto',
          padding: '44px 50px',
          borderRadius: '0px',
          boxShadow: 'none',
          transform: 'none',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }
      };

      let dataUrl = '';
      if (format === 'png') {
        dataUrl = await toPng(element, exportOptions);
      } else {
        dataUrl = await toJpeg(element, exportOptions);
      }

      const blob = dataUrlToBlob(dataUrl);
      const blobUrl = URL.createObjectURL(blob);

      // Programmatic file download
      const link = document.createElement('a');
      link.download = fileName;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Open mobile friendly view modal
      setExportedPreview({
        blobUrl,
        dataUrl,
        fileName,
        format
      });

      if (showToast) {
        showToast(
          language === 'kh'
            ? `✅ បានបង្កើត File A4 ពេញផ្ទាំង (${format.toUpperCase()}) រួចរាល់!`
            : `✅ Successfully generated full A4 ${format.toUpperCase()} contract!`,
          'success'
        );
      }
    } catch (err) {
      console.error(`Error saving contract as ${format}:`, err);
      if (showToast) {
        showToast(
          language === 'kh'
            ? `❌ បរាជ័យក្នុងការ Save ជា ${format.toUpperCase()}`
            : `❌ Failed to save contract as ${format.toUpperCase()}`,
          'error'
        );
      } else {
        alert(language === 'kh' ? `មិនអាចទាញយក File ${format.toUpperCase()} បានទេ` : `Failed to save ${format.toUpperCase()}`);
      }
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
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

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleDownloadImage('png')}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95"
              title={language === 'kh' ? 'រក្សាទុកជា File រូបភាព PNG' : 'Save as PNG'}
            >
              {isExporting && exportFormat === 'png' ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <ImageIcon className="w-4 h-4 text-emerald-100" />
              )}
              <span>Save PNG</span>
            </button>

            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleDownloadImage('jpg')}
              className="px-3 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-teal-600/20 active:scale-95"
              title={language === 'kh' ? 'រក្សាទុកជា File រូបភាព JPG' : 'Save as JPG'}
            >
              {isExporting && exportFormat === 'jpg' ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Download className="w-4 h-4 text-teal-100" />
              )}
              <span>Save JPG</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/20 active:scale-95"
              title={language === 'kh' ? 'បោះពុម្ពលិខិត ឬ Save ជា PDF' : 'Print or Save as PDF'}
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>

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
                  <span>កែប្រែ</span>
                </>
              )}
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
          <div ref={contractRef} className="printable-contract bg-white text-slate-900 p-6 sm:p-10 rounded-2xl shadow-xl space-y-6 border border-slate-200 min-h-[1000px] flex flex-col justify-between w-full max-w-[800px] mx-auto box-sizing-border">
            
            {/* Upper Content Group */}
            <div className="space-y-6">
              {/* Header / Emblem */}
              <div className="text-center space-y-1.5 pb-4 border-b-2 border-slate-900">
                <p className="font-black text-lg sm:text-xl tracking-widest text-slate-900 uppercase">
                  ព្រះរាជាណាចក្រកម្ពុជា
                </p>
                <p className="font-black text-sm sm:text-base tracking-wider text-slate-800">
                  ជាតិ សាសនា ព្រះមហាក្សត្រ
                </p>
                <div className="pt-3">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight py-0.5">
                    លិខិតកិច្ចសន្យាខ្ចីប្រាក់ (លុយឆក់ Digital)
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 font-extrabold tracking-wide mt-0.5">
                    DIGITAL QUICK LOAN AGREEMENT CONTRACT
                  </p>
                </div>
              </div>

              {/* Date & Location */}
              <div className="text-right text-sm font-bold text-slate-800 italic">
                ធ្វើនៅបាត់ដំបង, ថ្ងៃទី {contractDate}
              </div>

              {/* Parties Details */}
              <div className="space-y-5 text-sm sm:text-[15px] leading-relaxed text-slate-900 font-medium">
                
                {/* Party A: Lender (ម្ចាស់បំណុល) */}
                <div className="p-5 bg-slate-50 border-2 border-slate-300 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                    <h3 className="font-black text-slate-950 text-base flex items-center gap-1.5">
                      <span>ភាគី "ក" (ម្ចាស់បំណុល / LENDER):</span>
                    </h3>
                    <span className="text-xs bg-slate-200 text-slate-900 px-2.5 py-0.5 rounded-md font-extrabold">
                      ទិន្នន័យផ្លូវការក្នុងប្រព័ន្ធ
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-slate-900">
                    <p><span className="font-bold text-slate-950">គោត្តនាម និងនាម៖</span> {lender.name}</p>
                    <p><span className="font-bold text-slate-950">លេខអត្តសញ្ញាណប័ណ្ណ៖</span> {lender.idCardNumber}</p>
                    <p><span className="font-bold text-slate-950">ថ្ងៃខែឆ្នាំកំណើត៖</span> {lender.dob}</p>
                    <p><span className="font-bold text-slate-950">ភេទ៖</span> {lender.gender} (<span className="font-bold">កម្ពស់៖</span> {lender.height})</p>
                    <p className="sm:col-span-2"><span className="font-bold text-slate-950">អាសយដ្ឋានបច្ចុប្បន្ន៖</span> {lender.address}</p>
                  </div>
                </div>

                {/* Party B: Borrower (កូនបំណុល) */}
                <div className="p-5 bg-blue-50/70 border-2 border-blue-200 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                    <h3 className="font-black text-blue-950 text-base flex items-center gap-1.5">
                      <span>ភាគី "ខ" (អ្នកខ្ចីប្រាក់ / BORROWER):</span>
                    </h3>
                    <div className="flex items-center gap-1.5">
                      {/* Expiry Badge Status */}
                      {borrowerIdExpiryStatus === 'expired' && (
                        <span className="text-xs bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-0.5 rounded-md font-black flex items-center gap-1">
                          🔴 ID ផុតកំណត់
                        </span>
                      )}
                      {borrowerIdExpiryStatus === 'expiring_soon' && (
                        <span className="text-xs bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-md font-black flex items-center gap-1">
                          🟡 ID ជិតផុតកំណត់
                        </span>
                      )}
                      {borrowerIdExpiryStatus === 'valid' && (
                        <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-md font-black flex items-center gap-1">
                          🟢 ID មានសុពលភាព
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-slate-900">
                    <p><span className="font-bold text-slate-950">គោត្តនាម និងនាម៖</span> <span className="font-black text-blue-900">{borrowerName || '................................'}</span></p>
                    <p><span className="font-bold text-slate-950">លេខអត្តសញ្ញាណប័ណ្ណ៖</span> <span className="font-black text-blue-900">{borrowerId || '................................'}</span></p>
                    <p><span className="font-bold text-slate-950">ថ្ងៃខែឆ្នាំកំណើត៖</span> {borrowerDob || '....................'}</p>
                    <p><span className="font-bold text-slate-950">លេខទូរស័ព្ទទំនាក់ទំនង៖</span> {borrowerPhone || '....................'}</p>
                    <p><span className="font-bold text-slate-950">សុពលភាព ID៖</span> {borrowerIdExpiry || 'មិនទាន់បញ្ជាក់'}</p>
                    <p className="sm:col-span-2"><span className="font-bold text-slate-950">អាសយដ្ឋានបច្ចុប្បន្ន៖</span> {borrowerAddress || '................................................'}</p>
                  </div>
                </div>

                {/* Loan Clauses */}
                <div className="space-y-3.5 pt-2">
                  <h4 className="font-black text-slate-950 underline text-base sm:text-lg">
                    ភាគីទាំងពីរបានព្រមព្រៀងគ្នាលើប្រការដូចខាងក្រោម៖
                  </h4>

                  <div className="space-y-3 text-sm sm:text-[15px] text-slate-900 leading-relaxed">
                    <p>
                      <span className="font-black text-slate-950">ប្រការ ១ (ចំនួនទឹកប្រាក់កម្ចី)៖</span> ភាគី "ក" បានយល់ព្រមអោយ ភាគី "ខ" ខ្ចីប្រាក់ចំនួន <span className="font-black text-emerald-800 text-lg sm:text-xl">${amountUSD.toLocaleString()} USD</span> (ប្រាក់ដុល្លារអាមេរិក) ដោយគិតចាប់ពីថ្ងៃចុះកិច្ចសន្យានេះតទៅ។
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

              </div>
            </div>

            {/* Fingerprint & Signatures Section (Anchored at the Bottom of A4) */}
            <div className="pt-6 border-t-2 border-slate-900 space-y-4 mt-6">
              <p className="text-center font-bold text-xs sm:text-sm text-slate-800 leading-relaxed">
                កិច្ចសន្យានេះ ធ្វើឡើងជា ២ ច្បាប់ មានតម្លៃច្បាប់ស្មើៗគ្នា ហើយភាគីទាំងពីរបានអាន យល់ព្រម និងផ្ដិតស្នាមមេដៃទុកជាភស្តុតាង។
              </p>

              <div className="grid grid-cols-2 gap-6 pt-2 text-center">
                
                {/* Thumbprint Party A (Lender) */}
                <div className="space-y-2 flex flex-col items-center">
                  <p className="font-black text-xs sm:text-sm text-slate-950 uppercase">
                    ស្នាមមេដៃស្តាំ/ឆ្វេង ភាគី "ក" (ម្ចាស់បំណុល)
                  </p>
                  <p className="font-bold text-slate-900 text-xs sm:text-sm">{lender.name}</p>
                  <div className="w-32 sm:w-36 h-40 border-2 border-dashed border-slate-400 rounded-2xl flex flex-col items-center justify-center bg-slate-50 text-xs text-slate-400 font-bold p-2 shadow-inner">
                    <span>កន្លែងផ្ដិតមេដៃ</span>
                    <span className="text-[10px] text-slate-400 mt-1">( Thumbprint Box )</span>
                  </div>
                </div>

                {/* Thumbprint Party B (Borrower) */}
                <div className="space-y-2 flex flex-col items-center">
                  <p className="font-black text-xs sm:text-sm text-slate-950 uppercase">
                    ស្នាមមេដៃស្តាំ/ឆ្វេង ភាគី "ខ" (កូនបំណុល)
                  </p>
                  <p className="font-bold text-slate-900 text-xs sm:text-sm">{borrowerName || 'អ្នកខ្ចីប្រាក់'}</p>
                  <div className="w-32 sm:w-36 h-40 border-2 border-dashed border-slate-400 rounded-2xl flex flex-col items-center justify-center bg-slate-50 text-xs text-slate-400 font-bold p-2 shadow-inner">
                    <span>កន្លែងផ្ដិតមេដៃ</span>
                    <span className="text-[10px] text-slate-400 mt-1">( Thumbprint Box )</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 no-print text-xs">
          <div className="text-slate-400 font-medium text-center sm:text-left">
            💡 ព័ត៌មានម្ចាស់បំណុល៖ <span className="text-white font-bold">{lender.name} ({lender.idCardNumber})</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 hidden sm:inline mr-1">
              {language === 'kh' ? '📥 ទាញយកលិខិត៖' : '📥 Save File:'}
            </span>

            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleDownloadImage('png')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95"
              title={language === 'kh' ? 'រក្សាទុកជា File រូបភាព PNG' : 'Save as PNG image'}
            >
              {isExporting && exportFormat === 'png' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5 text-emerald-200" />
              )}
              <span>Save PNG</span>
            </button>

            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleDownloadImage('jpg')}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-teal-600/20 active:scale-95"
              title={language === 'kh' ? 'រក្សាទុកជា File រូបភាព JPG' : 'Save as JPG image'}
            >
              {isExporting && exportFormat === 'jpg' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Download className="w-3.5 h-3.5 text-teal-200" />
              )}
              <span>Save JPG</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20 active:scale-95"
              title={language === 'kh' ? 'បោះពុម្ពលិខិត ឬ Save ជា PDF' : 'Print or Save as PDF'}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print/PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition cursor-pointer border border-slate-700"
            >
              បិទ (Close)
            </button>
          </div>
        </div>
      </motion.div>

      {/* Mobile-Friendly Exported Image Preview Modal */}
      {exportedPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md overflow-y-auto no-print">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-2xl bg-slate-900 border border-slate-750 rounded-3xl p-4 sm:p-6 space-y-4 text-white shadow-2xl relative max-h-[92vh] flex flex-col my-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-inner">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                    <span>លិខិតកម្ចី A4 ({exportedPreview.format.toUpperCase()})</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                      HD Resolution (A4 Size)
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate max-w-[240px] sm:max-w-xs">
                    {exportedPreview.fileName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExportedPreview(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Touch Guidance Tip Box */}
            <div className="bg-blue-950/70 border border-blue-800/80 p-3 rounded-2xl flex items-start gap-2.5 text-xs text-blue-200">
              <Smartphone className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-black text-blue-100 block">📱 សម្រាប់ទូរស័ព្ទ (Mobile User):</span>
                <p className="text-blue-200/90 leading-relaxed">
                  អ្នកអាច <strong>ចុចសង្កត់លើរូបភាព A4 (Press & Hold)</strong> ខាងក្រោម រួចជ្រើសរើស <strong>"Save Image"</strong> ឬ <strong>"រក្សាទុករូបភាព"</strong> ដើម្បី Save ចូលក្នុងទូរស័ព្ទ ឬ Photos របស់អ្នកបានភ្លាមៗ!
                </p>
              </div>
            </div>

            {/* High Definition Image Container (Rendered in A4 aspect ratio) */}
            <div className="flex-1 overflow-y-auto bg-slate-950 border border-slate-800 rounded-2xl p-2.5 flex justify-center items-center shadow-inner min-h-[280px]">
              <img
                src={exportedPreview.dataUrl}
                alt="Digital Loan Contract A4 Document"
                className="w-full max-w-2xl h-auto rounded-xl shadow-2xl object-contain border border-slate-200"
              />
            </div>

            {/* Actions Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
              <a
                href={exportedPreview.blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition flex items-center gap-1.5 shadow-md shadow-blue-600/20"
              >
                <ExternalLink className="w-4 h-4" />
                <span>បើករូបភាព A4 ក្នុង Tab ថ្មី</span>
              </a>

              <div className="flex items-center gap-2">
                <a
                  href={exportedPreview.blobUrl}
                  download={exportedPreview.fileName}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Download className="w-4 h-4" />
                  <span>ទាញយក / Save</span>
                </a>

                <button
                  onClick={() => setExportedPreview(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition cursor-pointer border border-slate-700"
                >
                  បិទ (Close)
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
