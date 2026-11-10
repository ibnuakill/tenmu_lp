# TenMu — Landing Page

Situs resmi (landing page + halaman legal) untuk aplikasi Android **TenMu**: peta dan direktori
UMKM di Kabupaten Cirebon.

- **Live:** https://ibnuakill.github.io/tenmu_lp/
- **Repo aplikasi:** https://github.com/ibnuakill/tenmu_mobile
- **Tanpa build step** — HTML + CSS + JS murni, tanpa framework, tanpa CDN.

## Struktur

```
.
├── index.html               # halaman utama
├── privacy.html             # kebijakan privasi
├── terms.html               # ketentuan layanan
├── delete-account.html      # instruksi hapus akun (syarat Play Store)
├── 404.html                 # halaman error
├── manifest.webmanifest     # metadata PWA
├── robots.txt / sitemap.xml # SEO
├── assets/
│   ├── css/style.css        # seluruh styling
│   ├── js/app.js            # logika: versi terbaru, ukuran file, FAQ, nav
│   ├── fonts/               # Nunito (400/600/700/800/900)
│   └── img/                 # logo, favicon, og.png
└── .github/workflows/pages.yml  # auto-deploy ke GitHub Pages
```

## Cara kerja tombol unduh

Situs **tidak menyimpan APK**. Saat halaman dibuka, `assets/js/app.js` membaca tabel
`app_versions` di Supabase (baris terbaru berdasarkan `version_code`) lalu mengisi otomatis:

- nomor versi, ukuran file, tanggal rilis, dan catatan perubahan;
- tautan unduh ke berkas APK di Supabase Storage (`app-releases` bucket).

Kalau permintaan gagal (offline, diblokir, dsb.), situs memakai data cadangan yang ditulis di
`CFG.fallbackRelease` sehingga tombol unduh tetap berfungsi.

Artinya: **rilis aplikasi baru tidak perlu menyentuh repo ini**. Cukup unggah APK + baris baru di
`app_versions`, dan situs langsung menampilkan versi terbaru.

### Mengubah data cadangan

Edit objek `fallbackRelease` di `assets/js/app.js` setiap kali rilis besar:

```js
fallbackRelease: {
  version: "1.2.8",
  size: 37265646,
  publishedAt: "2026-11-01T13:53:37+00:00",
  changelog: "...",
  apkArm64: ".../tenmu-1.2.8-arm64-v8a.apk",
  apkArm32: ".../tenmu-1.2.8-armeabi-v7a.apk",
}
```

## Deploy

Push ke `main` → GitHub Actions (`.github/workflows/pages.yml`) mengunggah seluruh isi repo sebagai
artefak Pages dan menerbitkannya.

```bash
git add -A
git commit -m "update landing page"
git push
```

Cek status deploy di tab **Actions** repo. URL situs: `https://ibnuakill.github.io/tenmu_lp/`.

### Custom domain

1. Tambahkan berkas `CNAME` berisi domain, mis. `tenmu.id`.
2. Di DNS, arahkan `A` record ke IP GitHub Pages atau `CNAME` ke `ibnuakill.github.io`.
3. Aktifkan **Enforce HTTPS** di Settings → Pages.
4. Perbarui `canonical`, `og:url`, `sitemap.xml`, dan `robots.txt` ke domain baru.

## Pratinjau lokal

```bash
python -m http.server 8099
# buka http://127.0.0.1:8099
```

## Catatan keamanan

`assets/js/app.js` memuat **Supabase URL + anon/publishable key**. Kunci ini memang dirancang untuk
dipakai di klien, tetapi keamanan data sepenuhnya bergantung pada **Row Level Security**. Pastikan:

- tabel `app_versions` hanya bisa dibaca (SELECT) oleh anon;
- tabel `places` hanya menampilkan data yang memang publik;
- tidak ada tabel lain yang terbuka untuk anon.

Jangan pernah menaruh `service_role` key di repo ini.
