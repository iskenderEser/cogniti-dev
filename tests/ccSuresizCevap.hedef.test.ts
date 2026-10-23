import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const oku = (path: string) => readFileSync(path, "utf8");
const kaynak = oku("scripts/sql/soru_kesinti_faz5_cevap.sql");
const oncekiKaynak = oku("scripts/sql/cc_izleme_cevap_guvenligi.sql");
const gecis = oku("scripts/sql/cc_suresiz_challenge_cevap.sql");
function cevapGovdesi(sql: string) {
  const a = sql.indexOf("CREATE OR REPLACE FUNCTION public.cc_cevaplari_kaydet(");
  assert.ok(a >= 0);
  const b = sql.indexOf("$function$;", a);
  assert.ok(b > a);
  return sql.slice(a, b + "$function$;".length);
}
const govde = cevapGovdesi(gecis);

test("geçişte ve iki kaynakta eski tarih reddi kaldırılmıştır", () => {
  for (const sql of [kaynak, oncekiKaynak, gecis]) {
    assert.doesNotMatch(sql, /IF\s+v_challenge\.son_tarih\s*</);
    assert.doesNotMatch(sql, /RAISE EXCEPTION 'Challenge süresi dolmuş/);
  }
});

test("geçiş yalnız güncel C-Club cevap fonksiyonunu taşır", () => {
  assert.equal(govde, cevapGovdesi(kaynak));
  assert.equal((gecis.match(/CREATE OR REPLACE FUNCTION/g) ?? []).length, 1);
  assert.doesNotMatch(gecis, /CREATE OR REPLACE FUNCTION public\.(eclub|eczanem)_/);
  const disKapsam = gecis.replace(govde, "");
  assert.doesNotMatch(disKapsam, /\b(INSERT INTO|DELETE FROM|UPDATE public\.|ALTER TABLE|DROP TABLE)\b/i);
  assert.match(disKapsam, /BEGIN;/);
  assert.match(disKapsam, /COMMIT;/);
  assert.match(disKapsam, /AS cc_suresiz_cevap_hazir/);
});

test("sahiplik, tamamlama, ileri sarma, soru erişimi ve cevap tekilliği korunur", () => {
  assert.equal((govde.match(/FOR UPDATE/g) ?? []).length, 2);
  assert.match(govde, /v_izleme\.bm_id <> p_bm_id/);
  assert.match(govde, /NOT v_izleme\.tamamlandi_mi[\s\S]*v_izleme\.ileri_sarildi_mi/);
  assert.match(govde, /IF v_izleme\.cevaplandi_mi THEN/);
  assert.match(govde, /NOT COALESCE\(v_izleme\.soru_erisimi_acik_mi, false\)/);
  assert.match(govde, /v_gelen_indeksler IS DISTINCT FROM v_atanan_indeksler/);
  assert.match(govde, /SET cevaplandi_mi = true,[\s\S]*soru_erisimi_acik_mi = false/);
});

test("doğru cevap, yanlış cevap kaybı ve bir kez referral sözleşmesi korunur", () => {
  assert.match(govde, /FROM public\.soru_seti_puanlari/);
  assert.match(govde, /IF v_verilen = v_dogru THEN/);
  assert.match(govde, /INSERT INTO public\.cc_yanlis_cevap_kayitlari/);
  assert.match(govde, /v_challenge\.alan_id <> p_bm_id/);
  assert.match(govde, /v_challenge\.yayin_id <> v_izleme\.yayin_id/);
  assert.match(govde, /WHERE sa\.anahtar = 'cc_referral_puani'/);
  assert.match(govde, /'cc_referral', v_referral\)[\s\S]*ON CONFLICT DO NOTHING/);
  assert.doesNotMatch(govde, /SET izlendi_mi/);
  assert.match(oncekiKaynak, /CREATE UNIQUE INDEX IF NOT EXISTS cc_puan_referral_challenge_uq/);
});

test("yalnız sunucuya verilen çalıştırma yetkisi korunur", () => {
  assert.match(gecis, /REVOKE ALL ON FUNCTION public\.cc_cevaplari_kaydet\(uuid, uuid, jsonb\)[\s\S]*FROM PUBLIC, anon, authenticated/);
  assert.match(gecis, /GRANT EXECUTE ON FUNCTION public\.cc_cevaplari_kaydet\(uuid, uuid, jsonb\)[\s\S]*TO service_role/);
});
