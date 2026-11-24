/* Kit: fungsi bantu bersama untuk kelima produk.
   - Penyimpanan lokal (localStorage) yang aman dari error
   - Format rupiah dan tanggal
   - Tautan WhatsApp dengan sumber kunjungan (UTM) supaya konversi iklan bisa dilacak di Tahap 4-5
   - Pemasangan Meta Pixel dan Google Analytics 4 bila ID-nya diisi di config.js
*/
(function () {
  const cfg = () => window.CONFIG || {};

  const Kit = {
    store(key) {
      return {
        get(fallback) {
          try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
          } catch (e) { return fallback; }
        },
        set(value) {
          try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
        },
        clear() { try { localStorage.removeItem(key); } catch (e) {} }
      };
    },

    uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); },

    rp(n) { return "Rp" + Math.round(Number(n) || 0).toLocaleString("id-ID"); },

    num(n) { return (Number(n) || 0).toLocaleString("id-ID"); },

    date(d, opts) {
      if (!d) return "-";
      const dt = typeof d === "string" ? new Date(d + (d.length === 10 ? "T00:00:00" : "")) : d;
      if (isNaN(dt)) return "-";
      return dt.toLocaleDateString("id-ID", opts || { day: "numeric", month: "short", year: "numeric" });
    },

    isoDate(d) {
      const dt = d || new Date();
      const p = (x) => String(x).padStart(2, "0");
      return dt.getFullYear() + "-" + p(dt.getMonth() + 1) + "-" + p(dt.getDate());
    },

    esc(s) {
      return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    },

    $(sel, root) { return (root || document).querySelector(sel); },
    $$(sel, root) { return Array.from((root || document).querySelectorAll(sel)); },

    toast(msg, ms) {
      const old = document.querySelector(".toast");
      if (old) old.remove();
      const el = document.createElement("div");
      el.className = "toast";
      el.setAttribute("role", "status");
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), ms || 2600);
    },

    async copy(text) {
      try { await navigator.clipboard.writeText(text); Kit.toast("Tersalin ke clipboard"); }
      catch (e) {
        const ta = document.createElement("textarea");
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); Kit.toast("Tersalin ke clipboard"); } catch (err) { Kit.toast("Gagal menyalin"); }
        ta.remove();
      }
    },

    download(filename, content, type) {
      const blob = new Blob([content], { type: type || "text/plain;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    },

    modal(html, onMount) {
      const back = document.createElement("div");
      back.className = "modal-backdrop";
      back.innerHTML = '<div class="modal" role="dialog" aria-modal="true">' + html + "</div>";
      const close = () => back.remove();
      back.addEventListener("click", (e) => { if (e.target === back || e.target.closest("[data-close]")) close(); });
      document.body.appendChild(back);
      if (onMount) onMount(back.querySelector(".modal"), close);
      const first = back.querySelector("input, select, textarea, button");
      if (first) first.focus();
      return close;
    },

    /* ---------- Sumber kunjungan (UTM) ---------- */
    captureUtm() {
      const q = new URLSearchParams(location.search);
      const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];
      const found = {};
      keys.forEach((k) => { if (q.get(k)) found[k] = q.get(k); });
      if (Object.keys(found).length) {
        found.at = new Date().toISOString();
        Kit.store("kit_utm").set(found);
      }
    },
    source() {
      const u = Kit.store("kit_utm").get(null);
      if (!u) return "langsung";
      return [u.utm_source, u.utm_medium, u.utm_campaign].filter(Boolean).join(" / ");
    },

    /* ---------- Pelacakan iklan ---------- */
    initTracking() {
      if (cfg().metaPixelId) {
        /* Kode dasar Meta Pixel */
        !function (f, b, e, v, n, t, s) {
          if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
          if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
          t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
        }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
        window.fbq("init", cfg().metaPixelId);
        window.fbq("track", "PageView");
      }
      if (cfg().ga4Id) {
        const s = document.createElement("script");
        s.async = true;
        s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(cfg().ga4Id);
        document.head.appendChild(s);
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag("js", new Date());
        window.gtag("config", cfg().ga4Id);
      }
    },
    track(eventName, params) {
      const p = Object.assign({ product: cfg().product || "" }, params || {});
      try { if (window.fbq) window.fbq("track", eventName, p); } catch (e) {}
      try { if (window.gtag) window.gtag("event", eventName, p); } catch (e) {}
      const log = Kit.store("kit_events").get([]);
      log.push({ e: eventName, at: new Date().toISOString(), src: Kit.source() });
      Kit.store("kit_events").set(log.slice(-200));
    },

    /* ---------- WhatsApp ---------- */
    waNumber() { return String(cfg().waNumber || "").replace(/\D/g, ""); },
    waLink(text, number) {
      const n = String(number || Kit.waNumber()).replace(/\D/g, "").replace(/^0/, "62");
      return "https://wa.me/" + n + "?text=" + encodeURIComponent(text);
    },
    /* Membuka WhatsApp ke nomor tim produk. Sumber kunjungan ditambahkan di akhir pesan
       supaya tim bisa mencatat chat ini datang dari iklan atau kanal mana. */
    openWa(text, eventName, params) {
      if (!Kit.waNumber()) {
        Kit.toast("Nomor WhatsApp tim belum diisi di config.js");
        return false;
      }
      const msg = text + "\n\n(Sumber: " + Kit.source() + ")";
      Kit.track(eventName || "Contact", params);
      window.open(Kit.waLink(msg), "_blank", "noopener");
      return true;
    },
    /* Tombol dengan atribut data-wa="isi pesan" otomatis membuka WhatsApp tim */
    bindWaButtons() {
      document.addEventListener("click", (e) => {
        const el = e.target.closest("[data-wa]");
        if (!el) return;
        e.preventDefault();
        Kit.openWa(el.getAttribute("data-wa"), el.getAttribute("data-event") || "Lead", { cta: el.getAttribute("data-cta") || "" });
      });
    },

    /* ---------- Base64 URL-safe untuk data di tautan ---------- */
    encode(obj) {
      const bytes = new TextEncoder().encode(JSON.stringify(obj));
      let bin = "";
      bytes.forEach((b) => { bin += String.fromCharCode(b); });
      return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    },
    decode(str) {
      try {
        let s = String(str).trim().replace(/-/g, "+").replace(/_/g, "/");
        while (s.length % 4) s += "=";
        const bin = atob(s);
        const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
        return JSON.parse(new TextDecoder().decode(bytes));
      } catch (e) { return null; }
    },

    /* Tahun berjalan di footer */
    fillYear() { Kit.$$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); }); }
  };

  window.Kit = Kit;
  document.addEventListener("DOMContentLoaded", () => {
    Kit.captureUtm();
    Kit.initTracking();
    Kit.bindWaButtons();
    Kit.fillYear();
  });
})();
