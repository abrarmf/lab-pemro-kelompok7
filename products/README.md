# Produk Tahap 3

Lima website statis (HTML, CSS, dan JavaScript tanpa framework) yang dibangun dari lima ide pilihan kelompok. Semua bisa dibuka langsung di browser dan di-hosting gratis di GitHub Pages.

| Folder | Produk | Masalah (no. Tahap 1) | Halaman |
|---|---|---|---|
| `responin/` | Responin, bank responden skripsi | 33 | `index.html` (landing), `app.html` (dasbor) |
| `kelolakos/` | KelolaKos, manajemen kos | 45 | `index.html`, `app.html` |
| `tampilin/` | Tampilin, pendamping digital UMKM | 1 | `index.html`, `app.html` |
| `pesandulu/` | PesanDulu, aplikasi pre-order | 7 | `index.html`, `app.html` (penjual), `order.html` (pelanggan) |
| `bereskos/` | BeresKos, langganan laundry dan bersih kamar | 46 | `index.html`, `app.html` (jadwal penghuni) |
| `_shared/` | Komponen bersama | - | `base.css`, `kit.js` |

## Sebelum dipasarkan (Tahap 4)

Setiap produk punya `config.js`. Isi tiga hal ini:

```js
waNumber: "6281234567890",   // nomor WhatsApp tim, kode negara tanpa +
metaPixelId: "",             // ID Meta Pixel untuk iklan Instagram/Facebook
ga4Id: ""                    // ID Google Analytics 4 (G-XXXXXXX)
```

Tanpa `waNumber`, tombol WhatsApp hanya menampilkan pemberitahuan dan tidak membuka chat. Pixel dan GA4 hanya dipasang bila ID-nya diisi.

## Pelacakan iklan

- Pasang parameter UTM di link iklan, misalnya `.../responin/?utm_source=instagram&utm_medium=paid&utm_campaign=ads1`.
- Sumber kunjungan disimpan di browser dan otomatis ditambahkan di akhir pesan WhatsApp, contoh `(Sumber: instagram / paid / ads1)`. Dengan begitu tim bisa menghitung chat dan penjualan per iklan untuk menghitung ROAS di Tahap 5.
- Event yang dikirim ke Pixel dan GA4: `PageView`, `Lead` (klik tombol WhatsApp), `InitiateCheckout` (pesan paket berbayar), `CompleteRegistration` (mulai memakai aplikasi), serta event khusus tiap produk.

## Menjalankan di komputer sendiri

Dari folder utama repo:

```bash
python3 -m http.server 8000
```

Lalu buka `http://localhost:8000/`.

## Catatan versi uji coba

- Data pengguna disimpan di `localStorage` browser masing-masing, belum ada server atau database.
- Responin dan BeresKos memakai pendekatan concierge: permintaan pengguna dikirim ke tim lewat WhatsApp dan dijalankan manual oleh tim selama masa uji coba.
- KelolaKos, Tampilin, dan PesanDulu sudah bisa dipakai penuh oleh satu pengguna di satu perangkat. KelolaKos menyediakan cadangan data ke file JSON.
- Harga yang tampil: Responin Rp50.000 per survei (sekitar 100 responden) dan BeresKos Rp50.000 per minggu. KelolaKos, Tampilin, dan PesanDulu masih gratis selama uji coba sampai harga diputuskan.
- Kuota laundry BeresKos (5 kg per minggu) dan minimal 5 kamar per gedung masih asumsi di `config.js`.
