"use client";

import { useEffect, useRef } from "react";
import { eclubHoykRengi } from "@/lib/eclub/hoykSureCercevesi";

const TOPLAM_GUN = 15;
const CIZGI_KALINLIGI = 3.5;
const KENAR = CIZGI_KALINLIGI / 2;
const KART_YARICAPI = 12;

function sinirla(deger: number, alt: number, ust: number): number {
  return Math.max(alt, Math.min(ust, deger));
}

function cerceveNoktasi(uzaklik: number, genislik: number, yukseklik: number): [number, number] {
  const kenar = KENAR;
  const yaricap = Math.min(KART_YARICAPI + KENAR, (genislik - 2 * kenar) / 2, (yukseklik - 2 * kenar) / 2);
  const sag = genislik - kenar;
  const alt = yukseklik - kenar;
  const yatay = genislik - 2 * kenar - 2 * yaricap;
  const dikey = yukseklik - 2 * kenar - 2 * yaricap;
  const ceyrekYay = Math.PI * yaricap / 2;
  let kalan = uzaklik;

  if (kalan <= yatay) return [kenar + yaricap + kalan, kenar];
  kalan -= yatay;
  if (kalan <= ceyrekYay) {
    const aci = -Math.PI / 2 + kalan / yaricap;
    return [sag - yaricap + yaricap * Math.cos(aci), kenar + yaricap + yaricap * Math.sin(aci)];
  }
  kalan -= ceyrekYay;
  if (kalan <= dikey) return [sag, kenar + yaricap + kalan];
  kalan -= dikey;
  if (kalan <= ceyrekYay) {
    const aci = kalan / yaricap;
    return [sag - yaricap + yaricap * Math.cos(aci), alt - yaricap + yaricap * Math.sin(aci)];
  }
  kalan -= ceyrekYay;
  if (kalan <= yatay) return [sag - yaricap - kalan, alt];
  kalan -= yatay;
  if (kalan <= ceyrekYay) {
    const aci = Math.PI / 2 + kalan / yaricap;
    return [kenar + yaricap + yaricap * Math.cos(aci), alt - yaricap + yaricap * Math.sin(aci)];
  }
  kalan -= ceyrekYay;
  if (kalan <= dikey) return [kenar, alt - yaricap - kalan];
  kalan -= dikey;
  const aci = Math.PI + kalan / yaricap;
  return [kenar + yaricap + yaricap * Math.cos(aci), kenar + yaricap + yaricap * Math.sin(aci)];
}

function ciz(canvas: HTMLCanvasElement, gun: number, kirmizilasma: number): void {
  const baglam = canvas.getContext("2d");
  const genislik = canvas.clientWidth;
  const yukseklik = canvas.clientHeight;
  if (!baglam || genislik < 30 || yukseklik < 30) return;

  const kenar = KENAR;
  const yaricap = Math.min(KART_YARICAPI + KENAR, (genislik - 2 * kenar) / 2, (yukseklik - 2 * kenar) / 2);
  const toplam = 2 * (genislik + yukseklik - 4 * kenar - 4 * yaricap) + 2 * Math.PI * yaricap;
  const gorunen = toplam * sinirla(gun / TOPLAM_GUN, 0, 1);
  baglam.clearRect(0, 0, genislik, yukseklik);
  baglam.lineWidth = CIZGI_KALINLIGI;
  baglam.lineCap = "round";
  baglam.lineJoin = "round";

  for (let baslangic = 0; baslangic < gorunen; baslangic += 1) {
    const bitis = Math.min(baslangic + 1, gorunen);
    const ilk = cerceveNoktasi(baslangic, genislik, yukseklik);
    const son = cerceveNoktasi(bitis, genislik, yukseklik);
    baglam.strokeStyle = eclubHoykRengi((baslangic + bitis) / (2 * toplam), kirmizilasma);
    baglam.beginPath();
    baglam.moveTo(...ilk);
    baglam.lineTo(...son);
    baglam.stroke();
  }
}

export function EclubHoykSureCercevesi({ gecenGun }: { gecenGun: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gorunumRef = useRef({ gun: gecenGun, kirmizilasma: gecenGun >= TOPLAM_GUN ? 1 : 0 });
  const baslatildiRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const boyutlandir = () => {
      const genislik = canvas.clientWidth;
      const yukseklik = canvas.clientHeight;
      if (genislik < 30 || yukseklik < 30) return;
      const oran = window.devicePixelRatio || 1;
      canvas.width = Math.round(genislik * oran);
      canvas.height = Math.round(yukseklik * oran);
      canvas.getContext("2d")?.setTransform(oran, 0, 0, oran, 0, 0);
      ciz(canvas, gorunumRef.current.gun, gorunumRef.current.kirmizilasma);
    };
    const gozlemci = new ResizeObserver(boyutlandir);
    gozlemci.observe(canvas);
    boyutlandir();
    return () => gozlemci.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!baslatildiRef.current) {
      baslatildiRef.current = true;
      ciz(canvas, gorunumRef.current.gun, gorunumRef.current.kirmizilasma);
      return;
    }

    const ilk = gorunumRef.current;
    const baslangic = performance.now();
    let kare = 0;
    const ilerlet = (simdi: number) => {
      const oran = sinirla((simdi - baslangic) / 450, 0, 1);
      const yumusak = 1 - Math.pow(1 - oran, 3);
      gorunumRef.current = {
        gun: ilk.gun + (gecenGun - ilk.gun) * yumusak,
        kirmizilasma: gecenGun === TOPLAM_GUN ? ilk.kirmizilasma : ilk.kirmizilasma * (1 - oran),
      };
      ciz(canvas, gorunumRef.current.gun, gorunumRef.current.kirmizilasma);
      if (oran < 1) {
        kare = requestAnimationFrame(ilerlet);
        return;
      }
      if (gecenGun !== TOPLAM_GUN) return;

      const renkBaslangici = performance.now();
      const kirmizilastir = (an: number) => {
        const renkOrani = sinirla((an - renkBaslangici) / 320, 0, 1);
        gorunumRef.current = { gun: TOPLAM_GUN, kirmizilasma: ilk.kirmizilasma + (1 - ilk.kirmizilasma) * renkOrani };
        ciz(canvas, TOPLAM_GUN, gorunumRef.current.kirmizilasma);
        if (renkOrani < 1) kare = requestAnimationFrame(kirmizilastir);
      };
      kare = requestAnimationFrame(kirmizilastir);
    };
    kare = requestAnimationFrame(ilerlet);
    return () => cancelAnimationFrame(kare);
  }, [gecenGun]);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute -inset-[3.5px] z-10 h-[calc(100%+7px)] w-[calc(100%+7px)]" />;
}
