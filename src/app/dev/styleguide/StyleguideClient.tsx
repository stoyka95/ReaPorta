"use client";

import * as React from "react";
import Image from "next/image";
import {
  Bell,
  Heart,
  Home,
  Info,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { LogoMark } from "@/components/brand/LogoMark";
import {
  Avatar,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Checkbox,
  Chip,
  Combobox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
  Dropzone,
  EmptyState,
  GlassPanel,
  IconButton,
  Input,
  Pagination,
  PenbBadge,
  Popover,
  PopoverContent,
  PopoverTrigger,
  RadioGroup,
  RadioItem,
  RangeSlider,
  SegmentedControl,
  Select,
  Skeleton,
  Spinner,
  Stepper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  ToastCard,
  ToastProvider,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  useToast,
} from "@/components/ui";
import { cn } from "@/lib/cn";

const GRAY_SWATCHES = [
  { name: "gray-0", cls: "bg-gray-0 border border-line" },
  { name: "gray-25", cls: "bg-gray-25 border border-line" },
  { name: "gray-50", cls: "bg-gray-50 border border-line" },
  { name: "gray-100", cls: "bg-gray-100" },
  { name: "gray-200", cls: "bg-gray-200" },
  { name: "gray-300", cls: "bg-gray-300" },
  { name: "gray-400", cls: "bg-gray-400" },
  { name: "gray-500", cls: "bg-gray-500" },
  { name: "gray-600", cls: "bg-gray-600" },
  { name: "gray-700", cls: "bg-gray-700" },
  { name: "gray-800", cls: "bg-gray-800" },
  { name: "gray-900", cls: "bg-gray-900" },
];

const VIOLET_SWATCHES = [
  { name: "violet-50", cls: "bg-violet-50 border border-violet-200" },
  { name: "violet-100", cls: "bg-violet-100" },
  { name: "violet-200", cls: "bg-violet-200" },
  { name: "violet-300", cls: "bg-violet-300" },
  { name: "violet-400", cls: "bg-violet-400" },
  { name: "violet-500", cls: "bg-violet-500" },
  { name: "violet-600 (akcent)", cls: "bg-violet-600" },
  { name: "violet-700", cls: "bg-violet-700" },
  { name: "violet-800", cls: "bg-violet-800" },
  { name: "violet-900", cls: "bg-violet-900" },
];

const COMBOBOX_DEMO_OPTIONS = [
  { value: "praha", label: "Praha", meta: "Hlavní město Praha", badge: "102 nabídek" },
  { value: "praha-5", label: "Praha 5 – Smíchov", meta: "Praha", badge: "14 nabídek" },
  { value: "brno", label: "Brno", meta: "Jihomoravský kraj", badge: "52 nabídek" },
  { value: "plzen", label: "Plzeň", meta: "Plzeňský kraj", badge: "24 nabídek" },
];

function ToastDemoTrigger() {
  const { push } = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() =>
          push({
            tone: "success",
            title: "Zpráva je na cestě.",
            description: "Makléř se vám ozve co nejdříve.",
          })
        }
      >
        Úspěšný toast
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() =>
          push({
            tone: "danger",
            title: "Něco se nepovedlo.",
            description: "Zkuste to prosím znovu.",
          })
        }
      >
        Chybový toast
      </Button>
    </div>
  );
}

