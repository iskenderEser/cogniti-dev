// components/hapbi/HapbiChatModal.tsx
//
// bi platform rehberi ve basit veri soruları için sohbet paneli.

"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Minus, RotateCcw, X } from "lucide-react";
import { useHapbi } from "./HapbiProvider";

function isMobilCihaz(): boolean {
  if (typeof window === "undefined") return false;
  if (window.innerWidth < 768) return true;
  return /iPhone|iPod|Android.+Mobile|Mobile.+Android/i.test(navigator.userAgent);
}

type ChatKonumu = { x: number; y: number };
type ChatEkrani = "tablet" | "masaustu";

const CHAT_GENISLIGI = 380;
const CHAT_YUKSEKLIGI = 530;
const CHAT_KENARI = 12;
const CHAT_KONUM_ANAHTARI = "hapbilgi:bi-chat-konumu:v1";

const chatSuruklenebilirMi = () => !isMobilCihaz();
const chatEkraniniBul = (): ChatEkrani => window.innerWidth < 1024 ? "tablet" : "masaustu";

const chatBoyutlariniBul = () => ({
  genislik: Math.min(CHAT_GENISLIGI, window.innerWidth - CHAT_KENARI * 2),
  yukseklik: Math.min(CHAT_YUKSEKLIGI, window.innerHeight * 0.8),
});

const chatKonumunuSinirla = (konum: ChatKonumu): ChatKonumu => {
  const { genislik, yukseklik } = chatBoyutlariniBul();
  return {
    x: Math.min(Math.max(CHAT_KENARI, konum.x), Math.max(CHAT_KENARI, window.innerWidth - genislik - CHAT_KENARI)),
    y: Math.min(Math.max(CHAT_KENARI, konum.y), Math.max(CHAT_KENARI, window.innerHeight - yukseklik - CHAT_KENARI)),
  };
};

