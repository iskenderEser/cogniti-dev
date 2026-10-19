export type Dikdortgen = { left: number; top: number; width: number; height: number };
export type Nokta = { x: number; y: number };

const sinirla = (deger: number, alt: number, ust: number) => Math.max(alt, Math.min(deger, ust));

/** Sabit katmandaki avatar ve balon, hedefi kapatmadan ekran içinde kalır. */
export function rehberKonumu(hedef: Dikdortgen, ekran: { width: number; height: number }, balonYukseklik = 270) {
  const bosluk = 16;
  let avatarYukseklik = Math.min(240, ekran.height * 0.34);
  let avatarGenislik = avatarYukseklik / 2;
  const sag = hedef.left + hedef.width;
  const solUygun = hedef.left - avatarGenislik - 28 >= bosluk;
  const sagUygun = sag + avatarGenislik + 28 <= ekran.width - bosluk;
  const solda = solUygun || !sagUygun;
  const x = sinirla(solda ? hedef.left - avatarGenislik - 28 : sag + 28, bosluk, ekran.width - avatarGenislik - bosluk);
  let y = sinirla(hedef.top + hedef.height / 2 - avatarYukseklik * 0.42, 90, ekran.height - avatarYukseklik - 24);
  const balonGenislik = Math.min(260, ekran.width - 32);
  const aralik = 12;

  // Balonu ekran kenarına sıkıştırmak avatarın üstüne bindiriyordu.
  // Önce avatarın gerçekten boş olan yanını, sığmazsa ayrı bir dikey alanı kullan.
  const soldaBalonYeri = x - aralik - balonGenislik >= bosluk;
  const sagdaBalonYeri = x + avatarGenislik + aralik + balonGenislik <= ekran.width - bosluk;
  let balonX: number;
  let balonY: number;
  if (soldaBalonYeri || sagdaBalonYeri) {
    balonX = soldaBalonYeri && (solda || !sagdaBalonYeri)
      ? x - aralik - balonGenislik
      : x + avatarGenislik + aralik;
    balonY = sinirla(y, bosluk, ekran.height - balonYukseklik - bosluk);
  } else {
    balonX = sinirla(x, bosluk, ekran.width - balonGenislik - bosluk);
    balonY = Math.max(bosluk, ekran.height - balonYukseklik - bosluk);
    avatarYukseklik = Math.min(avatarYukseklik, Math.max(0, balonY - aralik - bosluk));
    avatarGenislik = avatarYukseklik / 2;
    y = sinirla(y, bosluk, balonY - aralik - avatarYukseklik);
  }

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
