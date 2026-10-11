"use client";

import { createContext, useContext } from "react";
import type { useEclubPanel } from "@/app/(panel)/eclub/panel/_hooks/useEclubPanel";

export const EclubFirmaSecimi = createContext<{
  firmaId?: string;
  gomulu: boolean;
  urunId: string | null;
  urunAdi: string | null;
  panel: ReturnType<typeof useEclubPanel> | null;
  aksiyonAlani: HTMLDivElement | null;
}>({ gomulu: false, urunId: null, urunAdi: null, panel: null, aksiyonAlani: null });

export function useEclubFirmaSecimi() { return useContext(EclubFirmaSecimi); }
