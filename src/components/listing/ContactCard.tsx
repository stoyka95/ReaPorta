"use client";

import * as React from "react";
import { CheckCircle2, Heart, Phone, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  GlassPanel,
  Input,
  Textarea,
  useToast,
} from "@/components/ui";
import { inquirySchema } from "@/features/inquiries/schema";
import { useSession } from "@/components/auth/SessionProvider";
import { cn } from "@/lib/cn";

export interface ContactCardProps {
  listingId: string;
  listingTitle: string;
  agent: {
    displayName: string;
    slug: string;
    photoKey: string | null;
    languages: string[];
    verifiedAt: Date | string | null;
    hasPhone: boolean;
  } | null;
  agency: {
    name: string;
    slug: string;
  } | null;
  disabled?: boolean;
}

export function ContactCard({
  listingId,
  listingTitle,
  agent,
  agency,
  disabled = false,
}: ContactCardProps) {
  const t = useTranslations("detail");
  const tCard = useTranslations("card");
  const { push } = useToast();
  const { user, isFavorite, toggleFavorite } = useSession();

  const [revealedPhone, setRevealedPhone] = React.useState<string | null>(null);
  const [phoneLoading, setPhoneLoading] = React.useState(false);
  const favorited = isFavorite(listingId);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [message, setMessage] = React.useState(
    `Dobrý den, mám zájem o více informací a prohlídku nabídky „${listingTitle}“.`,
  );
  const [consent, setConsent] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    setName((prev) => prev || user.name);
    setEmail((prev) => prev || user.email);
    setPhone((prev) => prev || user.phone || "");
  }, [user]);

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function handleRevealPhone() {
    if (revealedPhone || phoneLoading) return;
    setPhoneLoading(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/phone`, { method: "POST" });
      const data = (await res.json()) as { phone?: string; error?: string };
      if (!res.ok || !data.phone) {
        push({
          tone: "danger",
          title: data.error ?? "Telefon se nepodařilo zobrazit.",
        });
        return;
      }
      setRevealedPhone(data.phone);
    } catch {
      push({ tone: "danger", title: "Něco se nepovedlo. Zkuste to prosím znovu." });
    } finally {
      setPhoneLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || sent) return;

    setFieldErrors({});
    setFormError(null);

    const parsed = inquirySchema.safeParse({
      listingId,
      name,
      email,
      phone,
      message,
      consent,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json()) as {
        id?: string;
        error?: string;
        fieldErrors?: Record<string, string>;
      };
      if (!res.ok) {
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        setFormError(data.error ?? "Poptávku se nepodařilo odeslat.");
        return;
      }
      setSent(true);
      push({
        tone: "success",
        title: t("formSuccessTitle"),
        description: t("formSuccessDesc"),
      });
    } catch {
      setFormError("Něco se nepovedlo. Zkuste to prosím znovu.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <GlassPanel id="kontakt" level={2} padding="lg" radius="xl" className="space-y-6">
      {/* Hlavička makléře */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <Avatar name={agent?.displayName ?? "Inzerent"} size="md" />
          <div className="min-w-0 space-y-0.5">
            <p className="truncate type-body font-semibold text-strong">
              {agent?.displayName ?? "Makléř"}
            </p>
            <p className="truncate type-small text-muted">
              {agency ? agency.name : t("privateSeller")}
            </p>
            {agent?.verifiedAt ? (
              <Badge variant="success" className="mt-1">
                Ověřený makléř
              </Badge>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            void toggleFavorite(listingId);
          }}
          aria-pressed={favorited}
          aria-label={favorited ? tCard("favoriteRemove") : tCard("favoriteAdd")}
          className={cn(
            "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-pill border border-line bg-surface transition-colors duration-150 hover:bg-hover cursor-pointer",
            favorited ? "text-accent" : "text-strong",
          )}
        >
          <Heart className={cn("h-5 w-5", favorited && "fill-current")} strokeWidth={1.75} />
        </button>
      </div>

      {/* Odhalení telefonu (AC-4.4 — číslo nikdy není v HTML před kliknutím) */}
      {agent?.hasPhone ? (
        <div>
          {revealedPhone ? (
            <a
              href={`tel:${revealedPhone.replace(/\s+/g, "")}`}
              data-revealed-phone="true"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-violet-200 bg-violet-100 px-4 type-body font-semibold text-violet-800 tnum"
            >
              <Phone className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden="true" />
              <span>{revealedPhone}</span>
            </a>
          ) : (
            <Button
              variant="secondary"
              size="md"
              loading={phoneLoading}
              disabled={disabled}
              leftIcon={<Phone className="h-4 w-4" strokeWidth={1.75} />}
              onClick={handleRevealPhone}
              className="w-full"
            >
              {t("revealPhone")}
            </Button>
          )}
        </div>
      ) : null}

      {/* Kontaktní formulář (AC-4.3) */}
      <div className="border-t border-line-subtle pt-5">
        <h2 className="type-h4 text-strong">{t("contactTitle")}</h2>

        {sent ? (
          <div
            role="status"
            data-inquiry-success="true"
            className="mt-4 rounded-xl border border-line bg-success-bg p-5 space-y-2"
          >
            <div className="flex items-center gap-2 text-success font-semibold">
              <CheckCircle2 className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
              <span>{t("formSuccessTitle")}</span>
            </div>
            <p className="type-small text-body">{t("formSuccessDesc")}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
            <Input
              label={t("formName")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={fieldErrors.name}
              disabled={disabled || submitting}
              autoComplete="name"
            />
            <Input
              label={t("formEmail")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email}
              disabled={disabled || submitting}
              autoComplete="email"
            />
            <Input
              label={t("formPhone")}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={fieldErrors.phone}
              disabled={disabled || submitting}
              autoComplete="tel"
            />
            <Textarea
              label={t("formMessage")}
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              error={fieldErrors.message}
              disabled={disabled || submitting}
            />
            <div className="space-y-1">
              <Checkbox
                label={t("formConsent")}
                checked={consent}
                onCheckedChange={(v) => setConsent(Boolean(v))}
                disabled={disabled || submitting}
              />
              {fieldErrors.consent ? (
                <p role="alert" className="type-small text-danger">
                  {fieldErrors.consent}
                </p>
              ) : null}
            </div>

            {formError ? (
              <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 type-small text-danger">
                {formError}
              </p>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={submitting}
              disabled={disabled}
              leftIcon={<Send className="h-4 w-4" strokeWidth={2} />}
              className="w-full"
            >
              {t("formSubmit")}
            </Button>
          </form>
        )}
      </div>
    </GlassPanel>
  );
}
