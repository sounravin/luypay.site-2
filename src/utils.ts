import { CurrencyType, FrequencyType } from './types';

export function formatMoney(amount: number, currency: CurrencyType): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } else {
    // KHR
    return new Intl.NumberFormat('km-KH', {
      style: 'decimal',
    }).format(amount) + ' ៛';
  }
}

export function getFrequencyLabel(frequency: FrequencyType): string {
  switch (frequency) {
    case 'daily':
      return 'រាល់ថ្ងៃ (Daily)';
    case 'weekly':
      return 'រាល់សប្តាហ៍ (Weekly)';
    case 'monthly':
      return 'រាល់ខែ (Monthly)';
    default:
      return frequency;
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Play a high-quality, professional tactile click sound using the Web Audio API
export function playClickSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Frequency sweeps from 1200Hz down to 600Hz for a crisp, high-fidelity tactile feedback
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.04);

    // Fast exponential decay to mimic physical click feedback
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch (error) {
    // Silence errors when AudioContext is blocked by browser policy on initial loading
  }
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatKhmerDate(dateString: string): string {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  const [year, month, day] = parts;
  // Let's format as DD-MM-YYYY
  return `${day}/${month}/${year}`;
}

import { Borrower, Payment } from './types';

export function runAutoCheckInForBorrowers(borrowers: Borrower[]): { updatedList: Borrower[], hasChanges: boolean } {
  let hasChanges = false;
  const updatedList = (borrowers || []).map((borrower) => {
    const payments = Array.isArray(borrower.payments) ? [...borrower.payments] : [];
    if (!borrower.autoCheckIn) {
      if (!Array.isArray(borrower.payments)) {
        return { ...borrower, payments: [] };
      }
      return borrower;
    }

    const paymentBySlot: Record<number, Payment> = {};
    payments.forEach((p) => {
      if (p && p.installmentIndex !== -1) {
        paymentBySlot[p.installmentIndex] = p;
      }
    });

    const startDate = new Date(borrower.loanDate);
    if (isNaN(startDate.getTime())) return borrower;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let borrowerUpdated = false;

    for (let i = 0; i < borrower.duration; i++) {
      if (paymentBySlot[i]) continue;

      const dueDate = new Date(startDate);
      const offset = i + 1;

      if (borrower.frequency === 'daily') {
        dueDate.setDate(dueDate.getDate() + offset);
      } else if (borrower.frequency === 'weekly') {
        dueDate.setDate(dueDate.getDate() + offset * 7);
      } else if (borrower.frequency === 'monthly') {
        dueDate.setMonth(dueDate.getMonth() + offset);
      }

      dueDate.setHours(0, 0, 0, 0);

      if (dueDate <= today) {
        const autoPayment: Payment = {
          id: `auto-${generateId()}-${i}`,
          date: dueDate.toISOString().split('T')[0],
          amount: borrower.installmentAmount,
          installmentIndex: i,
          note: `Auto Check-In (ប្រព័ន្ធបង់ស្វ័យប្រវត្ត)`,
        };
        payments.push(autoPayment);
        paymentBySlot[i] = autoPayment;
        borrowerUpdated = true;
        hasChanges = true;
      }
    }

    if (borrowerUpdated) {
      return {
        ...borrower,
        payments,
      };
    }

    return borrower;
  });

  return { updatedList, hasChanges };
}

export function getDaysUntilNextPayment(borrower: Borrower): number | null {
  const payments = Array.isArray(borrower.payments) ? borrower.payments : [];
  const totalPaid = payments.reduce((sum, p) => sum + (p?.amount || 0), 0);
  const isCompleted = totalPaid >= borrower.totalToPay;
  if (isCompleted || borrower.isArchived) return null;

  const paidIndices = payments.filter(p => p !== undefined).map((p) => p.installmentIndex);
  let nextIndex = -1;
  for (let i = 0; i < borrower.duration; i++) {
    if (!paidIndices.includes(i)) {
      nextIndex = i;
      break;
    }
  }

  if (nextIndex === -1) return null;

  const startDate = new Date(borrower.loanDate);
  if (isNaN(startDate.getTime())) return null;

  const dueDate = new Date(startDate);
  const offset = nextIndex + 1;

  if (borrower.frequency === 'daily') {
    dueDate.setDate(dueDate.getDate() + offset);
  } else if (borrower.frequency === 'weekly') {
    dueDate.setDate(dueDate.getDate() + offset * 7);
  } else if (borrower.frequency === 'monthly') {
    dueDate.setMonth(dueDate.getMonth() + offset);
  }

  // Parse dueTime (default to 17:00 / 5:00 PM if not specified)
  let dueHour = 17;
  let dueMinute = 0;
  if (borrower.dueTime) {
    const parts = borrower.dueTime.split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(h) && h >= 0 && h < 24) dueHour = h;
      if (!isNaN(m) && m >= 0 && m < 60) dueMinute = m;
    }
  }

  dueDate.setHours(dueHour, dueMinute, 0, 0);

  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();

  if (diffTime < 0) {
    // Overdue (past due date and due hour)
    const daysOverdue = Math.floor(Math.abs(diffTime) / (1000 * 60 * 60 * 24));
    return -daysOverdue - 1; // -1 for overdue today, -2 for overdue yesterday etc
  } else {
    // Future or today
    const isSameDay = dueDate.getDate() === now.getDate() &&
                      dueDate.getMonth() === now.getMonth() &&
                      dueDate.getFullYear() === now.getFullYear();
    if (isSameDay) {
      return 0; // Due today
    }

    const d1 = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}

export function backfillShortIds(borrowersList: Borrower[]): { list: Borrower[]; hasChanges: boolean } {
  let hasChanges = false;
  const prefix = 'KH-';
  
  // Find maximum existing number
  let maxNum = 1000;
  (borrowersList || []).forEach(b => {
    if (b && b.shortId) {
      const match = b.shortId.match(/KH-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  });

  const listWithIds = (borrowersList || []).map(b => {
    if (b && !b.shortId) {
      maxNum += 1;
      hasChanges = true;
      return { ...b, shortId: `${prefix}${maxNum}` };
    }
    return b;
  });

  return { list: listWithIds, hasChanges };
}


