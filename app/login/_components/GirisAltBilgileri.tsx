"use client";

import type { ReactNode } from "react";
import styles from "../login.module.css";
import { Dialog } from "radix-ui";
import { YASAL_METINLER } from "./yasalMetinler";

const BAGLANTI_SINIFI =
  "rounded-sm text-center underline-offset-4 hover:text-[var(--tema-yerel-giris-yardimci-metin-01)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--tema-yerel-giris-odak-01)]";

export default function GirisAltBilgileri({ gorunum }: { gorunum?: ReactNode }) {
  return (
    <footer className={styles.footer}>
      <section aria-label="Sözleşmeler ve şirket bilgileri" className={styles.footerRow}>
          <ul aria-label="Sözleşmeler" className={styles.legalLinks}>
            {YASAL_METINLER.map((metin) => (
              <li key={metin.baslik}>
                <Dialog.Root>
                  <Dialog.Trigger asChild>
                    <button type="button" className={`${BAGLANTI_SINIFI} whitespace-nowrap`}>
                      {metin.baslik}
                    </button>
                  </Dialog.Trigger>
                  <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--tema-yerel-giris-ortu-01)]/30" />
                    <Dialog.Content
                      aria-describedby={undefined}
                      className="fixed left-1/2 top-1/2 z-50 flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-[var(--tema-yerel-giris-kart-01)] text-[var(--tema-yerel-giris-ana-metin-01)] shadow-xl"
                      style={{ fontFamily: "'Nunito', sans-serif" }}
                    >
                      <div className="flex items-center justify-between gap-4 border-b border-[var(--tema-yerel-giris-cizgi-01)] px-6 py-4">
                        <Dialog.Title className="m-0 text-[13px] font-semibold leading-[18px]">
                          {metin.baslik}
                        </Dialog.Title>
                        <Dialog.Close
                          aria-label="Kapat"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl text-[var(--tema-yerel-giris-yardimci-metin-02)] hover:bg-[var(--tema-yerel-giris-sayfa-zemini-01)] hover:text-[var(--tema-yerel-giris-ana-metin-01)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tema-yerel-giris-odak-01)]"
                        >
                          <span aria-hidden="true">×</span>
                        </Dialog.Close>
                      </div>
                      <article className="min-h-48 overflow-y-auto px-6 py-5 text-left text-[10px] leading-[16px] text-[var(--tema-yerel-giris-ana-metin-01)]">
                        {metin.bolumler.map((bolum, bolumSirasi) => (
                          <section
                            key={bolum.baslik ?? `${metin.baslik}-${bolumSirasi}`}
                            className={bolumSirasi === 0 ? "" : "mt-6"}
                          >
                            {bolum.baslik && (
                              <h3 className="mb-2 text-[12px] font-bold leading-[17px] text-[var(--tema-yerel-giris-ana-metin-02)]">
                                {bolum.baslik}
                              </h3>
                            )}
                            <div className="space-y-3">
                              {bolum.paragraflar.map((paragraf) => (
                                <p key={paragraf} className="m-0">
                                  {paragraf}
                                </p>
                              ))}
                            </div>
                          </section>
                        ))}
                      </article>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
              </li>
            ))}
          </ul>

          <address aria-label="Şirket iletişim bilgileri" className={styles.contactLinks}>
            <a
              href="https://www.mill.tr"
              target="_blank"
              rel="noreferrer"
              className={BAGLANTI_SINIFI}
            >
              Mill Danışmanlık
            </a>
            <p className="m-0">
              <span className="block whitespace-nowrap">Göktürk / İstanbul</span>
            </p>
            <a href="mailto:info@mill.tr" className={BAGLANTI_SINIFI}>
              info@mill.tr
            </a>
          </address>
      </section>

      <div className={styles.footerBottom}>
        <p className={styles.copyright}>© 2026 Cogniti · Tüm hakları saklıdır.</p>
        {gorunum}
      </div>
    </footer>
  );
}
