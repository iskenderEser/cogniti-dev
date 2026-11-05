import styles from "../admin.module.css";

const BASLIKLAR = [
  "ID",
  "Eğitim Adı",
  "Sipariş Tarihi",
  "Satın Alma Bedeli",
  "Cogniti Hizmet Bedeli (%15)",
  "Ödenecek Tutar",
  "KDV",
  "KDV’li Ödenecek Tutar",
  "Ödeme Günü",
];

export default function PartnerHakEdisleri() {
  return <div className={styles.tableWrap}>
    <table className={styles.table} aria-label="Partner Hak Edişleri">
      <thead><tr>{BASLIKLAR.map(baslik => <th key={baslik} scope="col">{baslik}</th>)}</tr></thead>
      <tbody><tr><td colSpan={BASLIKLAR.length}>Henüz hak ediş kaydı bulunmuyor.</td></tr></tbody>
    </table>
  </div>;
}
