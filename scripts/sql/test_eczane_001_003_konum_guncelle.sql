-- Yalnız Test Eczanesi 001, 002 ve 003'ün ortak il/ilçe kayıtlarını günceller.
-- GLN, eczane adı ve test kaynağı birlikte doğrulanır.
-- Üye, UTT, bölge, takım ve firma bağlantıları değiştirilmez.
BEGIN;

DO $islem$
DECLARE
  hedef record;
BEGIN
  FOR hedef IN
    SELECT * FROM (VALUES
      ('1110000000001', 'Test Eczanesi 001', 'İzmir', 'Karşıyaka'),
      ('1110000000002', 'Test Eczanesi 002', 'İzmir', 'Bayraklı'),
      ('1110000000003', 'Test Eczanesi 003', 'İzmir', 'Urla')
    ) AS konum(gln, eczane_adi, il, ilce)
    ORDER BY gln
  LOOP
    PERFORM 1
    FROM public.eclub_eczane_master m
    WHERE m.gln = hedef.gln
      AND m.eczane_adi = hedef.eczane_adi
      AND m.kaynak = 'test'
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION '% (%) test kaydı doğrulanamadı; hiçbir konum değişikliği uygulanmadı.',
        hedef.eczane_adi, hedef.gln;
    END IF;

    UPDATE public.eclub_eczane_master
    SET il = hedef.il, ilce = hedef.ilce
    WHERE gln = hedef.gln
      AND eczane_adi = hedef.eczane_adi
      AND kaynak = 'test'
      AND (il IS DISTINCT FROM hedef.il OR ilce IS DISTINCT FROM hedef.ilce);
  END LOOP;
END;
$islem$;

COMMIT;

SELECT gln, eczane_adi, il, ilce
FROM public.eclub_eczane_master
WHERE gln IN ('1110000000001', '1110000000002', '1110000000003')
  AND kaynak = 'test'
ORDER BY gln;
