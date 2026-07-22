import { Borrower, Payment, Shareholder } from '../types';

export interface ShareholderStats {
  initialCapital: number;
  activeCapitalDeployed: number;
  linkedBorrowersCount: number;
  activeBorrowersCount: number;
  totalCollectedPayments: number;
  totalInterestCollected: number;
  partnerProfitEarned: number;
  mainLenderProfitEarned: number;
}

export function calculateBorrowerInterestPerInstallment(borrower: Borrower): number {
  if (!borrower.duration || borrower.duration <= 0) return 0;
  const totalInterest = Math.max(0, borrower.totalToPay - borrower.principal);
  return totalInterest / borrower.duration;
}

export function calculatePaymentInterestSplit(borrower: Borrower, payment: Payment) {
  const sharePercent = borrower.shareholderSharePercent ?? 50;
  const interestPerInstallment = calculateBorrowerInterestPerInstallment(borrower);
  
  // Cap at payment amount
  const actualInterest = Math.min(payment.amount, interestPerInstallment);
  const partnerShare = (actualInterest * sharePercent) / 100;
  const mainLenderShare = actualInterest - partnerShare;

  return {
    actualInterest,
    partnerShare,
    mainLenderShare,
    sharePercent,
  };
}

export function calculateShareholderStats(
  shareholder: Shareholder,
  borrowers: Borrower[]
): ShareholderStats {
  const linkedBorrowers = borrowers.filter(
    (b) => b.shareholderId === shareholder.id || (shareholder.id === 'default' && b.shareholderId === shareholder.id)
  );

  let activeCapitalDeployed = 0;
  let activeBorrowersCount = 0;
  let totalCollectedPayments = 0;
  let totalInterestCollected = 0;
  let partnerProfitEarned = 0;
  let mainLenderProfitEarned = 0;

  linkedBorrowers.forEach((b) => {
    // Active loans count & capital
    const isCompleted = b.payments && b.payments.length >= b.duration;
    if (!isCompleted && !b.isArchived) {
      activeCapitalDeployed += b.principal;
      activeBorrowersCount++;
    }

    const sharePercent = b.shareholderSharePercent ?? shareholder.sharePercent ?? 50;
    const interestPerInstallment = calculateBorrowerInterestPerInstallment(b);

    (b.payments || []).forEach((p) => {
      totalCollectedPayments += p.amount;
      const actualInterest = Math.min(p.amount, interestPerInstallment);
      totalInterestCollected += actualInterest;

      const pShare = (actualInterest * sharePercent) / 100;
      partnerProfitEarned += pShare;
      mainLenderProfitEarned += (actualInterest - pShare);
    });
  });

  return {
    initialCapital: shareholder.capitalUSD,
    activeCapitalDeployed,
    linkedBorrowersCount: linkedBorrowers.length,
    activeBorrowersCount,
    totalCollectedPayments,
    totalInterestCollected,
    partnerProfitEarned,
    mainLenderProfitEarned,
  };
}
