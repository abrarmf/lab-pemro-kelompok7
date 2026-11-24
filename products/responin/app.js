/* Responin: logika dasbor (versi uji coba, data di localStorage). */
(function () {
  const { $, $$, esc, rp } = Kit;
  const db = Kit.store("responin_v1");

  /* Survei contoh dari mahasiswa lain. Pada versi uji coba, kuesionernya berupa simulasi singkat. */
  const SEED = [
    { id: "s1", judul: "Pengaruh Social Commerce terhadap Minat Beli Gen Z", peneliti: "Nadia, Manajemen", menit: 7, kriteria: { usiaMin: 18, usiaMax: 25, domisili: [], jurusan: [], profesi: "" }, kode: "SC-4821" },
    { id: "s2", judul: "Kebiasaan Tidur dan Prestasi Akademik Mahasiswa Tingkat Akhir", peneliti: "Raka, Psikologi", menit: 5, kriteria: { usiaMin: 20, usiaMax: 26, domisili: [], jurusan: [], profesi: "Mahasiswa" }, kode: "TD-1107" },
    { id: "s3", judul: "Persepsi Pengguna terhadap Fitur Paylater di E-Commerce", peneliti: "Sinta, Akuntansi", menit: 9, kriteria: { usiaMin: 18, usiaMax: 35, domisili: ["Semarang"], jurusan: [], profesi: "" }, kode: "PL-3390" },
    { id: "s4", judul: "Preferensi Transportasi Umum Warga Semarang", peneliti: "Bima, Teknik Sipil", menit: 4, kriteria: { usiaMin: 17, usiaMax: 60, domisili: ["Semarang"], jurusan: [], profesi: "" }, kode: "TR-5512" },
    { id: "s5", judul: "Literasi Keuangan dan Perilaku Menabung Mahasiswa Rantau", peneliti: "Dewi, Ekonomi Pembangunan", menit: 12, kriteria: { usiaMin: 18, usiaMax: 25, domisili: [], jurusan: [], profesi: "Mahasiswa" }, kode: "LK-8076" },
    { id: "s6", judul: "Kepuasan Karyawan terhadap Sistem Kerja Hybrid", peneliti: "Yoga, Administrasi Bisnis", menit: 8, kriteria: { usiaMin: 22, usiaMax: 45, domisili: [], jurusan: [], profesi: "Karyawan swasta" }, kode: "HY-2264" },
    { id: "s7", judul: "Penggunaan AI Generatif dalam Pengerjaan Tugas Kuliah", peneliti: "Fikri, Bisnis Digital", menit: 6, kriteria: { usiaMin: 18, usiaMax: 30, domisili: [], jurusan: [], profesi: "Mahasiswa" }, kode: "AI-6643" }
  ];

  const state = db.get({ profile: null, poin: 0, history: [], done: [], mine: [] });
  const save = () => db.set(state);

  const reward = (menit) => (menit <= 5 ? 1 : menit <= 10 ? 2 : 3);
  const norm = (s) => String(s || "").trim().toLowerCase();
  const splitList = (s) => String(s || "").split(",").map((x) => x.trim()).filter(Boolean);

  function eligible(k, p) {
    if (!p) return false;
    const usia = Number(p.usia);
    if (k.usiaMin && usia < k.usiaMin) return false;
    if (k.usiaMax && usia > k.usiaMax) return false;
    if (k.domisili && k.domisili.length && !k.domisili.some((d) => norm(d) === norm(p.domisili))) return false;
    if (k.jurusan && k.jurusan.length && !k.jurusan.some((j) => norm(p.jurusan).includes(norm(j)))) return false;
    if (k.profesi && norm(k.profesi) !== norm(p.profesi)) return false;
    return true;
  }

  function kriteriaChips(k) {
    const c = [];
    if (k.usiaMin || k.usiaMax) c.push("Usia " + (k.usiaMin || "?") + "–" + (k.usiaMax || "?"));
    (k.domisili || []).forEach((d) => c.push(d));
    (k.jurusan || []).forEach((j) => c.push(j));
    if (k.profesi) c.push(k.profesi);
    if (!c.length) c.push("Semua kriteria");
    return '<div class="chips">' + c.map((x) => '<span class="chip">' + esc(x) + "</span>").join("") + "</div>";
  }

  function addPoin(delta, note) {
    state.poin += delta;
    state.history.unshift({ at: new Date().toISOString(), delta, note });
    save();
    renderPoin();
    renderHistory();
  }

  function renderPoin() {
    $("#poin-pill").textContent = Kit.num(state.poin) + " poin";
    $("#cost-saldo").textContent = Kit.num(state.poin) + " poin";
  }

  /* ---------- Profil ---------- */
  function showOnboarding(prefill) {
    $("#onboarding").classList.remove("hidden");
    $("#dashboard").classList.add("hidden");
    $("#poin-awal").textContent = CONFIG.poinAwal;
    if (prefill) {
      const f = $("#profile-form");
      Object.keys(prefill).forEach((k) => { if (f.elements[k]) f.elements[k].value = prefill[k]; });
    }
  }

  $("#profile-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const isNew = !state.profile;
    state.profile = {
      nama: f.nama.value.trim(), usia: Number(f.usia.value), domisili: f.domisili.value.trim(),
      kampus: f.kampus.value.trim(), jurusan: f.jurusan.value.trim(), profesi: f.profesi.value
    };
    save();
    if (isNew) {
      addPoin(CONFIG.poinAwal, "Bonus pengguna baru");
      Kit.track("CompleteRegistration");
    }
    showDashboard();
  });

  $("#edit-profile").addEventListener("click", () => showOnboarding(state.profile));

  /* ---------- Dasbor ---------- */
  function showDashboard() {
    $("#onboarding").classList.add("hidden");
    $("#dashboard").classList.remove("hidden");
    const p = state.profile;
    $("#hello").textContent = "Halo, " + p.nama;
    $("#profile-line").textContent = [p.usia + " tahun", p.domisili, p.jurusan, p.profesi, p.kampus].filter(Boolean).join(" · ");
    renderPoin();
    renderSurveys();
    renderMine();
    renderHistory();
    updateCost();
  }

  $$(".tab").forEach((t) => t.addEventListener("click", () => {
    $$(".tab").forEach((x) => x.classList.toggle("active", x === t));
    $$("[data-panel]").forEach((p) => p.classList.toggle("hidden", p.dataset.panel !== t.dataset.tab));
  }));

  function renderSurveys() {
    const list = SEED.filter((s) => eligible(s.kriteria, state.profile));
    const open = list.filter((s) => !state.done.includes(s.id));
    const box = $("#survey-list");
    if (!open.length) {
      box.innerHTML = '<div class="empty">' + (list.length ? "Semua survei yang cocok sudah kamu isi. Cek lagi nanti untuk survei baru." : "Belum ada survei yang cocok dengan profilmu. Coba perbarui profil.") + "</div>";
      return;
    }
    box.innerHTML = open.map((s) => (
      '<div class="card survey-card">' +
        '<div class="row-item"><h3>' + esc(s.judul) + '</h3><span class="points-pill">+' + reward(s.menit) + " poin</span></div>" +
        '<div class="survey-meta"><span>Oleh ' + esc(s.peneliti) + "</span><span>" + s.menit + " menit</span></div>" +
        kriteriaChips(s.kriteria) +
        '<div class="btn-row" style="margin-top:14px"><button class="btn btn-primary btn-sm" data-isi="' + s.id + '">Isi survei</button></div>' +
      "</div>"
    )).join("");
  }

  /* Kuesioner simulasi untuk survei contoh, diakhiri kode penyelesaian */
  $("#survey-list").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-isi]");
    if (!btn) return;
    const s = SEED.find((x) => x.id === btn.dataset.isi);
    Kit.modal(
      "<h3>" + esc(s.judul) + "</h3>" +
      '<p class="small muted">Kuesioner simulasi. Pada survei asli, kuesioner dibuka di tab baru dan kode muncul di halaman terakhir.</p>' +
      '<form id="sim-form">' +
        '<div class="field"><label>1. Seberapa sering kamu mengalami hal ini dalam sebulan terakhir?</label><select required><option value="">Pilih</option><option>Tidak pernah</option><option>1–2 kali</option><option>3–5 kali</option><option>Lebih dari 5 kali</option></select></div>' +
        '<div class="field"><label>2. Seberapa setuju kamu dengan pernyataan "Topik ini relevan dengan kehidupanku"?</label><select required><option value="">Pilih</option><option>Sangat tidak setuju</option><option>Tidak setuju</option><option>Netral</option><option>Setuju</option><option>Sangat setuju</option></select></div>' +
        '<button class="btn btn-primary btn-block" type="submit">Kirim jawaban</button>' +
      "</form>" +
      '<div id="sim-done" class="hidden">' +
        '<p>Terima kasih. Kode penyelesaianmu:</p><p><span class="code-box">' + s.kode + "</span></p>" +
        '<div class="field"><label for="kode-in">Masukkan kode penyelesaian</label><input id="kode-in" autocomplete="off" placeholder="Contoh: AB-1234"></div>' +
        '<button class="btn btn-primary btn-block" id="claim">Klaim ' + reward(s.menit) + " poin</button>" +
      "</div>",
      (m, close) => {
        $("#sim-form", m).addEventListener("submit", (ev) => {
          ev.preventDefault();
          $("#sim-form", m).classList.add("hidden");
          $("#sim-done", m).classList.remove("hidden");
          $("#kode-in", m).focus();
        });
        $("#claim", m).addEventListener("click", () => {
          if (norm($("#kode-in", m).value) !== norm(s.kode)) { Kit.toast("Kode tidak cocok. Periksa lagi."); return; }
          state.done.push(s.id);
          addPoin(reward(s.menit), "Mengisi: " + s.judul);
          Kit.track("SurveyCompleted");
          close();
          renderSurveys();
          Kit.toast("+" + reward(s.menit) + " poin masuk");
        });
      }
    );
  });

  /* ---------- Pasang survei ---------- */
  function updateCost() {
    const menit = Number($("#s-menit").value) || 1;
    const target = Number($("#s-target").value) || 0;
    const per = reward(menit);
    $("#cost-per").textContent = per + " poin";
    $("#cost-total").textContent = Kit.num(per * target) + " poin";
  }
  ["#s-menit", "#s-target"].forEach((id) => $(id).addEventListener("input", updateCost));

  function surveyFromForm() {
    const usiaMin = Number($("#s-usia-min").value) || 0;
    const usiaMax = Number($("#s-usia-max").value) || 0;
    return {
      id: Kit.uid(),
      judul: $("#s-judul").value.trim(),
      link: $("#s-link").value.trim(),
      menit: Number($("#s-menit").value),
      target: Number($("#s-target").value),
      kriteria: {
        usiaMin: Math.min(usiaMin, usiaMax || usiaMin), usiaMax: Math.max(usiaMin, usiaMax),
        domisili: splitList($("#s-domisili").value), jurusan: splitList($("#s-jurusan").value), profesi: $("#s-profesi").value
      },
      kode: "RSP-" + Math.floor(1000 + Math.random() * 9000),
      createdAt: new Date().toISOString(),
      via: "poin"
    };
  }

  function kriteriaText(k) {
    return [
      "Usia " + k.usiaMin + "–" + k.usiaMax,
      "Domisili: " + (k.domisili.length ? k.domisili.join(", ") : "bebas"),
      "Jurusan: " + (k.jurusan.length ? k.jurusan.join(", ") : "bebas"),
      "Profesi: " + (k.profesi || "bebas")
    ].join("\n");
  }

  function waText(s, paket) {
    return (paket ? "Halo Responin, saya mau pesan Paket Cepat." : "Halo Responin, saya baru memasang survei dengan poin. Mohon dijadwalkan.") +
      "\n\nJudul: " + s.judul + "\nTautan: " + s.link + "\nDurasi: " + s.menit + " menit\nTarget: " + s.target + " responden\n" + kriteriaText(s.kriteria) +
      "\nKode penyelesaian: " + s.kode;
  }

  $("#survey-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const s = surveyFromForm();
    const cost = reward(s.menit) * s.target;
    if (cost > state.poin) {
      const kurang = cost - state.poin;
      Kit.modal(
        "<h3>Poinmu belum cukup</h3>" +
        "<p>Survei ini butuh <b>" + Kit.num(cost) + " poin</b>, saldomu " + Kit.num(state.poin) + " poin (kurang " + Kit.num(kurang) + " poin).</p>" +
        '<p class="muted">Kumpulkan poin dengan mengisi survei lain, kurangi target responden, atau pakai Paket Cepat ' + rp(CONFIG.paketCepat.harga) + " untuk sekitar " + CONFIG.paketCepat.responden + " responden.</p>" +
        '<div class="btn-row"><button class="btn btn-primary" id="buy">Pesan Paket Cepat</button><button class="btn btn-ghost" data-close>Nanti dulu</button></div>',
        (m, close) => {
          $("#buy", m).addEventListener("click", () => {
            s.via = "paket"; s.status = "Menunggu pembayaran paket";
            state.mine.unshift(s); save(); renderMine();
            Kit.openWa(waText(s, true), "InitiateCheckout", { value: CONFIG.paketCepat.harga, currency: "IDR" });
            close();
          });
        }
      );
      return;
    }
    s.status = "Aktif, menunggu responden";
    state.mine.unshift(s);
    addPoin(-cost, "Memasang: " + s.judul);
    Kit.track("SurveyPosted", { target: s.target });
    e.target.reset(); updateCost();
    renderMine();
    $$(".tab").find((t) => t.dataset.tab === "saya").click();
    showCode(s);
  });

  function showCode(s) {
    Kit.modal(
      "<h3>Survei dipasang</h3>" +
      "<p>Tempelkan kode ini di halaman terakhir kuesionermu supaya responden bisa mengklaim poin:</p>" +
      '<p><span class="code-box">' + s.kode + "</span></p>" +
      '<p class="small muted">Lalu kirim detail survei ke tim Responin supaya dijadwalkan ke responden yang sesuai.</p>' +
      '<div class="btn-row"><button class="btn btn-wa" id="send">Kirim ke tim lewat WhatsApp</button><button class="btn btn-ghost" data-close>Tutup</button></div>',
      (m, close) => { $("#send", m).addEventListener("click", () => { Kit.openWa(waText(s, false), "Lead"); close(); }); }
    );
  }

  function renderMine() {
    const box = $("#my-list");
    if (!state.mine.length) { box.innerHTML = '<div class="empty">Belum ada survei. Pasang kuesioner pertamamu di tab "Pasang survei".</div>'; return; }
    box.innerHTML = state.mine.map((s) => (
      '<div class="card">' +
        '<div class="row-item"><h3 style="margin:0">' + esc(s.judul) + '</h3><span class="badge ' + (s.via === "paket" ? "warn" : "") + '">' + esc(s.status) + "</span></div>" +
        '<div class="survey-meta"><span>' + s.menit + " menit</span><span>Target " + s.target + " responden</span><span>Kode " + esc(s.kode) + "</span></div>" +
        kriteriaChips(s.kriteria) +
        '<div class="small muted" style="margin-top:12px">0 dari ' + s.target + " responden</div>" +
        '<div class="progress" style="margin-top:6px"><i style="width:0%"></i></div>' +
        '<div class="btn-row" style="margin-top:14px"><a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="' + esc(s.link) + '">Buka kuesioner</a><button class="btn btn-soft btn-sm" data-resend="' + s.id + '">Kirim ulang ke tim</button></div>' +
      "</div>"
    )).join("");
  }
  $("#my-list").addEventListener("click", (e) => {
    const b = e.target.closest("[data-resend]");
    if (!b) return;
    const s = state.mine.find((x) => x.id === b.dataset.resend);
    if (s) Kit.openWa(waText(s, s.via === "paket"), "Lead");
  });

  function renderHistory() {
    const body = $("#history-body");
    if (!state.history.length) { body.innerHTML = '<tr><td colspan="3" class="muted">Belum ada riwayat.</td></tr>'; return; }
    body.innerHTML = state.history.map((h) => (
      "<tr><td>" + Kit.date(new Date(h.at)) + "</td><td>" + esc(h.note) + '</td><td class="num" style="color:' + (h.delta >= 0 ? "var(--ok)" : "var(--bad)") + '">' + (h.delta > 0 ? "+" : "") + h.delta + "</td></tr>"
    )).join("");
  }
  if (state.profile) showDashboard(); else showOnboarding();
})();
