// app/(panel)/raporlar/uretim/_hooks/useUretimRaporu.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import type { UretimRaporRolu } from '@/lib/rapor/uretim/raporRolu';
import {
  getUretimRaporuOnbellek,
  setUretimRaporuOnbellek,
  type RaporData,
} from './uretimRaporuOnbellek';

interface UseUretimRaporuSonuc {
  data: RaporData | null;
  loading: boolean;
  yenileniyor: boolean;
  error: string | null;
  yenile: () => void;
}

export function useUretimRaporu(
  periyot: string,
  kullaniciId: string | undefined,
  raporRolu: UretimRaporRolu = 'tumu',
): UseUretimRaporuSonuc {
  const anahtar = JSON.stringify([kullaniciId, periyot, raporRolu]);
  const onbellekVerisi = getUretimRaporuOnbellek(periyot, kullaniciId, raporRolu);
  const [veri, setVeri] = useState<{ anahtar: string; data: RaporData | null }>(() => ({ anahtar, data: onbellekVerisi }));
  const data = veri.anahtar === anahtar ? veri.data : onbellekVerisi;
  const [yenilenenAnahtar, setYenilenenAnahtar] = useState<string | null>(null);
  const [hata, setHata] = useState<{ anahtar: string; mesaj: string } | null>(null);
  const error = hata?.anahtar === anahtar ? hata.mesaj : null;
  const [yenileTetik, setYenileTetik] = useState(0);
  const manuelTetiklendiRef = useRef(false);

  const yenile = useCallback(() => {
    manuelTetiklendiRef.current = true;
    setYenileTetik((deger) => deger + 1);
  }, []);

  useEffect(() => {
    if (!kullaniciId) return;

    const controller = new AbortController();
    const isManuel = manuelTetiklendiRef.current;
    manuelTetiklendiRef.current = false;

    const fetchRapor = async () => {
      const onbellek = getUretimRaporuOnbellek(periyot, kullaniciId, raporRolu);
      if (isManuel) setYenilenenAnahtar(anahtar);
      setHata(null);

      try {
        const res = await fetch(`/raporlar/api/uretim?periyot=${periyot}&rapor_rolu=${raporRolu}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (controller.signal.aborted) return;
        if (res.ok && json.success && json.data) {
          const rapor = json.data as RaporData;
          setUretimRaporuOnbellek(periyot, kullaniciId, rapor, raporRolu);
          setVeri({ anahtar, data: rapor });
          setHata(null);
        } else if (!onbellek) {
          setHata({ anahtar, mesaj: json.hata || json.error || 'Veri alınamadı' });
        }
      } catch (err: unknown) {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return;
        if (!onbellek) setHata({ anahtar, mesaj: 'Bağlantı hatası' });
      } finally {
        if (!controller.signal.aborted) {
          setYenilenenAnahtar((mevcut) => mevcut === anahtar ? null : mevcut);
        }
      }
    };

    void fetchRapor();

    return () => {
      controller.abort();
    };
  }, [anahtar, periyot, kullaniciId, raporRolu, yenileTetik]);

  return {
    data,
    loading: !data && !error,
    yenileniyor: yenilenenAnahtar === anahtar,
    error,
    yenile,
  };
}
