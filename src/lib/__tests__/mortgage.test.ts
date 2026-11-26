import { describe, expect, it } from "vitest";
import { calculateMortgage } from "@/lib/mortgage";

describe("calculateMortgage", () => {
  it("computes QA A16 reference scenario accurately (5M, 20% down, 5% p.a., 30y -> 4M loan, ~21 473 Kč)", () => {
    const result = calculateMortgage({
      price: 5_000_000,
      downPaymentPercent: 20,
      annualInterestRate: 5,
      years: 30,
    });
    expect(result.downPaymentAmount).toBe(1_000_000);
    expect(result.loanAmount).toBe(4_000_000);
    expect(Math.abs(result.monthlyPayment - 21_473)).toBeLessThanOrEqual(5);
  });

  it("handles 0% interest rate without division by zero", () => {
    const result = calculateMortgage({
      price: 3_600_000,
      downPaymentPercent: 0,
      annualInterestRate: 0,
      years: 30,
    });
    expect(result.monthlyPayment).toBe(10_000);
    expect(result.totalInterest).toBe(0);
  });
});
