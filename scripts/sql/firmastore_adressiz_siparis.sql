-- Adres yönetimi kaldırılır; tarihî sipariş adresleri korunur.
-- Mevcut rol, firma, ürün, takvim, bakiye ve stok kontrolleri aynen devralınır.
BEGIN;
DO $kurulum$
DECLARE kaynak text; baslangic integer; bitis integer;
BEGIN
 kaynak:=pg_get_functiondef('public.store_siparis_olustur_cekirdek(uuid,uuid,uuid,integer)'::regprocedure);
 kaynak:=replace(kaynak,'public.store_siparis_olustur_cekirdek(', 'public.store_siparis_olustur_adressiz_cekirdek(');
 kaynak:=regexp_replace(kaynak,'p_adres_id uuid,[[:space:]]*','');
 baslangic:=strpos(kaynak,'-- 3. Adres kontrolü + snapshot');
 bitis:=strpos(kaynak,'-- 4. Toplam puan hesap');
 IF baslangic=0 OR bitis<=baslangic THEN RAISE EXCEPTION 'Adres kontrol bloğu beklenen yapıda değil; işlem iptal edildi.'; END IF;
 kaynak:=substring(kaynak FROM 1 FOR baslangic-1)||E'v_adres_snapshot := ''{}''::jsonb;\n  '||substring(kaynak FROM bitis);
 kaynak:=replace(kaynak,'p_adres_id','NULL::uuid');
 EXECUTE kaynak;
 kaynak:=pg_get_functiondef('public.store_siparis_olustur(uuid,uuid,uuid,integer)'::regprocedure);
 kaynak:=replace(kaynak,'public.store_siparis_olustur(', 'public.store_siparis_olustur_adressiz(');
 kaynak:=regexp_replace(kaynak,'p_adres_id uuid,[[:space:]]*','');
 kaynak:=replace(kaynak,'public.store_siparis_olustur_cekirdek(', 'public.store_siparis_olustur_adressiz_cekirdek(');
 kaynak:=regexp_replace(kaynak,'p_adres_id,[[:space:]]*','','g');
 EXECUTE kaynak;
END $kurulum$;
REVOKE ALL ON FUNCTION public.store_siparis_olustur_adressiz(uuid,uuid,integer) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.store_siparis_olustur_adressiz_cekirdek(uuid,uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.store_siparis_olustur_adressiz(uuid,uuid,integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.store_siparis_olustur_adressiz_cekirdek(uuid,uuid,integer) TO service_role;
-- Eski adresli sipariş yolu ve adres yazma işlemleri artık kullanılmaz.
REVOKE EXECUTE ON FUNCTION public.store_siparis_olustur(uuid,uuid,uuid,integer) FROM PUBLIC,anon,authenticated,service_role;
REVOKE EXECUTE ON FUNCTION public.store_siparis_olustur_cekirdek(uuid,uuid,uuid,integer) FROM PUBLIC,anon,authenticated,service_role;
REVOKE INSERT,UPDATE,DELETE,TRUNCATE ON public.store_adresler FROM PUBLIC,anon,authenticated,service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS firmastore_adres_temizligi_hazir;
