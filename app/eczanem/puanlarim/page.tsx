"use client";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import { SayfaYenileBasligi } from "@/components/ui/sayfa-yenile-basligi";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Coins } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import { MUSTERI_ROLU } from "@/lib/utils/roller";
import EczanemMusteriNavbar from "../_components/EczanemMusteriNavbar";
import EczanemPuanlarim from "../_components/EczanemPuanlarim";

export default function EczanemPuanlarimPage() {
  const router = useRouter();
  const { kullanici, yukleniyor, cikisYap } = useAuth();
  const { mesajlar, hata, basari } = useHataMesaji();
  const [yenilemeAnahtari, setYenilemeAnahtari] = useState(0);
  const [yenileniyor, setYenileniyor] = useState(false);
  const musteri = !!kullanici && kullanici.kimlik_turu === MUSTERI_ROLU;

  useEffect(() => {
    if (yukleniyor) return;
    if (!kullanici) { router.replace("/login"); return; }
    if (!musteri) router.replace("/ana-sayfa");
  }, [kullanici, musteri, router, yukleniyor]);

  if (yukleniyor || !kullanici || !musteri) return <div className="flex min-h-screen items-center justify-center bg-[var(--tema-yerel-eczanem-sayfa-zemini-23)]"><span className="size-7 animate-spin rounded-full border-2 border-[var(--tema-yerel-eczanem-cizgi-39)] border-t-[var(--tema-yerel-eczanem-cizgi-02)]" aria-label="Oturum yükleniyor" /></div>;

  return <div className="min-h-screen bg-[var(--tema-yerel-eczanem-sayfa-zemini-23)] pb-12" style={{ fontFamily: "'Nunito', sans-serif" }}>
    <HataMesajiContainer mesajlar={mesajlar} />
    <EczanemMusteriNavbar ad={kullanici.adSoyad || kullanici.ad || "Müşteri"} telefon={kullanici.telefon} onCikis={cikisYap} />
    <main className="mx-auto flex w-full max-w-[1240px] flex-col gap-5 px-4 py-5 md:px-6 md:py-7">
      <SayfaYenileBasligi
        ustBilgi={<p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--tema-yerel-eczanem-islevsel-metin-34)]"><Coins className="size-3.5" /> Cogniti Eczanem</p>}
        baslik={<h1 className="text-2xl font-black tracking-[-0.025em] text-[var(--tema-yerel-eczanem-ana-metin-03)]">Puanlarım</h1>}
        aciklama={<p className="mt-1 max-w-2xl text-xs font-semibold leading-5 text-[var(--tema-yerel-eczanem-yardimci-metin-37)]">Ürün bazında kazandığınız puanları, TL karşılıklarını ve eczane onaylı kullanım geçmişinizi yönetin.</p>}
        aksiyon={<YenileButonu yenileniyor={yenileniyor} onYenile={() => setYenilemeAnahtari((deger) => deger + 1)} />}
      />
      <EczanemPuanlarim hata={hata} basari={basari} yenilemeAnahtari={yenilemeAnahtari} onYenileniyor={setYenileniyor} />
    </main>
  </div>;
}
