-- Yalnız okuma: mevcut Viva otomatik işleyicisinin etkinliğini gösterir.
-- Gizli anahtar, URL ve cron komut gövdesini döndürmez. Hiçbir ayarı değiştirmez.
SELECT jobname, schedule, active
FROM cron.job
WHERE jobname = 'cogniti_viva_yasam';
