# Project Lab Pemrograman: Kelompok 7

Repositori project kelompok mata kuliah Lab Pemrograman. Project ini mencari masalah nyata di sekitar kita, mengubahnya menjadi produk startup teknologi, memasarkannya, lalu memilih satu produk terbaik berdasarkan return iklan (ROAS) untuk UAS.

## Dokumen Progres

Seluruh progres ditulis dan diperbarui di Google Docs:

**[Project Lab Pemrograman Kelompok 7 (Google Docs)](https://docs.google.com/document/d/16aSvFR3YMYhze5wWnqOkAYhEtFiXd0POj03iUIaPNCU/edit?usp=sharing)**

Tahap 1 ada di tab "Tab 1", Tahap 2 di tab "Tahap 2", dan Tahap 3 di tab "Tahap 3".

## Anggota

- Abrar Mohammad Fathur
- Della Selviana
- Intan Dyah Larasati
- Muhammad Dezra Aria
- Yohanes Bosco Krishna K.

## Tahapan dan Progres

| Tahap | Kegiatan | Status |
|---|---|---|
| 1 | Mengumpulkan 50 permasalahan bisnis beserta data pendukung | Selesai |
| 2 | Analisis kelayakan bisnis (bisa disolusikan produk, kemauan membayar, pesaing, validasi pasar) | Selesai |
| 3 | Membangun minimal 5 produk startup teknologi (website, mobile app, desktop app, IoT) | Selesai (versi uji coba) |
| 4 | Memasarkan 5 produk secara organik atau berbayar | Belum |
| 5 | Menentukan 1 winning product berdasarkan return iklan tertinggi | Belum |

## Ringkasan Tahap 2

Ke-50 masalah dinilai dengan lima kriteria (solusi produk, kemauan membayar, ruang dari pesaing, bukti pasar, dan kemudahan diiklankan), masing-masing berskala 1 sampai 5. Hasilnya: 5 masalah layak, 19 dapat dipertimbangkan, dan 26 kurang layak.

Setelah diskusi, setiap anggota mengusulkan satu ide, dan lima produk berikut dipilih untuk Tahap 3:

| No | Produk pilihan kelompok | Skor (dari 25) |
|---|---|---|
| 33 | Bank responden skripsi | 21 |
| 45 | Manajemen kos untuk pemilik | 20 |
| 1 | Visibilitas digital UMKM | 19 |
| 7 | Form pre-order dan rekap pesanan | 19 |
| 46 | Langganan laundry dan bersih kamar kos | 17 |

Langganan laundry dan bersih kamar berskor 17 karena butuh mitra laundry dan petugas kebersihan di lapangan, tetapi dipilih karena pendapatannya berulang setiap minggu. Sewa barang antarwarga dan mahasiswa (no. 31, skor 18) menjadi cadangan pertama.

Rincian skor, pesaing, dan rencana validasi ada di tab "Tahap 2" pada Google Docs.

## Tahap 3: Lima Produk

Kelima produk dibuat sebagai website statis (HTML, CSS, JavaScript) dan bisa dibuka di HP maupun laptop. Setiap produk punya halaman landing untuk pemasaran dan aplikasi versi uji coba (MVP).

Halaman utama semua produk: **https://abrarmf.github.io/lab-pemro-kelompok7/** (aktif setelah GitHub Pages dinyalakan).

| Produk | Masalah | Fitur utama | Website |
|---|---|---|---|
| Responin | Bank responden skripsi (no. 33) | Profil responden, tukar poin dengan kode penyelesaian, pasang survei dengan filter kriteria, Paket Cepat Rp50.000 | [Buka](https://abrarmf.github.io/lab-pemro-kelompok7/products/responin/) |
| KelolaKos | Manajemen kos (no. 45) | Data kamar dan penghuni, tagihan bulanan otomatis, pengingat dan kuitansi WhatsApp, laporan pemasukan, cadangan data | [Buka](https://abrarmf.github.io/lab-pemro-kelompok7/products/kelolakos/) |
| Tampilin | Visibilitas digital UMKM (no. 1) | Skor digital, teks profil Google Maps dan Instagram, kalender konten 30 hari, halaman link usaha, pantau performa | [Buka](https://abrarmf.github.io/lab-pemro-kelompok7/products/tampilin/) |
| PesanDulu | Pre-order katering dan PO (no. 7) | Menu dan link pesanan, form pelanggan ke WhatsApp, impor pesanan dari chat, rekap per tanggal kirim | [Buka](https://abrarmf.github.io/lab-pemro-kelompok7/products/pesandulu/) |
| BeresKos | Laundry dan bersih kamar kos (no. 46) | Landing langganan Rp50.000 per minggu, pendaftaran gedung kos, jadwal mingguan otomatis, lewati minggu | [Buka](https://abrarmf.github.io/lab-pemro-kelompok7/products/bereskos/) |

Sebelum Tahap 4, isi nomor WhatsApp tim, Meta Pixel, dan Google Analytics di `config.js` tiap produk. Panduannya ada di [products/README.md](products/README.md).

## Struktur Repositori

```
index.html        halaman utama yang menautkan kelima produk
products/
  _shared/        komponen bersama (base.css, kit.js)
  responin/       bank responden skripsi
  kelolakos/      manajemen kos
  tampilin/       pendamping digital UMKM
  pesandulu/      aplikasi pre-order
  bereskos/       langganan laundry dan bersih kamar
```
