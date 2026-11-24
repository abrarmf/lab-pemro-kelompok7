/* BeresKos: fungsi jadwal yang dipakai halaman utama dan halaman jadwal. */
window.Beres = (function () {
  const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const J = () => CONFIG.jadwal;

  function kegiatan(dow) {
    const j = J();
    if (dow === j.jemput) return { ico: "🧺", text: "Jemput cucian", short: "Jemput" };
    if (dow === j.antar) return { ico: "👕", text: "Antar cucian", short: "Antar" };
    if (dow === j.bersih) return { ico: "🧹", text: "Bersih kamar", short: "Bersih" };
    return null;
  }

  /* Tujuh hari mulai Senin. today = indeks hari yang disorot (-1 = tidak ada) */
  function weekHtml(today) {
    const order = [1, 2, 3, 4, 5, 6, 0];
    return order.map((d) => {
      const k = kegiatan(d);
      return '<div class="day' + (k ? " on" : "") + (d === today ? " today" : "") + '"><b>' + HARI[d].slice(0, 3) + '</b><div class="ico">' + (k ? k.ico : "") + "</div><small>" + (k ? k.short : "") + "</small></div>";
    }).join("");
  }

  function mondayOf(date) {
    const d = new Date(date); d.setHours(0, 0, 0, 0);
    const diff = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - diff);
    return d;
  }

  function fillConfig() {
    Kit.$$("[data-harga]").forEach((el) => { el.textContent = Kit.rp(CONFIG.hargaMingguan); });
    Kit.$$("[data-kg]").forEach((el) => { el.textContent = CONFIG.kuotaKg; });
    Kit.$$("[data-min]").forEach((el) => { el.textContent = CONFIG.minKamar; });
    Kit.$$("[data-area]").forEach((el) => { el.textContent = CONFIG.area; });
  }

  return { HARI, kegiatan, weekHtml, mondayOf, fillConfig };
})();
