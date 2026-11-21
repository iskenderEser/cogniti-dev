"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BOLIS_RENGI, type BolisYayinAraci } from "@/lib/bolis/tipler";

const ACCEPT_HARITASI: Partial<Record<BolisYayinAraci, string>> = {
  video: "video/mp4,video/webm,video/quicktime",
  podcast: "audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/aac,.mp3,.m4a,.wav",
  gorsel: "image/png,image/jpeg,image/webp",
  flip_pdf: "application/pdf,.pdf",
};

const ACIKLAMA_HARITASI: Partial<Record<BolisYayinAraci, string>> = {
  video: "MP4, WebM veya MOV video dosyası",
  podcast: "MP3, M4A veya WAV ses dosyası",
  gorsel: "PNG, JPG veya WebP görsel dosyası",
  flip_pdf: "PDF doküman dosyası",
};

export function BolisMedyaYukleyici({
  arac,
  mevcutBaslik,
  mevcutDeger,
  onYuklendi,
  onTemizle,
}: {
  arac: Exclude<BolisYayinAraci, "yayin_yok">;
  mevcutBaslik: string;
  mevcutDeger: string;
  onYuklendi: (sonuc: { deger: string; baslik: string }) => void;
  onTemizle: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [yuzde, setYuzde] = useState(0);
  const [hata, setHata] = useState("");

  const videoYukle = async (dosya: File) => {
    setYukleniyor(true);
    setYuzde(0);
    setHata("");
    try {
      const r = await fetch("/bolis/api/medya/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dosya_adi: dosya.name,
          mime_type: dosya.type || "video/mp4",
          dosya_boyutu: dosya.size,
        }),
      });
      const d = await r.json();
      if (!r.ok || !d.video_guid) {
        setHata(d.hata ?? "Video yükleme başlatılamadı.");
        setYukleniyor(false);
        return;
      }

      const tus = await import("tus-js-client");
      await new Promise<void>((resolve, reject) => {
        const upload = new tus.Upload(dosya, {
          endpoint: d.tus_endpoint,
          retryDelays: [0, 1500, 3000],
          headers: {
            AuthorizationSignature: d.imza,
            AuthorizationExpire: String(d.son_kullanma),
            VideoId: d.video_guid,
            LibraryId: String(d.library_id),
          },
          metadata: {
            filetype: dosya.type || "video/mp4",
            title: d.baslik,
          },
          onError: (err) => reject(err),
          onProgress: (yuklenen, toplam) => {
            if (toplam > 0) setYuzde(Math.round((yuklenen / toplam) * 100));
          },
          onSuccess: () => resolve(),
        });
        upload.start();
      });

      onYuklendi({ deger: d.video_guid as string, baslik: dosya.name });
    } catch {
      setHata("Video yüklemesi tamamlanamadı. Lütfen yeniden deneyin.");
    } finally {
      setYukleniyor(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const statikDosyaYukle = async (dosya: File) => {
    setYukleniyor(true);
    setYuzde(30);
    setHata("");
    try {
      const fd = new FormData();
      fd.append("arac_turu", arac);
      fd.append("dosya", dosya);
      const r = await fetch("/bolis/api/medya/dosya", {
        method: "POST",
        body: fd,
      });
      const d = await r.json();
      if (!r.ok || !d.dosya_yolu) {
        setHata(d.hata ?? "Dosya yüklenemedi.");
        return;
      }
      setYuzde(100);
      onYuklendi({ deger: d.dosya_yolu as string, baslik: d.dosya_adi || dosya.name });
    } catch {
      setHata("Dosya yüklenemedi.");
    } finally {
      setYukleniyor(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const dosyaSecildi = (dosya: File) => {
    if (arac === "video") {
      void videoYukle(dosya);
    } else {
      void statikDosyaYukle(dosya);
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-yuzey)] p-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-[var(--tema-baslik)]">
            Bu Sınav İçin Yeni Dosya Yükle
          </div>
          <div className="text-[11px] text-[var(--tema-ikincil-metin)]">
            {ACIKLAMA_HARITASI[arac]}
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={yukleniyor}
          className="h-8 gap-1.5 text-xs"
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={13} aria-hidden="true" />
          {yukleniyor ? `Yükleniyor (%${yuzde})` : "Dosya Seç ve Yükle"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_HARITASI[arac]}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) dosyaSecildi(f);
          }}
        />
      </div>

      {yukleniyor && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--tema-cizgi)]">
          <div
            className="h-full transition-all duration-200"
            style={{ width: `${Math.max(8, yuzde)}%`, backgroundColor: BOLIS_RENGI }}
          />
        </div>
      )}

      {mevcutDeger && !yukleniyor && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <span className="inline-flex min-w-0 items-center gap-1.5 font-medium">
            <CheckCircle2 size={14} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{mevcutBaslik || mevcutDeger}</span>
          </span>
          <button
            type="button"
            aria-label="Yüklenen yayını kaldır"
            onClick={onTemizle}
            className="border-0 bg-transparent p-0.5 text-emerald-700 hover:text-red-600 cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {hata && (
        <p role="alert" className="m-0 text-xs font-medium text-red-700">
          {hata}
        </p>
      )}
    </div>
  );
}
