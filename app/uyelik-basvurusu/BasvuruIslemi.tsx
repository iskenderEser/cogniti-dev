"use client";

import { useState, type FormEvent } from "react";
import { Check, Eye, EyeOff, UserCheck } from "lucide-react";
import styles from "@/app/admin/admin.module.css";
import { SIFRE_KURAL_ACIKLAMASI, sifreKuralHatasi } from "@/lib/auth/sifreKurali";
import { BASVURU_ALINDI, DAVET_BILGISI } from "./basvuruMesaji";

const FORM_BASLIGI = "Cogniti Üyelik Başvuru Formu";

export default function BasvuruIslemi({ token }: { token: string }) {
  const [tamamlandi, tamamlandiYaz] = useState(false);
  const [hata, hataYaz] = useState("");
  const [bekliyor, beklet] = useState(false);
  const [sifreGoster, setSifreGoster] = useState(false);

  async function gonder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const alanlar = Object.fromEntries(new FormData(form));
    if (!token) {
      const sifreHatasi = sifreKuralHatasi(String(alanlar.sifre ?? ""));
      if (sifreHatasi) {
        hataYaz(sifreHatasi);
        return;
      }
    }
    beklet(true);
    hataYaz("");
    try {
      const yanit = await fetch("/uyelik-basvurusu/api", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...alanlar, islem: token ? "davet" : "basvuru", token }),
      });
      const sonuc = await yanit.json();
      if (!yanit.ok) throw new Error(sonuc.hata);
      if (token) window.location.replace("/kurumsal-uyelik");
      else {
        form.reset();
        tamamlandiYaz(true);
      }
    } catch (error) {
      hataYaz(error instanceof Error ? error.message : "İşlem tamamlanamadı.");
    } finally {
      beklet(false);
    }
  }

  if (tamamlandi) return (
    <div className="grid flex-1 place-items-center">
      <section aria-labelledby="basvuru-basligi" className="w-full max-w-[520px] rounded-[22px] border border-(--tema-cizgi) bg-(--tema-yuzey) px-5 py-9 text-center shadow-[0_14px_40px_rgb(15_23_42/0.06)] sm:px-11 sm:py-14">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-(--tema-kontrol-eylem)/10 text-(--tema-kontrol-eylem)">
          <Check size={26} aria-hidden="true" />
        </div>
        <h1 id="basvuru-basligi" className="mb-4 text-xl text-(--tema-baslik) sm:text-2xl">{FORM_BASLIGI}</h1>
        <p role="status" className="leading-relaxed text-(--tema-ikincil-metin)">
          <strong className="mb-1 block text-(--tema-baslik)">{BASVURU_ALINDI}</strong>
          {DAVET_BILGISI}
        </p>
      </section>
    </div>
  );

  const formIcerigi = (
    <form className="grid gap-4 [&_input::placeholder]:italic" onSubmit={gonder}>
      {!token && <>
        <label className={styles.field}><input className={styles.input} name="firma" aria-label="Firmanızın tam adı" placeholder="Firmanızın tam adı" autoComplete="organization" maxLength={150} required /></label>
        <label className={styles.field}><input className={styles.input} name="web" aria-label="Firma web sitesi" placeholder="Firma web sitesi" inputMode="url" autoComplete="url" maxLength={500} required /></label>
        <label className={styles.field}><input className={styles.input} name="ad" aria-label="Adınız soyadınız" placeholder="Adınız soyadınız" autoComplete="name" maxLength={150} required /></label>
      </>}
      <label className={styles.field}>
        <input className={styles.input} name="eposta" aria-label="Kurumsal e-posta adresiniz" placeholder="Kurumsal e-posta adresiniz" type="email" autoComplete="email" maxLength={254} required />
        {!token && <span className="text-[10px]">Gmail, Hotmail ve benzeri kişisel e-posta adresleri kabul edilmez.</span>}
      </label>
      {!token && <label className={styles.field}><input className={styles.input} name="telefon" aria-label="Cep telefon numaranız" placeholder="Cep telefon numaranız" type="tel" autoComplete="tel" maxLength={30} required /></label>}
      <div className={styles.field}>
        <div className="relative">
          <input className={`${styles.input} pr-11!`} id="basvuru-sifre" name="sifre" aria-label="Giriş şifreniz" placeholder={token ? "Giriş şifreniz" : "Girişte kullanacağınız şifreyi belirleyin"} type={sifreGoster ? "text" : "password"} autoComplete={token ? "current-password" : "new-password"} minLength={8} required />
          <button
            type="button"
            className="absolute inset-y-0 right-1 grid w-10 cursor-pointer place-items-center rounded-md"
            aria-label={sifreGoster ? "Şifreyi gizle" : "Şifreyi göster"}
            aria-controls="basvuru-sifre"
            onClick={() => setSifreGoster((gorunur) => !gorunur)}
          >
            {sifreGoster ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
          </button>
        </div>
        {!token && <span className="text-[10px] font-normal">{SIFRE_KURAL_ACIKLAMASI}</span>}
      </div>
      {hata && <p role="alert" className={token ? "text-xs text-[var(--tema-hata)]" : undefined}>{hata}</p>}
      <div className={token ? "mt-2" : styles.formActions}>
        <button className={`${styles.button} ${styles.primary} ${token ? "w-full justify-center" : ""}`} disabled={bekliyor} type="submit">
          {token ? "Daveti Kabul Et ve Giriş Yap" : "Başvuruyu gönder"}
        </button>
      </div>
    </form>
  );

  if (token) return (
    <div className="grid flex-1 place-items-center">
      <section aria-labelledby="davet-kabul-basligi" className="w-full max-w-[520px] rounded-[22px] border border-(--tema-cizgi) bg-(--tema-yuzey) px-5 py-9 shadow-[0_14px_40px_rgb(15_23_42/0.06)] sm:px-11 sm:py-12">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-(--tema-kontrol-eylem)/10 text-(--tema-kontrol-eylem)">
          <UserCheck size={26} aria-hidden="true" />
        </div>
        <h1 id="davet-kabul-basligi" className="mb-3 text-center text-xl text-(--tema-baslik) sm:text-2xl">Cogniti’ye Hoş Geldiniz</h1>
        <p className="mb-3 text-center text-sm leading-relaxed text-(--tema-ikincil-metin)">
          Ön başvurunuz onaylandı. Kurumsal e-posta adresiniz ve ön başvuruda belirlediğiniz şifrenizle giriş yapabilirsiniz.
        </p>
        <p className="mb-7 text-center text-xs leading-relaxed text-(--tema-ikincil-metin)">
          Girişin ardından firma bilgilerinizi, sözleşmelerinizi ve kurumsal listelerinizi tamamlayacağınız <strong className="font-semibold text-(--tema-baslik)">Kurumsal Üyelik Formu</strong> açılacaktır.
        </p>
        {formIcerigi}
      </section>
    </div>
  );

  return <>
    <h1 className="mb-7 text-xl font-normal">{FORM_BASLIGI}</h1>
    {formIcerigi}
  </>;
}
