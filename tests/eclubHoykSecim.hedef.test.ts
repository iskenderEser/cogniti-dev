import assert from 'node:assert/strict';
import test from 'node:test';
import { Window } from 'happy-dom';
import React, { act } from 'react';

const window = new Window({ url: 'http://localhost' });
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'HTMLButtonElement', 'MutationObserver', 'Event', 'MouseEvent', 'getComputedStyle']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: key === 'getComputedStyle' ? window[key].bind(window) : window[key] });
}
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const { createRoot } = await import('react-dom/client');
const { EclubYayinGonderimKarti } = await import('../app/(panel)/eclub/yayinlar/_components/EclubYayinGonderimKarti');
const yayin = { yayin_id: 'y', urun_adi: 'Örnek Ürün', firma_adi: 'Örnek Firma', talep_no: 12, arac_turu: 'video', hedef_roller: ['eczaci'], gonderim_incelemesi_tamamlandi: true, cek_karsiligi_var_mi: false, yayin_tarihi: '2026-10-14' };
const temel = { yayin, yeni: true, secili: false, secilebilir: true, gonderilenSayisi: 0, hedefKisiSayisi: 1, gonderilecekGoster: false, gonderimDetayiGoster: false, gonderimDetayiAcik: false, gonderimKayitlari: [], simdi: Date.now(), onGonderimDetayiAc: () => {}, onGonderimDetayiKapat: () => {} };

test('HOYK thumbnail ve bilgi alanları korunurken Önizle ve Seç ayrı eylemlerdir; BM seçemez', async () => {
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container); let onizleme = 0; let secim = 0;
  try {
    await act(async () => root.render(React.createElement(EclubYayinGonderimKarti, { ...temel, onOnizle: () => onizleme++, onSecim: () => secim++ })));
    assert.ok(container.querySelector('[class*=aspect-video]'));
    assert.match(container.textContent ?? '', /Çeksiz Puan · Yalnız lig/);
    const kimlik = [...container.querySelectorAll('span')].find(s => s.textContent === 'Örnek Firma_12');
    assert.ok(kimlik);
    assert.match(kimlik.parentElement?.textContent ?? '', /14\.10\.2026.*Örnek Firma_12/);
    const buttons = [...container.querySelectorAll('button')];
    const preview = buttons.find(b => b.textContent?.trim() === 'Önizle');
    const select = buttons.find(b => b.textContent?.trim() === 'Seç');
    assert.ok(preview); assert.ok(select);
    await act(async () => select.click());
    assert.equal(secim, 1); assert.equal(onizleme, 0);
    await act(async () => preview.click());
    assert.equal(secim, 1); assert.equal(onizleme, 1);
    await act(async () => root.render(React.createElement(EclubYayinGonderimKarti, { ...temel, secimGoster: false, onOnizle: () => onizleme++, onSecim: () => secim++ })));
    assert.equal([...container.querySelectorAll('button')].some(b => b.textContent?.trim() === 'Seç'), false);
  } finally { await act(async () => root.unmount()); container.remove(); }
});
