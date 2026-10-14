import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import EclubPlanlananlar from '../app/(panel)/eclub/yayinlar/_components/EclubPlanlananlar';

const plan = { plan_id: 'p1', kisi_id: 'k1', yayin_id: 'y1', urun_id: 'u1', hedef_gonderim_tarihi: '2026-10-16', durum: 'bekliyor', oneri_id: null, gerceklesti_at: null, son_hata_kodu: null, created_at: '2026-10-14', kisi_ad: 'Ali', kisi_soyad: 'Üye', kisi_rol: 'eczaci', urun_adi: 'Örnek Yayın', firma_adi: 'Örnek Firma', talep_no: 12, hedef_roller: ['eczaci'], arac_turu: 'video' };
const kisi = { kisi_id: 'k1', ad: 'Ali', soyad: 'Üye', rol: 'eczaci', eczane_adi: 'Merkez Eczanesi', aktif_mi: true, auth_user_id: 'a' };

test('planlanan gönderimler yayın, gün ve eczaneye göre tek taranabilir satırda toplanır', () => {
  const html = renderToStaticMarkup(React.createElement(EclubPlanlananlar, { planlar: [plan, { ...plan, plan_id: 'p2', kisi_id: 'k2', kisi_ad: 'Ayşe' }], kisiler: [kisi, { ...kisi, kisi_id: 'k2', ad: 'Ayşe' }] }));
  assert.equal((html.match(/<details/g) ?? []).length, 1);
  assert.match(html, /2 kişi/);
  assert.match(html, /Merkez Eczanesi/);
  assert.match(html, /Ali Üye/);
  assert.match(html, /Ayşe Üye/);
});
