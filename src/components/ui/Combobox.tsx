"use client";

import * as React from "react";
import { Search, X, MapPin } from "lucide-react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

export interface ComboboxOption {
  value: string;
  label: string;
  meta?: string;
  badge?: string;
}

export interface ComboboxProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  onSelect: (option: ComboboxOption) => void;
  loading?: boolean;
  emptyText?: string;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  className?: string;
}

export function Combobox({
  label,
  placeholder,
  value,
  onChange,
  options,
  onSelect,
  loading = false,
  emptyText = "Žádné výsledky.",
  disabled = false,
  id,
  ariaLabel,
  className,
}: ComboboxProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const listId = `${inputId}-listbox`;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [options]);

  React.useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const showDropdown = open && (loading || options.length > 0 || value.trim().length >= 2);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((prev) => (options.length > 0 ? (prev + 1) % options.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((prev) =>
        options.length > 0 ? (prev - 1 + options.length) % options.length : 0,
      );
    } else if (e.key === "Enter" && showDropdown && options[activeIndex]) {
      e.preventDefault();
      onSelect(options[activeIndex]!);
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className={cn("relative w-full space-y-1.5", className)}>
      {label ? (
        <label htmlFor={inputId} className="block type-small font-medium text-strong">
          {label}
        </label>
      ) : null}
      <div
        className={cn(
          "input-focus-halo flex h-12 w-full items-center rounded-md border border-line bg-surface transition-[border-color,box-shadow] duration-150 hover:border-line-strong",
          disabled && "bg-subtle opacity-60",
        )}
      >
        <span className="pl-3.5 text-muted" aria-hidden="true">
          <Search className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label={!label ? ariaLabel : undefined}
          aria-activedescendant={
            showDropdown && options[activeIndex] ? `${listId}-opt-${activeIndex}` : undefined
          }
          disabled={disabled}
          value={value}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="h-full w-full bg-transparent px-2.5 text-base text-strong placeholder:text-muted focus:outline-none disabled:cursor-not-allowed"
        />
        {loading ? (
          <span className="pr-3 text-muted">
            <Spinner size="sm" />
          </span>
        ) : value ? (
          <button
            type="button"
            aria-label="Vymazat hledání"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="mr-1.5 inline-flex h-8 w-8 items-center justify-center rounded-pill text-muted hover:bg-hover hover:text-strong cursor-pointer"
          >
            <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {showDropdown ? (
        <ul
          id={listId}
          role="listbox"
          className="glass-3 reaporta-panel-enter absolute top-full right-0 left-0 z-40 mt-2 max-h-80 overflow-auto rounded-lg p-1.5"
        >
          {loading ? (
            <li className="px-3 py-2.5 type-small text-muted">Vyhledávám…</li>
          ) : options.length === 0 ? (
            <li className="px-3 py-2.5 type-small text-muted">{emptyText}</li>
          ) : (
            options.map((opt, idx) => {
              const isActive = idx === activeIndex;
              return (
                <li
                  key={opt.value}
                  id={`${listId}-opt-${idx}`}
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(opt);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex min-h-11 items-center justify-between gap-3 rounded-sm px-3 py-2 cursor-pointer transition-colors duration-100",
                    isActive ? "bg-violet-100 text-violet-800" : "text-body hover:bg-hover",
                  )}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <MapPin
                      className="h-4 w-4 shrink-0 text-muted"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <span className="truncate">
                      <span className="font-medium text-strong">{opt.label}</span>
                      {opt.meta ? (
                        <span className="ml-2 type-caption text-muted font-normal">{opt.meta}</span>
                      ) : null}
                    </span>
                  </span>
                  {opt.badge ? (
                    <span className="type-caption text-muted tnum shrink-0">{opt.badge}</span>
                  ) : null}
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
