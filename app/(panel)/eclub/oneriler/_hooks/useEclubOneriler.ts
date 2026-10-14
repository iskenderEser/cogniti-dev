"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import type { OneriYayin, OneriKisi, OneriLimitler, OneriGecmisKaydi, GonderimPlanKaydi, TopluGonderimSonucu } from '../_types';
import { bildirimRozetleriniYenile } from '@/lib/bildirimler/rozet';

interface UseArgs { hazir: boolean; hata: (mesaj: string, adim?: string, detay?: string) => void; basari: (mesaj: string) => void }
async function oku(url: string) {
  const res = await fetch(url, { cache: 'no-store' });
  const veri = await res.json();
  if (!res.ok) throw new Error(veri.hata ?? veri.error ?? 'Gönderim verileri alınamadı.');
  return veri;
}
async function sayfalariOku<T>(kaynak: 'oneriler' | 'planlar'): Promise<{ kayitlar: T[]; limitler: OneriLimitler }> {
  const ek = kaynak === 'planlar' ? 'kaynak=planlar&' : '';
  const kayitlar: T[] = [];
  let sayfa = 1;
  let limitler: OneriLimitler;
  for (;;) {
    const veri = await oku(`/eclub/oneriler/api?${ek}sayfa=${sayfa}&sayfa_boyutu=100`);
    if (!Array.isArray(veri[kaynak])) throw new Error('Gönderim listesi doğrulanamadı.');
    kayitlar.push(...veri[kaynak]); limitler = veri.limitler;
    if (!veri.sayfalama?.devam_var) break;
    sayfa++;
  }
  return { kayitlar, limitler };
}
export function useEclubOneriler({ hazir, hata, basari }: UseArgs) {
  const [yayinlar, setYayinlar] = useState<OneriYayin[]>([]);
  const [kisiler, setKisiler] = useState<OneriKisi[]>([]);
  const [limitler, setLimitler] = useState<OneriLimitler | null>(null);
  const [gonderimGecmisi, setGonderimGecmisi] = useState<OneriGecmisKaydi[]>([]);
  const [planlar, setPlanlar] = useState<GonderimPlanKaydi[]>([]);
  const [loading, setLoading] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);
  const [gonderLoading, setGonderLoading] = useState(false);
  const [veriSurumu, setVeriSurumu] = useState(0);
  const istekSirasi = useRef(0);
  const veriCek = useCallback(async (ilkYukleme = false) => {
    const sira = ++istekSirasi.current;
    if (ilkYukleme) setLoading(true); else setYenileniyor(true);
    try {
      const [yayin, kisi, gecmis, plan] = await Promise.all([
        oku('/eclub/oneriler/api/yayinlar'), oku('/eclub/listem/api/kisiler'),
        sayfalariOku<OneriGecmisKaydi>('oneriler'), sayfalariOku<GonderimPlanKaydi>('planlar'),
      ]);
      if (sira !== istekSirasi.current) return;
      setYayinlar(yayin.videolar ?? []);
      setKisiler([...new Map<string, OneriKisi>((kisi.kisiler as OneriKisi[]).map(k => [k.kisi_id, k])).values()]);
      setGonderimGecmisi([...new Map(gecmis.kayitlar.map(k => [k.oneri_id, k])).values()]);
      setPlanlar([...new Map(plan.kayitlar.map(k => [k.plan_id, k])).values()]);
      setLimitler(gecmis.limitler); setVeriSurumu(v => v + 1);
    } catch (err) { if (sira === istekSirasi.current) hata('Gönderim verileri yüklenemedi.', 'E-Club yayınları', err instanceof Error ? err.message : undefined); }
    finally { if (sira === istekSirasi.current) { setLoading(false); setYenileniyor(false); } }
  }, [hata]);
  useEffect(() => { if (hazir) void veriCek(true); }, [hazir, veriCek]);

  const uygunluguKontrolEt = useCallback(async (yayinIdler: string[], kisiIdler: string[], hedef: string | null, signal?: AbortSignal, tarihleriHesapla = false): Promise<TopluGonderimSonucu> => {
    const res = await fetch('/eclub/oneriler/api', { method: 'POST', signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ islem: 'kontrol', yayin_idler: yayinIdler, kisi_idler: kisiIdler, hedef_gonderim_tarihi: hedef, tarihleri_hesapla: tarihleriHesapla }),
    });
    const veri = await res.json();
    if (!res.ok) throw new Error(veri.hata ?? 'Gönderim uygunluğu alınamadı.');
    if (!Array.isArray(veri.sonuclar) || veri.sonuclar.length !== yayinIdler.length * kisiIdler.length)
      throw new Error('Gönderim uygunluk sonucu eksik.');
    return veri as TopluGonderimSonucu;
  }, []);
  const topluKaydet = useCallback(async (yayinIdler: string[], kisiIdler: string[], hedef: string | null, islemAnahtari: string): Promise<TopluGonderimSonucu | null> => {
    setGonderLoading(true);
    try {
      const res = await fetch('/eclub/oneriler/api', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ islem: hedef ? 'planla' : 'gonder', yayin_idler: yayinIdler, kisi_idler: kisiIdler, hedef_gonderim_tarihi: hedef, islem_anahtari: islemAnahtari }),
      });
      const veri = await res.json();
      if (!res.ok) { hata(veri.hata ?? 'İşlem kaydedilemedi.', veri.adim, veri.detay); return null; }
      basari(veri.mesaj); await veriCek();
      if (veri.gonderilen_sayisi > 0) bildirimRozetleriniYenile();
      return veri as TopluGonderimSonucu;
    } catch (err) { hata('Gönderim işlemi tamamlanamadı.', 'Toplu gönderim', err instanceof Error ? err.message : undefined); return null; }
    finally { setGonderLoading(false); }
  }, [hata, basari, veriCek]);
  const gonderilenKisiler: Record<string, string[]> = {};
  for (const kayit of gonderimGecmisi) {
    const onceki = gonderilenKisiler[kayit.yayin_id] ?? [];
    if (!onceki.includes(kayit.kisi_id)) gonderilenKisiler[kayit.yayin_id] = [...onceki, kayit.kisi_id];
  }
  return { yayinlar, kisiler, limitler, planlar, gonderilenKisiler, gonderilenYayinIdleri: Object.keys(gonderilenKisiler),
    gonderimGecmisi, loading, yenileniyor, gonderLoading, veriSurumu, veriCek, uygunluguKontrolEt, topluKaydet };
}
