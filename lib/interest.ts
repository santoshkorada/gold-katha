export type InterestType = 'monthly' | 'daily';

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function calendarDaysBetween(from: Date, to: Date): number {
  const start = startOfLocalDay(from).getTime();
  const end = startOfLocalDay(to).getTime();
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

export function calendarMonthsAndDays(
  from: Date,
  to: Date
): { months: number; days: number } {
  const start = startOfLocalDay(from);
  const end = startOfLocalDay(to);
  if (end <= start) return { months: 0, days: 0 };

  let months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const lastDayOfPrevMonth = new Date(
      end.getFullYear(),
      end.getMonth(),
      0
    ).getDate();
    days += lastDayOfPrevMonth;
  }

  return { months: Math.max(0, months), days: Math.max(0, days) };
}

export type AccruedInterest = {
  elapsedDays: number;
  elapsedMonths: number;
  extraDays: number;
  amount: number;
  periodLabel: string;
};

/** Interest from the loan created date through today. */
export function accruedInterestTillDate(
  principal: number,
  interestPerHundred: number,
  interestType: InterestType,
  createdAt: string,
  now = new Date()
): AccruedInterest {
  const created = new Date(createdAt);
  const perPeriod = periodInterest(principal, interestPerHundred);
  const elapsedDays = calendarDaysBetween(created, now);
  const type: InterestType = interestType === 'daily' ? 'daily' : 'monthly';

  if (type === 'daily') {
    return {
      elapsedDays,
      elapsedMonths: 0,
      extraDays: elapsedDays,
      amount: roundMoney(perPeriod * elapsedDays),
      periodLabel:
        elapsedDays === 1 ? '1 day' : `${elapsedDays} days`,
    };
  }

  const { months, days } = calendarMonthsAndDays(created, now);
  const monthlyRate = perPeriod;

  // Less than 1 month: charge a full month. After that, add extra days
  // at (1-month interest / 30) per day.
  let amount: number;
  let periodLabel: string;
  let billedMonths: number;
  let billedExtraDays: number;

  if (months < 1) {
    amount = monthlyRate;
    billedMonths = 1;
    billedExtraDays = 0;
    periodLabel = '1 month (minimum)';
  } else {
    billedMonths = months;
    billedExtraDays = days;
    amount = monthlyRate * months + monthlyRate * (days / 30);
    const parts: string[] = [
      months === 1 ? '1 month' : `${months} months`,
    ];
    if (days > 0) {
      parts.push(days === 1 ? '1 day' : `${days} days`);
    }
    periodLabel = parts.join(' + ');
  }

  return {
    elapsedDays,
    elapsedMonths: billedMonths,
    extraDays: billedExtraDays,
    amount: roundMoney(amount),
    periodLabel,
  };
}

/** Interest for one period: ₹X per ₹100 of principal. */
export function periodInterest(
  principal: number,
  interestPerHundred: number
): number {
  if (principal <= 0 || interestPerHundred <= 0) return 0;
  return (principal / 100) * interestPerHundred;
}

/** Total interest for the agreed duration (months or days). */
export function totalInterest(
  principal: number,
  interestPerHundred: number,
  duration: number
): number {
  if (duration <= 0) return 0;
  return periodInterest(principal, interestPerHundred) * duration;
}

export function interestPeriodLabel(type: InterestType): string {
  return type === 'daily' ? 'day' : 'month';
}

export function interestDurationSuffix(type: InterestType, duration: number): string {
  const unit = interestPeriodLabel(type);
  return duration === 1 ? unit : `${unit}s`;
}

export type LedgerEntry = {
  date: Date;
  description: string;
  principalAccrued?: number;
  interestAccrued?: number;
  principalPaid?: number;
  interestPaid?: number;
  balancePrincipal: number;
  balanceInterest: number;
};

