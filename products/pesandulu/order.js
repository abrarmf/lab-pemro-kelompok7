/* PesanDulu: halaman pesanan untuk pelanggan.
   Data toko dan menu dibawa di bagian # pada link, jadi tidak butuh server. */
(function () {
  const { $, esc, rp } = Kit;
  const data = Kit.decode(location.hash.slice(1));
  if (!data || !data.t || !Array.isArray(data.m) || !data.m.length) { $("#invalid").classList.remove("hidden"); return; }

  const toko = data.t, menu = data.m, batch = data.b || {};
  const qty = menu.map(() => 0);
  const today = Kit.isoDate(new Date());
  const tutup = batch.tu && batch.tu < today;

  document.title = "Pesan di " + toko.n;
  $("#order").classList.remove("hidden");
  $("#o-toko").textContent = toko.n;
  $("#o-batch").textContent = batch.n || "Pre-order";
  $("#o-info").textContent = [batch.tu ? (tutup ? "PO sudah ditutup " : "PO ditutup ") + Kit.date(batch.tu) : "", toko.c].filter(Boolean).join(" · ");

  const dates = (batch.k || []).filter((d) => d >= today);
  $("#o-tgl").innerHTML = (dates.length ? dates : batch.k || []).map((d) => '<option value="' + d + '">' + Kit.date(d, { weekday: "long", day: "numeric", month: "long" }) + "</option>").join("") || '<option value="">Sesuai info penjual</option>';

  function renderMenu() {
    $("#o-menu").innerHTML = menu.map((m, i) => (
      '<div class="menu-item"><div><b>' + esc(m[0]) + '</b><div class="small muted">' + rp(m[1]) + (m[2] ? " / " + esc(m[2]) : "") + "</div></div>" +
      '<div class="stepper"><button type="button" data-d="-1" data-i="' + i + '" aria-label="Kurangi">−</button><span>' + qty[i] + '</span><button type="button" data-d="1" data-i="' + i + '" aria-label="Tambah">+</button></div></div>'
    )).join("");
    $("#o-total").textContent = rp(total());
  }
  const total = () => menu.reduce((a, m, i) => a + m[1] * qty[i], 0);
  $("#o-menu").addEventListener("click", (e) => {
    const b = e.target.closest("[data-d]"); if (!b) return;
    const i = Number(b.dataset.i);
    qty[i] = Math.max(0, Math.min(999, qty[i] + Number(b.dataset.d)));
    renderMenu();
  });
  renderMenu();

  if (tutup) {
    const btn = $("#order button[type=submit]");
    btn.disabled = true; btn.textContent = "PO sudah ditutup";
  }

  $("#order").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!total()) { Kit.toast("Pilih minimal satu menu"); return; }
    const items = menu.map((m, i) => [m[0], m[1], qty[i]]).filter((x) => x[2] > 0);
    const o = { v: 1, b: batch.i || "", n: $("#o-nama").value.trim(), h: $("#o-hp").value.trim(), d: $("#o-tgl").value, a: $("#o-alamat").value.trim(), c: $("#o-cat").value.trim(), i: items, ts: Date.now() };
    const msg = "Halo " + toko.n + ", saya mau pesan" + (batch.n ? " " + batch.n : "") + ":\n" +
      items.map((x) => "- " + x[2] + "x " + x[0] + " (" + rp(x[1] * x[2]) + ")").join("\n") +
      "\nTotal: " + rp(total()) +
      "\n\nNama: " + o.n + "\nNo. HP: " + o.h + (o.d ? "\nTanggal: " + Kit.date(o.d, { weekday: "long", day: "numeric", month: "long" }) : "") +
      "\n" + (o.a ? "Alamat: " + o.a : "Ambil sendiri") + (o.c ? "\nCatatan: " + o.c : "") +
      "\n\nKode pesanan (untuk penjual): PD1." + Kit.encode(o);
    Kit.track("CustomerOrder", { value: total() });
    window.open(Kit.waLink(msg, toko.w), "_blank", "noopener");
  });
})();
