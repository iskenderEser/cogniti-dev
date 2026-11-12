import { YayinKarti } from "@/components/yayin/YayinKarti";
import type { UyeGonderimYayini } from "@/lib/eczanem/uyeGonderimOzeti";
import { UyeGonderimDetaylari } from "./UyeGonderimDetaylari";

export function UyeYayinKarti({ yayin }: { yayin: UyeGonderimYayini }) {
  const kart = <YayinKarti
    yayin={yayin}
    className="h-full"
    durumGoster={false}
    etkilesimGoster={false}
    izlenmeGoster={false}
    puanGoster={false}
    extraPuanGoster={false}
    donguGoster={false}
    altEkIcerik={<div className="mt-2 space-y-2 border-t border-[var(--tema-hoyk-ek-icerik-cizgi)] pt-2 text-xs">
      <p>{yayin.gonderenEczaneSayisi.toLocaleString("tr-TR")} eczaneden {yayin.gonderilenUyeSayisi.toLocaleString("tr-TR")} üyeye gönderildi</p>
    </div>}
  />;
  return <UyeGonderimDetaylari urunAdi={yayin.urun_adi} eczaneler={yayin.eczaneDetaylari ?? []}>{kart}</UyeGonderimDetaylari>;
}
