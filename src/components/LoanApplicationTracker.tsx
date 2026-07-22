import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { useLanguage } from '../i18n';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, XCircle, Copy, Check, ArrowRight, FileText, Phone, DollarSign, Calendar } from 'lucide-react';
import { Borrower, LoanApplication } from '../types';

interface LoanApplicationTrackerProps {
  trackId: string;
  onBack: () => void;
}

export default function LoanApplicationTracker({ trackId, onBack }: LoanApplicationTrackerProps) {
  const { language } = useLanguage();
  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [foundBorrowerId, setFoundBorrowerId] = useState<string | null>(null);

  // 1. Subscribe to the loan application in real-time
  useEffect(() => {
    setLoading(true);
    setError(null);

    const docRef = doc(db, 'loan_applications', trackId);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setApplication(docSnap.data() as LoanApplication);
        } else {
          setError(
            language === 'kh'
              ? 'រកមិនឃើញសំណើសុំកម្ចីនេះនៅក្នុងប្រព័ន្ធឡើយ។'
              : 'Loan application not found in the database.'
          );
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Unable to track application via cloud subscription:', err.message || err);
        setError(err.message || 'Error loading data.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [trackId, language]);

  // 2. Once approved, listen for the corresponding Borrower document
  useEffect(() => {
    if (!application || application.status !== 'approved') return;

    // Search for borrower document created with this application ID
    const q = query(collection(db, 'borrowers'), where('applicationId', '==', trackId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const borrowerDoc = snapshot.docs[0];
        const bId = borrowerDoc.id;
        setFoundBorrowerId(bId);
        
        // Auto-redirect to electronic loan agreement after a brief delay
        setRedirecting(true);
        const timer = setTimeout(() => {
          const newUrl = `${window.location.origin}/?share=${bId}`;
          window.location.href = newUrl;
        }, 4000);

        return () => clearTimeout(timer);
      }
    });

    return () => unsubscribe();
  }, [application, trackId]);

  const handleCopyLink = () => {
    const trackUrl = `${window.location.origin}/?track=${trackId}`;
    navigator.clipboard.writeText(trackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-black tracking-wide animate-pulse">កំពុងទាញយកទិន្នន័យតាមដានពីប្រព័ន្ធ Cloud...</p>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center text-3xl mb-2">⚠️</div>
        <h2 className="text-xl font-black text-rose-400">តំណភ្ជាប់មិនត្រឹមត្រូវ!</h2>
        <p className="text-xs text-slate-400 leading-relaxed font-semibold">
          {error || 'មានបញ្ហាក្នុងការភ្ជាប់ទៅកាន់ប្រព័ន្ធ។ សូមព្យាយាមម្តងទៀតនៅពេលក្រោយ។'}
        </p>
        <button
          onClick={onBack}
          className="mt-4 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
        >
          {language === 'kh' ? 'ត្រឡប់ទៅវិញ' : 'Back'}
        </button>
      </div>
    );
  }

  const { name, phone, amountRequested, loanDuration, status, createdAt, rejectedReason } = application;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Animated Background Auroras */}
      <div className="absolute top-10 left-10 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl z-10 p-6 space-y-6">
        
        {/* Header Section */}
        <div className="text-center space-y-1.5 border-b border-slate-800/80 pb-4">
          <div className="inline-flex px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-400 tracking-wider uppercase mb-2">
            Loan application ID: {trackId}
          </div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center justify-center gap-1.5">
            🔍 {language === 'kh' ? 'តាមដានស្ថានភាពសំណើសុំកម្ចី' : 'Loan Application Tracker'}
          </h2>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed px-4">
            {language === 'kh' 
              ? 'កូនបំណុលអាចរក្សាទុកតំណភ្ជាប់ (Link) នេះដើម្បីតាមដានការអនុម័តរបស់ម្ចាស់បំណុល' 
              : 'Save or bookmark this link to monitor your loan approval status in real-time.'}
          </p>
        </div>

        {/* Tracking Details Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-2">
            <span className="text-slate-400 flex items-center gap-1">
              👤 {language === 'kh' ? 'ឈ្មោះពេញ' : 'Full Name'}
            </span>
            <span className="text-slate-100 font-bold">{name}</span>
          </div>
          <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-2">
            <span className="text-slate-400 flex items-center gap-1">
              📞 {language === 'kh' ? 'លេខទូរស័ព្ទ' : 'Phone'}
            </span>
            <span className="text-slate-100 font-bold">{phone}</span>
          </div>
          <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-2">
            <span className="text-slate-400 flex items-center gap-1">
              📅 {language === 'kh' ? 'រយះពេលខ្ចី' : 'Loan Duration'}
            </span>
            <span className="text-slate-100 font-bold">
              {loanDuration || 30} {language === 'kh' ? 'ថ្ងៃ' : 'Days'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs pb-1">
            <span className="text-slate-400 flex items-center gap-1">
              💵 {language === 'kh' ? 'ទឹកប្រាក់ស្នើសុំ' : 'Amount'}
            </span>
            <span className="text-emerald-400 font-black text-sm">
              ${amountRequested.toLocaleString()} USD
            </span>
          </div>
        </div>

        {/* Dynamic Status Banner & Message */}
        {status === 'pending' && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex gap-3 text-amber-400 text-xs font-semibold leading-relaxed">
            <Clock className="w-5 h-5 shrink-0 animate-pulse mt-0.5" />
            <div>
              <p className="font-black text-amber-300">
                {language === 'kh' ? 'សំណើបានបញ្ជូនទៅកាន់ម្ចាស់បំណុល រង់ចាំការអនុម័ត' : 'Submitted to Lender, Awaiting Approval'}
              </p>
              <p className="text-slate-400 font-medium mt-1">
                {language === 'kh' 
                  ? 'ម្ចាស់បំណុលកំពុងត្រួតពិនិត្យព័ត៌មាន និងឯកសាររបស់លោកអ្នក។ សូមរក្សាតំណភ្ជាប់នេះដើម្បីតាមដានស្ថានភាពបន្ត។' 
                  : 'The lender is currently reviewing your application credentials. Keep this tab open or bookmarked!'}
              </p>
            </div>
          </div>
        )}

        {status === 'approved' && (
          <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex gap-3 text-emerald-400 text-xs leading-relaxed">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 animate-bounce text-emerald-400" />
            <div>
              <p className="font-black text-emerald-300">
                {language === 'kh' ? '🎉 សំណើសុំខ្ចីប្រាក់ត្រូវបានយល់ព្រម!' : '🎉 Loan Request Approved!'}
              </p>
              <p className="text-emerald-400/90 font-semibold mt-1">
                {language === 'kh'
                  ? 'អបអរសាទរ! ម្ចាស់បំណុលបានអនុម័ត និងបង្កើតលិខិតសងប្រាក់អេឡិចត្រូនិចជូនលោកអ្នករួចជាស្រេច។'
                  : 'Congratulations! The lender has approved your loan and created your electronic agreement.'}
              </p>
              {redirecting && (
                <p className="text-slate-300 font-black mt-3 animate-pulse flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                  {language === 'kh'
                    ? 'កំពុងភ្ជាប់ទៅកាន់ លិខិតសងប្រាក់អេឡិចត្រូនិច ក្នុងរយៈពេលបន្តិចទៀតនេះ...'
                    : 'Redirecting you to your Electronic Agreement momentarily...'}
                </p>
              )}
            </div>
          </div>
        )}

        {status === 'rejected' && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl flex gap-3 text-rose-400 text-xs font-semibold leading-relaxed">
            <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-rose-300">
                {language === 'kh' ? '⚠️ សំណើសុំខ្ចីប្រាក់ត្រូវបានបដិសេធ' : '⚠️ Loan Request Denied'}
              </p>
              <p className="text-slate-400 font-medium mt-1">
                {language === 'kh' 
                  ? `មូលហេតុ៖ ${rejectedReason || 'មិនបំពេញតាមលក្ខខណ្ឌតម្រូវ'}`
                  : `Reason: ${rejectedReason || 'Did not meet requirements'}`}
              </p>
            </div>
          </div>
        )}

        {/* Visual Timeline Tracker */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
            {language === 'kh' ? 'ដំណាក់កាលអនុម័ត' : 'Approval Progress'}
          </h3>
          
          <div className="relative border-l border-slate-800 ml-3.5 pl-6 space-y-5">
            {/* Step 1: Request Submitted */}
            <div className="relative">
              <span className="absolute -left-[31px] top-0.5 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center text-[10px]">
                ✓
              </span>
              <div>
                <p className="text-xs font-bold text-slate-200">
                  {language === 'kh' ? 'បានបញ្ជូនសំណើជោគជ័យ' : 'Application Submitted'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {new Date(createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Step 2: Under Review */}
            <div className="relative">
              <span className={`absolute -left-[31px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                status === 'pending'
                  ? 'bg-amber-500/20 border border-amber-500 text-amber-400 animate-pulse font-bold'
                  : status === 'approved'
                  ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                  : 'bg-rose-500/20 border border-rose-500 text-rose-400'
              }`}>
                {status === 'pending' ? '•' : status === 'approved' ? '✓' : '×'}
              </span>
              <div>
                <p className="text-xs font-bold text-slate-200">
                  {language === 'kh' ? 'ម្ចាស់បំណុលកំពុងពិនិត្យ និងវាយតម្លៃ' : 'Lender Review & Evaluation'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {status === 'pending' 
                    ? (language === 'kh' ? 'កំពុងដំណើរការ...' : 'In Progress...') 
                    : status === 'approved' 
                    ? (language === 'kh' ? 'ពិនិត្យរួចរាល់' : 'Reviewed') 
                    : (language === 'kh' ? 'បដិសេធ' : 'Rejected')}
                </p>
              </div>
            </div>

            {/* Step 3: Electronic Agreement */}
            <div className="relative">
              <span className={`absolute -left-[31px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                status === 'approved'
                  ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400 font-bold animate-pulse'
                  : 'bg-slate-950 border border-slate-800 text-slate-600'
              }`}>
                {status === 'approved' ? '✓' : '3'}
              </span>
              <div>
                <p className={`text-xs font-bold ${status === 'approved' ? 'text-slate-200' : 'text-slate-500'}`}>
                  {language === 'kh' ? 'លិខិតសងប្រាក់អេឡិចត្រូនិច' : 'Electronic Loan Agreement'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {status === 'approved' 
                    ? (language === 'kh' ? 'រួចរាល់ - ចុច បន្តទៅមុខ ដើម្បីមើល' : 'Ready - Click Continue to View') 
                    : (language === 'kh' ? 'រង់ចាំការអនុម័តជំហានទី២' : 'Awaiting step 2 approval')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-4 border-t border-slate-800/80">
          
          <button
            onClick={handleCopyLink}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700/80 text-slate-200 text-xs font-bold rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 border border-slate-700/50"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">{language === 'kh' ? 'បានចម្លងតំណភ្ជាប់ជោគជ័យ!' : 'Link copied successfully!'}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>{language === 'kh' ? 'ចម្លងតំណភ្ជាប់ដើម្បីតាមដានជាក្រោយ' : 'Copy link to track later'}</span>
              </>
            )}
          </button>

          {status === 'approved' && foundBorrowerId && (
            <button
              onClick={() => {
                const newUrl = `${window.location.origin}/?share=${foundBorrowerId}`;
                window.location.href = newUrl;
              }}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-98 animate-pulse"
            >
              <FileText className="w-4 h-4" />
              <span>{language === 'kh' ? 'បើកលិខិតសងប្រាក់អេឡិចត្រូនិច' : 'Open Electronic agreement'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onBack}
            className="w-full py-2 bg-slate-950 hover:bg-slate-900 text-slate-400 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center"
          >
            {language === 'kh' ? 'ត្រឡប់ទៅវិញ' : 'Back'}
          </button>
        </div>

      </div>
    </div>
  );
}
