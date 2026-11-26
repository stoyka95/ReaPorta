"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  Star,
  Trash2,
  UploadCloud,
} from "lucide-react";
import type { EditableListingData } from "@/db/queries/dashboard";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Chip,
  Combobox,
  Input,
  SegmentedControl,
  Select,
  Stepper,
  Textarea,
  useToast,
  type ComboboxOption,
} from "@/components/ui";
import { DynamicPinPickerMap } from "@/components/map/DynamicPinPickerMap";
import {
  AMENITIES,
  BUILDING_TYPES,
  CATEGORIES,
  CONDITIONS,
  DISPOSITIONS,
  ENERGY_CLASSES,
  FURNISHED_OPTIONS,
  OWNERSHIPS,
  type ListingCategory,
  type OfferType,
} from "@/lib/search/schema";
import {
  AMENITY_LABELS,
  BUILDING_TYPE_LABELS,
  CATEGORY_LABELS,
  CONDITION_LABELS,
  DISPOSITION_LABELS,
  formatPrice,
  FURNISHED_LABELS,
  LOCATION_TYPE_LABELS,
  OFFER_LABELS,
  OWNERSHIP_LABELS,
} from "@/lib/format";
import { getImageVariantUrl } from "@/lib/media-url";
import { submitListingValidationSchema } from "@/features/dashboard/schema";
import { cn } from "@/lib/cn";

const WIZARD_STEPS = [
  { id: "typ", label: "Typ" },
  { id: "adresa", label: "Adresa a mapa" },
  { id: "parametry", label: "Parametry" },
  { id: "popis", label: "Popis a cena" },
  { id: "fotky", label: "Fotky" },
  { id: "nahled", label: "Náhled" },
];

const LAST_DRAFT_STORAGE_KEY = "reaporta:wizardLastDraft";

interface SuggestLocationItem {
  id: number;
  name: string;
  type: "kraj" | "okres" | "obec" | "cast";
  slug: string;
  fullSlug: string;
  lat: number;
  lng: number;
  listingCount: number;
  parentName: string | null;
}

interface ListingWizardProps {
  initialListing?: EditableListingData | null;
  initialStep?: number;
}

