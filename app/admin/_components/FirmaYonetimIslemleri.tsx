"use client";

import FirmaAyarlari from "./FirmaAyarlari";
import FirmaIslemleri from "./FirmaIslemleri";
import type { useAdminPanel } from "../_hooks/useAdminPanel";
import type { Firma } from "../_types";

interface Props { firma: Firma; admin: ReturnType<typeof useAdminPanel>; islemler?: boolean; firmaAdmin?: boolean }

export default function FirmaYonetimIslemleri({ firma, admin, islemler, firmaAdmin }: Props) {
  return islemler ? <FirmaIslemleri firma={firma} admin={admin} /> : <FirmaAyarlari firma={firma} admin={admin} firmaAdmin={firmaAdmin} />;
}