function renderHapbiMetin(metin: string, isUser = false, onLinkClick?: (url: string) => void): React.ReactNode {
  // Regex to match:
  // 1. Bold: \*\*([^*]+)\*\*
  // 2. Italic: \*([^*]+)\*
  // 3. Markdown Link: \[([^\]]+)\]\(([^)]+)\)
  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  const nodes: React.ReactNode[] = [];
  let match: RegExpExecArray | null;
  let keyIndex = 0;

  while ((match = regex.exec(metin)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(metin.slice(lastIndex, match.index));
    }
    if (match[2] !== undefined) {
      // Bold
      nodes.push(
        <strong key={`b-${keyIndex++}`} className={`font-bold ${isUser ? "text-[var(--tema-yerel-ortak-sayfa-ters-metin-01)]" : "text-[var(--tema-yerel-ortak-sayfa-ana-metin-07)]"}`}>
          {renderHapbiMetin(match[2], isUser, onLinkClick)}
        </strong>
      );
    } else if (match[3] !== undefined) {
      // Italic
      nodes.push(
        <em key={`i-${keyIndex++}`} className="italic">
          {renderHapbiMetin(match[3], isUser, onLinkClick)}
        </em>
      );
    } else if (match[4] !== undefined && match[5] !== undefined) {
      // Markdown Link
      const linkText = match[4];
      let linkUrl = match[5];
      // Eğer kendi domainimizse göreceli URL'e çevir
      try {
        if (linkUrl.startsWith("http")) {
          const u = new URL(linkUrl);
          if (u.hostname.includes("hapbilgi") || u.hostname === "localhost") {
            linkUrl = u.pathname + u.search + u.hash;
          }
        }
      } catch {}

      const isExternal = linkUrl.startsWith("http");

      nodes.push(
        isExternal ? (
          <a
            key={`l-${keyIndex++}`}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onLinkClick?.(linkUrl)}
            className={`${
              isUser
                ? "text-[var(--tema-yerel-ortak-sayfa-ters-metin-01)] underline font-bold hover:opacity-80"
                : "text-[var(--tema-yerel-ortak-sayfa-eylem-metin-04)] font-bold underline underline-offset-2 hover:text-[var(--tema-yerel-ortak-sayfa-ana-metin-12)]"
            } transition-colors cursor-pointer`}
          >
            {linkText}
          </a>
        ) : (
          <button
            key={`l-${keyIndex++}`}
            type="button"
            onClick={() => onLinkClick?.(linkUrl)}
            className={`${
              isUser
                ? "text-[var(--tema-yerel-ortak-sayfa-ters-metin-01)] underline font-bold hover:opacity-80"
                : "text-[var(--tema-yerel-ortak-sayfa-eylem-metin-04)] font-bold underline underline-offset-2 hover:text-[var(--tema-yerel-ortak-sayfa-ana-metin-12)]"
            } transition-colors cursor-pointer text-left inline p-0 bg-transparent border-none align-baseline`}
          >
            {linkText}
          </button>
        )
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < metin.length) {
    nodes.push(metin.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : metin;
}

export default function HapbiChatModal() {
  const { chatAcik, setChatAcik, mesajlar, yukleniyor, soruSor, temizle } = useHapbi();
  const router = useRouter();
  const pathname = usePathname();
  const oncekiPathRef = useRef(pathname);
  const [girdi, setGirdi] = useState("");
  const mesajlarSonRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [suruklenebilir, setSuruklenebilir] = useState(false);
  const [surukleniyor, setSurukleniyor] = useState(false);
  const [chatKonumu, setChatKonumu] = useState<ChatKonumu | null>(null);
  const chatKonumuRef = useRef<ChatKonumu | null>(null);
  const chatEkraniRef = useRef<ChatEkrani | null>(null);
  const suruklemeRef = useRef<{
    pointerId: number;
    baslangicX: number;
    baslangicY: number;
    ilkKonum: ChatKonumu;
  } | null>(null);

  const chatKonumunuAyarla = (konum: ChatKonumu | null) => {
    chatKonumuRef.current = konum;
    setChatKonumu(konum);
  };

  useEffect(() => {
    const ekranDurumunuGuncelle = () => {
      const hareketli = chatSuruklenebilirMi();
      setSuruklenebilir(hareketli);
      if (!hareketli) {
        chatEkraniRef.current = null;
        chatKonumunuAyarla(null);
      }
    };
    ekranDurumunuGuncelle();
    window.addEventListener("resize", ekranDurumunuGuncelle);
    return () => window.removeEventListener("resize", ekranDurumunuGuncelle);
  }, []);

  useEffect(() => {
    if (!chatAcik || !suruklenebilir) return;

    const konumuYukle = () => {
      const ekran = chatEkraniniBul();
      chatEkraniRef.current = ekran;
      try {
        const kayit = window.localStorage.getItem(`${CHAT_KONUM_ANAHTARI}:${ekran}`);
        if (kayit) {
          const parsed = JSON.parse(kayit) as Partial<ChatKonumu>;
          if (typeof parsed.x === "number" && typeof parsed.y === "number") {
            chatKonumunuAyarla(chatKonumunuSinirla({ x: parsed.x, y: parsed.y }));
            return;
          }
        }
      } catch {
        // Geçersiz veya erişilemeyen kayıt varsa maskotun yanındaki varsayılan konum kullanılır.
      }

      const maskot = document.querySelector<HTMLElement>("[data-hapbi-maskot]");
      const maskotRect = maskot?.getBoundingClientRect();
      const { genislik, yukseklik } = chatBoyutlariniBul();
      if (maskotRect) {
        const soldaX = maskotRect.left - genislik - 12;
        const sagdaX = maskotRect.right + 12;
        chatKonumunuAyarla(chatKonumunuSinirla({
          x: soldaX >= CHAT_KENARI ? soldaX : sagdaX,
          y: maskotRect.bottom - yukseklik,
        }));
        return;
      }
      chatKonumunuAyarla(chatKonumunuSinirla({
        x: window.innerWidth - genislik - 24,
        y: window.innerHeight - yukseklik - 24,
      }));
    };

    const yenidenBoyutlandir = () => {
      if (!chatSuruklenebilirMi()) return;
      const yeniEkran = chatEkraniniBul();
      if (chatEkraniRef.current !== yeniEkran) {
        konumuYukle();
      } else if (chatKonumuRef.current) {
        chatKonumunuAyarla(chatKonumunuSinirla(chatKonumuRef.current));
      }
    };

    konumuYukle();
    window.addEventListener("resize", yenidenBoyutlandir);
    return () => window.removeEventListener("resize", yenidenBoyutlandir);
  }, [chatAcik, suruklenebilir]);

  const chatKonumunuKaydet = (konum: ChatKonumu) => {
    const ekran = chatEkraniRef.current ?? chatEkraniniBul();
    try {
      window.localStorage.setItem(`${CHAT_KONUM_ANAHTARI}:${ekran}`, JSON.stringify(konum));
    } catch {
      // Depolama kapalıysa konum yalnız mevcut sayfa boyunca korunur.
    }
  };

  const chatSuruklemeyiBaslat = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!suruklenebilir || (event.pointerType === "mouse" && event.button !== 0)) return;
    if ((event.target as HTMLElement).closest("button, a, input, select, textarea")) return;
    const rect = modalRef.current?.getBoundingClientRect();
    if (!rect) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    suruklemeRef.current = {
      pointerId: event.pointerId,
      baslangicX: event.clientX,
      baslangicY: event.clientY,
      ilkKonum: { x: rect.left, y: rect.top },
    };
    setSurukleniyor(true);
  };

  const chatSurukle = (event: React.PointerEvent<HTMLDivElement>) => {
    const surukleme = suruklemeRef.current;
    if (!surukleme || surukleme.pointerId !== event.pointerId) return;
    event.preventDefault();
    chatKonumunuAyarla(chatKonumunuSinirla({
      x: surukleme.ilkKonum.x + event.clientX - surukleme.baslangicX,
      y: surukleme.ilkKonum.y + event.clientY - surukleme.baslangicY,
    }));
  };

  const chatSuruklemeyiBitir = (event: React.PointerEvent<HTMLDivElement>) => {
    const surukleme = suruklemeRef.current;
    if (!surukleme || surukleme.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    suruklemeRef.current = null;
    setSurukleniyor(false);
    if (chatKonumuRef.current) chatKonumunuKaydet(chatKonumuRef.current);
  };

  const chatSuruklemeyiIptalEt = (event: React.PointerEvent<HTMLDivElement>) => {
    const surukleme = suruklemeRef.current;
    if (!surukleme || surukleme.pointerId !== event.pointerId) return;
    suruklemeRef.current = null;
    setSurukleniyor(false);
    chatKonumunuAyarla(surukleme.ilkKonum);
  };

  // Otomatik aşağı kaydırma
  useEffect(() => {
    if (chatAcik) {
      mesajlarSonRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [mesajlar, chatAcik]);

  // Sayfa değiştiği an (linke tıklandı veya sayfa değişti): Mobilde chat alanını kesin olarak kapat/aşağı indir
  useEffect(() => {
    if (oncekiPathRef.current !== pathname) {
      oncekiPathRef.current = pathname;
      if (isMobilCihaz()) {
        setChatAcik(false);
      }
    }
  }, [pathname, setChatAcik]);

  if (!chatAcik) return null;

  const handleLinkTikla = (url?: string) => {
    // Mobilde linke tıklanınca hedef sayfanın görünmesi için chat modalı küçültülür/indirilir
    if (isMobilCihaz()) {
      setChatAcik(false);
    }
    if (url) {
      router.push(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!girdi.trim() || yukleniyor) return;
    const soru = girdi;
    setGirdi("");
    soruSor(soru);
  };

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-label="bi sohbeti"
      className="hapbi-modal-container fixed z-50 flex flex-col overflow-hidden bg-[var(--tema-yerel-ortak-sayfa-kart-01)]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-[var(--tema-yerel-ortak-sayfa-islevsel-cizgi-02)] transition-all duration-300"
      style={{
        boxShadow: "0 20px 40px -15px var(--tema-yerel-ortak-sayfa-islevsel-golge-01), 0 0 0 1px var(--tema-yerel-ortak-sayfa-golge-02)",
        fontFamily: "'Nunito', sans-serif",
        ...(suruklenebilir
          ? {
              width: CHAT_GENISLIGI,
              height: CHAT_YUKSEKLIGI,
              maxHeight: "80dvh",
              ...(chatKonumu ? { left: chatKonumu.x, top: chatKonumu.y } : { right: 24, bottom: 24 }),
            }
          : {
              bottom: 12,
              left: 12,
              right: 12,
              marginLeft: "auto",
              marginRight: "auto",
              maxWidth: 360,
              width: "calc(100% - 24px)",
              height: 380,
              maxHeight: "48dvh",
            }),
      }}
    >
      {/* Üst Başlık (Header) */}
      <div
        onPointerDown={chatSuruklemeyiBaslat}
        onPointerMove={chatSurukle}
        onPointerUp={chatSuruklemeyiBitir}
        onPointerCancel={chatSuruklemeyiIptalEt}
        className={`flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-[var(--tema-yerel-ortak-sayfa-islevsel-zemin-14)] via-[var(--tema-yerel-ortak-sayfa-islevsel-zemin-15)] to-[var(--tema-yerel-ortak-sayfa-islevsel-zemin-16)] text-[var(--tema-yerel-ortak-sayfa-ters-metin-01)] select-none flex-shrink-0 ${
          suruklenebilir ? (surukleniyor ? "cursor-grabbing" : "cursor-move") : ""
        }`}
        style={{ touchAction: suruklenebilir ? "none" : "auto" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-full bg-[var(--tema-yerel-ortak-sayfa-kart-01)] flex items-center justify-center shadow-md flex-shrink-0">
            <span className="text-[var(--tema-yerel-ortak-sayfa-islevsel-metin-15)] font-black text-base tracking-tighter lowercase select-none">
              bi
            </span>
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-[var(--tema-yerel-ortak-sayfa-islevsel-zemin-17)] rounded-full border border-[var(--tema-yerel-ortak-sayfa-cizgi-09)]" />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--tema-yerel-ortak-sayfa-ters-metin-01)] font-extrabold tracking-wide leading-none select-none">
            <span>Sor</span>
            <span className="w-1 h-1 rounded-full bg-[var(--tema-yerel-ortak-sayfa-kart-01)]/75 flex-shrink-0" />
            <span>Öğren</span>
            <span className="w-1 h-1 rounded-full bg-[var(--tema-yerel-ortak-sayfa-kart-01)]/75 flex-shrink-0" />
            <span>Değiştir</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setChatAcik(false)}
          title="Sohbeti küçült"
          aria-label="Sohbeti küçült"
          className="w-7 h-7 rounded-full bg-[var(--tema-yerel-ortak-sayfa-kart-01)]/10 hover:bg-[var(--tema-yerel-ortak-sayfa-kart-01)]/25 text-[var(--tema-yerel-ortak-sayfa-ters-metin-01)] flex items-center justify-center cursor-pointer border-none transition-colors"
        >
          <Minus className="w-4 h-4" aria-hidden="true" />
        </button>
        <button type="button" onClick={temizle} title="Yeni sohbet" aria-label="Yeni sohbet" className="w-7 h-7 rounded-full bg-[var(--tema-yerel-ortak-sayfa-kart-01)]/10 hover:bg-[var(--tema-yerel-ortak-sayfa-kart-01)]/25 text-[var(--tema-yerel-ortak-sayfa-ters-metin-01)] flex items-center justify-center cursor-pointer border-none transition-colors"><RotateCcw className="w-4 h-4" aria-hidden="true" /></button>
        <button
          type="button"
          onClick={() => setChatAcik(false)}
          className="w-7 h-7 rounded-full bg-[var(--tema-yerel-ortak-sayfa-kart-01)]/10 hover:bg-[var(--tema-yerel-ortak-sayfa-kart-01)]/25 text-[var(--tema-yerel-ortak-sayfa-ters-metin-01)] flex items-center justify-center cursor-pointer border-none transition-colors"
          title="Kapat"
          aria-label="Sohbeti kapat"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
        </div>
      </div>

      {/* Mesaj Akış Alanı */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 bg-gradient-to-b from-[var(--tema-yerel-ortak-sayfa-islevsel-zemin-18)]/30 to-[var(--tema-yerel-ortak-sayfa-kart-01)]">
        {mesajlar.map((m) => {
          const isUser = m.rol === "user";
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"} gap-1`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed shadow-sm ${
                  isUser
                    ? "bg-[var(--tema-yerel-ortak-sayfa-eylem-zemin-04)] text-[var(--tema-yerel-ortak-sayfa-ters-metin-01)] rounded-br-none"
                    : "bg-[var(--tema-yerel-ortak-sayfa-kart-01)] text-[var(--tema-yerel-ortak-sayfa-ana-metin-13)] border border-[var(--tema-yerel-ortak-sayfa-cizgi-08)] rounded-bl-none shadow-[color:var(--tema-yerel-ortak-sayfa-islevsel-golge-02)]/5"
                }`}
              >
                {m.hata && <span className="block text-[10px] font-bold text-[var(--tema-yerel-ortak-sayfa-islevsel-metin-16)] mb-1">Yanıt alınamadı</span>}
                <div className="whitespace-pre-line font-medium leading-relaxed">
                  {renderHapbiMetin(m.metin, isUser, handleLinkTikla)}
                </div>
                {!!m.yonlendirmeler?.length && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.yonlendirmeler.map((link) => (
                      <button
                        key={link.url}
                        type="button"
                        onClick={() => handleLinkTikla(link.url)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--tema-yerel-ortak-sayfa-secim-zemin-04)]/90 hover:bg-[var(--tema-yerel-ortak-sayfa-secim-zemin-05)] active:bg-[var(--tema-yerel-ortak-sayfa-secim-zemin-06)] border border-[var(--tema-yerel-ortak-sayfa-cizgi-10)]/80 px-3 py-1.5 text-xs font-bold text-[var(--tema-yerel-ortak-sayfa-eylem-metin-04)] shadow-sm hover:text-[var(--tema-yerel-ortak-sayfa-ana-metin-12)] active:scale-95 transition-all cursor-pointer select-none"
                      >
                        <span>{link.etiket}</span>
                        <span className="text-[11px] text-[var(--tema-yerel-ortak-sayfa-eylem-metin-05)] font-normal">↗</span>
                      </button>
                    ))}
                  </div>
                )}
                {!!m.kaynaklar?.length && (
                  <div className="mt-2 flex flex-col gap-1 border-t border-[var(--tema-yerel-ortak-sayfa-cizgi-08)] pt-2">
                    <span className="text-[10px] font-semibold text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-12)]">Başvurulan kaynaklar</span>
                    {m.kaynaklar.map((k) =>
                      k.url ? (
                        <button
                          key={k.id}
                          type="button"
                          onClick={() => handleLinkTikla(k.url)}
                          title={`Okuma zamanı: ${new Date(k.zaman).toLocaleString("tr-TR")}. Sayfada aynı dönemi seçin.`}
                          className="text-[10px] text-[var(--tema-yerel-ortak-sayfa-eylem-metin-04)] hover:underline cursor-pointer text-left p-0 bg-transparent border-none"
                        >
                          {k.baslik}
                          {k.donem ? ` · ${k.donem}` : ""}
                        </button>
                      ) : (
                        <span
                          key={k.id}
                          title={`Okuma zamanı: ${new Date(k.zaman).toLocaleString("tr-TR")}`}
                          className="text-[10px] text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-11)]"
                        >
                          {k.baslik}
                          {k.donem ? ` · ${k.donem}` : ""}
                        </span>
                      )
                    )}
                  </div>
                )}

                {/* Eğer mesajda yönlendirici aksiyon varsa */}
                {m.aksiyon && (
                  <div className="mt-2.5 pt-2 border-t border-[var(--tema-yerel-ortak-sayfa-cizgi-08)]">
                    <button
                      type="button"
                      onClick={() => {
                        if (m.aksiyon?.url) {
                          handleLinkTikla(m.aksiyon.url);
                        }
                      }}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[var(--tema-yerel-ortak-sayfa-islevsel-zemin-14)] to-[var(--tema-yerel-ortak-sayfa-islevsel-zemin-15)] hover:from-[var(--tema-yerel-ortak-sayfa-islevsel-zemin-16)] hover:to-[var(--tema-yerel-ortak-sayfa-islevsel-zemin-19)] active:scale-95 text-[var(--tema-yerel-ortak-sayfa-ters-metin-01)] font-bold text-xs rounded-xl shadow-sm cursor-pointer border-none transition-all duration-200 hover:scale-[1.02]"
                    >
                      <span>{m.aksiyon.etiket}</span>
                    </button>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-12)] px-1 font-semibold">{m.zaman}</span>
            </div>
          );
        })}

        {yukleniyor && (
          <div className="flex items-center gap-2 text-xs text-[var(--tema-yerel-ortak-sayfa-islevsel-metin-15)] font-bold bg-[var(--tema-yerel-ortak-sayfa-islevsel-zemin-18)] px-3 py-2 rounded-xl self-start border border-[var(--tema-yerel-ortak-sayfa-islevsel-cizgi-02)] animate-pulse">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-[var(--tema-yerel-ortak-sayfa-islevsel-cizgi-03)] border-t-transparent animate-spin" />
            <span>bi kontrol ediyor...</span>
          </div>
        )}

        <div ref={mesajlarSonRef} />
      </div>

      {/* Soru Giriş Alanı */}
      <form
        onSubmit={handleSubmit}
        className="px-3 py-2 bg-[var(--tema-yerel-ortak-sayfa-kart-01)] border-t border-[var(--tema-yerel-ortak-sayfa-cizgi-08)] flex items-center gap-2 flex-shrink-0"
      >
        <input
          type="text"
          value={girdi}
          maxLength={2000}
          aria-label="bi'ye sorunuz"
          onChange={(e) => setGirdi(e.target.value)}
          placeholder="Değişimi başlatmak için bi' soru sorun..."
          disabled={yukleniyor}
          className="flex-1 bg-[var(--tema-yerel-ortak-sayfa-sayfa-zemini-06)] border border-[var(--tema-yerel-ortak-sayfa-cizgi-06)] focus:border-[var(--tema-yerel-ortak-sayfa-islevsel-cizgi-03)] focus:bg-[var(--tema-yerel-ortak-sayfa-kart-01)] rounded-xl px-3 py-2 text-xs font-medium text-[var(--tema-yerel-ortak-sayfa-ana-metin-13)] placeholder-[var(--tema-yerel-ortak-sayfa-yardimci-metin-12)] outline-none transition-all"
        />
        <button
          type="submit"
          disabled={!girdi.trim() || yukleniyor}
          className="bg-gradient-to-r from-[var(--tema-yerel-ortak-sayfa-islevsel-zemin-14)] to-[var(--tema-yerel-ortak-sayfa-islevsel-zemin-15)] hover:from-[var(--tema-yerel-ortak-sayfa-islevsel-zemin-16)] hover:to-[var(--tema-yerel-ortak-sayfa-islevsel-zemin-19)] disabled:opacity-40 text-[var(--tema-yerel-ortak-sayfa-ters-metin-01)] font-bold text-xs px-3 py-2 rounded-xl cursor-pointer border-none shadow-sm transition-all flex items-center justify-center"
        >
          Gönder
        </button>
      </form>
    </div>
  );
}
