"use client";

import { MessageSquare, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";

export interface MobileContactBarProps {
  priceText: string;
}

export function MobileContactBar({ priceText }: MobileContactBarProps) {
  const t = useTranslations("detail");

  function scrollToContact() {
    document.getElementById("kontakt")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="glass-3 fixed right-0 bottom-0 left-0 z-30 border-t border-line px-4 py-3 lg:hidden">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
        <p className="truncate type-body font-semibold text-strong tnum">{priceText}</p>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Phone className="h-4 w-4" />}
            onClick={scrollToContact}
          >
            {t("call")}
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<MessageSquare className="h-4 w-4" />}
            onClick={scrollToContact}
          >
            {t("write")}
          </Button>
        </div>
      </div>
    </div>
  );
}
