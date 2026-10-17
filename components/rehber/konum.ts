export type Dikdortgen = { left: number; top: number; width: number; height: number };
export type Nokta = { x: number; y: number };

const sinirla = (deger: number, alt: number, ust: number) => Math.max(alt, Math.min(deger, ust));

/** Sabit katmandaki avatar ve balon, hedefi kapatmadan ekran içinde kalır. */
export function rehberKonumu(hedef: Dikdortgen, ekran: { width: number; height: number }, balonYukseklik = 270) {
  const bosluk = 16;
  const avatarYukseklik = Math.min(240, ekran.height * 0.34);
  const avatarGenislik = avatarYukseklik / 2;
  const sag = hedef.left + hedef.width;
  const solUygun = hedef.left - avatarGenislik - 28 >= bosluk;
  const sagUygun = sag + avatarGenislik + 28 <= ekran.width - bosluk;
  const solda = solUygun || !sagUygun;
  const x = sinirla(solda ? hedef.left - avatarGenislik - 28 : sag + 28, bosluk, ekran.width - avatarGenislik - bosluk);
  const y = sinirla(hedef.top + hedef.height / 2 - avatarYukseklik * 0.42, 90, ekran.height - avatarYukseklik - 24);
  const balonGenislik = Math.min(310, ekran.width - 32);

  // Dar ekranda anlatım altta; karakter hedefin yanında görünür kalır.
  const balonX = ekran.width < 700
    ? (ekran.width - balonGenislik) / 2
    : sinirla(solda ? x - balonGenislik - 12 : x + avatarGenislik + 12, bosluk, ekran.width - balonGenislik - bosluk);
  const balonY = ekran.width < 700
    ? Math.max(bosluk, ekran.height - balonYukseklik - 16)
    : sinirla(y - balonYukseklik + 60, 90, ekran.height - balonYukseklik - 16);

  return {
    avatar: { x, y },
    avatarGenislik,
    avatarYukseklik,
    sagaBakiyor: solda,
    balon: { x: balonX, y: balonY, width: balonGenislik },
    hedefNoktasi: {
      x: sinirla(solda ? hedef.left : sag, 12, ekran.width - 12),
      y: sinirla(hedef.top + hedef.height / 2, 12, ekran.height - 12),
    },
  };
}

export function yuruyusSuresi(baslangic: Nokta, bitis: Nokta) {
  return sinirla(Math.hypot(bitis.x - baslangic.x, bitis.y - baslangic.y) * 3.8, 850, 3200);
}

export function rehberMerkezi(ekran: { width: number; height: number }) {
  const yukseklik = Math.min(240, ekran.height * 0.34);
  const genislik = yukseklik / 2;
  return { x: (ekran.width - genislik) / 2, y: (ekran.height - yukseklik) / 2, genislik, yukseklik };
}
