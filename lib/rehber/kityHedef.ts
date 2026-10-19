type Hedef = { hedefId: string; hedefSecici?: string };

export function kityHedefiniBul(adim: Hedef): HTMLElement | null {
  if (!adim.hedefSecici) return document.getElementById(adim.hedefId);
  return [...document.querySelectorAll<HTMLElement>(adim.hedefSecici)].find(e => {
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }) ?? null;
}

/** Profil yüklemesi ve mobil çekmece açılışı tamamlanmadan anlatımı başlatma. */
export function kityHedefiniBekle(adim: Hedef, signal: AbortSignal, sure = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    const temizle = () => {
      gozlemci.disconnect();
      clearTimeout(zamanlayici);
      signal.removeEventListener("abort", iptal);
    };
    const iptal = () => { temizle(); reject(new DOMException("Tur kapatıldı.", "AbortError")); };
    const kontrol = () => {
      if (!kityHedefiniBul(adim)) return;
      temizle();
      resolve();
    };
    const gozlemci = new MutationObserver(kontrol);
    const zamanlayici = setTimeout(() => { temizle(); reject(new Error("Turun hedefi yüklenemedi.")); }, sure);
    if (signal.aborted) { iptal(); return; }
    signal.addEventListener("abort", iptal, { once: true });
    gozlemci.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["id", "class", "style"] });
    kontrol();
  });
}
