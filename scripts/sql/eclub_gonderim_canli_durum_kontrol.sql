-- Adım 12: SALT OKUNUR cron/Vault/veri tutarlılığı kontrolü.
-- Önce eclub_gonderim_kurulum_kontrol.sql sonuçları doğrulanır.
-- Gizli değerler ve üye kimlikleri sonuçta gösterilmez. HTTP/gönderim çağrısı yoktur.
BEGIN READ ONLY;
SET LOCAL timezone = 'Europe/Istanbul';
SELECT 'cron_tek_kayit' kontrol,(count(*)=1)::text sonuc FROM cron.job WHERE jobname='hapbilgi_eclub_yayin_gonderim_planlari'
UNION ALL SELECT 'cron_dakikalik',coalesce(bool_and(schedule='* * * * *'),false)::text FROM cron.job WHERE jobname='hapbilgi_eclub_yayin_gonderim_planlari'
UNION ALL SELECT 'cron_aktif',coalesce(bool_or(active),false)::text FROM cron.job WHERE jobname='hapbilgi_eclub_yayin_gonderim_planlari'
UNION ALL SELECT 'cron_dogru_endpoint',coalesce(bool_and(position('/api/cron/eclub-yayin-gonderim' IN command)>0),false)::text FROM cron.job WHERE jobname='hapbilgi_eclub_yayin_gonderim_planlari'
UNION ALL SELECT 'vault_base_url_hazir',(count(*)=1 AND coalesce(bool_and(nullif(trim(decrypted_secret),'') IS NOT NULL),false))::text
 FROM vault.decrypted_secrets WHERE name='hapbilgi_cron_base_url'
UNION ALL SELECT 'vault_secret_hazir',(count(*)=1 AND coalesce(bool_and(nullif(trim(decrypted_secret),'') IS NOT NULL),false))::text
 FROM vault.decrypted_secrets WHERE name='hapbilgi_cron_secret'
UNION ALL SELECT 'bekleyen_plan',count(*)::text FROM public.eclub_yayin_gonderim_planlari WHERE durum='bekliyor'
UNION ALL SELECT 'zamani_gelmis_bekleyen_plan',count(*)::text FROM public.eclub_yayin_gonderim_planlari WHERE durum='bekliyor' AND hedef_gonderim_at <= (clock_timestamp() AT TIME ZONE 'Europe/Istanbul')::date
UNION ALL SELECT 'isleniyor_plan',count(*)::text FROM public.eclub_yayin_gonderim_planlari WHERE durum='isleniyor'
UNION ALL SELECT 'gerceklesmis_plan',count(*)::text FROM public.eclub_yayin_gonderim_planlari WHERE durum='gerceklesti'
UNION ALL SELECT 'gerceklesmeyen_plan',count(*)::text FROM public.eclub_yayin_gonderim_planlari WHERE durum='gerceklesmedi'
UNION ALL SELECT 'sonuc_bagi_uyusmazligi',count(*)::text FROM public.eclub_yayin_gonderim_planlari p
 LEFT JOIN public.eclub_oneri_kayitlari o ON o.oneri_id=p.oneri_id
 WHERE p.durum='gerceklesti' AND (o.oneri_id IS NULL OR o.plan_id IS DISTINCT FROM p.plan_id
  OR o.oneren_id IS DISTINCT FROM p.utt_id OR o.kisi_id IS DISTINCT FROM p.kisi_id
  OR o.yayin_id IS DISTINCT FROM p.yayin_id OR o.oneri_baslangic IS DISTINCT FROM p.gerceklesti_at)
UNION ALL SELECT 'planli_oneri_15_gun_uyusmazligi',count(*)::text FROM public.eclub_oneri_kayitlari
 WHERE plan_id IS NOT NULL AND oneri_bitis IS DISTINCT FROM oneri_baslangic+interval '15 days'
ORDER BY kontrol;
COMMIT;
