"use client";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import { SayfaYenileBasligi } from "@/components/ui/sayfa-yenile-basligi";

import { useState } from "react";
import { Coins } from "lucide-react";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import EczanemPanelBaglantisi from "../_components/EczanemPanelBaglantisi";
import { eczanemUyeMenusuOlustur } from "../_components/eczanemUyeMenusu";
import EczanemPuanlarim from "../_components/EczanemPuanlarim";

export default function EczanemPuanlarimPage() {
  const { mesajlar, hata, basari } = useHataMesaji();
  const [yenilemeAnahtari, setYenilemeAnahtari] = useState(0);
  const [yenileniyor, setYenileniyor] = useState(false);
  return <EczanemPanelBaglantisi gruplar={eczanemUyeMenusuOlustur()}>
    <HataMesajiContainer mesajlar={mesajlar} />
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-3 py-4 pb-12 md:px-6 md:py-5 lg:px-8 lg:py-7">
      <SayfaYenileBasligi
        ustBilgi={<p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--tema-yerel-eczanem-islevsel-metin-34)]"><Coins className="size-3.5" /> Cogniti Eczanem</p>}
        baslik={<h1 className="text-2xl font-black tracking-[-0.025em] text-[var(--tema-yerel-eczanem-ana-metin-03)]">Puanlarım</h1>}
        aciklama={<p className="mt-1 max-w-2xl text-xs font-semibold leading-5 text-[var(--tema-yerel-eczanem-yardimci-metin-37)]">Ürün bazında kazandığınız puanları, TL karşılıklarını ve eczane onaylı kullanım geçmişinizi yönetin.</p>}
        aksiyon={<YenileButonu yenileniyor={yenileniyor} onYenile={() => setYenilemeAnahtari((deger) => deger + 1)} />}
      />
      <EczanemPuanlarim hata={hata} basari={basari} yenilemeAnahtari={yenilemeAnahtari} onYenileniyor={setYenileniyor} />
    </div>
  </EczanemPanelBaglantisi>;
}