function StyleguideInner() {
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [offer, setOffer] = React.useState<"sale" | "rent">("sale");
  const [selectedChips, setSelectedChips] = React.useState<string[]>(["2+kk", "3+kk"]);
  const [comboValue, setComboValue] = React.useState("");
  const [priceRange, setPriceRange] = React.useState<[number, number]>([3_500_000, 11_000_000]);
  const [page, setPage] = React.useState(2);
  const [selectVal, setSelectVal] = React.useState("flat");
  const [radioVal, setRadioVal] = React.useState("daily");
  const [checkedA, setCheckedA] = React.useState(true);
  const [switchVal, setSwitchVal] = React.useState(true);

  const filteredCombo = COMBOBOX_DEMO_OPTIONS.filter((o) =>
    o.label.toLowerCase().includes(comboValue.trim().toLowerCase()),
  );

  function toggleChip(item: string) {
    setSelectedChips((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item],
    );
  }

  return (
    <div className={cn("min-h-dvh overflow-x-clip pb-24", reducedMotion && "reduced-motion-sim")}>
      <header className="glass-1 sticky top-0 z-20">
        <div className="mx-auto flex h-16 sm:h-18 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <Logo variant="full" size="sm" />
            <span className="hidden sm:inline-flex">
              <Badge variant="new">Styleguide · Etapa 2</Badge>
            </span>
          </div>
          <div className="flex items-center shrink-0">
            <Switch
              label="Reduced motion"
              checked={reducedMotion}
              onCheckedChange={setReducedMotion}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-16 px-4 pt-10 sm:px-6 lg:px-8">
        {/* Úvod */}
        <section className="space-y-4">
          <p className="type-eyebrow text-accent-text">DESIGN.md · Zdroj pravdy</p>
          <h1 className="type-display text-strong max-w-3xl">
            Klidný, vzdušný a důvěryhodný design systém.
          </h1>
          <p className="type-body-lg max-w-2xl text-body">
            Světlé rozhraní ze skla a jemných přechodů, neutrální chladná šedá, jedna fialová
            akcentní barva a typografie Fraunces + Inter. Každá hodnota pochází z design tokenů.
          </p>
        </section>

        {/* 1. Logo a značka */}
        <section aria-labelledby="sec-brand" className="space-y-6">
          <div className="space-y-1">
            <p className="type-eyebrow text-muted">Kapitola 15</p>
            <h2 id="sec-brand" className="type-h2 text-strong">
              Logo a značka
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="flex flex-col justify-between gap-6 bg-page">
              <span className="type-caption text-muted">Světlé pozadí (--bg-page)</span>
              <Logo variant="full" tone="brand" size="md" />
              <div className="flex items-center gap-4">
                <LogoMark className="h-4 w-4" />
                <LogoMark className="h-6 w-6" />
                <LogoMark className="h-8 w-8" />
                <span className="type-caption text-muted tnum">16 · 24 · 32 px</span>
              </div>
            </Card>

            <div className="relative overflow-hidden rounded-xl border border-line-subtle bg-violet-100 p-4">
              <GlassPanel
                level={1}
                padding="md"
                radius="lg"
                className="flex h-full flex-col justify-between gap-6"
              >
                <span className="type-caption text-muted">Sklo (glass-1)</span>
                <Logo variant="full" tone="brand" size="md" />
                <Logo variant="full" tone="dark" size="sm" />
              </GlassPanel>
            </div>

            <div className="relative min-h-48 overflow-hidden rounded-xl border border-line-subtle">
              <Image
                src="/media/pool/living-01-card.webp"
                alt="Ukázkové pozadí interiéru"
                fill
                sizes="(max-width: 768px) 100vw, 320px"
                className="object-cover"
              />
              <div className="scrim-photo absolute inset-0 flex flex-col justify-between p-5">
                <span className="w-fit rounded-pill bg-gray-900 px-2.5 py-1 type-caption text-gray-0">
                  Fotka se scrimem
                </span>
                <Logo variant="full" tone="light" size="md" />
              </div>
            </div>

            <div className="flex flex-col justify-between gap-6 rounded-xl bg-gray-900 p-5 text-gray-0">
              <span className="type-caption text-gray-300">Tmavé pozadí (--gray-900)</span>
              <Logo variant="full" tone="light" size="md" />
              <div className="flex items-center gap-4 text-gray-0">
                <LogoMark tone="mono" className="h-4 w-4" />
                <LogoMark tone="mono" className="h-6 w-6" />
                <LogoMark tone="mono" className="h-8 w-8" />
                <span className="type-caption text-gray-300 tnum">16 · 24 · 32 px</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Barvy */}
        <section aria-labelledby="sec-colors" className="space-y-6">
          <div className="space-y-1">
            <p className="type-eyebrow text-muted">Kapitola 3.1</p>
            <h2 id="sec-colors" className="type-h2 text-strong">
              Barevná paleta a sémantické stavy
            </h2>
          </div>

          <Card className="space-y-6">
            <div className="space-y-2">
              <h3 className="type-h4 text-strong">Neutrální šedá</h3>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-12">
                {GRAY_SWATCHES.map((s) => (
                  <div key={s.name} className="space-y-1.5">
                    <div className={cn("h-12 w-full rounded-md", s.cls)} />
                    <p className="type-caption text-muted">{s.name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="type-h4 text-strong">Fialový akcent</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-10">
                {VIOLET_SWATCHES.map((s) => (
                  <div key={s.name} className="space-y-1.5">
                    <div className={cn("h-12 w-full rounded-md", s.cls)} />
                    <p className="type-caption text-muted">{s.name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="type-h4 text-strong">Sémantické stavy a PENB (A–G)</h3>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success">Aktivní</Badge>
                <Badge variant="warning">Čeká na schválení</Badge>
                <Badge variant="danger">Zamítnuto</Badge>
                <Badge variant="info">Informace</Badge>
                <Badge variant="new">Nové</Badge>
                <Badge variant="exclusive">Exkluzivně</Badge>
                <Badge variant="reduced">Zlevněno</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {(["A", "B", "C", "D", "E", "F", "G"] as const).map((g) => (
                  <PenbBadge key={g} energyClass={g} />
                ))}
                <PenbBadge energyClass={null} />
              </div>
            </div>
          </Card>
        </section>

        {/* 3. Typografie a diakritika */}
        <section aria-labelledby="sec-type" className="space-y-6">
          <div className="space-y-1">
            <p className="type-eyebrow text-muted">Kapitola 4</p>
            <h2 id="sec-type" className="type-h2 text-strong">
              Typografie a ověření české diakritiky
            </h2>
          </div>

          <Card className="space-y-6">
            <div className="grid gap-4 rounded-lg border border-violet-200 bg-violet-50 p-5 md:grid-cols-2">
              <div className="space-y-1">
                <span className="type-eyebrow text-accent-text">Fraunces (latin-ext)</span>
                <p className="type-h3 text-strong">Příliš žluťoučký kůň úpěl ďábelské ódy.</p>
              </div>
              <div className="space-y-1">
                <span className="type-eyebrow text-accent-text">Inter (latin-ext + tnum)</span>
                <p className="type-body-lg text-strong tnum">
                  Příliš žluťoučký kůň úpěl ďábelské ódy. 5&nbsp;990&nbsp;000&nbsp;Kč · 78&nbsp;m²
                </p>
              </div>
            </div>

            <div className="divide-y divide-line-subtle">
              <div className="py-3">
                <span className="type-caption text-muted">display</span>
                <p className="type-display text-strong">Najděte svůj domov</p>
              </div>
              <div className="py-3">
                <span className="type-caption text-muted">h1</span>
                <p className="type-h1 text-strong">Prodej bytů v Praze</p>
              </div>
              <div className="py-3">
                <span className="type-caption text-muted">h2</span>
                <p className="type-h2 text-strong">Nové a doporučené nabídky</p>
              </div>
              <div className="py-3">
                <span className="type-caption text-muted">h3</span>
                <p className="type-h3 text-strong">Prodej bytu 3+kk, 78 m²</p>
              </div>
              <div className="py-3">
                <span className="type-caption text-muted">h4</span>
                <p className="type-h4 text-strong">Technické parametry stavby</p>
              </div>
              <div className="grid gap-4 py-3 sm:grid-cols-2">
                <div>
                  <span className="type-caption text-muted">price-xl (tabulární)</span>
                  <p className="type-price-xl text-strong">5&nbsp;990&nbsp;000&nbsp;Kč</p>
                </div>
                <div>
                  <span className="type-caption text-muted">price (tabulární)</span>
                  <p className="type-price text-strong">25&nbsp;000&nbsp;Kč/měsíc</p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* 4. Skleněné vrstvy */}
        <section aria-labelledby="sec-glass" className="space-y-6">
          <div className="space-y-1">
            <p className="type-eyebrow text-muted">Kapitola 3.3</p>
            <h2 id="sec-glass" className="type-h2 text-strong">
              Tři úrovně skla nad pozadím
            </h2>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-line-subtle p-6 sm:p-8">
            <Image
              src="/media/pool/house-02-full.webp"
              alt="Architektonické pozadí pro test skla"
              fill
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover"
            />
            <div className="relative z-10 grid gap-5 md:grid-cols-3">
              <GlassPanel level={1} padding="md" radius="xl" className="space-y-1.5">
                <p className="type-eyebrow text-accent-text">glass-1</p>
                <h3 className="type-h4 text-strong">Navigace a lišty</h3>
                <p className="type-small text-body">
                  Lehké rozostření (18 px) pro horní navigaci a filtrační lištu.
                </p>
              </GlassPanel>
              <GlassPanel level={2} padding="md" radius="xl" className="space-y-1.5">
                <p className="type-eyebrow text-accent-text">glass-2</p>
                <h3 className="type-h4 text-strong">Plovoucí panely</h3>
                <p className="type-small text-body">
                  Střední rozostření (24 px) pro vyhledávací panel a kontaktní kartu.
                </p>
              </GlassPanel>
              <GlassPanel level={3} padding="md" radius="xl" className="space-y-1.5">
                <p className="type-eyebrow text-accent-text">glass-3</p>
                <h3 className="type-h4 text-strong">Modály a drawery</h3>
                <p className="type-small text-body">
                  Nejvyšší čitelnost (32 px) pro dialogy, drawery a ovládání mapy.
                </p>
              </GlassPanel>
            </div>
          </div>
        </section>

        {/* 5. Tlačítka a akce */}
        <section aria-labelledby="sec-buttons" className="space-y-6">
          <div className="space-y-1">
            <p className="type-eyebrow text-muted">Kapitola 6</p>
            <h2 id="sec-buttons" className="type-h2 text-strong">
              Tlačítka, chipy a přepínače
            </h2>
          </div>

          <Card className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" leftIcon={<Search className="h-4 w-4" />}>
                Hledat nabídky
              </Button>
              <Button variant="secondary" leftIcon={<SlidersHorizontal className="h-4 w-4" />}>
                Další filtry
              </Button>
              <Button variant="ghost">Zrušit filtry</Button>
              <Button variant="danger" leftIcon={<Trash2 className="h-4 w-4" />}>
                Smazat
              </Button>
              <Button variant="primary" loading>
                Ukládám
              </Button>
              <Button variant="secondary" disabled>
                Neaktivní
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" variant="secondary">
                Malé (36 px)
              </Button>
              <Button size="md" variant="secondary">
                Střední (44 px)
              </Button>
              <Button size="lg" variant="secondary">
                Velké (52 px)
              </Button>
              <IconButton variant="glass" aria-label="Přidat do oblíbených">
                <Heart className="h-5 w-5" strokeWidth={1.75} />
              </IconButton>
              <IconButton variant="secondary" aria-label="Oznámení">
                <Bell className="h-5 w-5" strokeWidth={1.75} />
              </IconButton>
              <IconButton variant="ghost" aria-label="Nápověda">
                <Info className="h-5 w-5" strokeWidth={1.75} />
              </IconButton>
              <Spinner size="md" label="Načítám" />
            </div>

            <div className="flex flex-wrap items-center gap-4 border-t border-line-subtle pt-5">
              <SegmentedControl
                ariaLabel="Typ nabídky"
                value={offer}
                onChange={setOffer}
                options={[
                  { value: "sale", label: "Prodej" },
                  { value: "rent", label: "Pronájem" },
                ]}
              />
              <div className="flex flex-wrap items-center gap-2">
                {["1+kk", "2+kk", "3+kk", "4+kk", "Balkon"].map((chip) => (
                  <Chip
                    key={chip}
                    selected={selectedChips.includes(chip)}
                    onClick={() => toggleChip(chip)}
                  >
                    {chip}
                  </Chip>
                ))}
              </div>
            </div>
          </Card>
        </section>

        {/* 6. Formuláře a vstupy */}
        <section aria-labelledby="sec-inputs" className="space-y-6">
          <div className="space-y-1">
            <p className="type-eyebrow text-muted">Formulářové prvky</p>
            <h2 id="sec-inputs" className="type-h2 text-strong">
              Vstupy, výběry a posuvník s histogramem
            </h2>
          </div>

          <Card className="grid gap-6 md:grid-cols-2">
            <Input
              label="Vaše jméno"
              placeholder="Jan Novák"
              helperText="Zobrazí se makléři u vaší poptávky."
            />
            <Input
              label="E-mail (chybový stav)"
              defaultValue="spatny-email"
              error="Zadejte prosím platný e-mail."
            />
            <Input
              label="Neaktivní pole"
              defaultValue="ReaPorta Praha"
              disabled
              leftIcon={<MapPin className="h-4 w-4" />}
            />
            <Select
              label="Kategorie nemovitosti"
              value={selectVal}
              onValueChange={setSelectVal}
              options={[
                { value: "flat", label: "Byty" },
                { value: "house", label: "Domy" },
                { value: "land", label: "Pozemky" },
                { value: "commercial", label: "Komerční" },
              ]}
            />
            <Combobox
              label="Lokalita (našeptávač)"
              placeholder="Zadejte město nebo čtvrť…"
              value={comboValue}
              onChange={setComboValue}
              options={filteredCombo}
              onSelect={(opt) => setComboValue(opt.label)}
            />
            <div className="space-y-2">
              <span className="block type-small font-medium text-strong">
                Rozsah ceny (histogram)
              </span>
              <RangeSlider
                min={1_000_000}
                max={20_000_000}
                step={250_000}
                value={priceRange}
                onValueChange={setPriceRange}
                histogram={[2, 5, 9, 14, 18, 22, 16, 12, 8, 6, 4, 3]}
              />
              <p className="type-caption text-muted tnum">
                {priceRange[0].toLocaleString("cs-CZ")}&nbsp;Kč –{" "}
                {priceRange[1].toLocaleString("cs-CZ")}&nbsp;Kč
              </p>
            </div>
            <div className="md:col-span-2">
              <Textarea
                label="Zpráva pro makléře"
                placeholder="Dobrý den, mám zájem o prohlídku této nemovitosti…"
              />
            </div>
            <div className="space-y-2">
              <Checkbox
                label="Balkon nebo terasa"
                description="Zahrne byty s venkovním prostorem."
                checked={checkedA}
                onCheckedChange={(v) => setCheckedA(Boolean(v))}
              />
              <Switch
                label="Hledat při pohybu mapy"
                description="Automaticky upraví výsledky dle výřezu."
                checked={switchVal}
                onCheckedChange={setSwitchVal}
              />
            </div>
            <RadioGroup
              value={radioVal}
              onValueChange={setRadioVal}
              aria-label="Frekvence upozornění"
            >
              <RadioItem
                value="instant"
                label="Ihned"
                description="Jakmile se objeví nová nabídka."
              />
              <RadioItem value="daily" label="Denně" description="Jeden souhrnný e-mail večer." />
              <RadioItem value="weekly" label="Týdně" />
            </RadioGroup>
          </Card>
        </section>

        {/* 7. Vrstvy (Dialog, Drawer, Popover, Tooltip, Toast) a Navigace */}
        <section aria-labelledby="sec-overlays" className="space-y-6">
          <div className="space-y-1">
            <p className="type-eyebrow text-muted">Interaktivní vrstvy a navigace</p>
            <h2 id="sec-overlays" className="type-h2 text-strong">
              Modály, panely, záložky, kroky a stavy
            </h2>
          </div>

          <Card className="space-y-8">
            <div className="flex flex-wrap items-center gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary">Otevřít dialog</Button>
                </DialogTrigger>
                <DialogContent title="Smazat inzerát?" description="Tuto akci nelze vrátit zpět.">
                  <div className="flex justify-end gap-2">
                    <DialogClose asChild>
                      <Button variant="ghost">Zrušit</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button variant="dangerSolid">Smazat</Button>
                    </DialogClose>
                  </div>
                </DialogContent>
              </Dialog>

              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="secondary">Otevřít drawer filtrů</Button>
                </DrawerTrigger>
                <DrawerContent
                  title="Další filtry"
                  description="Upřesněte parametry hledané nemovitosti."
                  footer={
                    <div className="flex items-center justify-between gap-3">
                      <DrawerClose asChild>
                        <Button variant="ghost">Zrušit filtry</Button>
                      </DrawerClose>
                      <DrawerClose asChild>
                        <Button variant="primary">Zobrazit 128 nabídek</Button>
                      </DrawerClose>
                    </div>
                  }
                >
                  <div className="space-y-4">
                    <Checkbox label="Výtah" defaultChecked />
                    <Checkbox label="Sklep" />
                    <Checkbox label="Garáž nebo parkování" />
                  </div>
                </DrawerContent>
              </Drawer>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="secondary">Popover ceny</Button>
                </PopoverTrigger>
                <PopoverContent>
                  <p className="type-small font-medium text-strong">Rychlé nastavení ceny</p>
                  <p className="mt-1 type-caption text-muted">
                    Skleněný popover se zavírá klávesou Escape nebo kliknutím mimo.
                  </p>
                </PopoverContent>
              </Popover>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" leftIcon={<Sparkles className="h-4 w-4" />}>
                      Najeďte pro tooltip
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Ověřený inzerát podle dokumentace makléře.</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <ToastDemoTrigger />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ToastCard
                toast={{
                  id: "static-ok",
                  tone: "success",
                  title: "Zpráva je na cestě.",
                  description: "Makléř se vám ozve co nejdříve.",
                }}
              />
              <ToastCard
                toast={{
                  id: "static-warn",
                  tone: "warning",
                  title: "Přibližná poloha",
                  description: "Inzerent nezveřejnil přesné číslo popisné.",
                }}
              />
            </div>

            <Tabs defaultValue="params">
              <TabsList>
                <TabsTrigger value="params">Parametry</TabsTrigger>
                <TabsTrigger value="amenities">Vybavení</TabsTrigger>
                <TabsTrigger value="mortgage">Hypotéka</TabsTrigger>
              </TabsList>
              <TabsContent value="params">
                <p className="type-body text-body">
                  Užitná plocha 78 m², 3. patro z 5, cihlová stavba po rekonstrukci.
                </p>
              </TabsContent>
              <TabsContent value="amenities">
                <p className="type-body text-body">
                  Balkon 6 m², sklep, výtah a bezbariérový vstup.
                </p>
              </TabsContent>
              <TabsContent value="mortgage">
                <p className="type-body text-body tnum">Orientační splátka 21 473 Kč měsíčně.</p>
              </TabsContent>
            </Tabs>

            <div className="space-y-4 border-t border-line-subtle pt-6">
              <Breadcrumbs
                items={[
                  { label: "Úvod", href: "/" },
                  { label: "Prodej bytů", href: "/prodej/byty" },
                  { label: "Praha 5 – Smíchov" },
                ]}
              />
              <Stepper
                currentStep={2}
                steps={[
                  { id: "type", label: "Typ" },
                  { id: "address", label: "Adresa" },
                  { id: "params", label: "Parametry" },
                  { id: "price", label: "Popis a cena" },
                  { id: "photos", label: "Fotky" },
                ]}
              />
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-3">
                  <Avatar name="Tereza Novotná" size="sm" />
                  <Avatar name="Jakub Dvořák" size="md" />
                  <Avatar name="Klára Svobodová" size="lg" />
                </div>
                <Pagination page={page} totalPages={9} onPageChange={setPage} />
              </div>
            </div>
          </Card>
        </section>

        {/* 8. Dropzone, Tabulka, Skeleton a Prázdný stav */}
        <section aria-labelledby="sec-data" className="space-y-6">
          <div className="space-y-1">
            <p className="type-eyebrow text-muted">Datové a prázdné stavy</p>
            <h2 id="sec-data" className="type-h2 text-strong">
              Nahrávání, tabulka, načítání a prázdný stav
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <Dropzone
                previews={[
                  { id: "1", label: "obyvaci-pokoj.webp", isCover: true },
                  { id: "2", label: "kuchyne.webp" },
                  { id: "3", label: "terasa.webp" },
                ]}
              />
            </Card>

            <EmptyState
              title="Pro tyto parametry jsme nic nenašli."
              description="Zkuste rozšířit lokalitu nebo upravit cenu."
              action={
                <Button variant="secondary" leftIcon={<Home className="h-4 w-4" />}>
                  Zrušit filtry
                </Button>
              }
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inzerát</TableHead>
                  <TableHead>Cena</TableHead>
                  <TableHead>Stav</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-strong">Byt 3+kk, Praha 5</TableCell>
                  <TableCell className="tnum">7&nbsp;850&nbsp;000&nbsp;Kč</TableCell>
                  <TableCell>
                    <Badge variant="success">Aktivní</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-strong">Rodinný dům, Brno</TableCell>
                  <TableCell className="tnum">14&nbsp;200&nbsp;000&nbsp;Kč</TableCell>
                  <TableCell>
                    <Badge variant="warning">Moderace</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <Card className="space-y-3">
              <span className="type-caption text-muted">Skeleton (načítání karty)</span>
              <Skeleton className="h-44 w-full" rounded="lg" />
              <Skeleton className="h-6 w-40" rounded="md" />
              <Skeleton className="h-4 w-64" rounded="md" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" rounded="pill" />
                <Skeleton className="h-6 w-16" rounded="pill" />
                <Skeleton className="h-6 w-16" rounded="pill" />
              </div>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}

export function StyleguideClient() {
  return (
    <ToastProvider>
      <StyleguideInner />
    </ToastProvider>
  );
}
