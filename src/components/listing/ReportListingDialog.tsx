"use client";

import * as React from "react";
import { Flag } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
  Select,
  Textarea,
  useToast,
} from "@/components/ui";

export function ReportListingDialog({ listingId }: { listingId: string }) {
  const t = useTranslations("detail");
  const { push } = useToast();
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("wrong_info");
  const [details, setDetails] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, reason, details }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Nahlášení se nepodařilo odeslat.");
        return;
      }
      setOpen(false);
      setDetails("");
      push({ tone: "success", title: t("reportSuccess") });
    } catch {
      setError("Něco se nepovedlo. Zkuste to prosím znovu.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Flag className="h-4 w-4" strokeWidth={1.75} />}
        >
          {t("reportButton")}
        </Button>
      </DialogTrigger>
      <DialogContent title={t("reportTitle")} description={t("reportDesc")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label={t("reportReason")}
            value={reason}
            onValueChange={setReason}
            options={[
              { value: "wrong_info", label: "Nepřesné nebo chybné údaje" },
              { value: "sold", label: "Nemovitost je již prodána / pronajata" },
              { value: "duplicate", label: "Duplicitní inzerát" },
              { value: "fraud", label: "Podezření na podvodný inzerát" },
              { value: "other", label: "Jiný důvod" },
            ]}
          />
          <Textarea
            label={t("reportDetails")}
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Popište prosím stručně, co nesouhlasí…"
          />
          {error ? (
            <p role="alert" className="type-small text-danger">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button variant="ghost">Zrušit</Button>
            </DialogClose>
            <Button type="submit" variant="primary" loading={submitting}>
              {t("reportSubmit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