export function ListingWizard({ initialListing = null, initialStep = 0 }: ListingWizardProps) {
  const router = useRouter();
  const { push } = useToast();

  const [listingId, setListingId] = React.useState<string | null>(initialListing?.id ?? null);
  const [slug, setSlug] = React.useState<string | null>(initialListing?.slug ?? null);
  const [status, setStatus] = React.useState<string>(initialListing?.status ?? "draft");
  const [step, setStep] = React.useState<number>(
    Math.min(WIZARD_STEPS.length - 1, Math.max(0, initialStep)),
  );

  // Krok 1: Typ
  const [offerType, setOfferType] = React.useState<OfferType>(initialListing?.offerType ?? "sale");
  const [category, setCategory] = React.useState<ListingCategory>(
    initialListing?.category ?? "flat",
  );
  const [subtype, setSubtype] = React.useState<string>(initialListing?.subtype ?? "");
  const [disposition, setDisposition] = React.useState<string>(
    initialListing?.disposition ?? "2+kk",
  );

  // Krok 2: Adresa a mapa
  const [locationId, setLocationId] = React.useState<number | undefined>(
    initialListing?.locationId,
  );
  const [city, setCity] = React.useState<string>(initialListing?.city ?? "Praha");
  const [district, setDistrict] = React.useState<string>(initialListing?.district ?? "");
  const [street, setStreet] = React.useState<string>(initialListing?.street ?? "");
  const [houseNumber, setHouseNumber] = React.useState<string>(initialListing?.houseNumber ?? "");
  const [zip, setZip] = React.useState<string>(initialListing?.zip ?? "");
  const [lat, setLat] = React.useState<number>(initialListing?.lat ?? 50.0755);
  const [lng, setLng] = React.useState<number>(initialListing?.lng ?? 14.4378);
  const [showExactLocation, setShowExactLocation] = React.useState<boolean>(
    initialListing?.showExactLocation ?? false,
  );

  const [locQuery, setLocQuery] = React.useState(initialListing?.locationName ?? "");
  const [locResults, setLocResults] = React.useState<SuggestLocationItem[]>([]);
  const [locLoading, setLocLoading] = React.useState(false);

  // Krok 3: Parametry
  const [usableArea, setUsableArea] = React.useState<string>(
    initialListing?.usableArea !== null && initialListing?.usableArea !== undefined
      ? String(initialListing.usableArea)
      : "",
  );
  const [landArea, setLandArea] = React.useState<string>(
    initialListing?.landArea !== null && initialListing?.landArea !== undefined
      ? String(initialListing.landArea)
      : "",
  );
  const [floor, setFloor] = React.useState<string>(
    initialListing?.floor !== null && initialListing?.floor !== undefined
      ? String(initialListing.floor)
      : "",
  );
  const [floorsTotal, setFloorsTotal] = React.useState<string>(
    initialListing?.floorsTotal !== null && initialListing?.floorsTotal !== undefined
      ? String(initialListing.floorsTotal)
      : "",
  );
  const [yearBuilt, setYearBuilt] = React.useState<string>(
    initialListing?.yearBuilt !== null && initialListing?.yearBuilt !== undefined
      ? String(initialListing.yearBuilt)
      : "",
  );
  const [buildingType, setBuildingType] = React.useState<string>(
    initialListing?.buildingType ?? "",
  );
  const [condition, setCondition] = React.useState<string>(initialListing?.condition ?? "");
  const [ownership, setOwnership] = React.useState<string>(initialListing?.ownership ?? "");
  const [energyClass, setEnergyClass] = React.useState<string>(initialListing?.energyClass ?? "");
  const [furnished, setFurnished] = React.useState<string>(initialListing?.furnished ?? "");
  const [amenities, setAmenities] = React.useState<string[]>(initialListing?.amenities ?? []);

  // Krok 4: Popis a cena
  const [title, setTitle] = React.useState<string>(
    initialListing?.title && initialListing.title !== "Koncept inzerátu"
      ? initialListing.title
      : "",
  );
  const [description, setDescription] = React.useState<string>(initialListing?.description ?? "");
  const [price, setPrice] = React.useState<string>(
    initialListing?.price !== null && initialListing?.price !== undefined
      ? String(initialListing.price)
      : "",
  );
  const [priceUnit, setPriceUnit] = React.useState<"total" | "per_month" | "per_m2_month">(
    initialListing?.priceUnit ?? (offerType === "rent" ? "per_month" : "total"),
  );
  const [priceNegotiable, setPriceNegotiable] = React.useState<boolean>(
    initialListing?.priceNegotiable ?? false,
  );
  const [priceOnRequest, setPriceOnRequest] = React.useState<boolean>(
    initialListing?.priceOnRequest ?? false,
  );
  const [feesMonthly, setFeesMonthly] = React.useState<string>(
    initialListing?.feesMonthly !== null && initialListing?.feesMonthly !== undefined
      ? String(initialListing.feesMonthly)
      : "",
  );
  const [deposit, setDeposit] = React.useState<string>(
    initialListing?.deposit !== null && initialListing?.deposit !== undefined
      ? String(initialListing.deposit)
      : "",
  );

  // Krok 5: Fotky
  const [images, setImages] = React.useState(initialListing?.images ?? []);
  const [uploading, setUploading] = React.useState(false);
  const [uploadErrors, setUploadErrors] = React.useState<string[]>([]);
  const [draggedImageId, setDraggedImageId] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Stav ukládání
  const [saving, setSaving] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<string | null>(null);
  const [stepError, setStepError] = React.useState<string | null>(null);
  const [resumeDraftBanner, setResumeDraftBanner] = React.useState<{
    id: string;
    step: number;
  } | null>(null);

  // Kontrola rozpracovaného konceptu při otevření /novy (QA C4)
  React.useEffect(() => {
    if (initialListing) return;
    try {
      const raw = window.localStorage.getItem(LAST_DRAFT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { id?: string; step?: number };
      if (parsed.id) {
        setResumeDraftBanner({ id: parsed.id, step: parsed.step ?? 1 });
      }
    } catch {
      // ignore storage errors
    }
  }, [initialListing]);

  // Našeptávač lokalit pro krok 2
  React.useEffect(() => {
    const q = locQuery.trim();
    if (q.length < 2) {
      setLocResults([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = window.setTimeout(async () => {
      setLocLoading(true);
      try {
        const res = await fetch(`/api/locations/suggest?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { items: SuggestLocationItem[] };
        setLocResults(data.items ?? []);
      } catch {
        // aborted
      } finally {
        setLocLoading(false);
      }
    }, 200);
    return () => {
      ctrl.abort();
      window.clearTimeout(timer);
    };
  }, [locQuery]);

  const locOptions: ComboboxOption[] = locResults.map((item) => ({
    value: String(item.id),
    label: item.name,
    meta: item.parentName ?? LOCATION_TYPE_LABELS[item.type] ?? item.type,
  }));

  function buildPayload(submitForReview = false) {
    return {
      offerType,
      category,
      subtype: subtype.trim() || null,
      disposition: category === "flat" && disposition ? disposition : null,
      ...(locationId ? { locationId } : {}),
      city: city.trim() || "Praha",
      district: district.trim() || null,
      street: street.trim() || null,
      houseNumber: houseNumber.trim() || null,
      zip: zip.trim() || null,
      lat,
      lng,
      showExactLocation,
      usableArea: usableArea ? Number(usableArea) : null,
      landArea: landArea ? Number(landArea) : null,
      floor: floor !== "" ? Number(floor) : null,
      floorsTotal: floorsTotal !== "" ? Number(floorsTotal) : null,
      yearBuilt: yearBuilt !== "" ? Number(yearBuilt) : null,
      buildingType: buildingType || null,
      condition: condition || null,
      ownership: ownership || null,
      energyClass: energyClass || null,
      furnished: furnished || null,
      amenities,
      title: title.trim() || "Koncept inzerátu",
      description: description.trim(),
      price: priceOnRequest ? null : price ? Number(price) : null,
      priceUnit,
      priceNegotiable,
      priceOnRequest,
      feesMonthly: feesMonthly ? Number(feesMonthly) : null,
      deposit: deposit ? Number(deposit) : null,
      submitForReview,
    };
  }

  async function persistDraft(
    nextStepIndex: number,
    submitForReview = false,
  ): Promise<string | null> {
    setSaving(true);
    setStepError(null);
    try {
      const payload = buildPayload(submitForReview);
      if (!listingId) {
        const res = await fetch("/api/dashboard/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as { id?: string; slug?: string; error?: string };
        if (!res.ok || !data.id) {
          setStepError(data.error ?? "Koncept se nepodařilo uložit.");
          return null;
        }
        setListingId(data.id);
        setSlug(data.slug ?? null);
        try {
          window.localStorage.setItem(
            LAST_DRAFT_STORAGE_KEY,
            JSON.stringify({ id: data.id, step: nextStepIndex }),
          );
        } catch {
          // ignore
        }
        window.history.replaceState(
          null,
          "",
          `/dashboard/inzeraty/${data.id}/upravit?krok=${nextStepIndex + 1}`,
        );
        setSavedAt(new Date().toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" }));
        return data.id;
      }

      const res = await fetch(`/api/dashboard/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        id?: string;
        slug?: string;
        status?: string;
        error?: string;
      };
      if (!res.ok) {
        setStepError(data.error ?? "Změny se nepodařilo uložit.");
        return null;
      }
      if (data.status) setStatus(data.status);
      if (data.slug) setSlug(data.slug);
      try {
        if (submitForReview) {
          window.localStorage.removeItem(LAST_DRAFT_STORAGE_KEY);
        } else {
          window.localStorage.setItem(
            LAST_DRAFT_STORAGE_KEY,
            JSON.stringify({ id: listingId, step: nextStepIndex }),
          );
        }
      } catch {
        // ignore
      }
      setSavedAt(new Date().toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" }));
      return listingId;
    } catch {
      setStepError("Nepodařilo se spojit se serverem. Zkuste to prosím znovu.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  function validateCurrentStep(): string | null {
    if (step === 1 && !city.trim()) {
      return "Vyberte prosím obec nebo městskou část.";
    }
    if (step === 3) {
      const check = submitListingValidationSchema.safeParse({
        offerType,
        category,
        city: city.trim() || "Praha",
        title: title.trim(),
        description: description.trim(),
        price: priceOnRequest ? null : price ? Number(price) : null,
        priceOnRequest,
      });
      if (!check.success) {
        return check.error.issues[0]?.message ?? "Zkontrolujte prosím název, popis a cenu.";
      }
    }
    return null;
  }

  async function handleNext() {
    const err = validateCurrentStep();
    if (err) {
      setStepError(err);
      return;
    }
    const nextStep = Math.min(WIZARD_STEPS.length - 1, step + 1);
    const id = await persistDraft(nextStep, false);
    if (!id) return;
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleBack() {
    const prevStep = Math.max(0, step - 1);
    if (listingId) {
      await persistDraft(prevStep, false);
    }
    setStep(prevStep);
  }

  async function handleSubmitForReview() {
    const check = submitListingValidationSchema.safeParse({
      offerType,
      category,
      city: city.trim() || "Praha",
      title: title.trim(),
      description: description.trim(),
      price: priceOnRequest ? null : price ? Number(price) : null,
      priceOnRequest,
    });
    if (!check.success) {
      setStepError(check.error.issues[0]?.message ?? "Doplňte prosím všechny povinné údaje.");
      return;
    }

    const id = await persistDraft(step, true);
    if (!id) return;
    push({
      tone: "success",
      title: status === "active" ? "Změny byly uloženy" : "Inzerát odeslán ke schválení",
      description:
        status === "active"
          ? "Aktualizace je ihned viditelná."
          : "Po schválení administrátorem se zobrazí na portálu.",
    });
    router.push("/dashboard/inzeraty");
    router.refresh();
  }

  async function handleFilesUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploadErrors([]);

    let activeId = listingId;
    if (!activeId) {
      activeId = await persistDraft(step, false);
      if (!activeId) return;
    }

    setUploading(true);
    const errors: string[] = [];

    for (const file of Array.from(fileList)) {
      if (file.size > 12 * 1024 * 1024) {
        errors.push(`${file.name}: Soubor překračuje limit 12 MB.`);
        continue;
      }

      const fd = new FormData();
      fd.set("listingId", activeId);
      fd.set("file", file);
      fd.set("alt", `${title || "Nemovitost"} – ${file.name.replace(/\.[^.]+$/, "")}`);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = (await res.json()) as {
          image?: EditableListingData["images"][number];
          error?: string;
        };
        if (!res.ok || !data.image) {
          errors.push(`${file.name}: ${data.error ?? "Nahrání selhalo."}`);
          continue;
        }
        setImages((prev) => [...prev, data.image!]);
      } catch {
        errors.push(`${file.name}: Chyba spojení při nahrávání.`);
      }
    }

    setUploadErrors(errors);
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function saveImageOrder(nextImages: EditableListingData["images"], coverId?: string) {
    if (!listingId || nextImages.length === 0) return;
    const effectiveCover = coverId ?? nextImages.find((i) => i.isCover)?.id ?? nextImages[0]!.id;
    const updated = nextImages.map((img, idx) => ({
      ...img,
      sortOrder: idx,
      isCover: img.id === effectiveCover,
    }));
    setImages(updated);

    await fetch(`/api/dashboard/listings/${listingId}/images/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderedIds: updated.map((i) => i.id),
        coverId: effectiveCover,
      }),
    });
  }

  async function moveImage(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved!);
    await saveImageOrder(next);
  }

  async function handleDropImage(targetId: string) {
    if (!draggedImageId || draggedImageId === targetId) return;
    const fromIdx = images.findIndex((i) => i.id === draggedImageId);
    const toIdx = images.findIndex((i) => i.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const next = [...images];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved!);
    setDraggedImageId(null);
    await saveImageOrder(next);
  }

  async function handleDeleteImage(imageId: string) {
    if (!listingId) return;
    const res = await fetch(`/api/dashboard/listings/${listingId}/images/${imageId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      push({ tone: "danger", title: "Fotografii se nepodařilo smazat." });
      return;
    }
    setImages((prev) => {
      const remaining = prev.filter((img) => img.id !== imageId);
      if (remaining.length > 0 && !remaining.some((img) => img.isCover)) {
        remaining[0] = { ...remaining[0]!, isCover: true };
      }
      return remaining;
    });
  }

  function suggestTitle() {
    const offerWord = offerType === "sale" ? "Prodej" : "Pronájem";
    const catWord =
      category === "flat"
        ? `bytu ${disposition || ""}`.trim()
        : category === "house"
          ? "rodinného domu"
          : category === "land"
            ? "pozemku"
            : category === "commercial"
              ? "komerčního prostoru"
              : "nemovitosti";
    const areaPart = usableArea ? `, ${usableArea} m²` : landArea ? `, ${landArea} m²` : "";
    const locPart = district || city ? `, ${district || city}` : "";
    setTitle(`${offerWord} ${catWord}${areaPart}${locPart}`);
  }

  const toggleAmenity = (key: string) => {
    setAmenities((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="type-h1 text-strong">
            {initialListing ? "Upravit inzerát" : "Nový inzerát"}
          </h1>
          {savedAt ? (
            <p className="mt-1 type-caption text-success" data-autosave-indicator="true">
              Koncept automaticky uložen v {savedAt}
            </p>
          ) : (
            <p className="mt-1 type-small text-muted">
              Průběh se ukládá automaticky po každém kroku.
            </p>
          )}
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/inzeraty">Zpět na přehled</Link>
        </Button>
      </div>

      {/* Nabídka pokračování rozpracovaného konceptu (QA C4) */}
      {resumeDraftBanner && !listingId ? (
        <Card
          padding="md"
          className="flex flex-wrap items-center justify-between gap-3 border-violet-200 bg-violet-50"
          data-resume-draft="true"
        >
          <div>
            <p className="type-small font-semibold text-strong">Máte rozpracovaný koncept</p>
            <p className="type-caption text-muted">
              Můžete plynule pokračovat tam, kde jste skončili.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                window.localStorage.removeItem(LAST_DRAFT_STORAGE_KEY);
                setResumeDraftBanner(null);
              }}
            >
              Začít znovu
            </Button>
            <Button variant="primary" size="sm" asChild>
              <Link
                href={`/dashboard/inzeraty/${resumeDraftBanner.id}/upravit?krok=${resumeDraftBanner.step + 1}`}
              >
                Pokračovat v konceptu
              </Link>
            </Button>
          </div>
        </Card>
      ) : null}

      <Stepper steps={WIZARD_STEPS} currentStep={step} />

      {stepError ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-danger bg-danger-bg px-4 py-3 type-small text-strong"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
          <span>{stepError}</span>
        </div>
      ) : null}

      {/* KROK 1: TYP */}
      {step === 0 ? (
        <Card padding="lg" className="space-y-6">
          <h2 className="type-h3 text-strong">1. Typ nabídky a nemovitosti</h2>
          <div className="space-y-2">
            <span className="block type-small font-medium text-strong">Typ nabídky</span>
            <SegmentedControl<OfferType>
              ariaLabel="Typ nabídky"
              value={offerType}
              onChange={(next) => {
                setOfferType(next);
                setPriceUnit(next === "rent" ? "per_month" : "total");
              }}
              options={[
                { value: "sale", label: "Prodej" },
                { value: "rent", label: "Pronájem" },
              ]}
            />
          </div>

          <Select
            label="Kategorie nemovitosti"
            value={category}
            onValueChange={(v) => setCategory(v as ListingCategory)}
            options={CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] ?? c }))}
          />

          {category === "flat" ? (
            <Select
              label="Dispozice"
              value={disposition}
              onValueChange={setDisposition}
              options={DISPOSITIONS.map((d) => ({
                value: d,
                label: DISPOSITION_LABELS[d] ?? d,
              }))}
            />
          ) : (
            <Input
              label="Podtyp (volitelné)"
              value={subtype}
              onChange={(e) => setSubtype(e.target.value)}
              placeholder={
                category === "house"
                  ? "Např. rodinný dům, vila, chalupa"
                  : category === "commercial"
                    ? "Např. kancelář, obchod, sklad"
                    : "Např. stavební pozemek, garáž"
              }
            />
          )}
        </Card>
      ) : null}

      {/* KROK 2: ADRESA A MAPA */}
      {step === 1 ? (
        <Card padding="lg" className="space-y-5">
          <h2 className="type-h3 text-strong">2. Adresa a poloha na mapě</h2>
          <Combobox
            label="Obec nebo městská část"
            placeholder="Začněte psát např. Praha, Brno, Plzeň…"
            value={locQuery}
            onChange={setLocQuery}
            options={locOptions}
            loading={locLoading}
            emptyText="Žádnou lokalitu jsme nenašli."
            onSelect={(opt) => {
              const found = locResults.find((r) => String(r.id) === opt.value);
              if (found) {
                setLocationId(found.id);
                setCity(found.parentName ?? found.name);
                setDistrict(found.type === "cast" ? found.name : "");
                setLat(found.lat);
                setLng(found.lng);
                setLocQuery(found.name);
              }
            }}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Město / obec"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
            <Input
              label="Městská část (volitelné)"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            />
            <Input
              label="Ulice (volitelné)"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Číslo"
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
              />
              <Input label="PSČ" value={zip} onChange={(e) => setZip(e.target.value)} />
            </div>
          </div>

          <DynamicPinPickerMap
            lat={lat}
            lng={lng}
            onChange={(coords) => {
              setLat(coords.lat);
              setLng(coords.lng);
            }}
          />

          <Checkbox
            checked={showExactLocation}
            onCheckedChange={(v) => setShowExactLocation(Boolean(v))}
            label="Zobrazit přesnou polohu na mapě (jinak se zobrazí přibližná oblast ~300 m)"
          />
        </Card>
      ) : null}

      {/* KROK 3: PARAMETRY */}
      {step === 2 ? (
        <Card padding="lg" className="space-y-5">
          <h2 className="type-h3 text-strong">3. Technické parametry a vybavení</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Užitná plocha (m²)"
              type="number"
              min="1"
              value={usableArea}
              onChange={(e) => setUsableArea(e.target.value)}
            />
            {category === "house" || category === "land" ? (
              <Input
                label="Plocha pozemku (m²)"
                type="number"
                min="1"
                value={landArea}
                onChange={(e) => setLandArea(e.target.value)}
              />
            ) : (
              <Input
                label="Rok výstavby"
                type="number"
                min="1800"
                max="2035"
                value={yearBuilt}
                onChange={(e) => setYearBuilt(e.target.value)}
              />
            )}
            {category === "flat" ? (
              <>
                <Input
                  label="Podlaží"
                  type="number"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                />
                <Input
                  label="Celkem podlaží v domě"
                  type="number"
                  min="1"
                  value={floorsTotal}
                  onChange={(e) => setFloorsTotal(e.target.value)}
                />
              </>
            ) : null}
            <Select
              label="Typ stavby"
              value={buildingType || "__none"}
              onValueChange={(v) => setBuildingType(v === "__none" ? "" : v)}
              options={[
                { value: "__none", label: "Neuvedeno" },
                ...BUILDING_TYPES.map((b) => ({
                  value: b,
                  label: BUILDING_TYPE_LABELS[b] ?? b,
                })),
              ]}
            />
            <Select
              label="Stav objektu"
              value={condition || "__none"}
              onValueChange={(v) => setCondition(v === "__none" ? "" : v)}
              options={[
                { value: "__none", label: "Neuvedeno" },
                ...CONDITIONS.map((c) => ({ value: c, label: CONDITION_LABELS[c] ?? c })),
              ]}
            />
            <Select
              label="Vlastnictví"
              value={ownership || "__none"}
              onValueChange={(v) => setOwnership(v === "__none" ? "" : v)}
              options={[
                { value: "__none", label: "Neuvedeno" },
                ...OWNERSHIPS.map((o) => ({ value: o, label: OWNERSHIP_LABELS[o] ?? o })),
              ]}
            />
            <Select
              label="Energetická třída (PENB)"
              value={energyClass || "__none"}
              onValueChange={(v) => setEnergyClass(v === "__none" ? "" : v)}
              options={[
                { value: "__none", label: "Neuvedeno" },
                ...ENERGY_CLASSES.map((e) => ({ value: e, label: `Třída ${e}` })),
              ]}
            />
            <Select
              label="Vybavenost"
              value={furnished || "__none"}
              onValueChange={(v) => setFurnished(v === "__none" ? "" : v)}
              options={[
                { value: "__none", label: "Neuvedeno" },
                ...FURNISHED_OPTIONS.map((f) => ({
                  value: f,
                  label: FURNISHED_LABELS[f] ?? f,
                })),
              ]}
            />
          </div>

          <div className="space-y-2 pt-2">
            <span className="block type-small font-medium text-strong">Vybavení</span>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((a) => (
                <Chip
                  key={a}
                  size="sm"
                  selected={amenities.includes(a)}
                  onClick={() => toggleAmenity(a)}
                >
                  {AMENITY_LABELS[a] ?? a}
                </Chip>
              ))}
            </div>
          </div>
        </Card>
      ) : null}

      {/* KROK 4: POPIS A CENA */}
      {step === 3 ? (
        <Card padding="lg" className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="type-h3 text-strong">4. Popis a cena</h2>
            <Button type="button" variant="ghost" size="sm" onClick={suggestTitle}>
              Vygenerovat nadpis
            </Button>
          </div>

          <Input
            label="Nadpis inzerátu"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Např. Prodej bytu 2+kk, 58 m², Praha 5 – Smíchov"
            required
          />

          <Textarea
            label="Popis nemovitosti"
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Popište dispozici, stav, vybavení, lokalitu a dopravní dostupnost…"
            required
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={offerType === "rent" ? "Nájemné (Kč)" : "Cena (Kč)"}
              type="number"
              min="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={priceOnRequest}
              required={!priceOnRequest}
            />
            <Select
              label="Jednotka ceny"
              value={priceUnit}
              onValueChange={(v) => setPriceUnit(v as "total" | "per_month" | "per_m2_month")}
              options={[
                { value: "total", label: "Celkem (Kč)" },
                { value: "per_month", label: "Za měsíc (Kč/měsíc)" },
                { value: "per_m2_month", label: "Za m² a měsíc" },
              ]}
            />
          </div>

          <div className="flex flex-wrap gap-5">
            <Checkbox
              checked={priceNegotiable}
              onCheckedChange={(v) => setPriceNegotiable(Boolean(v))}
              label="Cena k jednání"
            />
            <Checkbox
              checked={priceOnRequest}
              onCheckedChange={(v) => setPriceOnRequest(Boolean(v))}
              label="Cena na dotaz"
            />
          </div>

          {offerType === "rent" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Měsíční poplatky a energie (Kč)"
                type="number"
                min="0"
                value={feesMonthly}
                onChange={(e) => setFeesMonthly(e.target.value)}
              />
              <Input
                label="Vratná kauce (Kč)"
                type="number"
                min="0"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
              />
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* KROK 5: FOTKY */}
      {step === 4 ? (
        <Card padding="lg" className="space-y-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="type-h3 text-strong">5. Fotografie</h2>
            <span className="type-caption text-muted tnum">{images.length} / 40 fotek</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            aria-label="Nahrát fotografie nemovitosti"
            className="sr-only"
            onChange={(e) => void handleFilesUpload(e.target.files)}
          />

          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void handleFilesUpload(e.dataTransfer.files);
            }}
            className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-violet-300 bg-surface px-6 py-8 text-center transition-colors hover:bg-violet-50 cursor-pointer"
          >
            <span className="mb-2.5 flex h-12 w-12 items-center justify-center rounded-pill bg-violet-100 text-accent-text">
              <UploadCloud className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="type-body font-medium text-strong">
              {uploading
                ? "Nahrávám a zpracovávám fotografie…"
                : "Přetáhněte fotografie sem nebo klikněte pro výběr"}
            </span>
            <span className="mt-1 type-small text-muted">
              JPG, PNG nebo WebP · max. 12 MB na soubor · EXIF/GPS údaje se automaticky odstraní
            </span>
          </button>

          {uploadErrors.length > 0 ? (
            <div
              role="alert"
              data-upload-errors="true"
              className="space-y-1 rounded-lg border border-danger bg-danger-bg p-3.5 type-small text-strong"
            >
              {uploadErrors.map((err) => (
                <p key={err}>{err}</p>
              ))}
            </div>
          ) : null}

          {images.length > 0 ? (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2" data-uploaded-images="true">
              {images.map((img, idx) => (
                <li
                  key={img.id}
                  draggable
                  onDragStart={() => setDraggedImageId(img.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => void handleDropImage(img.id)}
                  data-image-item={img.id}
                  className={cn(
                    "overflow-hidden rounded-xl border bg-surface shadow-card transition-opacity",
                    img.isCover ? "border-accent ring-2 ring-violet-200" : "border-line",
                    draggedImageId === img.id && "opacity-50",
                  )}
                >
                  <div className="relative aspect-[4/3] w-full bg-gray-100">
                    <Image
                      src={getImageVariantUrl(img.storageKey, "card")}
                      alt={img.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, 280px"
                      className="object-cover"
                    />
                    {img.isCover ? (
                      <div className="absolute top-2 left-2">
                        <Badge variant="new">Úvodní</Badge>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2.5">
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={idx === 0}
                        aria-label={`Posunout fotku ${idx + 1} doleva`}
                        onClick={() => void moveImage(idx, -1)}
                      >
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={idx === images.length - 1}
                        aria-label={`Posunout fotku ${idx + 1} doprava`}
                        onClick={() => void moveImage(idx, 1)}
                      >
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-1">
                      {!img.isCover ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label={`Nastavit fotku ${idx + 1} jako úvodní`}
                          onClick={() => void saveImageOrder(images, img.id)}
                        >
                          <Star className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`Smazat fotku ${idx + 1}`}
                        onClick={() => void handleDeleteImage(img.id)}
                      >
                        <Trash2 className="h-4 w-4 text-danger" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      ) : null}

      {/* KROK 6: NÁHLED A ODESLÁNÍ */}
      {step === 5 ? (
        <Card padding="lg" className="space-y-5">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" />
            <h2 className="type-h3 text-strong">6. Náhled a odeslání ke schválení</h2>
          </div>

          <div className="rounded-xl border border-line-subtle bg-subtle p-5 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="new">{OFFER_LABELS[offerType]}</Badge>
              <Badge variant="neutral">{CATEGORY_LABELS[category]}</Badge>
              {disposition && category === "flat" ? (
                <Badge variant="neutral">{DISPOSITION_LABELS[disposition] ?? disposition}</Badge>
              ) : null}
            </div>
            <h3 className="type-h2 text-strong">{title || "Bez nadpisu"}</h3>
            <p className="type-price text-accent-text tnum">
              {formatPrice(price ? Number(price) : null, priceUnit, { priceOnRequest })}
            </p>
            <p className="type-small text-muted">
              {district || city}
              {usableArea ? ` · ${usableArea} m²` : ""}
              {` · ${images.length} fotografií`}
            </p>
            <p className="whitespace-pre-line type-body text-body">{description}</p>
          </div>

          {slug ? (
            <p className="type-small text-muted">
              Veřejný náhled (viditelný pro vás a administrátora):{" "}
              <Link
                href={`/nemovitost/${slug}`}
                className="font-medium text-accent-text hover:underline"
              >
                /nemovitost/{slug}
              </Link>
            </p>
          ) : null}
        </Card>
      ) : null}

      {/* Sticky patička průvodce */}
      <div className="glass-3 sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3">
        <Button
          type="button"
          variant="ghost"
          size="md"
          disabled={step === 0 || saving}
          leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
          onClick={handleBack}
        >
          Zpět
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            loading={saving}
            leftIcon={<Save className="h-4 w-4" aria-hidden="true" />}
            onClick={() => void persistDraft(step, false)}
          >
            Uložit koncept
          </Button>

          {step < WIZARD_STEPS.length - 1 ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              loading={saving}
              rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
              onClick={handleNext}
            >
              Pokračovat
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="md"
              loading={saving}
              leftIcon={<Send className="h-4 w-4" aria-hidden="true" />}
              onClick={handleSubmitForReview}
            >
              {status === "active" ? "Uložit změny" : "Odeslat ke schválení"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
