"use client";
import { createContext, useContext, type ComponentType } from "react";
export const FirmaYonetimYetkisi = createContext(false);
export function useFirmaSaltOkunur() { return useContext(FirmaYonetimYetkisi); }
/** Form ağırlıklı alanlarda mevcut görünümü koruyarak yazma kontrollerini kapatır. */
export function saltOkunurAlan<P extends object>(Bilesen: ComponentType<P>) {
  return function SaltOkunurAlan(props: P) {
    const saltOkunur = useFirmaSaltOkunur();
    if (!saltOkunur) return <Bilesen {...props} />;
    return <fieldset disabled style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}><Bilesen {...props} /></fieldset>;
  };
}
