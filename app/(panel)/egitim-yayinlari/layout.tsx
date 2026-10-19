"use client";

import { useAuth } from "@/app/providers/AuthProvider";
import { BmOneriSecimiProvider } from "@/components/yayin/BmOneriSecimi";
import { TUKETICI_ROLLER } from "@/lib/utils/roller";

export default function EgitimYayinlariLayout({ children }: { children: React.ReactNode }) {
  const { kullanici } = useAuth();
  if (TUKETICI_ROLLER.includes(kullanici?.rol.trim().toLowerCase() ?? "")) return children;
  return <BmOneriSecimiProvider>{children}</BmOneriSecimiProvider>;
}
