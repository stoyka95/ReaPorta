"use client";

import * as React from "react";
import { Calculator } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, Input } from "@/components/ui";
import { calculateMortgage } from "@/lib/mortgage";
import { formatPrice } from "@/lib/format";

export interface MortgageCalculatorProps {
  initialPrice: number;
}

export function MortgageCalculator({ initialPrice }: MortgageCalculatorProps) {
  const t = useTranslations("detail");
  const [price, setPrice] = React.useState(initialPrice > 0 ? initialPrice : 5_000_000);
  const [downPaymentPercent, setDownPaymentPercent] = React.useState(20);
  const [annualRate, setAnnualRate] = React.useState(5);
  const [years, setYears] = React.useState(30);

  const result = calculateMortgage({
    price,
    downPaymentPercent,
    annualInterestRate: annualRate,
    years,
  });

  return (
    <Card padding="lg" className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-accent-text">
          <Calculator className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <h2 className="type-h3 text-strong">{t("mortgageTitle")}</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("mortgagePrice")}
          type="number"
          min={100_000}
          step={50_000}
          value={price}
          onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))}
        />
        <Input
          label={`${t("mortgageDownPayment")} (%)`}
          type="number"
          min={0}
          max={90}
          step={1}
          value={downPaymentPercent}
          onChange={(e) =>
            setDownPaymentPercent(Math.min(90, Math.max(0, Number(e.target.value) || 0)))
          }
          helperText={formatPrice(result.downPaymentAmount)}
        />
        <Input
          label={t("mortgageRate")}
          type="number"
          min={0}
          max={20}
          step={0.1}
          value={annualRate}
          onChange={(e) => setAnnualRate(Math.max(0, Number(e.target.value) || 0))}
        />
        <Input
          label={t("mortgageYears")}
          type="number"
          min={1}
          max={40}
          step={1}
          value={years}
          onChange={(e) => setYears(Math.min(40, Math.max(1, Number(e.target.value) || 1)))}
        />
      </div>

      <div className="grid gap-4 rounded-xl border border-violet-200 bg-violet-50 p-5 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="type-caption text-muted">{t("mortgageLoanAmount")}</p>
          <p data-mortgage-loan="true" className="type-h3 text-strong tnum">
            {formatPrice(result.loanAmount)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="type-caption text-muted">{t("mortgageMonthly")}</p>
          <p data-mortgage-monthly="true" className="type-price-xl text-accent-text">
            {formatPrice(result.monthlyPayment)}
          </p>
        </div>
      </div>

      <p className="type-caption text-muted font-normal">{t("mortgageDisclaimer")}</p>
    </Card>
  );
}
