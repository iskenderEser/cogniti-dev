"use client";

import { useAuth } from "@/app/providers/AuthProvider";
import PanelLayout from "@/app/(panel)/layout";
import BilgiSayfaCercevesi from "@/components/panel/bilgi/BilgiSayfaCercevesi";
import OgrenmeZinciri from "@/components/panel/bilgi/OgrenmeZinciri";
import { MUSTERI_ROLU } from "@/lib/utils/roller";
import EczanemNedir from "./_components/EczanemNedir";

export default function NedirSayfasi() {
  const { kullanici } = useAuth();
  if (kullanici?.kimlik_turu === MUSTERI_ROLU) return <EczanemNedir />;

  return (
    <PanelLayout>
      <BilgiSayfaCercevesi tur="hakkinda">
        <OgrenmeZinciri />
      </BilgiSayfaCercevesi>
    </PanelLayout>
  );
}
