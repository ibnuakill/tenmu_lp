/* ==========================================================================
   TenMu landing page — data rilis live dari Supabase `app_versions`
   ========================================================================== */

const CFG = {
  supabaseUrl: "https://axtkquxgojewinwdndtt.supabase.co",
  anonKey: "sb_publishable_ZREX99FnrmwrdqSn4x7Afw_qFLnjP9F",
  // Dipakai kalau request gagal (offline / rate limit / RLS berubah)
  fallback: {
    version: "1.2.8",
    size: 37265646,
    date: "2026-11-01T13:53:37+00:00",
    changelog:
      "Pengaturan Akun untuk pemilik UMKM sekarang terpisah dari panel admin: bisa ubah nama dan foto profil, serta tampilan ikut mode terang/gelap.",
    arm64:
      "https://axtkquxgojewinwdndtt.supabase.co/storage/v1/object/public/app-releases/tenmu-1.2.8-arm64-v8a.apk",
    arm32:
      "https://axtkquxgojewinwdndtt.supabase.co/storage/v1/object/public/app-releases/tenmu-1.2.8-armeabi-v7a.apk",
  },
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- util ---------- */
function formatSize(bytes) {
  if (!bytes || bytes < 1024) return "—";
  const mb = bytes / 1048576;
  return (mb >= 10 ? Math.round(mb) : Math.round(mb * 10) / 10) + " MB";
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function formatDateShort(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function setText(sel, value) {
  $$(sel).forEach((el) => {
    if (value) el.textContent = value;
  });
}

/* ---------- ambil rilis terbaru ---------- */
async function fetchRelease() {
  const url =
    CFG.supabaseUrl +
    "/rest/v1/app_versions?select=version_name,version_code,apk_url,apk_variants,apk_size,changelog,created_at" +
    "&is_active=eq.true&order=version_code.desc&limit=1";

  const res = await fetch(url, {
    headers: { apikey: CFG.anonKey, Authorization: "Bearer " + CFG.anonKey },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const rows = await res.json();
  if (!Array.isArray(rows) || !rows.length) throw new Error("kosong");

  const row = rows[0];
  const variants = row.apk_variants || {};
  return {
    version: row.version_name || CFG.fallback.version,
    size: row.apk_size || 0,
    date: row.created_at || "",
    changelog: row.changelog || "",
    arm64: variants["arm64-v8a"] || row.apk_url || CFG.fallback.arm64,
    arm32: variants["armeabi-v7a"] || row.apk_url || CFG.fallback.arm32,
  };
}

/* ---------- jumlah tempat ---------- */
async function fetchPlaceCount() {
  const url =
    CFG.supabaseUrl + "/rest/v1/places?select=id&verification_status=eq.verified&order=id.asc&limit=1000";

  // GET (bukan HEAD) supaya tidak bergantung pada perilaku preflight browser.
  // Jumlah diambil dari header Content-Range, atau panjang array sebagai cadangan.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          apikey: CFG.anonKey,
          Authorization: "Bearer " + CFG.anonKey,
          Prefer: "count=exact",
          Range: "0-999",
        },
        cache: "no-store",
      });
      if (!res.ok) throw new Error("HTTP " + res.status);

      const range = res.headers.get("content-range") || "";
      const fromHeader = parseInt(range.split("/")[1], 10);
      if (Number.isFinite(fromHeader)) return fromHeader;

      const rows = await res.json();
      if (Array.isArray(rows)) return rows.length;
      throw new Error("format tak dikenal");
    } catch (err) {
      if (attempt === 1) throw err;
      await new Promise((r) => setTimeout(r, 600));
    }
  }
}

/* ---------- animasi angka ---------- */
function countUp(el, target) {
  if (!el || !Number.isFinite(target)) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const visible = document.visibilityState === "visible";
  if (reduce || !visible) {
    el.textContent = String(target);
    return;
  }
  const dur = 900;
  const start = performance.now();
  // Jaring pengaman: rAF bisa berhenti kalau tab tidak aktif.
  setTimeout(() => {
    el.textContent = String(target);
  }, dur + 250);
  function tick(now) {
    const p = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = String(Math.round(target * eased));
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ---------- render rilis ---------- */
function renderRelease(rel) {
  const size = formatSize(rel.size);

  setText("[data-version]", rel.version);
  setText("[data-badge-version]", "Versi " + rel.version + " untuk Android");
  setText("[data-meta-version]", "Diperbarui " + formatDateShort(rel.date));
  setText("[data-size]", size);
  setText("[data-stat-size]", size);
  setText("[data-inline-size]", size);
  setText("[data-release-date]", formatDate(rel.date));
  $$("[data-download-size]").forEach((el) => {
    el.textContent = "· " + size;
  });

  const notes = $("[data-changelog]");
  if (notes) {
    notes.textContent = rel.changelog
      ? rel.changelog.replace(/\r/g, "").trim()
      : "Rilis terbaru TenMu untuk Android.";
  }

  $$("[data-download-primary]").forEach((a) => {
    a.href = rel.arm64;
    a.setAttribute("download", "");
    a.setAttribute("rel", "noopener");
  });

  const alt = $("[data-download-alt]");
  if (alt) {
    alt.href = rel.arm32;
    alt.setAttribute("download", "");
  }
}

/* ---------- init ---------- */
function initNav() {
  const header = $("#siteHeader");
  const toggle = $("#navToggle");
  const links = $("#navLinks");

  if (toggle && header) {
    toggle.addEventListener("click", () => {
      const open = header.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
    });
    links &&
      links.addEventListener("click", (e) => {
        if (e.target.tagName === "A") {
          header.classList.remove("open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
  }

  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function initReveal() {
  const items = $$(".reveal");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        setTimeout(() => el.classList.add("in"), Math.min(i * 70, 280));
        io.unobserve(el);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
  );
  items.forEach((el) => io.observe(el));

  // Kalau halaman dibuka langsung lewat #anchor atau di-reload di tengah halaman,
  // browser melompat sebelum observer sempat mengukur posisi, jadi elemen yang
  // sudah ada di layar bisa tertinggal transparan. Sapu sekali tiap posisi berubah.
  const sweep = () => {
    const limit = window.innerHeight * 0.96;
    items.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < limit && r.bottom > 0) {
        el.classList.add("in");
        io.unobserve(el);
      }
    });
  };
  window.addEventListener("load", () => setTimeout(sweep, 250));
  window.addEventListener("hashchange", () => setTimeout(sweep, 200));
  // Lompatan ke #anchor bisa berjalan halus (smooth) dan baru mendarat setelah
  // observer tenang, jadi sapu beberapa kali di awal umur halaman.
  [0, 150, 400, 800, 1400, 2200, 3200].forEach((t) => setTimeout(sweep, t));
}

function initYear() {
  const y = $("#year");
  if (y) y.textContent = String(new Date().getFullYear());
}

async function initData() {
  // Statistik tempat
  fetchPlaceCount()
    .then((n) => {
      const el = $("[data-count-places]");
      if (el) countUp(el, n);
    })
    .catch(() => {
      const el = $("[data-count-places]");
      if (el) el.textContent = "—";
    });

  // Data rilis
  try {
    renderRelease(await fetchRelease());
  } catch (err) {
    console.warn("[TenMu] gagal memuat data rilis, pakai fallback:", err.message);
    renderRelease(CFG.fallback);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initReveal();
  initYear();
  initData();
});
