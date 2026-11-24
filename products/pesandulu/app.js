/* PesanDulu: dasbor penjual (data di localStorage). */
(function () {
  const { $, $$, esc, rp } = Kit;
  const db = Kit.store("pesandulu_v1");
  const state = db.get({ toko: null, menu: [], batch: null, orders: [] });
  const save = () => db.set(state);
  let tab = state.toko && state.menu.length ? "pesanan" : "toko";
  let rekapTgl = "";

  const total = (o) => o.items.reduce((a, x) => a + x.harga * x.qty, 0);
  const fmtTgl = (d) => (d ? Kit.date(d, { weekday: "short", day: "numeric", month: "short" }) : "Tanpa tanggal");

  $$(".tab").forEach((t) => t.addEventListener("click", () => go(t.dataset.tab)));
  function go(t) {
    if (t !== "toko" && !(state.toko && state.menu.length)) { Kit.toast("Lengkapi toko dan menu dulu"); t = "toko"; }
    tab = t;
    $$(".tab").forEach((x) => x.classList.toggle("active", x.dataset.tab === tab));
    const old = $("#panel"); old.replaceWith(old.cloneNode(false));
    ({ toko: renderToko, link: renderLink, pesanan: renderPesanan, rekap: renderRekap })[tab]();
    if (state.toko) $("#toko-name").textContent = state.toko.nama;
  }

  /* ---------- 1. Toko dan menu ---------- */
  function menuRow(m) {
    return '<div class="field-row menu-row" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr) minmax(0,1fr) auto;align-items:end">' +
      '<div class="field" style="margin:0"><label>Nama menu</label><input class="m-nama" required value="' + esc(m.nama || "") + '" placeholder="Nastar 500 g"></div>' +
      '<div class="field" style="margin:0"><label>Harga</label><input class="m-harga" type="number" min="0" step="500" required value="' + (m.harga || "") + '"></div>' +
      '<div class="field" style="margin:0"><label>Satuan</label><input class="m-satuan" value="' + esc(m.satuan || "") + '" placeholder="toples"></div>' +
      '<button type="button" class="btn btn-danger btn-sm m-del" aria-label="Hapus menu">×</button></div>';
  }
  function renderToko() {
    const t = state.toko || {}, b = state.batch || {};
    $("#panel").innerHTML =
      '<form id="f" class="grid" style="max-width:860px">' +
      '<div class="card"><h3>Data toko</h3>' +
        '<div class="field-row"><div class="field"><label for="t-nama">Nama usaha</label><input id="t-nama" required value="' + esc(t.nama || "") + '" placeholder="Dapur Ratih"></div>' +
        '<div class="field"><label for="t-wa">No. WhatsApp penerima pesanan</label><input id="t-wa" required inputmode="tel" value="' + esc(t.wa || "") + '" placeholder="0812..."></div></div>' +
        '<div class="field"><label for="t-rek">Info pembayaran</label><input id="t-rek" value="' + esc(t.rekening || "") + '" placeholder="BCA 1234567890 a.n. Ratih"></div>' +
        '<div class="field" style="margin:0"><label for="t-cat">Info untuk pelanggan</label><input id="t-cat" maxlength="140" value="' + esc(t.catatan || "") + '" placeholder="Pengiriman area Tembalang gratis ongkir"></div></div>' +
      '<div class="card"><h3>Periode PO</h3>' +
        '<div class="field-row"><div class="field"><label for="b-nama">Nama PO</label><input id="b-nama" value="' + esc(b.nama || "") + '" placeholder="PO Kue Lebaran"></div>' +
        '<div class="field"><label for="b-tutup">Tanggal tutup PO</label><input id="b-tutup" type="date" value="' + esc(b.tutup || "") + '"></div></div>' +
        '<div class="field" style="margin:0"><label for="b-kirim">Pilihan tanggal kirim</label><input id="b-kirim" value="' + esc((b.kirim || []).join(", ")) + '" placeholder="2026-12-20, 2026-12-21"><div class="hint">Format tahun-bulan-tanggal, pisahkan dengan koma. Kosongkan bila tanggal diatur lewat chat.</div></div></div>' +
      '<div class="card"><div class="row-item" style="margin-bottom:12px"><h3 style="margin:0">Menu</h3><button type="button" class="btn btn-soft btn-sm" id="add-menu">Tambah menu</button></div>' +
        '<div class="list" id="menu-rows">' + (state.menu.length ? state.menu : [{}]).map(menuRow).join("") + "</div></div>" +
      '<div><button class="btn btn-primary btn-lg" type="submit">Simpan dan buat link</button></div></form>';
    $("#add-menu").addEventListener("click", () => $("#menu-rows").insertAdjacentHTML("beforeend", menuRow({})));
    $("#menu-rows").addEventListener("click", (e) => {
      if (e.target.closest(".m-del")) {
        if ($$(".menu-row").length > 1) e.target.closest(".menu-row").remove(); else Kit.toast("Minimal satu menu");
      }
    });
    if (window.innerWidth < 600) $$(".menu-row").forEach((r) => { r.style.gridTemplateColumns = "1fr 1fr"; });
    $("#f").addEventListener("submit", (e) => {
      e.preventDefault();
      const first = !state.toko;
      state.toko = { nama: $("#t-nama").value.trim(), wa: $("#t-wa").value.trim(), rekening: $("#t-rek").value.trim(), catatan: $("#t-cat").value.trim() };
      state.menu = $$(".menu-row").map((r) => ({ nama: $(".m-nama", r).value.trim(), harga: Number($(".m-harga", r).value) || 0, satuan: $(".m-satuan", r).value.trim() })).filter((m) => m.nama);
      const kirim = $("#b-kirim").value.split(",").map((x) => x.trim()).filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x)).sort();
      state.batch = { id: (state.batch && state.batch.id) || Kit.uid(), nama: $("#b-nama").value.trim(), tutup: $("#b-tutup").value, kirim };
      save();
      if (first) Kit.track("CompleteRegistration");
      go("link");
    });
  }

  /* ---------- 2. Link pesanan ---------- */
  function orderLink() {
    const payload = {
      v: 1,
      t: { n: state.toko.nama, w: state.toko.wa, c: state.toko.catatan },
      m: state.menu.map((m) => [m.nama, m.harga, m.satuan]),
      b: { i: state.batch.id, n: state.batch.nama, tu: state.batch.tutup, k: state.batch.kirim }
    };
    return new URL("order.html", location.href).href.split("#")[0] + "#" + Kit.encode(payload);
  }
  function renderLink() {
    const link = orderLink();
    const share = "Halo! " + state.toko.nama + " buka " + (state.batch.nama || "pre-order") + (state.batch.tutup ? " sampai " + Kit.date(state.batch.tutup) : "") + ". Pesan langsung lewat link ini ya:\n" + link;
    $("#panel").innerHTML =
      '<div class="card" style="max-width:760px"><h2>Link pesanan siap dibagikan</h2>' +
      '<p class="muted">Bagikan ke pelanggan lewat status WhatsApp, grup, atau bio Instagram. Pesanan akan masuk ke WhatsApp ' + esc(state.toko.wa) + ".</p>" +
      '<div class="output" style="font-size:.8rem;word-break:break-all;background:var(--bg-alt);border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:14px">' + esc(link) + "</div>" +
      '<div class="btn-row"><button class="btn btn-primary" id="copy">Salin link</button><a class="btn btn-ghost" href="' + esc(link) + '" target="_blank" rel="noopener">Coba sebagai pelanggan</a><button class="btn btn-wa" id="share">Bagikan lewat WhatsApp</button></div>' +
      '<p class="small muted" style="margin-top:14px">Link berubah setiap kali menu atau harga diubah. Bagikan ulang link terbaru setelah mengubah menu.</p></div>';
    $("#copy").addEventListener("click", () => { Kit.copy(link); Kit.track("CopyOrderLink"); });
    $("#share").addEventListener("click", () => { Kit.track("ShareOrderLink"); window.open("https://wa.me/?text=" + encodeURIComponent(share), "_blank", "noopener"); });
  }

  /* ---------- 3. Pesanan ---------- */
  function importText(text) {
    const codes = Array.from(String(text).matchAll(/PD1\.([A-Za-z0-9_-]+)/g)).map((m) => m[1]);
    let added = 0, dup = 0, bad = 0;
    codes.forEach((c) => {
      if (state.orders.some((o) => o.kode === c)) { dup++; return; }
      const o = Kit.decode(c);
      if (!o || !Array.isArray(o.i)) { bad++; return; }
      state.orders.push({ id: Kit.uid(), kode: c, nama: o.n, hp: o.h, tgl: o.d || "", alamat: o.a || "", catatan: o.c || "", items: o.i.map((x) => ({ nama: x[0], harga: Number(x[1]) || 0, qty: Number(x[2]) || 0 })), bayar: "belum", status: "baru", at: o.ts || Date.now() });
      added++;
    });
    save();
    return { added, dup, bad, found: codes.length };
  }
  function renderPesanan() {
    const list = state.orders.slice().sort((a, b) => (a.tgl || "9") > (b.tgl || "9") ? 1 : (a.tgl === b.tgl ? a.at - b.at : -1));
    $("#panel").innerHTML =
      '<div class="card" style="margin-bottom:18px"><h3>Tempel pesanan dari WhatsApp</h3><p class="small muted">Salin chat pesanan yang berisi "Kode pesanan", lalu tempel di sini. Bisa beberapa chat sekaligus. Pesanan yang sama tidak akan tercatat dua kali.</p>' +
        '<textarea id="paste" placeholder="Tempel chat pesanan di sini"></textarea>' +
        '<div class="btn-row" style="margin-top:10px"><button class="btn btn-primary" id="imp">Tambahkan pesanan</button><button class="btn btn-ghost" id="manual">Tambah manual</button></div></div>' +
      '<div class="panel-title"><h2>Pesanan (' + list.length + ')</h2></div>' +
      (list.length ? '<div class="list">' + list.map((o) => (
        '<div class="card order-card"><div class="row-item"><div><b>' + esc(o.nama) + '</b> <span class="small muted">' + esc(o.hp) + "</span></div><b>" + rp(total(o)) + "</b></div>" +
        '<div class="small muted">' + fmtTgl(o.tgl) + " · " + (o.alamat ? esc(o.alamat) : "Ambil sendiri") + (o.catatan ? " · Catatan: " + esc(o.catatan) : "") + "</div>" +
        '<ul class="items">' + o.items.map((x) => "<li>" + x.qty + "x " + esc(x.nama) + "</li>").join("") + "</ul>" +
        '<div class="btn-row">' +
          '<button class="btn btn-sm ' + (o.bayar === "lunas" ? "btn-soft" : "btn-primary") + '" data-act="bayar" data-id="' + o.id + '">' + (o.bayar === "lunas" ? "✓ Lunas" : "Tandai lunas") + "</button>" +
          '<button class="btn btn-sm btn-ghost" data-act="status" data-id="' + o.id + '">Status: ' + ({ baru: "Baru", diproses: "Diproses", dikirim: "Selesai" })[o.status] + "</button>" +
          '<button class="btn btn-sm btn-wa" data-act="konfirmasi" data-id="' + o.id + '">Konfirmasi</button>' +
          '<button class="btn btn-sm btn-danger" data-act="hapus" data-id="' + o.id + '">Hapus</button></div></div>'
      )).join("") + "</div>" : '<div class="empty">Belum ada pesanan. Bagikan link pesanan, lalu tempel chat pesanan yang masuk di kotak di atas.</div>');
    $("#imp").addEventListener("click", () => {
      const r = importText($("#paste").value);
      if (!r.found) { Kit.toast("Tidak ditemukan kode pesanan PD1 di teks itu"); return; }
      Kit.toast(r.added + " pesanan ditambahkan" + (r.dup ? ", " + r.dup + " sudah ada" : "") + (r.bad ? ", " + r.bad + " kode rusak" : ""));
      if (r.added) Kit.track("ImportOrders", { count: r.added });
      go("pesanan");
    });
    $("#manual").addEventListener("click", manualForm);
    $("#panel").addEventListener("click", (e) => {
      const b = e.target.closest("[data-act]"); if (!b) return;
      const o = state.orders.find((x) => x.id === b.dataset.id); if (!o) return;
      if (b.dataset.act === "bayar") o.bayar = o.bayar === "lunas" ? "belum" : "lunas";
      if (b.dataset.act === "status") o.status = ({ baru: "diproses", diproses: "dikirim", dikirim: "baru" })[o.status];
      if (b.dataset.act === "hapus") { if (!window.confirm("Hapus pesanan " + o.nama + "?")) return; state.orders = state.orders.filter((x) => x !== o); }
      if (b.dataset.act === "konfirmasi") {
        const msg = "Halo " + o.nama + ", pesanan " + (state.batch.nama || "") + " di " + state.toko.nama + " sudah kami catat:\n" + o.items.map((x) => "- " + x.qty + "x " + x.nama).join("\n") +
          "\nTotal: " + rp(total(o)) + (o.tgl ? "\nTanggal: " + Kit.date(o.tgl, { weekday: "long", day: "numeric", month: "long" }) : "") +
          (o.bayar === "lunas" ? "\nStatus: LUNAS. Terima kasih!" : (state.toko.rekening ? "\nPembayaran ke: " + state.toko.rekening : "")) ;
        window.open(Kit.waLink(msg, o.hp), "_blank", "noopener");
        return;
      }
      save(); go("pesanan");
    });
  }
  function manualForm() {
    Kit.modal(
      "<h3>Tambah pesanan manual</h3><form id='mf'>" +
      '<div class="field-row"><div class="field"><label for="mf-nama">Nama</label><input id="mf-nama" required></div><div class="field"><label for="mf-hp">No. HP</label><input id="mf-hp" inputmode="tel"></div></div>' +
      '<div class="field-row"><div class="field"><label for="mf-tgl">Tanggal kirim</label><input id="mf-tgl" type="date" value="' + ((state.batch.kirim || [])[0] || "") + '"></div><div class="field"><label for="mf-alamat">Alamat</label><input id="mf-alamat" placeholder="Kosongkan bila ambil sendiri"></div></div>' +
      state.menu.map((m, i) => '<div class="row-item" style="margin-bottom:8px"><span>' + esc(m.nama) + ' <span class="small muted">' + rp(m.harga) + '</span></span><input type="number" min="0" value="0" data-mi="' + i + '" style="width:90px"></div>').join("") +
      '<div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" type="submit">Simpan</button><button class="btn btn-ghost" type="button" data-close>Batal</button></div></form>',
      (m, close) => {
        $("#mf", m).addEventListener("submit", (e) => {
          e.preventDefault();
          const items = $$("[data-mi]", m).map((inp) => ({ nama: state.menu[inp.dataset.mi].nama, harga: state.menu[inp.dataset.mi].harga, qty: Number(inp.value) || 0 })).filter((x) => x.qty > 0);
          if (!items.length) { Kit.toast("Isi jumlah minimal satu menu"); return; }
          state.orders.push({ id: Kit.uid(), kode: "manual-" + Kit.uid(), nama: $("#mf-nama", m).value.trim(), hp: $("#mf-hp", m).value.trim(), tgl: $("#mf-tgl", m).value, alamat: $("#mf-alamat", m).value.trim(), catatan: "", items, bayar: "belum", status: "baru", at: Date.now() });
          save(); close(); go("pesanan");
        });
      }
    );
  }

  /* ---------- 4. Rekap ---------- */
  function renderRekap() {
    const tgls = Array.from(new Set(state.orders.map((o) => o.tgl))).sort();
    if (!tgls.length) { $("#panel").innerHTML = '<div class="empty">Belum ada pesanan untuk direkap.</div>'; return; }
    if (!tgls.includes(rekapTgl)) rekapTgl = tgls.find((d) => d >= Kit.isoDate(new Date())) || tgls[tgls.length - 1];
    const list = state.orders.filter((o) => o.tgl === rekapTgl);
    const perMenu = {};
    list.forEach((o) => o.items.forEach((x) => { perMenu[x.nama] = perMenu[x.nama] || { qty: 0, nilai: 0 }; perMenu[x.nama].qty += x.qty; perMenu[x.nama].nilai += x.qty * x.harga; }));
    const omzet = list.reduce((a, o) => a + total(o), 0);
    const lunas = list.filter((o) => o.bayar === "lunas").reduce((a, o) => a + total(o), 0);
    const belum = list.filter((o) => o.bayar !== "lunas");
    const satuan = (n) => (state.menu.find((m) => m.nama === n) || {}).satuan || "";
    const dapur = "Rekap " + (state.batch.nama || "pesanan") + " · " + fmtTgl(rekapTgl) + "\n" + Object.keys(perMenu).map((n) => "- " + n + ": " + perMenu[n].qty + " " + satuan(n)).join("\n") + "\nTotal " + list.length + " pesanan";
    $("#panel").innerHTML =
      '<div class="panel-title"><h2>Rekap</h2><div class="btn-row"><select id="tgl" style="width:auto">' + tgls.map((d) => '<option value="' + d + '"' + (d === rekapTgl ? " selected" : "") + ">" + fmtTgl(d) + "</option>").join("") + '</select><button class="btn btn-ghost btn-sm" id="csv">Unduh CSV</button></div></div>' +
      '<div class="grid grid-4 kpis" style="margin-bottom:16px"><div class="kpi"><span>Pesanan</span><b>' + list.length + '</b></div><div class="kpi"><span>Omzet</span><b>' + rp(omzet) + '</b></div><div class="kpi"><span>Sudah dibayar</span><b style="color:var(--ok)">' + rp(lunas) + '</b></div><div class="kpi"><span>Belum dibayar</span><b style="color:var(--bad)">' + rp(omzet - lunas) + "</b></div></div>" +
      '<div class="grid grid-2" style="align-items:start"><div class="card"><div class="row-item" style="margin-bottom:10px"><h3 style="margin:0">Jumlah per menu</h3><button class="btn btn-soft btn-sm" id="copy">Salin untuk dapur</button></div>' +
        '<div class="table-wrap"><table><thead><tr><th>Menu</th><th class="num">Jumlah</th><th class="num">Nilai</th></tr></thead><tbody>' +
        Object.keys(perMenu).map((n) => "<tr><td>" + esc(n) + '</td><td class="num"><b>' + perMenu[n].qty + "</b> " + esc(satuan(n)) + '</td><td class="num">' + rp(perMenu[n].nilai) + "</td></tr>").join("") + "</tbody></table></div></div>" +
      '<div class="card"><h3>Belum bayar (' + belum.length + ")</h3>" + (belum.length ? '<div class="list">' + belum.map((o) => '<div class="row-item"><span>' + esc(o.nama) + '</span><b>' + rp(total(o)) + "</b></div>").join("") + "</div>" : '<p class="muted">Semua pesanan di tanggal ini sudah lunas.</p>') + "</div></div>";
    $("#tgl").addEventListener("change", (e) => { rekapTgl = e.target.value; go("rekap"); });
    $("#copy").addEventListener("click", () => Kit.copy(dapur));
    $("#csv").addEventListener("click", () => {
      const rows = [["Tanggal kirim", "Nama", "No. HP", "Alamat", "Pesanan", "Total", "Status bayar", "Status"]].concat(
        state.orders.map((o) => [o.tgl, o.nama, o.hp, o.alamat, o.items.map((x) => x.qty + "x " + x.nama).join("; "), total(o), o.bayar, o.status]));
      Kit.download("rekap-pesandulu.csv", "﻿" + rows.map((r) => r.map((c) => '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"').join(",")).join("\n"), "text/csv;charset=utf-8");
    });
  }

  go(tab);
})();
