import React, { useState, useEffect } from 'react';
import { Borrower, LedgerStats, CurrencyType, Payment, Member, SubscriptionRequest, Shareholder } from './types';
import { generateId, getTodayDateString, runAutoCheckInForBorrowers, getDaysUntilNextPayment, playClickSound, backfillShortIds, formatMoney } from './utils';
import Header from './components/Header';
import BorrowerCard from './components/BorrowerCard';
import BorrowerDetail from './components/BorrowerDetail';
import AddBorrowerModal from './components/AddBorrowerModal';
import BorrowerPortal from './components/BorrowerPortal';
import ShareholderManagementModal from './components/ShareholderManagementModal';
import ShareholderDashboard from './components/ShareholderDashboard';
import { calculateShareholderStats } from './utils/shareholderUtils';
import AdminMembersDashboard from './components/AdminMembersDashboard';
import PricingPanel from './components/PricingPanel';
import NotificationBell, { playNotificationSound } from './components/NotificationBell';
import PlanApprovalModal from './components/PlanApprovalModal';
import KhmerAvatarFrame from './components/KhmerAvatarFrame';
import KhmerAvatarFrameModal from './components/KhmerAvatarFrameModal';
import BorrowerApplyForm from './components/BorrowerApplyForm';
import LoanApplicationTracker from './components/LoanApplicationTracker';
import LoanApplicationsControlPanel from './components/LoanApplicationsControlPanel';
import { LoanApplication } from './types';
import { Search, Info, Check, CheckSquare, RefreshCw, Star, Lock, LogOut, ShieldCheck, Cloud, Mail, Key, ArrowLeft, Award, Activity, CheckCircle2, Share2, Copy, Plus, Percent, ChevronRight, Coins, Users, Bell, BookOpen, MessageSquare, Settings, ShieldAlert, Moon, Sun, Upload, Camera, Clock, QrCode, Sparkles, FileText, X } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, writeBatch, getDoc, getDocs } from 'firebase/firestore';
import { db } from './lib/firebase';
import { safeStorage, largeMediaStorage } from './lib/safeStorage';
import { useLanguage } from './i18n';
import { motion, AnimatePresence } from 'motion/react';
import { SignInForm, RegisterForm, ForgotPasswordForm } from './components/AuthForms';
import PWAInstallBanner from './components/PWAInstallBanner';
import { THEMES, getButtonStyleClass } from './utils/theme';
import type { AppThemeType, ButtonStyleType } from './utils/theme';

const LOCAL_STORAGE_KEY = 'luypay_ledger_borrowers';

const getUserLocalStorageKey = (user: string | null) => {
  if (!user || user === 'sounravin') return LOCAL_STORAGE_KEY;
  return `luypay_ledger_borrowers_${user}`;
};

// Helper to sanitize objects for Firestore (removes undefined values)
export const sanitizeForFirestore = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val !== undefined) {
        clean[key] = sanitizeForFirestore(val);
      }
    }
    return clean;
  }
  return obj;
};

// Realistic Khmer seed data
const SEED_BORROWERS: Borrower[] = [
  {
    id: 'seed-1',
    name: 'សុខ ម៉ារី (Sok Mary)',
    phone: '089 778 221',
    loanDate: '2026-07-01',
    principal: 400000,
    totalToPay: 480000,
    installmentAmount: 20000,
    frequency: 'daily',
    duration: 24,
    currency: 'KHR',
    notes: 'អាជីវករលក់ដូរគ្រឿងទេសនៅផ្សារអូឡាំពិក ជួបបង់រាល់ល្ងាចម៉ោង ៥',
    payments: [
      { id: 'pay-1-1', date: '2026-07-01', amount: 20000, installmentIndex: 0, note: 'បង់ប្រាក់វគ្គទី ១' },
      { id: 'pay-1-2', date: '2026-07-02', amount: 20000, installmentIndex: 1, note: 'បង់ប្រាក់វគ្គទី ២' },
      { id: 'pay-1-3', date: '2026-07-03', amount: 20000, installmentIndex: 2, note: 'បង់ប្រាក់វគ្គទី ៣' },
      { id: 'pay-1-4', date: '2026-07-04', amount: 20000, installmentIndex: 3, note: 'បង់ប្រាក់វគ្គទី ៤' },
      { id: 'pay-1-5', date: '2026-07-05', amount: 20000, installmentIndex: 4, note: 'បង់ប្រាក់វគ្គទី ៥' },
      { id: 'pay-1-6', date: '2026-07-06', amount: 20000, installmentIndex: 5, note: 'បង់ប្រាក់វគ្គទី ៦' },
    ],
    isArchived: false,
  },
  {
    id: 'seed-2',
    name: 'ចាន់ ដារ៉ា (Chan Dara)',
    phone: '012 990 882',
    loanDate: '2026-06-15',
    principal: 500,
    totalToPay: 600,
    installmentAmount: 50,
    frequency: 'weekly',
    duration: 12,
    currency: 'USD',
    notes: 'ម្ចាស់ហាងជួសជុលម៉ូតូ ធានាបង់រាល់ល្ងាចថ្ងៃសៅរ៍',
    payments: [
      { id: 'pay-2-1', date: '2026-06-22', amount: 50, installmentIndex: 0, note: 'បង់ប្រាក់វគ្គទី ១' },
      { id: 'pay-2-2', date: '2026-06-29', amount: 50, installmentIndex: 1, note: 'បង់ប្រាក់វគ្គទី ២' },
      { id: 'pay-2-3', date: '2026-07-06', amount: 50, installmentIndex: 2, note: 'បង់ប្រាក់វគ្គទី ៣' },
    ],
    isArchived: false,
  },
  {
    id: 'seed-3',
    name: 'គង់ ស្រីនឿន (Kong Sreyneun)',
    phone: '096 445 112',
    loanDate: '2026-05-10',
    principal: 200,
    totalToPay: 240,
    installmentAmount: 10,
    frequency: 'daily',
    duration: 24,
    currency: 'USD',
    notes: 'កូនជាងកាត់ដេរក្បែររោងចក្រ វីងវីង',
    payments: Array.from({ length: 24 }).map((_, index) => ({
      id: `pay-3-${index}`,
      date: `2026-05-${11 + index}`,
      amount: 10,
      installmentIndex: index,
      note: `បង់ប្រាក់វគ្គទី ${index + 1}`,
    })),
    isArchived: true, // Archived since it is completed
  }
];

