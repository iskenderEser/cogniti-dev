"use client";

import { useAuth } from "@/app/providers/AuthProvider";
import PanelLayout from "@/app/(panel)/layout";
import BilgiSayfaCercevesi from "@/components/panel/bilgi/BilgiSayfaCercevesi";
import OgrenmeZinciri from "@/components/panel/bilgi/OgrenmeZinciri";
import { MUSTERI_ROLU } from "@/lib/utils/roller";
import EczanemNedir from "./_components/EczanemNedir";

export default function NedirSayfasi() {
  const { kullanici, yukleniyor } = useAuth();
  if (yukleniyor) {
    return <div className="flex min-h-screen items-center justify-center bg-[var(--tema-zemin)]">
      <span className="size-7 animate-spin rounded-full border-2 border-[var(--tema-cizgi)] border-t-[var(--tema-eylem)]" role="status" aria-label="Oturum yükleniyor" />
    </div>;
  }
  if (kullanici?.kimlik_turu === MUSTERI_ROLU) return <EczanemNedir />;

  return (
    <PanelLayout>
      <BilgiSayfaCercevesi tur="hakkinda">
        <OgrenmeZinciri />
      </BilgiSayfaCercevesi>
    </PanelLayout>
  );
}
