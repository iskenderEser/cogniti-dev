"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Dialog } from "radix-ui";
import { useAuth } from "@/app/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { AlertDialogFooter, AlertDialogHeader } from "@/components/ui/alert-dialog";
import { satinAlmaBakiyeOzetiGecerli, yayinTokenHesabiVar } from "@/lib/satinAlma/bakiyeOzeti";
import { TOKEN_BAKIYE_YENILE_OLAYI } from "@/components/panel/TokenBakiyeOzeti";

export default function YeniYayinHesapKapisi({ children, etkin = true }: { children: ReactNode; etkin?: boolean }) {
  const { kullanici } = useAuth();
  const [durum, setDurum] = useState<"yukleniyor" | "acik" | "kapali" | "hata">("yukleniyor");
  const [yenileme, setYenileme] = useState(0);
  useEffect(() => {
    if (!etkin) return;
    const kontrol = new AbortController();
    async function oku() {
      try {
        const yanit = await fetch("/api/token-bakiyeleri", { cache: "no-store", signal: kontrol.signal });
        const veri: unknown = await yanit.json();
        if (!yanit.ok || !satinAlmaBakiyeOzetiGecerli(veri)) throw new Error("Hesap okunamadı");
        if (!kontrol.signal.aborted) setDurum(yayinTokenHesabiVar(veri) ? "acik" : "kapali");
      } catch {
        if (!kontrol.signal.aborted) setDurum("hata");
      }
    }
    void oku();
    return () => kontrol.abort();
  }, [kullanici?.id, yenileme, etkin]);
  useEffect(() => {
    const yenile = () => setYenileme(v => v + 1);
    window.addEventListener("focus", yenile);
    window.addEventListener(TOKEN_BAKIYE_YENILE_OLAYI, yenile);
    return () => {
      window.removeEventListener("focus", yenile);
      window.removeEventListener(TOKEN_BAKIYE_YENILE_OLAYI, yenile);
    };
  }, []);
  const engelli = etkin && (durum === "kapali" || durum === "hata");
  const kontrolBekliyor = etkin && durum === "yukleniyor";
  return <div className={engelli ? "relative isolate h-full overflow-hidden" : "contents"}>
    <div inert={engelli || kontrolBekliyor || undefined} aria-hidden={engelli || undefined}
      className={engelli ? "pointer-events-none h-full select-none overflow-hidden blur-[5px] opacity-55" : "contents"}>{children}</div>
    {engelli && <div aria-hidden="true" className="absolute inset-0 z-10 bg-[var(--tema-pencere-zemini)]/35 backdrop-blur-[2px]" />}
    <Dialog.Root open={engelli} modal={false}>
      <Dialog.Content onInteractOutside={e => e.preventDefault()} onEscapeKeyDown={e => e.preventDefault()}
        className="absolute left-1/2 top-1/2 z-20 grid max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] max-w-[358.4px] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-xl bg-[var(--tema-pencere-zemini)] p-6 shadow-lg">
        {durum === "hata" ? <>
            <Dialog.Title className="text-sm">Token hesabınız kontrol edilemedi.</Dialog.Title>
            <Button type="button" variant="outline" onClick={() => setYenileme(v => v + 1)}>Yeniden Dene</Button>
          </> : <>
        <AlertDialogHeader>
          <Dialog.Title className="text-lg font-semibold text-[var(--tema-bilesen-eylemi)]">Merhaba{kullanici?.ad ? ` ${kullanici.ad}` : ""}, 👋</Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground">Yeni yayın oluşturmak için kullanım paketlerini ve fiyatlarını görebilir, kolaylıkla sipariş verebilirsin.</Dialog.Description>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Link href="/fiyatlar" className="ml-auto inline-flex items-center gap-1 text-sm text-[var(--tema-kontrol-eylem)]">
            Paketler, Hizmetler ve Fiyatlar <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </AlertDialogFooter>
        </>}
      </Dialog.Content>
    </Dialog.Root>
  </div>;
}
