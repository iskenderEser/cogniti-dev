import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
export const ECLUB_ADMIN_DURUMLARI = { onaylandi: "Kod bekleyen", teslimat_bekliyor: "Teslimatta", cek_kodlari_gonderildi: "Tamamlanan", iptal: "İptal" };
export type EclubAdminDurumu = keyof typeof ECLUB_ADMIN_DURUMLARI;
export interface EclubAdminOzet { toplam: number; bekleyen: number; teslimatta: number; tamamlanan: number; iptal: number; puan: number; tl: number }
export interface EclubAdminFirma extends EclubAdminOzet { firma_id: string; firma_adi: string; aktif: boolean; eclub_aktif: boolean }
export interface EclubAdminTalep {
 talep_id: string; firma_id: string; eczane_adi: string; gln: string | null; talep_eden: string; rol: string;
 urun_adi: string; yayin_id: string; talep_no: number | null; utt_adi: string; bm_adi: string; tm_adi: string;
 toplanan_puan: number; talep_edilen_cek_tl: number; siparis_verildi_mi: boolean; siparis_adet: number; siparis_mal_fazlasi: number;
 durum: EclubAdminDurumu; created_at: string; tm_onay_tarihi: string; cek_kodu: string | null; kullanim_linki: string | null; cek_gonderim_tarihi: string | null;
 teslimat_ayrintilari?: {kanal:string;durum:string;deneme:number;max_deneme:number;son_hata:string|null;tamamlanma_at:string|null}[];
 teslimat: { kanal: "eposta" | "push"; durum: string; adet: number }[];
}
export interface EclubAdminKesit { firma: { firma_id: string; firma_adi: string }; ozet: EclubAdminOzet; talepler: EclubAdminTalep[]; toplam: number; sayfa: number; urun_ozeti: { urun_adi: string; adet: number; puan: number; tl: number }[] }
export function eclubAdminFiltreleri(q: URLSearchParams) {
 const firma = q.get("firma"), durum = q.get("durum") || null, bas = q.get("bas") || null, son = q.get("son") || null;
 const arama = (q.get("arama") || "").trim(), sayfa = Number(q.get("sayfa") || 1);
 const tarih = (s: string | null) => {
  if (!s) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y,m,d] = s.split("-").map(Number), leap = y%4===0 && (y%100!==0 || y%400===0);
  return y>=1 && m>=1 && m<=12 && d>=1 && d<=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31][m-1];
 };
 if (!uuidGecerliMi(firma) || (durum && !Object.hasOwn(ECLUB_ADMIN_DURUMLARI, durum)) || !tarih(bas) || !tarih(son) || (bas && son && bas>son)
  || arama.length>200 || !Number.isInteger(sayfa) || sayfa<1 || sayfa>1000000) return null;
 return { p_firma: firma.toLowerCase(), p_durum: durum, p_bas: bas, p_son: son, p_arama: arama, p_sayfa: sayfa, p_export: q.get("export")==="1" };
}
