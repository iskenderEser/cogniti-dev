import type { GonderimPlanKaydi, OneriKisi } from '../../oneriler/_types';
import { gonderimSebebiYaz, gonderimTarihiYaz } from '@/lib/eclub/gonderimEkrani';

interface PlanSatiri { anahtar: string; ilk: GonderimPlanKaydi; eczane: string; kayitlar: GonderimPlanKaydi[] }

export default function EclubPlanlananlar({ planlar, kisiler }: { planlar: GonderimPlanKaydi[]; kisiler: OneriKisi[] }) {
  if (!planlar.length) return <div className="rounded-2xl border border-[var(--tema-yerel-eclub-cizgi-03)] bg-[var(--tema-yerel-eclub-kart-01)] px-4 py-14 text-center text-sm text-[var(--tema-yerel-eclub-yardimci-metin-32)]">Bu listede planlanan yayın bulunmuyor.</div>;

  const eczaneler = new Map(kisiler.map(k => [k.kisi_id, k.eczane_adi]));
  const satirlar = new Map<string, PlanSatiri>();
  for (const plan of planlar) {
    const eczane = eczaneler.get(plan.kisi_id) || 'Eczane adı belirtilmemiş';
    const anahtar = [plan.hedef_gonderim_tarihi, plan.yayin_id, eczane, plan.durum, plan.son_hata_kodu ?? ''].join(':');
    const onceki = satirlar.get(anahtar);
    satirlar.set(anahtar, onceki ? { ...onceki, kayitlar: [...onceki.kayitlar, plan] } : { anahtar, ilk: plan, eczane, kayitlar: [plan] });
  }
  const sirali = [...satirlar.values()].sort((a, b) => a.ilk.hedef_gonderim_tarihi.localeCompare(b.ilk.hedef_gonderim_tarihi) || a.ilk.urun_adi.localeCompare(b.ilk.urun_adi, 'tr'));
  const durumYaz = (plan: GonderimPlanKaydi) => plan.durum === 'bekliyor' ? 'Planlandı' : plan.durum === 'isleniyor' ? 'Gönderim işleniyor' : `Gerçekleşmedi: ${gonderimSebebiYaz(plan.son_hata_kodu)}`;

  return <div className="overflow-hidden rounded-xl border border-[var(--tema-yerel-eclub-cizgi-03)] bg-[var(--tema-yerel-eclub-kart-01)]">
    <div className="hidden grid-cols-[125px_minmax(160px,1.6fr)_minmax(140px,1fr)_80px_minmax(120px,1fr)] gap-4 bg-[var(--tema-yerel-eclub-sayfa-zemini-19)] px-4 py-3 text-[10px] font-extrabold uppercase tracking-wide text-[var(--tema-yerel-eclub-yardimci-metin-42)] md:grid">
      <span>Planlanan gün</span><span>Yayın</span><span>Eczane</span><span>Alıcı</span><span>Durum</span>
    </div>
    {sirali.map(satir => <details key={satir.anahtar} className="group border-t border-[var(--tema-yerel-eclub-cizgi-38)] first:border-t-0 md:first:border-t">
      <summary className="grid cursor-pointer list-none grid-cols-2 gap-x-3 gap-y-1 px-4 py-3 text-xs text-[var(--tema-yerel-eclub-yardimci-metin-43)] marker:hidden hover:bg-[var(--tema-yerel-eclub-sayfa-zemini-05)] md:grid-cols-[125px_minmax(160px,1.6fr)_minmax(140px,1fr)_80px_minmax(120px,1fr)] md:items-center md:gap-4 [&::-webkit-details-marker]:hidden">
        <strong className="text-[var(--tema-yerel-eclub-ana-metin-06)]">{gonderimTarihiYaz(satir.ilk.hedef_gonderim_tarihi)}</strong>
        <span className="col-span-2 row-start-1 min-w-0 pr-20 md:col-span-1 md:row-auto md:pr-0"><strong className="block text-[var(--tema-yerel-eclub-ana-metin-06)]">{satir.ilk.urun_adi}{satir.ilk.talep_no ? ` (${satir.ilk.talep_no})` : ''}</strong><small className="mt-0.5 block text-[10px] text-[var(--tema-yerel-eclub-yardimci-metin-32)]">{satir.ilk.firma_adi ?? 'Firma belirtilmemiş'} · {satir.ilk.arac_turu ?? 'Yayın'}</small></span>
        <span className="truncate">{satir.eczane}</span>
        <span>{satir.kayitlar.length} kişi</span>
        <span className={satir.ilk.durum === 'gerceklesmedi' ? 'font-bold text-[var(--tema-yerel-eclub-islevsel-metin-09)]' : 'font-bold text-[var(--tema-yerel-eclub-islevsel-metin-39)]'}>{durumYaz(satir.ilk)} <span aria-hidden="true" className="ml-1 text-[var(--tema-yerel-eclub-yardimci-metin-32)] group-open:rotate-180">⌄</span></span>
      </summary>
      <div className="border-t border-[var(--tema-yerel-eclub-cizgi-39)] bg-[var(--tema-yerel-eclub-sayfa-zemini-09)] px-4 py-3 text-xs text-[var(--tema-yerel-eclub-yardimci-metin-43)]">
        <p className="mb-2 font-extrabold text-[var(--tema-yerel-eclub-ana-metin-06)]">Alıcılar</p>
        <ul className="flex flex-wrap gap-2">{satir.kayitlar.map(p => <li key={p.plan_id} className="rounded-lg border border-[var(--tema-yerel-eclub-cizgi-34)] bg-[var(--tema-yerel-eclub-kart-01)] px-2.5 py-1.5">{p.kisi_ad} {p.kisi_soyad}</li>)}</ul>
      </div>
    </details>)}
  </div>;
}
