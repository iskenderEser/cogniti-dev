"use client";

import { useState } from "react";
import styles from "../admin.module.css";

export default function DavetDugmesi({
  id,
  engel,
  onGonderildi,
  onHata,
}: {
  id?: string;
  engel?: string;
  onGonderildi: () => void;
  onHata?: (mesaj: string) => void;
}) {
  const [bekliyor, beklet] = useState(false);
  const [gonderildi, gonderildiYaz] = useState(false);
  async function davetGonder() {
    if (bekliyor) return;
    if (engel || !id || gonderildi) {
      onHata?.(engel || (gonderildi ? "Bu başvuru için davet gönderildi." : "Davet göndermek için bir başvuru kaydı gerekli."));
      return;
    }
    beklet(true);
    try {
      const yanit = await fetch("/admin/api/uyelik-basvurulari", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
      });
      if (!yanit.ok) throw new Error((await yanit.json()).hata || "Davet gönderilemedi.");
      gonderildiYaz(true);
      onGonderildi();
    } catch (error) {
      onHata?.(error instanceof Error ? error.message : "Davet gönderilemedi.");
    } finally {
      beklet(false);
    }
  }
  const pasif = Boolean(engel || !id || gonderildi || bekliyor);
  return (
    <button type="button" className={styles.button} disabled={pasif} aria-busy={bekliyor} onClick={() => void davetGonder()}>
      Onayla ve Davet Gönder
    </button>
  );
}
