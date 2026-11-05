-- Yalnız Agora partner test ortamı: MOD 97 kontrolünü geçici olarak askıya alır.
-- TR + 24 rakam biçimi korunur. Canlı geçişinde MOD 97 geri açılacak: AGENTS.md.
BEGIN;
ALTER TABLE public.agora_partner_profilleri
  DROP CONSTRAINT IF EXISTS agora_partner_profilleri_iban_check;
ALTER TABLE public.agora_partner_profilleri
  ADD CONSTRAINT agora_partner_profilleri_iban_check
  CHECK (iban ~ '^TR[0-9]{24}$');
COMMIT;
SELECT EXISTS (
  SELECT 1 FROM pg_constraint
  WHERE conrelid='public.agora_partner_profilleri'::regclass
    AND conname='agora_partner_profilleri_iban_check'
    AND contype='c'
    AND pg_get_constraintdef(oid) NOT ILIKE '%mod(%'
) AS agora_partner_iban_test_kurali_hazir;
