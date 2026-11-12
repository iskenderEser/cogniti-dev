-- Önceki Banner proforma kurulumu üzerine uygulanır.
BEGIN;

CREATE OR REPLACE FUNCTION public.cogniti_banner_proforma_belgesi(p_firma uuid,p_ay date)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $f$
 WITH satirlar AS (
 SELECT k.*, r.baslangic, r.haftalik_token, t.islem_turu
 FROM public.cogniti_banner_proforma_kalemleri(p_firma,p_ay) k
 JOIN public.cogniti_token_tuketimleri t ON t.tuketim_id=k.tuketim_id AND t.firma_id=p_firma
 JOIN public.firma_banner_rezervasyonlari r ON r.rezervasyon_id=t.kaynak_id AND r.firma_id=p_firma
 WHERE k.birim_fiyat>0 AND k.birim_fiyat::text NOT IN('NaN','Infinity','-Infinity')
 ), ozet AS (
 SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.tarih,s.tuketim_id),'[]'::jsonb) kalemler,
 coalesce(sum(tutar),0) toplam FROM satirlar s
 )
 SELECT jsonb_build_object('firma_id',p_firma,'donem',to_char(p_ay,'YYYY-MM'),
 'belge_no','PF-B-'||to_char(p_ay,'YYYYMM')||'-'||p_firma::text,'tarih',(p_ay+interval '1 month')::date,
 'duzenleyen',jsonb_build_object('unvan','Mill Danışmanlık Org. ve Eğt. Hiz. Ltd. Şti',
 'adres','Göktürk Merkez M. İstanbul C. Üstüküme S. No: D51 Göktürk-Eyüp-İstanbul',
 'vergi_dairesi','Gaziosmanpaşa','vergi_numarasi','6210464784'),
 'alici',jsonb_build_object('unvan',a.firma_adi,'adres',coalesce(a.adres,''),
 'vergi_dairesi',coalesce(a.vergi_dairesi,''),'vergi_numarasi',coalesce(a.vergi_numarasi,'')),
 'satirlar',o.kalemler,'toplam_tutar',o.toplam,'kdv',round(o.toplam/5,2),'genel_tutar',o.toplam+round(o.toplam/5,2))
 FROM public.firmalar a CROSS JOIN ozet o WHERE a.firma_id=p_firma;
$f$;


-- Onaylanmış tutarları ve satır sırasını koruyarak eksik alım bilgilerini tamamlar.
UPDATE public.cogniti_banner_proforma_onaylari o
SET belge=jsonb_set(o.belge,'{satirlar}',(
 SELECT jsonb_agg(
   CASE WHEN r.rezervasyon_id IS NULL OR s.kalem ? 'baslangic' THEN s.kalem
   ELSE s.kalem || jsonb_build_object(
     'baslangic',r.baslangic,'haftalik_token',r.haftalik_token,'islem_turu',t.islem_turu
   ) END ORDER BY s.sira
 )
 FROM jsonb_array_elements(o.belge->'satirlar') WITH ORDINALITY s(kalem,sira)
 LEFT JOIN public.cogniti_token_tuketimleri t ON t.tuketim_id=(s.kalem->>'tuketim_id')::uuid AND t.firma_id=o.firma_id
 LEFT JOIN public.firma_banner_rezervasyonlari r ON r.rezervasyon_id=t.kaynak_id AND r.firma_id=o.firma_id
))
WHERE EXISTS (
 SELECT 1 FROM jsonb_array_elements(o.belge->'satirlar') AS s(kalem)
 WHERE NOT (s.kalem ? 'baslangic')
);

COMMIT;
SELECT true AS cogniti_banner_proforma_sutunlari_guncellendi;
