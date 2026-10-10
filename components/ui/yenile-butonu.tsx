"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import styles from "./sayfa-yenile.module.css";

interface YenileButonuProps {
  yenileniyor: boolean;
  onYenile: () => void | Promise<void>;
  disabled?: boolean;
  etiket?: string;
  className?: string;
}

/** Sayfa state'ini koruyarak yalnız uzak veriyi yenileyen ortak panel aksiyonu. */
export function YenileButonu({
  yenileniyor,
  onYenile,
  disabled = false,
  etiket = "Yenile",
  className,
}: YenileButonuProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled || yenileniyor}
      aria-busy={yenileniyor}
      aria-label={yenileniyor ? "Yenileniyor…" : etiket}
      title={yenileniyor ? "Yenileniyor…" : etiket}
      onClick={() => void onYenile()}
      className={cn("hb-yenile-butonu border-[#d8e3ee] bg-white font-bold text-[#58708b] hover:bg-[#f4f8fb]", styles.buton, className)}
    >
      <RefreshCw className={yenileniyor ? "animate-spin" : ""} />
      <span className={cn("hb-yenile-etiket", styles.etiket)}>{yenileniyor ? "Yenileniyor…" : etiket}</span>
    </Button>
  );
}
