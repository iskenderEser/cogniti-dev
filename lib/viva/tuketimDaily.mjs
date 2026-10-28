// Daily oturumları Viva etkinliği tamamlandıktan sonra tek bir toplamda birleştirilir.
// Bu modül yalnızca sağlayıcıdan süre okur; tüketim veya bakiye değiştirmez.
export async function vivaDailyKullanimi({ oda, oku, sayfaBoyutu = 100 }) {
  if (!/^viva-[0-9a-f]{32}-n[1-9][0-9]*$/.test(oda) || !Number.isInteger(sayfaBoyutu) || sayfaBoyutu < 1 || sayfaBoyutu > 100) throw new Error('GECERSIZ_ODA');
  const uuid = x => typeof x === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
  const oturumlar = new Set();
  let katilimSayisi = 0;
  const toplamlar = new Map();
  let sure = 0, cursor;
  for (let sayfa = 0; sayfa < 10000; sayfa++) {
    const q = new URLSearchParams({ room: oda, limit: String(sayfaBoyutu) });
    if (cursor) q.set('starting_after', cursor);
    const r = await oku(`meetings?${q}`);
    if (!r || !Array.isArray(r.data) || r.data.length > sayfaBoyutu) throw new Error('DAILY_OTURUM_YANITI_GECERSIZ');
    for (const item of r.data) {
      if (!uuid(item?.id) || item.room !== oda || typeof item.ongoing !== 'boolean' || oturumlar.has(item.id)) throw new Error('DAILY_OTURUM_YANITI_GECERSIZ');
      if (item.ongoing) throw new Error('DAILY_OTURUM_DEVAM_EDIYOR');
      oturumlar.add(item.id);
      let sonraki;
      const katilimlar = new Set();
      for (let n = 0; n < 10000; n++) {
        const p = new URLSearchParams({limit: String(sayfaBoyutu)});
        if (sonraki) p.set('joined_after', sonraki);
        const page = await oku(`meetings/${item.id}/participants?${p}`);
        if (!page || !Array.isArray(page.data) || page.data.length > sayfaBoyutu) throw new Error('DAILY_KATILIM_YANITI_GECERSIZ');
        for (const kisi of page.data) {
          if (!uuid(kisi?.participant_id) || typeof kisi.duration !== 'number' || !Number.isFinite(kisi.duration) || kisi.duration < 0 || katilimlar.has(kisi.participant_id)) throw new Error('DAILY_KATILIM_YANITI_GECERSIZ');
          katilimlar.add(kisi.participant_id);
          katilimSayisi++;
          sure += kisi.duration;
          toplamlar.set(kisi.participant_id, (toplamlar.get(kisi.participant_id) ?? 0) + kisi.duration);
        }
        if (page.data.length < sayfaBoyutu) break;
        sonraki = page.data.at(-1).participant_id;
        if (n === 9999) throw new Error('DAILY_SAYFA_SINIRI');
      }
    }
    if (r.data.length < sayfaBoyutu) return { toplam_saniye: sure, oturum_sayisi: oturumlar.size, katilim_sayisi: katilimSayisi, oturum_idleri: [...oturumlar].sort(), katilimlar: [...toplamlar].map(([id, saniye]) => ({ id, saniye })).sort((a,b) => a.id.localeCompare(b.id)) };
    cursor = r.data.at(-1).id;
    if (sayfa === 9999) throw new Error('DAILY_SAYFA_SINIRI');
  }
  throw new Error('DAILY_SAYFA_SINIRI');
}
