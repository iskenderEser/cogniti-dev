import styles from "../admin.module.css";

const BASLIKLAR = [
  "ID",
  "Eğitim Adı",
  "Satış Fiyatı",
  "Satılan Adet",
  "Toplam Satış Fiyatı",
  "Beğeni Sayısı",
  "Favori Sayısı",
];

export default function PartnerRaporlari() {
  return <div className={styles.tableWrap}>
    <table className={styles.table} aria-label="Partner Eğitim Raporları">
      <thead><tr>{BASLIKLAR.map(baslik => <th key={baslik} scope="col">{baslik}</th>)}</tr></thead>
      <tbody><tr><td colSpan={BASLIKLAR.length}>Henüz rapor kaydı bulunmuyor.</td></tr></tbody>
    </table>
  </div>;
}
