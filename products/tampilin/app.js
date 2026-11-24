/* Tampilin: ruang kerja pendamping digital UMKM (data di localStorage). */
(function () {
  const { $, $$, esc, rp } = Kit;
  const db = Kit.store("tampilin_v1");
  const state = db.get({ usaha: null, cek: {}, metrik: [] });
  const save = () => db.set(state);
  let tab = state.usaha ? "skor" : "usaha";

  const KATEGORI = {
    kuliner: { label: "Kuliner", frasa: "tempat makan", emoji: "🍜", tag: "kuliner", kata: "rasa" },
    fashion: { label: "Fashion", frasa: "toko fashion", emoji: "👗", tag: "fashion", kata: "gaya" },
    jasa: { label: "Jasa", frasa: "penyedia jasa", emoji: "🛠️", tag: "jasa", kata: "layanan" },
    kecantikan: { label: "Kecantikan", frasa: "usaha kecantikan", emoji: "💅", tag: "beauty", kata: "perawatan" },
    kerajinan: { label: "Kerajinan", frasa: "usaha kerajinan tangan", emoji: "🧶", tag: "handmade", kata: "karya" },
    toko: { label: "Toko kelontong", frasa: "toko kebutuhan sehari-hari", emoji: "🛒", tag: "toko", kata: "harga" }
  };

  const CEK = [
    { k: "maps", w: 15, t: "Usaha terdaftar di Google Maps", d: "Daftarkan lewat Google Business Profile dan selesaikan verifikasi." },
    { k: "mapsInfo", w: 10, t: "Profil Google berisi alamat, jam buka, dan nomor HP", d: "Pembeli sering batal datang karena jam buka tidak jelas." },
    { k: "foto", w: 10, t: "Minimal 10 foto produk atau tempat di Google Maps", d: "Profil dengan foto lebih sering diklik daripada yang kosong." },
    { k: "ulasan", w: 10, t: "Minimal 10 ulasan di Google", d: "Minta pelanggan tetap memberi ulasan lewat tautan ulasan Google." },
    { k: "balas", w: 5, t: "Rutin membalas ulasan pelanggan", d: "Balasan menunjukkan usaha aktif dan peduli." },
    { k: "sosmed", w: 10, t: "Punya akun Instagram atau TikTok khusus usaha", d: "Pisahkan dari akun pribadi supaya terlihat profesional." },
    { k: "posting", w: 10, t: "Posting minimal 2 kali seminggu", d: "Pakai kalender konten di langkah 4 supaya tidak kehabisan ide." },
    { k: "bio", w: 5, t: "Bio media sosial berisi lokasi, jam buka, dan cara pesan", d: "Gunakan bio yang disiapkan di langkah 3." },
    { k: "waBiz", w: 10, t: "Memakai WhatsApp Business dengan katalog produk", d: "Katalog membuat pembeli tidak perlu bertanya harga satu per satu." },
    { k: "market", w: 10, t: "Berjualan di marketplace atau aplikasi pesan antar", d: "Menjangkau pembeli yang belum mengenal usahamu." },
    { k: "linkbio", w: 5, t: "Punya satu halaman link berisi semua kontak usaha", d: "Buat di langkah 5, lalu pasang di bio." }
  ];

  const TEMA = [
    { hari: "Senin", tema: "Produk unggulan", ide: (u, p) => "Foto close-up " + p + " dengan pencahayaan alami.", cap: (u, p) => "Kenalan dulu sama " + p + " dari " + u.nama + ". " + (u.keunggulan ? u.keunggulan + ". " : "") + "Mau coba? Pesan lewat WhatsApp, link ada di bio." },
    { hari: "Selasa", tema: "Di balik layar", ide: (u, p) => "Video pendek proses menyiapkan " + p + ".", cap: (u, p) => "Begini proses kami menyiapkan " + p + " setiap hari. Dikerjakan dengan teliti supaya kamu puas." },
    { hari: "Rabu", tema: "Testimoni pelanggan", ide: () => "Tangkapan layar ulasan atau chat pelanggan (minta izin dulu).", cap: (u) => "Terima kasih untuk pelanggan setia " + u.nama + "! Ulasan seperti ini bikin kami semangat. Sudah pernah coba? Ceritakan pengalamanmu di kolom komentar." },
    { hari: "Kamis", tema: "Tips dan edukasi", ide: (u) => "Carousel 3–5 slide berisi tips seputar " + KATEGORI[u.kategori].kata + ".", cap: (u) => "Tips hari ini dari " + u.nama + " untuk kamu. Simpan postingan ini supaya tidak lupa, dan bagikan ke teman yang butuh." },
    { hari: "Jumat", tema: "Promo atau penawaran", ide: (u, p) => "Desain sederhana harga " + p + " atau promo akhir pekan.", cap: (u, p) => "Akhir pekan bareng " + p + "! " + (u.hargaMulai ? "Mulai " + rp(u.hargaMulai) + " saja. " : "") + "Chat WhatsApp kami untuk pesan atau tanya stok." },
    { hari: "Sabtu", tema: "Interaksi", ide: () => "Polling atau pertanyaan di Story.", cap: (u, p) => "Kalau harus pilih satu, kamu tim " + p + " atau yang lain? Jawab di komentar ya." },
    { hari: "Minggu", tema: "Cerita usaha", ide: () => "Foto pemilik atau tim dengan cerita singkat.", cap: (u) => "Cerita di balik " + u.nama + ": usaha ini dimulai dari " + (u.kota ? u.kota : "kota kami") + " dengan satu tujuan, melayani pelanggan sebaik mungkin. Terima kasih sudah tumbuh bersama kami." }
  ];

  const lowerFirst = (s) => String(s || "").charAt(0).toLowerCase() + String(s || "").slice(1);
  const joinId = (a) => (a.length < 2 ? a.join("") : a.length === 2 ? a.join(" dan ") : a.slice(0, -1).join(", ") + ", dan " + a[a.length - 1]);
  const slug = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const produkList = (u) => String(u.produk || "").split(",").map((x) => x.trim()).filter(Boolean);
  const lokasi = (u) => [u.kecamatan, u.kota].filter(Boolean).join(", ");
  const mapsUrl = (u) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent([u.nama, u.alamat, u.kota].filter(Boolean).join(" "));
  const waUsaha = (u) => (u.wa ? Kit.waLink("Halo " + u.nama + ", saya mau pesan/tanya:", u.wa) : "");

  $$(".tab").forEach((t) => t.addEventListener("click", () => go(t.dataset.tab)));
  function go(t) {
    if (t !== "usaha" && !state.usaha) { Kit.toast("Isi data usaha dulu"); t = "usaha"; }
    tab = t;
    $$(".tab").forEach((x) => x.classList.toggle("active", x.dataset.tab === tab));
    const old = $("#panel"); old.replaceWith(old.cloneNode(false));
    ({ usaha: renderUsaha, skor: renderSkor, teks: renderTeks, kalender: renderKalender, link: renderLink, pantau: renderPantau })[tab]();
    window.scrollTo({ top: 0 });
  }

  /* ---------- 1. Data usaha ---------- */
  function renderUsaha() {
    const u = state.usaha || {};
    const v = (k) => esc(u[k] == null ? "" : u[k]);
    $("#panel").innerHTML =
      '<div class="card" style="max-width:760px">' +
      "<h2>Data usaha</h2><p class=\"muted\">Data ini dipakai untuk menyusun teks profil, kalender konten, dan halaman link. Tersimpan di perangkatmu.</p>" +
      '<form id="f">' +
      '<div class="field-row"><div class="field"><label for="u-nama">Nama usaha</label><input id="u-nama" required value="' + v("nama") + '" placeholder="Bakso Pak Darmo"></div>' +
      '<div class="field"><label for="u-kat">Jenis usaha</label><select id="u-kat">' + Object.keys(KATEGORI).map((k) => '<option value="' + k + '"' + (u.kategori === k ? " selected" : "") + ">" + KATEGORI[k].label + "</option>").join("") + "</select></div></div>" +
      '<div class="field-row"><div class="field"><label for="u-kota">Kota</label><input id="u-kota" required value="' + v("kota") + '" placeholder="Semarang"></div>' +
      '<div class="field"><label for="u-kec">Kecamatan atau daerah</label><input id="u-kec" value="' + v("kecamatan") + '" placeholder="Tembalang"></div></div>' +
      '<div class="field"><label for="u-alamat">Alamat lengkap</label><input id="u-alamat" value="' + v("alamat") + '" placeholder="Jl. Banjarsari No. 12"></div>' +
      '<div class="field"><label for="u-produk">Produk atau layanan unggulan</label><input id="u-produk" required value="' + v("produk") + '" placeholder="Bakso urat, mie ayam, es teh jumbo"><div class="hint">Pisahkan dengan koma.</div></div>' +
      '<div class="field"><label for="u-unggul">Keunggulan dalam satu kalimat</label><input id="u-unggul" maxlength="120" value="' + v("keunggulan") + '" placeholder="Kuah kaldu sapi asli tanpa pengawet"></div>' +
      '<div class="field-row"><div class="field"><label for="u-jam">Jam buka</label><input id="u-jam" value="' + v("jam") + '" placeholder="Setiap hari 10.00–21.00"></div>' +
      '<div class="field"><label for="u-harga">Harga mulai (Rp)</label><input id="u-harga" type="number" min="0" step="500" value="' + v("hargaMulai") + '"></div></div>' +
      '<div class="field-row"><div class="field"><label for="u-wa">No. WhatsApp usaha</label><input id="u-wa" inputmode="tel" value="' + v("wa") + '" placeholder="0812..."></div>' +
      '<div class="field"><label for="u-ig">Akun Instagram (tanpa @)</label><input id="u-ig" value="' + v("ig") + '" placeholder="baksopakdarmo"></div></div>' +
      '<button class="btn btn-primary" type="submit">Simpan dan lanjut cek skor</button>' +
      "</form></div>";
    $("#f").addEventListener("submit", (e) => {
      e.preventDefault();
      const first = !state.usaha;
      state.usaha = {
        nama: $("#u-nama").value.trim(), kategori: $("#u-kat").value, kota: $("#u-kota").value.trim(), kecamatan: $("#u-kec").value.trim(),
        alamat: $("#u-alamat").value.trim(), produk: $("#u-produk").value.trim(), keunggulan: $("#u-unggul").value.trim().replace(/\.$/, ""),
        jam: $("#u-jam").value.trim(), hargaMulai: Number($("#u-harga").value) || 0, wa: $("#u-wa").value.trim(), ig: $("#u-ig").value.trim().replace(/^@/, "")
      };
      save();
      if (first) Kit.track("CompleteRegistration");
      go("skor");
    });
  }

  /* ---------- 2. Skor digital ---------- */
  function skor() { return CEK.reduce((a, c) => a + (state.cek[c.k] ? c.w : 0), 0); }
  function renderSkor() {
    const s = skor();
    const level = s >= 80 ? "Sudah tampil dengan baik" : s >= 50 ? "Mulai terlihat, masih bisa ditingkatkan" : "Belum mudah ditemukan pembeli";
    const todo = CEK.filter((c) => !state.cek[c.k]).sort((a, b) => b.w - a.w).slice(0, 3);
    $("#panel").innerHTML =
      '<div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1.6fr);align-items:start" id="skor-grid">' +
      '<div class="card center"><div class="score-ring" style="--v:' + s + '"><div><div><b>' + s + '</b><div class="small muted">dari 100</div></div></div></div>' +
        "<h3>" + level + "</h3>" +
        (todo.length ? '<div style="text-align:left;margin-top:14px"><b>Kerjakan lebih dulu:</b><ol style="padding-left:20px;margin:8px 0 0">' + todo.map((c) => "<li><b>" + esc(c.t) + '</b><div class="small muted">' + esc(c.d) + "</div></li>").join("") + "</ol></div>" : "<p class=\"muted\">Semua poin sudah terpenuhi. Pertahankan dengan rutin posting dan membalas ulasan.</p>") +
      "</div>" +
      '<div><p class="muted">Centang yang sudah dimiliki ' + esc(state.usaha.nama) + ".</p><div class=\"list\">" +
        CEK.map((c) => '<label class="check-item"><input type="checkbox" data-k="' + c.k + '"' + (state.cek[c.k] ? " checked" : "") + "><div><span>" + esc(c.t) + "</span><small>" + esc(c.d) + " (+" + c.w + ")</small></div></label>").join("") +
      '</div><div class="btn-row" style="margin-top:16px"><button class="btn btn-primary" id="next">Lanjut ke teks profil</button></div></div></div>';
    if (window.innerWidth < 760) $("#skor-grid").style.gridTemplateColumns = "1fr";
    $("#panel").addEventListener("change", (e) => {
      const k = e.target.dataset.k; if (!k) return;
      state.cek[k] = e.target.checked; save(); renderSkorKeep();
    });
    $("#next").addEventListener("click", () => { Kit.track("ScoreChecked", { score: s }); go("teks"); });
  }
  function renderSkorKeep() { const y = window.scrollY; go("skor"); window.scrollTo({ top: y }); }

  /* ---------- 3. Teks profil ---------- */
  function teksProfil(u) {
    const kat = KATEGORI[u.kategori];
    const prod = produkList(u);
    const lok = lokasi(u);
    const gbp = (u.nama + " adalah " + kat.frasa + (lok ? " di " + lok : "") + ". " + (u.keunggulan ? u.keunggulan + ". " : "") +
      (prod.length ? "Kami menyediakan " + lowerFirst(joinId(prod)) + (u.hargaMulai ? " dengan harga mulai " + rp(u.hargaMulai) : "") + ". " : "") +
      (u.jam ? "Buka " + lowerFirst(u.jam) + ". " : "") + (u.wa ? "Pesan atau tanya lewat WhatsApp " + u.wa + "." : "Kunjungi kami atau hubungi lewat kontak di profil ini.")).slice(0, 750);
    const bios = [
      kat.emoji + " " + (prod[0] || kat.label) + " di " + (u.kecamatan || u.kota) + "\n" + (u.keunggulan || "Dibuat dengan sepenuh hati") + "\n" + (u.jam ? "🕘 " + u.jam + "\n" : "") + "👇 Pesan via WhatsApp",
      kat.emoji + " " + u.nama + " · " + (u.kota || "") + "\n" + (prod.slice(0, 3).join(" · ") || kat.label) + "\n" + (u.hargaMulai ? "Mulai " + rp(u.hargaMulai) + "\n" : "") + "📍 Lokasi & pesan di link bawah",
      (u.keunggulan || kat.label + " pilihan warga " + (u.kota || "")) + " " + kat.emoji + "\n📍 " + (lok || u.kota || "") + "\n💬 Chat untuk pesan dan info stok"
    ].map((b) => b.slice(0, 150));
    const sapa = "Halo, terima kasih sudah menghubungi " + u.nama + "! " + kat.emoji + "\nSilakan tulis pesanan atau pertanyaanmu, kami balas secepatnya." + (u.jam ? "\nJam buka: " + u.jam + "." : "");
    const tutup = "Terima kasih sudah menghubungi " + u.nama + ". Saat ini kami sedang tutup" + (u.jam ? " (jam buka: " + u.jam + ")" : "") + ". Pesanmu akan kami balas begitu buka.";
    return { gbp, bios, sapa, tutup };
  }
  function block(title, text, note) {
    return '<div class="card"><div class="row-item" style="margin-bottom:10px"><h3 style="margin:0">' + esc(title) + '</h3><button class="btn btn-soft btn-sm" data-copy="' + esc(text) + '">Salin</button></div>' +
      (note ? '<p class="small muted">' + esc(note) + "</p>" : "") + '<div class="output">' + esc(text) + "</div></div>";
  }
  function renderTeks() {
    const t = teksProfil(state.usaha);
    $("#panel").innerHTML =
      '<div class="panel-title"><h2>Teks profil siap pakai</h2></div><div class="list">' +
      block("Deskripsi Google Maps", t.gbp, t.gbp.length + "/750 karakter. Tempel di Google Business Profile bagian Deskripsi bisnis.") +
      t.bios.map((b, i) => block("Bio Instagram, pilihan " + (i + 1), b, b.length + "/150 karakter.")).join("") +
      block("Pesan sambutan WhatsApp Business", t.sapa, "Atur di WhatsApp Business: Alat bisnis > Pesan sambutan.") +
      block("Pesan saat tutup", t.tutup, "Atur di WhatsApp Business: Alat bisnis > Pesan di luar jam kerja.") +
      '</div><div class="btn-row" style="margin-top:16px"><button class="btn btn-primary" id="next">Lanjut ke kalender konten</button></div>';
    bindCopy();
    $("#next").addEventListener("click", () => go("kalender"));
  }
  function bindCopy() {
    $("#panel").addEventListener("click", (e) => {
      const b = e.target.closest("[data-copy]");
      if (b) { Kit.copy(b.getAttribute("data-copy")); Kit.track("CopyText"); }
    });
  }

  /* ---------- 4. Kalender konten ---------- */
  function kalender() {
    const u = state.usaha;
    const prod = produkList(u);
    const tags = ["#" + slug(u.nama), "#" + KATEGORI[u.kategori].tag + slug(u.kota), "#umkm" + slug(u.kota), u.kecamatan ? "#" + slug(u.kecamatan) : ""].filter((x) => x.length > 1).join(" ");
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const toMonday = (8 - start.getDay()) % 7 || 7; start.setDate(start.getDate() + toMonday);
    const rows = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const tm = TEMA[i % 7];
      const p = prod.length ? prod[Math.floor(i / 7 + i) % prod.length] : KATEGORI[u.kategori].label.toLowerCase();
      rows.push({ tgl: Kit.isoDate(d), hari: tm.hari, tema: tm.tema, ide: tm.ide(u, p), caption: tm.cap(u, p) + "\n\n" + tags });
    }
    return rows;
  }
  function renderKalender() {
    const rows = kalender();
    $("#panel").innerHTML =
      '<div class="panel-title"><h2>Kalender konten 30 hari</h2><button class="btn btn-ghost btn-sm" id="csv">Unduh CSV</button></div>' +
      '<p class="muted small">Mulai Senin depan. Tema berganti setiap hari dalam pola mingguan. Foto atau video tetap dari produkmu sendiri.</p>' +
      '<div class="table-wrap"><table><thead><tr><th>Tanggal</th><th>Tema</th><th>Ide konten</th><th>Caption</th><th></th></tr></thead><tbody>' +
      rows.map((r) => "<tr><td style=\"white-space:nowrap\">" + Kit.date(r.tgl, { weekday: "short", day: "numeric", month: "short" }) + "</td><td><b>" + esc(r.tema) + "</b></td><td>" + esc(r.ide) + '</td><td style="min-width:260px;white-space:pre-wrap">' + esc(r.caption) + '</td><td><button class="btn btn-soft btn-sm" data-copy="' + esc(r.caption) + '">Salin</button></td></tr>').join("") +
      "</tbody></table></div>" +
      '<div class="btn-row" style="margin-top:16px"><button class="btn btn-primary" id="next">Lanjut ke halaman link</button></div>';
    bindCopy();
    $("#csv").addEventListener("click", () => {
      const csv = [["Tanggal", "Hari", "Tema", "Ide konten", "Caption"]].concat(rows.map((r) => [r.tgl, r.hari, r.tema, r.ide, r.caption]))
        .map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(",")).join("\n");
      Kit.download("kalender-konten-" + slug(state.usaha.nama) + ".csv", "﻿" + csv, "text/csv;charset=utf-8");
      Kit.track("DownloadCalendar");
    });
    $("#next").addEventListener("click", () => go("link"));
  }

  /* ---------- 5. Halaman link ---------- */
  function linkPage(u, warna) {
    const prod = produkList(u);
    const btn = (href, label, primary) => href ? '<a class="b' + (primary ? " p" : "") + '" href="' + esc(href) + '" target="_blank" rel="noopener">' + esc(label) + "</a>" : "";
    return '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + esc(u.nama) + "</title>" +
      '<meta name="description" content="' + esc(teksProfil(u).gbp.slice(0, 150)) + '">' +
      "<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#faf7f4;color:#1a1a1a;display:flex;justify-content:center;padding:32px 16px}" +
      ".w{width:100%;max-width:440px;text-align:center}.a{width:84px;height:84px;border-radius:50%;background:" + warna + ";color:#fff;font-size:2.2rem;font-weight:800;display:grid;place-items:center;margin:0 auto 12px}" +
      "h1{font-size:1.5rem;margin:0 0 4px}.m{color:#666;font-size:.95rem;margin:2px 0}.b{display:block;padding:14px;margin:10px 0;border-radius:14px;border:1.5px solid #e5e0da;background:#fff;color:#1a1a1a;text-decoration:none;font-weight:700}" +
      ".b.p{background:" + warna + ";border-color:" + warna + ";color:#fff}.l{background:#fff;border:1.5px solid #e5e0da;border-radius:14px;padding:6px 16px;margin-top:18px;text-align:left}" +
      ".r{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #eee}.r:last-child{border:0}.f{color:#999;font-size:.8rem;margin-top:24px}</style></head><body><div class=\"w\">" +
      '<div class="a">' + esc((u.nama || "?").trim().charAt(0).toUpperCase()) + "</div><h1>" + esc(u.nama) + "</h1>" +
      '<p class="m">' + esc(u.keunggulan || KATEGORI[u.kategori].label) + "</p>" + (lokasi(u) ? '<p class="m">📍 ' + esc(lokasi(u)) + "</p>" : "") + (u.jam ? '<p class="m">🕘 ' + esc(u.jam) + "</p>" : "") +
      btn(waUsaha(u), "Pesan lewat WhatsApp", true) + btn(mapsUrl(u), "Lihat lokasi di Google Maps") + btn(u.ig ? "https://instagram.com/" + u.ig : "", "Instagram @" + u.ig) +
      (prod.length ? '<div class="l">' + prod.map((p, i) => '<div class="r"><span>' + esc(p) + "</span><span>" + (i === 0 && u.hargaMulai ? "mulai " + esc(rp(u.hargaMulai)) : "") + "</span></div>").join("") + "</div>" : "") +
      '<p class="f">Dibuat dengan Tampilin</p></div></body></html>';
  }
  function renderLink() {
    const u = state.usaha;
    const warna = state.warna || "#ea580c";
    $("#panel").innerHTML =
      '<div class="grid grid-2" style="align-items:start">' +
      '<div class="card"><h2>Halaman link usaha</h2><p class="muted">Satu halaman berisi tombol pesan WhatsApp, lokasi Google Maps, Instagram, dan daftar produk. Pasang tautannya di bio Instagram dan profil Google.</p>' +
        (u.wa ? "" : '<div class="demo-banner">Nomor WhatsApp usaha belum diisi, jadi tombol pesan tidak muncul. Lengkapi di langkah 1.</div>') +
        '<div class="field"><label for="warna">Warna utama</label><input id="warna" type="color" value="' + warna + '" style="height:46px;padding:4px"></div>' +
        '<div class="btn-row"><button class="btn btn-primary" id="dl">Unduh halaman (HTML)</button><button class="btn btn-ghost" data-cta="link-online" data-wa="Halo Tampilin, tolong bantu pasang halaman link usaha saya supaya online. Nama usaha: ' + esc(u.nama) + '">Minta dipasang online</button></div>' +
        '<p class="small muted" style="margin-top:12px">File ini bisa diunggah ke hosting gratis seperti GitHub Pages atau Netlify Drop. Kalau belum terbiasa, minta tim kami memasangkannya.</p></div>' +
      '<iframe class="preview-frame" title="Pratinjau halaman link" id="pv"></iframe></div>';
    const refresh = () => { $("#pv").srcdoc = linkPage(u, state.warna || "#ea580c"); };
    refresh();
    $("#warna").addEventListener("input", (e) => { state.warna = e.target.value; save(); refresh(); });
    $("#dl").addEventListener("click", () => { Kit.download("link-" + slug(u.nama) + ".html", linkPage(u, state.warna || "#ea580c"), "text/html;charset=utf-8"); Kit.track("DownloadLinkPage"); });
  }

  /* ---------- 6. Pantau performa ---------- */
  function renderPantau() {
    const rows = state.metrik.slice().sort((a, b) => (a.tgl > b.tgl ? 1 : -1));
    const max = Math.max(1, ...rows.map((r) => r.chat));
    const last = rows[rows.length - 1], prev = rows[rows.length - 2];
    const delta = (k) => (last && prev ? last[k] - prev[k] : 0);
    const fmtDelta = (d) => (d > 0 ? '<span style="color:var(--ok)">+' + Kit.num(d) + "</span>" : d < 0 ? '<span style="color:var(--bad)">' + Kit.num(d) + "</span>" : "");
    $("#panel").innerHTML =
      '<div class="panel-title"><h2>Pantau performa mingguan</h2></div>' +
      '<p class="muted small">Catat angka dari Google Business Profile (tayangan profil), Instagram (jumlah pengikut), dan WhatsApp (chat pembeli baru) setiap minggu.</p>' +
      '<div class="card" style="margin-bottom:16px"><form id="f" class="grid grid-4 kpis" style="align-items:end">' +
        '<div class="field" style="margin:0"><label for="m-tgl">Minggu ke</label><input id="m-tgl" type="date" value="' + Kit.isoDate(new Date()) + '"></div>' +
        '<div class="field" style="margin:0"><label for="m-maps">Tayangan Maps</label><input id="m-maps" type="number" min="0" required></div>' +
        '<div class="field" style="margin:0"><label for="m-ig">Pengikut IG</label><input id="m-ig" type="number" min="0" required></div>' +
        '<div class="field" style="margin:0"><label for="m-chat">Chat WA baru</label><input id="m-chat" type="number" min="0" required></div>' +
        '<button class="btn btn-primary" type="submit" style="grid-column:1/-1">Simpan angka minggu ini</button></form></div>' +
      (rows.length
        ? '<div class="grid grid-3 kpis" style="margin-bottom:16px"><div class="kpi"><span>Tayangan Maps</span><b>' + Kit.num(last.maps) + " " + fmtDelta(delta("maps")) + '</b></div><div class="kpi"><span>Pengikut IG</span><b>' + Kit.num(last.ig) + " " + fmtDelta(delta("ig")) + '</b></div><div class="kpi"><span>Chat WA baru</span><b>' + Kit.num(last.chat) + " " + fmtDelta(delta("chat")) + "</b></div></div>" +
          '<div class="card"><h3>Chat WhatsApp baru per minggu</h3><div style="display:flex;align-items:flex-end;gap:8px;height:160px;border-bottom:1px solid var(--line)">' +
          rows.slice(-12).map((r) => '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:4px;min-width:0"><span class="small">' + r.chat + '</span><div style="width:100%;max-width:36px;background:var(--brand);border-radius:6px 6px 0 0;height:' + Math.round((r.chat / max) * 100) + '%;min-height:2px"></div><span class="small muted">' + Kit.date(r.tgl, { day: "numeric", month: "short" }) + "</span></div>").join("") +
          "</div></div>"
        : '<div class="empty">Belum ada catatan. Isi angka minggu ini untuk mulai memantau.</div>');
    $("#f").addEventListener("submit", (e) => {
      e.preventDefault();
      const tgl = $("#m-tgl").value;
      state.metrik = state.metrik.filter((r) => r.tgl !== tgl);
      state.metrik.push({ tgl, maps: Number($("#m-maps").value), ig: Number($("#m-ig").value), chat: Number($("#m-chat").value) });
      save(); Kit.track("LogMetrics"); go("pantau");
    });
  }

  go(tab);
})();
