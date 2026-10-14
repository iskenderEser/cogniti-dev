import assert from 'node:assert/strict';
import test from 'node:test';
import { Window } from 'happy-dom';
import React, { act } from 'react';

const window = new Window({ url: 'http://localhost' });
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'NodeFilter', 'HTMLInputElement', 'HTMLButtonElement', 'MutationObserver', 'CustomEvent', 'Event', 'KeyboardEvent', 'MouseEvent', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame'].includes(key) ? window[key].bind(window) : window[key] });
}
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const { createRoot } = await import('react-dom/client');
const { default: Panel } = await import('../app/(panel)/eclub/yayinlar/_components/EclubGonderimPaneli');
const yayin = { yayin_id: 'y', urun_adi: 'Ürün', hedef_roller: ['eczaci'], gonderim_incelemesi_tamamlandi: true };
const kisi = { kisi_id: 'k', ad: 'Ali', soyad: 'Üye', rol: 'eczaci', aktif_mi: true, auth_user_id: 'a', eczane_adi: 'Merkez Eczanesi' };
const button = (text: string, scope: ParentNode = document.body) => [...scope.querySelectorAll('button')].find(b => b.textContent?.trim() === text) as HTMLButtonElement | undefined;
const temel = { yayinlar: [yayin], kisiler: [kisi], veriSurumu: 1, disabled: false, kaydediliyor: false, bantGoster: true, onSecimTemizle: () => {}, onBasarili: () => {}, kontrolEt: async () => ({ sonuclar: [] }), kaydet: async () => null };
async function mount(props: Record<string, unknown>, t: TestContext) {
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container);
  t.after(async () => { await act(async () => root.unmount()); container.remove(); });
  await act(async () => root.render(React.createElement(Panel, { ...temel, ...props })));
  return container;
}
type TestContext = { after: (callback: () => Promise<void>) => void };
const click = async (text: string) => { const found = button(text); assert.ok(found, `Düğme bulunamadı: ${text}`); await act(async () => found.click()); };

test('inceleme bitmeden gönderim adımına geçilmez; planlama yalnız tarih seçtirir', async t => {
  let kontrol = 0; let kayit = 0;
  await mount({ yayinlar: [{ ...yayin, gonderim_incelemesi_tamamlandi: false }], kontrolEt: async () => { kontrol++; }, kaydet: async () => { kayit++; } }, t);
  assert.equal(kontrol, 0);
  await click('Gönderim oluştur →');
  assert.equal(button('Devam et →')?.disabled, true);
  const planla = [...document.querySelectorAll('button')].find(b => b.textContent?.startsWith('Bir güne planla'));
  assert.ok(planla);
  await act(async () => planla.click());
  assert.ok(document.querySelector('input[type=date]'));
  assert.equal(document.querySelector('input[type=time]'), null);
  assert.equal(button('Devam et →')?.disabled, true);
  assert.equal(kayit, 0);
});

test('sunucu kota engeli alıcı seçimini ve kaydı kapatır', async t => {
  let kontrol = 0; let kayit = 0;
  await mount({ kontrolEt: async () => { kontrol++; return { sonuclar: [{ yayin_id: 'y', kisi_id: 'k', uygun: false, sebep: 'haftalik_urun_kotasi' }] }; }, kaydet: async () => { kayit++; } }, t);
  await click('Gönderim oluştur →');
  await click('Devam et →');
  assert.equal(kontrol, 1);
  assert.match(document.querySelector('[role=dialog]')?.textContent ?? '', /haftalık 3 gönderim\/plan hakkı doldu/);
  assert.equal((document.querySelector('input[type=checkbox]') as HTMLInputElement).disabled, true);
  assert.equal(button('Özeti göster →')?.disabled, true);
  assert.equal(kayit, 0);
});

test('15 gün engeli her alıcıda tam istenen metin ve kendi kalan günüyle görünür', async t => {
  const ikinciKisi = { ...kisi, kisi_id: 'k2', ad: 'Ayşe', auth_user_id: 'a2' };
  const simdi = Date.now();
  const gunSonu = (gun: number) => new Date(simdi + gun * 86_400_000).toISOString();
  await mount({
    kisiler: [kisi, ikinciKisi],
    kontrolEt: async () => ({ sonuclar: [
      { yayin_id: 'y', kisi_id: 'k', uygun: false, sebep: 'on_bes_gun_araligi', yeniden_gonderilebilir_at: gunSonu(2) },
      { yayin_id: 'y', kisi_id: 'k2', uygun: false, sebep: 'on_bes_gun_araligi', yeniden_gonderilebilir_at: gunSonu(6) },
    ] }),
  }, t);
  await click('Gönderim oluştur →');
  await click('Devam et →');
  const dialog = document.querySelector('[role=dialog]');
  assert.ok(dialog);
  assert.match(dialog.textContent ?? '', /Ali Üye.*⏳ Gönderi için kalan süre: 2 gün/s);
  assert.match(dialog.textContent ?? '', /Ayşe Üye.*⏳ Gönderi için kalan süre: 6 gün/s);
  assert.doesNotMatch(dialog.textContent ?? '', /Önceki veya sonraki gönderim/);
  assert.equal(dialog.querySelectorAll('input[type=checkbox]:disabled').length, 2);
  assert.ok([...dialog.querySelectorAll('span')].some(s => s.textContent?.includes('⏳ Gönderi için kalan süre: 2 gün') && s.className.includes('sm:whitespace-nowrap')));
});

test('çoklu yayın tek kayıt çağrısına gider; yanıtsız denemede işlem anahtarı korunur', async t => {
  const yayinlar = [yayin, { ...yayin, yayin_id: 'y2', urun_adi: 'İkinci' }];
  const sonuc = { sonuclar: yayinlar.map(y => ({ yayin_id: y.yayin_id, kisi_id: 'k', uygun: true, urun_id: 'u', tekrar_durumu: 'ilk_gonderim' })), haftalik_ozet: [{ kisi_id: 'k', urun_id: 'u', haftalik_kalan: 1 }], uygun_tarihler: [] };
  const kayitlar: unknown[][] = []; let tamam = 0;
  await mount({ yayinlar, kontrolEt: async () => sonuc, kaydet: async (...args: unknown[]) => { kayitlar.push(args); return kayitlar.length === 1 ? null : { ...sonuc, mesaj: '2 yayın gönderildi.', gonderilen_sayisi: 2, planlanan_sayisi: 0, atlanan: [] }; }, onBasarili: () => { tamam++; } }, t);
  await click('Gönderim oluştur →');
  await click('Devam et →');
  await act(async () => (document.querySelector('input[type=checkbox]') as HTMLInputElement).click());
  await click('Özeti göster →');
  assert.match(document.querySelector('[role=dialog]')?.textContent ?? '', /2 kayıt/);
  assert.equal(kayitlar.length, 0);
  await click('Gönderimi oluştur');
  assert.equal(kayitlar.length, 1);
  await click('Gönderimi oluştur');
  assert.equal(kayitlar.length, 2);
  assert.deepEqual(kayitlar[0][0], ['y', 'y2']);
  assert.equal(kayitlar[0][3], kayitlar[1][3]);
  assert.equal(tamam, 1);
  assert.match(document.body.textContent ?? '', /2 yayın gönderildi/);
});