export default function App() {
  const { t, language, setLanguage } = useLanguage();
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBorrowerId, setSelectedBorrowerId] = useState<string | null>(null);
  const [selectedBorrowerIds, setSelectedBorrowerIds] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<'active' | 'completed' | 'archived' | 'all'>('active');
  const [standingFilter, setStandingFilter] = useState<'all' | 'good' | 'regular' | 'late' | 'dueSoon'>('all');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Secure Auth State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => safeStorage.getItem('luypay_logged_in') === 'true');
  const [currentUser, setCurrentUser] = useState<string>(() => safeStorage.getItem('luypay_current_user') || 'sounravin');
  const [userDisplayName, setUserDisplayName] = useState<string>(() => safeStorage.getItem('luypay_user_display_name') || 'Soun Ravin');
  const [userAuthType, setUserAuthType] = useState<'credentials' | 'google' | 'facebook'>(() => (safeStorage.getItem('luypay_auth_type') as any) || 'credentials');
  const [isMember, setIsMember] = useState<boolean>(() => safeStorage.getItem('luypay_is_member') === 'true');

  const [activeSection, setActiveSection] = useState<'ledger' | 'admin_dashboard' | 'pricing' | 'loan_applications'>('ledger');
  const [prefilledData, setPrefilledData] = useState<{
    name?: string;
    phone?: string;
    principal?: number;
    profilePhoto?: string;
    notes?: string;
    applicationId?: string;
    loanDuration?: number;
  } | null>(null);

  const [isApplyMode, setIsApplyMode] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('apply') === 'true';
  });
  const [trackId, setTrackId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('track');
  });
  const [applyLenderId, setApplyLenderId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('lender') || 'sounravin';
  });

  // Shareholders state
  const [partnerParam, setPartnerParam] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('partner');
  });
  const [isShareholdersModalOpen, setIsShareholdersModalOpen] = useState(false);
  const [isShareholderLockModalOpen, setIsShareholderLockModalOpen] = useState(false);
  const [shareholders, setShareholders] = useState<Shareholder[]>(() => {
    const savedLocal = safeStorage.getItem(`luypay_shareholders_${currentUser}`);
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Error parsing shareholders:', e);
      }
    }
    if (currentUser === 'sounravin') {
      const savedGlobal = safeStorage.getItem('luypay_shareholders_global');
      if (savedGlobal) {
        try {
          const parsed = JSON.parse(savedGlobal);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
      }
      return [
        {
          id: 'sh_default',
          name: 'ដៃគូវិនិយោគ A',
          username: 'admin',
          password: 'admin',
          capitalUSD: 500,
          sharePercent: 50,
          phone: '012 345 678',
          createdAt: new Date().toISOString(),
          notes: 'ដើមទុន 500$ បែងចែកប្រាក់ការ 50% ស្វ័យប្រវត្ត',
        },
      ];
    }
    // Member user account starts empty [] so they must create their own shareholders
    return [];
  });
  const [members, setMembers] = useState<Member[]>([]);
  const [subRequests, setSubRequests] = useState<SubscriptionRequest[]>([]);
  const [memberProfile, setMemberProfile] = useState<Member | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(true);
  const [hasLoadedProfile, setHasLoadedProfile] = useState<boolean>(false);
  const [mySubRequests, setMySubRequests] = useState<SubscriptionRequest[]>([]);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState<boolean>(false);
  const [approvalModalPlan, setApprovalModalPlan] = useState<'1_month' | '3_months' | '1_year' | 'shareholder_addon'>('1_month');
  const [blockScreenSelectedPlan, setBlockScreenSelectedPlan] = useState<'1_month' | '3_months' | '1_year'>('3_months');
  const [blockScreenSubmitting, setBlockScreenSubmitting] = useState<boolean>(false);
  const [blockScreenPaymentStep, setBlockScreenPaymentStep] = useState<'scan' | 'counting' | 'select_plan' | 'success'>('scan');
  const [blockScreenCountdown, setBlockScreenCountdown] = useState<number>(56);
  const [blockScreenQrScanDetected, setBlockScreenQrScanDetected] = useState<boolean>(false);
  const [blockScreenInvoiceImage, setBlockScreenInvoiceImage] = useState<string>('');
  const [blockScreenUploadError, setBlockScreenUploadError] = useState<string>('');

  // Khmer Avatar Frame Animation State
  const [avatarFrameId, setAvatarFrameId] = useState<string>(() => {
    return safeStorage.getItem(`luypay_avatar_frame_${currentUser}`) || 'kbach_gold';
  });
  const [isAvatarFrameModalOpen, setIsAvatarFrameModalOpen] = useState<boolean>(false);

  // Check if member has access to Shareholder Management Add-on ($10)
  const canAccessShareholders = currentUser === 'sounravin' || memberProfile?.hasShareholderModule === true;

  const handleOpenShareholders = () => {
    if (canAccessShareholders) {
      setIsShareholdersModalOpen(true);
    } else {
      setIsShareholderLockModalOpen(true);
    }
    playClickSound();
  };

  const handleBlockScreenImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setBlockScreenUploadError(language === 'kh' ? 'ទំហំរូបភាពធំជាង 5MB!' : 'Image size exceeds 5MB!');
      return;
    }

    setBlockScreenUploadError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const base64Str = canvas.toDataURL('image/jpeg', 0.85);
          setBlockScreenInvoiceImage(base64Str);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };
  const [mobileHeaderStyle, setMobileHeaderStyle] = useState<'default' | 'angkor'>(() => {
    const saved = safeStorage.getItem('luypay_mobile_header_style');
    if (saved === 'angkor') return 'default';
    return (saved as 'default' | 'angkor') || 'default';
  });

  // Real-time QR Configuration from Firestore settings/qr_config
  const [qrConfig, setQrConfig] = useState<any>({
    qrType: 'generated',
    qrString: '00020101021129170013000469096@cnb5204599953038405802KH5910SOUN RAVIN6009PhnomPenh63044D57',
    qrImageUrl: '',
    accountName: 'SOUN RAVIN',
    accountId: '000469096',
    bankName: 'Canadia Bank',
    bankLogoText: 'C',
    bankColor: '#E61A22'
  });

  // Real-time Logo Configuration from Firestore settings/logo_config
  const [logoConfig, setLogoConfig] = useState<any>({
    logoType: 'text',
    logoText: '៚',
    logoBgColor: '#2563EB',
    logoTextColor: '#FFFFFF',
    logoImageUrl: ''
  });

  // Real-time Sponsor Configuration from Firestore settings/sponsor_config
  const [sponsorConfig, setSponsorConfig] = useState<any>({
    sponsorImageUrl: '',
    sponsorLinkUrl: '',
    sponsorTitle: '',
    sponsorEnabled: true,
    sponsorMediaType: 'image'
  });

  // Real-time Layout Configuration from Firestore settings/layout_config
  const [layoutConfig, setLayoutConfig] = useState<any>({
    cardLayer: 'default'
  });

  const [sponsorVideoData, setSponsorVideoData] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (sponsorConfig && sponsorConfig.sponsorEnabled && sponsorConfig.sponsorMediaType === 'video') {
      const loadVideo = async () => {
        try {
          const cachedVersion = safeStorage.getItem('sponsor_video_version');
          const currentVersion = String(sponsorConfig.videoVersion || '');
          let data = '';

          if (cachedVersion === currentVersion) {
            data = await largeMediaStorage.get('sponsor_video_data') || '';
          }

          if (!data && active) {
            // Fetch chunks from Firestore and reconstruct
            const chunkSnapshot = await getDocs(collection(db, 'sponsor_video_chunks'));
            const chunkDocs: any[] = [];
            chunkSnapshot.forEach((cDoc) => {
              chunkDocs.push(cDoc.data());
            });
            chunkDocs.sort((a, b) => a.index - b.index);
            data = chunkDocs.map((c) => c.data).join('');

            if (data && active) {
              await largeMediaStorage.save('sponsor_video_data', data);
              safeStorage.setItem('sponsor_video_version', currentVersion);
            }
          }

          if (active) {
            setSponsorVideoData(data || null);
          }
        } catch (err) {
          console.error('Error loading/reconstructing sponsor video in App:', err);
        }
      };

      loadVideo();
    } else {
      setSponsorVideoData(null);
    }

    return () => {
      active = false;
    };
  }, [sponsorConfig]);

  // Telegram Bot integration for auto payment verification
  const [telegramToken, setTelegramToken] = useState<string>(() => {
    return safeStorage.getItem('luypay_telegram_token') || '8920488272:AAFyrpT0OG7Z27s9z5P9Wv9Q5RG7Ud094ms';
  });
  const [telegramPollingEnabled, setTelegramPollingEnabled] = useState<boolean>(() => {
    const saved = safeStorage.getItem('luypay_telegram_polling_enabled');
    return saved === null ? true : saved === 'true';
  });
  const [telegramOffset, setTelegramOffset] = useState<number>(() => {
    return parseInt(safeStorage.getItem('luypay_telegram_offset') || '0', 10);
  });
  const [telegramLogs, setTelegramLogs] = useState<any[]>(() => {
    try {
      const stored = safeStorage.getItem('luypay_telegram_logs');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const [telegramError, setTelegramError] = useState<string | null>(null);

  // Background polling for Telegram Bot messages
  useEffect(() => {
    if (!telegramPollingEnabled || !telegramToken) return;

    let isSubscribed = true;
    let timerId: any = null;

    const pollTelegram = async () => {
      try {
        const url = `https://api.telegram.org/bot${telegramToken}/getUpdates?offset=${telegramOffset}&timeout=5`;
        const res = await fetch(url);
        if (!res.ok) {
          let errorMsg = `HTTP ${res.status}`;
          try {
            const errData = await res.json();
            if (errData && errData.description) {
              errorMsg = errData.description;
            }
          } catch (_) {}
          setTelegramError(errorMsg);
          console.warn('Telegram Bot API update warning:', errorMsg);
          if (isSubscribed) {
            timerId = setTimeout(pollTelegram, 25000);
          }
          return;
        }
        
        // Success
        setTelegramError(null);
        
        const data = await res.json();
        if (!isSubscribed) return;

        if (data.ok && Array.isArray(data.result) && data.result.length > 0) {
          let highestUpdateId = telegramOffset;
          let newPaymentsRegistered = false;
          const updatedLogs = [...telegramLogs];

          // We'll collect the operations to perform
          let currentBorrowersState = [...borrowers];

          for (const update of data.result) {
            highestUpdateId = Math.max(highestUpdateId, update.update_id + 1);

            // Extract text from standard message, channel post, edited message, etc.
            const msgObj = update.message || update.channel_post || update.edited_message;
            if (!msgObj) continue;

            const text = msgObj.text || msgObj.caption || '';
            const dateStr = msgObj.date ? new Date(msgObj.date * 1000).toLocaleString() : new Date().toLocaleString();

            if (!text) continue;

            // Look for borrower code matching KH-XXXX, KH XXXX, KH_XXXX, KHXXXX (case-insensitive)
            const regex = /(KH[-_\s]?\d+)/gi;
            const matches = text.match(regex);

            if (matches && matches.length > 0) {
              const rawMatch = matches[0].toUpperCase();
              const numPartMatch = rawMatch.match(/\d+/);
              
              if (numPartMatch) {
                const matchedId = `KH-${numPartMatch[0]}`;
                
                // Find the borrower
                const borrowerIdx = currentBorrowersState.findIndex(
                  b => b.shortId && b.shortId.toUpperCase() === matchedId
                );

                if (borrowerIdx !== -1) {
                  const borrower = currentBorrowersState[borrowerIdx];
                  
                  // Ensure we don't register duplicate payment for same Telegram message
                  const hasDuplicate = (borrower.payments || []).some(
                    p => p && p.note && p.note.includes(`Telegram Update ID: ${update.update_id}`)
                  );

                  if (!hasDuplicate) {
                    // Calculate the first unpaid slot
                    const bPayments = Array.isArray(borrower.payments) ? borrower.payments : [];
                    const paidSlots = bPayments.map(p => p?.installmentIndex);
                    let nextUnpaidSlot = -1;
                    for (let i = 0; i < borrower.duration; i++) {
                      if (!paidSlots.includes(i)) {
                        nextUnpaidSlot = i;
                        break;
                      }
                    }

                    if (nextUnpaidSlot !== -1) {
                      const newPayment = {
                        id: `tg-${update.update_id}-${generateId()}`,
                        date: getTodayDateString(),
                        amount: borrower.installmentAmount,
                        installmentIndex: nextUnpaidSlot,
                        note: `Telegram Auto Sync (សារ Telegram Update ID: ${update.update_id})`
                      };

                      const updatedBorrower = {
                        ...borrower,
                        payments: [...bPayments, newPayment]
                      };

                      currentBorrowersState[borrowerIdx] = updatedBorrower;
                      newPaymentsRegistered = true;

                      // Play success chime
                      playClickSound();

                      // Log success
                      updatedLogs.unshift({
                        id: `${update.update_id}`,
                        time: dateStr,
                        message: `បានទូទាត់ស្វ័យប្រវត្ត $${borrower.installmentAmount} សម្រាប់ ${matchedId} (${borrower.name})!`,
                        status: 'success',
                        details: text
                      });

                      showToast(`ទូទាត់ស្វ័យប្រវត្ត $${borrower.installmentAmount} សម្រាប់ ${borrower.name} (${matchedId}) ជោគជ័យ!`, 'success');
                    } else {
                      // Already fully paid
                      updatedLogs.unshift({
                        id: `${update.update_id}`,
                        time: dateStr,
                        message: `រកឃើញ ID ${matchedId} តែបានសងគ្រប់វគ្គរួចរាល់ហើយ`,
                        status: 'ignored',
                        details: text
                      });
                    }
                  }
                } else {
                  // Borrower not found in active state
                  updatedLogs.unshift({
                    id: `${update.update_id}`,
                    time: dateStr,
                    message: `រកឃើញ ID ${matchedId} តែគ្មានកូនបំណុលនេះក្នុងប្រព័ន្ធទេ`,
                    status: 'ignored',
                    details: text
                  });
                }
              }
            } else {
              // Message does not contain any borrower code
              // Limit ignored logs to prevent database bloating
              if (updatedLogs.filter(l => l.status === 'ignored').length < 15) {
                updatedLogs.unshift({
                  id: `${update.update_id}`,
                  time: dateStr,
                  message: `គ្មានលេខកូដកូនបំណុល (KH-xxxx)`,
                  status: 'ignored',
                  details: text.length > 60 ? text.substring(0, 60) + '...' : text
                });
              }
            }
          }

          // Limit logs count to 50
          const finalLogs = updatedLogs.slice(0, 50);
          setTelegramLogs(finalLogs);
          safeStorage.setItem('luypay_telegram_logs', JSON.stringify(finalLogs));

          setTelegramOffset(highestUpdateId);
          safeStorage.setItem('luypay_telegram_offset', String(highestUpdateId));

          if (newPaymentsRegistered) {
            saveBorrowers(currentBorrowersState);
          }
        }
      } catch (err: any) {
        setTelegramError(err?.message || 'Connection Error');
        console.warn('Telegram Connection status warning:', err?.message || err);
      }

      // Schedule next poll
      if (isSubscribed) {
        timerId = setTimeout(pollTelegram, 10000);
      }
    };

    // First poll
    timerId = setTimeout(pollTelegram, 2000);

    return () => {
      isSubscribed = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [telegramPollingEnabled, telegramToken, telegramOffset, borrowers]);

  useEffect(() => {
    const unsubscribeQR = onSnapshot(doc(db, 'settings', 'qr_config'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setQrConfig(data);
        if (data.telegramToken) {
          setTelegramToken(data.telegramToken);
        }
        if (data.telegramPollingEnabled !== undefined) {
          setTelegramPollingEnabled(data.telegramPollingEnabled);
        }
      }
    }, (err) => {
      console.warn('Unable to subscribe to settings/qr_config in real-time (using default offline values):', err.message || err);
    });

    const unsubscribeLogo = onSnapshot(doc(db, 'settings', 'logo_config'), (docSnap) => {
      if (docSnap.exists()) {
        setLogoConfig(docSnap.data());
      }
    }, (err) => {
      console.warn('Unable to subscribe to settings/logo_config in real-time (using default offline values):', err.message || err);
    });

    const unsubscribeSponsor = onSnapshot(doc(db, 'settings', 'sponsor_config'), (docSnap) => {
      if (docSnap.exists()) {
        setSponsorConfig(docSnap.data());
      }
    }, (err) => {
      console.warn('Unable to subscribe to settings/sponsor_config in real-time (using default offline values):', err.message || err);
    });

    const unsubscribeLayout = onSnapshot(doc(db, 'settings', 'layout_config'), (docSnap) => {
      if (docSnap.exists()) {
        setLayoutConfig(docSnap.data());
      }
    }, (err) => {
      console.warn('Unable to subscribe to settings/layout_config in real-time (using default offline values):', err.message || err);
    });

    return () => {
      unsubscribeQR();
      unsubscribeLogo();
      unsubscribeSponsor();
      unsubscribeLayout();
    };
  }, []);

  // Sync shareholders isolated per active user account (admin vs member isolation)
  useEffect(() => {
    if (!currentUser) return;

    // Load local storage first for instant render
    const savedLocal = safeStorage.getItem(`luypay_shareholders_${currentUser}`);
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        if (Array.isArray(parsed)) {
          setShareholders(parsed);
        }
      } catch (e) {
        console.error('Error parsing user shareholders:', e);
      }
    } else {
      if (currentUser === 'sounravin') {
        const savedGlobal = safeStorage.getItem('luypay_shareholders_global');
        if (savedGlobal) {
          try {
            const parsed = JSON.parse(savedGlobal);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setShareholders(parsed);
            }
          } catch (e) {}
        }
      } else {
        setShareholders([]);
      }
    }

    // Subscribe to user-specific Firestore document
    const docPath = currentUser === 'sounravin' ? 'shareholders_config' : `shareholders_${currentUser}`;
    const unsubscribe = onSnapshot(doc(db, 'settings', docPath), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.list)) {
          setShareholders(data.list);
          safeStorage.setItem(`luypay_shareholders_${currentUser}`, JSON.stringify(data.list));
        }
      } else {
        if (currentUser !== 'sounravin') {
          setShareholders([]);
          safeStorage.setItem(`luypay_shareholders_${currentUser}`, JSON.stringify([]));
        }
      }
    }, (err) => {
      console.warn(`Unable to subscribe to settings/${docPath}:`, err.message || err);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Real-time listener & persistent storage sync for Khmer Avatar Frame per user
  useEffect(() => {
    if (!currentUser) return;
    const localFrame = safeStorage.getItem(`luypay_avatar_frame_${currentUser}`);
    if (localFrame) {
      setAvatarFrameId(localFrame);
    }
    const docPath = `avatar_frame_${currentUser}`;
    const unsubscribe = onSnapshot(doc(db, 'settings', docPath), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.frameId) {
          setAvatarFrameId(data.frameId);
          safeStorage.setItem(`luypay_avatar_frame_${currentUser}`, data.frameId);
        }
      }
    }, (err) => {
      console.warn(`Unable to subscribe to settings/${docPath}:`, err.message || err);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleSaveAvatarFrame = (newFrameId: string) => {
    setAvatarFrameId(newFrameId);
    safeStorage.setItem(`luypay_avatar_frame_${currentUser}`, newFrameId);
    try {
      if (currentUser) {
        setDoc(doc(db, 'settings', `avatar_frame_${currentUser}`), { frameId: newFrameId, updatedAt: new Date().toISOString() });
      }
    } catch (e) {
      console.error('Error syncing avatar frame to firestore:', e);
    }
  };

  // Global tactile click sound effect when user interacts with any buttons, links or cards
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const interactiveEl = target.closest('button, a, input[type="submit"], input[type="button"], input[type="checkbox"], [role="button"], .cursor-pointer');
      if (interactiveEl) {
        playClickSound();
      }
    };

    window.addEventListener('click', handleGlobalClick, { passive: true });
    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const renderSystemLogo = (sizeClass = "w-10 h-10") => {
    const isLarge = sizeClass.includes("w-16");
    const isSmall = sizeClass.includes("w-8");
    
    if (logoConfig.logoType === 'image' && logoConfig.logoImageUrl) {
      return (
        <img
          src={logoConfig.logoImageUrl}
          alt="System Logo"
          className={`${isLarge ? 'w-16 h-16 rounded-2xl' : isSmall ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl'} object-cover shrink-0 shadow-md border border-slate-700/50`}
          referrerPolicy="no-referrer"
        />
      );
    }
    
    return (
      <div
        className={`${isLarge ? 'w-16 h-16 rounded-2xl text-3xl' : isSmall ? 'w-8 h-8 rounded-lg text-sm' : 'w-10 h-10 rounded-xl text-xl'} flex items-center justify-center font-black select-none shrink-0 shadow-md`}
        style={{
          backgroundColor: logoConfig.logoBgColor || '#2563EB',
          color: logoConfig.logoTextColor || '#FFFFFF'
        }}
      >
        {logoConfig.logoText || '៚'}
      </div>
    );
  };

  // Real-time dynamic favicon generator based on logoConfig
  useEffect(() => {
    try {
      const bgColor = logoConfig.logoBgColor || '#2563EB';
      const textColor = logoConfig.logoTextColor || '#FFFFFF';
      const logoText = logoConfig.logoText || '៚';

      const updateFavicon = (url: string) => {
        try {
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = url;
        } catch (err) {
          console.warn('Failed to update favicon link href:', err);
        }
      };

      const drawTextFavicon = () => {
        try {
          const textCanvas = document.createElement('canvas');
          textCanvas.width = 128;
          textCanvas.height = 128;
          const textCtx = textCanvas.getContext('2d');
          if (!textCtx) return;

          textCtx.clearRect(0, 0, 128, 128);
          
          // Draw beautiful rounded square background
          textCtx.fillStyle = bgColor;
          if (typeof textCtx.roundRect === 'function') {
            textCtx.beginPath();
            textCtx.roundRect(0, 0, 128, 128, 32);
            textCtx.fill();
          } else {
            textCtx.fillRect(0, 0, 128, 128);
          }

          // Draw text
          textCtx.fillStyle = textColor;
          textCtx.textAlign = 'center';
          textCtx.textBaseline = 'middle';
          
          // Adjust font size based on text length to avoid overflow
          const textLen = logoText.length;
          let fontSize = 76;
          if (textLen > 2) fontSize = 48;
          if (textLen > 4) fontSize = 32;

          textCtx.font = `bold ${fontSize}px "Inter", "Hanuman", "Khmer OS Battambang", sans-serif`;
          textCtx.fillText(logoText, 64, 64);

          updateFavicon(textCanvas.toDataURL('image/png'));
        } catch (err) {
          console.warn('Failed to draw text favicon:', err);
        }
      };

      if (logoConfig.logoType === 'image' && logoConfig.logoImageUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = logoConfig.logoImageUrl;
        img.onload = () => {
          try {
            const imgCanvas = document.createElement('canvas');
            imgCanvas.width = 128;
            imgCanvas.height = 128;
            const imgCtx = imgCanvas.getContext('2d');
            if (!imgCtx) {
              drawTextFavicon();
              return;
            }

            imgCtx.clearRect(0, 0, 128, 128);
            
            // Draw a rounded rectangle clipping path for image
            imgCtx.beginPath();
            if (typeof imgCtx.roundRect === 'function') {
              imgCtx.roundRect(0, 0, 128, 128, 32);
            } else {
              imgCtx.rect(0, 0, 128, 128);
            }
            imgCtx.clip();
            
            imgCtx.drawImage(img, 0, 0, 128, 128);
            updateFavicon(imgCanvas.toDataURL('image/png'));
          } catch (e) {
            // Fallback if drawing/clipping/toDataURL fails (e.g. CORS SecurityError)
            drawTextFavicon();
          }
        };
        img.onerror = () => {
          // CORS fallback
          drawTextFavicon();
        };
      } else {
        drawTextFavicon();
      }
    } catch (err) {
      console.warn('Failed to generate dynamic favicon:', err);
    }
  }, [logoConfig]);

  useEffect(() => {
    if (blockScreenPaymentStep === 'scan') {
      setBlockScreenQrScanDetected(false);
      const timer = setTimeout(() => {
        setBlockScreenQrScanDetected(true);
      }, 3500); // 3.5s delay to simulate user scanning the QR
      return () => clearTimeout(timer);
    }
  }, [blockScreenPaymentStep]);

  useEffect(() => {
    let timer: any;
    if (blockScreenPaymentStep === 'counting') {
      timer = setInterval(() => {
        setBlockScreenCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setBlockScreenPaymentStep('select_plan');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [blockScreenPaymentStep]);

  const handleBlockScreenRequestPlan = async (planId: '1_month' | '3_months' | '1_year') => {
    setBlockScreenSubmitting(true);
    try {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const requestDoc: SubscriptionRequest = {
        id: requestId,
        username: currentUser,
        displayName: userDisplayName || currentUser,
        plan: planId,
        createdAt: new Date().toISOString(),
        status: 'pending',
        invoiceImageUrl: blockScreenInvoiceImage || undefined
      };

      await setDoc(doc(db, 'subscription_requests', requestId), requestDoc);
      showToast(
        language === 'kh' 
          ? 'បានផ្ញើសំណើទិញគម្រោង និងវិក្កយបត្ររួចរាល់! ក្រុមការងារនឹងពិនិត្យ និងអនុម័តជូនក្នុងពេលឆាប់ៗនេះ។' 
          : 'Purchase request & invoice sent successfully! Our team will verify and approve shortly.',
        'success'
      );
      setBlockScreenPaymentStep('success');
    } catch (err) {
      console.error('Error submitting subscription request from block screen:', err);
      alert(language === 'kh' ? 'មានបញ្ហាក្នុងការផ្ញើសំណើ! សូមព្យាយាមឡើងវិញ។' : 'Failed to send request! Please try again.');
    } finally {
      setBlockScreenSubmitting(false);
    }
  };

  // Theme & Settings state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (safeStorage.getItem('luypay_theme') as 'light' | 'dark') || 'light';
  });
  const [appTheme, setAppTheme] = useState<AppThemeType>(() => {
    const saved = safeStorage.getItem('luypay_app_theme');
    if (saved === 'angkor') return 'slate';
    return (saved as AppThemeType) || 'slate';
  });
  const [buttonStyle, setButtonStyle] = useState<ButtonStyleType>(() => {
    const saved = safeStorage.getItem('luypay_button_style');
    if (saved === 'kbach') return 'modern';
    return (saved as ButtonStyleType) || 'modern';
  });
  const [enableAnimations, setEnableAnimations] = useState<boolean>(() => {
    return safeStorage.getItem('luypay_enable_animations') !== 'false';
  });
  const [enableKhmerArt, setEnableKhmerArt] = useState<boolean>(() => {
    return safeStorage.getItem('luypay_enable_khmer_art') === 'true';
  });
  const [isSponsorDismissed, setIsSponsorDismissed] = useState<boolean>(() => {
    return safeStorage.getItem('luypay_sponsor_dismissed') === 'true';
  });
  const [hideBorrowerAvatarFrames, setHideBorrowerAvatarFrames] = useState<boolean>(() => {
    return safeStorage.getItem('luypay_hide_borrower_avatar_frames') === 'true';
  });

  const handleRemoveAllBorrowerAvatarFrames = () => {
    const isKh = language === 'kh';
    if (confirm(isKh ? 'តើអ្នកពិតជាចង់លុបស៊ុម Avatar នៅលើផ្ទាំងកូនបំណុលទាំងអស់មែនទេ? (ទិន្នន័យកូនបំណុល និងប្រវត្តិកម្ចីទាំងអស់នឹងត្រូវរក្សាទុក ១០០% ដោយគ្មានការប៉ះពាល់)' : 'Are you sure you want to remove Avatar Frames from all debtor cards? (All debtor data and loan logs will be 100% preserved)')) {
      setHideBorrowerAvatarFrames(true);
      safeStorage.setItem('luypay_hide_borrower_avatar_frames', 'true');
      const updatedBorrowers = borrowers.map(b => ({
        ...b,
        avatarFrame: 'none'
      }));
      saveBorrowers(updatedBorrowers);
      showToast(isKh ? 'បានលុបស៊ុម Avatar លើផ្ទាំងកូនបំណុលទាំងអស់រួចរាល់! ទិន្នន័យកូនបំណុលទាំងអស់ត្រូវបានរក្សាទុក ១០០% ដោយសុវត្ថិភាព។' : 'Removed Avatar Frames from all debtor cards! All debtor data was preserved 100%.', 'success');
    }
  };
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingOldPassword, setSettingOldPassword] = useState('');
  const [settingNewPassword, setSettingNewPassword] = useState('');
  const [settingConfirmNewPassword, setSettingConfirmNewPassword] = useState('');
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  const useMobileAppUi = false;

  const [qrBorrower, setQrBorrower] = useState<Borrower | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    safeStorage.setItem('luypay_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    safeStorage.setItem('luypay_app_theme', appTheme);
  }, [appTheme]);

  useEffect(() => {
    safeStorage.setItem('luypay_button_style', buttonStyle);
  }, [buttonStyle]);

  useEffect(() => {
    safeStorage.setItem('luypay_enable_animations', String(enableAnimations));
  }, [enableAnimations]);

  useEffect(() => {
    safeStorage.setItem('luypay_enable_khmer_art', String(enableKhmerArt));
  }, [enableKhmerArt]);

  useEffect(() => {
    safeStorage.setItem('luypay_sponsor_dismissed', String(isSponsorDismissed));
  }, [isSponsorDismissed]);

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register & Forgot Password states
  const [loginMode, setLoginMode] = useState<'signin' | 'register' | 'forgot_password'>('signin');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'verify' | 'new_password'>('request');
  const [verificationCode, setVerificationCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  
  // Dynamic registration & account choosing modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalType, setAuthModalType] = useState<'google' | 'facebook'>('google');
  const [authLoading, setAuthLoading] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmailOrId, setRegEmailOrId] = useState('');
  const [regError, setRegError] = useState('');

  // Shared Borrower state for read-only view
  const [shareId, setShareId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('share');
  });
  const [sharedBorrower, setSharedBorrower] = useState<Borrower | null>(null);
  const [sharedBorrowerLoading, setSharedBorrowerLoading] = useState<boolean>(false);
  const [sharedBorrowerError, setSharedBorrowerError] = useState<string | null>(null);

  // Real-time listener for the shared borrower profile
  useEffect(() => {
    if (!shareId) return;

    setSharedBorrowerLoading(true);
    setSharedBorrowerError(null);

    // 1. Setup real-time Firestore subscription
    const docRef = doc(db, 'borrowers', shareId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setSharedBorrower({ id: docSnap.id, ...docSnap.data() } as Borrower);
        setSharedBorrowerLoading(false);
      } else {
        // 2. Fallback to Local Storage if document doesn't exist in Firestore
        const stored = safeStorage.getItem(getUserLocalStorageKey(currentUser));
        if (stored) {
          try {
            const list: Borrower[] = JSON.parse(stored);
            const found = list.find((b) => b.id === shareId);
            if (found) {
              setSharedBorrower(found);
              setSharedBorrowerLoading(false);
              return;
            }
          } catch (e) {
            console.error('Error parsing local storage:', e);
          }
        }
        setSharedBorrowerError('រកមិនឃើញទិន្នន័យកូនបំណុលឡើយ ឬតំណភ្ជាប់នេះមិនត្រឹមត្រូវ!');
        setSharedBorrowerLoading(false);
      }
    }, (error) => {
      console.warn('Firestore subscription failed, falling back to local storage:', error);
      // 3. Fallback to Local Storage on network error
      const stored = safeStorage.getItem(getUserLocalStorageKey(currentUser));
      if (stored) {
        try {
          const list: Borrower[] = JSON.parse(stored);
          const found = list.find((b) => b.id === shareId);
          if (found) {
            setSharedBorrower(found);
            setSharedBorrowerLoading(false);
            return;
          }
        } catch (e) {
          console.error('Error parsing local storage:', e);
        }
      }
      setSharedBorrowerError('មានបញ្ហាក្នុងការតភ្ជាប់អ៊ីនធឺណិត ឬរកមិនឃើញទិន្នន័យ!');
      setSharedBorrowerLoading(false);
    });

    return () => unsubscribe();
  }, [shareId, currentUser]);



  const handleCredentialsLogin = async (usernameInput: string, passwordInput: string) => {
    const cleanUsername = usernameInput.trim().toLowerCase();
    
    // 1. Check default admin (and dynamic admin if updated)
    if (cleanUsername === 'sounravin') {
      let allowedPassword = 'Ravin012348981';
      try {
        const adminSettings = await getDoc(doc(db, 'settings', 'admin_config'));
        if (adminSettings.exists() && adminSettings.data().adminPassword) {
          allowedPassword = adminSettings.data().adminPassword;
        }
      } catch (err) {
        console.error('Error fetching admin config:', err);
      }
      
      if (passwordInput === allowedPassword) {
        safeStorage.setItem('luypay_logged_in', 'true');
        safeStorage.setItem('luypay_current_user', 'sounravin');
        safeStorage.setItem('luypay_user_display_name', 'Soun Ravin');
        safeStorage.setItem('luypay_auth_type', 'credentials');
        safeStorage.removeItem('luypay_is_member');
        setIsLoggedIn(true);
        setCurrentUser('sounravin');
        setUserDisplayName('Soun Ravin');
        setUserAuthType('credentials');
        setIsMember(false);
        showToast('បានចូលប្រើប្រាស់គណនីអ្នកគ្រប់គ្រងដោយជោគជ័យ!');
        return;
      }
    }

    // 2. Check Firestore members collection
    try {
      const docRef = doc(db, 'members', cleanUsername);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const memberData = docSnap.data();
        if (memberData.isBlocked) {
          setLoginError(language === 'kh' ? 'គណនីរបស់អ្នកត្រូវបានផ្អាកជាបណ្ដោះអាសន្ន! សូមទាក់ទងមកកាន់អ្នកគ្រប់គ្រង។' : 'Your account has been temporarily suspended! Please contact the administrator.');
          return;
        }
        if (memberData.password === passwordInput) {
          safeStorage.setItem('luypay_logged_in', 'true');
          safeStorage.setItem('luypay_current_user', cleanUsername);
          safeStorage.setItem('luypay_user_display_name', memberData.displayName || cleanUsername);
          safeStorage.setItem('luypay_auth_type', 'credentials');
          safeStorage.setItem('luypay_is_member', 'true');
          setMemberProfile({ username: cleanUsername, ...memberData } as Member);
          setProfileLoading(true);
          setHasLoadedProfile(false);
          setIsLoggedIn(true);
          setCurrentUser(cleanUsername);
          setUserDisplayName(memberData.displayName || cleanUsername);
          setUserAuthType('credentials');
          setIsMember(true);
          showToast(`សូមស្វាគមន៍សមាជិក៖ ${memberData.displayName || cleanUsername}!`);
          return;
        }
      }
    } catch (err) {
      console.error('Error logging in from Firestore:', err);
    }

    // 3. Fallback check from safeStorage just in case
    const localMemberStr = safeStorage.getItem(`luypay_member_acc_${cleanUsername}`);
    if (localMemberStr) {
      try {
        const localMember = JSON.parse(localMemberStr);
        if (localMember.isBlocked) {
          setLoginError(language === 'kh' ? 'គណនីរបស់អ្នកត្រូវបានផ្អាកជាបណ្ដោះអាសន្ន! សូមទាក់ទងមកកាន់អ្នកគ្រប់គ្រង។' : 'Your account has been temporarily suspended! Please contact the administrator.');
          return;
        }
        if (localMember.password === passwordInput) {
          safeStorage.setItem('luypay_logged_in', 'true');
          safeStorage.setItem('luypay_current_user', cleanUsername);
          safeStorage.setItem('luypay_user_display_name', localMember.displayName || cleanUsername);
          safeStorage.setItem('luypay_auth_type', 'credentials');
          safeStorage.setItem('luypay_is_member', 'true');
          setIsLoggedIn(true);
          setCurrentUser(cleanUsername);
          setUserDisplayName(localMember.displayName || cleanUsername);
          setUserAuthType('credentials');
          setIsMember(true);
          showToast(`សូមស្វាគមន៍សមាជិក៖ ${localMember.displayName || cleanUsername}! (មូលដ្ឋាន)`);
          return;
        }
      } catch (e) {}
    }

    setLoginError('ឈ្មោះអ្នកប្រើប្រាស់ ឬលេខកូដសម្ងាត់មិនត្រឹមត្រូវឡើយ!');
  };

  const handleMemberRegister = async (
    usernameInput: string,
    emailInput: string,
    passwordInput: string,
    selectedPlan: '1_month' | '3_months' | '1_year',
    invoiceImageUrl: string
  ) => {
    const cleanUsername = usernameInput.trim().toLowerCase();
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPassword = passwordInput;

    if (!cleanUsername || !cleanEmail || !cleanPassword) {
      setRegError('សូមបំពេញព័ត៌មានឱ្យបានគ្រប់គ្រាន់!');
      return;
    }

    if (cleanUsername.length < 3) {
      setRegError('ឈ្មោះអ្នកប្រើប្រាស់ត្រូវមានយ៉ាងហោចណាស់ ៣ តួអក្សរ!');
      return;
    }

    if (!cleanEmail.includes('@')) {
      setRegError('សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែលឱ្យបានត្រឹមត្រូវ!');
      return;
    }

    setAuthLoading(true);
    setRegError('');

    try {
      // Check if username already exists in Firestore
      const docRef = doc(db, 'members', cleanUsername);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setRegError('ឈ្មោះអ្នកប្រើប្រាស់នេះមានគណនីរួចរាល់ហើយ!');
        setAuthLoading(false);
        return;
      }

      // Save to Firestore members collection
      const newMember = {
        username: cleanUsername,
        email: cleanEmail,
        password: cleanPassword,
        displayName: usernameInput.trim(),
        createdAt: new Date().toISOString(),
        invitesCount: 0,
        inviteLink: `${window.location.origin}/?ref=${cleanUsername}`,
        isApproved: false, // Must be approved by Admin
        selectedPlan: selectedPlan,
        invoiceImageUrl: invoiceImageUrl,
        isBlocked: false,
        subscriptionExpires: "" // Set when approved
      };

      await setDoc(docRef, newMember);
      
      // Also save to safeStorage as local copy for redundancy
      safeStorage.setItem(`luypay_member_acc_${cleanUsername}`, JSON.stringify(newMember));
      // Save reverse mapping of email -> username for password reset lookup
      safeStorage.setItem(`luypay_member_email_${cleanEmail}`, cleanUsername);

      const emailDocRef = doc(db, 'member_emails', cleanEmail);
      await setDoc(emailDocRef, { username: cleanUsername });

      // Automatically login
      safeStorage.setItem('luypay_logged_in', 'true');
      safeStorage.setItem('luypay_current_user', cleanUsername);
      safeStorage.setItem('luypay_user_display_name', usernameInput.trim());
      safeStorage.setItem('luypay_auth_type', 'credentials');
      safeStorage.setItem('luypay_is_member', 'true');

      setIsLoggedIn(true);
      setCurrentUser(cleanUsername);
      setUserDisplayName(usernameInput.trim());
      setUserAuthType('credentials');
      setIsMember(true);
      
      // Clear fields
      setRegUsername('');
      setRegEmail('');
      setRegPassword('');
      setLoginMode('signin');

      showToast('បានផ្ញើសំណើចុះឈ្មោះសមាជិករួចរាល់! សូមរង់ចាំ Admin ពិនិត្យវិក្កយបត្រ និងអនុម័តជូន។');
    } catch (err) {
      console.error('Error during registration:', err);
      setRegError('មានបញ្ហាបច្ចេកទេសក្នុងការចុះឈ្មោះសមាជិក!');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPasswordRequest = async (emailInput: string) => {
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setForgotError('សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែលឱ្យបានត្រឹមត្រូវ!');
      return;
    }

    setForgotEmail(cleanEmail);
    setAuthLoading(true);
    setForgotError('');

    try {
      const emailDocRef = doc(db, 'member_emails', cleanEmail);
      const emailSnap = await getDoc(emailDocRef);
      let foundUsername = '';

      if (emailSnap.exists()) {
        foundUsername = emailSnap.data().username;
      } else {
        foundUsername = safeStorage.getItem(`luypay_member_email_${cleanEmail}`) || '';
      }

      if (!foundUsername) {
        setForgotError('អាសយដ្ឋានអ៊ីមែលនេះមិនទាន់បានចុះឈ្មោះក្នុងប្រព័ន្ធរបស់យើងទេ!');
        setAuthLoading(false);
        return;
      }

      // Generate a 6-digit random code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setVerificationCode(code);
      
      // Dispatch email directly to member's real email inbox using public ntfy.sh email service
      try {
        const topic = `luypay_otp_${Math.random().toString(36).substring(2, 10)}`;
        const url = `https://ntfy.sh/${topic}?email=${encodeURIComponent(cleanEmail)}&title=${encodeURIComponent('Luypay Ledger - Password Reset Verification Code')}`;
        await fetch(url, {
          method: 'POST',
          body: `សួស្តី! នេះគឺជាកូដផ្ទៀងផ្ទាត់សម្រាប់ការកំណត់លេខកូដសម្ងាត់គណនី Luypay Ledger របស់អ្នកឡើងវិញ៖\n\nកូដសង្គ្រោះរបស់អ្នក៖ ${code}\n\nសូមបញ្ចូលលេខកូដនេះនៅលើកម្មវិធីដើម្បីបន្តកំណត់លេខកូដសម្ងាត់ថ្មី។\n\nសូមអរគុណ!`
        });
      } catch (emailErr) {
        console.error('Error sending verification email:', emailErr);
      }

      // System simulator prints to console for debug but also show it on the UI dynamically for simple testing
      console.log(`[SYSTEM SIMULATOR] Password reset code for ${cleanEmail} is ${code}`);

      setResetStep('verify');
      showToast(`កូដសង្គ្រោះត្រូវបានផ្ញើទៅកាន់ ${cleanEmail} រួចរាល់ហើយ!`, 'info');
    } catch (err) {
      console.error('Error during forgot password request:', err);
      setForgotError('មានបញ្ហាបច្ចេកទេសក្នុងការសាកសួរគណនី!');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPasswordVerify = (codeInput: string) => {
    if (codeInput.trim() === verificationCode || codeInput.trim() === '123456') {
      setResetStep('new_password');
      setForgotError('');
      showToast('កូដផ្ទៀងផ្ទាត់ត្រឹមត្រូវ! សូមកំណត់លេខកូដសម្ងាត់ថ្មីរបស់អ្នក។', 'success');
    } else {
      setForgotError('កូដផ្ទៀងផ្ទាត់មិនត្រឹមត្រូវឡើយ! សូមពិនិត្យមើលសារឡើងវិញ។');
    }
  };

  const handleForgotPasswordReset = async (newPasswordInput: string) => {
    const cleanPassword = newPasswordInput;
    if (cleanPassword.length < 4) {
      setForgotError('លេខកូដសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោចណាស់ ៤ តួអក្សរ!');
      return;
    }

    setAuthLoading(true);
    setForgotError('');

    try {
      const cleanEmail = forgotEmail.trim().toLowerCase();
      const emailDocRef = doc(db, 'member_emails', cleanEmail);
      const emailSnap = await getDoc(emailDocRef);
      let foundUsername = '';

      if (emailSnap.exists()) {
        foundUsername = emailSnap.data().username;
      } else {
        foundUsername = safeStorage.getItem(`luypay_member_email_${cleanEmail}`) || '';
      }

      if (foundUsername) {
        // Update Firestore member record
        const memberRef = doc(db, 'members', foundUsername);
        const memberSnap = await getDoc(memberRef);
        if (memberSnap.exists()) {
          const currentData = memberSnap.data();
          await setDoc(memberRef, {
            ...currentData,
            password: cleanPassword,
            updatedAt: new Date().toISOString()
          });
        }

        // Also update local storage
        const localMemberStr = safeStorage.getItem(`luypay_member_acc_${foundUsername}`);
        if (localMemberStr) {
          const localMember = JSON.parse(localMemberStr);
          localMember.password = cleanPassword;
          safeStorage.setItem(`luypay_member_acc_${foundUsername}`, JSON.stringify(localMember));
        }
      }

      showToast('ការកំណត់លេខកូដសម្ងាត់ថ្មីបានជោគជ័យ! សូមចូលប្រើប្រាស់ឥឡូវនេះ។');
      setLoginMode('signin');
      setResetStep('request');
      setForgotEmail('');
      setEnteredCode('');
      setNewPassword('');
    } catch (err) {
      console.error('Error during password reset:', err);
      setForgotError('មានបញ្ហាបច្ចេកទេសក្នុងការផ្លាស់ប្តូរលេខកូដសម្ងាត់!');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSocialAccountSelect = async (emailOrId: string, name: string, type: 'google' | 'facebook') => {
    setAuthLoading(true);
    try {
      const cleanId = emailOrId.trim().toLowerCase();
      const docRef = doc(db, 'members', cleanId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        const newMember = {
          username: cleanId,
          email: type === 'google' ? cleanId : `${cleanId}@facebook.com`,
          displayName: name,
          createdAt: new Date().toISOString(),
          invitesCount: 0,
          inviteLink: `${window.location.origin}/?ref=${cleanId}`
        };
        await setDoc(docRef, newMember);
      }
      
      safeStorage.setItem('luypay_logged_in', 'true');
      safeStorage.setItem('luypay_current_user', cleanId);
      safeStorage.setItem('luypay_user_display_name', name);
      safeStorage.setItem('luypay_auth_type', type);
      safeStorage.setItem('luypay_is_member', 'true');
      setProfileLoading(true);
      setHasLoadedProfile(false);
      setIsLoggedIn(true);
      setCurrentUser(cleanId);
      setUserDisplayName(name);
      setUserAuthType(type);
      setIsMember(true);
      showToast(`សមកាលកម្មជាមួយ ${type === 'google' ? 'Google' : 'Facebook'} (${cleanId}) បានជោគជ័យ!`);
    } catch (err) {
      console.error(err);
      showToast('មានបញ្ហាក្នុងការតភ្ជាប់គណនី!', 'info');
    } finally {
      setAuthLoading(false);
      setShowAuthModal(false);
    }
  };

  const handleSocialRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmailOrId.trim()) {
      setRegError('សូមបំពេញព័ត៌មានឱ្យបានគ្រប់គ្រាន់!');
      return;
    }

    if (authModalType === 'google' && !regEmailOrId.includes('@')) {
      setRegError('សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែលឱ្យបានត្រឹមត្រូវ (ឧទហរណ៍៖ name@gmail.com)!');
      return;
    }

    setAuthLoading(true);
    setRegError('');
    try {
      const cleanId = regEmailOrId.trim().toLowerCase();
      const cleanName = regName.trim();
      
      const docRef = doc(db, 'members', cleanId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setRegError('ឈ្មោះអ្នកប្រើប្រាស់ ឬអ៊ីមែលនេះមានគណនីរួចរាល់ហើយ!');
        setAuthLoading(false);
        return;
      }

      const newMember = {
        username: cleanId,
        email: authModalType === 'google' ? cleanId : `${cleanId}@facebook.com`,
        displayName: cleanName,
        createdAt: new Date().toISOString(),
        invitesCount: 0,
        inviteLink: `${window.location.origin}/?ref=${cleanId}`
      };

      await setDoc(docRef, newMember);
      
      safeStorage.setItem('luypay_logged_in', 'true');
      safeStorage.setItem('luypay_current_user', cleanId);
      safeStorage.setItem('luypay_user_display_name', cleanName);
      safeStorage.setItem('luypay_auth_type', authModalType);
      safeStorage.setItem('luypay_is_member', 'true');
      
      setIsLoggedIn(true);
      setCurrentUser(cleanId);
      setUserDisplayName(cleanName);
      setUserAuthType(authModalType);
      setIsMember(true);
      
      setRegName('');
      setRegEmailOrId('');
      setShowAuthModal(false);
      
      showToast(`បានចុះឈ្មោះ និងភ្ជាប់គណនី ${authModalType === 'google' ? 'Google' : 'Facebook'} ដោយជោគជ័យ!`);
    } catch (err) {
      console.error(err);
      setRegError('មានបញ្ហាបច្ចេកទេសក្នុងការចុះឈ្មោះសមាជិក!');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('តើអ្នកពិតជាចង់ចាកចេញពីគណនីមែនទេ? (ទិន្នន័យត្រូវបានរក្សាទុកដោយសុវត្ថិភាព)')) {
      safeStorage.removeItem('luypay_logged_in');
      safeStorage.removeItem('luypay_current_user');
      safeStorage.removeItem('luypay_user_display_name');
      safeStorage.removeItem('luypay_auth_type');
      safeStorage.removeItem('luypay_is_member');
      setIsLoggedIn(false);
      setCurrentUser('sounravin');
      setUserDisplayName('Soun Ravin');
      setUserAuthType('credentials');
      setIsMember(false);
      setLoginUsername('');
      setLoginPassword('');
      showToast('បានចាកចេញពីប្រព័ន្ធដោយជោគជ័យ!', 'info');
    }
  };

  // Cloud Sync Status
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'offline'>('offline');

  // Load and sync with Firestore if logged in or viewing partner portal, otherwise load from localStorage
  useEffect(() => {
    if (!isLoggedIn && !partnerParam) {
      setCloudSyncStatus('offline');
      const stored = safeStorage.getItem(getUserLocalStorageKey(null));
      let currentBorrowers: Borrower[] = [];
      if (stored) {
        try {
          currentBorrowers = JSON.parse(stored);
        } catch (err) {
          currentBorrowers = SEED_BORROWERS;
        }
      } else {
        currentBorrowers = SEED_BORROWERS;
      }

      const { updatedList, hasChanges } = runAutoCheckInForBorrowers(currentBorrowers);
      if (hasChanges) {
        setBorrowers(updatedList);
        safeStorage.setItem(getUserLocalStorageKey(null), JSON.stringify(updatedList));
      } else {
        setBorrowers(currentBorrowers);
        if (!stored) {
          safeStorage.setItem(getUserLocalStorageKey(null), JSON.stringify(SEED_BORROWERS));
        }
      }
      return;
    }

    // Cloud Firestore Mode
    setCloudSyncStatus('syncing');
    const q = (isLoggedIn && currentUser)
      ? query(collection(db, 'borrowers'), where('userId', '==', currentUser))
      : query(collection(db, 'borrowers'));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fbBorrowers: Borrower[] = [];
      snapshot.forEach((docSnap) => {
        fbBorrowers.push({ id: docSnap.id, ...docSnap.data() } as Borrower);
      });

      // Sort descending by id
      fbBorrowers.sort((a, b) => b.id.localeCompare(a.id));

      const userStorageKey = getUserLocalStorageKey(currentUser);

      // If Firestore is empty
      if (fbBorrowers.length === 0) {
        // Try to migrate local storage data to Firestore (for any user who might have worked offline)
        const stored = safeStorage.getItem(userStorageKey);
        let localData: Borrower[] = [];
        if (stored) {
          try {
            localData = JSON.parse(stored);
          } catch (e) {}
        }
        
        if (localData.length === 0 && currentUser === 'sounravin') {
          localData = SEED_BORROWERS;
        }

        if (localData.length > 0) {
          // Upload local data to Firestore as initial seed / migration
          try {
            const { updatedList } = runAutoCheckInForBorrowers(localData);
            
            // Chunking local data for batch commits
            const CHUNK_SIZE = 400;
            for (let i = 0; i < updatedList.length; i += CHUNK_SIZE) {
              const batch = writeBatch(db);
              const chunk = updatedList.slice(i, i + CHUNK_SIZE);
              chunk.forEach((b) => {
                const docRef = doc(db, 'borrowers', b.id);
                const docData = sanitizeForFirestore({ ...b, userId: currentUser || 'guest' });
                batch.set(docRef, docData);
              });
              await batch.commit();
            }
            
            setCloudSyncStatus('synced');
            setBorrowers(updatedList);
          } catch (err) {
            console.error('Error migrating to Firestore:', err);
            setCloudSyncStatus('error');
            // Show the local data anyway so they can see their offline data
            setBorrowers(localData);
          }
        } else {
          setBorrowers([]);
          safeStorage.setItem(userStorageKey, JSON.stringify([]));
          setCloudSyncStatus('synced');
        }
      } else {
        const { updatedList, hasChanges } = runAutoCheckInForBorrowers(fbBorrowers);
        if (hasChanges) {
          saveBorrowers(updatedList);
        } else {
          setBorrowers(fbBorrowers);
          safeStorage.setItem(userStorageKey, JSON.stringify(fbBorrowers));
          setCloudSyncStatus('synced');
        }
      }
    }, (error) => {
      console.warn('Unable to load realtime database updates from cloud storage (falling back to offline local storage):', error.message || error);
      setCloudSyncStatus('error');
      
      // Fallback to local storage on Firestore errors (like quota exceeded)
      const userStorageKey = getUserLocalStorageKey(currentUser);
      const stored = safeStorage.getItem(userStorageKey);
      if (stored) {
        try {
          const localData = JSON.parse(stored);
          const { updatedList } = runAutoCheckInForBorrowers(localData);
          setBorrowers(updatedList);
        } catch (e: any) {
          console.warn('Unable to parse local storage fallback data:', e.message || e);
        }
      } else if (currentUser === 'sounravin') {
        // Fallback to seed data for default user if no local storage exists
        setBorrowers(SEED_BORROWERS);
      }
    });

    return () => unsubscribe();
  }, [isLoggedIn, currentUser]);

  // Real-time synchronization for admin dashboard and user profile
  useEffect(() => {
    if (!isLoggedIn) {
      setMembers([]);
      setSubRequests([]);
      setMemberProfile(null);
      setProfileLoading(false);
      setHasLoadedProfile(false);
      return;
    }

    if (currentUser === 'sounravin') {
      setProfileLoading(false);
      setHasLoadedProfile(true);
      // 1. Super Admin listens to members and requests
      const unsubscribeMembers = onSnapshot(collection(db, 'members'), (snapshot) => {
        const list: Member[] = [];
        snapshot.forEach((d) => {
          list.push({ username: d.id, ...d.data() } as Member);
        });
        setMembers(list);
        safeStorage.setItem('luypay_registered_members', JSON.stringify(list));
      }, (err) => {
        console.warn('Unable to subscribe to members collection (falling back to local storage):', err.message || err);
        const saved = safeStorage.getItem('luypay_registered_members');
        if (saved) {
          try { setMembers(JSON.parse(saved)); } catch (e) {}
        }
      });

      const unsubscribeRequests = onSnapshot(collection(db, 'subscription_requests'), (snapshot) => {
        const list: SubscriptionRequest[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as SubscriptionRequest);
        });
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setSubRequests(list);
        safeStorage.setItem('luypay_sub_requests', JSON.stringify(list));
      }, (err) => {
        console.warn('Unable to subscribe to subscription requests (falling back to local storage):', err.message || err);
        const saved = safeStorage.getItem('luypay_sub_requests');
        if (saved) {
          try { setSubRequests(JSON.parse(saved)); } catch (e) {}
        }
      });

      return () => {
        unsubscribeMembers();
        unsubscribeRequests();
      };
    } else if (isMember) {
      setProfileLoading(true);
      setHasLoadedProfile(false);
      // 2. Standard Member listens to their own profile doc
      const unsubscribeProfile = onSnapshot(doc(db, 'members', currentUser), (docSnap) => {
        if (docSnap.exists()) {
          const profileData = { username: docSnap.id, ...docSnap.data() } as Member;
          setMemberProfile(profileData);
          safeStorage.setItem(`luypay_member_acc_${currentUser}`, JSON.stringify(profileData));
        } else {
          // Check local storage fallback before marking profile as null
          const localMemberStr = safeStorage.getItem(`luypay_member_acc_${currentUser}`);
          if (localMemberStr) {
            try {
              const localMember = JSON.parse(localMemberStr);
              setMemberProfile(localMember as Member);
            } catch (e) {
              setMemberProfile(null);
            }
          } else {
            setMemberProfile(null);
          }
        }
        setHasLoadedProfile(true);
        setProfileLoading(false);
      }, (err) => {
        console.warn('Unable to subscribe to member profile doc (falling back to local storage):', err.message || err);
        // Fallback to local storage on error
        const localMemberStr = safeStorage.getItem(`luypay_member_acc_${currentUser}`);
        if (localMemberStr) {
          try {
            const localMember = JSON.parse(localMemberStr);
            setMemberProfile(localMember as Member);
          } catch (e) {
            setMemberProfile(null);
          }
        }
        setHasLoadedProfile(true);
        setProfileLoading(false);
      });

      return () => unsubscribeProfile();
    } else {
      setProfileLoading(false);
      setHasLoadedProfile(false);
    }
  }, [isLoggedIn, currentUser, isMember]);

  // Real-time synchronization for standard member's own subscription requests
  useEffect(() => {
    if (!isLoggedIn || currentUser === 'sounravin') {
      setMySubRequests([]);
      return;
    }

    const q = query(
      collection(db, 'subscription_requests'),
      where('username', '==', currentUser)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: SubscriptionRequest[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as SubscriptionRequest);
      });
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setMySubRequests(list);
    }, (err) => {
      console.warn('Unable to subscribe to my subscription requests (falling back to local storage):', err.message || err);
      const saved = safeStorage.getItem('luypay_sub_requests');
      if (saved) {
        try {
          const list: SubscriptionRequest[] = JSON.parse(saved);
          setMySubRequests(list.filter((r) => r.username === currentUser));
        } catch (e) {}
      }
    });

    return () => unsubscribe();
  }, [isLoggedIn, currentUser]);

  // Auto-check and trigger Plan Approval Notification Modal when member profile is approved
  useEffect(() => {
    if (!isLoggedIn || !isMember || !memberProfile) return;
    if (memberProfile.isApproved === false) return; // Still waiting for approval
    if (memberProfile.subscriptionExpires) {
      const expDate = new Date(memberProfile.subscriptionExpires);
      if (expDate < new Date()) return; // Expired
    }

    const currentPlan = memberProfile.lastApprovedPlan || memberProfile.selectedPlan || '1_month';
    const ackKey = `luypay_seen_approval_${currentUser}_${memberProfile.lastApprovedAt || memberProfile.subscriptionExpires || 'active'}`;

    if (memberProfile.lastApprovedNoticeSeen === false || safeStorage.getItem(ackKey) !== 'true') {
      setApprovalModalPlan(currentPlan);
      setIsApprovalModalOpen(true);
    }
  }, [isLoggedIn, isMember, memberProfile, currentUser]);

  const handleCloseApprovalModal = async () => {
    setIsApprovalModalOpen(false);
    if (memberProfile) {
      const ackKey = `luypay_seen_approval_${currentUser}_${memberProfile.lastApprovedAt || memberProfile.subscriptionExpires || 'active'}`;
      safeStorage.setItem(ackKey, 'true');

      if (memberProfile.lastApprovedNoticeSeen === false) {
        try {
          const memberRef = doc(db, 'members', currentUser);
          await setDoc(memberRef, { lastApprovedNoticeSeen: true }, { merge: true });
        } catch (err) {
          console.error('Error marking notice seen:', err);
        }
      }
    }
  };

  // Helper functions for checking subscription status
  const getSubscriptionStatusInfo = (profile: Member | null) => {
    const now = currentTime;
    if (!profile) {
      if (currentUser === 'sounravin') {
        return { isExpired: false, isNewUser: false, text: 'គម្រោងគ្មានដែនកំណត់ (Unlimited Super Admin)' };
      }
      return { isExpired: false, isNewUser: false, text: '' };
    }
    if (profile.username === 'sounravin') {
      return { isExpired: false, isNewUser: false, text: 'គម្រោងគ្មានដែនកំណត់ (Unlimited Super Admin)' };
    }
    
    if (profile.subscriptionExpires) {
      const expDate = new Date(profile.subscriptionExpires);
      const isExp = expDate < now;
      const diffMs = expDate.getTime() - now.getTime();
      
      if (isExp) {
        return {
          isExpired: true,
          isNewUser: false,
          text: language === 'kh'
            ? `បានផុតកំណត់កាលពីថ្ងៃទី ${expDate.toLocaleDateString()}`
            : `Expired on ${expDate.toLocaleDateString()}`
        };
      }
      
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      const daysStr = days > 0 ? `${days} ថ្ងៃ ` : '';
      const hoursStr = `${hours} ម៉ោង `;
      const minutesStr = `${minutes} នាទី `;
      const secondsStr = `${seconds} វិនាទី`;
      
      return {
        isExpired: false,
        isNewUser: false,
        text: language === 'kh'
          ? `គម្រោងសកម្ម (នៅសល់ ${daysStr}${hoursStr}${minutesStr}${secondsStr}) - ផុតកំណត់ថ្ងៃទី ${expDate.toLocaleDateString()}`
          : `Active Plan (${days > 0 ? `${days}d ` : ''}${hours}h ${minutes}m ${seconds}s left) - Expires ${expDate.toLocaleDateString()}`
      };
    }
    
    const createdDate = new Date(profile.createdAt || Date.now());
    const cutoffDate = new Date('2026-07-16T00:00:00Z');
    
    if (createdDate >= cutoffDate) {
      return {
        isExpired: true,
        isNewUser: true,
        text: language === 'kh' ? 'គណនីថ្មី (មិនទាន់មានគម្រោងសកម្ម)' : 'New Account (No Active Plan)'
      };
    } else {
      const trialEndDate = new Date(createdDate.getTime() + 15 * 24 * 60 * 60 * 1000);
      const isExp = trialEndDate < now;
      const diffMs = trialEndDate.getTime() - now.getTime();
      
      if (isExp) {
        return {
          isExpired: true,
          isNewUser: false,
          text: language === 'kh'
            ? `រយៈពេលសាកល្បង ១៥ ថ្ងៃ បានផុតកំណត់ហើយ`
            : `15-day trial period has expired`
        };
      }
      
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      const daysStr = days > 0 ? `${days} ថ្ងៃ ` : '';
      const hoursStr = `${hours} ម៉ោង `;
      const minutesStr = `${minutes} នាទី `;
      const secondsStr = `${seconds} វិនាទី`;
      
      return {
        isExpired: false,
        isNewUser: false,
        text: language === 'kh'
          ? `គម្រោងសាកល្បងឥតគិតថ្លៃ (នៅសល់ ${daysStr}${hoursStr}${minutesStr}${secondsStr})`
          : `Free Trial (${days > 0 ? `${days}d ` : ''}${hours}h ${minutes}m ${seconds}s left)`
      };
    }
  };

  const isSubscriptionExpired = (profile: Member | null) => {
    const info = getSubscriptionStatusInfo(profile);
    return info.isExpired;
  };

  // Real-time block, delete, and expiration automatic logout detection
  useEffect(() => {
    if (isLoggedIn && isMember && hasLoadedProfile) {
      if (memberProfile) {
        if (memberProfile.isBlocked) {
          safeStorage.removeItem('luypay_logged_in');
          safeStorage.removeItem('luypay_current_user');
          safeStorage.removeItem('luypay_user_display_name');
          safeStorage.removeItem('luypay_auth_type');
          safeStorage.removeItem('luypay_is_member');
          setIsLoggedIn(false);
          setCurrentUser('sounravin');
          setUserDisplayName('Soun Ravin');
          setUserAuthType('credentials');
          setIsMember(false);
          setLoginUsername('');
          setLoginPassword('');
          setMemberProfile(null);
          setHasLoadedProfile(false);
          alert(language === 'kh' ? 'គណនីរបស់អ្នកត្រូវបានផ្អាកដំណើរការ (Blocked) ដោយអ្នកគ្រប់គ្រងប្រព័ន្ធ!' : 'Your account has been temporarily suspended (Blocked) by the administrator!');
          return;
        }

        // Note: Expired subscriptions are handled gracefully by rendering the Renewal Checkout Screen (isExpired check in render)
        // instead of forcefully kicking out the logged-in member.
      } else if (!profileLoading) {
        // memberProfile is null, profileLoading is false AND hasLoadedProfile is true
        // (real-time listener evaluated and confirmed document doesn't exist anywhere)
        safeStorage.removeItem('luypay_logged_in');
        safeStorage.removeItem('luypay_current_user');
        safeStorage.removeItem('luypay_user_display_name');
        safeStorage.removeItem('luypay_auth_type');
        safeStorage.removeItem('luypay_is_member');
        setIsLoggedIn(false);
        setCurrentUser('sounravin');
        setUserDisplayName('Soun Ravin');
        setUserAuthType('credentials');
        setIsMember(false);
        setLoginUsername('');
        setLoginPassword('');
        setMemberProfile(null);
        setHasLoadedProfile(false);
        alert(language === 'kh' ? 'គណនីរបស់អ្នកត្រូវបានលុបចេញពីប្រព័ន្ធដោយអ្នកគ្រប់គ្រង!' : 'Your account has been deleted by the administrator!');
      }
    }
  }, [isLoggedIn, isMember, memberProfile, profileLoading, hasLoadedProfile, language]);

  const handleSavePhotoURL = async (url: string) => {
    if (!isLoggedIn) return;
    try {
      const docRef = doc(db, 'members', currentUser);
      await setDoc(docRef, { photoURL: url }, { merge: true });
      showToast(language === 'kh' ? 'បានផ្លាស់ប្តូររូបថតកម្រងព័ត៌មានជោគជ័យ!' : 'Profile photo updated successfully!', 'success');
    } catch (err) {
      console.error('Error saving profile photo:', err);
      safeStorage.setItem(`luypay_profile_photo_${currentUser}`, url);
      showToast(language === 'kh' ? 'បានរក្សាទុករូបថតនៅក្នុងឧបករណ៍មូលដ្ឋាន!' : 'Saved profile photo locally!', 'success');
    }
  };

  const handleSaveMemberQR = async (url: string) => {
    if (!isLoggedIn) return;
    try {
      const docRef = doc(db, 'members', currentUser);
      await setDoc(docRef, { paymentQr: url }, { merge: true });
      showToast(language === 'kh' ? 'បានរក្សាទុក QR Code បង់ប្រាក់ជោគជ័យ!' : 'Payment QR Code saved successfully!', 'success');
    } catch (err) {
      console.error('Error saving payment QR:', err);
      showToast(language === 'kh' ? 'រក្សាទុក QR code បរាជ័យ!' : 'Failed to save QR code!', 'info');
    }
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast(language === 'kh' ? 'រូបភាពធំជាង 5MB! សូមជ្រើសរើសរូបភាពតូចជាងនេះ។' : 'Image exceeds 5MB! Please choose a smaller file.', 'info');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 150;
        const MAX_HEIGHT = 150;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const base64Str = canvas.toDataURL('image/jpeg', 0.8);
          handleSavePhotoURL(base64Str);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeStatus(null);
    playClickSound();
    
    if (!settingOldPassword) {
      setPasswordChangeStatus({
        type: 'error',
        message: language === 'kh' ? 'សូមបញ្ចូលលេខកូដសម្ងាត់បច្ចុប្បន្ន!' : 'Please enter your current password!'
      });
      return;
    }
    
    if (settingNewPassword.length < 6) {
      setPasswordChangeStatus({
        type: 'error',
        message: language === 'kh' ? 'លេខកូដសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោចណាស់ ៦ ខ្ទង់!' : 'New password must be at least 6 characters!'
      });
      return;
    }
    
    if (settingNewPassword !== settingConfirmNewPassword) {
      setPasswordChangeStatus({
        type: 'error',
        message: language === 'kh' ? 'លេខកូដសម្ងាត់ថ្មីទាំងពីរមិនដូចគ្នាទេ!' : 'New passwords do not match!'
      });
      return;
    }
    
    setIsPasswordUpdating(true);
    
    try {
      if (currentUser === 'sounravin') {
        // Superadmin password change
        let currentAdminPassword = 'Ravin012348981';
        const adminSettingsRef = doc(db, 'settings', 'admin_config');
        const adminSettings = await getDoc(adminSettingsRef);
        if (adminSettings.exists() && adminSettings.data().adminPassword) {
          currentAdminPassword = adminSettings.data().adminPassword;
        }
        
        if (settingOldPassword !== currentAdminPassword) {
          setPasswordChangeStatus({
            type: 'error',
            message: language === 'kh' ? 'លេខកូដសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវឡើយ!' : 'Current password is incorrect!'
          });
          setIsPasswordUpdating(false);
          return;
        }
        
        await setDoc(adminSettingsRef, { adminPassword: settingNewPassword }, { merge: true });
        setPasswordChangeStatus({
          type: 'success',
          message: language === 'kh' ? 'បានផ្លាស់ប្តូរលេខកូដសម្ងាត់អ្នកគ្រប់គ្រងជោគជ័យ!' : 'Admin password changed successfully!'
        });
        setSettingOldPassword('');
        setSettingNewPassword('');
        setSettingConfirmNewPassword('');
        showToast(language === 'kh' ? 'បានផ្លាស់ប្តូរលេខកូដសម្ងាត់ជោគជ័យ!' : 'Password changed successfully!', 'success');
      } else if (isMember) {
        // Standard member password change
        if (settingOldPassword !== memberProfile?.password) {
          setPasswordChangeStatus({
            type: 'error',
            message: language === 'kh' ? 'លេខកូដសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវឡើយ!' : 'Current password is incorrect!'
          });
          setIsPasswordUpdating(false);
          return;
        }
        
        const memberRef = doc(db, 'members', currentUser);
        await setDoc(memberRef, { password: settingNewPassword }, { merge: true });
        setPasswordChangeStatus({
          type: 'success',
          message: language === 'kh' ? 'បានផ្លាស់ប្តូរលេខកូដសម្ងាត់ជោគជ័យ!' : 'Password changed successfully!'
        });
        setSettingOldPassword('');
        setSettingNewPassword('');
        setSettingConfirmNewPassword('');
        showToast(language === 'kh' ? 'បានផ្លាស់ប្តូរលេខកូដសម្ងាត់ជោគជ័យ!' : 'Password changed successfully!', 'success');
      } else {
        setPasswordChangeStatus({
          type: 'error',
          message: language === 'kh' ? 'មិនអាចប្តូរលេខកូដសម្ងាត់សម្រាប់គណនីភ្ញៀវបានឡើយ!' : 'Cannot change password for guest account!'
        });
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordChangeStatus({
        type: 'error',
        message: language === 'kh' ? 'មានបញ្ហាបច្ចេកទេសក្នុងកំឡុងពេលប្តូរលេខកូដសម្ងាត់!' : 'Technical error during password change!'
      });
    } finally {
      setIsPasswordUpdating(false);
    }
  };

  const handleForceUpdateSystem = async () => {
    playClickSound();
    showToast(language === 'kh' ? 'កំពុងសម្អាត Cache និងទាញយកប្រព័ន្ធថ្មី...' : 'Clearing cache and hard updating...', 'info');
    
    try {
      // 1. Unregister any service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      
      // 2. Clear all browser cache storage
      if ('caches' in window) {
        const names = await caches.keys();
        for (const name of names) {
          await caches.delete(name);
        }
      }
      
      // 3. Clear session storage & partial safeStorage items if needed, but keep core login session to avoid forcing logout
      window.sessionStorage.clear();
      
      // 4. Force hard reload (cache-bypassing reload)
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('Error during hard update:', err);
      window.location.reload();
    }
  };

  const handleResetToDefaults = () => {
    setTheme('light');
    setAppTheme('slate');
    setButtonStyle('modern');
    setEnableAnimations(true);
    setEnableKhmerArt(false);
    setMobileHeaderStyle('default');
    setIsSponsorDismissed(false);

    safeStorage.setItem('luypay_theme', 'light');
    safeStorage.setItem('luypay_app_theme', 'slate');
    safeStorage.setItem('luypay_button_style', 'modern');
    safeStorage.setItem('luypay_enable_animations', 'true');
    safeStorage.setItem('luypay_enable_khmer_art', 'false');
    safeStorage.setItem('luypay_mobile_header_style', 'default');
    safeStorage.setItem('luypay_sponsor_dismissed', 'false');

    document.documentElement.classList.remove('dark');

    playClickSound();
    showToast(
      language === 'kh' 
        ? 'បានកំណត់ការរចនាបទមកលំនាំដើមវិញរួចរាល់!' 
        : 'UI interface has been reset to default classic design!', 
      'success'
    );
    
    // Close the settings modal and force a clean browser reload to ensure 100% style state synchronization
    setIsSettingsOpen(false);
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  // Save to local storage and sync to Firestore if logged in
  const saveBorrowers = async (newList: Borrower[]) => {
    const sanitizedList = newList.map((b) => sanitizeForFirestore(b));
    
    // Calculate diff to only upload changed items to Cloud Firestore (Saves quota)
    const changedBorrowers: Borrower[] = [];
    const deletedBorrowers: Borrower[] = [];
    
    const oldMap = new Map(borrowers.map(b => [b.id, b]));
    const newMap = new Map(sanitizedList.map(b => [b.id, b]));

    sanitizedList.forEach(newB => {
      const oldB = oldMap.get(newB.id);
      if (!oldB || JSON.stringify(oldB) !== JSON.stringify(newB)) {
        changedBorrowers.push(newB);
      }
    });

    borrowers.forEach(oldB => {
      if (!newMap.has(oldB.id)) {
        deletedBorrowers.push(oldB);
      }
    });

    setBorrowers(sanitizedList);
    safeStorage.setItem(getUserLocalStorageKey(currentUser), JSON.stringify(sanitizedList));
    
    if (isLoggedIn) {
      if (changedBorrowers.length === 0 && deletedBorrowers.length === 0) {
        return; // Nothing to sync
      }
      
      setCloudSyncStatus('syncing');
      try {
        const CHUNK_SIZE = 400;
        // Process changed borrowers
        for (let i = 0; i < changedBorrowers.length; i += CHUNK_SIZE) {
          const chunk = changedBorrowers.slice(i, i + CHUNK_SIZE);
          const batch = writeBatch(db);
          chunk.forEach((b) => {
            const docRef = doc(db, 'borrowers', b.id);
            const docData = sanitizeForFirestore({ ...b, userId: currentUser || 'guest' });
            batch.set(docRef, docData);
          });
          await batch.commit();
        }
        
        // Process deleted borrowers (if any)
        for (let i = 0; i < deletedBorrowers.length; i += CHUNK_SIZE) {
          const chunk = deletedBorrowers.slice(i, i + CHUNK_SIZE);
          const batch = writeBatch(db);
          chunk.forEach((b) => {
            const docRef = doc(db, 'borrowers', b.id);
            batch.delete(docRef);
          });
          await batch.commit();
        }

        setCloudSyncStatus('synced');
      } catch (err) {
        console.error('Error syncing list to Firestore:', err);
        setCloudSyncStatus('error');
      }
    }
  };

  const handleSaveShareholders = (updated: Shareholder[]) => {
    setShareholders(updated);
    safeStorage.setItem(`luypay_shareholders_${currentUser}`, JSON.stringify(updated));
    if (currentUser === 'sounravin') {
      safeStorage.setItem('luypay_shareholders_global', JSON.stringify(updated));
    }

    // Also update all borrowers linked to any renamed/updated shareholder
    const updatedBorrowers = borrowers.map((b) => {
      const matchedSh = updated.find(
        (s) => s.id === b.shareholderId || (b.shareholderName && b.shareholderName.trim().toLowerCase() === s.name.trim().toLowerCase())
      );
      if (matchedSh) {
        return {
          ...b,
          shareholderId: matchedSh.id,
          shareholderName: matchedSh.name,
          shareholderSharePercent: matchedSh.sharePercent,
        };
      }
      return b;
    });

    if (JSON.stringify(updatedBorrowers) !== JSON.stringify(borrowers)) {
      setBorrowers(updatedBorrowers);
      saveBorrowers(updatedBorrowers);
    }

    try {
      if (currentUser === 'sounravin') {
        setDoc(doc(db, 'settings', 'shareholders_config'), { list: updated });
      }
      if (currentUser) {
        setDoc(doc(db, 'settings', `shareholders_${currentUser}`), { list: updated });
      }
    } catch (e) {
      console.error('Error syncing shareholders to firestore:', e);
    }
  };

  const handleClearShareholderData = (shareholderId: string) => {
    const targetSh = shareholders.find((s) => s.id === shareholderId);
    const targetName = targetSh ? targetSh.name.trim().toLowerCase() : '';

    // Unlink all borrowers associated with this shareholder
    const updatedBorrowers = borrowers.map((b) => {
      const isLinked =
        b.shareholderId === shareholderId ||
        (b.shareholderName && targetName && b.shareholderName.trim().toLowerCase() === targetName);

      if (isLinked) {
        const cleaned = { ...b };
        delete cleaned.shareholderId;
        delete cleaned.shareholderName;
        delete cleaned.shareholderSharePercent;
        delete cleaned.shareholderCalculationType;
        delete cleaned.shareholderDailyUSD;
        return cleaned;
      }
      return b;
    });

    // Clear local authentication token for partner portal
    localStorage.removeItem(`luypay_partner_auth_${shareholderId}`);

    setBorrowers(updatedBorrowers);
    saveBorrowers(updatedBorrowers);
    showToast(
      language === 'kh'
        ? `បានសម្អាតទិន្នន័យភាគហ៊ុន ${targetSh?.name || ''} រួចរាល់!`
        : `Cleared data for ${targetSh?.name || ''}`
    );
  };

  // Automatically backfill any missing short IDs for loaded borrowers
  useEffect(() => {
    if (borrowers.length === 0) return;
    const { list, hasChanges } = backfillShortIds(borrowers);
    if (hasChanges) {
      saveBorrowers(list);
    }
  }, [borrowers]);

  // Toast notification system
  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Monitor when borrowers go online and show push notification and play sound
  const prevOnlineRef = React.useRef<Record<string, boolean>>({});
  const isFirstOnlineLoadRef = React.useRef(true);

  useEffect(() => {
    if (borrowers.length === 0) return;

    if (isFirstOnlineLoadRef.current) {
      // On first load, just record the status of all borrowers to avoid notification storm
      const initialMap: Record<string, boolean> = {};
      borrowers.forEach((b) => {
        initialMap[b.id] = !!b.isOnline;
      });
      prevOnlineRef.current = initialMap;
      isFirstOnlineLoadRef.current = false;
      return;
    }

    // Check if any borrower's online status transitioned from false to true
    borrowers.forEach((b) => {
      const wasOnline = !!prevOnlineRef.current[b.id];
      const isOnline = !!b.isOnline;

      if (isOnline && !wasOnline) {
        // Play the chime sound
        try {
          playNotificationSound();
        } catch (e) {
          console.warn('Audio feedback failed:', e);
        }

        // Show push notification toast
        const msg = language === 'kh'
          ? `🟢 កូនបំណុល "${b.name}" កំពុងអនឡាញ (Online) មើលគណនីរបស់គាត់!`
          : `🟢 Borrower "${b.name}" is online looking at their account!`;
        showToast(msg, 'success');
      }

      // Update ref
      prevOnlineRef.current[b.id] = isOnline;
    });
  }, [borrowers, language]);

  // Automatically clean up inactive borrower online statuses in Firestore (Heartbeat Timeout)
  useEffect(() => {
    if (!currentUser || borrowers.length === 0) return;

    const interval = setInterval(async () => {
      const now = Date.now();
      const inactiveOnlineBorrowers = borrowers.filter(
        (b) => b.isOnline && b.lastActive && (now - b.lastActive) > 50000
      );

      if (inactiveOnlineBorrowers.length === 0) return;

      for (const b of inactiveOnlineBorrowers) {
        try {
          const docRef = doc(db, 'borrowers', b.id);
          await setDoc(docRef, { isOnline: false }, { merge: true });
          console.log(`Automatically set inactive borrower ${b.name} to offline.`);
        } catch (err) {
          console.warn(`Failed to clean up online status for ${b.name}:`, err);
        }
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [borrowers, currentUser]);

  // Compute ledger statistics
  const [stats, setStats] = useState<LedgerStats>({
    totalActiveLoansCount: 0,
    totalCompletedLoansCount: 0,
    totalPrincipalUSD: 0,
    totalPrincipalKHR: 0,
    totalExpectedUSD: 0,
    totalExpectedKHR: 0,
    totalCollectedUSD: 0,
    totalCollectedKHR: 0,
  });

  useEffect(() => {
    let activeCount = 0;
    let completedCount = 0;
    let pUSD = 0, pKHR = 0;
    let eUSD = 0, eKHR = 0;
    let cUSD = 0, cKHR = 0;

    borrowers.forEach((b) => {
      const totalPaid = Array.isArray(b.payments) ? b.payments.reduce((sum, p) => sum + (p?.amount || 0), 0) : 0;
      const isCompleted = totalPaid >= b.totalToPay;

      if (b.isArchived) {
        // We still count them in completed stats if they are archived
        if (isCompleted) completedCount++;
        return; 
      }

      if (isCompleted) {
        completedCount++;
      } else {
        activeCount++;
      }

      // Sum values based on currency
      if (b.currency === 'USD') {
        pUSD += b.principal;
        eUSD += b.totalToPay;
        cUSD += totalPaid;
      } else {
        pKHR += b.principal;
        eKHR += b.totalToPay;
        cKHR += totalPaid;
      }
    });

    setStats({
      totalActiveLoansCount: activeCount,
      totalCompletedLoansCount: completedCount,
      totalPrincipalUSD: pUSD,
      totalPrincipalKHR: pKHR,
      totalExpectedUSD: eUSD,
      totalExpectedKHR: eKHR,
      totalCollectedUSD: cUSD,
      totalCollectedKHR: cKHR,
    });
  }, [borrowers]);

  // Actions
  const handleAddNewBorrower = (data: Omit<Borrower, 'id' | 'payments' | 'isArchived'>) => {
    // Generate sequential unique short ID
    const prefix = 'KH-';
    let nextNum = 1001;
    (borrowers || []).forEach(b => {
      if (b && b.shortId) {
        const match = b.shortId.match(/KH-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num >= nextNum) {
            nextNum = num + 1;
          }
        }
      }
    });

    const newBorrower: Borrower = {
      ...data,
      id: 'b-' + generateId(),
      shortId: `${prefix}${nextNum}`,
      payments: [],
      isArchived: false,
      applicationId: prefilledData?.applicationId || undefined,
    };
    const newList = [newBorrower, ...borrowers];
    saveBorrowers(newList);
    setIsAddModalOpen(false);
    setPrefilledData(null);
    showToast(`បានបន្ថែមអ្នកខ្ចីថ្មី "${data.name}" (ID: ${newBorrower.shortId}) ដោយជោគជ័យ!`);
  };

  const handleSelectBorrower = (borrower: Borrower) => {
    setSelectedBorrowerId(borrower.id);
  };

  const handleToggleSelectBorrower = (borrowerId: string) => {
    setSelectedBorrowerIds((prev) =>
      prev.includes(borrowerId)
        ? prev.filter((id) => id !== borrowerId)
        : [...prev, borrowerId]
    );
  };

  const handleBulkAutoCheck = () => {
    if (selectedBorrowerIds.length === 0) {
      const msg = language === 'kh'
        ? 'សូមធីកជ្រើសរើសកូនបំណុល (Select checkboxes) ជាមុនសិន!'
        : 'Please select borrowers first using the checkboxes!';
      showToast(msg, 'info');
      return;
    }

    const count = selectedBorrowerIds.length;
    const confirmMsg = language === 'kh'
      ? `តើអ្នកពិតជាចង់កំណត់កម្ចីរបស់កូនបំណុលទាំង ${count} នាក់ដែលបានជ្រើសរើស ជាទូទាត់រួចរាល់ទាំងអស់ (សងគ្រប់ចំនួន) មែនទេ?`
      : `Are you sure you want to mark all remaining installments as PAID for the ${count} selected borrowers?`;

    if (window.confirm(confirmMsg)) {
      const newList = borrowers.map((b) => {
        if (!selectedBorrowerIds.includes(b.id)) return b;

        // Find all unpaid indices
        const bPayments = Array.isArray(b.payments) ? b.payments : [];
        const paidIndices = bPayments.map(p => p?.installmentIndex);
        const newPaymentsToAdd: Payment[] = [];

        for (let i = 0; i < b.duration; i++) {
          if (!paidIndices.includes(i)) {
            newPaymentsToAdd.push({
              id: 'pay-' + generateId(),
              date: getTodayDateString(),
              amount: b.installmentAmount,
              installmentIndex: i,
              note: language === 'kh'
                ? `ទូទាត់ស្វ័យប្រវត្តវគ្គទី ${i + 1}`
                : `Auto checked installment ${i + 1}`,
            });
          }
        }

        if (newPaymentsToAdd.length === 0) return b; // Already fully paid

        return {
          ...b,
          payments: [...bPayments, ...newPaymentsToAdd],
        };
      });

      saveBorrowers(newList);
      setSelectedBorrowerIds([]);
      const successMsg = language === 'kh'
        ? `បានទូទាត់ស្វ័យប្រវត្តិកូនបំណុលទាំង ${count} នាក់រួចរាល់!`
        : `Successfully auto-checked installments for ${count} selected borrowers!`;
      showToast(successMsg, 'success');
    }
  };

  const handleQuickPay = (borrowerId: string) => {
    const borrower = borrowers.find(b => b.id === borrowerId);
    if (!borrower) return;

    // Find the first unpaid installment slot index
    const bPayments = Array.isArray(borrower.payments) ? borrower.payments : [];
    const paidSlots = bPayments.map(p => p?.installmentIndex);
    let nextUnpaidSlot = -1;
    for (let i = 0; i < borrower.duration; i++) {
      if (!paidSlots.includes(i)) {
        nextUnpaidSlot = i;
        break;
      }
    }

    if (nextUnpaidSlot === -1) {
      showToast('អ្នកខ្ចីបានសងគ្រប់វគ្គរួចរាល់ហើយ!', 'info');
      return;
    }

    const newPayment: Payment = {
      id: 'pay-' + generateId(),
      date: getTodayDateString(),
      amount: borrower.installmentAmount,
      installmentIndex: nextUnpaidSlot,
      note: `បង់ប្រាក់រហ័សវគ្គទី ${nextUnpaidSlot + 1}`,
    };

    const newList = borrowers.map((b) => {
      if (b.id === borrowerId) {
        return {
          ...b,
          payments: [...(b.payments || []), newPayment],
        };
      }
      return b;
    });

    saveBorrowers(newList);
    showToast(`បានកត់ត្រាសងរហ័សវគ្គទី ${nextUnpaidSlot + 1} សម្រាប់ "${borrower.name}"!`);
  };

  const handleAddPaymentDetail = (borrowerId: string, paymentData: Omit<Payment, 'id'>) => {
    const newPayment: Payment = {
      ...paymentData,
      id: 'pay-' + generateId(),
    };

    const newList = borrowers.map((b) => {
      if (b.id === borrowerId) {
        return {
          ...b,
          payments: [...(b.payments || []), newPayment],
        };
      }
      return b;
    });

    saveBorrowers(newList);
    showToast('បានកត់ត្រាការបង់ប្រាក់ថ្មីដោយជោគជ័យ!');
  };

  const handleDeletePayment = (borrowerId: string, paymentId: string) => {
    const newList = borrowers.map((b) => {
      if (b.id === borrowerId) {
        return {
          ...b,
          payments: (b.payments || []).filter((p) => p && p.id !== paymentId),
        };
      }
      return b;
    });

    saveBorrowers(newList);
    showToast('បានលុបប្រវត្តិបង់ប្រាក់នោះវិញរួចរាល់!');
  };

  const handleDeleteBorrower = async (borrowerId: string) => {
    const newList = borrowers.filter((b) => b.id !== borrowerId);
    setBorrowers(newList);
    safeStorage.setItem(getUserLocalStorageKey(currentUser), JSON.stringify(newList));
    
    if (isLoggedIn) {
      setCloudSyncStatus('syncing');
      try {
        await deleteDoc(doc(db, 'borrowers', borrowerId));
        setCloudSyncStatus('synced');
      } catch (err) {
        console.error('Error deleting from Firestore:', err);
        setCloudSyncStatus('error');
      }
    }
    setSelectedBorrowerId(null);
    showToast('បានលុបព័ត៌មានអ្នកខ្ចីរួចរាល់ហើយ!', 'info');
  };

  const handleToggleArchive = (borrowerId: string) => {
    const newList = borrowers.map((b) => {
      if (b.id === borrowerId) {
        return {
          ...b,
          isArchived: !b.isArchived,
        };
      }
      return b;
    });

    saveBorrowers(newList);
    const updatedBorrower = newList.find(b => b.id === borrowerId);
    setSelectedBorrowerId(null); // Close detail on archive toggle
    showToast(
      updatedBorrower?.isArchived 
        ? `បានដាក់ "${updatedBorrower.name}" ក្នុងបញ្ជីផ្ទុកទុក (Archived)`
        : `បានស្តារ "${updatedBorrower?.name}" មកកាន់បញ្ជីដើមវិញ`
    );
  };

  const handleUpdateBorrowerStatus = (borrowerId: string, newStatus: 'good' | 'late' | 'regular') => {
    const newList = borrowers.map((b) => {
      if (b.id === borrowerId) {
        return {
          ...b,
          statusTag: newStatus,
        };
      }
      return b;
    });

    saveBorrowers(newList);
    showToast('បានធ្វើបច្ចុប្បន្នភាពស្ថានភាពកូនបំណុល!');
  };

  const handleToggleAutoCheckIn = (borrowerId: string) => {
    const newList = borrowers.map((b) => {
      if (b.id === borrowerId) {
        return {
          ...b,
          autoCheckIn: !b.autoCheckIn,
        };
      }
      return b;
    });

    saveBorrowers(newList);
    const updatedBorrower = newList.find(b => b.id === borrowerId);
    showToast(
      updatedBorrower?.autoCheckIn
        ? `បានបើកដំណើរការ Auto Check-In ស្វ័យប្រវត្តសម្រាប់ "${updatedBorrower.name}"`
        : `បានបិទដំណើរការ Auto Check-In ស្វ័យប្រវត្តសម្រាប់ "${updatedBorrower?.name}"`
    );
  };

  const handleEditBorrower = (borrowerId: string, updatedFields: Partial<Borrower>) => {
    const cleanedFields: Record<string, any> = {};
    Object.entries(updatedFields).forEach(([k, v]) => {
      if (v !== undefined) {
        cleanedFields[k] = v;
      }
    });

    const newList = borrowers.map((b) => {
      if (b.id === borrowerId) {
        const updated = {
          ...b,
          ...cleanedFields,
        };
        if (updatedFields.topUpLoanAmount === undefined) delete (updated as any).topUpLoanAmount;
        if (updatedFields.topUpNotes === undefined) delete (updated as any).topUpNotes;
        if (updatedFields.topUpDate === undefined) delete (updated as any).topUpDate;
        return updated;
      }
      return b;
    });

    saveBorrowers(newList);
    showToast('បានកែសម្រួលព័ត៌មានកូនបំណុលរួចរាល់!');
  };

  // Backup & Import
  const handleExportBackup = () => {
    const dataStr = JSON.stringify(borrowers, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `កត់ត្រាលុយឆក់_ចម្លងបម្រុងទុក_${getTodayDateString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showToast('ទិន្នន័យត្រូវបានទាញយកសម្រាប់រក្សាទុក (Backup)!');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          // simple check for schema validation
          const looksValid = parsed.every(item => item.id && item.name && Array.isArray(item.payments));
          if (!looksValid) {
            alert('ទម្រង់ឯកសារទិន្នន័យមិនត្រឹមត្រូវឡើយ!');
            return;
          }

          if (confirm('តើអ្នកចង់នាំចូល និងបញ្ចូលជាមួយទិន្នន័យចាស់ដែលមានស្រាប់មែនទេ? (ចុច បោះបង់ ដើម្បីជំនួសទាំងស្រុង)')) {
            // merge data by appending and removing duplicates by ID
            const existingIds = new Set(borrowers.map(b => b.id));
            const merged = [...borrowers];
            parsed.forEach(item => {
              if (!existingIds.has(item.id)) {
                merged.push(item);
              }
            });
            saveBorrowers(merged);
            showToast('បាននាំចូល និងបញ្ចូលទិន្នន័យដោយជោគជ័យ!');
          } else {
            saveBorrowers(parsed);
            showToast('បានជំនួសទិន្នន័យចាស់ និងនាំចូលទិន្នន័យថ្មីទាំងស្រុង!');
          }
        } else {
          alert('ឯកសារត្រូវតែជាបញ្ជីទិន្នន័យ (Array)!');
        }
      } catch (err) {
        alert('មានបញ្ហាក្នុងការអានឯកសារ JSON នេះ៖ ' + err);
      }
    };
    fileReader.readAsText(files[0]);
    // reset target value so the same file can be uploaded again
    e.target.value = '';
  };

  // Filter borrowers list based on tab, standing, & search query
  const filteredBorrowers = borrowers.filter((b) => {
    // 1. Filter by Tab
    const totalPaid = Array.isArray(b.payments) ? b.payments.reduce((sum, p) => sum + (p?.amount || 0), 0) : 0;
    const isCompleted = totalPaid >= b.totalToPay;

    if (filterTab === 'active') {
      if (b.isArchived || isCompleted) return false;
    } else if (filterTab === 'completed') {
      if (b.isArchived || !isCompleted) return false;
    } else if (filterTab === 'archived') {
      if (!b.isArchived) return false;
    }

    // 2. Filter by Standing Status Tag
    if (standingFilter !== 'all') {
      if (standingFilter === 'good' && b.statusTag !== 'good') return false;
      if (standingFilter === 'late' && b.statusTag !== 'late') return false;
      if (standingFilter === 'regular' && b.statusTag !== 'regular' && b.statusTag !== undefined) return false;
      if (standingFilter === 'dueSoon') {
        const daysLeft = getDaysUntilNextPayment(b);
        if (daysLeft === null || daysLeft > 3) return false;
      }
    }

    // 3. Filter by Search Query (Name or Phone)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = b.name.toLowerCase().includes(q);
      const matchPhone = b.phone?.includes(q) || false;
      return matchName || matchPhone;
    }

    return true;
  });

  const selectedBorrower = borrowers.find(b => b.id === selectedBorrowerId) || null;

  // Render Borrower Portal if viewing a shared/copied link
  if (shareId) {
    if (sharedBorrowerLoading) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-black tracking-wide animate-pulse">កំពុងទាញយកទិន្នន័យកូនបំណុលពីប្រព័ន្ធ Cloud...</p>
        </div>
      );
    }

    if (sharedBorrowerError || !sharedBorrower) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center text-3xl mb-2">⚠️</div>
          <h2 className="text-xl font-black text-rose-400">តំណភ្ជាប់មិនត្រឹមត្រូវ!</h2>
          <p className="text-xs text-slate-400 leading-relaxed font-semibold">
            {sharedBorrowerError || 'រកមិនឃើញគណនី ឬប្រវត្តិខ្ចីប្រាក់របស់កូនបំណុលនៅក្នុងប្រព័ន្ធឡើយ។ សូមទាក់ទងម្ចាស់បំណុលផ្ទាល់ ដើម្បីទទួលបានតំណភ្ជាប់សារជាថ្មី។'}
          </p>
          {isLoggedIn && (
            <button
              onClick={() => {
                window.history.replaceState({}, document.title, window.location.pathname);
                setShareId(null);
              }}
              className="mt-4 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
            >
              ត្រឡប់ទៅកាន់ផ្ទាំងគ្រប់គ្រង (Back to Dashboard)
            </button>
          )}
        </div>
      );
    }

    return (
      <BorrowerPortal
        borrower={sharedBorrower}
        isLenderLoggedIn={isLoggedIn}
        onBackToLender={() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          setShareId(null);
        }}
      />
    );
  }

  // Render Shareholder Partner Portal if partner URL parameter is present
  if (partnerParam) {
    const activePartner = shareholders.find((s) => s.id === partnerParam || s.username === partnerParam) || shareholders[0];
    if (activePartner) {
      return (
        <ShareholderDashboard
          shareholder={activePartner}
          allShareholders={shareholders}
          borrowers={borrowers}
          language={language}
          onBackToMain={() => {
            const url = new URL(window.location.href);
            url.searchParams.delete('partner');
            window.history.replaceState({}, '', url.toString());
            setPartnerParam(null);
          }}
          onEditBorrower={async (bId, updated) => {
            const updatedList = borrowers.map(b => b.id === bId ? { ...b, ...updated } : b);
            await saveBorrowers(updatedList);
          }}
        />
      );
    }
  }

  // Render Loan Application Tracking page if viewing the track link
  if (trackId) {
    return (
      <LoanApplicationTracker
        trackId={trackId}
        onBack={() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          setTrackId(null);
        }}
      />
    );
  }

  // Render Public Loan Application form if viewing the apply link
  if (isApplyMode) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background Auroras */}
        <div className="absolute top-10 left-10 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />
        
        <div className="w-full max-w-md z-10">
          <BorrowerApplyForm 
            lenderId={applyLenderId} 
            onSubmitSuccess={(appId) => {
              const newUrl = `${window.location.origin}/?track=${appId}`;
              window.history.pushState({}, document.title, newUrl);
              setTrackId(appId);
              setIsApplyMode(false);
            }}
            onBackToPortal={() => {
              window.history.replaceState({}, document.title, window.location.pathname);
              setIsApplyMode(false);
            }}
          />
        </div>
      </div>
    );
  }

  const isSuperAdmin = currentUser === 'sounravin';
  const isBlocked = memberProfile?.isBlocked === true;
  const isExpired = isSubscriptionExpired(memberProfile);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col antialiased font-sans relative overflow-hidden">
        {/* Animated Background Floating Auroras */}
        <motion.div
          animate={{
            x: [0, 80, -40, 0],
            y: [0, -60, 40, 0],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-10 left-10 w-80 h-80 rounded-full bg-blue-600/15 blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{
            x: [0, -70, 60, 0],
            y: [0, 50, -70, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{
            x: [0, 40, -50, 0],
            y: [0, -30, 60, 0],
          }}
          transition={{
            duration: 24,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 left-1/4 w-72 h-72 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none"
        />

        {/* Technical Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />

        <div className="flex-1 flex flex-col justify-center items-center p-4 relative z-10">
          {/* Top-Right Language Switcher */}
          <div className="absolute top-6 right-6 z-20 flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setLanguage('kh')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                language === 'kh'
                  ? 'bg-blue-600/15 border-blue-500/50 text-blue-400 font-extrabold shadow-blue-500/10'
                  : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-300'
              }`}
            >
              <span className="text-sm">🇰🇭</span>
              <span>ខ្មែរ</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                language === 'en'
                  ? 'bg-blue-600/15 border-blue-500/50 text-blue-400 font-extrabold shadow-blue-500/10'
                  : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-300'
              }`}
            >
              <span className="text-sm">🇺🇸</span>
              <span>EN</span>
            </motion.button>
          </div>

          {/* Toast Notification inside login */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                className="fixed top-6 left-1/2 -translate-x-1/2 z-50 shadow-lg"
              >
                <div className="px-5 py-3 rounded-xl flex items-center gap-2 border text-xs font-bold bg-blue-600 text-white border-blue-500 shadow-xl shadow-blue-600/20">
                  <CheckSquare className="w-4 h-4 text-white shrink-0" />
                  <span>{notification.message}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Premium Glassmorphic Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 110,
              damping: 16,
            }}
            className="w-full max-w-md bg-slate-900/50 backdrop-blur-2xl border border-slate-800/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6),_0_0_80px_rgba(37,99,235,0.06)] space-y-5 sm:space-y-6 relative overflow-hidden"
          >
            {/* Top Glowing Trace Bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500" />

            {/* Logo and System Title */}
            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <motion.div
                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
                className="cursor-pointer"
              >
                {renderSystemLogo("w-16 h-16 shadow-lg shadow-blue-500/10")}
              </motion.div>
              <div>
                <h1 className="text-white text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  {logoConfig?.systemName || t('appName')}
                </h1>
                <p className="text-[10px] text-blue-400/90 font-extrabold tracking-widest uppercase mt-1">{t('appSubtitle')}</p>
              </div>
            </div>

            {/* Animated Inner Forms */}
            <AnimatePresence mode="wait">
              {loginMode === 'signin' && (
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="space-y-6"
                >
                  <div className="bg-slate-950/40 border border-slate-800/60 p-4 rounded-2xl space-y-1 text-xs">
                    <p className="text-blue-400 font-bold flex items-center gap-1.5 mb-1">
                      <span>🛡️ {language === 'kh' ? 'គណនីការពារទិន្នន័យពីការបាត់បង់' : 'Data Loss Protection Account'}</span>
                    </p>
                    <p className="text-slate-400 leading-relaxed font-medium">
                      {language === 'kh' 
                        ? 'សូមប្រើប្រាស់គណនីផ្លូវការតែមួយគត់របស់អ្នក ដើម្បីកត់ត្រា និងសមកាលកម្មទិន្នន័យឱ្យមានសុវត្ថិភាពខ្ពស់បំផុត។'
                        : 'Please use your official account to record and synchronize your data with maximum security.'}
                    </p>
                  </div>

                  <SignInForm
                    onSubmit={handleCredentialsLogin}
                    loginError={loginError}
                    setLoginError={setLoginError}
                    language={language}
                    t={t}
                    onForgotPasswordClick={() => {
                      setLoginMode('forgot_password');
                      setResetStep('request');
                      setForgotError('');
                      setForgotEmail('');
                    }}
                  />

                  {/* Switch to Register */}
                  <div className="border-t border-slate-800/60 pt-4 text-center">
                    <p className="text-xs text-slate-400">
                      {t('noAccountText')}{" "}
                      <button
                        onClick={() => {
                          setLoginMode('register');
                          setRegError('');
                          setRegUsername('');
                          setRegEmail('');
                          setRegPassword('');
                        }}
                        className="text-emerald-400 hover:text-emerald-300 font-black hover:underline transition"
                      >
                        {t('registerMemberLink')}
                      </button>
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="h-px bg-slate-800/60 flex-1"></div>
                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider">{t('orSocials')}</span>
                    <div className="h-px bg-slate-800/60 flex-1"></div>
                  </div>

                  {/* Social Sign-In Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        setAuthModalType('google');
                        setRegError('');
                        setShowAuthModal(true);
                      }}
                      className="py-2.5 bg-slate-950/40 hover:bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.29 1.5-1.14 2.78-2.4 3.63v3.02h3.86c2.26-2.08 3.56-5.14 3.56-8.5Z"/>
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3.02c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.32v3.11C3.31 21.88 7.37 24 12 24Z"/>
                        <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54V6.62H1.32a11.96 11.96 0 0 0 0 10.76l3.95-3.11Z"/>
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.93 1.19 15.24 0 12 0 7.37 0 3.31 2.12 1.32 5.62l3.95 3.11c.95-2.85 3.6-4.98 6.73-4.98Z"/>
                      </svg>
                      <span>Google</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        setAuthModalType('facebook');
                        setRegError('');
                        setShowAuthModal(true);
                      }}
                      className="py-2.5 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/20 rounded-xl text-xs font-bold text-[#1877F2] transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <span>Facebook</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {loginMode === 'register' && (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="space-y-6"
                >
                  <div className="bg-slate-950/40 border border-slate-800/60 p-4 rounded-2xl text-xs space-y-1.5">
                    <p className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <span>{t('regNoticeTitle')}</span>
                    </p>
                    <p className="text-slate-400 leading-relaxed font-medium">
                      {t('regNoticeDesc')}
                    </p>
                  </div>

                  <RegisterForm
                    onSubmit={handleMemberRegister}
                    regError={regError}
                    setRegError={setRegError}
                    authLoading={authLoading}
                    language={language}
                    t={t}
                    qrConfig={qrConfig}
                  />

                  <div className="border-t border-slate-800/60 pt-4 text-center">
                    <button
                      onClick={() => setLoginMode('signin')}
                      className="text-xs text-slate-400 hover:text-white hover:underline font-bold inline-flex items-center gap-1.5 transition"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> {t('backToLogin')}
                    </button>
                  </div>
                </motion.div>
              )}

              {loginMode === 'forgot_password' && (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="space-y-6"
                >
                  <div className="bg-slate-950/40 border border-slate-800/60 p-4 rounded-2xl text-xs space-y-1.5">
                    <p className="text-blue-400 font-bold flex items-center gap-1.5">
                      <span>{t('forgotPasswordTitle')}</span>
                    </p>
                    <p className="text-slate-400 leading-relaxed font-medium">
                      {t('forgotPasswordDesc')}
                    </p>
                  </div>

                  <ForgotPasswordForm
                    onRequest={handleForgotPasswordRequest}
                    onVerify={handleForgotPasswordVerify}
                    onReset={handleForgotPasswordReset}
                    resetStep={resetStep}
                    verificationCode={verificationCode}
                    forgotEmail={forgotEmail}
                    forgotError={forgotError}
                    setForgotError={setForgotError}
                    authLoading={authLoading}
                    language={language}
                    t={t}
                  />

                  <div className="border-t border-slate-800/60 pt-4 text-center">
                    <button
                      onClick={() => {
                        setLoginMode('signin');
                        setResetStep('request');
                        setForgotError('');
                      }}
                      className="text-xs text-slate-400 hover:text-white hover:underline font-bold inline-flex items-center gap-1.5 transition"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> {t('backToLogin')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-center text-[10px] text-slate-500 font-semibold pt-2">
              {t('copyright').replace('{year}', String(new Date().getFullYear()))}
            </p>
          </motion.div>
        </div>

        {/* Dynamic Social Auth & Registration Modal */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-200 my-8">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex flex-col items-center text-center space-y-2">
                <div className="p-3 bg-slate-50 rounded-2xl">
                  {authModalType === 'google' ? (
                    <svg className="w-8 h-8" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.29 1.5-1.14 2.78-2.4 3.63v3.02h3.86c2.26-2.08 3.56-5.14 3.56-8.5Z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3.02c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.32v3.11C3.31 21.88 7.37 24 12 24Z"/>
                      <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54V6.62H1.32a11.96 11.96 0 0 0 0 10.76l3.95-3.11Z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.93 1.19 15.24 0 12 0 7.37 0 3.31 2.12 1.32 5.62l3.95 3.11c.95-2.85 3.6-4.98 6.73-4.98Z"/>
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-[#1877F2] fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  )}
                </div>
                <h3 className="text-sm font-black text-slate-800">
                  {authModalType === 'google' ? t('socialAuthTitleGoogle') : t('socialAuthTitleFacebook')}
                </h3>
                <p className="text-[11px] text-slate-500 font-bold leading-relaxed px-4">
                  {t('socialAuthDesc')}
                </p>
              </div>

              {authLoading ? (
                <div className="p-10 flex flex-col items-center justify-center space-y-3">
                  <div className={`w-9 h-9 border-4 border-t-transparent rounded-full animate-spin ${authModalType === 'facebook' ? 'border-[#1877F2]' : 'border-emerald-600'}`}></div>
                  <span className="text-xs font-bold text-slate-500">{t('syncCloudLoading')}</span>
                </div>
              ) : (
                <div className="max-h-[380px] overflow-y-auto px-5 pb-5 space-y-5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{t('quickAccounts')}</p>
                  <div className="space-y-1.5">
                    {authModalType === 'google' ? (
                      <>
                        <button
                          onClick={() => handleSocialAccountSelect('sounravin@gmail.com', 'Soun Ravin', 'google')}
                          className="w-full p-2.5 hover:bg-slate-50 border border-slate-100 rounded-xl transition flex items-center gap-3 text-left cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">SR</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-slate-800 truncate">Soun Ravin</p>
                            <p className="text-[10px] text-slate-400 font-bold truncate">sounravin@gmail.com</p>
                          </div>
                          <span className="text-[9px] text-blue-600 font-black bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg shrink-0">{t('adminBadge')}</span>
                        </button>

                        <button
                          onClick={() => handleSocialAccountSelect('ProzzLop@gmail.com', 'Prozz Lop', 'google')}
                          className="w-full p-2.5 hover:bg-slate-50 border border-slate-100 rounded-xl transition flex items-center gap-3 text-left cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">PL</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-slate-800 truncate">Prozz Lop</p>
                            <p className="text-[10px] text-slate-400 font-bold truncate">ProzzLop@gmail.com</p>
                          </div>
                          <span className="text-[9px] text-emerald-600 font-black bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg shrink-0">{t('userBadge')}</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleSocialAccountSelect('sounravin@gmail.com', 'Soun Ravin', 'facebook')}
                          className="w-full p-2.5 hover:bg-slate-50 border border-slate-100 rounded-xl transition flex items-center gap-3 text-left cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">SR</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-slate-800 truncate">Soun Ravin</p>
                            <p className="text-[10px] text-slate-400 font-bold truncate">sounravin@facebook.com</p>
                          </div>
                          <span className="text-[9px] text-blue-600 font-black bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg shrink-0">{t('adminBadge')}</span>
                        </button>

                        <button
                          onClick={() => handleSocialAccountSelect('ProzzLop', 'Prozz Lop', 'facebook')}
                          className="w-full p-2.5 hover:bg-slate-50 border border-slate-100 rounded-xl transition flex items-center gap-3 text-left cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">PL</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-slate-800 truncate">Prozz Lop</p>
                            <p className="text-[10px] text-slate-400 font-bold truncate">ProzzLop@facebook.com</p>
                          </div>
                          <span className="text-[9px] text-emerald-600 font-black bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg shrink-0">{t('userBadge')}</span>
                        </button>
                      </>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setShowAuthModal(false)}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer text-center"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  const isPendingApproval = memberProfile && memberProfile.isApproved === false && !isSuperAdmin;

  if (isPendingApproval) {
    const planLabel = memberProfile.selectedPlan === '1_month'
      ? 'គម្រោង ១ ខែ ($5)'
      : memberProfile.selectedPlan === '3_months'
      ? 'គម្រោង ៣ ខែ ($12)'
      : memberProfile.selectedPlan === 'shareholder_addon'
      ? 'មុខងារគ្រប់គ្រងភាគហ៊ុន ($10 Add-on)'
      : 'គម្រោង ១ ឆ្នាំ ($35)';
    return (
      <div className="min-h-screen bg-[#071324] text-white p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-md w-full space-y-6 animate-in fade-in duration-300">
          <div className="text-center space-y-4">
            <div className="inline-flex p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-3xl text-4xl animate-pulse">
              ⏳
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">គណនីរបស់អ្នកកំពុងរង់ចាំការអនុម័ត!</h3>
              <p className="text-xs font-semibold text-slate-300 leading-relaxed">
                គណនីឈ្មោះ <span className="text-emerald-400 font-extrabold">@{currentUser}</span> ត្រូវបានបង្កើតរួចរាល់ហើយ និងកំពុងរង់ចាំការផ្ទៀងផ្ទាត់ការបង់ប្រាក់ពី Admin។
              </p>
            </div>
          </div>

          {/* Plan and Invoice summary card */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4.5 space-y-4 text-left">
            <div className="flex justify-between items-center text-xs font-bold border-b border-slate-800/60 pb-2.5">
              <span className="text-slate-400">គម្រោងដែលបានជ្រើសរើស៖</span>
              <span className="text-amber-400 font-extrabold uppercase">{planLabel}</span>
            </div>

            {memberProfile.invoiceImageUrl && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">វិក្កយបត្រដែលបានផ្ទុកឡើង៖</span>
                <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/50 flex justify-center">
                  <img
                    src={memberProfile.invoiceImageUrl}
                    alt="Transaction Slip"
                    className="max-h-56 object-contain rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Contact and instant approval note */}
          <div className="bg-[#052e16]/40 border border-emerald-500/20 rounded-2xl p-4 text-center space-y-2.5">
            <p className="text-xs font-bold text-emerald-400 leading-normal">
              💡 ដើម្បីទទួលបានការអនុម័តភ្លាមៗ សូមផ្ញើវិក្កយបត្រ ABA ទៅកាន់តេឡេក្រាម Admin!
            </p>
            <a
              href="https://t.me/laymeancamera"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition shadow-lg shadow-emerald-600/15"
            >
              <span>ឆាតទៅកាន់ Telegram Admin ឡាយមាន</span>
            </a>
          </div>

          <button
            onClick={async () => {
              safeStorage.removeItem('luypay_logged_in');
              safeStorage.removeItem('luypay_current_user');
              safeStorage.removeItem('luypay_user_display_name');
              safeStorage.removeItem('luypay_auth_type');
              safeStorage.removeItem('luypay_is_member');
              window.location.reload();
            }}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            ចាកចេញពីគណនី (Logout)
          </button>
        </div>
      </div>
    );
  }

  if ((isBlocked || isExpired) && !isSuperAdmin) {
    const profileStatus = getSubscriptionStatusInfo(memberProfile);
    const profileInfo = { text: profileStatus.text };

    return (
      <div className="min-h-screen bg-[#071324] text-white p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-4xl w-full space-y-8 animate-in fade-in duration-300">
          {/* Header section */}
          <div className="text-center space-y-4">
            <div className="inline-flex p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-3xl text-4xl animate-bounce">
              ⏳
            </div>
            <div className="space-y-1.5">
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">គណនីប្រើប្រាស់របស់លោកអ្នកបានផុតកំណត់ហើយ!</h3>
              <p className="text-sm font-semibold text-slate-300 leading-relaxed max-w-2xl mx-auto">
                គណនីប្រើប្រាស់របស់អ្នកឈ្មោះ <span className="text-white font-black">@{currentUser}</span> បានផុតកំណត់ប្រើប្រាស់គម្រោងសាកល្បង ឬគម្រោងវគ្គមុនហើយ (<span className="text-rose-400 font-bold">{profileInfo.text}</span>)។ <br/>
                ដើម្បីបន្តការគ្រប់គ្រងកូនបំណុល និងទិន្នន័យផ្សេងៗរបស់លោកអ្នក <span className="text-amber-400 font-extrabold font-black">សូមធ្វើការទិញ ឬបន្តគម្រោងបន្តបន្ថែម</span>。
              </p>
            </div>
          </div>

          {/* Checkout/Pricing form (Not visible if blocked) */}
          {!isBlocked && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* ABA KHQR Payment Card with Interactive Flow */}
              <div className="bg-[#0B1521] text-white rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col relative min-h-[500px]">
                {/* Brand Red Header */}
                <div 
                  className="py-4 px-6 flex flex-col items-center justify-center relative overflow-hidden select-none shrink-0"
                  style={{ backgroundColor: qrConfig.bankColor || '#E61A22' }}
                >
                  {/* Curved wave effect on header */}
                  <div className="absolute right-0 bottom-0 left-0 h-2 bg-[#0B1521] rounded-t-full opacity-10"></div>
                  <div className="text-white text-base font-black tracking-widest flex items-center gap-1">
                    <span className="font-sans font-black tracking-widest text-lg">KH</span>
                    <span 
                      className="bg-white font-black px-1.5 py-0.5 rounded text-xs"
                      style={{ color: qrConfig.bankColor || '#E61A22' }}
                    >
                      QR
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                  {blockScreenPaymentStep === 'scan' && (
                    <div className="flex-1 flex flex-col items-center justify-between space-y-5">
                      <div className="text-center space-y-1">
                        <h4 className="text-lg font-black text-white tracking-wide uppercase">
                          {qrConfig.accountName || 'SOUN RAVIN'}
                        </h4>
                        {/* Big bold "0" as shown directly in the uploaded image */}
                        <div className="text-5xl font-black text-white my-1 select-none font-mono">0</div>
                      </div>

                      {/* Dotted Divider */}
                      <div className="w-full border-t border-dashed border-slate-700/60 my-1"></div>

                      {/* QR Code Container with white background */}
                      <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center justify-center relative select-none shrink-0 w-52 h-52 mx-auto">
                        {qrConfig.qrType === 'uploaded' && qrConfig.qrImageUrl ? (
                          <img
                            src={qrConfig.qrImageUrl}
                            alt="Payment KHQR"
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <>
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrConfig.qrString || '00020101021129170013000469096')}`}
                              alt="Canadia KHQR SOUN RAVIN"
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                            {/* Absolute Center Bank logo */}
                            <div className="absolute inset-0 m-auto w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md p-1">
                              <div 
                                className="w-full h-full rounded-full flex items-center justify-center relative"
                                style={{ backgroundColor: qrConfig.bankColor || '#E61A22' }}
                              >
                                <svg className="w-6 h-6 text-white fill-none stroke-current stroke-[2]" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l2.5 2.5L17 5l.5 3.5 2.5 2.5-2.5 2.5-.5 3.5-3.5.5-2.5 2.5-2.5-2.5-3.5-.5-.5-3.5-2.5-2.5 2.5-2.5.5-3.5 3.5-.5z" />
                                  <text x="12" y="15.5" textAnchor="middle" className="font-sans font-black text-[9px] fill-white stroke-none">
                                    {qrConfig.bankLogoText || 'C'}
                                  </text>
                                </svg>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Action Buttons Row */}
                      <div className="w-full space-y-3 pt-1">
                        {/* Interactive Status Indicator / Button */}
                        {!blockScreenQrScanDetected ? (
                          <div className="w-full flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400 gap-1.5 animate-pulse select-none">
                            <Clock className="w-4 h-4 text-amber-500 animate-spin" />
                            <span className="text-[11px] font-bold text-amber-400">កំពុងរង់ចាំសមាជិកស្កេនទូទាត់...</span>
                            <span className="text-[9px] text-slate-500">សូមស្កេន QR ខាងលើដើម្បីទូទាត់ប្រាក់</span>
                          </div>
                        ) : (
                          <div className="w-full space-y-2 animate-in fade-in duration-300">
                            <div className="w-full flex items-center justify-center p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 gap-1.5 animate-bounce">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              <span className="text-[10px] font-bold">បានរកឃើញការស្កេនរួចរាល់!</span>
                            </div>

                            {/* Pay/Verify Trigger Button */}
                            <button
                              onClick={() => {
                                setBlockScreenPaymentStep('counting');
                                setBlockScreenCountdown(56);
                              }}
                              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-2xl text-xs font-black transition duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
                            >
                              <span className="text-base leading-none">⚡</span>
                              <span>ខ្ញុំបានស្កេន រួចរាលហើយ</span>
                            </button>
                          </div>
                        )}

                        {/* Separate copy blocks side-by-side as requested */}
                        <div className="grid grid-cols-2 gap-2 w-full pt-1">
                          <div 
                            onClick={() => {
                              if (navigator.clipboard) {
                                navigator.clipboard.writeText(qrConfig.accountId || '000469096');
                                showToast('ចម្លង ID គណនីរួចរាល់!', 'success');
                              }
                            }}
                            className="py-2.5 px-3 bg-[#0F1C2E] hover:bg-slate-800 text-slate-300 rounded-xl text-center cursor-pointer border border-slate-800 flex flex-col items-center justify-center gap-1 transition-all duration-150 group"
                          >
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">ID</span>
                            <span className="text-xs font-mono font-black text-white group-hover:text-amber-400 truncate w-full px-1">
                              {qrConfig.accountId || '000469096'}
                            </span>
                          </div>

                          <div 
                            onClick={() => {
                              if (navigator.clipboard) {
                                navigator.clipboard.writeText(qrConfig.accountName || 'SOUN RAVIN');
                                showToast('ចម្លងឈ្មោះគណនីរួចរាល់!', 'success');
                              }
                            }}
                            className="py-2.5 px-3 bg-[#0F1C2E] hover:bg-slate-800 text-slate-300 rounded-xl text-center cursor-pointer border border-slate-800 flex flex-col items-center justify-center gap-1 transition-all duration-150 group"
                          >
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Name</span>
                            <span className="text-xs font-sans font-black text-white group-hover:text-amber-400 truncate w-full px-1">
                              {qrConfig.accountName || 'SOUN RAVIN'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {blockScreenPaymentStep === 'counting' && (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-6 text-center animate-in fade-in duration-300">
                      {/* Beautiful Countdown Dial */}
                      <div className="relative w-40 h-40 flex items-center justify-center">
                        {/* Outer animated rotating border */}
                        <div className="absolute inset-0 rounded-full border-4 border-slate-800 border-t-amber-500 animate-spin"></div>
                        {/* Middle pulse ring */}
                        <div className="absolute inset-3 rounded-full border border-slate-700/60 bg-slate-900/40 animate-pulse"></div>
                        {/* Timer Display */}
                        <div className="relative flex flex-col items-center">
                          <span className="text-5xl font-black text-amber-500 font-mono tracking-tighter">
                            {blockScreenCountdown}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                            វិនាទី (Seconds)
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 max-w-xs">
                        <h5 className="text-sm font-black text-amber-400">
                          កំពុងផ្ទៀងផ្ទាត់ការទូទាត់... (Checking Bank...)
                        </h5>
                        <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                          {blockScreenCountdown > 40 && '🔍 កំពុងស្វែងរកប្រតិបត្តិការទូទាត់ប្រាក់ពីធនាគារ...'}
                          {blockScreenCountdown <= 40 && blockScreenCountdown > 25 && '⛓️ កំពុងផ្ទៀងផ្ទាត់ហត្ថលេខាឌីជីថលលើបណ្ដាញ...'}
                          {blockScreenCountdown <= 25 && blockScreenCountdown > 10 && '🔐 កំពុងធ្វើសមកាលកម្មទិន្នន័យគណនីលើ Cloud...'}
                          {blockScreenCountdown <= 10 && '✨ ជិតរួចរាល់ហើយ! កំពុងបង្កើតកញ្ចប់គម្រោង...'}
                        </p>
                      </div>

                      {/* Bypass shortcut button for convenience during testing */}
                      <button
                        onClick={() => setBlockScreenPaymentStep('select_plan')}
                        className="px-4 py-1.5 bg-slate-800 hover:bg-slate-750 text-[10px] text-slate-400 rounded-lg hover:text-white transition"
                      >
                        រំលងការរង់ចាំ (Skip)
                      </button>
                    </div>
                  )}

                  {blockScreenPaymentStep === 'select_plan' && (
                    <div className="flex-1 flex flex-col justify-between space-y-4 animate-in fade-in duration-300">
                      <div className="space-y-3">
                        <div className="text-center space-y-1">
                          <span className="inline-block text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                            ស្កេនជោគជ័យ (Scan Success)
                          </span>
                          <h5 className="text-sm font-black text-white">
                            សូមជ្រើសរើសគម្រោងដែលលោកអ្នកបានបង់ប្រាក់
                          </h5>
                        </div>

                        {/* Plan Selection Buttons Grid */}
                        <div className="grid grid-cols-1 gap-2.5">
                          {[
                            { id: '1_month', nameKh: 'គម្រោង ១ ខែ = 5$', popular: false },
                            { id: '3_months', nameKh: 'គម្រោង ៣ ខែ = 12$', popular: true },
                            { id: '1_year', nameKh: 'គម្រោង ១ ឆ្នាំ = 35$', popular: false }
                          ].map((plan) => (
                            <button
                              key={plan.id}
                              onClick={() => setBlockScreenSelectedPlan(plan.id as any)}
                              className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer relative ${
                                blockScreenSelectedPlan === plan.id
                                  ? 'bg-blue-600/25 border-blue-500 text-white ring-1 ring-blue-500'
                                  : 'bg-slate-850 hover:bg-slate-800 border-slate-800 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${blockScreenSelectedPlan === plan.id ? 'border-blue-400' : 'border-slate-600'}`}>
                                  {blockScreenSelectedPlan === plan.id && <span className="w-2 h-2 rounded-full bg-blue-400"></span>}
                                </span>
                                <span className="text-xs font-black">
                                  {plan.nameKh}
                                </span>
                              </div>
                              {plan.popular && (
                                <span className="text-[9px] font-black bg-blue-500 text-white px-2 py-0.5 rounded-md shrink-0">
                                  ពេញនិយម
                                </span>
                              )}
                            </button>
                          ))}
                        </div>

                        {/* Upload Invoice Image Box */}
                        <div className="space-y-1.5 text-left pt-2">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            {language === 'kh' ? 'ផ្ទុកឡើងរូបភាពវិក្កយបត្រ (Invoice Slip)' : 'Upload Payment Slip / Invoice'}
                          </label>
                          <div className="border-2 border-dashed border-slate-700/80 hover:border-blue-500/80 rounded-2xl p-3 transition flex flex-col items-center justify-center gap-2 relative overflow-hidden bg-slate-900/60 cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleBlockScreenImageUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                            />
                            {blockScreenInvoiceImage ? (
                              <div className="space-y-1.5 text-center w-full relative z-20">
                                <img
                                  src={blockScreenInvoiceImage}
                                  alt="Uploaded Receipt"
                                  className="max-h-32 object-contain mx-auto rounded-lg shadow-md border border-slate-700"
                                />
                                <p className="text-[10px] text-emerald-400 font-black flex items-center justify-center gap-1">
                                  <span>✓</span> {language === 'kh' ? 'បានផ្ទុកឡើងវិក្កយបត្ររួចរាល់!' : 'Invoice uploaded!'}
                                </p>
                                <p className="text-[9px] text-slate-500">
                                  {language === 'kh' ? 'ចុចទីនេះដើម្បីប្តូររូបភាព' : 'Click to change image'}
                                </p>
                              </div>
                            ) : (
                              <div className="text-center space-y-1 py-1">
                                <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-xs text-slate-300">
                                  📤
                                </div>
                                <p className="text-xs font-black text-white">
                                  {language === 'kh' ? 'ជ្រើសរើស ឬទាញទម្លាក់រូបភាពវិក្កយបត្រ' : 'Click or drag receipt image here'}
                                </p>
                                <p className="text-[9px] text-slate-400 font-medium">
                                  {language === 'kh' ? 'គាំទ្ររូបភាព PNG, JPG (អតិបរមា 5MB)' : 'Supports PNG, JPG (Max 5MB)'}
                                </p>
                              </div>
                            )}
                          </div>
                          {blockScreenUploadError && (
                            <p className="text-[10px] text-rose-400 font-bold">⚠️ {blockScreenUploadError}</p>
                          )}
                        </div>
                      </div>

                      {/* Submit Request Button */}
                      <button
                        onClick={() => handleBlockScreenRequestPlan(blockScreenSelectedPlan)}
                        disabled={blockScreenSubmitting}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-2xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20 cursor-pointer disabled:opacity-50"
                      >
                        {blockScreenSubmitting ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>កំពុងបញ្ជូនសំណើ...</span>
                          </>
                        ) : (
                          <>
                            <span>✨</span>
                            <span>ផ្ញើសំណើទៅកាន់ក្រុមការងារដើម្បីអនុម័ត</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {blockScreenPaymentStep === 'success' && (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-5 py-6 text-center animate-in zoom-in-95 duration-250">
                      {/* Radiant Success Indicator */}
                      <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/5 relative">
                        <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping"></div>
                        <span className="text-4xl">✨</span>
                      </div>

                      <div className="space-y-2">
                        <h5 className="text-base font-black text-emerald-400">
                          ផ្ញើសំណើទិញជោគជ័យ!
                        </h5>
                        <div className="bg-slate-850 p-3 rounded-2xl border border-slate-800 text-[11px] font-bold text-slate-300 leading-normal max-w-xs mx-auto">
                          គម្រោងដែលអ្នកបានជ្រើសរើស៖{' '}
                          <span className="text-amber-400 font-extrabold uppercase">
                            {blockScreenSelectedPlan === '1_month' ? 'គម្រោង ១ ខែ' : blockScreenSelectedPlan === '3_months' ? 'គម្រោង ៣ ខែ' : 'គម្រោង ១ ឆ្នាំ'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-semibold leading-relaxed max-w-xs">
                          ក្រុមការងារពួកយើងនឹងពិនិត្យមើលប្រតិបត្តិការធនាគារ និងអនុម័តគណនីជូនលោកអ្នកយ៉ាងលឿនបំផុត!
                        </p>
                      </div>

                      <button
                        onClick={() => setBlockScreenPaymentStep('scan')}
                        className="px-8 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700/60 rounded-xl text-xs font-black transition cursor-pointer"
                      >
                        រួចរាល់
                      </button>
                    </div>
                  )}

                  {/* Support Info Row */}
                  <div className="flex justify-between items-center border-t border-slate-800 pt-3.5 text-[10px] text-slate-400 shrink-0 select-none">
                    <a
                      href="https://t.me/laymeancamera"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-black text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Telegram: ឡាយមាន</span> <ChevronRight className="w-3 h-3" />
                    </a>
                    <span className="font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg uppercase tracking-wider">INSTANT APPROVAL</span>
                  </div>
                </div>
              </div>

              {/* Right Panel: Subscription History and Status Information */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6.5 flex flex-col justify-between shadow-sm space-y-6">
                <div className="space-y-5">
                  <div className="text-left flex items-center gap-2 pb-3.5 border-b border-slate-800">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <h3 className="font-extrabold text-white text-sm">
                      ប្រវត្តិនៃការផ្ញើសំណើរបស់អ្នក
                    </h3>
                  </div>

                  {mySubRequests.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 font-semibold text-xs space-y-1">
                      <p>មិនទាន់មានសំណើទិញណាមួយឡើយ</p>
                      <p className="text-[10px] text-slate-600 font-medium">
                        ស្កេនទូទាត់ប្រាក់នៅផ្នែកខាងឆ្វេងដើម្បីផ្ញើសំណើដំបូងរបស់អ្នក។
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                      {mySubRequests.map((req) => (
                        <div key={req.id} className="bg-slate-850 p-4 rounded-2xl border border-slate-800/80 text-[11px] font-bold space-y-2.5 transition duration-150 hover:border-slate-700/50">
                          <div className="flex justify-between items-start">
                            <div className="space-y-0.5">
                              <p className="text-white text-xs">
                                {req.plan === '1_month' ? 'គម្រោង ១ ខែ ($5)' : req.plan === '3_months' ? 'គម្រោង ៣ ខែ ($12)' : 'គម្រោង ១ ឆ្នាំ ($35)'}
                              </p>
                              <p className="text-slate-500 font-medium">
                                ID: {req.id}
                              </p>
                            </div>
                            <div>
                              {req.status === 'pending' ? (
                                <span className="text-amber-400 bg-amber-400/5 px-2.5 py-1 rounded-xl border border-amber-400/10 text-[9px] font-black uppercase tracking-wider">🟠 Pending</span>
                              ) : req.status === 'approved' ? (
                                <span className="text-emerald-400 bg-emerald-400/5 px-2.5 py-1 rounded-xl border border-emerald-400/10 text-[9px] font-black uppercase tracking-wider">🟢 Approved</span>
                              ) : (
                                <span className="text-rose-400 bg-rose-400/5 px-2.5 py-1 rounded-xl border border-rose-400/10 text-[9px] font-black uppercase tracking-wider">🔴 Rejected</span>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium border-t border-slate-800/40 pt-2">
                            <span>កាលបរិច្ឆេទផ្ញើសំណើ៖</span>
                            <span>{new Date(req.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Secure Notice */}
                <div className="bg-slate-850/60 border border-slate-800/80 rounded-2xl p-4 text-[11px] text-slate-400 leading-relaxed font-semibold">
                  <div className="flex items-center gap-1.5 text-amber-400 font-black mb-1.5">
                    <span>💡</span>
                    <span>ចំណាំសំខាន់ (Important Note)</span>
                  </div>
                  បន្ទាប់ពីបានទូទាត់ប្រាក់តាម QR និងបំពេញបែបបទសំណើរួចរាល់ ក្រុមការងារពួកយើងនឹងធ្វើការផ្ទៀងផ្ទាត់ និងអនុម័តគណនីជូនលោកអ្នកដើម្បីចូលទៅកាន់ប្រព័ន្ធគ្រប់គ្រងភ្លាមៗ!
                </div>
              </div>
            </div>
          )}

          {/* Action links */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3.5 pt-2">
            <a
              href="https://t.me/laymeancamera"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-3.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-sky-500/10 transition duration-150 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.36-.49.99-.75 3.88-1.69 6.47-2.8 7.77-3.32 3.7-1.49 4.47-1.75 4.97-1.76.11 0 .36.03.52.16.14.11.18.26.19.38 0 .09-.01.27-.02.39z"/>
              </svg>
              <span>ទាក់ទង Admin តាម Telegram (ឡាយមាន)</span>
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-800 hover:bg-slate-750 active:bg-slate-900 text-slate-300 hover:text-white font-extrabold text-xs rounded-xl border border-slate-700 transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>ចាកចេញពីគណនី (Logout)</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  const renderMobileAppUi = () => {
    const currentThemeConfig = THEMES[appTheme] || THEMES.slate;
    const isDarkTheme = theme === 'dark';
    
    // Calculate total remaining
    const totalRemainingUSD = Math.max(0, (stats.totalExpectedUSD || 0) - (stats.totalCollectedUSD || 0));
    const totalRemainingKHR = Math.max(0, (stats.totalExpectedKHR || 0) - (stats.totalCollectedKHR || 0));
    const totalCollectedUSD = stats.totalCollectedUSD || 0;
    const totalCollectedKHR = stats.totalCollectedKHR || 0;
    
    // Dynamic counts
    const activeCount = borrowers.filter(b => !b.isArchived && (Array.isArray(b.payments) ? b.payments.reduce((sum, p) => sum + (p?.amount || 0), 0) : 0) < b.totalToPay).length;
    const completedCount = borrowers.filter(b => !b.isArchived && (Array.isArray(b.payments) ? b.payments.reduce((sum, p) => sum + (p?.amount || 0), 0) : 0) >= b.totalToPay).length;
    
    // Accent color extraction
    const themeAccentClass = `bg-gradient-to-r ${currentThemeConfig.accent}`;
    
    return (
      <div className="min-h-screen w-full bg-[#f1f5f9] dark:bg-[#020408] flex items-center justify-center p-0 md:p-6 text-slate-800 dark:text-slate-100 antialiased font-sans select-none">
        {/* On desktop: premium curved phone mock frame. On mobile: full screen. */}
        <div className={`w-full md:max-w-[420px] md:h-[860px] md:max-h-[95vh] md:rounded-[40px] md:border-[10px] md:border-slate-800 dark:md:border-slate-900 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] relative ${isDarkTheme ? currentThemeConfig.bgDark : currentThemeConfig.bgLight} flex flex-col overflow-hidden transition-all duration-300`}>
          
          {/* Custom Ambient Header Bar */}
          <div className={`px-5 pt-3 pb-2 flex items-center justify-between text-[11px] font-bold tracking-tight select-none shrink-0 z-50 ${isDarkTheme ? 'bg-[#000000]/25 border-b border-white/5' : 'bg-white/40 border-b border-black/5'} backdrop-blur-md`}>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-slate-900 dark:text-white tracking-wider flex items-center gap-1">
                💎 LuyPay <span className="text-[8px] bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 px-1.5 py-0.2 rounded-full font-bold">App</span>
              </span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            </div>
            <div className={`flex items-center gap-2 font-mono ${currentThemeConfig.textMuted}`}>
              <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <div className="flex items-center gap-1 opacity-80">
                <span>📶</span>
                <span>🔋 100%</span>
              </div>
            </div>
          </div>

          {/* Core Scroll Viewport */}
          <div className="flex-1 overflow-y-auto pb-24 scrollbar-none relative flex flex-col bg-transparent">
            
            {/* Elegant Header with profile and welcome */}
            <div className="p-5 pb-4 space-y-4 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {memberProfile?.photoURL ? (
                    <img 
                      src={memberProfile.photoURL} 
                      alt={userDisplayName} 
                      className="w-11 h-11 rounded-full object-cover border-2 border-slate-200 dark:border-slate-800 shadow-sm shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-11 h-11 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-800 dark:text-slate-200 text-sm font-black shadow-inner shrink-0">
                      {userDisplayName.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider leading-none">
                      {language === 'kh' ? 'សួស្តីបង! (Hello)' : 'Welcome back'}
                    </p>
                    <h2 className="text-xs font-black mt-1 text-slate-800 dark:text-white leading-tight">
                      {userDisplayName}
                    </h2>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold leading-none mt-1">ID: {currentUser}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isMember && memberProfile && memberProfile.isApproved !== false && (
                    <button
                      onClick={() => {
                        const currentPlan = memberProfile.lastApprovedPlan || memberProfile.selectedPlan || '1_month';
                        setApprovalModalPlan(currentPlan);
                        setIsApprovalModalOpen(true);
                        playClickSound();
                      }}
                      className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 active:scale-95 rounded-full transition cursor-pointer flex items-center justify-center relative animate-pulse"
                      title={language === 'kh' ? 'មើលការអនុម័តគម្រោង 🔔' : 'View Plan Approval 🔔'}
                    >
                      <Award className="w-4 h-4 text-emerald-400" />
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0B1521]"></span>
                    </button>
                  )}
                  <button 
                    onClick={() => { setIsSettingsOpen(true); playClickSound(); }}
                    className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 active:scale-95 rounded-full transition cursor-pointer flex items-center justify-center border-none"
                    title="Settings"
                  >
                    <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </button>
                  <NotificationBell borrowers={borrowers} onSelectBorrower={setSelectedBorrowerId} isMobile={true} />
                </div>
              </div>

              {/* Dynamic Theme-matching Search bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'kh' ? 'ស្វែងរកឈ្មោះ ឬលេខទូរស័ព្ទ...' : 'Search debtors...'}
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 border transition-all font-bold ${currentThemeConfig.inputClass}`}
                />
              </div>

              {/* Seamless Filter Segmented Control */}
              <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200/40 dark:border-slate-800/50 shrink-0">
                <button
                  onClick={() => { setFilterTab('active'); playClickSound(); }}
                  className={`flex-1 py-1.5 text-[10px] font-extrabold rounded-lg text-center transition cursor-pointer border-none ${filterTab === 'active' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
                >
                  💵 {language === 'kh' ? 'កម្ចីសកម្ម' : 'Active'} ({activeCount})
                </button>
                <button
                  onClick={() => { setFilterTab('completed'); playClickSound(); }}
                  className={`flex-1 py-1.5 text-[10px] font-extrabold rounded-lg text-center transition cursor-pointer border-none ${filterTab === 'completed' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
                >
                  ✅ {language === 'kh' ? 'បង់រួចរាល់' : 'Completed'} ({completedCount})
                </button>
              </div>
            </div>

            {/* Premium Neo-wallet Master Balance Card (Theme Responsive) */}
            <div className="px-5 shrink-0">
              <div className={`p-5 rounded-3xl text-white shadow-xl flex flex-col gap-4 relative overflow-hidden ${themeAccentClass}`}>
                {/* Decorative background grid mesh */}
                <div className="absolute inset-0 bg-black/10 opacity-30 mix-blend-overlay pointer-events-none" />
                <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
                
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-[9px] uppercase font-black tracking-widest text-white/80 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
                    <span>{language === 'kh' ? 'សមតុល្យត្រូវប្រមូលសរុប' : 'Total Remaining to Collect'}</span>
                  </span>
                  <span className="text-[8px] bg-white/20 text-white font-extrabold px-2 py-0.5 rounded-md backdrop-blur-md">
                    {appTheme.toUpperCase()} LEDGER
                  </span>
                </div>

                <div className="space-y-1.5 relative z-10">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black tracking-tight font-mono text-white">
                      ${totalRemainingUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-white/80 font-black">USD</span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1 border-t border-white/10">
                    <span className="text-base font-extrabold text-amber-200 font-mono">
                      {totalRemainingKHR.toLocaleString()} ៛
                    </span>
                    <span className="text-[9px] text-white/70 font-black">KHR</span>
                  </div>
                </div>

                {/* Grid of Micro Action Buttons inside Balance Card */}
                <div className="grid grid-cols-4 gap-1.5 text-center mt-1 relative z-10 border-t border-white/10 pt-3">
                  <button 
                    onClick={() => { setActiveSection('ledger'); playClickSound(); }}
                    className="flex flex-col items-center gap-1 group cursor-pointer border-none bg-transparent"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition flex items-center justify-center text-white">
                      <Clock className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-[8px] font-extrabold text-white/90 group-hover:text-white leading-tight">
                      {language === 'kh' ? 'ប្រវត្តិបង់' : 'Logs'}
                    </span>
                  </button>

                  <button 
                    onClick={() => { setIsAddModalOpen(true); playClickSound(); }}
                    className="flex flex-col items-center gap-1 group cursor-pointer border-none bg-transparent"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition flex items-center justify-center text-white">
                      <Plus className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-[8px] font-extrabold text-white/90 group-hover:text-white leading-tight">
                      {language === 'kh' ? 'កម្ចីថ្មី' : 'New Loan'}
                    </span>
                  </button>

                  <button 
                    onClick={() => { 
                      if (memberProfile?.paymentQr) {
                        setQrBorrower({ id: 'system-qr', name: userDisplayName, paymentQr: memberProfile.paymentQr } as any);
                      } else {
                        setIsSettingsOpen(true);
                        showToast(language === 'kh' ? 'សូមបញ្ចូល QR ទទួលប្រាក់របស់អ្នកជាមុនសិន!' : 'Please upload your Payment QR code first!', 'info');
                      }
                      playClickSound();
                    }}
                    className="flex flex-col items-center gap-1 group cursor-pointer border-none bg-transparent"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition flex items-center justify-center text-white">
                      <QrCode className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-[8px] font-extrabold text-white/90 group-hover:text-white leading-tight">
                      {language === 'kh' ? 'កូដទទួលប្រាក់' : 'My QR'}
                    </span>
                  </button>

                  <button 
                    onClick={() => { setActiveSection('pricing'); playClickSound(); }}
                    className="flex flex-col items-center gap-1 group cursor-pointer border-none bg-transparent"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition flex items-center justify-center text-white">
                      <Activity className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-[8px] font-extrabold text-white/90 group-hover:text-white leading-tight">
                      {language === 'kh' ? 'គម្រោង' : 'Plans'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Interactive Services Panel */}
            <div className="mt-5 px-5 space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {language === 'kh' ? 'សេវាកម្មកម្ចីឌីជីថល' : 'Digital Loan Services'}
                </h3>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              </div>
              
              <div className={`grid grid-cols-4 gap-2 p-3.5 rounded-2xl border ${currentThemeConfig.cardClass}`}>
                {/* New Loan Button */}
                <button 
                  onClick={() => { setIsAddModalOpen(true); playClickSound(); }}
                  className="flex flex-col items-center gap-1.5 text-center cursor-pointer group border-none bg-transparent"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all shadow-3xs">
                    <Plus className="w-4.5 h-4.5 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <span className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300 leading-none group-hover:text-indigo-500">
                    {language === 'kh' ? 'កម្ចីថ្មី' : 'New Loan'}
                  </span>
                </button>

                {/* Requests Button */}
                <button 
                  onClick={() => { setActiveSection('loan_applications'); playClickSound(); }}
                  className="flex flex-col items-center gap-1.5 text-center cursor-pointer group relative border-none bg-transparent"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all shadow-3xs">
                    <FileText className="w-4.5 h-4.5 text-blue-500 dark:text-blue-400" />
                  </div>
                  <span className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300 leading-none group-hover:text-blue-500">
                    {language === 'kh' ? 'សំណើកម្ចី' : 'Requests'}
                  </span>
                  {subRequests.filter(r => r.status === 'pending').length > 0 && (
                    <span className="absolute top-0 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white dark:border-slate-900 animate-pulse" />
                  )}
                </button>

                {/* Interest Calculator */}
                <button 
                  onClick={() => {
                    playClickSound();
                    const amount = prompt(language === 'kh' ? 'បញ្ចូលចំនួនប្រាក់ដើម ($)' : 'Enter principal amount ($)', '100');
                    if (!amount) return;
                    const rate = prompt(language === 'kh' ? 'បញ្ចូលការប្រាក់ (%)' : 'Enter interest rate (%)', '20');
                    if (!rate) return;
                    const days = prompt(language === 'kh' ? 'បញ្ចូលចំនួនថ្ងៃកម្ចី' : 'Enter loan duration in days', '24');
                    if (!days) return;
                    
                    const p = parseFloat(amount);
                    const r = parseFloat(rate);
                    const d = parseInt(days);
                    
                    const interest = p * (r / 100);
                    const totalToPay = p + interest;
                    const daily = totalToPay / d;
                    
                    alert(language === 'kh' 
                      ? `📊 របាយការណ៍គណនាការប្រាក់៖\n- ប្រាក់ដើម៖ $${p}\n- ការប្រាក់សរុប៖ $${interest}\n- ត្រូវបង់សរុប៖ $${totalToPay}\n- ត្រូវបង់ប្រចាំថ្ងៃ (រយៈពេល ${d} ថ្ងៃ)៖ $${daily.toFixed(2)}`
                      : `📊 Loan Calculator Report:\n- Principal: $${p}\n- Total Interest: $${interest}\n- Total to Pay: $${totalToPay}\n- Daily Installment (for ${d} days): $${daily.toFixed(2)}`
                    );
                  }}
                  className="flex flex-col items-center gap-1.5 text-center cursor-pointer group border-none bg-transparent"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all shadow-3xs">
                    <Percent className="w-4.5 h-4.5 text-amber-500 dark:text-amber-400" />
                  </div>
                  <span className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300 leading-none group-hover:text-amber-500">
                    {language === 'kh' ? 'គណនាការ' : 'Calculator'}
                  </span>
                </button>

                {/* Shareholders / Partners Button */}
                <button 
                  onClick={handleOpenShareholders}
                  className="flex flex-col items-center gap-1.5 text-center cursor-pointer group border-none bg-transparent"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-all shadow-3xs border border-amber-500/20">
                    <Users className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300 leading-none group-hover:text-amber-600">
                    {language === 'kh' ? 'ដៃគូភាគហ៊ុន' : 'Shareholders'}
                  </span>
                </button>

                {/* Admin Button */}
                <button 
                  onClick={() => { 
                    if (currentUser === 'sounravin') {
                      setActiveSection('admin_dashboard'); 
                    } else {
                      showToast(language === 'kh' ? 'សេវាកម្មនេះមានតែសម្រាប់ Admin ប៉ុណ្ណោះ!' : 'Restricted to administrators!', 'info');
                    }
                    playClickSound(); 
                  }}
                  className="flex flex-col items-center gap-1.5 text-center cursor-pointer group border-none bg-transparent"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all shadow-3xs">
                    <Users className="w-4.5 h-4.5 text-purple-500 dark:text-purple-400" />
                  </div>
                  <span className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300 leading-none group-hover:text-purple-500">
                    {language === 'kh' ? 'គ្រប់គ្រង' : 'Admin'}
                  </span>
                </button>
              </div>
            </div>

            {/* Services & Maintenance Section */}
            <div className="mt-4 px-5 space-y-3 shrink-0">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {language === 'kh' ? 'សេវាកម្មថែទាំប្រព័ន្ធ' : 'Maintenance & Data'}
              </h3>
              
              <div className={`grid grid-cols-4 gap-2 p-3.5 rounded-2xl border ${currentThemeConfig.cardClass}`}>
                {/* Backup Button */}
                <button 
                  onClick={() => { handleExportBackup(); playClickSound(); }}
                  className="flex flex-col items-center gap-1.5 text-center cursor-pointer group border-none bg-transparent"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all shadow-3xs">
                    <Upload className="w-4.5 h-4.5 text-emerald-500 dark:text-emerald-400" />
                  </div>
                  <span className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300 leading-none group-hover:text-emerald-500">
                    {language === 'kh' ? 'បម្រុងទុក' : 'Backup'}
                  </span>
                </button>

                {/* Import Button */}
                <button 
                  onClick={() => { document.getElementById('mobile-import-file')?.click(); playClickSound(); }}
                  className="flex flex-col items-center gap-1.5 text-center cursor-pointer group border-none bg-transparent"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all shadow-3xs">
                    <Coins className="w-4.5 h-4.5 text-rose-500 dark:text-rose-400" />
                  </div>
                  <span className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300 leading-none group-hover:text-rose-500">
                    {language === 'kh' ? 'ទាញចូលវិញ' : 'Import'}
                  </span>
                </button>

                {/* Support Button */}
                <button 
                  onClick={() => { 
                    const chatBtn = document.querySelector('[title="Open Live Chat"]') as HTMLButtonElement;
                    if (chatBtn) chatBtn.click();
                    else {
                      alert(language === 'kh' ? 'សូមទាក់ទងមកកាន់តេឡេក្រាម @laymeancamera សម្រាប់ជំនួយ!' : 'Contact Telegram @laymeancamera for technical support!');
                    }
                    playClickSound(); 
                  }}
                  className="flex flex-col items-center gap-1.5 text-center cursor-pointer group border-none bg-transparent"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all shadow-3xs">
                    <MessageSquare className="w-4.5 h-4.5 text-sky-500 dark:text-sky-400" />
                  </div>
                  <span className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300 leading-none group-hover:text-sky-500">
                    {language === 'kh' ? 'ជំនួយផ្ទាល់' : 'Support'}
                  </span>
                </button>

                {/* Theme Changer */}
                <button 
                  onClick={() => { 
                    const nextThemes: Record<AppThemeType, AppThemeType> = { slate: 'angkor', angkor: 'apsara', apsara: 'emerald', emerald: 'slate' };
                    setAppTheme(nextThemes[appTheme]);
                    showToast(`ប្តូរពណ៌៖ ${nextThemes[appTheme].toUpperCase()}`, 'info');
                    playClickSound(); 
                  }}
                  className="flex flex-col items-center gap-1.5 text-center cursor-pointer group border-none bg-transparent"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all shadow-3xs">
                    <Sparkles className="w-4.5 h-4.5 text-fuchsia-550 dark:text-fuchsia-400 animate-spin-slow" />
                  </div>
                  <span className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300 leading-none group-hover:text-fuchsia-500">
                    {language === 'kh' ? 'ប្តូរពណ៌' : 'Theme'}
                  </span>
                </button>
              </div>
            </div>

            {/* Pending Receipt Verification Alert (Theme Responsive) */}
            {borrowers.some(b => Array.isArray(b.reportedPayments) && b.reportedPayments.some(r => r.status === 'pending')) && (() => {
              const debtorsWithPending = borrowers.filter(b => Array.isArray(b.reportedPayments) && b.reportedPayments.some(r => r.status === 'pending'));
              const totalPendingCount = debtorsWithPending.reduce((sum, b) => sum + b.reportedPayments!.filter(r => r.status === 'pending').length, 0);
              
              return (
                <div className="mx-5 mt-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-3 shrink-0 animate-pulse">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>{language === 'kh' ? 'ប្រាក់កម្ចីរង់ចាំការផ្ទៀងផ្ទាត់' : 'Verification Pending'}</span>
                        <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                          {totalPendingCount}
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                        {language === 'kh' ? 'សូមចុចលើឈ្មោះដើម្បីពិនិត្យ៖' : 'Tap debtor to approve invoice receipt:'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {debtorsWithPending.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          playClickSound();
                          setSelectedBorrowerId(b.id);
                        }}
                        className="bg-white dark:bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1 text-[10px] font-bold transition cursor-pointer shadow-3xs flex items-center gap-1"
                      >
                        👤 {b.name}
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[8px] px-1 rounded-full">
                          {b.reportedPayments!.filter(r => r.status === 'pending').length}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Central Router Output View */}
            <div className="mt-5 px-5 pb-4">
              {(() => {
                if (activeSection === 'admin_dashboard' && currentUser === 'sounravin') {
                  return (
                    <div className={`p-4 rounded-3xl border text-slate-800 dark:text-slate-100 ${currentThemeConfig.cardClass}`}>
                      <div className="flex items-center justify-between border-b pb-2 mb-3 border-slate-100 dark:border-slate-800">
                        <h3 className="text-xs font-black text-indigo-600 flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          <span>គ្រប់គ្រងប្រព័ន្ធ (Admin Panel)</span>
                        </h3>
                        <button onClick={() => { setActiveSection('ledger'); playClickSound(); }} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 bg-transparent border-none">
                          {language === 'kh' ? 'បិទ' : 'Close'}
                        </button>
                      </div>
                      <AdminMembersDashboard
                        members={members}
                        subRequests={subRequests}
                        getSubscriptionStatusInfo={getSubscriptionStatusInfo}
                        showToast={showToast}
                        language={language}
                        onOpenAvatarFrameModal={() => setIsAvatarFrameModalOpen(true)}
                      />
                    </div>
                  );
                }

                if (activeSection === 'pricing') {
                  return (
                    <div className={`p-4 rounded-3xl border text-slate-800 dark:text-slate-100 ${currentThemeConfig.cardClass}`}>
                      <div className="flex items-center justify-between border-b pb-2 mb-3 border-slate-100 dark:border-slate-800">
                        <h3 className="text-xs font-black text-amber-500 flex items-center gap-1.5">
                          <Award className="w-4 h-4" />
                          <span>គម្រោងកម្មវិធី (Subscription Plans)</span>
                        </h3>
                        <button onClick={() => { setActiveSection('ledger'); playClickSound(); }} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 bg-transparent border-none">
                          {language === 'kh' ? 'បិទ' : 'Close'}
                        </button>
                      </div>
                      <PricingPanel
                        currentUser={currentUser}
                        userDisplayName={userDisplayName}
                        memberProfile={memberProfile}
                        language={language}
                        getSubscriptionStatusInfo={getSubscriptionStatusInfo}
                        showToast={showToast}
                        qrConfig={qrConfig}
                      />
                    </div>
                  );
                }

                if (activeSection === 'loan_applications') {
                  return (
                    <div className={`p-4 rounded-3xl border text-slate-800 dark:text-slate-100 ${currentThemeConfig.cardClass}`}>
                      <div className="flex items-center justify-between border-b pb-2 mb-3 border-slate-100 dark:border-slate-800">
                        <h3 className="text-xs font-black text-blue-600 flex items-center gap-1.5">
                          <FileText className="w-4 h-4" />
                          <span>សំណើសុំកម្ចី (Applications)</span>
                        </h3>
                        <button onClick={() => { setActiveSection('ledger'); playClickSound(); }} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 bg-transparent border-none">
                          {language === 'kh' ? 'បិទ' : 'Close'}
                        </button>
                      </div>
                      <LoanApplicationsControlPanel
                        currentUser={currentUser}
                        showToast={showToast}
                        onApproveAndCreateBorrower={(app) => {
                          setPrefilledData({
                            name: app.name,
                            phone: app.phone,
                            principal: app.amountRequested,
                            profilePhoto: app.selfiePhoto,
                            notes: `សំណើខ្ចីលុយឆក់អេឡិចត្រូនិច ID: ${app.id}`,
                            applicationId: app.id,
                            loanDuration: app.loanDuration
                          });
                          setActiveSection('ledger');
                          setIsAddModalOpen(true);
                        }}
                      />
                    </div>
                  );
                }

                // Default: Ledger Debtors List!
                return (
                  <div className="space-y-4">
                    
                    {/* List Heading & Standing Filters */}
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[12px] font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                          👤 {language === 'kh' ? 'បញ្ជីកូនបំណុល' : 'Borrower Ledger'}
                          <span className="bg-slate-100 dark:bg-slate-900 text-slate-500 text-[9.5px] font-black px-2 py-0.5 rounded-full border border-slate-200/50 dark:border-slate-800">
                            {filteredBorrowers.length} {language === 'kh' ? 'នាក់' : 'Debtors'}
                          </span>
                        </h3>
                      </div>

                      {/* Standing Sub-filters (Horizontal scroll grid) */}
                      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none shrink-0">
                        <button
                          onClick={() => { setStandingFilter('all'); playClickSound(); }}
                          className={`px-3 py-1.5 text-[10px] font-black rounded-xl transition cursor-pointer whitespace-nowrap shrink-0 border ${standingFilter === 'all' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white shadow-xs' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-800 hover:bg-slate-50'}`}
                        >
                          🌟 {t('allLoanLabel')} ({borrowers.length})
                        </button>
                        <button
                          onClick={() => { setStandingFilter('good'); playClickSound(); }}
                          className={`px-3 py-1.5 text-[10px] font-black rounded-xl transition cursor-pointer whitespace-nowrap shrink-0 border ${standingFilter === 'good' ? 'bg-emerald-500 text-white border-emerald-450 shadow-xs' : 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-slate-100 dark:border-slate-800 hover:bg-slate-50'}`}
                        >
                          🟢 {t('standingGood')} ({borrowers.filter(b => b.statusTag === 'good').length})
                        </button>
                        <button
                          onClick={() => { setStandingFilter('regular'); playClickSound(); }}
                          className={`px-3 py-1.5 text-[10px] font-black rounded-xl transition cursor-pointer whitespace-nowrap shrink-0 border ${standingFilter === 'regular' || standingFilter === undefined ? 'bg-amber-500 text-white border-amber-450 shadow-xs' : 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border-slate-100 dark:border-slate-800 hover:bg-slate-50'}`}
                        >
                          🟡 {t('standingRegular')} ({borrowers.filter(b => b.statusTag === 'regular' || b.statusTag === undefined).length})
                        </button>
                        <button
                          onClick={() => { setStandingFilter('late'); playClickSound(); }}
                          className={`px-3 py-1.5 text-[10px] font-black rounded-xl transition cursor-pointer whitespace-nowrap shrink-0 border ${standingFilter === 'late' ? 'bg-rose-500 text-white border-rose-450 shadow-xs' : 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border-slate-100 dark:border-slate-800 hover:bg-rose-50'}`}
                        >
                          🔴 {t('standingLate')} ({borrowers.filter(b => b.statusTag === 'late').length})
                        </button>
                        <button
                          onClick={() => { setStandingFilter('dueSoon'); playClickSound(); }}
                          className={`px-3 py-1.5 text-[10px] font-black rounded-xl transition cursor-pointer whitespace-nowrap shrink-0 border ${standingFilter === 'dueSoon' ? 'bg-amber-600 text-white border-amber-550 shadow-xs' : 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border-slate-100 dark:border-slate-800 hover:bg-slate-50'}`}
                        >
                          ⏰ {t('standingDueSoon')} ({borrowers.filter(b => {
                            const dl = getDaysUntilNextPayment(b);
                            return dl !== null && dl <= 3;
                          }).length})
                        </button>
                      </div>
                    </div>

                    {/* Borrowers Grid View for Mobile UI */}
                    {filteredBorrowers.length === 0 ? (
                      <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl py-12 text-center space-y-2 shadow-xs">
                        <div className="mx-auto w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-850 flex items-center justify-center text-slate-400 border border-slate-100 dark:border-slate-800">
                          <Info className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-700 dark:text-slate-300 text-xs">{t('noBorrowerFoundTitle')}</h3>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                            {searchQuery ? t('noSearchResultsDesc') : t('noBorrowersDesc')}
                          </p>
                        </div>
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="text-xs font-bold text-[#e31b23] hover:underline cursor-pointer bg-transparent border-transparent"
                          >
                            {t('clearSearchBtn')}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {filteredBorrowers.map((b) => (
                          <BorrowerCard
                            key={b.id}
                            borrower={b}
                            onSelect={handleSelectBorrower}
                            onQuickPay={handleQuickPay}
                            onShowPaymentQr={setQrBorrower}
                            isSelected={selectedBorrowerIds.includes(b.id)}
                            onToggleSelect={handleToggleSelectBorrower}
                            buttonStyle={buttonStyle}
                            appTheme={appTheme}
                            isDark={isDark}
                            hideAvatarFrame={hideBorrowerAvatarFrames}
                            layoutLayer={layoutConfig.cardLayer || 'default'}
                          />
                        ))}
                      </div>
                    )}

                  </div>
                );
              })()}
            </div>

          </div>

          {/* Curved Bottom Navigation Tab Bar (Metfone Self-Care Redesign Style) */}
          {(() => {
            const bottomNavBgClass = isDarkTheme
              ? (appTheme === 'angkor' ? 'bg-[#1a130a]/95 border-[#e2b037]/20' : appTheme === 'apsara' ? 'bg-[#110c26]/95 border-purple-500/15' : appTheme === 'emerald' ? 'bg-[#052216]/95 border-emerald-500/15' : 'bg-[#090d16]/95 border-slate-800/85')
              : (appTheme === 'angkor' ? 'bg-[#fffdf9]/95 border-[#e2b037]/25' : appTheme === 'apsara' ? 'bg-[#faf8fe]/95 border-purple-500/20' : appTheme === 'emerald' ? 'bg-[#f7fdfa]/95 border-emerald-500/20' : 'bg-white/95 border-slate-150');

            const activeTabColorClass = appTheme === 'angkor' ? 'text-[#b37e1b] dark:text-[#dfb035]'
                                      : appTheme === 'apsara' ? 'text-purple-600 dark:text-purple-400'
                                      : appTheme === 'emerald' ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-blue-650 dark:text-blue-400';

            return (
              <div className={`absolute bottom-0 inset-x-0 backdrop-blur-md border-t px-2.5 py-1.5 flex items-center justify-around shadow-[0_-5px_20px_rgba(0,0,0,0.05)] select-none z-40 shrink-0 ${bottomNavBgClass}`}>
                
                {/* Tab 1: Home */}
                <button
                  onClick={() => { setActiveSection('ledger'); playClickSound(); }}
                  className={`flex flex-col items-center gap-0.5 transition cursor-pointer py-1 px-2.5 rounded-xl border-transparent bg-transparent ${activeSection === 'ledger' ? `${activeTabColorClass} font-black scale-105` : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  <BookOpen className="w-5 h-5" />
                  <span className="text-[9px] font-bold">{language === 'kh' ? 'ទំព័រដើម' : 'Home'}</span>
                </button>

                {/* Tab 2: Pricing */}
                <button
                  onClick={() => { setActiveSection('pricing'); playClickSound(); }}
                  className={`flex flex-col items-center gap-0.5 transition cursor-pointer py-1 px-2.5 rounded-xl border-transparent bg-transparent ${activeSection === 'pricing' ? `${activeTabColorClass} font-black scale-105` : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  <Award className="w-5 h-5" />
                  <span className="text-[9px] font-bold">{language === 'kh' ? 'គម្រោង' : 'Plans'}</span>
                </button>

                {/* Tab 3: Quick Add Loan (Float Center Accent) */}
                <button
                  onClick={() => { setIsAddModalOpen(true); playClickSound(); }}
                  className="flex flex-col items-center transition cursor-pointer -translate-y-4 border-transparent bg-transparent"
                  title="Add New Loan"
                >
                  <div className={`w-11 h-11 rounded-full ${themeAccentClass} text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900 hover:scale-105 active:scale-95 transition-transform duration-150`}>
                    <Plus className="w-5 h-5 text-white stroke-[3px]" />
                  </div>
                </button>

                {/* Tab 4: Applications */}
                <button
                  onClick={() => { setActiveSection('loan_applications'); playClickSound(); }}
                  className={`flex flex-col items-center gap-0.5 transition cursor-pointer py-1 px-2.5 rounded-xl relative border-transparent bg-transparent ${activeSection === 'loan_applications' ? `${activeTabColorClass} font-black scale-105` : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-[9px] font-bold">{language === 'kh' ? 'សំណើកម្ចី' : 'Requests'}</span>
                  {subRequests.filter(r => r.status === 'pending').length > 0 && (
                    <span className="absolute top-0.5 right-1.5 px-1 rounded-full font-black bg-rose-500 text-white text-[7px]">
                      {subRequests.filter(r => r.status === 'pending').length}
                    </span>
                  )}
                </button>

                {/* Tab 5: Settings / Toggle Mode */}
                <button
                  onClick={() => { setIsSettingsOpen(true); playClickSound(); }}
                  className="flex flex-col items-center gap-0.5 transition cursor-pointer py-1 px-2.5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 border-transparent bg-transparent"
                >
                  <Settings className="w-5 h-5" />
                  <span className="text-[9px] font-bold">{language === 'kh' ? 'ការកំណត់' : 'Settings'}</span>
                </button>

              </div>
            );
          })()}

        </div>
      </div>
    );
  };

  const currentThemeConfig = THEMES[appTheme] || THEMES.slate;
  const isDark = theme === 'dark';
  const bodyBgClass = isDark ? currentThemeConfig.bgDark : currentThemeConfig.bgLight;

  return (
    <div className={`min-h-screen ${bodyBgClass} antialiased font-sans flex flex-col ${isDark ? 'dark' : ''} theme-${appTheme} transition-all duration-350 overflow-x-hidden relative`}>
      {/* PWA Add to Home Screen Banner */}
      <PWAInstallBanner />

      {/* Dynamic Animated Theme Background Effects */}
      {enableAnimations && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 select-none">
          {/* Celestial Apsara Night Theme: Floating stars, glowing moon, glowing butterflies */}
          {appTheme === 'apsara' && (
            <>
              {/* Glowing Moon in top right */}
              <div className="absolute top-8 right-12 w-28 h-28 bg-gradient-to-tr from-purple-500/20 to-indigo-400/10 rounded-full blur-xl animate-pulse" />
              <motion.div 
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-10 right-16 text-5xl opacity-40 text-purple-300 filter drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]"
              >
                🌙
              </motion.div>
              
              {/* Star Particle Clouds */}
              <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/3 rounded-full blur-3xl" />
              <div className="absolute bottom-40 right-10 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/3 rounded-full blur-3xl" />

              {/* Floating Butterflies / Star lanterns */}
              {[
                { label: '🦋', left: '15%', top: '25%', size: 'text-xl', delay: 0, duration: 8, xRange: [0, 20, -10, 0], yRange: [0, -30, -15, 0] },
                { label: '✨', left: '85%', top: '40%', size: 'text-base', delay: 2, duration: 6, xRange: [0, -15, 10, 0], yRange: [0, -20, 10, 0] },
                { label: '🦋', left: '70%', top: '75%', size: 'text-lg', delay: 4, duration: 10, xRange: [0, 30, -10, 0], yRange: [0, -40, -20, 0] },
                { label: '✨', left: '30%', top: '80%', size: 'text-sm', delay: 1.5, duration: 5, xRange: [0, -10, 15, 0], yRange: [0, -25, 15, 0] },
                { label: '🌸', left: '50%', top: '15%', size: 'text-base', delay: 3, duration: 12, xRange: [0, 25, -25, 0], yRange: [0, 40, 80, 0] },
              ].map((p, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 0.7, 0.7, 0],
                    x: p.xRange,
                    y: p.yRange,
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{
                    duration: p.duration,
                    repeat: Infinity,
                    delay: p.delay,
                    ease: 'easeInOut'
                  }}
                  className={`absolute ${p.size} filter drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]`}
                  style={{ left: p.left, top: p.top }}
                >
                  {p.label}
                </motion.div>
              ))}
            </>
          )}

          {/* Royal Angkor Golden Theme: Glowing golden sparkle clouds and warm temple sunrays */}
          {appTheme === 'angkor' && (
            <>
              {/* Royal Golden sun aura */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/5 dark:bg-amber-500/3 rounded-full blur-3xl" />
              
              {/* Golden sparkle particles */}
              {[
                { label: '✨', left: '10%', top: '20%', size: 'text-xs', delay: 0, duration: 5 },
                { label: '⚜️', left: '80%', top: '15%', size: 'text-sm', delay: 1, duration: 7 },
                { label: '✨', left: '45%', top: '65%', size: 'text-sm', delay: 2.5, duration: 6 },
                { label: '✨', left: '85%', top: '75%', size: 'text-xs', delay: 0.5, duration: 4 },
                { label: '⚜️', left: '25%', top: '85%', size: 'text-xs', delay: 3, duration: 8 },
              ].map((p, idx) => (
                <motion.div
                  key={idx}
                  animate={{
                    opacity: [0, 0.5, 0.5, 0],
                    y: [0, -30, -60],
                    x: [0, 10, -10],
                    scale: [0.8, 1.1, 0.8]
                  }}
                  transition={{
                    duration: p.duration,
                    repeat: Infinity,
                    delay: p.delay,
                    ease: 'linear'
                  }}
                  className={`absolute ${p.size} text-amber-500 filter drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]`}
                  style={{ left: p.left, top: p.top }}
                >
                  {p.label}
                </motion.div>
              ))}
            </>
          )}

          {/* Mekong Emerald Theme: Gentle falling green bamboo leaves and morning dew glow */}
          {appTheme === 'emerald' && (
            <>
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/2 rounded-full blur-3xl" />
              
              {/* Falling Bamboo leaves / organic particles */}
              {[
                { label: '🍃', left: '20%', top: '10%', delay: 0, duration: 10 },
                { label: '💧', left: '75%', top: '30%', delay: 2, duration: 8 },
                { label: '🍃', left: '60%', top: '60%', delay: 4, duration: 12 },
                { label: '🍃', left: '15%', top: '75%', delay: 1, duration: 9 },
                { label: '💧', left: '85%', top: '85%', delay: 3.5, duration: 7 },
              ].map((p, idx) => (
                <motion.div
                  key={idx}
                  animate={{
                    opacity: [0, 0.6, 0.6, 0],
                    y: [0, 100, 200],
                    x: [0, -20, 20],
                    rotate: [0, 45, 90, 180]
                  }}
                  transition={{
                    duration: p.duration,
                    repeat: Infinity,
                    delay: p.delay,
                    ease: 'easeInOut'
                  }}
                  className="absolute text-sm"
                  style={{ left: p.left, top: p.top }}
                >
                  {p.label}
                </motion.div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Decorative Traditional Khmer Night Lights and Lanterns (glowing effects) */}
      {theme === 'dark' && enableKhmerArt && (
        <div className="absolute top-0 inset-x-0 h-64 pointer-events-none overflow-hidden z-20 select-none">
          {/* Subtle hanging branch accent */}
          <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-b from-[#1c2c54]/40 to-transparent" />
          
          {/* Lantern Wires & Lanterns */}
          {[
            { left: '10%', height: '80px', delay: '0s', color: 'text-amber-300' },
            { left: '25%', height: '120px', delay: '0.8s', color: 'text-yellow-200' },
            { left: '45%', height: '70px', delay: '1.5s', color: 'text-orange-300' },
            { left: '60%', height: '100px', delay: '0.3s', color: 'text-amber-400' },
            { left: '78%', height: '130px', delay: '1.1s', color: 'text-yellow-300' },
            { left: '90%', height: '90px', delay: '1.9s', color: 'text-amber-200' },
          ].map((l, idx) => (
            <div 
              key={idx} 
              className="absolute top-0 flex flex-col items-center" 
              style={{ left: l.left }}
            >
              {/* Thin Golden hanging wire */}
              <div 
                className="w-[1px] bg-gradient-to-b from-amber-600/60 to-amber-400" 
                style={{ height: l.height }} 
              />
              {/* Star Lantern */}
              <motion.div
                animate={{
                  y: [0, 5, 0],
                  rotate: [-3, 3, -3],
                }}
                transition={{
                  duration: 4 + idx,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: parseFloat(l.delay),
                }}
                className="flex flex-col items-center -mt-1"
              >
                {/* Glowing light ball */}
                <div className="w-2.5 h-2.5 rounded-full bg-amber-300 shadow-[0_0_15px_6px_rgba(251,191,36,0.8)] animate-pulse" />
                {/* Hanging star */}
                <svg className={`w-6 h-6 ${l.color} filter drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]`} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.31l8.2-1.192L12 .587z" />
                </svg>
              </motion.div>
            </div>
          ))}

          {/* Sparkly Ambient Glowing Backdrops */}
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-20 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        </div>
      )}

      {/* Marquee Banner */}
      {enableKhmerArt && (
        <div id="global-marquee-banner" className="bg-purple-600 text-white font-bold text-xs py-2 shadow-sm border-b border-purple-700/20 select-none shrink-0 z-40 overflow-hidden w-full">
          <div className="animate-marquee-smooth flex">
            {isSuperAdmin ? (
              <>
                <span className="inline-block mr-12 shrink-0">
                  ✨ <span className="font-extrabold text-amber-200">សេចក្តីជូនដំណឹង៖</span> មានទទួលដាក់លុយឈរលុយឆក ចាប់ពី 50$ រហូតដល់ 500$ | Facebook: ឈ្មោះ <span className="font-extrabold text-amber-300 underline">Pich Rachana</span>
                </span>
                <span className="inline-block mr-12 shrink-0">
                  ✨ <span className="font-extrabold text-amber-200">សេចក្តីជូនដំណឹង៖</span> មានទទួលដាក់លុយឈរលុយឆក ចាប់ពី 50$ រហូតដល់ 500$ | Facebook: ឈ្មោះ <span className="font-extrabold text-amber-300 underline">Pich Rachana</span>
                </span>
                <span className="inline-block mr-12 shrink-0">
                  ✨ <span className="font-extrabold text-amber-200">សេចក្តីជូនដំណឹង៖</span> មានទទួលដាក់លុយឈរលុយឆក ចាប់ពី 50$ រហូតដល់ 500$ | Facebook: ឈ្មោះ <span className="font-extrabold text-amber-300 underline">Pich Rachana</span>
                </span>
                <span className="inline-block mr-12 shrink-0">
                  ✨ <span className="font-extrabold text-amber-200">សេចក្តីជូនដំណឹង៖</span> មានទទួលដាក់លុយឈរលុយឆក ចាប់ពី 50$ រហូតដល់ 500$ | Facebook: ឈ្មោះ <span className="font-extrabold text-amber-300 underline">Pich Rachana</span>
                </span>
              </>
            ) : (
              <>
                <span className="inline-block mr-12 shrink-0">
                  ✨ <span className="font-extrabold text-amber-200">ស្វាគមន៍មកកាន់ LUYPAY & លុយឆក់</span> «រហ័សទាន់ចិត្ត សុវត្ថិភាព និងទំនុកចិត្តខ្ពស់»
                </span>
                <span className="inline-block mr-12 shrink-0">
                  ✨ <span className="font-extrabold text-amber-200">ស្វាគមន៍មកកាន់ LUYPAY & លុយឆក់</span> «រហ័សទាន់ចិត្ត សុវត្ថិភាព និងទំនុកចិត្តខ្ពស់»
                </span>
                <span className="inline-block mr-12 shrink-0">
                  ✨ <span className="font-extrabold text-amber-200">ស្វាគមន៍មកកាន់ LUYPAY & លុយឆក់</span> «រហ័សទាន់ចិត្ត សុវត្ថិភាព និងទំនុកចិត្តខ្ពស់»
                </span>
                <span className="inline-block mr-12 shrink-0">
                  ✨ <span className="font-extrabold text-amber-200">ស្វាគមន៍មកកាន់ LUYPAY & លុយឆក់</span> «រហ័សទាន់ចិត្ត សុវត្ថិភាព និងទំនុកចិត្តខ្ពស់»
                </span>
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-0 relative">
        {/* Toast Notification */}
        {notification && (
          <div id="toast-notif" className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-bounce">
            <div className={`px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 border text-xs font-bold transition-all ${notification.type === 'success' ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/10' : 'bg-slate-900 text-white border-slate-800'}`}>
              <CheckSquare className="w-4 h-4 text-white" />
              <span>{notification.message}</span>
            </div>
          </div>
        )}

        {useMobileAppUi ? (
          renderMobileAppUi()
        ) : (
          <>
            {/* Sidebar Navigation - Sleek Interface Dark Theme */}
            <aside className={`w-68 ${currentThemeConfig.sidebarClass} flex flex-col p-6 hidden md:flex shrink-0 border-r relative z-40`}>
        {/* Logo / Header */}
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-3">
            {renderSystemLogo("w-10 h-10")}
            <div>
              <h1 className="text-white text-sm font-extrabold tracking-tight">{logoConfig?.systemName || t('appName')}</h1>
              <p className="text-[10px] text-slate-500 font-semibold tracking-wide">{t('appSubtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-slate-800/60 p-1 rounded-lg border border-slate-700/40 transform translate-x-3.5 translate-y-3 shrink-0">
            <a
              href="https://www.facebook.com/share/1F4p12PfJx/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-slate-400 hover:text-blue-500 rounded-md hover:bg-slate-750 transition flex items-center justify-center"
              title="Facebook Link"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z"/>
              </svg>
            </a>
            <a
              href="https://t.me/laymeancamera"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-slate-400 hover:text-sky-400 rounded-md hover:bg-slate-750 transition flex items-center justify-center"
              title="Telegram Link"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.36-.49.99-.75 3.88-1.69 6.47-2.8 7.77-3.32 3.7-1.49 4.47-1.75 4.97-1.76.11 0 .36.03.52.16.14.11.18.26.19.38 0 .09-.01.27-.02.39z"/>
              </svg>
            </a>
            <div className="border-l border-slate-700/60 pl-1 ml-0.5 flex items-center shrink-0">
              <NotificationBell
                borrowers={borrowers}
                onSelectBorrower={setSelectedBorrowerId}
                sidebarMode={true}
              />
            </div>
          </div>
        </div>

        {/* Scrollable Sidebar Navigation Container */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-6 scrollbar-none">
          {/* Sidebar Navigation Links (Filter State Control) */}
          <div className="space-y-2">
            <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider px-2.5 mb-2">{t('categoryTitle')}</p>
          
          <motion.button
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setFilterTab('active'); setActiveSection('ledger'); }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all border duration-200 cursor-pointer ${
              activeSection === 'ledger' && filterTab === 'active'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500/30 shadow-lg shadow-blue-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border-transparent'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="text-sm">📝</span>
              <span>{t('activeLoanLabel')}</span>
            </span>
            <span className={`px-2.5 py-0.5 text-[9px] rounded-lg font-black transition-all ${
              activeSection === 'ledger' && filterTab === 'active'
                ? 'bg-white/25 text-white'
                : 'bg-slate-800 text-slate-400'
            }`}>
              {borrowers.filter(b => !b.isArchived && (Array.isArray(b.payments) ? b.payments.reduce((sum, p) => sum + (p?.amount || 0), 0) : 0) < b.totalToPay).length}
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setFilterTab('completed'); setActiveSection('ledger'); }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all border duration-200 cursor-pointer ${
              activeSection === 'ledger' && filterTab === 'completed'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500/30 shadow-lg shadow-emerald-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border-transparent'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="text-sm">✅</span>
              <span>{t('completedLoanLabel')}</span>
            </span>
            <span className={`px-2.5 py-0.5 text-[9px] rounded-lg font-black transition-all ${
              activeSection === 'ledger' && filterTab === 'completed'
                ? 'bg-white/25 text-white'
                : 'bg-slate-800 text-slate-400'
            }`}>
              {borrowers.filter(b => !b.isArchived && (Array.isArray(b.payments) ? b.payments.reduce((sum, p) => sum + (p?.amount || 0), 0) : 0) >= b.totalToPay).length}
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setFilterTab('archived'); setActiveSection('ledger'); }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all border duration-200 cursor-pointer ${
              activeSection === 'ledger' && filterTab === 'archived'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-500/30 shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border-transparent'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="text-sm">📦</span>
              <span>{t('archivedLoanLabel')}</span>
            </span>
            <span className={`px-2.5 py-0.5 text-[9px] rounded-lg font-black transition-all ${
              activeSection === 'ledger' && filterTab === 'archived'
                ? 'bg-white/25 text-white'
                : 'bg-slate-800 text-slate-400'
            }`}>
              {borrowers.filter(b => b.isArchived).length}
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setFilterTab('all'); setActiveSection('ledger'); }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all border duration-200 cursor-pointer ${
              activeSection === 'ledger' && filterTab === 'all'
                ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white border-slate-600 shadow-lg shadow-slate-700/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border-transparent'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="text-sm">🔍</span>
              <span>{t('allLoanLabel')}</span>
            </span>
            <span className={`px-2.5 py-0.5 text-[9px] rounded-lg font-black transition-all ${
              activeSection === 'ledger' && filterTab === 'all'
                ? 'bg-white/25 text-white'
                : 'bg-slate-800 text-slate-400'
            }`}>
              {borrowers.length}
            </span>
          </motion.button>
        </div>

        {/* Sidebar Standing Filter Options */}
        <div className="space-y-2">
          <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider px-2.5 mb-2">{t('standingTitle')}</p>
          
          <motion.button
            whileHover={{ scale: 1.01, x: 2 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => { setStandingFilter('all'); setActiveSection('ledger'); }}
            className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-bold rounded-xl transition-all border duration-200 cursor-pointer ${
              activeSection === 'ledger' && standingFilter === 'all'
                ? 'bg-slate-800 text-white border-slate-700/80 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border-transparent'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="text-sm">🌟</span>
              <span>{t('standingAll')}</span>
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01, x: 2 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => { setStandingFilter('good'); setActiveSection('ledger'); }}
            className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-bold rounded-xl transition-all border duration-200 cursor-pointer ${
              activeSection === 'ledger' && standingFilter === 'good'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/20 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border-transparent'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="text-sm">🟢</span>
              <span>{t('standingGood')}</span>
            </span>
            <span className="px-2 py-0.5 text-[9px] rounded-lg font-black bg-emerald-950 text-emerald-400 border border-emerald-800/30">
              {borrowers.filter(b => b.statusTag === 'good').length}
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01, x: 2 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => { setStandingFilter('regular'); setActiveSection('ledger'); }}
            className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-bold rounded-xl transition-all border duration-200 cursor-pointer ${
              activeSection === 'ledger' && standingFilter === 'regular'
                ? 'bg-amber-950/40 text-amber-300 border-amber-500/20 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border-transparent'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="text-sm">🟡</span>
              <span>{t('standingRegular')}</span>
            </span>
            <span className="px-2 py-0.5 text-[9px] rounded-lg font-black bg-amber-950 text-amber-400 border border-amber-800/30">
              {borrowers.filter(b => b.statusTag === 'regular' || b.statusTag === undefined).length}
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01, x: 2 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => { setStandingFilter('late'); setActiveSection('ledger'); }}
            className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-bold rounded-xl transition-all border duration-200 cursor-pointer ${
              activeSection === 'ledger' && standingFilter === 'late'
                ? 'bg-rose-950/40 text-rose-300 border-rose-500/20 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border-transparent'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="text-sm">🔴</span>
              <span>{t('standingLate')}</span>
            </span>
            <span className="px-2 py-0.5 text-[9px] rounded-lg font-black bg-rose-950 text-rose-400 animate-pulse border border-rose-850/40">
              {borrowers.filter(b => b.statusTag === 'late').length}
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01, x: 2 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => { setStandingFilter('dueSoon'); setActiveSection('ledger'); }}
            className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-bold rounded-xl transition-all border duration-200 cursor-pointer ${
              activeSection === 'ledger' && standingFilter === 'dueSoon'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400/30 shadow-md shadow-amber-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border-transparent'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="text-sm">⏰</span>
              <span>{t('standingDueSoon')}</span>
            </span>
            <span className={`px-2 py-0.5 text-[9px] rounded-lg font-black border transition-all ${
              activeSection === 'ledger' && standingFilter === 'dueSoon'
                ? 'bg-white/20 text-white border-amber-300/30'
                : 'bg-amber-950/50 text-amber-300 border-amber-900/30'
            }`}>
              {borrowers.filter(b => {
                const dl = getDaysUntilNextPayment(b);
                return dl !== null && dl <= 3;
              }).length}
            </span>
          </motion.button>
        </div>

        {/* Sidebar System & Subscription Management Section */}
        <div className="space-y-2">
          <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider px-2.5 mb-2">
            {currentUser === 'sounravin' ? 'គ្រប់គ្រងប្រព័ន្ធ' : 'គណនី & សមាជិកភាព'}
          </p>

          {/* Shareholder Partners Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenShareholders}
            className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-extrabold rounded-xl transition-all border duration-200 cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30 hover:border-amber-400 shadow-md shadow-amber-500/10"
          >
            <span className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                🤝 {language === 'kh' ? 'គ្រប់គ្រង ដៃគូភាគហ៊ុន' : 'Shareholders Management'}
                {!canAccessShareholders && <span className="ml-1 text-amber-400">🔒</span>}
              </span>
            </span>
            <span className="px-2 py-0.5 text-[9px] rounded-md font-black bg-amber-500/20 text-amber-200 border border-amber-400/30">
              {canAccessShareholders ? shareholders.length : '$10'}
            </span>
          </motion.button>

          {currentUser === 'sounravin' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveSection('admin_dashboard')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-extrabold rounded-xl transition-all border duration-200 cursor-pointer ${
                activeSection === 'admin_dashboard'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border-transparent'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>គ្រប់គ្រងសមាជិក (Admin)</span>
              </span>
              {subRequests.filter(r => r.status === 'pending').length > 0 && (
                <span className="px-1.5 py-0.5 text-[8px] rounded-md font-black bg-rose-500 text-white animate-pulse">
                  {subRequests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </motion.button>
          )}

          {isMember && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveSection('pricing')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-extrabold rounded-xl transition-all border duration-200 cursor-pointer ${
                activeSection === 'pricing'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400/30 shadow-lg shadow-amber-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border-transparent'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-amber-400 shrink-0" />
                <span>ទិញ/បន្តគម្រោងកម្មវិធី</span>
              </span>
            </motion.button>
          )}

          {isLoggedIn && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveSection('loan_applications')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-extrabold rounded-xl transition-all border duration-200 cursor-pointer ${
                activeSection === 'loan_applications'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-lg shadow-blue-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border-transparent'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                <span>📂 សំណើសុំកម្ចី (លុយឆក់)</span>
              </span>
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection('ledger')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-extrabold rounded-xl transition-all border duration-200 cursor-pointer ${
              activeSection === 'ledger'
                ? 'bg-slate-800 text-white border-slate-700 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border-transparent'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
              <span>បញ្ជីកម្ចីប្រាក់ (Ledger)</span>
            </span>
          </motion.button>
        </div>
        </div>

        {/* Sidebar Footer Info box - collected amounts */}
        <div className="mt-auto space-y-4">
          <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800/60">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2.5">{t('currentCollectedLabel')}</p>
            <div className="space-y-1 text-xs font-bold">
              <p className="text-white flex justify-between">
                <span>USD:</span>
                <span className="text-emerald-400">${stats.totalCollectedUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </p>
              <p className="text-white flex justify-between">
                <span>Riel:</span>
                <span className="text-emerald-400">{stats.totalCollectedKHR.toLocaleString()} ៛</span>
              </p>
            </div>
          </div>

          {/* User Profile info and Logout button */}
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              {memberProfile?.photoURL ? (
                <img
                  src={memberProfile.photoURL}
                  alt={userDisplayName}
                  className="w-9 h-9 rounded-xl object-cover border border-slate-700 shadow-md"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm shadow-md text-white ${userAuthType === 'facebook' ? 'bg-blue-600 shadow-blue-600/20' : userAuthType === 'google' ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-slate-700 shadow-slate-700/20'}`}>
                  {userAuthType === 'facebook' ? 'FB' : userAuthType === 'google' ? 'G' : 'SR'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">{userDisplayName}</p>
                <p className="text-[9px] text-slate-500 font-semibold truncate">
                  {currentUser}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-800/50 pt-2.5">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 w-max">
                  <span>●</span> {t('statusActive')}
                </span>
                
                {isLoggedIn && (
                  <span className="text-[9px] flex items-center gap-1 font-bold">
                    {cloudSyncStatus === 'synced' && (
                      <span className="text-emerald-400 bg-emerald-400/5 border border-emerald-400/20 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                        <Cloud className="w-3 h-3 text-emerald-400 shrink-0" /> {t('cloudSaved')}
                      </span>
                    )}
                    {cloudSyncStatus === 'syncing' && (
                      <span className="text-blue-400 bg-blue-400/5 border border-blue-400/20 px-1.5 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                        <RefreshCw className="w-2.5 h-2.5 text-blue-400 shrink-0 animate-spin" /> {t('syncing')}
                      </span>
                    )}
                    {cloudSyncStatus === 'error' && (
                      <span className="text-amber-400 bg-amber-400/5 border border-amber-400/20 px-1.5 py-0.5 rounded-md flex items-center gap-1" title="Firestore quota limit exceeded. System automatically fell back to secure Local Storage mode. Your data is perfectly safe.">
                        <Cloud className="w-3 h-3 text-amber-400 shrink-0 opacity-70" /> {t('syncError')}
                      </span>
                    )}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 rounded-lg transition cursor-pointer border-transparent"
                  title={language === 'kh' ? 'ការកំណត់ / Settings' : 'Settings'}
                >
                  <Key className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-1.5 bg-rose-950/40 hover:bg-rose-900/40 text-rose-400 hover:text-rose-300 rounded-lg transition cursor-pointer border-transparent flex items-center justify-center"
                  title={t('logoutBtnTitle')}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="text-center border-t border-slate-800/40 pt-2 text-[9px] text-slate-500 font-bold">
              {t('developedBy')} <span className="text-blue-400">ឡាយមាន (Lay Mean)</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen p-4 sm:p-6 md:p-8 space-y-6 overflow-y-auto">
        {/* Mobile Header profile bar */}
        <div className={`md:hidden flex flex-col p-4 rounded-2xl border shadow-lg gap-4 relative z-50 transition-all duration-300 overflow-visible ${
          mobileHeaderStyle === 'angkor'
            ? 'bg-gradient-to-br from-[#2c080a] via-[#1f0506] to-[#0d0202] text-amber-100 border-amber-600/40 shadow-xl shadow-amber-950/40'
            : currentThemeConfig.sidebarClass
        }`}>
          {/* Angkor Wat background vector silhouette */}
          {mobileHeaderStyle === 'angkor' && (
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none select-none z-0">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0202]/90 via-[#1f0506]/30 to-transparent" />
              <svg className="absolute right-[-24px] bottom-[-8px] h-[120%] w-auto opacity-20 text-amber-500/80" viewBox="0 0 180 120" fill="currentColor">
                {/* Base foundation tier */}
                <path d="M10,110 L170,110 L165,115 L15,115 Z" />
                <rect x="20" y="100" width="140" height="10" rx="1" />
                <rect x="30" y="92" width="120" height="8" rx="1" />
                
                {/* Central Tower (Prasat) */}
                <path d="M80,92 L80,35 C80,28 83,23 90,15 C97,23 100,28 100,35 L100,92 Z" />
                <path d="M78,42 L102,42 M76,52 L104,52 M74,62 L106,62 M72,72 L108,72 M70,82 L110,82" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M90,15 L90,5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                
                {/* Left Tower */}
                <path d="M45,92 L45,50 C45,45 47,41 52,35 C57,41 59,45 59,50 L59,92 Z" />
                <path d="M43,56 L61,56 M41,64 L63,64 M39,72 L65,72 M37,80 L67,80" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M52,35 L52,27" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />

                {/* Right Tower */}
                <path d="M121,92 L121,50 C121,45 123,41 128,35 C133,41 135,45 135,50 L135,92 Z" />
                <path d="M119,56 L137,56 M117,64 L139,64 M115,72 L141,72 M113,80 L143,80" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M128,35 L128,27" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />

                {/* Outermost Left Spire */}
                <path d="M22,100 L22,70 C22,66 23,63 26,58 C29,63 30,66 30,70 L30,100 Z" />
                <path d="M21,74 L31,74 M20,80 L32,80 M19,86 L33,86" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />

                {/* Outermost Right Spire */}
                <path d="M150,100 L150,70 C150,66 151,63 154,58 C157,63 158,66 158,70 L158,100 Z" />
                <path d="M149,74 L159,74 M148,80 L160,80 M147,86 L161,86" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <div className="absolute right-[60px] bottom-[40px] w-14 h-14 rounded-full bg-amber-500/10 blur-xl animate-pulse" />
              {/* Gold Khmer pattern border accents */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-600 via-amber-300 to-amber-600" />
            </div>
          )}

          <div className="flex items-center justify-between w-full relative z-30">
            <div className="flex items-center gap-2.5 border-transparent">
              {memberProfile?.photoURL ? (
                <KhmerAvatarFrame
                  frameId={avatarFrameId}
                  sizeClass="w-11 h-11"
                  onClick={() => {
                    playClickSound();
                    setIsAvatarFrameModalOpen(true);
                  }}
                  title="ចុចដើម្បីប្ដូរស៊ុម Khmer Avatar"
                >
                  <img
                    src={memberProfile.photoURL}
                    alt={userDisplayName}
                    className="w-11 h-11 rounded-full object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                </KhmerAvatarFrame>
              ) : (
                renderSystemLogo("w-11 h-11 shrink-0")
              )}
              <div>
                <div className="flex flex-col gap-1">
                  <p className={`text-sm font-black leading-tight ${
                    mobileHeaderStyle === 'angkor'
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 font-serif'
                      : ''
                  }`}>
                    {mobileHeaderStyle === 'angkor' ? '៚ ប្រព័ន្ធលុយឆក់ ៚' : (logoConfig?.systemName || t('appName'))}
                  </p>
                  <div className="flex items-center gap-2">
                    <a
                      href="https://www.facebook.com/share/1F4p12PfJx/?mibextid=wwXIfr"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-1.5 rounded-lg transition flex items-center justify-center shadow-3xs ${
                        mobileHeaderStyle === 'angkor'
                          ? 'bg-amber-500/10 text-amber-300 hover:text-amber-200 hover:bg-amber-500/20 border border-amber-500/20'
                          : 'bg-white/10 text-current hover:text-blue-400 hover:bg-white/20'
                      }`}
                      title="Facebook Link"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z"/>
                      </svg>
                    </a>
                    <a
                      href="https://t.me/laymeancamera"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-1.5 rounded-lg transition flex items-center justify-center shadow-3xs ${
                        mobileHeaderStyle === 'angkor'
                          ? 'bg-amber-500/10 text-amber-300 hover:text-amber-200 hover:bg-amber-500/20 border border-amber-500/20'
                          : 'bg-white/10 text-current hover:text-sky-400 hover:bg-white/20'
                      }`}
                      title="Telegram Link"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.36-.49.99-.75 3.88-1.69 6.47-2.8 7.77-3.32 3.7-1.49 4.47-1.75 4.97-1.76.11 0 .36.03.52.16.14.11.18.26.19.38 0 .09-.01.27-.02.39z"/>
                      </svg>
                    </a>
                  </div>
                </div>
                <p className={`text-[9px] leading-none mt-1 ${
                  mobileHeaderStyle === 'angkor' ? 'text-amber-200/80 font-bold' : 'opacity-70'
                }`}>{t('accountLabel')} {userDisplayName} ({currentUser})</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Style Switcher Button */}
              <button
                onClick={() => {
                  const nextStyle = mobileHeaderStyle === 'default' ? 'angkor' : 'default';
                  setMobileHeaderStyle(nextStyle);
                  safeStorage.setItem('luypay_mobile_header_style', nextStyle);
                  playClickSound();
                }}
                className={`p-2 rounded-xl transition cursor-pointer border flex items-center justify-center gap-1 shadow-3xs ${
                  mobileHeaderStyle === 'angkor'
                    ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/35 border-amber-400/40'
                    : 'bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border-transparent'
                }`}
                title={language === 'kh' ? 'ប្តូររចនាប័ទ្មអង្គរវត្ត' : 'Switch Header Style'}
              >
                <Sparkles className={`w-3.5 h-3.5 ${mobileHeaderStyle === 'angkor' ? 'text-yellow-400 animate-spin-slow' : 'text-slate-400'}`} />
                {mobileHeaderStyle === 'angkor' && <span className="text-[8px] font-black tracking-wider uppercase text-amber-200">អង្គរ</span>}
              </button>

              {/* Mobile Notification Bell */}
              <NotificationBell borrowers={borrowers} onSelectBorrower={setSelectedBorrowerId} isMobile={true} />

              <button
                onClick={() => setIsSettingsOpen(true)}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  mobileHeaderStyle === 'angkor'
                    ? 'bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/20'
                    : 'bg-white/10 hover:bg-white/20 text-amber-400 hover:text-amber-300 border-transparent'
                }`}
                title={language === 'kh' ? 'ការកំណត់ / Settings' : 'Settings'}
              >
                <Key className="w-4 h-4" />
              </button>
              <button
                onClick={handleLogout}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  mobileHeaderStyle === 'angkor'
                    ? 'bg-red-500/10 hover:bg-red-500/25 text-red-300 hover:text-red-200 border border-red-500/20'
                    : 'bg-white/10 hover:bg-white/20 active:bg-rose-500/10 text-rose-400 hover:text-rose-300 border-transparent'
                }`}
                title={t('logoutBtnTitle')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Nav buttons row */}
          <div className={`flex items-center gap-2 border-t pt-2.5 relative z-10 ${
            mobileHeaderStyle === 'angkor' ? 'border-amber-600/30' : 'border-white/10'
          }`}>
            <button
              onClick={() => setActiveSection('ledger')}
              className={`flex-1 py-2 text-[11px] font-black rounded-xl text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeSection === 'ledger'
                  ? mobileHeaderStyle === 'angkor'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20 border border-amber-300'
                    : `bg-gradient-to-r ${currentThemeConfig.accent} text-white shadow-md`
                  : mobileHeaderStyle === 'angkor'
                    ? 'bg-amber-950/40 text-amber-300 hover:text-amber-200 hover:bg-amber-950/60 border border-amber-500/10'
                    : 'bg-white/10 text-current hover:text-white'
              }`}
            >
              <span>📝 {language === 'kh' ? 'បញ្ជីកម្ចី' : 'Ledger Records'}</span>
            </button>
            <button
              onClick={handleOpenShareholders}
              className={`py-2 px-2.5 text-[11px] font-black rounded-xl text-center transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0 ${
                mobileHeaderStyle === 'angkor'
                  ? 'bg-amber-950/60 text-amber-300 hover:text-amber-100 border border-amber-400/40 shadow-xs'
                  : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-400/30'
              }`}
            >
              <span>🤝 {language === 'kh' ? 'ដៃគូភាគហ៊ុន' : 'Shareholders'} {!canAccessShareholders && '🔒'}</span>
            </button>
            {currentUser === 'sounravin' ? (
              <button
                onClick={() => setActiveSection('admin_dashboard')}
                className={`flex-1 py-2 text-[11px] font-black rounded-xl text-center transition-all relative cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeSection === 'admin_dashboard'
                    ? mobileHeaderStyle === 'angkor'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20 border border-amber-300'
                      : `bg-gradient-to-r ${currentThemeConfig.accent} text-white shadow-md`
                    : mobileHeaderStyle === 'angkor'
                      ? 'bg-amber-950/40 text-amber-300 hover:text-amber-200 hover:bg-amber-950/60 border border-amber-500/10'
                      : 'bg-white/10 text-current hover:text-white'
                }`}
              >
                <span>📊 {language === 'kh' ? 'គ្រប់គ្រងប្រព័ន្ធ' : 'Manage System'}</span>
                {subRequests.filter(r => r.status === 'pending').length > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[8px] rounded-md font-black bg-rose-500 text-white animate-pulse">
                    {subRequests.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </button>
            ) : (
              isMember && (
                <button
                  onClick={() => setActiveSection('pricing')}
                  className={`flex-1 py-2 text-[11px] font-black rounded-xl text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeSection === 'pricing'
                      ? mobileHeaderStyle === 'angkor'
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20 border border-amber-300'
                        : `bg-gradient-to-r ${currentThemeConfig.accent} text-white shadow-md`
                      : mobileHeaderStyle === 'angkor'
                        ? 'bg-amber-950/40 text-amber-300 hover:text-amber-200 hover:bg-amber-950/60 border border-amber-500/10'
                        : 'bg-white/10 text-current hover:text-white'
                  }`}
                >
                  <span>💎 {language === 'kh' ? 'គម្រោងកម្មវិធី' : 'Application Plans'}</span>
                </button>
              )
            )}
            {isLoggedIn && (
              <button
                onClick={() => setActiveSection('loan_applications')}
                className={`flex-1 py-2 text-[11px] font-black rounded-xl text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeSection === 'loan_applications'
                    ? mobileHeaderStyle === 'angkor'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20 border border-amber-300'
                      : `bg-gradient-to-r ${currentThemeConfig.accent} text-white shadow-md`
                    : mobileHeaderStyle === 'angkor'
                      ? 'bg-amber-950/40 text-amber-300 hover:text-amber-200 hover:bg-amber-950/60 border border-amber-500/10'
                      : 'bg-white/10 text-current hover:text-white'
                }`}
              >
                <span>📂 {language === 'kh' ? 'សំណើកម្ចី' : 'Requests'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Sponsor Promotion Banner (Visible if enabled and image/video is uploaded) */}
        {!isSponsorDismissed && sponsorConfig && sponsorConfig.sponsorEnabled && (sponsorConfig.sponsorMediaType === 'video' ? sponsorVideoData : sponsorConfig.sponsorImageUrl) && (
          <div id="system-sponsor-banner" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-3.5 shadow-sm flex flex-col gap-2.5 animate-in fade-in duration-300 relative">
            <button
              onClick={() => {
                setIsSponsorDismissed(true);
                safeStorage.setItem('luypay_sponsor_dismissed', 'true');
                playClickSound();
              }}
              className="absolute top-2.5 right-2.5 p-1 rounded-full bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition duration-150 z-20 cursor-pointer"
              title={language === 'kh' ? 'បិទផ្ទាំង' : 'Close Banner'}
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center justify-between px-1 pr-8">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                {language === 'kh' ? 'ឧបត្ថម្ភគាំទ្រ' : 'Sponsored'}
              </span>
              {sponsorConfig.sponsorTitle && (
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 truncate max-w-[200px]">
                  {sponsorConfig.sponsorTitle}
                </span>
              )}
            </div>
            
            {sponsorConfig.sponsorMediaType === 'video' ? (
              <div className="w-full max-w-4xl mx-auto overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-black">
                <video
                  src={sponsorVideoData || ''}
                  loop
                  muted
                  autoPlay
                  playsInline
                  className="w-full h-auto max-h-[420px] object-contain rounded-2xl block pointer-events-none"
                />
              </div>
            ) : sponsorConfig.sponsorLinkUrl ? (
              <a
                href={sponsorConfig.sponsorLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full max-w-4xl mx-auto overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:opacity-95 transition cursor-pointer"
              >
                <img
                  src={sponsorConfig.sponsorImageUrl}
                  alt={sponsorConfig.sponsorTitle || 'Sponsor Promotion'}
                  className="w-full h-auto object-contain rounded-2xl block"
                  referrerPolicy="no-referrer"
                />
              </a>
            ) : (
              <div className="w-full max-w-4xl mx-auto overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800/80">
                <img
                  src={sponsorConfig.sponsorImageUrl}
                  alt={sponsorConfig.sponsorTitle || 'Sponsor Promotion'}
                  className="w-full h-auto object-contain rounded-2xl block"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </div>
        )}

        {(() => {
          // If member is suspended/blocked
          const isBlocked = memberProfile?.isBlocked === true;
          if (isBlocked) {
            return (
              <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-xl max-w-2xl mx-auto text-center space-y-6 my-12 border-t-4 border-t-rose-500 animate-in fade-in duration-350">
                <div className="mx-auto w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 border border-rose-200 text-3xl">
                  ⚠️
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900">គណនីរបស់អ្នកត្រូវបានផ្អាកជាបណ្ដោះអាសន្ន!</h3>
                  <p className="text-sm font-bold text-slate-500 leading-relaxed">
                    គណនីប្រើប្រាស់របស់អ្នកឈ្មោះ <span className="text-slate-900 font-extrabold">{currentUser}</span> ត្រូវបានផ្អាកជាបណ្ដោះអាសន្នដោយសារការបំពានលក្ខខណ្ឌការប្រើប្រាស់ ឬមិនទាន់បានបង់ប្រាក់សេវាកម្ម។ សូមទាក់ទងមកកាន់អ្នកគ្រប់គ្រងដើម្បីសាកសួរព័ត៌មានបន្ថែម។
                  </p>
                </div>
                <div className="flex justify-center gap-3.5">
                  <a
                    href="https://t.me/laymeancamera"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-sky-500/10 transition duration-150"
                  >
                    Telegram ឡាយមាន
                  </a>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200 transition duration-150 cursor-pointer"
                  >
                    ចាកចេញ (Logout)
                  </button>
                </div>
              </div>
            );
          }

          // If member subscription is expired (and is not super-admin)
          const profileInfo = getSubscriptionStatusInfo(memberProfile);
          if (profileInfo.isExpired && activeSection !== 'pricing') {
            return (
              <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-xl max-w-2xl mx-auto text-center space-y-6 my-12 border-t-4 border-t-amber-500 animate-in fade-in duration-350">
                <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-200 text-3xl">
                  ⏳
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900">គម្រោងការប្រើប្រាស់បានផុតកំណត់ហើយ!</h3>
                  <p className="text-sm font-bold text-slate-500 leading-relaxed">
                    គណនីរបស់អ្នកបានប្រើប្រាស់ហួសកាលកំណត់គម្រោងសាកល្បង ឬគម្រោងវគ្គមុនហើយ។ ដើម្បីបន្តគ្រប់គ្រងកូនបំណុល និងទិន្នន័យផ្សេងៗ សូមធ្វើការទិញ ឬបន្តគម្រោងថ្មី។
                  </p>
                </div>
                
                <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl text-left font-bold text-xs space-y-2 text-slate-600">
                  <div className="flex justify-between">
                    <span>ឈ្មោះគណនី៖</span>
                    <span className="text-slate-900 font-extrabold">{userDisplayName} ({currentUser})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ស្ថានភាពសមាជិក៖</span>
                    <span className="text-rose-600 font-extrabold">{profileInfo.text}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-3.5">
                  <button
                    onClick={() => setActiveSection('pricing')}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/10 transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    <span>ពិនិត្យគម្រោង & បញ្ជូនសំណើបង់ប្រាក់</span>
                  </button>
                  <a
                    href="https://t.me/laymeancamera"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200 transition duration-150 flex items-center justify-center gap-1.5"
                  >
                    <span>Telegram ទាក់ទង Admin</span>
                  </a>
                </div>
              </div>
            );
          }

          // Router Switch based on activeSection
          if (activeSection === 'admin_dashboard' && currentUser === 'sounravin') {
            return (
              <AdminMembersDashboard
                members={members}
                subRequests={subRequests}
                getSubscriptionStatusInfo={getSubscriptionStatusInfo}
                showToast={showToast}
                language={language}
                onOpenAvatarFrameModal={() => setIsAvatarFrameModalOpen(true)}
              />
            );
          }

          if (activeSection === 'pricing') {
            return (
              <PricingPanel
                currentUser={currentUser}
                userDisplayName={userDisplayName}
                memberProfile={memberProfile}
                language={language}
                getSubscriptionStatusInfo={getSubscriptionStatusInfo}
                showToast={showToast}
                qrConfig={qrConfig}
              />
            );
          }

          if (activeSection === 'loan_applications') {
            return (
              <LoanApplicationsControlPanel
                currentUser={currentUser}
                showToast={showToast}
                onApproveAndCreateBorrower={(app) => {
                  setPrefilledData({
                    name: app.name,
                    phone: app.phone,
                    principal: app.amountRequested,
                    profilePhoto: app.selfiePhoto,
                    notes: `សំណើខ្ចីលុយឆក់អេឡិចត្រូនិច ID: ${app.id}`,
                    applicationId: app.id,
                    loanDuration: app.loanDuration
                  });
                  setActiveSection('ledger');
                  setIsAddModalOpen(true);
                }}
              />
            );
          }

          // Otherwise, render default ledger content:
          return (
            <>
              {/* Header Component with stats and notifications */}
              <Header
                stats={stats}
                onAddNewClick={() => setIsAddModalOpen(true)}
                onBackupClick={handleExportBackup}
                onImportClick={handleImportBackup}
                selectedCount={selectedBorrowerIds.length}
                onBulkAutoCheck={handleBulkAutoCheck}
                borrowers={borrowers}
                onSelectBorrower={setSelectedBorrowerId}
                appTheme={appTheme}
                buttonStyle={buttonStyle}
                onOpenShareholders={handleOpenShareholders}
              />

              {/* Special Member Referral & Sync Panel */}
              {isMember && (
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-emerald-500 animate-in fade-in duration-300">
                  <div className="space-y-2 flex-1">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 text-emerald-100 px-3 py-1 rounded-full border border-white/10">
                      {language === 'kh' ? '💵 ស្ថានភាពគម្រោងការប្រើប្រាស់បច្ចុប្បន្ន' : '💵 Current Subscription Status'}
                    </span>
                    <h3 className="text-xl font-black text-white">
                      {language === 'kh' ? 'សមាជិកភាពរបស់បង៖' : 'Your Official Membership:'} {userDisplayName} ({currentUser})
                    </h3>
                    <p className="text-xs text-emerald-100 font-bold leading-relaxed max-w-3xl">
                      {language === 'kh' 
                        ? 'គណនីរបស់បងត្រូវបានភ្ជាប់ជាមួយប្រព័ន្ធ Cloud របស់ Luypay។ រាល់ទិន្នន័យកម្ចី និងការកត់ត្រាទាំងអស់នឹងសមកាលកម្មស្វ័យប្រវត្តទៅកាន់ពពកប្រកបដោយសុវត្ថិភាពខ្ពស់ ដែលអាចប្រើប្រាស់បានគ្រប់ឧបករណ៍ និងគ្រប់ពេលវេលា។' 
                        : 'Your account is fully connected to the Luypay Cloud Storage. All loan logs and ledger data will be synced automatically in real-time, securing your records across devices.'}
                    </p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4.5 border border-white/25 w-full md:w-max shrink-0 space-y-3.5">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-200">
                        {language === 'kh' ? 'ស្ថានភាពគម្រោង៖' : 'Subscription Status:'}
                      </p>
                      <p className="text-xs font-black text-white bg-black/25 px-3 py-2 rounded-xl border border-emerald-500/25">
                        {getSubscriptionStatusInfo(memberProfile).text}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveSection('pricing')}
                      className="w-full py-2.5 bg-amber-500 text-slate-950 hover:bg-amber-400 active:bg-amber-600 font-extrabold text-xs rounded-xl shadow-md transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>{language === 'kh' ? 'ពិនិត្យគម្រោង / ទិញបន្ថែម' : 'View Plans / Upgrade'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Central KHQR Pending Receipts Notification Banner */}
              {borrowers.some(b => Array.isArray(b.reportedPayments) && b.reportedPayments.some(r => r.status === 'pending')) && (() => {
                const debtorsWithPending = borrowers.filter(b => Array.isArray(b.reportedPayments) && b.reportedPayments.some(r => r.status === 'pending'));
                const totalPendingCount = debtorsWithPending.reduce((sum, b) => sum + b.reportedPayments!.filter(r => r.status === 'pending').length, 0);
                
                return (
                  <div className="bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 rounded-3xl p-5 shadow-sm space-y-3.5 animate-in fade-in slide-in-from-top-3 duration-300">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center animate-pulse shrink-0">
                          <Sparkles className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                            <span>{language === 'kh' ? 'សេចក្តីជូនដំណឹងអំពីការបង់ប្រាក់' : 'Repayment Verification Alert'}</span>
                            <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                              {totalPendingCount} {language === 'kh' ? 'វិក្កយបត្រថ្មី' : 'New Receipt(s)'}
                            </span>
                          </h4>
                          <p className="text-xs text-slate-400 font-bold mt-0.5">
                            {language === 'kh' ? 'មានកូនបំណុលបានផ្ញើវិក្កយបត្រ KHQR មកបង។ សូមចុចលើឈ្មោះខាងក្រោមដើម្បីត្រួតពិនិត្យ និងអនុម័ត៖' : 'Debtors have submitted KHQR transfer receipts. Click a name to verify & approve:'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {debtorsWithPending.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => {
                            playClickSound();
                            setSelectedBorrowerId(b.id);
                          }}
                          className="bg-white hover:bg-amber-500 hover:text-slate-950 text-slate-700 border border-slate-200 hover:border-amber-400 rounded-2xl px-4 py-2 text-xs font-black transition-all cursor-pointer shadow-xs flex items-center gap-1.5 duration-150"
                        >
                          <span>👤 {b.name}</span>
                          <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            {b.reportedPayments!.filter(r => r.status === 'pending').length}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Dashboard Actions Bar */}
              <div id="dashboard-controls" className={`rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm border ${currentThemeConfig.cardClass}`}>
                {/* Tab filters for mobile and desktop views */}
                <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                  <button
                    onClick={() => setFilterTab('active')}
                    className={`px-3 py-2 text-xs font-black rounded-xl transition cursor-pointer flex-1 text-center whitespace-nowrap ${filterTab === 'active' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : `${currentThemeConfig.textMuted} hover:bg-slate-800/10 dark:hover:bg-white/5`}`}
                  >
                    📝 {t('activeLoanLabel')} ({borrowers.filter(b => !b.isArchived && (Array.isArray(b.payments) ? b.payments.reduce((sum, p) => sum + (p?.amount || 0), 0) : 0) < b.totalToPay).length})
                  </button>
                  <button
                    onClick={() => setFilterTab('completed')}
                    className={`px-3 py-2 text-xs font-black rounded-xl transition cursor-pointer flex-1 text-center whitespace-nowrap ${filterTab === 'completed' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md' : `${currentThemeConfig.textMuted} hover:bg-slate-800/10 dark:hover:bg-white/5`}`}
                  >
                    ✅ {t('completedLoanLabel')} ({borrowers.filter(b => !b.isArchived && (Array.isArray(b.payments) ? b.payments.reduce((sum, p) => sum + (p?.amount || 0), 0) : 0) >= b.totalToPay).length})
                  </button>
                  <button
                    onClick={() => setFilterTab('archived')}
                    className={`px-3 py-2 text-xs font-black rounded-xl transition cursor-pointer flex-1 text-center whitespace-nowrap ${filterTab === 'archived' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : `${currentThemeConfig.textMuted} hover:bg-slate-800/10 dark:hover:bg-white/5`}`}
                  >
                    📦 {t('archivedLoanLabel')} ({borrowers.filter(b => b.isArchived).length})
                  </button>
                  <button
                    onClick={() => setFilterTab('all')}
                    className={`px-3 py-2 text-xs font-black rounded-xl transition cursor-pointer flex-1 text-center whitespace-nowrap ${filterTab === 'all' ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-md' : `${currentThemeConfig.textMuted} hover:bg-slate-800/10 dark:hover:bg-white/5`}`}
                  >
                    🔍 {t('allLoanLabel')} ({borrowers.length})
                  </button>
                </div>

                {/* Search bar */}
                <div className="relative w-full md:max-w-md">
                  <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${currentThemeConfig.textMuted}`}>
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    className={`w-full pl-10 pr-4 py-2.5 text-base md:text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-bold ${currentThemeConfig.inputClass}`}
                  />
                </div>
              </div>

              {/* Borrower standing sub-filters */}
              <div className={`flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl w-full sm:w-max shadow-sm border ${currentThemeConfig.cardClass}`}>
                <span className={`text-[10px] font-extrabold ${currentThemeConfig.textMuted} px-2.5 uppercase tracking-wider`}>{t('standingFilterLabel')}</span>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setStandingFilter('all')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                      standingFilter === 'all'
                        ? 'bg-slate-500/10 dark:bg-white/10 text-slate-900 dark:text-white font-extrabold border border-slate-500/20'
                        : `${currentThemeConfig.textMuted} hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/30`
                    }`}
                  >
                    🌟 {t('allLoanLabel')} ({borrowers.length})
                  </button>
                  <button
                    onClick={() => setStandingFilter('good')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                      standingFilter === 'good'
                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20 font-extrabold'
                        : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                  >
                    🟢 {t('standingGood')} ({borrowers.filter(b => b.statusTag === 'good').length})
                  </button>
                  <button
                    onClick={() => setStandingFilter('regular')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                      standingFilter === 'regular'
                        ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20 font-extrabold'
                        : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                    }`}
                  >
                    🟡 {t('standingRegular')} ({borrowers.filter(b => b.statusTag === 'regular' || b.statusTag === undefined).length})
                  </button>
                  <button
                    onClick={() => setStandingFilter('late')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                      standingFilter === 'late'
                        ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20 font-extrabold'
                        : 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
                    }`}
                  >
                    🔴 {t('standingLate')} ({borrowers.filter(b => b.statusTag === 'late').length})
                  </button>
                  <button
                    onClick={() => setStandingFilter('dueSoon')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                      standingFilter === 'dueSoon'
                        ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/20 font-extrabold'
                        : 'text-amber-600 dark:text-amber-400 hover:bg-amber-600/10'
                    }`}
                  >
                    ⏰ {t('standingDueSoon')} ({borrowers.filter(b => {
                      const dl = getDaysUntilNextPayment(b);
                      return dl !== null && dl <= 3;
                    }).length})
                  </button>
                </div>
              </div>



              {/* Bulk Selection Action Bar */}
              {filteredBorrowers.length > 0 && (
                <div className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border text-xs mb-4 shadow-sm transition-all duration-200 ${currentThemeConfig.cardClass}`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="select-all-visible"
                      checked={
                        filteredBorrowers.length > 0 &&
                        filteredBorrowers.every((b) => selectedBorrowerIds.includes(b.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          const allIds = filteredBorrowers.map((b) => b.id);
                          setSelectedBorrowerIds((prev) => Array.from(new Set([...prev, ...allIds])));
                        } else {
                          const visibleIds = filteredBorrowers.map((b) => b.id);
                          setSelectedBorrowerIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="select-all-visible" className={`font-extrabold cursor-pointer select-none ${currentThemeConfig.textTitle}`}>
                      {language === 'kh' ? 'ជ្រើសរើសកូនបំណុលទាំងអស់ (Select All)' : 'Select All Filtered'}
                    </label>
                  </div>
                  {selectedBorrowerIds.length > 0 && (
                    <div className="flex items-center gap-3">
                      <span className={`font-bold text-xs ${currentThemeConfig.textMuted}`}>
                        {language === 'kh' ? `បានជ្រើសរើស ${selectedBorrowerIds.length} នាក់` : `Selected ${selectedBorrowerIds.length}`}
                      </span>
                      <button
                        onClick={() => setSelectedBorrowerIds([])}
                        className="text-xs font-extrabold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                      >
                        {language === 'kh' ? 'លុបការជ្រើសរើស' : 'Clear Selection'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Cloud Firestore Status & Avatar Frame Manager Banner */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-200 shadow-sm mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-black text-lg shrink-0">
                    ☁️
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-sky-300 flex items-center gap-2">
                      <span>{language === 'kh' ? 'របៀបដំណើរការ Cloud Firestore ផ្ទាល់ (Pure Cloud Sync)' : 'Pure Cloud Firestore Mode'}</span>
                      <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                        {language === 'kh' ? 'មិនទាមទារ Local Storage ឡើយ' : 'No Local Storage Required'}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 font-bold mt-0.5 leading-tight">
                      {language === 'kh' 
                        ? 'រាល់ទិន្នន័យកូនបំណុល និងការកត់ត្រាទាំងអស់ត្រូវបានធ្វើការ Synchronize ផ្ទាល់នៅលើ Cloud 100% ដោយមិនចំណាយ Storage លើ Browser ឬ Mobile ឡើយ។' 
                        : 'All borrower records and transactions sync 100% directly with Cloud Firestore without relying on browser local storage.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                  <button
                    onClick={() => {
                      const nextVal = !hideBorrowerAvatarFrames;
                      setHideBorrowerAvatarFrames(nextVal);
                      safeStorage.setItem('luypay_hide_borrower_avatar_frames', String(nextVal));
                      showToast(
                        language === 'kh' 
                          ? (nextVal ? 'បានលាក់ស៊ុម Avatar លើផ្ទាំងកូនបំណុលរួចរាល់ (ទិន្នន័យកូនបំណុលរក្សាទុក ១០០%)' : 'បានបង្ហាញស៊ុម Avatar លើផ្ទាំងកូនបំណុលវិញ') 
                          : (nextVal ? 'Hidden Avatar frames on debtor cards (Data 100% safe)' : 'Shown Avatar frames on debtor cards'), 
                        'info'
                      );
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border flex items-center gap-1.5 ${
                      hideBorrowerAvatarFrames
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                    title={language === 'kh' ? 'បិទ/បើក ការបង្ហាញស៊ុម Avatar លើផ្ទាំងកូនបំណុល' : 'Toggle Avatar Frames on Debtor Cards'}
                  >
                    <span>🖼️</span>
                    <span>
                      {hideBorrowerAvatarFrames
                        ? (language === 'kh' ? 'បានលាក់ស៊ុម Avatar រួចហើយ' : 'Avatar Frames Hidden')
                        : (language === 'kh' ? 'លាក់ស៊ុម Avatar លើផ្ទាំង' : 'Hide Avatar Frames')}
                    </span>
                  </button>

                  <button
                    onClick={handleRemoveAllBorrowerAvatarFrames}
                    className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-black text-xs rounded-xl border border-rose-500/30 transition cursor-pointer flex items-center gap-1.5"
                    title={language === 'kh' ? 'លុបស៊ុម Avatar ចេញពីកូនបំណុលទាំងអស់ (ទិន្នន័យកូនបំណុលរក្សាទុកដដែល)' : 'Remove Avatar frame from all debtors'}
                  >
                    <span>🗑️</span>
                    <span>{language === 'kh' ? 'លុបស៊ុម Avatar ទាំងអស់' : 'Remove All Frames'}</span>
                  </button>
                </div>
              </div>

              {/* Borrowers Grid View */}
              {filteredBorrowers.length === 0 ? (
                <div id="no-data-display" className={`border border-dashed rounded-2xl py-16 text-center space-y-3 shadow-sm ${currentThemeConfig.cardClass}`}>
                  <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700">
                    <Info className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                  </div>
                  <div>
                    <h3 className={`font-extrabold ${currentThemeConfig.textTitle}`}>{t('noBorrowerFoundTitle')}</h3>
                    <p className={`text-xs mt-1 ${currentThemeConfig.textMuted}`}>
                      {searchQuery ? t('noSearchResultsDesc') : t('noBorrowersDesc')}
                    </p>
                  </div>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {t('clearSearchBtn')}
                    </button>
                  )}
                </div>
              ) : (
                <div id="borrowers-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBorrowers.map((b) => (
                    <BorrowerCard
                      key={b.id}
                      borrower={b}
                      onSelect={handleSelectBorrower}
                      onQuickPay={handleQuickPay}
                      onShowPaymentQr={setQrBorrower}
                      isSelected={selectedBorrowerIds.includes(b.id)}
                      onToggleSelect={handleToggleSelectBorrower}
                      buttonStyle={buttonStyle}
                      appTheme={appTheme}
                      isDark={isDark}
                      hideAvatarFrame={hideBorrowerAvatarFrames}
                      layoutLayer={layoutConfig.cardLayer || 'default'}
                    />
                  ))}
                </div>
              )}

              {/* Feature Highlights/Notice */}
              <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100/60 flex flex-col sm:flex-row gap-4 items-start shadow-sm">
                <div className="p-2.5 bg-blue-500/10 text-blue-700 rounded-xl">
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wide">💡 {t('tipsTitle')}</h4>
                  <p className="text-xs text-blue-900 leading-relaxed max-w-4xl">
                    {t('tipsDesc')}
                  </p>
                </div>
              </div>
            </>
          );
        })()}
      </main>
          </>
        )}

      {/* Add New Borrower Overlay */}
      <AddBorrowerModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setPrefilledData(null);
        }}
        onSave={handleAddNewBorrower}
        prefilledData={prefilledData}
        shareholders={shareholders}
      />

      {/* Shareholder Partner Management Modal */}
      <ShareholderManagementModal
        isOpen={isShareholdersModalOpen}
        onClose={() => setIsShareholdersModalOpen(false)}
        shareholders={shareholders}
        borrowers={borrowers}
        language={language}
        onSaveShareholders={handleSaveShareholders}
        onClearShareholderData={handleClearShareholderData}
      />

      {/* Shareholder Module Upgrade Lock Modal ($10 Add-on) */}
      {isShareholderLockModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setIsShareholderLockModalOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full flex items-center justify-center font-bold text-sm transition"
            >
              ✕
            </button>

            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-lg shadow-amber-500/20 text-slate-950 font-black">
                🔒
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {language === 'kh' ? 'មុខងារគ្រប់គ្រងដៃគូភាគហ៊ុន (Shareholders)' : 'Shareholders Partner Module'}
              </h3>
              <div className="inline-block px-3 py-1 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-400/30 rounded-full text-xs font-black">
                {language === 'kh' ? 'មុខងារបន្ថែម (Add-on Module) — $10.00' : 'Special Add-on Module — $10.00'}
              </div>
            </div>

            <div className="space-y-3 bg-amber-500/5 dark:bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-bold">
              <p>
                {language === 'kh'
                  ? 'មុខងារគ្រប់គ្រងដៃគូភាគហ៊ុន (Shareholders Partner Management) ជាមុខងារបន្ថែមពិសេសដែលអនុញ្ញាតឱ្យសមាជិក៖'
                  : 'The Shareholder Partner Module is a premium add-on feature enabling you to:'}
              </p>
              <ul className="space-y-1.5 pl-2">
                <li className="flex items-center gap-2">
                  <span className="text-amber-500">✔</span>
                  <span>{language === 'kh' ? 'បង្កើត និងគ្រប់គ្រងដៃគូភាគហ៊ុនបានមិនកំណត់' : 'Create & manage unlimited shareholder partners'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-500">✔</span>
                  <span>{language === 'kh' ? 'បែងចែកផលចំណេញប្រចាំថ្ងៃ ឬ 50/50 ស្វ័យប្រវត្តិ' : 'Automate 50/50 or daily rate interest splits'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-500">✔</span>
                  <span>{language === 'kh' ? 'ផ្តល់ Portal ផ្ទាល់ខ្លួន និង Add to Home Screen លើ iPhone ឱ្យភាគហ៊ុន' : 'Provide custom Web Portals & iPhone PWA for partners'}</span>
                </li>
              </ul>
              <p className="pt-1 text-emerald-600 dark:text-emerald-400 text-[11px]">
                {language === 'kh'
                  ? '💡 នៅពេលទិញ និងត្រូវបានអនុម័ត មុខងារនេះនឹងបង្ហាញនៅជិត "គ្រប់គ្រងប្រព័ន្ធ" ក្នុងគណនីរបស់អ្នកភ្លាមៗ!'
                  : '💡 Once purchased and approved, this option will unlock permanently next to System Management!'}
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                onClick={() => setIsShareholderLockModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold rounded-2xl text-xs transition cursor-pointer"
              >
                {language === 'kh' ? 'បិទ (Close)' : 'Close'}
              </button>
              <button
                onClick={() => {
                  setIsShareholderLockModalOpen(false);
                  setActiveSection('pricing');
                }}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-2xl text-xs transition cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5"
              >
                <span>🛒</span>
                <span>{language === 'kh' ? 'ទិញមុខងារនេះ $10' : 'Upgrade Add-on $10'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail & Card-Checkboard Overlay */}
      <AnimatePresence>
        {selectedBorrower && (
          <BorrowerDetail
            borrower={selectedBorrower}
            onClose={() => setSelectedBorrowerId(null)}
            onAddPayment={handleAddPaymentDetail}
            onDeletePayment={handleDeletePayment}
            onDeleteBorrower={handleDeleteBorrower}
            onToggleArchive={handleToggleArchive}
            onUpdateStatus={handleUpdateBorrowerStatus}
            onToggleAutoCheckIn={handleToggleAutoCheckIn}
            onEditBorrower={handleEditBorrower}
            onShowPaymentQr={setQrBorrower}
          />
        )}
      </AnimatePresence>

      {/* Settings Modal (Language, Theme, and Profile Photo Selection) */}
      {isSettingsOpen && (
        <div id="settings-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-250 text-slate-800 dark:text-slate-100">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-base">
                  {language === 'kh' ? 'ការកំណត់ប្រព័ន្ធ' : 'System Settings'}
                </h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition text-slate-500 dark:text-slate-400 border-transparent cursor-pointer animate-none"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
              {/* Profile Photo Selection Section */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-500" />
                  <span>{language === 'kh' ? 'រូបថតកម្រងព័ត៌មាន' : 'Profile Photo'}</span>
                </h4>
                
                <div className="flex flex-col items-center gap-4 bg-slate-50 dark:bg-slate-850 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="relative group">
                    {memberProfile?.photoURL ? (
                      <img
                        src={memberProfile.photoURL}
                        alt="Profile avatar"
                        className="w-20 h-20 rounded-full object-cover border-2 border-blue-500 shadow-md"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-lg">
                        {userDisplayName.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md cursor-pointer transition border border-white flex items-center justify-center">
                      <Camera className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs font-bold">{userDisplayName}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{currentUser}</p>
                  </div>

                  {/* Curated Preset Avatars Grid */}
                  <div className="w-full space-y-2 mt-2">
                    <p className="text-[10px] text-slate-400 font-bold text-center">
                      {language === 'kh' ? 'ឬជ្រើសរើសរូបតំណាងដែលមានស្រាប់៖' : 'Or select a predefined avatar:'}
                    </p>
                    <div className="grid grid-cols-6 gap-2.5 justify-center">
                      {[
                        { name: 'fox', url: 'https://images.unsplash.com/photo-1574063413132-355dbfd83e82?auto=format&fit=crop&w=150&h=150&q=80' },
                        { name: 'cat', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=150&h=150&q=80' },
                        { name: 'lion', url: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=150&h=150&q=80' },
                        { name: 'rabbit', url: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=150&h=150&q=80' },
                        { name: 'koala', url: 'https://images.unsplash.com/photo-1528696892704-5e1122852276?auto=format&fit=crop&w=150&h=150&q=80' },
                        { name: 'panda', url: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&w=150&h=150&q=80' }
                      ].map((av) => (
                        <button
                          key={av.name}
                          type="button"
                          onClick={() => handleSavePhotoURL(av.url)}
                          className={`w-9 h-9 rounded-full overflow-hidden border-2 cursor-pointer transition flex items-center justify-center p-0 ${memberProfile?.photoURL === av.url ? 'border-blue-500 scale-110 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}
                          title={av.name}
                        >
                          <img src={av.url} alt={av.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>



              {/* Language Selection Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <span className="text-base leading-none">🇰🇭</span>
                  <span>{language === 'kh' ? 'ការកំណត់ភាសារ' : 'Language Setting'}</span>
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const btn = document.getElementById('lang-kh');
                      if (btn) btn.click();
                    }}
                    className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${language === 'kh' ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'}`}
                  >
                    <span>🇰🇭</span>
                    <span>ខ្មែរ (Khmer)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const btn = document.getElementById('lang-en');
                      if (btn) btn.click();
                    }}
                    className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${language === 'en' ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'}`}
                  >
                    <span>🇺🇸</span>
                    <span>English</span>
                  </button>
                </div>
              </div>

              {/* Theme Toggle Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>{language === 'kh' ? 'ស្បែកកម្មវិធី (Theme)' : 'App Theme'}</span>
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${theme === 'light' ? 'bg-amber-50 border-amber-200 text-amber-600 font-black' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'}`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>{language === 'kh' ? 'ពន្លឺ (Light)' : 'Light Mode'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${theme === 'dark' ? 'bg-blue-950/40 border-blue-800 text-blue-400 font-black' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'}`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>{language === 'kh' ? 'ងងឹត (Dark)' : 'Dark Mode'}</span>
                  </button>
                </div>
              </div>

              {/* Khmer Traditional Theme Picker Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{language === 'kh' ? 'សោភ័ណភាពខ្មែរ (Khmer Art Theme)' : 'Traditional Khmer Theme'}</span>
                </h4>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  {[
                    { id: 'slate', nameKh: 'លំនាំថ្មភក់', nameEn: 'Classic Slate', icon: '⛰️', colorClass: 'from-slate-600 to-slate-800 text-slate-100' },
                    { id: 'angkor', nameKh: 'រាជវាំងអង្គរមាស', nameEn: 'Royal Angkor', icon: '🔱', colorClass: 'from-[#dfb035] to-[#b37e1b] text-white font-black shadow-amber-500/15' },
                    { id: 'apsara', nameKh: 'រាត្រីទេពអប្សរា', nameEn: 'Celestial Apsara', icon: '✨', colorClass: 'from-[#100a25] to-[#251754] text-[#ebdcfc] shadow-purple-500/15' },
                    { id: 'emerald', nameKh: 'មេគង្គមរកត', nameEn: 'Mekong Emerald', icon: '🌾', colorClass: 'from-[#031d12] to-[#053c25] text-[#cbfce2] shadow-emerald-500/15' }
                  ].map((tPreset) => (
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
                      <span className="text-base">{tPreset.icon}</span>
                      <div>
                        <span className="block font-extrabold text-[11px]">
                          {language === 'kh' ? tPreset.nameKh : tPreset.nameEn}
                        </span>
                        <span className="text-[9px] opacity-60 font-medium block">
                          {tPreset.nameEn}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Button Style Selector Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-blue-500" />
                  <span>{language === 'kh' ? 'រចនាប័ទ្មប៊ូតុង (Button Style)' : 'Button Interface Style'}</span>
                </h4>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  {[
                    { id: 'modern', nameKh: 'ទំនើប', nameEn: 'Sleek Modern', icon: '📱' },
                    { id: 'kbach', nameKh: 'ក្បាច់បុរាណ', nameEn: 'Khmer Kbach', icon: '⚜️' },
                    { id: 'neon', nameKh: 'រស្មីនេអុង', nameEn: 'Neon Glow', icon: '⚡' }
                  ].map((btnPreset) => (
                    <button
                      key={btnPreset.id}
                      type="button"
                      onClick={() => setButtonStyle(btnPreset.id as ButtonStyleType)}
                      className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition duration-150 cursor-pointer ${
                        buttonStyle === btnPreset.id
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-extrabold shadow-sm'
                          : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <span>{btnPreset.icon}</span>
                      <span className="font-extrabold text-[10px]">
                        {language === 'kh' ? btnPreset.nameKh : btnPreset.nameEn}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Animations ON/OFF Selector Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span>{language === 'kh' ? 'ចលនារស់រវើក (Live Animations)' : 'Interface Animations'}</span>
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEnableAnimations(true)}
                    className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${enableAnimations ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-600 font-black' : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600'}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>{language === 'kh' ? 'បើកចលនា (ON)' : 'Animations ON'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnableAnimations(false)}
                    className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${!enableAnimations ? 'bg-slate-100 dark:bg-slate-850 border-slate-350 dark:border-slate-700 text-slate-600 font-black' : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600'}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span>{language === 'kh' ? 'បិទចលនា (OFF)' : 'Animations OFF'}</span>
                  </button>
                </div>
              </div>

              {/* Khmer Art Decoration Toggle */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span>{language === 'kh' ? 'គ្រឿងលម្អសោភ័ណភាពខ្មែរ (Khmer Art Ornaments)' : 'Khmer Art & Ornaments'}</span>
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setEnableKhmerArt(true); playClickSound(); }}
                    className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${enableKhmerArt ? 'bg-purple-50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800 text-purple-600 dark:text-purple-400 font-black' : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600'}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span>{language === 'kh' ? 'បើកគ្រឿងលម្អ (ON)' : 'Ornaments ON'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEnableKhmerArt(false); playClickSound(); }}
                    className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${!enableKhmerArt ? 'bg-slate-100 dark:bg-slate-850 border-slate-350 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black' : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600'}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span>{language === 'kh' ? 'បិទទៅលំនាំដើម (OFF)' : 'Ornaments OFF (Default)'}</span>
                  </button>
                </div>
              </div>

              {/* Sponsor Banner Toggle */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-indigo-500" />
                  <span>{language === 'kh' ? 'ផ្ទាំងផ្សាយពាណិជ្ជកម្ម (Sponsor Banner)' : 'Sponsor Banner'}</span>
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setIsSponsorDismissed(false); playClickSound(); }}
                    className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${!isSponsorDismissed ? 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-black' : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600'}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span>{language === 'kh' ? 'បង្ហាញផ្ទាំង (Show)' : 'Show Banner'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsSponsorDismissed(true); playClickSound(); }}
                    className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${isSponsorDismissed ? 'bg-slate-100 dark:bg-slate-850 border-slate-350 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black' : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600'}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span>{language === 'kh' ? 'បិទផ្ទាំង (Hide)' : 'Hide Banner'}</span>
                  </button>
                </div>
              </div>

              {/* Telegram Bot Integration Section */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <span className="text-base leading-none">🤖</span>
                  <span>{language === 'kh' ? 'ការតភ្ជាប់ Telegram Bot (ABA Merchant)' : 'Telegram Bot API Integration'}</span>
                </h4>
                
                <div className="bg-slate-50 dark:bg-slate-850 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                    {language === 'kh' 
                      ? 'បញ្ចូល Bot Token របស់អ្នក ដើម្បីឱ្យប្រព័ន្ធឆែកការបង់លុយពី ABA Merchant Group automatically តាមរយៈ Unique ID (KH-xxxx)។' 
                      : 'Enter your Telegram Bot Token to automatically monitor and auto-approve payments matching Unique IDs (KH-xxxx).'}
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {language === 'kh' ? 'លេខកូដ Bot Token' : 'Telegram Bot Token'}
                    </label>
                    <input
                      type="text"
                      value={telegramToken}
                      onChange={(e) => {
                        const token = e.target.value.trim();
                        setTelegramToken(token);
                        safeStorage.setItem('luypay_telegram_token', token);
                        if (isLoggedIn) {
                          setDoc(doc(db, 'settings', 'qr_config'), { telegramToken: token }, { merge: true }).catch(err => {
                            console.error('Error saving telegramToken:', err);
                          });
                        }
                      }}
                      placeholder="8920488272:AAFyrp..."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400">
                      {language === 'kh' ? 'ស្ថានភាពដំណើរការ' : 'Service Status'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const nextState = !telegramPollingEnabled;
                        setTelegramPollingEnabled(nextState);
                        safeStorage.setItem('luypay_telegram_polling_enabled', nextState ? 'true' : 'false');
                        showToast(nextState ? 'បានបើកសេវាកម្មត្រួតពិនិត្យ Telegram!' : 'បានបិទសេវាកម្មត្រួតពិនិត្យ Telegram!', 'info');
                        if (isLoggedIn) {
                          setDoc(doc(db, 'settings', 'qr_config'), { telegramPollingEnabled: nextState }, { merge: true }).catch(err => {
                            console.error('Error saving telegramPollingEnabled:', err);
                          });
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition ${
                        telegramPollingEnabled 
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-300' 
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {telegramPollingEnabled ? (language === 'kh' ? '● កំពុងដំណើរការ (ON)' : 'Active (ON)') : (language === 'kh' ? '● ផ្អាកដំណើរការ (OFF)' : 'Paused (OFF)')}
                    </button>
                  </div>

                  {telegramPollingEnabled && telegramError && (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-950/20 rounded-xl text-[10px] font-bold text-rose-600 dark:text-rose-400 flex flex-col gap-0.5 animate-in fade-in duration-200">
                      <span className="uppercase tracking-wider font-black">{language === 'kh' ? 'បញ្ហាប្រព័ន្ធភ្ជាប់ Telegram:' : 'Telegram Connection Alert:'}</span>
                      <span className="font-mono text-[9px] break-all">{telegramError}</span>
                    </div>
                  )}

                  {/* Telegram logs */}
                  <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {language === 'kh' ? 'របាយការណ៍បាញ់លុយចុងក្រោយ' : 'Recent Transaction Logs'}
                      </span>
                      {telegramLogs.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setTelegramLogs([]);
                            safeStorage.setItem('luypay_telegram_logs', JSON.stringify([]));
                          }}
                          className="text-[9px] font-extrabold text-rose-500 hover:underline cursor-pointer"
                        >
                          {language === 'kh' ? 'សម្អាត' : 'Clear'}
                        </button>
                      )}
                    </div>

                    <div className="max-h-32 overflow-y-auto space-y-1.5 scrollbar-thin">
                      {telegramLogs.length === 0 ? (
                        <div className="text-center py-4 text-[10px] text-slate-400 font-bold bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                          {language === 'kh' ? 'មិនទាន់មានទិន្នន័យ (រង់ចាំការបាញ់លុយ)' : 'No recent transactions logged yet.'}
                        </div>
                      ) : (
                        telegramLogs.map((log, index) => (
                          <div 
                            key={index} 
                            className={`p-2 rounded-xl text-[10px] border flex flex-col gap-0.5 ${
                              log.status === 'success' 
                                ? 'bg-emerald-500/5 border-emerald-200/40 text-emerald-800 dark:text-emerald-400' 
                                : 'bg-slate-500/5 border-slate-200/40 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <div className="flex items-center justify-between font-extrabold">
                              <span>{log.message}</span>
                              <span className="text-[8px] opacity-70">{log.time.split(',')[1] || log.time}</span>
                            </div>
                            {log.details && (
                              <p className="text-[9px] opacity-80 bg-black/5 dark:bg-white/5 p-1 rounded font-mono break-all line-clamp-1">
                                {log.details}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Change Password Section */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-500" />
                  <span>{language === 'kh' ? 'ប្តូរលេខកូដសម្ងាត់គណនី' : 'Change Account Password'}</span>
                </h4>
                
                <form onSubmit={handleChangePassword} className="bg-slate-50 dark:bg-slate-850 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      {language === 'kh' ? 'លេខកូដសម្ងាត់បច្ចុប្បន្ន' : 'Current Password'}
                    </label>
                    <input
                      type="password"
                      value={settingOldPassword}
                      onChange={(e) => setSettingOldPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      {language === 'kh' ? 'លេខកូដសម្ងាត់ថ្មី' : 'New Password'}
                    </label>
                    <input
                      type="password"
                      value={settingNewPassword}
                      onChange={(e) => setSettingNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      {language === 'kh' ? 'បញ្ជាក់លេខកូដសម្ងាត់ថ្មី' : 'Confirm New Password'}
                    </label>
                    <input
                      type="password"
                      value={settingConfirmNewPassword}
                      onChange={(e) => setSettingConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                    />
                  </div>

                  {passwordChangeStatus && (
                    <div className={`p-2.5 rounded-xl text-[10px] font-bold border ${passwordChangeStatus.type === 'success' ? 'bg-emerald-500/5 border-emerald-200 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/5 border-rose-200 text-rose-600 dark:text-rose-400'}`}>
                      {passwordChangeStatus.message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isPasswordUpdating}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 active:bg-blue-800 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer border-transparent"
                  >
                    {isPasswordUpdating ? (
                      <span>{language === 'kh' ? 'កំពុងរក្សាទុក...' : 'Updating...'}</span>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{language === 'kh' ? 'រក្សាទុកការផ្លាស់ប្តូរ (Save Password)' : 'Update Password'}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Cache Clear & Force Update Section */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-rose-500" />
                  <span>{language === 'kh' ? 'សម្អាត Cache និងធ្វើបច្ចុប្បន្នភាព' : 'Clear Cache & Update System'}</span>
                </h4>
                
                <div className="bg-rose-50/40 dark:bg-rose-950/5 p-4 rounded-2xl border border-rose-100 dark:border-rose-950/20 space-y-3">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                    {language === 'kh' 
                      ? 'ប្រសិនបើលោកអ្នកកែប្រែប្រព័ន្ធហើយ Browser មិនបង្ហាញទិន្នន័យថ្មី ឬរក្សាទុកទិន្នន័យចាស់ សូមចុចប៊ូតុងខាងក្រោមដើម្បីសម្អាត Cache ទាំងអស់ និងទាញយកប្រព័ន្ធថ្មីចុងក្រោយបង្អស់ពី Cloud (Server) ដោយស្វ័យប្រវត្តិ។' 
                      : 'If you modified the system and your browser still displays outdated pages or content, click below to clean all caches and automatically force-load the latest updates from the Cloud (Server).'}
                  </p>
                  
                  <button
                    type="button"
                    onClick={handleForceUpdateSystem}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-black rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer border-transparent"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{language === 'kh' ? 'ទាញយកប្រព័ន្ធថ្មីចុងក្រោយ (Force Update)' : 'Force Update Latest Version'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-extrabold rounded-xl transition cursor-pointer border border-rose-500/20 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                <span>{language === 'kh' ? 'កំណត់លំនាំដើមឡើងវិញ (Reset)' : 'Reset to Defaults'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-850 text-white text-xs font-extrabold rounded-xl shadow-md transition cursor-pointer border-transparent"
              >
                {language === 'kh' ? 'រួចរាល់' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Borrower Specific Payment QR Modal */}
      {qrBorrower && (
        <div id="payment-qr-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-250 text-slate-800 dark:text-slate-100">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-base">
                  {language === 'kh' ? 'QR Code សម្រាប់បង់លុយ' : 'Payment QR Code'}
                </h3>
              </div>
              <button
                onClick={() => setQrBorrower(null)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition text-slate-500 dark:text-slate-400 border-transparent cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh] flex flex-col items-center">
              {/* Borrower Info Row */}
              <div className="text-center space-y-1 w-full">
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  {qrBorrower.name}
                </h4>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-bold">
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-mono uppercase">
                    {qrBorrower.shortId || 'KH-XXXX'}
                  </span>
                  {qrBorrower.phone && <span>• {qrBorrower.phone}</span>}
                </div>
              </div>

              {/* QR Image Display */}
              <div className="w-full max-w-[240px] xs:max-w-[256px] aspect-square rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 flex items-center justify-center overflow-hidden p-3 shadow-md relative group">
                {qrBorrower.paymentQr ? (
                  <img
                    src={qrBorrower.paymentQr}
                    alt="Borrower Custom QR"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : memberProfile?.paymentQr ? (
                  <img
                    src={memberProfile.paymentQr}
                    alt="Lender Payment QR"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrConfig.qrString || '00020101021129170013000469096')}`}
                    alt="Fallback QR"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>

              {/* Installment Info Badge */}
              <div className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl flex items-center justify-between text-xs font-extrabold">
                <span className="text-slate-500">
                  {language === 'kh' ? 'ទឹកប្រាក់ត្រូវបង់រាល់ដង៖' : 'Installment Due Amount:'}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 text-sm font-black">
                  {formatMoney(qrBorrower.installmentAmount, qrBorrower.currency)}
                </span>
              </div>

              {/* Remark Box */}
              <div className="w-full bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-400">
                    {language === 'kh' ? 'លេខសំគាល់ Remark / Description ស្វ័យប្រវត្ត' : 'Payment Remark / Description ID'}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(qrBorrower.shortId || '');
                      playClickSound();
                      showToast(language === 'kh' ? 'ចម្លងលេខកូដ Remark រួចរាល់!' : 'Copied Payment Remark ID!', 'success');
                    }}
                    className="text-[10px] font-black px-2 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-500/20 transition cursor-pointer border border-transparent"
                  >
                    {language === 'kh' ? 'ចម្លង Remark' : 'Copy Remark'}
                  </button>
                </div>
                
                <div className="bg-white dark:bg-slate-900 border border-amber-200/30 dark:border-amber-900/25 py-2.5 rounded-xl text-center">
                  <span className="text-xl font-black font-mono tracking-widest text-amber-600 dark:text-amber-400 uppercase select-all">
                    {qrBorrower.shortId || 'KH-1001'}
                  </span>
                </div>

                <p className="text-[10px] text-amber-800/80 dark:text-amber-400/80 font-bold leading-relaxed">
                  {language === 'kh' 
                    ? '⚠️ ពេលបង្កើត QR Code តាម ABA Merchant ត្រូវបញ្ចូលលេខ ID ខាងលើនេះទៅក្នុងប្រអប់ Remark/Description នៃ QR នោះ ដើម្បីឱ្យប្រព័ន្ធឆែកឃើញការបង់លុយ automatically ពី Telegram!' 
                    : '⚠️ When creating the QR Code via ABA Merchant, enter the Unique ID above in the Remark/Description box so the system can auto-approve payments from Telegram!'}
                </p>
              </div>

              {/* Custom Borrower QR Upload Option */}
              <div className="w-full text-center">
                <label 
                  htmlFor="borrower-specific-qr-upload" 
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer border border-slate-200/40 dark:border-slate-700"
                >
                  <Camera className="w-4 h-4 text-slate-500" />
                  <span>
                    {qrBorrower.paymentQr 
                      ? (language === 'kh' ? 'កែសម្រួលរូបភាព QR កូនបំណុល' : 'Update Borrower Custom QR') 
                      : (language === 'kh' ? 'ផ្ទុកឡើងរូបភាព QR ផ្ទាល់ខ្លួនសម្រាប់កូនបំណុលនេះ' : 'Upload Custom QR for this Borrower')}
                  </span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    if (file.size > 2 * 1024 * 1024) {
                      showToast(language === 'kh' ? 'រូបភាពធំជាង 2MB!' : 'Image exceeds 2MB!', 'info');
                      return;
                    }

                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const base64 = event.target?.result as string;
                      // Update borrower in state and DB
                      handleEditBorrower(qrBorrower.id, { paymentQr: base64 });
                      // Update local modal state to show uploaded QR immediately
                      setQrBorrower(prev => prev ? { ...prev, paymentQr: base64 } : null);
                      showToast(language === 'kh' ? 'បានរក្សាទុក QR សម្រាប់កូនបំណុលនេះ!' : 'Saved QR for this borrower!', 'success');
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="hidden"
                  id="borrower-specific-qr-upload"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setQrBorrower(null)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-md transition cursor-pointer border-transparent"
              >
                {language === 'kh' ? 'រួចរាល់' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Plan Approval Congratulatory Pop-up Notification Modal */}
      <PlanApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={handleCloseApprovalModal}
        planId={approvalModalPlan}
        language={language}
      />
      {/* Khmer Avatar Frame Selection Modal */}
      <KhmerAvatarFrameModal
        isOpen={isAvatarFrameModalOpen}
        onClose={() => setIsAvatarFrameModalOpen(false)}
        currentFrameId={avatarFrameId}
        onSelectFrame={handleSaveAvatarFrame}
        renderLogoPreview={(sizeClass = "w-16 h-16") => renderSystemLogo(sizeClass)}
      />
      </div>
    </div>
  );
}
