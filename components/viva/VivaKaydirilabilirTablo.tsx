'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import styles from './viva-detay.module.css';

export default function VivaKaydirilabilirTablo({ children, satirSayisi, etiket, arama = '' }: {
  children: ReactNode; satirSayisi: number; etiket: string; arama?: string;
}) {
  const alan = useRef<HTMLDivElement>(null);
  const kaydirilabilir = satirSayisi > 10;

  useLayoutEffect(() => {
    const kapsayici = alan.current;
    const tablo = kapsayici?.querySelector('table');
    if (!kapsayici || !tablo) return;
    kapsayici.scrollTop = 0;
    if (satirSayisi <= 10) { kapsayici.style.maxHeight = ''; return; }
    const ilkOnSatir = () => Array.from(tablo.querySelectorAll<HTMLTableRowElement>('tbody > tr')).slice(0, 10);
    const boyutlandir = () => {
      const baslik = tablo.tHead?.getBoundingClientRect().height ?? 0;
      const kaydirmaCubugu = kapsayici.offsetHeight - kapsayici.clientHeight;
      const yukseklik = baslik + ilkOnSatir().reduce((toplam, satir) => toplam + satir.getBoundingClientRect().height, 0) + kaydirmaCubugu;
      if (yukseklik > 0) kapsayici.style.maxHeight = `${Math.ceil(yukseklik)}px`;
    };
    const gozlemci = new window.ResizeObserver(boyutlandir);
    const izlemeyiYenile = () => {
      gozlemci.disconnect();
      gozlemci.observe(tablo);
      if (tablo.tHead) gozlemci.observe(tablo.tHead);
      ilkOnSatir().forEach(satir => gozlemci.observe(satir));
      boyutlandir();
    };
    izlemeyiYenile();
    const degisimler = new window.MutationObserver(izlemeyiYenile);
    degisimler.observe(tablo, { childList: true, subtree: true, characterData: true });
    return () => { gozlemci.disconnect(); degisimler.disconnect(); };
  }, [satirSayisi, arama]);

  return <div ref={alan} className={styles.participantTableWrap} data-scrollable={kaydirilabilir || undefined}
    role="region" aria-label={`${etiket} listesi`} tabIndex={kaydirilabilir ? 0 : undefined}>{children}</div>;
}
