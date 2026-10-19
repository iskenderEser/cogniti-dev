"use client";

import type { ComponentProps } from "react";
import { useTema } from "@/app/providers/TemaProvider";
import type { Tema } from "@/lib/tema/temalar";

type Props = Omit<ComponentProps<"img">, "src" | "alt"> & { tema?: Tema };

/** Mevcut logo alanının ölçülerini çağıran ekran belirler. */
export default function CognitiLogo({ tema, ...props }: Props) {
  const { tema: hesapTemasi } = useTema();
  const seciliTema = tema ?? hesapTemasi;
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} src={`/marka/cogniti-${seciliTema === "yesil" ? "green" : "blue"}.svg`} alt="Cogniti · bilgi taşır" />;
}
