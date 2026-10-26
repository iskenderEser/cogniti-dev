// Deployment ve Vercel DAILY_WEBHOOK_SECRET ayarından SONRA kullanıcı çalıştırır.
// node --env-file=.env.local scripts/viva-daily-webhook.mjs https://SITE/api/viva/daily-webhook
// Aynı URL zaten kayıtlıysa günceller/FAILED durumunu yeniden etkinleştirir.
import { VIVA_DAILY_OLAYLAR } from '../lib/viva/webhook-events.mjs';
const url = new URL(process.argv[2] ?? '');
if (url.protocol !== 'https:' || url.pathname !== '/api/viva/daily-webhook' || url.search || url.hash || url.username || url.password) throw Error('Üretim HTTPS webhook adresini belirtin.');
const key = process.env.DAILY_API_KEY, secret = process.env.DAILY_WEBHOOK_SECRET;
if (!key || !secret || !/^[A-Za-z0-9+/]{43}=$/.test(secret)) throw Error('Yerel API anahtarı ve webhook sırrı gerekli.');
async function api(path, body) {
  const r = await fetch(`https://api.daily.co/v1/${path}`, { method: body ? 'POST' : 'GET', signal: AbortSignal.timeout(20_000), redirect: 'error', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  if (!r.ok) throw Error(`Daily webhook işlemi başarısız: HTTP ${r.status}. Deployment/HTTPS/Secret ayarını kontrol edin.`);
  return r.json();
}
const liste = await api('webhooks');
const rows = Array.isArray(liste) ? liste : liste.data;
if (!Array.isArray(rows)) throw Error('Webhook listesi doğrulanamadı.');
const mevcut = rows.filter(w => w.url === url.href);
if (mevcut.length > 1) throw Error('Aynı URL için birden fazla webhook var; Daily panelinde kontrol edin.');
const w = await api(mevcut.length ? `webhooks/${mevcut[0].uuid}` : 'webhooks', { url: url.href, hmac: secret, eventTypes: VIVA_DAILY_OLAYLAR });
if (w.state !== 'ACTIVE') throw Error('Webhook henüz ACTIVE değil.');
console.log(JSON.stringify({ webhook_id: w.uuid, durum: w.state, url: w.url, olaylar: w.eventTypes }, null, 2));
