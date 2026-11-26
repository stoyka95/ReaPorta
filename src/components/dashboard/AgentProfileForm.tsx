"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, ExternalLink, Save } from "lucide-react";
import type { AgentProfileEditData } from "@/db/queries/profiles";
import { Badge, Button, Card, Chip, Input, Textarea, useToast } from "@/components/ui";

const LANGUAGES = [
  { code: "cs", label: "Čeština" },
  { code: "en", label: "Angličtina" },
  { code: "de", label: "Němčina" },
  { code: "sk", label: "Slovenština" },
  { code: "uk", label: "Ukrajinština" },
] as const;

export function AgentProfileForm({ initialProfile }: { initialProfile: AgentProfileEditData }) {
  const router = useRouter();
  const { push } = useToast();

  const [displayName, setDisplayName] = React.useState(initialProfile.displayName);
  const [bio, setBio] = React.useState(initialProfile.bio);
  const [phonePublic, setPhonePublic] = React.useState(initialProfile.phonePublic);
  const [emailPublic, setEmailPublic] = React.useState(initialProfile.emailPublic);
  const [languages, setLanguages] = React.useState<string[]>(initialProfile.languages);
  const [saving, setSaving] = React.useState(false);

  function toggleLang(code: string) {
    setLanguages((prev) => {
      if (prev.includes(code)) {
        return prev.length > 1 ? prev.filter((l) => l !== code) : prev;
      }
      return [...prev, code];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          bio,
          phonePublic,
          emailPublic,
          languages,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        push({ tone: "danger", title: data.error ?? "Profil se nepodařilo uložit." });
        return;
      }
      push({ tone: "success", title: "Profil makléře byl aktualizován." });
      router.refresh();
    } catch {
      push({ tone: "danger", title: "Něco se nepovedlo. Zkuste to prosím znovu." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="type-h1 text-strong">Profil makléře</h1>
          <p className="mt-1 type-small text-muted">
            Údaje zobrazené u vašich nabídek a na veřejném profilu.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          rightIcon={<ExternalLink className="h-4 w-4" aria-hidden="true" />}
          asChild
        >
          <Link href={`/makleri/${initialProfile.slug}`}>Veřejný profil</Link>
        </Button>
      </div>

      {initialProfile.agency ? (
        <Card padding="md" className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-accent-text">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="type-caption text-muted">Realitní kancelář</p>
              <p className="type-body font-semibold text-strong">{initialProfile.agency.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/agentury/${initialProfile.agency.slug}`}>Stránka kanceláře</Link>
          </Button>
        </Card>
      ) : null}

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-2">
            <h2 className="type-h3 text-strong">Veřejné údaje</h2>
            {initialProfile.verifiedAt ? <Badge variant="success">Ověřený makléř</Badge> : null}
          </div>

          <Input
            label="Zobrazované jméno"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Veřejný telefon"
              type="tel"
              value={phonePublic}
              onChange={(e) => setPhonePublic(e.target.value)}
              placeholder="+420 602 123 456"
            />
            <Input
              label="Veřejný e-mail"
              type="email"
              value={emailPublic}
              onChange={(e) => setEmailPublic(e.target.value)}
              placeholder="jmeno@kancelar.cz"
            />
          </div>

          <Textarea
            label="Medailonek (bio)"
            rows={5}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Popište svou specializaci, zkušenosti a regiony, kde působíte…"
          />

          <div className="space-y-2">
            <span className="block type-small font-medium text-strong">Jazyky</span>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <Chip
                  key={lang.code}
                  size="sm"
                  selected={languages.includes(lang.code)}
                  onClick={() => toggleLang(lang.code)}
                >
                  {lang.label}
                </Chip>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={saving}
            leftIcon={<Save className="h-4 w-4" aria-hidden="true" />}
          >
            Uložit profil
          </Button>
        </form>
      </Card>
    </div>
  );
}
