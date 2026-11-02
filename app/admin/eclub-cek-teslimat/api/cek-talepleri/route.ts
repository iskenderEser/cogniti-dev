import { cekKoduGecerli, cekBaglantisiGecerli } from "@/lib/eclub/store/teslimat";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { adminGirisKontrol } from "@/lib/utils/adminGirisKontrol";
import { hataYaniti, isKuraluHatasi, sunucuHatasi, validasyonHatasi } from "@/lib/utils/hataIsle";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
import { platformBannerFirmasi } from "@/lib/eclub/banner";
import { eclubAdminFiltreleri, ECLUB_ADMIN_DURUMLARI, type EclubAdminKesit } from "@/lib/eclub/store/adminFirmaTalepleri";
import * as XLSX from "xlsx";
function dbHatasi(error: { code: string; message: string }) {
 if (["42P01","42703","42883","PGRST202","PGRST204","PGRST205"].includes(error.code)) return NextResponse.json({ hata: "Firma bazında takip için eclub_admin_firma_talep_yonetimi.sql kurulumu gerekiyor." }, { status: 503 });
 if (error.code === "42501") return NextResponse.json({ hata: error.message }, { status: 403 });
 if (error.code === "P0002") return NextResponse.json({ hata: "Firma bulunamadı." }, { status: 404 });
 if (error.code === "40001") return NextResponse.json({ hata: error.message }, { status: 409 });
 if (["22023","23514"].includes(error.code)) return isKuraluHatasi(error.message);
 return hataYaniti("Çek talebi işlemi tamamlanamadı.", "E-Club admin firma talepleri", error);
}
const tarih = (v: string | null) => v ? new Date(v).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }) : "";
export async function GET(request: NextRequest) {
 try {
  const auth = await adminGirisKontrol(); if (!auth.gecerli) return auth.yanit;
  const db = createAdminClient(), q = request.nextUrl.searchParams;
  if (!q.has("firma")) {
   const r = await db.rpc("eclub_admin_firma_ozetleri"); if (r.error) return dbHatasi(r.error);
   return NextResponse.json(r.data, { headers: { "Cache-Control": "private, no-store" } });
  }
  const filtre = eclubAdminFiltreleri(q);
  if (!filtre || platformBannerFirmasi(filtre.p_firma)) return validasyonHatasi("Firma veya filtre bilgisi geçersiz.", ["firma", "durum", "bas", "son"]);
  const r = await db.rpc("eclub_admin_firma_talepleri", filtre); if (r.error) return dbHatasi(r.error);
  const data = r.data as EclubAdminKesit;
  if (data?.firma?.firma_id !== filtre.p_firma || !Array.isArray(data.talepler) || data.talepler.some(t => t.firma_id !== filtre.p_firma)) throw new Error("Firma kapsamı doğrulanamadı.");
  if (!filtre.p_export) return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
  const rows = data.talepler.map(t => ({ Firma: data.firma.firma_adi, "Talep No": t.talep_id, Tarih: tarih(t.created_at), Eczane: t.eczane_adi, GLN: t.gln || "", "Talep Eden": t.talep_eden, Rol: t.rol, Ürün: t.urun_adi, "Yayın No": t.talep_no ?? "", UTT: t.utt_adi, BM: t.bm_adi, TM: t.tm_adi, Puan: t.toplanan_puan, "Çek Tutarı (TL)": t.talep_edilen_cek_tl, Durum: ECLUB_ADMIN_DURUMLARI[t.durum], "Sipariş Adedi": t.siparis_verildi_mi ? t.siparis_adet : 0, "Mal Fazlası": t.siparis_verildi_mi ? t.siparis_mal_fazlasi : 0, "TM Onayı": tarih(t.tm_onay_tarihi), "Teslim Tarihi": tarih(t.cek_gonderim_tarihi) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Çek Talepleri");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.urun_ozeti.map(u => ({ Ürün: u.urun_adi, "Talep Adedi": u.adet, Puan: u.puan, "Tutar (TL)": u.tl }))), "Ürün Özeti");
  return new NextResponse(new Uint8Array(XLSX.write(wb, { type: "buffer", bookType: "xlsx" })), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="eclub_${filtre.p_firma}.xlsx"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
 } catch (error) { return sunucuHatasi(error, "GET E-Club admin firma talepleri"); }
}
export async function PATCH(request: NextRequest) {
 try {
  const auth = await adminGirisKontrol(); if (!auth.gecerli) return auth.yanit;
  const b = await request.json().catch(() => null);
  if (!b || !uuidGecerliMi(b.firma_id) || platformBannerFirmasi(b.firma_id) || !uuidGecerliMi(b.talep_id) || !["cek_kodu_teslim", "iptal"].includes(b.action)) return validasyonHatasi("Firma, talep veya işlem bilgisi geçersiz.", ["firma_id", "talep_id", "action"]);
  if (b.action === "cek_kodu_teslim" && (!cekKoduGecerli(b.cek_kodu) || !cekBaglantisiGecerli(b.kullanim_linki ?? ""))) return validasyonHatasi("Geçerli çek kodu ve varsa HTTPS kullanım bağlantısı girin.", ["cek_kodu", "kullanim_linki"]);
  const db = createAdminClient();
  const r = b.action === "cek_kodu_teslim"
   ? await db.rpc("eclub_admin_kod_baglanti_teslim", { p_admin: auth.kullaniciId, p_firma: b.firma_id.toLowerCase(), p_talep: b.talep_id.toLowerCase(), p_kod: b.cek_kodu.trim(), p_link: b.kullanim_linki || null })
   : await db.rpc("eclub_admin_firma_talep_islem", { p_admin: auth.kullaniciId, p_firma: b.firma_id.toLowerCase(), p_talep: b.talep_id.toLowerCase(), p_islem: b.action, p_kod: null });
  if (r.error) return dbHatasi(r.error);
  const sonuc = Array.isArray(r.data) ? r.data[0] : r.data;
  if (!sonuc?.ok) return isKuraluHatasi(sonuc?.hata || "Talep işlemi tamamlanamadı.");
  return NextResponse.json({ mesaj: b.action === "iptal" ? "Talep iptal edildi; bağlı puan kullanımı kaldırıldı." : "Çek kodu kaydedildi; e-posta ve push teslimat kuyruğuna alındı." });
 } catch (error) { return sunucuHatasi(error, "PATCH E-Club admin firma talepleri"); }
}
