export interface MortgageInput {
  price: number;
  downPaymentPercent: number;
  annualInterestRate: number;
  years: number;
}

export interface MortgageResult {
  downPaymentAmount: number;
  loanAmount: number;
  monthlyPayment: number;
  totalPaid: number;
  totalInterest: number;
}

export function calculateMortgage(input: MortgageInput): MortgageResult {
  const safePrice = Math.max(0, input.price);
  const clampedDownPct = Math.min(95, Math.max(0, input.downPaymentPercent));
  const clampedYears = Math.min(40, Math.max(1, Math.round(input.years)));
  const clampedRate = Math.min(25, Math.max(0, input.annualInterestRate));

  const downPaymentAmount = Math.round((safePrice * clampedDownPct) / 100);
  const loanAmount = Math.max(0, safePrice - downPaymentAmount);
  const months = clampedYears * 12;

  if (loanAmount === 0 || months === 0) {
    return {
      downPaymentAmount,
      loanAmount: 0,
      monthlyPayment: 0,
      totalPaid: 0,
      totalInterest: 0,
    };
  }

  const monthlyRate = clampedRate / 100 / 12;
  let exactMonthly: number;
  if (monthlyRate === 0) {
    exactMonthly = loanAmount / months;
  } else {
    const factor = Math.pow(1 + monthlyRate, months);
    exactMonthly = (loanAmount * (monthlyRate * factor)) / (factor - 1);
  }

  const monthlyPayment = Math.round(exactMonthly);
  const totalPaid = Math.round(exactMonthly * months);
  const totalInterest = Math.max(0, totalPaid - loanAmount);

  return {
    downPaymentAmount,
    loanAmount,
    monthlyPayment,
    totalPaid,
    totalInterest,
  };
}
