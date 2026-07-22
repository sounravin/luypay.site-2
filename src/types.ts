export type FrequencyType = 'daily' | 'weekly' | 'monthly';
export type CurrencyType = 'USD' | 'KHR';

export interface Payment {
  id: string;
  date: string;
  amount: number;
  installmentIndex: number; // 0-based index of the installment slot (e.g., Slot 0 for Day 1)
  note?: string;
}

export interface ReportedPayment {
  id: string;
  installmentIndex: number;
  amount: number;
  date: string; // reported date (ISO string)
  receiptImage?: string; // base64 receipt image
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
  rejectedReason?: string;
}

export interface Borrower {
  id: string;
  shortId?: string;
  name: string;
  phone: string;
  loanDate: string;
  principal: number;
  totalToPay: number;
  installmentAmount: number;
  frequency: FrequencyType;
  duration: number; // total number of installments (e.g., 20, 24, 30)
  currency: CurrencyType;
  notes?: string;
  payments: Payment[];
  isArchived?: boolean; // to archive completed/old loans
  interestType?: 'percent' | 'fixed';
  interestValue?: number;
  paymentMode?: 'all' | 'interest-only';
  interestCalculation?: 'flat' | 'per-period';
  statusTag?: 'good' | 'late' | 'regular';
  autoCheckIn?: boolean;
  dueTime?: string; // custom cutoff/due time, e.g. "17:00"
  noticeMessage?: string; // custom announcement/alert notice for the borrower
  chatMessages?: ChatMessage[]; // live chat/discussion with borrower
  profilePhoto?: string; // base64 encoded profile photo string
  avatarFrame?: string; // custom avatar animated frame template ID
  coverPhoto?: string; // base64 encoded cover photo string
  paymentQr?: string; // base64 encoded payment QR code image URL
  userId?: string; // The username of the member who owns this borrower
  interestOnlyExtension?: boolean; // Whether the borrower requested interest-only principal deferral
  interestOnlyExtensionNote?: string; // Note/reason for interest-only principal deferral
  interestOnlyExtensionReason?: string; // Standard condition/reason selected for the extension request (e.g. "គ្រួសារឈឺ", "សុំយកបន្ថែមថ្មីលើកម្ចីចាស់")
  topUpLoanAmount?: number; // Additional top-up loan amount requested or granted
  topUpSeparate?: boolean; // Whether the top-up loan is separate (true) or merged/re-calculated (false)
  topUpNotes?: string; // Notes/details about the top-up loan
  topUpDate?: string; // Date when top-up loan was registered
  reportedPayments?: ReportedPayment[]; // Payments scanned & reported by borrower via portal
  isOnline?: boolean; // Whether the borrower is currently visiting their portal
  lastActive?: number; // Milliseconds timestamp of borrower's last interaction or heartbeat
  applicationId?: string; // Prefilled application identifier
  shareholderId?: string; // ID of linked shareholder/investor partner
  shareholderName?: string; // Name of linked shareholder
  shareholderSharePercent?: number; // Partner's profit split share % (defaults to 50%)
}

export interface Shareholder {
  id: string;
  name: string;
  phone?: string;
  username: string; // default "admin" or custom
  password: string; // default "admin" or custom
  capitalUSD: number; // initial invested capital e.g. 500
  sharePercent: number; // default 50%
  notes?: string;
  createdAt: string;
  userId?: string; // owner lender ID
}

export interface ChatMessage {
  id: string;
  sender: 'lender' | 'borrower';
  message: string;
  timestamp: string; // ISO string
}

export interface LedgerStats {
  totalActiveLoansCount: number;
  totalCompletedLoansCount: number;
  totalPrincipalUSD: number;
  totalPrincipalKHR: number;
  totalExpectedUSD: number;
  totalExpectedKHR: number;
  totalCollectedUSD: number;
  totalCollectedKHR: number;
}

export interface Member {
  username: string;
  email: string;
  password?: string;
  displayName: string;
  createdAt: string;
  invitesCount: number;
  inviteLink?: string;
  isBlocked?: boolean;
  subscriptionExpires?: string; // ISO date string
  photoURL?: string; // Optional custom base64 or URL profile photo
  paymentQr?: string; // Optional custom global/default payment QR code image URL
  isApproved?: boolean; // Multi-step registration approval status
  selectedPlan?: '1_month' | '3_months' | '1_year'; // Selected plan during registration
  invoiceImageUrl?: string; // Uploaded KHQR payment slip/invoice
  lastApprovedPlan?: '1_month' | '3_months' | '1_year';
  lastApprovedAt?: string;
  lastApprovedNoticeSeen?: boolean;
}

export interface SubscriptionRequest {
  id: string;
  username: string;
  displayName: string;
  plan: '1_month' | '3_months' | '1_year';
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  invoiceImageUrl?: string; // Uploaded KHQR payment receipt / invoice image
}

export interface QRConfig {
  qrType: 'generated' | 'uploaded';
  qrString: string;
  qrImageUrl: string;
  accountName: string;
  accountId: string;
  bankName: string;
  bankLogoText: string;
  bankColor: string;
}

export interface LoanApplication {
  id: string;
  name: string;
  phone: string;
  idCardPhoto: string; // base64 string of ID card
  selfiePhoto: string; // base64 string of selfie
  amountRequested: number; // in USD
  lenderId: string; // the member who will review/approve
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string; // ISO string
  approvedAt?: string;
  rejectedReason?: string;
  loanDuration?: number; // Duration of loan in days
  paymentType?: string;
  interestMethod?: string;
}

