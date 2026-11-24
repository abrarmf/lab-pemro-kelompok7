/* BeresKos: halaman jadwal penghuni (data di localStorage). */
(function () {
  const { $, esc } = Kit;
  const db = Kit.store("bereskos_v1");
  const state = db.get({ member: null, skip: [], requested: false });
  const save = () => db.set(state);
  Beres.fillConfig();

  function showJoin() {
    $("#join").classList.remove("hidden"); $("#dash").classList.add("hidden");
    const m = state.member;
    if (m) { $("#m-nama").value = m.nama; $("#m-hp").value = m.hp; $("#m-kos").value = m.kos; $("#m-kamar").value = m.kamar; $("#m-waktu").value = m.waktu; }
  }
  $("#f").addEventListener("submit", (e) => {
    e.preventDefault();
    const first = !state.member;
    state.member = { nama: $("#m-nama").value.trim(), hp: $("#m-hp").value.trim(), kos: $("#m-kos").value.trim(), kamar: $("#m-kamar").value.trim(), waktu: $("#m-waktu").value };
    save();
    if (first) Kit.track("CompleteRegistration");
    showDash();
  });
  $("#edit").addEventListener("click", showJoin);

  function weekDate(monday, dow) { const d = new Date(monday); d.setDate(monday.getDate() + ((dow + 6) % 7)); return d; }

  function showDash() {
    $("#join").classList.add("hidden"); $("#dash").classList.remove("hidden");
    const m = state.member;
    $("#hello").textContent = "Halo, " + m.nama;
    $("#who").textContent = m.kos + " · Kamar " + m.kamar + " · Bersih kamar " + m.waktu.toLowerCase();
    $("#status").textContent = state.requested ? "Permintaan terkirim" : "Belum berlangganan";
    $("#status").className = "badge " + (state.requested ? "" : "warn");

    const now = new Date(), dow = now.getDay();
    $("#week").innerHTML = Beres.weekHtml(dow);

    /* Alur minggu ini */
    const j = CONFIG.jadwal, mon = Beres.mondayOf(now);
    const steps = [
      { d: j.jemput, t: "Cucian dijemput", s: "Siapkan cucian di kantong BeresKos sebelum pukul 09.00." },
      { d: (j.jemput + 1) % 7, t: "Dicuci, dikeringkan, dilipat", s: "Dikerjakan mitra laundry, dipisah per kamar." },
      { d: j.antar, t: "Cucian diantar ke kamar", s: "Diantar sore hari." },
      { d: j.bersih, t: "Bersih kamar", s: m.waktu }
    ];
    const todayIdx = (dow + 6) % 7;
    const skipped = state.skip.includes(Kit.isoDate(mon));
    $("#timeline").innerHTML = skipped
      ? '<div class="empty" style="padding:20px">Minggu ini kamu lewati. Jadwal kembali normal minggu depan.</div>'
      : steps.map((st) => {
        const idx = (st.d + 6) % 7;
        const cls = idx < todayIdx ? "done" : idx === todayIdx ? "now" : "";
        return '<div class="tl-item ' + cls + '"><div class="tl-dot">' + (cls === "done" ? "✓" : "") + "</div><div><b>" + esc(st.t) + '</b><div class="small muted">' + Beres.HARI[st.d] + ", " + Kit.date(weekDate(mon, st.d), { day: "numeric", month: "short" }) + " · " + esc(st.s) + "</div></div></div>";
      }).join("");

    /* Empat minggu ke depan */
    const rows = [];
    for (let w = 0; w < 4; w++) {
      const monday = new Date(mon); monday.setDate(mon.getDate() + 7 * w);
      const key = Kit.isoDate(monday), skip = state.skip.includes(key);
      rows.push(
        '<div class="card flat"><div class="row-item"><div><b>Minggu ' + Kit.date(monday, { day: "numeric", month: "short" }) + "</b>" +
        '<div class="small muted">' + (skip ? "Dilewati" : "Jemput " + Kit.date(weekDate(monday, j.jemput), { weekday: "short", day: "numeric" }) + " · Antar " + Kit.date(weekDate(monday, j.antar), { weekday: "short", day: "numeric" }) + " · Bersih " + Kit.date(weekDate(monday, j.bersih), { weekday: "short", day: "numeric" })) + "</div></div>" +
        '<button class="btn btn-sm ' + (skip ? "btn-soft" : "btn-ghost") + '" data-skip="' + key + '">' + (skip ? "Ikut lagi" : "Lewati minggu ini") + "</button></div></div>"
      );
    }
    $("#weeks").innerHTML = rows.join("");
  }

  $("#weeks").addEventListener("click", (e) => {
    const b = e.target.closest("[data-skip]"); if (!b) return;
    const key = b.dataset.skip, m = state.member;
    if (state.skip.includes(key)) state.skip = state.skip.filter((k) => k !== key);
    else {
      state.skip.push(key);
      Kit.openWa("Halo BeresKos, saya " + m.nama + " (" + m.kos + " kamar " + m.kamar + ") ingin melewatkan layanan minggu " + Kit.date(key) + ".", "SkipWeek");
    }
    save(); showDash();
  });

  $("#subscribe").addEventListener("click", () => {
    const m = state.member;
    const ok = Kit.openWa("Halo BeresKos, saya mau berlangganan paket mingguan " + Kit.rp(CONFIG.hargaMingguan) + ".\n\nNama: " + m.nama + "\nNo. WhatsApp: " + m.hp + "\nKos: " + m.kos + "\nKamar: " + m.kamar + "\nWaktu bersih kamar: " + m.waktu,
      "InitiateCheckout", { value: CONFIG.hargaMingguan, currency: "IDR" });
    if (ok) { state.requested = true; save(); showDash(); }
  });

  Kit.$$("[data-area]").forEach((el) => { el.textContent = CONFIG.area; });
  if (state.member) showDash(); else showJoin();
})();
