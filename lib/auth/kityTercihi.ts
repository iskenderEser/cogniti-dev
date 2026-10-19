// Yalnız arayüz tercihi. Rol/yetki hiçbir zaman kullanıcı metadata'sından çözülmez.
export const KITY_GOSTERME_ANAHTARI = "cogniti_kity_turu_gosterme";

interface KityAuth {
  getUser(): Promise<{ data: { user: { id: string; user_metadata: Record<string, unknown> } | null }; error: unknown }>;
  getClaims(): Promise<{ data: { claims: { sub: string; session_id: string } } | null; error: unknown }>;
  updateUser(attributes: { data: Record<string, boolean> }): Promise<{ error: unknown }>;
}

export async function kityHesapDurumunuOku(auth: KityAuth, kullaniciId: string) {
  try {
    const { data, error } = await auth.getUser();
    if (error || !data.user || data.user.id !== kullaniciId) return null;
    const { data: oturum, error: oturumHatasi } = await auth.getClaims();
    if (oturumHatasi || oturum?.claims.sub !== kullaniciId || !oturum.claims.session_id) return null;
    return { gosterme: data.user.user_metadata[KITY_GOSTERME_ANAHTARI] === true, oturumId: oturum.claims.session_id };
  } catch {
    return null;
  }
}

export async function kityTercihiniKaydet(auth: KityAuth, kullaniciId: string, gosterme: boolean): Promise<boolean> {
  try {
    const { data, error } = await auth.getUser();
    if (error || data.user?.id !== kullaniciId) return false;
    const { error: kayitHatasi } = await auth.updateUser({ data: { [KITY_GOSTERME_ANAHTARI]: gosterme } });
    return !kayitHatasi;
  } catch {
    return false;
  }
}

const acilanOturumlar = new Set<string>();

/** JWT session_id yenilenene kadar aynı girişte tur tekrar açılmaz. */
export function kityGirisiniIsaretle(kullaniciId: string, oturumId: string, depo?: Pick<Storage, "getItem" | "setItem">): boolean {
  const anahtar = `cogniti_kity_giris:${kullaniciId}`;
  const bellekAnahtari = `${anahtar}:${oturumId}`;
  if (acilanOturumlar.has(bellekAnahtari)) return false;
  try {
    if (depo?.getItem(anahtar) === oturumId) return false;
    depo?.setItem(anahtar, oturumId);
  } catch {
    // Depolama kapalıysa mevcut sekmede yine yalnız bir kez gösterilir.
  }
  acilanOturumlar.add(bellekAnahtari);
  return true;
}
