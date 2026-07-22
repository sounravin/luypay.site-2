import { Borrower, Payment, Shareholder } from '../types';

export interface ShareholderStats {
  initialCapital: number;
  activeCapitalDeployed: number;
  remainingCapital: number;
  linkedBorrowersCount: number;
  activeBorrowersCount: number;
  totalCollectedPayments: number;
  totalInterestCollected: number;
  partnerProfitEarned: number;
  mainLenderProfitEarned: number;
  totalDailyProfitUSD: number;
}

export function calculateBorrowerInterestPerInstallment(borrower: Borrower): number {
  if (!borrower.duration || borrower.duration <= 0) return 0;
  const isInterestOnly = (borrower as any).isInterestOnly;
  const totalInterest = isInterestOnly
    ? borrower.totalToPay
    : Math.max(0, borrower.totalToPay - borrower.principal);
  return totalInterest / borrower.duration;
}

export function calculatePaymentInterestSplit(
  borrower: Borrower,
  payment: Payment,
  shareholder?: Shareholder
) {
  const isInterestOnly = (borrower as any).isInterestOnly;
  const totalInterest = isInterestOnly
    ? borrower.totalToPay
    : Math.max(0, borrower.totalToPay - borrower.principal);

  // Interest ratio contained in total loan amount
  const interestRatio = borrower.totalToPay > 0 ? totalInterest / borrower.totalToPay : 0;
  const actualInterest = Math.max(0, payment.amount * interestRatio);

  // Check calculation mode: 'daily_usd' (default) vs 'percent'
  const calcMode = borrower.shareholderCalculationType || shareholder?.calculationType || 'daily_usd';
  const dailyUSD = borrower.shareholderDailyUSD ?? shareholder?.dailyProfitUSD ?? 1.0;
  const sharePercent = borrower.shareholderSharePercent ?? shareholder?.sharePercent ?? 50;

  let partnerShare = 0;

  if (calcMode === 'percent') {
    partnerShare = (actualInterest * sharePercent) / 100;
  } else {
    // Default: Daily fixed dollar profit per daily payment installment
    const installmentAmt = borrower.installmentAmount > 0 ? borrower.installmentAmount : 1;
    const installmentRatio = payment.amount / installmentAmt;
    partnerShare = Math.max(0, dailyUSD * installmentRatio);
  }

  const mainLenderShare = Math.max(0, payment.amount - partnerShare);

  return {
    actualInterest,
    partnerShare,
    mainLenderShare,
    calcMode,
    dailyUSD,
    sharePercent,
  };
}

export function calculateShareholderStats(
  shareholder: Shareholder,
  borrowers: Borrower[]
): ShareholderStats {
  // Comprehensive matching by ID or Name strictly.
  // Do NOT include self capital loans (where shareholderId is missing or empty)
  const linkedBorrowers = borrowers.filter(
    (b) =>
      (b.shareholderId && b.shareholderId === shareholder.id) ||
      (b.shareholderName && shareholder.name && b.shareholderName.trim().toLowerCase() === shareholder.name.trim().toLowerCase())
  );

  let activeCapitalDeployed = 0;
  let activeBorrowersCount = 0;
  let totalCollectedPayments = 0;
  let totalInterestCollected = 0;
  let partnerProfitEarned = 0;
  let mainLenderProfitEarned = 0;
  let totalDailyProfitUSD = 0;

  linkedBorrowers.forEach((b) => {
    // Active loans count & capital
    const totalPaid = (b.payments || []).reduce((sum, p) => sum + (p?.amount || 0), 0);
    const isCompleted = totalPaid >= b.totalToPay;
    const dailyUSD = b.shareholderDailyUSD ?? shareholder.dailyProfitUSD ?? 1.0;

    if (!isCompleted && !b.isArchived) {
      activeCapitalDeployed += b.principal;
      activeBorrowersCount++;
      totalDailyProfitUSD += dailyUSD;
    }

    (b.payments || []).forEach((p) => {
      totalCollectedPayments += p.amount;
      const split = calculatePaymentInterestSplit(b, p, shareholder);
      totalInterestCollected += split.actualInterest;

      partnerProfitEarned += split.partnerShare;
      mainLenderProfitEarned += split.mainLenderShare;
    });
  });

  const remainingCapital = Math.max(0, shareholder.capitalUSD - activeCapitalDeployed);

  return {
    initialCapital: shareholder.capitalUSD,
    activeCapitalDeployed,
    remainingCapital,
    linkedBorrowersCount: linkedBorrowers.length,
    activeBorrowersCount,
    totalCollectedPayments,
    totalInterestCollected,
    partnerProfitEarned,
    mainLenderProfitEarned,
    totalDailyProfitUSD,
  };
}

