/* KelolaKos: aplikasi manajemen kos (data di localStorage, bisa dicadangkan ke file JSON). */
(function () {
  const { $, $$, esc, rp } = Kit;
  const db = Kit.store("kelolakos_v1");
  const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  let state = db.get(null);
  let tab = "ringkasan";
  const today = () => Kit.isoDate(new Date());
  const thisPeriod = () => today().slice(0, 7);
  let periode = thisPeriod();
  const save = () => db.set(state);

  const periodeLabel = (p) => BULAN[Number(p.slice(5, 7)) - 1] + " " + p.slice(0, 4);
  const kamarById = (id) => state.kamar.find((k) => k.id === id);
  const penghuniById = (id) => state.penghuni.find((p) => p.id === id);
  const penghuniDi = (kamarId) => state.penghuni.find((p) => p.aktif && p.kamarId === kamarId);
  const dueDate = (p) => p + "-" + String(Math.min(28, state.kos.tempo)).padStart(2, "0");

  function statusTagihan(t) {
    if (t.status === "lunas") return { cls: "ok", text: "Lunas" };
    if (t.jatuhTempo < today()) return { cls: "bad", text: "Lewat jatuh tempo" };
    return { cls: "warn", text: "Belum bayar" };
  }

  /* ---------- Data contoh ---------- */
  function sampleData() {
    const now = new Date();
    const per = (offset) => { const d = new Date(now.getFullYear(), now.getMonth() - offset, 1); return Kit.isoDate(d).slice(0, 7); };
    const kos = { nama: "Kos Melati (contoh)", alamat: "Jl. Banjarsari, Tembalang", tempo: 5, wa: "", rekening: "BCA 1234567890 a.n. Budi Santoso" };
    const kamar = [
      ["01", 900000, "Kamar mandi dalam, AC"], ["02", 900000, "Kamar mandi dalam, AC"], ["03", 750000, "Kamar mandi dalam"],
      ["04", 750000, "Kamar mandi dalam"], ["05", 650000, "Kamar mandi luar"], ["06", 650000, "Kamar mandi luar"]
    ].map(([nomor, harga, fasilitas]) => ({ id: Kit.uid(), nomor, harga, fasilitas }));
    const nama = [["Dinda", "081234560001"], ["Fajar", "081234560002"], ["Salsa", "081234560003"], ["Rizky", "081234560004"], ["Ayu", "081234560005"]];
    const penghuni = nama.map(([n, hp], i) => ({ id: Kit.uid(), nama: n, hp, kamarId: kamar[i].id, masuk: per(6) + "-01", deposit: 500000, aktif: true }));
    const tagihan = [];
    const s = { kos, kamar, penghuni, tagihan };
    for (let o = 5; o >= 0; o--) {
      const p = per(o);
      penghuni.forEach((ph, i) => {
        const k = kamar.find((x) => x.id === ph.kamarId);
        const lunas = o > 0 || i < 3;
        tagihan.push({
          id: Kit.uid(), penghuniId: ph.id, kamarId: k.id, periode: p, jumlah: k.harga,
          jatuhTempo: p + "-05", status: lunas ? "lunas" : "belum",
          tglBayar: lunas ? p + "-0" + (2 + (i % 5)) : "", metode: lunas ? (i % 2 ? "Tunai" : "Transfer") : ""
        });
      });
    }
    return s;
  }

  /* ---------- Setup ---------- */
  function showSetup() {
    $("#setup").classList.remove("hidden");
    $("#app").classList.add("hidden");
  }
  $("#setup-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    state = { kos: { nama: f.nama.value.trim(), alamat: f.alamat.value.trim(), tempo: Number(f.tempo.value), wa: f.wa.value.trim(), rekening: f.rekening.value.trim() }, kamar: [], penghuni: [], tagihan: [] };
    save();
    Kit.track("CompleteRegistration");
    tab = "kamar";
    showApp();
  });
  $("#use-sample").addEventListener("click", () => { state = sampleData(); save(); Kit.track("StartTrial"); showApp(); });

  function showApp() {
    $("#setup").classList.add("hidden");
    $("#app").classList.remove("hidden");
    $("#kos-name").textContent = state.kos.nama;
    $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
    render();
  }
  $$(".tab").forEach((t) => t.addEventListener("click", () => { tab = t.dataset.tab; $$(".tab").forEach((x) => x.classList.toggle("active", x === t)); render(); }));

  function render() {
    /* Ganti elemen panel supaya event listener dari tampilan sebelumnya tidak menumpuk */
    const old = $("#panel");
    old.replaceWith(old.cloneNode(false));
    const R = { ringkasan: renderRingkasan, tagihan: renderTagihan, kamar: renderKamar, penghuni: renderPenghuni, laporan: renderLaporan, pengaturan: renderPengaturan };
    R[tab]();
  }

  function periodeSelect() {
    const set = new Set(state.tagihan.map((t) => t.periode));
    set.add(thisPeriod()); set.add(periode);
    const opts = Array.from(set).sort().reverse();
    return '<select id="periode" style="width:auto">' + opts.map((p) => '<option value="' + p + '"' + (p === periode ? " selected" : "") + ">" + periodeLabel(p) + "</option>").join("") + "</select>";
  }
  function bindPeriode() {
    const s = $("#periode");
    if (s) s.addEventListener("change", () => { periode = s.value; render(); });
  }

  function generateTagihan(p) {
    let n = 0;
    state.penghuni.filter((ph) => ph.aktif).forEach((ph) => {
      if (state.tagihan.some((t) => t.penghuniId === ph.id && t.periode === p)) return;
      const k = kamarById(ph.kamarId);
      if (!k) return;
      state.tagihan.push({ id: Kit.uid(), penghuniId: ph.id, kamarId: k.id, periode: p, jumlah: k.harga, jatuhTempo: dueDate(p), status: "belum", tglBayar: "", metode: "" });
      n++;
    });
    save();
    return n;
  }

  function reminderText(t) {
    const ph = penghuniById(t.penghuniId), k = kamarById(t.kamarId);
    return "Halo " + ph.nama + ", ini pengingat tagihan " + state.kos.nama + " kamar " + (k ? k.nomor : "") + " untuk " + periodeLabel(t.periode) +
      " sebesar " + rp(t.jumlah) + ", jatuh tempo " + Kit.date(t.jatuhTempo) + "." +
      (state.kos.rekening ? "\nPembayaran ke: " + state.kos.rekening + "." : "") + "\nTerima kasih.";
  }
  function receiptText(t) {
    const ph = penghuniById(t.penghuniId), k = kamarById(t.kamarId);
    return "Kuitansi " + state.kos.nama + "\nPenghuni: " + ph.nama + "\nKamar: " + (k ? k.nomor : "") + "\nPeriode: " + periodeLabel(t.periode) +
      "\nJumlah: " + rp(t.jumlah) + "\nDibayar: " + Kit.date(t.tglBayar) + " (" + (t.metode || "-") + ")\nStatus: LUNAS\nTerima kasih.";
  }
  function waTenant(t, text) {
    const ph = penghuniById(t.penghuniId);
    if (!ph || !ph.hp) { Kit.toast("Nomor HP penghuni belum diisi"); return; }
    Kit.track("SendReminder");
    window.open(Kit.waLink(text, ph.hp), "_blank", "noopener");
  }

  function tagihanRows(list) {
    if (!list.length) return '<div class="empty">Belum ada tagihan untuk periode ini.</div>';
    return '<div class="table-wrap"><table><thead><tr><th>Penghuni</th><th>Kamar</th><th class="num">Jumlah</th><th>Jatuh tempo</th><th>Status</th><th>Aksi</th></tr></thead><tbody>' +
      list.map((t) => {
        const ph = penghuniById(t.penghuniId) || { nama: "(dihapus)" }, k = kamarById(t.kamarId) || { nomor: "-" }, st = statusTagihan(t);
        return "<tr><td>" + esc(ph.nama) + "</td><td>" + esc(k.nomor) + '</td><td class="num">' + rp(t.jumlah) + "</td><td>" + Kit.date(t.jatuhTempo) +
          '</td><td><span class="badge ' + st.cls + '">' + st.text + "</span>" + (t.status === "lunas" ? '<div class="small muted">' + Kit.date(t.tglBayar) + " · " + esc(t.metode) + "</div>" : "") +
          '</td><td><div class="actions">' +
          (t.status === "lunas"
            ? '<button class="btn btn-soft btn-sm" data-act="kuitansi" data-id="' + t.id + '">Kirim kuitansi</button><button class="btn btn-ghost btn-sm" data-act="batal" data-id="' + t.id + '">Batalkan</button>'
            : '<button class="btn btn-primary btn-sm" data-act="lunas" data-id="' + t.id + '">Tandai lunas</button><button class="btn btn-wa btn-sm" data-act="ingatkan" data-id="' + t.id + '">Ingatkan</button>') +
          "</div></td></tr>";
      }).join("") + "</tbody></table></div>";
  }

  function bindTagihanActions(root) {
    root.addEventListener("click", (e) => {
      const b = e.target.closest("[data-act]");
      if (!b) return;
      const t = state.tagihan.find((x) => x.id === b.dataset.id);
      if (!t) return;
      if (b.dataset.act === "ingatkan") waTenant(t, reminderText(t));
      if (b.dataset.act === "kuitansi") waTenant(t, receiptText(t));
      if (b.dataset.act === "batal") { t.status = "belum"; t.tglBayar = ""; t.metode = ""; save(); render(); }
      if (b.dataset.act === "lunas") {
        Kit.modal(
          "<h3>Catat pembayaran</h3>" +
          '<div class="field"><label for="m-tgl">Tanggal bayar</label><input id="m-tgl" type="date" value="' + today() + '"></div>' +
          '<div class="field"><label for="m-metode">Metode</label><select id="m-metode"><option>Transfer</option><option>Tunai</option><option>QRIS</option><option>E-wallet</option></select></div>' +
          '<div class="field"><label for="m-jml">Jumlah diterima</label><input id="m-jml" type="number" min="0" value="' + t.jumlah + '"></div>' +
          '<div class="btn-row"><button class="btn btn-primary" id="m-save">Simpan</button><button class="btn btn-ghost" data-close>Batal</button></div>',
          (m, close) => {
            $("#m-save", m).addEventListener("click", () => {
              t.status = "lunas"; t.tglBayar = $("#m-tgl", m).value || today(); t.metode = $("#m-metode", m).value; t.jumlah = Number($("#m-jml", m).value) || t.jumlah;
              save(); close(); render(); Kit.toast("Pembayaran dicatat");
            });
          }
        );
      }
    });
  }

  /* ---------- Ringkasan ---------- */
  function renderRingkasan() {
    const list = state.tagihan.filter((t) => t.periode === periode);
    const total = list.reduce((a, t) => a + t.jumlah, 0);
    const lunas = list.filter((t) => t.status === "lunas").reduce((a, t) => a + t.jumlah, 0);
    const belum = list.filter((t) => t.status !== "lunas");
    const telat = belum.filter((t) => t.jatuhTempo < today()).length;
    const terisi = state.kamar.filter((k) => penghuniDi(k.id)).length;
    const missing = state.penghuni.filter((ph) => ph.aktif && !list.some((t) => t.penghuniId === ph.id)).length;
    $("#panel").innerHTML =
      '<div class="panel-title"><h2>Ringkasan</h2>' + periodeSelect() + "</div>" +
      '<div class="grid grid-4 kpis" style="margin-bottom:20px">' +
        '<div class="kpi"><span>Kamar terisi</span><b>' + terisi + " / " + state.kamar.length + "</b></div>" +
        '<div class="kpi"><span>Total tagihan</span><b>' + rp(total) + "</b></div>" +
        '<div class="kpi"><span>Sudah dibayar</span><b style="color:var(--ok)">' + rp(lunas) + "</b></div>" +
        '<div class="kpi"><span>Belum dibayar</span><b style="color:var(--bad)">' + rp(total - lunas) + '</b><span>' + belum.length + " tagihan, " + telat + " lewat jatuh tempo</span></div>" +
      "</div>" +
      (missing ? '<div class="card flat" style="margin-bottom:16px"><div class="row-item"><span>' + missing + " penghuni aktif belum punya tagihan " + periodeLabel(periode) + '.</span><button class="btn btn-primary btn-sm" id="gen">Buat tagihan ' + periodeLabel(periode) + "</button></div></div>" : "") +
      "<h3>Belum dibayar</h3>" + tagihanRows(belum);
    bindPeriode();
    const g = $("#gen");
    if (g) g.addEventListener("click", () => { const n = generateTagihan(periode); Kit.toast(n + " tagihan dibuat"); Kit.track("GenerateBills", { count: n }); render(); });
    bindTagihanActions($("#panel"));
  }

  /* ---------- Tagihan ---------- */
  function renderTagihan() {
    const list = state.tagihan.filter((t) => t.periode === periode).sort((a, b) => (kamarById(a.kamarId) || {}).nomor > (kamarById(b.kamarId) || {}).nomor ? 1 : -1);
    $("#panel").innerHTML =
      '<div class="panel-title"><h2>Tagihan</h2><div class="btn-row">' + periodeSelect() + '<button class="btn btn-primary btn-sm" id="gen">Buat tagihan periode ini</button></div></div>' +
      tagihanRows(list);
    bindPeriode();
    $("#gen").addEventListener("click", () => {
      if (!state.penghuni.some((p) => p.aktif)) { Kit.toast("Tambahkan penghuni dulu"); return; }
      const n = generateTagihan(periode);
      Kit.toast(n ? n + " tagihan dibuat" : "Semua penghuni aktif sudah punya tagihan");
      render();
    });
    bindTagihanActions($("#panel"));
  }

  /* ---------- Kamar ---------- */
  function renderKamar() {
    const rows = state.kamar.slice().sort((a, b) => (a.nomor > b.nomor ? 1 : -1));
    $("#panel").innerHTML =
      '<div class="panel-title"><h2>Kamar</h2><button class="btn btn-primary btn-sm" id="add">Tambah kamar</button></div>' +
      (rows.length
        ? '<div class="table-wrap"><table><thead><tr><th>No.</th><th class="num">Harga / bulan</th><th>Fasilitas</th><th>Status</th><th>Aksi</th></tr></thead><tbody>' +
          rows.map((k) => {
            const ph = penghuniDi(k.id);
            return "<tr><td><b>" + esc(k.nomor) + '</b></td><td class="num">' + rp(k.harga) + "</td><td>" + esc(k.fasilitas || "-") + "</td><td>" +
              (ph ? '<span class="badge ok">Terisi</span> ' + esc(ph.nama) : '<span class="badge">Kosong</span>') +
              '</td><td><div class="actions"><button class="btn btn-ghost btn-sm" data-edit="' + k.id + '">Ubah</button>' + (ph ? "" : '<button class="btn btn-danger btn-sm" data-del="' + k.id + '">Hapus</button>') + "</div></td></tr>";
          }).join("") + "</tbody></table></div>"
        : '<div class="empty">Belum ada kamar. Tambahkan kamar pertama beserta harga sewanya.</div>');
    $("#add").addEventListener("click", () => kamarForm());
    $("#panel").addEventListener("click", (e) => {
      const ed = e.target.closest("[data-edit]"), de = e.target.closest("[data-del]");
      if (ed) kamarForm(kamarById(ed.dataset.edit));
      if (de && confirmDel("kamar")) { state.kamar = state.kamar.filter((k) => k.id !== de.dataset.del); save(); render(); }
    });
  }
  function confirmDel(what) { return window.confirm("Hapus " + what + " ini?"); }
  function kamarForm(k) {
    Kit.modal(
      "<h3>" + (k ? "Ubah kamar" : "Tambah kamar") + "</h3>" +
      '<form id="f"><div class="field-row"><div class="field"><label for="f-no">Nomor kamar</label><input id="f-no" required value="' + esc(k ? k.nomor : "") + '"></div>' +
      '<div class="field"><label for="f-harga">Harga per bulan</label><input id="f-harga" type="number" min="0" step="1000" required value="' + (k ? k.harga : "") + '"></div></div>' +
      '<div class="field"><label for="f-fas">Fasilitas</label><input id="f-fas" placeholder="Kamar mandi dalam, AC, WiFi" value="' + esc(k ? k.fasilitas : "") + '"></div>' +
      '<div class="btn-row"><button class="btn btn-primary" type="submit">Simpan</button><button class="btn btn-ghost" type="button" data-close>Batal</button></div></form>',
      (m, close) => {
        $("#f", m).addEventListener("submit", (e) => {
          e.preventDefault();
          const data = { nomor: $("#f-no", m).value.trim(), harga: Number($("#f-harga", m).value), fasilitas: $("#f-fas", m).value.trim() };
          if (k) Object.assign(k, data); else state.kamar.push(Object.assign({ id: Kit.uid() }, data));
          save(); close(); render();
        });
      }
    );
  }

  /* ---------- Penghuni ---------- */
  function renderPenghuni() {
    const aktif = state.penghuni.filter((p) => p.aktif), keluar = state.penghuni.filter((p) => !p.aktif);
    $("#panel").innerHTML =
      '<div class="panel-title"><h2>Penghuni</h2><button class="btn btn-primary btn-sm" id="add">Tambah penghuni</button></div>' +
      (aktif.length
        ? '<div class="table-wrap"><table><thead><tr><th>Nama</th><th>Kamar</th><th>No. HP</th><th>Masuk</th><th class="num">Deposit</th><th>Aksi</th></tr></thead><tbody>' +
          aktif.map((p) => "<tr><td><b>" + esc(p.nama) + "</b></td><td>" + esc((kamarById(p.kamarId) || {}).nomor || "-") + "</td><td>" + esc(p.hp || "-") + "</td><td>" + Kit.date(p.masuk) + '</td><td class="num">' + rp(p.deposit) +
            '</td><td><div class="actions"><button class="btn btn-ghost btn-sm" data-edit="' + p.id + '">Ubah</button><button class="btn btn-danger btn-sm" data-out="' + p.id + '">Keluar</button></div></td></tr>').join("") +
          "</tbody></table></div>"
        : '<div class="empty">Belum ada penghuni aktif.</div>') +
      (keluar.length ? '<h3 style="margin-top:24px">Riwayat penghuni keluar</h3><div class="table-wrap"><table><thead><tr><th>Nama</th><th>Masuk</th><th>Keluar</th></tr></thead><tbody>' +
        keluar.map((p) => "<tr><td>" + esc(p.nama) + "</td><td>" + Kit.date(p.masuk) + "</td><td>" + Kit.date(p.keluar) + "</td></tr>").join("") + "</tbody></table></div>" : "");
    $("#add").addEventListener("click", () => penghuniForm());
    $("#panel").addEventListener("click", (e) => {
      const ed = e.target.closest("[data-edit]"), out = e.target.closest("[data-out]");
      if (ed) penghuniForm(penghuniById(ed.dataset.edit));
      if (out && window.confirm("Tandai penghuni ini sudah keluar? Kamarnya akan menjadi kosong.")) {
        const p = penghuniById(out.dataset.out); p.aktif = false; p.keluar = today(); save(); render();
      }
    });
  }
  function penghuniForm(p) {
    const kosong = state.kamar.filter((k) => !penghuniDi(k.id) || (p && p.kamarId === k.id));
    if (!kosong.length) { Kit.toast("Tidak ada kamar kosong. Tambahkan kamar dulu."); return; }
    Kit.modal(
      "<h3>" + (p ? "Ubah penghuni" : "Tambah penghuni") + "</h3>" +
      '<form id="f"><div class="field"><label for="f-nama">Nama</label><input id="f-nama" required value="' + esc(p ? p.nama : "") + '"></div>' +
      '<div class="field-row"><div class="field"><label for="f-hp">No. WhatsApp</label><input id="f-hp" inputmode="tel" placeholder="0812..." value="' + esc(p ? p.hp : "") + '"></div>' +
      '<div class="field"><label for="f-kamar">Kamar</label><select id="f-kamar">' + kosong.map((k) => '<option value="' + k.id + '"' + (p && p.kamarId === k.id ? " selected" : "") + ">" + esc(k.nomor) + " · " + rp(k.harga) + "</option>").join("") + "</select></div></div>" +
      '<div class="field-row"><div class="field"><label for="f-masuk">Tanggal masuk</label><input id="f-masuk" type="date" value="' + (p ? p.masuk : today()) + '"></div>' +
      '<div class="field"><label for="f-dep">Deposit</label><input id="f-dep" type="number" min="0" step="1000" value="' + (p ? p.deposit : 0) + '"></div></div>' +
      '<div class="btn-row"><button class="btn btn-primary" type="submit">Simpan</button><button class="btn btn-ghost" type="button" data-close>Batal</button></div></form>',
      (m, close) => {
        $("#f", m).addEventListener("submit", (e) => {
          e.preventDefault();
          const data = { nama: $("#f-nama", m).value.trim(), hp: $("#f-hp", m).value.trim(), kamarId: $("#f-kamar", m).value, masuk: $("#f-masuk", m).value, deposit: Number($("#f-dep", m).value) || 0 };
          if (p) Object.assign(p, data); else state.penghuni.push(Object.assign({ id: Kit.uid(), aktif: true }, data));
          save(); close(); render();
        });
      }
    );
  }

  /* ---------- Laporan ---------- */
  function renderLaporan() {
    const years = Array.from(new Set(state.tagihan.map((t) => t.periode.slice(0, 4)).concat([thisPeriod().slice(0, 4)]))).sort().reverse();
    const y = renderLaporan.year || years[0];
    const per = BULAN.map((_, i) => {
      const p = y + "-" + String(i + 1).padStart(2, "0");
      const list = state.tagihan.filter((t) => t.periode === p);
      return { p, masuk: list.filter((t) => t.status === "lunas").reduce((a, t) => a + t.jumlah, 0), tagih: list.reduce((a, t) => a + t.jumlah, 0) };
    });
    const max = Math.max(1, ...per.map((x) => x.masuk));
    const totalMasuk = per.reduce((a, x) => a + x.masuk, 0), totalTagih = per.reduce((a, x) => a + x.tagih, 0);
    $("#panel").innerHTML =
      '<div class="panel-title"><h2>Laporan pemasukan</h2><div class="btn-row"><select id="year" style="width:auto">' + years.map((x) => "<option" + (x === y ? " selected" : "") + ">" + x + "</option>").join("") + '</select><button class="btn btn-ghost btn-sm" id="csv">Unduh CSV</button></div></div>' +
      '<div class="grid grid-3 kpis" style="margin-bottom:20px"><div class="kpi"><span>Pemasukan ' + y + '</span><b style="color:var(--ok)">' + rp(totalMasuk) + '</b></div><div class="kpi"><span>Total ditagihkan</span><b>' + rp(totalTagih) + '</b></div><div class="kpi"><span>Tingkat pembayaran</span><b>' + (totalTagih ? Math.round((totalMasuk / totalTagih) * 100) : 0) + "%</b></div></div>" +
      '<div class="card"><div class="chart" role="img" aria-label="Grafik pemasukan per bulan">' +
        per.map((x, i) => '<div class="bar-col" title="' + BULAN[i] + ": " + rp(x.masuk) + '"><div class="bar-fill" style="height:' + Math.round((x.masuk / max) * 100) + '%"></div><div class="bar-lbl">' + BULAN[i].slice(0, 3) + "</div></div>").join("") +
      "</div></div>" +
      '<div class="table-wrap" style="margin-top:16px"><table><thead><tr><th>Bulan</th><th class="num">Ditagihkan</th><th class="num">Diterima</th></tr></thead><tbody>' +
        per.filter((x) => x.tagih).map((x) => "<tr><td>" + periodeLabel(x.p) + '</td><td class="num">' + rp(x.tagih) + '</td><td class="num">' + rp(x.masuk) + "</td></tr>").join("") +
      "</tbody></table></div>";
    $("#year").addEventListener("change", (e) => { renderLaporan.year = e.target.value; render(); });
    $("#csv").addEventListener("click", () => {
      const head = ["Periode", "Penghuni", "Kamar", "Jumlah", "Jatuh tempo", "Status", "Tanggal bayar", "Metode"];
      const rows = state.tagihan.filter((t) => t.periode.startsWith(y)).map((t) => [t.periode, (penghuniById(t.penghuniId) || {}).nama || "", (kamarById(t.kamarId) || {}).nomor || "", t.jumlah, t.jatuhTempo, t.status, t.tglBayar, t.metode]);
      const csv = [head].concat(rows).map((r) => r.map((c) => '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"').join(",")).join("\n");
      Kit.download("kelolakos-" + y + ".csv", "﻿" + csv, "text/csv;charset=utf-8");
    });
  }

  /* ---------- Pengaturan ---------- */
  function renderPengaturan() {
    const k = state.kos;
    $("#panel").innerHTML =
      '<div class="grid grid-2">' +
      '<div class="card"><h3>Data kos</h3><form id="kos-form">' +
        '<div class="field"><label for="s-nama">Nama kos</label><input id="s-nama" required value="' + esc(k.nama) + '"></div>' +
        '<div class="field"><label for="s-alamat">Alamat</label><input id="s-alamat" value="' + esc(k.alamat) + '"></div>' +
        '<div class="field-row"><div class="field"><label for="s-tempo">Jatuh tempo tiap tanggal</label><input id="s-tempo" type="number" min="1" max="28" value="' + k.tempo + '"></div>' +
        '<div class="field"><label for="s-wa">No. WhatsApp pemilik</label><input id="s-wa" value="' + esc(k.wa) + '"></div></div>' +
        '<div class="field"><label for="s-rek">Info rekening</label><input id="s-rek" value="' + esc(k.rekening) + '"></div>' +
        '<button class="btn btn-primary" type="submit">Simpan</button></form></div>' +
      '<div class="card"><h3>Cadangan data</h3><p class="muted small">Unduh semua data ke satu file, lalu pulihkan di perangkat lain bila perlu.</p>' +
        '<div class="btn-row" style="margin-bottom:18px"><button class="btn btn-ghost" id="exp">Unduh cadangan</button><label class="btn btn-ghost" style="margin:0">Pulihkan dari file<input type="file" id="imp" accept="application/json" class="hidden"></label></div>' +
        '<h3>Hapus data</h3><p class="muted small">Menghapus semua data di perangkat ini. Unduh cadangan dulu bila masih diperlukan.</p><button class="btn btn-danger" id="reset">Hapus semua data</button></div>' +
      "</div>";
    $("#kos-form").addEventListener("submit", (e) => {
      e.preventDefault();
      Object.assign(state.kos, { nama: $("#s-nama").value.trim(), alamat: $("#s-alamat").value.trim(), tempo: Number($("#s-tempo").value) || 5, wa: $("#s-wa").value.trim(), rekening: $("#s-rek").value.trim() });
      save(); $("#kos-name").textContent = state.kos.nama; Kit.toast("Tersimpan");
    });
    $("#exp").addEventListener("click", () => Kit.download("kelolakos-cadangan-" + today() + ".json", JSON.stringify(state, null, 2), "application/json"));
    $("#imp").addEventListener("change", (e) => {
      const file = e.target.files[0]; if (!file) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const d = JSON.parse(r.result);
          if (!d.kos || !Array.isArray(d.kamar)) throw new Error("format");
          state = d; save(); showApp(); Kit.toast("Data dipulihkan");
        } catch (err) { Kit.toast("File cadangan tidak valid"); }
      };
      r.readAsText(file);
    });
    $("#reset").addEventListener("click", () => { if (window.confirm("Hapus semua data KelolaKos di perangkat ini?")) { db.clear(); state = null; tab = "ringkasan"; showSetup(); } });
  }

  if (state && state.kos) showApp(); else showSetup();
})();
