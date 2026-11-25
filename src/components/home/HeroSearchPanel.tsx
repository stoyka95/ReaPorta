"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Button,
  Combobox,
  GlassPanel,
  SegmentedControl,
  Select,
  type ComboboxOption,
} from "@/components/ui";
import { formatListingCount, LOCATION_TYPE_LABELS } from "@/lib/format";

interface SuggestApiItem {
  id: number;
  name: string;
  type: "kraj" | "okres" | "obec" | "cast";
  slug: string;
  fullSlug: string;
  listingCount: number;
  parentName: string | null;
}

export function HeroSearchPanel() {
  const t = useTranslations("home");
  const router = useRouter();

  const [offer, setOffer] = React.useState<"prodej" | "pronajem">("prodej");
  const [category, setCategory] = React.useState<string>("vse");
  const [query, setQuery] = React.useState("");
  const [selectedSlug, setSelectedSlug] = React.useState<string | null>(null);
  const [suggestions, setSuggestions] = React.useState<ComboboxOption[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/locations/suggest?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { items: SuggestApiItem[] };
        setSuggestions(
          data.items.map((item) => ({
            value: item.fullSlug,
            label: item.name,
            meta: item.parentName ?? LOCATION_TYPE_LABELS[item.type] ?? item.type,
            badge: formatListingCount(item.listingCount),
          })),
        );
      } catch {
        // Přerušeno dalším vstupem uživatele
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const base = `/${offer}/${category}`;
    if (selectedSlug) {
      router.push(`${base}/${selectedSlug}`);
      return;
    }
    const trimmed = query.trim();
    if (trimmed) {
      // Pokud uživatel napsal text bez kliknutí na návrh, použije se první návrh nebo fulltext ?q=
      const firstSuggestion = suggestions[0];
      if (firstSuggestion) {
        router.push(`${base}/${firstSuggestion.value}`);
      } else {
        router.push(`${base}?q=${encodeURIComponent(trimmed)}`);
      }
      return;
    }
    router.push(base);
  }

  return (
    <GlassPanel level={2} padding="md" radius="2xl" className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl
            ariaLabel={t("searchOfferLabel")}
            value={offer}
            onChange={setOffer}
            options={[
              { value: "prodej", label: "Prodej" },
              { value: "pronajem", label: "Pronájem" },
            ]}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-[205px_1fr_auto] md:items-end">
          <Select
            label={t("searchCategoryLabel")}
            value={category}
            onValueChange={setCategory}
            options={[
              { value: "vse", label: t("searchCategoryAll") },
              { value: "byty", label: t("categories.flat") },
              { value: "domy", label: t("categories.house") },
              { value: "pozemky", label: t("categories.land") },
              { value: "komercni", label: t("categories.commercial") },
              { value: "ostatni", label: t("categories.other") },
            ]}
          />

          <Combobox
            label={t("searchLocationLabel")}
            placeholder={t("searchLocationPlaceholder")}
            value={query}
            onChange={(val) => {
              setQuery(val);
              setSelectedSlug(null);
            }}
            options={suggestions}
            onSelect={(opt) => {
              setQuery(opt.label);
              setSelectedSlug(opt.value);
            }}
            loading={loading}
            emptyText={t("searchEmptyLocations")}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            leftIcon={<Search className="h-4.5 w-4.5" strokeWidth={2} />}
            className="h-12 w-full md:w-auto"
          >
            {t("searchSubmit")}
          </Button>
        </div>
      </form>
    </GlassPanel>
  );
}
