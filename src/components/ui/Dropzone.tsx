"use client";

import * as React from "react";
import { UploadCloud, Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "./Badge";

export interface DropzonePreviewItem {
  id: string;
  label: string;
  isCover?: boolean;
}

export interface DropzoneProps {
  title?: string;
  description?: string;
  accept?: string;
  disabled?: boolean;
  previews?: DropzonePreviewItem[];
  onFilesSelected?: (files: FileList) => void;
  onSetCover?: (id: string) => void;
  onRemove?: (id: string) => void;
  className?: string;
}

export function Dropzone({
  title = "Přetáhněte fotografie sem nebo klikněte pro výběr",
  description = "JPG, PNG nebo WebP, max. 12 MB na soubor (až 40 fotek)",
  accept = "image/jpeg,image/png,image/webp",
  disabled = false,
  previews = [],
  onFilesSelected,
  onSetCover,
  onRemove,
  className,
}: DropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const inputId = React.useId();
  const [dragging, setDragging] = React.useState(false);

  return (
    <div className={cn("space-y-4", className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        multiple
        accept={accept}
        disabled={disabled}
        aria-label={title}
        tabIndex={-1}
        className="sr-only"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFilesSelected?.(e.target.files);
          }
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled && e.dataTransfer.files.length > 0) {
            onFilesSelected?.(e.dataTransfer.files);
          }
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors duration-200 cursor-pointer",
          dragging
            ? "border-accent bg-violet-50"
            : "border-violet-300 bg-surface hover:bg-violet-50",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-pill bg-violet-100 text-accent-text">
          <UploadCloud className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <span className="type-body font-medium text-strong">{title}</span>
        <span className="mt-1 type-small text-muted">{description}</span>
      </button>

      {previews.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {previews.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface p-3 shadow-card"
            >
              <div className="min-w-0 space-y-1">
                <p className="truncate type-small font-medium text-strong">{item.label}</p>
                {item.isCover ? <Badge variant="new">Úvodní</Badge> : null}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!item.isCover && onSetCover ? (
                  <button
                    type="button"
                    aria-label={`Nastavit ${item.label} jako úvodní`}
                    onClick={() => onSetCover(item.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-pill text-muted hover:bg-hover hover:text-accent-text cursor-pointer"
                  >
                    <Star className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  </button>
                ) : null}
                {onRemove ? (
                  <button
                    type="button"
                    aria-label={`Odstranit ${item.label}`}
                    onClick={() => onRemove(item.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-pill text-muted hover:bg-danger-bg hover:text-danger cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
