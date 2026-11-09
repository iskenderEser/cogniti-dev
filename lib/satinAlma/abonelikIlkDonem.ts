export function abonelikIlkDonem(baslangic: string, aylikToken: number, aylikKurus: number) {
  const [yil, ay, gun] = baslangic.split("-").map(Number);
  const kalanGun = Math.min(30, new Date(Date.UTC(yil, ay, 0)).getUTCDate() - gun + 1);
  const oranla = (miktar: number) => Number((BigInt(miktar) * BigInt(kalanGun) + BigInt(15)) / BigInt(30));
  const kurus = oranla(aylikKurus);
  return { kalanGun, token: oranla(aylikToken), kurus, kdvKurus: Math.round(kurus / 5) };
}