export type LedgerState = {
  entries: LedgerEntry[];
  currentPrincipal: number;
  unpaidInterest: number;
  totalInterestAccrued: number;
  totalDue: number;
};

type TransactionLike = {
  type: 'interest_payment' | 'principal_payment';
  amount: number;
  created_at: string;
};

export function generateLedger(
  initialPrincipal: number,
  interestPerHundred: number,
  interestType: InterestType,
  createdAt: string,
  transactions: TransactionLike[],
  now = new Date()
): LedgerState {
  const entries: LedgerEntry[] = [];
  let currentPrincipal = initialPrincipal;
  let unpaidInterest = 0;
  let totalInterestAccrued = 0;
  let lastDate = new Date(createdAt);

  const ratePerDay = interestType === 'daily' 
    ? interestPerHundred 
    : interestPerHundred / 30;

  entries.push({
    date: lastDate,
    description: 'Loan Created',
    balancePrincipal: currentPrincipal,
    balanceInterest: unpaidInterest,
  });

  const sortedTxns = [...transactions].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  for (const txn of sortedTxns) {
    const txnDate = new Date(txn.created_at);
    if (txnDate <= lastDate) continue; // safety check

    const days = calendarDaysBetween(lastDate, txnDate);
    if (days > 0 && currentPrincipal > 0) {
      const interestForPeriod = roundMoney((currentPrincipal / 100) * ratePerDay * days);
      unpaidInterest += interestForPeriod;
      totalInterestAccrued += interestForPeriod;
      
      entries.push({
        date: txnDate,
        description: `Interest accrued (${days} days)`,
        interestAccrued: interestForPeriod,
        balancePrincipal: currentPrincipal,
        balanceInterest: unpaidInterest,
      });
    }

    if (txn.type === 'interest_payment') {
      unpaidInterest -= txn.amount;
      entries.push({
        date: txnDate,
        description: 'Interest Payment',
        interestPaid: txn.amount,
        balancePrincipal: currentPrincipal,
        balanceInterest: unpaidInterest,
      });
    } else if (txn.type === 'principal_payment') {
      currentPrincipal -= txn.amount;
      entries.push({
        date: txnDate,
        description: 'Principal Payment',
        principalPaid: txn.amount,
        balancePrincipal: currentPrincipal,
        balanceInterest: unpaidInterest,
      });
    }

    lastDate = txnDate;
  }

  // Calculate to 'now'
  if (now > lastDate && currentPrincipal > 0) {
    const days = calendarDaysBetween(lastDate, now);
    if (days > 0) {
      const interestForPeriod = roundMoney((currentPrincipal / 100) * ratePerDay * days);
      unpaidInterest += interestForPeriod;
      totalInterestAccrued += interestForPeriod;
      
      entries.push({
        date: now,
        description: `Interest accrued (${days} days)`,
        interestAccrued: interestForPeriod,
        balancePrincipal: currentPrincipal,
        balanceInterest: unpaidInterest,
      });
    }
  }

  // Enforce 1-month minimum rule
  if (interestType === 'monthly') {
    const { months } = calendarMonthsAndDays(new Date(createdAt), now);
    if (months < 1) {
      const minInterest = roundMoney((initialPrincipal / 100) * interestPerHundred);
      if (totalInterestAccrued < minInterest) {
        const diff = roundMoney(minInterest - totalInterestAccrued);
        unpaidInterest += diff;
        totalInterestAccrued = minInterest;
        
        entries.push({
          date: now,
          description: '1-Month Minimum Interest Adjustment',
          interestAccrued: diff,
          balancePrincipal: currentPrincipal,
          balanceInterest: unpaidInterest,
        });
      }
    }
  }

  return {
    entries,
    currentPrincipal: roundMoney(currentPrincipal),
    unpaidInterest: roundMoney(unpaidInterest),
    totalInterestAccrued: roundMoney(totalInterestAccrued),
    totalDue: roundMoney(currentPrincipal + unpaidInterest),
  };
}
