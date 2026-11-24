/* Pengaturan BeresKos. Isi sebelum dipasarkan (Tahap 4). */
window.CONFIG = {
  product: "BeresKos",
  /* Nomor WhatsApp tim dengan kode negara, tanpa tanda +. Contoh: "6281234567890" */
  waNumber: "",
  metaPixelId: "",
  ga4Id: "",
  /* Paket langganan. Kuota cucian dan minimal kamar masih asumsi, sesuaikan setelah uji coba. */
  hargaMingguan: 50000,
  kuotaKg: 5,
  minKamar: 5,
  area: "Tembalang, Semarang",
  /* Jadwal tetap mingguan (0 = Minggu, 1 = Senin, ... 6 = Sabtu) */
  jadwal: { jemput: 1, antar: 3, bersih: 6 }
};
