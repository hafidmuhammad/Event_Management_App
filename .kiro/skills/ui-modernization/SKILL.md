---
name: ui-modernization
description: Gunakan ketika mengerjakan modernisasi UI, UI compact atau density, toolbar, dropdown menu, context menu, overflow menu, design token, theming, komponen primitif, atau refactor presentational pada Event Management App. Berisi rencana bertahap untuk menyeragamkan styling dan membangun komponen primitif yang global dan themeable, termasuk form input, modal, compose window, dan menu yang tidak menggeser layout saat dibuka.
---

# UI Modernization

Rencana eksekusi UI. Jangan jalankan tahap apa pun kecuali user secara
eksplisit meminta masuk ke pekerjaan UI.

Konsep: **Geist/Vercel-style dark ops console** untuk area dashboard,
dengan preset `stage` terpisah untuk route group `(presentation)`.

## PENTING: audit dulu sebelum mulai

Baseline di dokumen ini pernah basi total (tercatat 107 hex di 37 file,
kenyataannya sudah turun jadi 6 di 4 file karena pekerjaan manual di sela-sela).
**Selalu jalankan Tahap 0 sebelum tahap lain**, dan perbarui angka serta
registry di file ini bila berbeda.

## Aturan tetap

1. **Presentational only.** Jangan ubah logika, data fetching, server action,
   schema, validasi, atau props signature. Kalau perubahan visual menuntut
   perubahan logika, berhenti dan tanya.
2. **Nol hex di `src`**, dengan pengecualian yang disahkan:
   - `src/services/email.ts` — menghasilkan HTML email; Outlook/Gmail tidak
     mendukung CSS variables. Wajib hardcoded. Jangan sentuh.
   - `src/app/t/[token]/page.tsx` — parameter warna QR code generator
     (`toString({ color: { dark, light } })`), bukan CSS.
   - `src/app/(dashboard)/events/[eventId]/email/page.tsx` — preview email
     merender di atas kertas putih, meniru tampilan email client.
   - `src/components/email/email-builder.tsx` — preview blok email, harus
     cocok dengan warna output `services/email.ts`.
   Keempat pengecualian terakhir adalah **email/QR rendering**, bukan UI app.
3. **Nol inline `style={{ ... }}` untuk warna/spacing di `src`.**
   Ganti dengan utility class berbasis token. Inline style hanya boleh untuk
   nilai yang benar-benar dinamis saat runtime (contoh sah:
   `style={{ textAlign: block.data.align }}` di email-builder).
4. **Pertahankan aksesibilitas.** `:focus-visible`, atribut aria, focus trap
   pada modal/dialog, pengembalian fokus ke pemicu, scroll lock,
   `prefers-reduced-motion`, min-height tombol di mobile, dan
   `responsive-table` behavior harus tetap ekuivalen.
5. **Struktur DOM ekuivalen.** Boleh memecah baris JSX panjang; urutan elemen
   dan atribut aria tidak berubah.
6. **Light mode tetap didukung.** Dark default, light varian token.
7. **Verifikasi tiap tahap.** `pnpm` tidak ada di PATH shell ini — pakai:
   `npx.cmd tsc --noEmit`, `npx.cmd eslint src`, `npx.cmd next build`,
   `npx.cmd vitest run`. Tahap belum selesai sebelum keempatnya hijau.
8. **Compact by default.** Semua primitif baru mengikuti skala di bagian
   "Gaya: compact + toolbar". Jangan menulis ukuran ad-hoc (`h-11`, `p-6`,
   `text-lg`) di luar skala itu.
9. **Menu tidak boleh menggeser layout.** Setiap menu, dropdown, popover,
   tooltip, dan context menu wajib melayang di atas halaman (lihat
   "Kontrak non-reflow"). Dilarang memakai `<details>` atau panel in-flow
   untuk menu.

---

## Gaya: compact + toolbar

Tujuan: UI padat seperti aplikasi desktop. Aksi sekunder disembunyikan di
toolbar atau menu yang rapi, dan membukanya tidak menggeser apa pun, mirip
klik kanan di Windows.

### Skala compact

Diterapkan lewat token, bukan class per komponen, sehingga bisa diganti
dengan satu atribut `data-density="compact|comfortable"` di `<html>`.
Default: `compact`.

| Token | Compact | Comfortable |
|---|---|---|
| `--control-h-sm` | 28px | 32px |
| `--control-h-md` | 32px | 40px |
| `--control-h-lg` | 40px | 48px |
| `--row-h` (tabel) | 32px | 44px |
| `--space-card` | 12px | 20px |
| `--space-section` | 16px | 24px |
| `--text-base` | 13px | 14px |
| `--text-label` | 11px | 12px |
| `--topbar-h` | 48px | 60px |
| `--sidebar-w` / collapsed | ≤224px / 56px | 256px / 64px |
| ikon | 16px, stroke 1.75 | 18px |

Aturan tambahan:
- Card in-flow tanpa shadow, cukup border 1px. Shadow hanya untuk elemen
  melayang (menu, popover, modal, toast).
- Angka statistik `text-2xl tabular-nums` (bukan `text-3xl`), judul halaman
  `text-xl`, gap grid `gap-2`/`gap-3`.
- Pointer sentuh (`@media (pointer: coarse)`) dan layar ≤639px otomatis
  kembali ke `comfortable`. Itu melanjutkan aturan `min-height: 40px` yang
  sudah ada di `globals.css`. Target sentuh 28px terlalu kecil untuk jari.
- Pengecualian default ke `comfortable`: `checkin-console.tsx` dan area
  `presentation`. Check-in dipakai receptionist dan kemungkinan di layar
  sentuh. Konfirmasi dengan user sebelum memadatkannya.
- Tinggi kontrol minimum 28px tetap di atas batas target 24px pada WCAG 2.2
  AA, tapi kepatuhan penuh butuh uji manual dengan teknologi bantu.

### Aturan toolbar: berapa yang boleh terlihat

- **Maksimal 2 aksi terlihat per card, baris, atau header halaman**:
  1 primer, 1 sekunder. Aksi ke-3 dan seterusnya masuk menu overflow `⋯`.
- **Aksi destruktif selalu di dalam menu**, dipisah separator, di paling
  bawah, berwarna `danger`, dan tetap lewat `ConfirmDialog`.
- **Baris tabel**: satu kolom aksi selebar tetap (40px) berisi tombol `⋯`.
  Klik baris atau nama = aksi utama. Lebar kolom tidak boleh berubah.
- **Toolbar editor** (`email-builder`, `rich-text-editor`): `role="toolbar"`,
  tombol ikon dengan tooltip, dikelompokkan dengan separator, tinggi tetap
  32px. Saat sempit, kelompok sekunder masuk menu overflow. Jangan biarkan
  `flex-wrap` menambah baris, karena itu mengubah tinggi dan menggeser konten
  di bawahnya. `.compose-toolbar` sekarang memakai `flex-wrap`, jadi ini
  perlu diganti.
- Kontrol kecil per-blok seperti `<select>` perataan dan gaya list di
  `email-builder` diganti toggle group ikon (rata kiri/tengah/kanan) atau
  dipindah ke popover blok.
- **Context menu (klik kanan)** hanya sebagai penguat, bukan satu-satunya
  jalan. Setiap baris atau card yang punya context menu tetap wajib punya
  tombol `⋯` yang menampilkan isi menu yang sama. Alasannya: klik kanan tidak
  terlihat, tidak ada di layar sentuh, dan tidak semua orang tahu. Keyboard
  (`Shift+F10` / tombol Menu) harus membukanya juga.

Titik panas (jumlah tombol `btn-*` inline per file, dari Tahap 0):
`participants/page.tsx` (11), `email-builder.tsx` (9),
`committee-editor.tsx` (7), `doorprize/page.tsx` (6),
`checkin-console.tsx` (6, dikecualikan dari compact),
`library/contacts/page.tsx` (5), `rich-text-editor.tsx` (5),
`events/[eventId]/email/page.tsx` (5), `template-form.tsx` (4),
`feedback-provider.tsx` (4, tombol tutup toast, bukan kandidat menu).
Total 118 pemakaian di 41 file.

### Kontrak non-reflow

Ini yang membuat menu terasa seperti klik kanan Windows. Semua poin harus
benar, dan harus diuji (lihat Definition of done).

1. **Panel keluar dari alur dokumen.** Di-portal dan memakai
   `position: fixed`, atau Popover API (top layer). Dibuka = nol elemen lain
   berpindah. Implementasi `action-menu.tsx` sekarang melanggar ini:
   memakai `<details>` dengan panel `my-2 grid` in-flow, jadi tombol dan
   konten di bawahnya terdorong turun saat dibuka.
2. **Tidak terpotong `overflow`.** 17 file memakai `overflow-hidden/auto`.
   Panel in-flow akan terpotong di dalamnya, panel yang di-portal tidak.
3. **Di dalam modal, portal ke dalam `<dialog>`-nya.** `Dialog` memakai
   `showModal()`, yang menaruh modal di top layer. Menu yang di-portal ke
   `document.body` akan muncul di belakang modal. Solusinya: portal container
   = elemen `<dialog>` terdekat (atau pakai Popover API yang ikut top layer).
   `ComposeWindow` dan toast (`z-[200]`) punya masalah serupa, jadi uji menu
   di dalam masing-masing.
4. **Tidak ada lompatan scrollbar.** Sekarang
   `body:has(dialog[open]) { overflow: hidden }` tanpa `scrollbar-gutter`,
   jadi di Windows (scrollbar klasik) halaman melompat sekitar 15px saat modal
   dibuka. Tambahkan `html { scrollbar-gutter: stable }`. Menu non-modal
   (`modal={false}` bila memakai Radix) tidak boleh mengunci scroll sama
   sekali.
5. **Trigger tidak berubah ukuran** saat terbuka. Tidak ada pertukaran
   label, tidak ada penambahan border yang mengubah box.
6. **Collision handling.** Panel flip dan shift agar tetap di dalam viewport
   dengan jarak 8px dari tepi. Bila tinggi tidak muat, `max-height` dengan
   scroll internal. Menu tidak pernah keluar layar.
7. **Muncul instan.** Tanpa animasi tinggi atau lebar. Opacity atau
   scale ≤120ms, dan dimatikan oleh `prefers-reduced-motion`.
8. **Penutupan.** `Esc`, klik di luar, memilih item, atau scroll halaman
   menutupnya. Fokus kembali ke trigger.
9. **Keyboard dan ARIA.** `aria-haspopup="menu"`, `aria-expanded`,
   `role="menu"` / `menuitem`, panah atas/bawah, `Home`/`End`, typeahead,
   `Enter`/`Space`.
10. **Menu bisa dibuka dari trigger yang berada di posisi mana pun**, termasuk
    tepi kanan layar atau baris terakhir tabel, tanpa menambah tinggi
    halaman atau memunculkan scrollbar baru.

### Implementasi yang direkomendasikan

Pakai primitif headless yang sudah menyelesaikan poin 3, 6, dan 9, jangan
menulis ulang:

- `@radix-ui/react-dropdown-menu` dan `@radix-ui/react-context-menu`
  (MIT), pin versi saat dipasang. Gunakan `Portal` dengan `container`
  mengarah ke dialog terdekat bila trigger berada di dalam modal.
- Alternatif tanpa dependency baru: atribut `popover` bawaan browser
  ditambah penempatan manual. Tapi collision handling dan typeahead harus
  ditulis sendiri. Pilih jalur ini hanya bila user tidak ingin dependency
  baru. **Tanyakan ke user sebelum memasang dependency.**

Jebakan yang pasti muncul saat memindahkan aksi ke dalam menu:

- Item yang membuka modal (`ModalTrigger`, `ActionForm` dengan `confirm`,
  `ComposeTrigger`). Jika modalnya dirender di dalam konten menu, modal ikut
  hilang begitu menu menutup. State buka/tutup modal harus diangkat ke luar
  konten menu. Contoh nyata: `committee/page.tsx` menaruh `ModalTrigger`
  di dalam `ActionMenu`.
- Item tanpa efek visual, seperti `CopyLinkButton`. Menu menutup setelah
  klik, jadi umpan baliknya harus lewat toast `FeedbackProvider`, bukan
  perubahan label tombol.
- Item `<form>`/submit. Pastikan menutup menu tidak membatalkan submit.

---

## Tahap 0 — Audit (wajib, selalu pertama)

```
Jalankan Tahap 0 dari skill ui-modernization: audit.
Jangan ubah file apa pun. Hanya laporkan.

1. Hitung hex literal di src, per file.
2. Hitung inline style={{ }} di src, per file.
3. Daftar semua file di src/components (rekursif).
4. Daftar semua utility class di @layer components pada globals.css.
5. Daftar semua CSS variable yang terdefinisi di globals.css.
6. Cek apakah ada override !important yang memetakan class hex lama
   (bg-[#...], text-[#...]) — lalu cek apakah class itu masih punya
   pemakai di src. Yang nol pemakai adalah dead code.
7. Bandingkan hasil dengan Baseline dan Component Registry di skill ini.
   Laporkan setiap selisih, lalu perbarui skill sebelum lanjut.
```

Perintah audit:

```powershell
# hex per file
Get-ChildItem -Recurse -Path src -Include *.tsx,*.ts |
  Select-String -Pattern '#[0-9A-Fa-f]{6}' |
  Group-Object Path | Sort-Object Count -Descending |
  ForEach-Object { "{0,3}  {1}" -f $_.Count, $_.Name }

# inline style per file
Get-ChildItem -Recurse -Path src -Include *.tsx |
  Select-String -Pattern 'style=\{\{' |
  Group-Object Path | Sort-Object Count -Descending |
  ForEach-Object { "{0,3}  {1}" -f $_.Count, $_.Name }

# utility class di globals.css
(Select-String -Path src\app\globals.css -Pattern '^\s*\.[a-z-]+' |
  ForEach-Object { ($_.Line.Trim() -split '[ ,{]')[0] } | Sort-Object -Unique) -join ', '

# token yang terdefinisi
(Select-String -Path src\app\globals.css -Pattern '^\s*--[a-z-]+:' |
  ForEach-Object { ($_.Line.Trim() -split ':')[0] } | Sort-Object -Unique) -join ', '
```

---

## Baseline

Diukur ulang pada Tahap 0 terakhir (8 Okt 2026). **Verifikasi lagi lewat Tahap 0.**

- **6 hex literal di 4 file** — keempatnya masuk daftar pengecualian
  (Aturan 2): `services/email.ts` (3), `email/page.tsx` (1),
  `email-builder.tsx` (1), `t/[token]/page.tsx` (1).
  Pekerjaan "hapus hex" di `src` sudah selesai.
- **30 inline `style={{ }}` di 15 file.** Ini pekerjaan utama sekarang.
  Terberat: `email-builder.tsx` (10), `app-frame.tsx` (3),
  `library/contacts/[listId]/loading.tsx` (3), `recipient-editor.tsx` (2),
  `template-form.tsx` (2). Sisanya masing-masing 1.
- **78 nama utility class unik** di globals.css (245 baris, 29 `@apply`).
  Sudah mencakup token helper (`.ink`, `.ink-muted`, `.surface-card`,
  `.surface-raised`), nav (`.nav-item*`), dan compose window (`.compose-*`).
  Angka "~90" di versi sebelumnya menghitung varian `:hover`/`::placeholder`.
- **Palet Tailwind lama nol pemakai.** `tailwind.config.ts` masih mendefinisikan
  `sky/sun/leaf/coral/berry/ink/outline/surface` (hex Primer), `shadow-card`,
  `rounded-card`, `font-display`, `font-body`. Dicek di `.ts/.tsx` dan
  `globals.css`: nol pemakai. Aman dihapus di Tahap 1 tanpa migrasi.
  **Kecuali `font-mono`**, dipakai di 5 file (`tickets/page.tsx`,
  `contacts/[listId]/page.tsx`, `t/[token]/page.tsx`, `checkin-console.tsx`,
  `email-builder.tsx`). Pertahankan atau petakan ke Geist Mono.
- **Tidak ada dependency UI.** `class-variance-authority`, `tailwind-merge`,
  `clsx`, `lucide-react`, `@radix-ui/*`, `geist` semuanya belum terpasang.
  `next/font` dipakai 0 kali.
- **29 CSS variable** terdefinisi: `--background`, `--surface`,
  `--surface-raised`, `--surface-sunken`, `--paper`, `--paper-ink`,
  `--paper-ink-muted`, `--paper-outline`, `--ink`, `--ink-strong`,
  `--ink-muted`, `--ink-subtle`, `--outline`, `--outline-soft`,
  `--outline-strong`, `--sky`, `--sky-soft`, `--link`, `--accent`,
  `--success`, `--success-ink`, `--success-soft`, `--warning-ink`,
  `--warning-soft`, `--error`, `--error-ink`, `--error-soft`,
  `--neutral-soft`, `--sidebar-width`.
- **Dead code**: `globals.css` baris 74–83, sepuluh override `!important`
  yang memetakan class hex lama ke token. Semua class itu sudah nol
  pemakai di `src`. Hapus di Tahap 1.
- Theming masih memakai `html.theme-light` (class): 25 selector di
  globals.css. `data-theme` dan `data-density` dipakai 0 kali.
- `fontFamily.display` (Hubot Sans) terdefinisi di `tailwind.config.ts`
  tapi tidak ada font di-load via `next/font`.
- Belum ada icon library. Ikon masih glyph teks (`⌂`, `◈`, `✉`, `«`, `»`).
- Belum ada primitif React: tidak ada Button/Card/Input/Table/Modal
  sebagai komponen. Semua masih class string.
- Tailwind 3.4.17. Semua tahap jalan di v3; migrasi v4 di luar skill ini.
- **Menu**: hanya satu, `action-menu.tsx`, dipakai di satu tempat
  (`committee/page.tsx`). Berbasis `<details>` dengan panel in-flow, jadi
  mendorong konten saat dibuka.
- **Tombol aksi inline**: 118 pemakaian `btn-*` di 41 file, tanpa pola
  overflow. Kebanyakan baris aksi dibiarkan terlihat semua.
  Definisi hitung: `btn-(small-)?(outline|danger|primary)`. Versi lama (94/35)
  tidak menghitung `btn-primary`, jadi kedua angka tidak bisa dibandingkan.
- **Menu/popover**: `role="menu"` 0, atribut `popover` 0, `<details>` 1.
  `createPortal` dipakai di `dialog.tsx`, `compose-window.tsx`,
  `feedback-provider.tsx`.
- **Overflow container**: 17 file memakai `overflow-hidden/auto/x-auto`.
- **Modal** memakai `showModal()` (top layer). `body:has(dialog[open])`
  mengunci scroll tanpa `scrollbar-gutter`.
- `.compose-toolbar` memakai `flex-wrap`, yang bisa menambah tinggi.
- Tidak ada density token. Ukuran kontrol tersebar sebagai `min-h-*`.

---

## Component Registry

Saat user menyebut nama area, kerjakan **hanya** file di baris itu.
Angka `(h)` = hex, `(s)` = inline style pada audit terakhir.

| Area | File |
|---|---|
| `layout` | `src/components/layout/` → `app-frame.tsx` (s3), `dashboard-shell.tsx` (s1), `dashboard-navigation.tsx`, `library-tabs.tsx` (s1), `theme-toggle.tsx`, `logout-button.tsx` |
| `ui-overlay` | `src/components/ui/` → `modal.tsx`, `dialog.tsx`, `compose-window.tsx`, `action-menu.tsx`, `feedback-provider.tsx` |
| `ui-form` | `src/components/ui/action-form.tsx`, `src/components/events/registration-fields.tsx`, `confirm-action-button.tsx`, `asset-upload-field.tsx` |
| `ui-core` | `src/components/ui/` → `brand-mark.tsx`, `status-pill.tsx`, `skeleton.tsx` |
| `auth` | `src/app/(auth)/layout.tsx`, `(auth)/login/page.tsx`, `src/components/auth/login-form.tsx` |
| `dashboard` | `src/app/(dashboard)/dashboard/page.tsx`, `(dashboard)/loading.tsx` |
| `events-list` | `src/app/(dashboard)/events/page.tsx`, `events/loading.tsx`, `events/new/`, `events/[eventId]/page.tsx`, `events/[eventId]/loading.tsx`, `events/[eventId]/edit/`, `events/[eventId]/settings/` |
| `events-forms` | `src/components/events/` → `event-form.tsx` (s1), `committee-editor.tsx` (s1), `award-reorder-form.tsx`, `award-display.tsx`, `activity-list.tsx`, `copy-link-button.tsx`, `event-tabs.tsx` |
| `events-subpages` | `src/app/(dashboard)/events/[eventId]/` → `participants/`, `participants/[participantId]/`, `tickets/`, `check-in/`, `email/` (h1, pengecualian), `doorprize/`, `awards/`, `committee/`, `display/` |
| `checkin` | `src/components/checkin/checkin-console.tsx` |
| `email-ui` | `src/components/email/` → `email-builder.tsx` (h1 pengecualian, s10), `template-form.tsx` (s2), `global-template-form.tsx`, `recipient-editor.tsx` (s2), `rich-text-editor.tsx`, `send-test-form.tsx`, `broadcast-button.tsx` |
| `library` | `src/app/(dashboard)/library/` → `layout.tsx`, `page.tsx`, `email-templates/page.tsx` (s1), `email-templates/loading.tsx` (s1), `contacts/page.tsx`, `contacts/loading.tsx` (s1), `contacts/[listId]/page.tsx`, `contacts/[listId]/loading.tsx` (s3) |
| `public` | `src/app/t/[token]/page.tsx` (h1, pengecualian), `src/app/events/[eventId]/register/`, `events/committee-display/[token]/` |
| `presentation` | `src/app/(presentation)/events/[eventId]/display/`, `src/components/events/presentation-controls.tsx`, `committee-credits.tsx` |
| `excluded` | `src/services/email.ts` — jangan sentuh |

Urutan eksekusi jika mengerjakan semua:
`layout` → `ui-overlay` → `ui-form` → `ui-core` → `auth` → `dashboard`
→ `events-list` → `events-forms` → `events-subpages` → `checkin`
→ `email-ui` → `library` → `public` → `presentation`.

`layout`, `ui-overlay`, `ui-form`, dan `ui-core` berisi primitif yang dipakai
area lain, jadi harus stabil lebih dulu. `presentation` terakhir karena
punya preset tema sendiri.

---

## Tahap 1 — Fondasi token + primitif

Prasyarat: Tahap 0 selesai, baseline terverifikasi.
Scope: `globals.css`, `tailwind.config.ts`, `src/app/layout.tsx`,
dan file baru di `src/components/ui/`. Jangan ubah halaman lain.

```
Jalankan Tahap 1 dari skill ui-modernization: fondasi token + primitif.
Jangan ubah file halaman atau komponen lain selain scope.

1. globals.css
   - Rapikan 29 token yang sudah ada menjadi set semantik lengkap dan
     konsisten. Tambahkan yang belum ada: --overlay, --primary,
     --primary-fg, --primary-soft, --info*, --radius-sm/md/lg,
     --shadow-sm/md/lg.
   - Pindahkan definisi nilai ke [data-theme="dark"] dan [data-theme="light"],
     menggantikan mekanisme class html.theme-light.
   - HAPUS baris 74-83: sepuluh override !important yang memetakan class
     hex lama. Sudah dikonfirmasi nol pemakai. Verifikasi ulang dengan
     grep sebelum menghapus.
   - Sisakan hanya satu !important yang sah: blok prefers-reduced-motion.

2. tailwind.config.ts — map semua token ke utility semantik
   (bg-surface, text-fg-muted, border-border, bg-primary, rounded-md,
   shadow-sm). Hapus palet lama (sky/sun/leaf/coral/ink/outline/surface)
   hanya setelah token pengganti lengkap.

3. src/app/layout.tsx — load Geist Sans + Geist Mono via next/font,
   set data-theme pada <html>, perbaiki inline theme script agar menulis
   atribut data-theme bukan class. Migrasikan nilai localStorage lama
   ("event-theme" = "light") agar tidak break. Hindari FOUC.

4. src/components/ui — buat primitif dengan class-variance-authority
   + tailwind-merge (dependency baru, versi di-pin):

   Dasar:
   - Button: variant primary/secondary/outline/ghost/danger,
     size sm/md/lg, dukung asChild dan state loading
   - Card + CardHeader/CardTitle/CardDescription/CardContent/CardFooter
   - Badge dengan variant status (positive/warning/negative/neutral)
   - Stat: label + value (tabular-nums) + hint
   - Table + Thead/Tbody/Tr/Th/Td, sticky header,
     pertahankan responsive-table behavior
   - EmptyState, Alert, Skeleton, Tabs

   Form (lengkap, ini yang dipakai paling banyak):
   - Field: wrapper label + kontrol + hint + error, dengan id/aria-describedby
     dan aria-invalid yang terhubung otomatis
   - Input, Textarea, Select, Checkbox, Radio, RadioGroup, Switch,
     FileInput, Label, FieldError, Fieldset
   - FormActions: baris tombol submit/cancel yang konsisten

   Overlay (JANGAN dilewatkan):
   - Modal / Dialog: bangun di atas <dialog> seperti implementasi sekarang,
     pertahankan focus trap, pengembalian fokus ke pemicu, scroll lock,
     dan konfirmasi saat menutup form yang belum disimpan
   - ConfirmDialog: varian khusus konfirmasi destruktif
   - Sheet / Drawer untuk panel mobile
   - DropdownMenu: generalisasi action-menu.tsx
   - Tooltip, Popover
   - ComposeWindow: pertahankan perilaku docked/full/minimized yang ada,
     tapi pindahkan ~20 class .compose-* ke varian komponen

   Semua memakai token. Nol hex, nol inline style warna.

4b. Compact dan toolbar (baca bagian "Gaya: compact + toolbar" dulu):
   - Tambahkan density token dan atribut html data-density="compact"
     sebagai default. Pointer coarse dan layar <=639px kembali ke
     comfortable. Tambahkan html { scrollbar-gutter: stable }.
   - Primitif baru: IconButton (wajib aria-label + tooltip), Toolbar
     (role="toolbar", roving tabindex, separator, ToolbarGroup),
     ToggleGroup, DropdownMenu (item, separator, label, ikon, shortcut,
     varian danger, submenu), ContextMenu, OverflowMenu (tombol ⋯ yang
     membungkus DropdownMenu), Tooltip.
   - Ganti isi action-menu.tsx dengan OverflowMenu yang memenuhi
     "Kontrak non-reflow" butir 1-10. Pertahankan nama ekspor ActionMenu
     dan props { label, children } supaya committee/page.tsx tidak berubah.
   - Tanyakan ke user dulu: pasang Radix (dropdown-menu, context-menu)
     atau pakai Popover API tanpa dependency baru.
   - Menu di dalam modal: portal container = dialog terdekat.
     Sediakan hook useOverlayContainer() agar tidak diulang per komponen.
   - Bangun halaman uji sementara untuk memverifikasi non-reflow dan
     hapus setelah selesai.

5. Tambahkan lucide-react (versi di-pin). Siapkan peta pengganti untuk
   glyph teks yang dipakai sekarang: ⌂ → Home, ◈ → CalendarDays,
   ✉ → Mail/Library, « » → PanelLeftClose/PanelLeftOpen.

JANGAN hapus utility lama di @layer components pada tahap ini —
~90 class masih dipakai. Penghapusan terjadi di Tahap 2b.

Verifikasi: npx.cmd tsc --noEmit, npx.cmd eslint src,
npx.cmd next build, npx.cmd vitest run.
```

### Definition of done

- `globals.css` hanya punya satu `!important` (prefers-reduced-motion).
- Density token ada; `data-density` mengubah ukuran seluruh kontrol.
- Toggle `data-theme` mengubah seluruh warna tanpa override.
- Primitif lengkap dan type-safe, termasuk **form dan overlay**.
- Modal masih lolos uji aksesibilitas: focus trap, focus return, scroll lock.
- `font-display` benar-benar aktif di browser.
- Utility lama masih ada, build hijau.
- **Uji non-reflow, manual di browser** (build hijau tidak membuktikan ini):
  1. DevTools > Rendering > centang "Layout Shift Regions". Buka dan tutup
     menu. Tidak boleh ada area biru berkedip di konten.
  2. Buka menu dari trigger di baris terakhir tabel dan di tepi kanan
     layar. Menu flip dan shift, halaman tidak bertambah tinggi, tidak ada
     scrollbar baru.
  3. Buka menu di dalam modal dan di dalam ComposeWindow. Menu muncul di
     atasnya, bukan di belakang.
  4. Buka dan tutup modal di Windows dengan scrollbar klasik. Lebar konten
     tidak melompat.
  5. Tab ke trigger, buka dengan Enter, navigasi panah, Esc. Fokus kembali
     ke trigger.
  6. Resize ke ≤639px. Kontrol kembali ke ukuran comfortable.
  Laporkan butir mana yang tidak bisa diverifikasi, jangan klaim lolos.

---

## Tahap 2 — Migrasi komponen

Prasyarat: Tahap 1 selesai dan terverifikasi.
Scope: satu atau beberapa area dari Component Registry.

Ganti `<AREA>` dengan nama area (misal `ui-overlay`, atau `layout, ui-form`).

```
Jalankan Tahap 2 dari skill ui-modernization untuk area: <AREA>.

Baca Component Registry di skill untuk daftar file persisnya.
Kerjakan HANYA file pada area itu.

Untuk setiap file:
- Ganti sisa hex literal dengan utility token,
  KECUALI yang terdaftar sebagai pengecualian di Aturan 2.
- Ganti inline style={{ }} warna/spacing dengan utility class token.
  Pertahankan inline style hanya untuk nilai dinamis runtime.
- Ganti class string manual dengan komponen primitif:
  .btn-* → Button; .field-input/.field-label → Field + Input;
  .compact-table → Table; .stat-card → Stat; .surface-card → Card;
  .status-* → Badge; .notice-* → Alert; .empty-state → EmptyState;
  .tab-* → Tabs; .app-modal/.app-dialog → Modal;
  .compose-* → ComposeWindow; .nav-item-* → nav varian.
- Ganti glyph teks dengan ikon lucide sesuai peta di Tahap 1.
- Terapkan hirarki tipografi compact: angka statistik text-2xl
  font-semibold tabular-nums; heading halaman text-xl tracking-tight;
  label text-[11px] font-medium uppercase tracking-wide.
- Konsolidasi aksi (baca "Aturan toolbar"):
  * Hitung tombol aksi terlihat per card, baris, dan header.
  * Jika lebih dari 2, sisakan 1 primer + 1 sekunder, pindahkan sisanya
    ke OverflowMenu. Aksi destruktif selalu di menu, paling bawah,
    dengan ConfirmDialog.
  * Baris tabel: satu kolom aksi 40px berisi OverflowMenu.
  * Toolbar editor: Toolbar + IconButton + tooltip, tinggi tetap,
    tanpa flex-wrap.
  * Pilih kontrol padat: toggle group ikon menggantikan select 3 opsi.
  * Item menu yang membuka modal: angkat state modal keluar dari
    konten menu. Item tanpa efek visual: umpan balik lewat toast.
  * Jangan hapus aksi apa pun. Pindahkan saja. Laporkan daftar aksi
    sebelum dan sesudah per file, supaya kehilangan fungsi terlihat.
- Terapkan skala compact dari token, bukan ukuran ad-hoc.

Aturan tetap: presentational only, DOM dan aria ekuivalen,
jangan sentuh src/services/email.ts.

Setelah area selesai:
- Verifikasi: npx.cmd tsc --noEmit, npx.cmd eslint src,
  npx.cmd next build, npx.cmd vitest run.
- Grep hex DAN inline style yang tersisa di area ini, laporkan tiap sisa
  beserta alasannya.
- Laporkan utility lama yang sudah nol pemakai, tapi JANGAN hapus
  sampai semua area selesai.
```

### Tahap 2b — Pembersihan

```
Semua area Tahap 2 ui-modernization sudah dimigrasikan. Bersihkan:

1. Hapus utility di @layer components globals.css yang sudah nol pemakai
   di src. Konfirmasi dengan grep sebelum menghapus tiap utility.
   Target: dari ~90 class turun drastis.
2. Hapus token Tailwind lama yang tidak terpakai.
3. Grep hex di src. Hasil yang boleh muncul hanya yang terdaftar
   di Aturan 2 (services/email.ts, t/[token], email/page.tsx,
   email-builder.tsx).
4. Grep inline style={{ }} di src. Yang tersisa harus hanya nilai
   dinamis runtime; sebutkan satu per satu beserta alasannya.
5. Verifikasi keempat perintah.

Laporkan apa adanya. Build exit 0 bukan bukti migrasi visual benar.
```

---

## Tahap 3 — Theme customization

Prasyarat: Tahap 2b selesai.

```
Jalankan Tahap 3 dari skill ui-modernization: theme customization.

1. src/lib/theme/presets.ts — preset berisi nilai token saja:
   geist-dark, geist-light, brand-dryport, high-contrast, stage.
2. Inject sebagai [data-theme="..."] di globals.css.
3. Upgrade theme-toggle.tsx menjadi theme picker: persist ke localStorage
   (key "event-theme"), hormati prefers-color-scheme sebagai default,
   migrasikan nilai lama, hindari FOUC. Tambahkan pilihan density
   (compact / comfortable) yang menulis data-density di <html>,
   dipersist dan dibaca inline script yang sama agar tidak berkedip.
   Letakkan picker di dalam OverflowMenu top bar, bukan sebagai tombol
   tambahan.
4. Terapkan preset "stage" scoped di layout (presentation) saja —
   tipografi jauh lebih besar, gradient hero, aksen hangat.
   Area dashboard tidak terpengaruh.
5. Tulis .kiro/steering/design-system.md (inclusion: fileMatch,
   fileMatchPattern mencakup src/**/*.tsx): daftar token, daftar primitif
   beserta variant, dan aturan "jangan tulis hex atau inline style warna
   di src kecuali pengecualian yang terdaftar".
6. Update design.md di root agar merujuk token layer baru, dan perbarui
   baris UI di .codex/skills/project-foundation/SKILL.md yang masih
   menyebut "token Octo Code dari design.md".

Verifikasi keempat perintah, plus cek manual tiap preset
di dashboard dan di halaman presentation.
```

### Definition of done

- Ganti satu atribut `data-theme` mengubah seluruh aplikasi.
- `(presentation)` punya tema sendiri tanpa memengaruhi dashboard.
- `design-system.md` ada, sesi berikutnya otomatis konsisten.

---

## Catatan

- Pindah ke shadcn/ui penuh menuntut Tailwind v4. Jadikan tahap terpisah.
- Registry dan baseline di dokumen ini pernah basi berat. Tahap 0 bukan
  formalitas — repo berubah di antara sesi UI.
- `pnpm` tidak tersedia di PATH shell. Selalu pakai `npx.cmd`.

---

## Status: Tahap 1 selesai (8 Okt 2026)

Keputusan yang menggantikan teks Tahap 1 di atas bila bertentangan:

- **Nama token tidak diganti ke `fg-*`.** Nama lama dipertahankan
  (`--ink*`, `--outline*`, `--surface*`) karena 36 komponen dan ~78 utility
  memakainya. Tailwind memetakan: `bg-surface`, `text-ink-muted`,
  `border-outline`, `bg-primary`, `text-danger-ink`, `bg-info-soft`, dst.
  Opacity modifier (`bg-primary/20`) jalan lewat `color-mix`.
- **Nilai palet dark/light tidak diubah.** Masih Primer. Tampilan Geist
  (warna netral) adalah preset Tahap 3, bukan Tahap 1.
- **Density**: `data-density` di `<html>`, default `compact`; subtree bisa
  memilih `data-density="comfortable"` sendiri (rencana: `checkin`,
  `presentation`). Sentuh atau layar ≤639px otomatis comfortable.
  Utility Tailwind: `h-ctl-sm|md|lg`, `min-h-ctl-*`, `size-ctl-*`, `h-row`,
  `h-thead`, `p-card`, `gap-section`, `text-body`, `text-label`.
  Jika menambah nilai spacing baru, daftarkan juga di `src/lib/cn.ts`
  (tailwind-merge tidak mengenalnya otomatis).
- **tailwind-merge dipin ke 2.6.1.** Versi 3 untuk Tailwind v4; jangan naikkan
  sebelum Tailwind naik.
- **Menu**: `OverflowMenu` + `DropdownMenu` + `ContextMenu` (Radix, `modal=false`)
  untuk kode baru. `ActionMenu` (nama dan props lama) kini popover native
  `popover="manual"`, bukan Radix, karena anak-anaknya komponen (mis.
  `ModalTrigger`) yang harus tetap mounted dan menu harus tetap terbuka saat
  modal dari dalamnya tampil. Radix unmount konten saat tutup, dan `forceMount`
  membuatnya menelan Escape. Satu-satunya pemakai: `committee/page.tsx`.
  Hapus `ActionMenu` setelah call site itu dimigrasi ke `OverflowMenu` di Tahap 2.
- **Menu di dalam modal**: `Dialog` menyediakan `OverlayContainerProvider`;
  semua wrapper Radix di `ui/` otomatis di-portal ke dalam `<dialog>`.
  `ComposeWindow` bukan top layer (fixed `z-60`), menu `z-menu` (100) cukup.
  `ComposeWindow` kini mengabaikan keydown yang sudah `defaultPrevented`.
- **Hex di `globals.css`** hanya tersisa di blok token, gradient `.login-hero`,
  dan rgba backdrop. Itu bukan `src/**/*.ts(x)`, jadi tidak melanggar Aturan 2.
- Rule `[class*="..."]` dead (selain baris 74-83) ikut dihapus.
- **Package manager**: `pnpm` tidak di PATH. Pasang paket dengan
  `$env:COREPACK_ENABLE_DOWNLOAD_PROMPT=0; corepack pnpm add -E <paket>`,
  lalu `corepack pnpm install --frozen-lockfile` untuk memastikan lock sinkron.
  Jangan pakai `npm install` (node_modules berstruktur pnpm).
  `-E` tidak mem-pin bila spec memakai range (`pkg@2`); beri versi tepat.

Primitif yang ada di `src/components/ui/`: `button`, `icon-button`, `card`,
`badge`, `stat`, `table`, `empty-state`, `alert`, `tabs` (TabsNav/TabLink),
`field` (Label/Field/FieldError/Fieldset/FormActions), `controls`
(Input/Textarea/Select/Checkbox/Radio/RadioGroup/Switch/FileInput),
`tooltip`, `toolbar`, `toggle-group`, `dropdown-menu`, `context-menu`,
`overflow-menu`, `action-menu`, `overlay-container`, `menu-styles`.
Utilitas: `src/lib/cn.ts`.

**Belum dibuat** (tidak ada pemakai saat ini, dibuat saat Tahap 2 butuh):
`Sheet`/`Drawer`, `Popover`, `ConfirmDialog` baru (konfirmasi sudah ada via
`useFeedback().confirm`), serta varian komponen untuk `ComposeWindow` dan
`Modal` (masih memakai class `.compose-*` dan `.app-modal`).

**Belum diverifikasi, butuh browser** (build hijau tidak membuktikannya):
1. Uji non-reflow 6 langkah di Definition of done Tahap 1.
2. Escape di dalam `ActionMenu` yang berada di dalam `<dialog>` tidak ikut
   menutup dialog (bergantung `preventDefault` pada keydown di Chrome/Edge).
3. Fokus kembali ke tombol di menu setelah modal yang dibuka dari
   `ActionMenu` ditutup.
4. Tampilan Geist, kepadatan compact, dan light theme secara visual.
5. `popover` API butuh Chrome/Edge 114+, Safari 17+, Firefox 125+.

---

## Status: Tahap 2 area `ui-overlay` dan `ui-form` selesai (8 Okt 2026)

Area lain **belum** dimigrasikan. Tahap 2b penuh (hapus semua utility lama)
belum boleh dijalankan; hanya penghapusan yang terbukti nol pemakai sudah
dilakukan.

Dikerjakan: `dialog`, `modal`, `compose-window`, `feedback-provider`
(`action-menu` sudah selesai di Tahap 1), `action-form`,
`registration-fields`, `confirm-action-button`, `asset-upload-field`.
Hasil: 0 hex dan 0 inline style di semua file itu, glyph teks (`×`, `✕`, `–`,
`⤢`, `✓`, `!`, `i`) diganti ikon lucide, tombol memakai `Button`/`IconButton`.

Perubahan API yang perlu diingat (semua kompatibel mundur):

- `ModalTrigger` dan `ComposeTrigger`: `triggerClass` kini opsional.
  Tanpa itu, tombol memakai `variant` (default `primary`) dan `triggerSize`.
  Pemanggil yang belum dimigrasi tetap mengoper `triggerClass="btn-outline"`
  dan itu tetap menang. Setelah semua pemanggil dimigrasi, hapus `triggerClass`.
- `ConfirmActionButton`: prop baru `variant` (default `danger`) dan `size`
  (default `sm`). `className` lama tetap berlaku dan, bila memuat "danger",
  tetap membuat dialog konfirmasi destruktif.
- `RegistrationFields`: kolom wajib kini memakai `<Field required>`, jadi
  muncul tanda `*`. Label tidak lagi membungkus input (memakai `for`/`id`).
- `Dialog`: `.app-modal` dihapus; tampilan dari utility Tailwind.
  `.app-dialog` **harus dipertahankan**, hanya untuk `::backdrop`.
  `::backdrop` tidak diwarisi variabel CSS di Chrome sebelum 122, jadi scrim
  tetap memakai nilai literal di `globals.css`, bukan `var(--backdrop)`.
- Token baru `--backdrop` (utility `bg-backdrop`) untuk scrim non-pseudo,
  dipakai `ComposeWindow`. Skala z-index: `z-compose` 60, `z-menu` 100,
  `z-tooltip` 110, `z-toast` 200.

Utility dihapus dari `globals.css` (nol pemakai, dikonfirmasi grep sebelum
dan sesudah): `.app-modal`, `.app-modal-overlay`, `.compose-layer`,
`.compose-layer-minimized`, `.compose-backdrop`, `.compose-window` beserta
`-full/-docked/-minimized`, `.compose-header`, `.compose-title`,
`.compose-controls`, `.compose-control`, `.compose-body`, `.ink-strong`,
`.ink-subtle`, `.surface-raised`, `.surface-sunken`, `.tab-disabled`.
Dari 79 nama class tersisa 60, semuanya masih punya pemakai.

Jebakan untuk 2b penuh nanti:

- **Nama class dibentuk dinamis.** `compose-window-${state}` terlihat nol
  pemakai di grep padahal dipakai. Sebelum menghapus, cari juga
  template literal (`-\${`) dan pastikan pemakaiannya sudah diganti.
- Grep nama class harus memakai batas kata yang menolak `-` dan `/`
  (`(?<![\w-])nama(?![\w-])`), kalau tidak `text-ink-strong` (Tailwind) ikut
  terhitung sebagai pemakai `.ink-strong`, dan path import `ui/compose-window`
  terhitung sebagai pemakai class.
- Mengedit `globals.css` lewat PowerShell: `Set-Content -Encoding utf8`
  menambah BOM dan mengubah LF jadi CRLF. Tulis ulang dengan
  `[IO.File]::WriteAllText(path, text, New-Object Text.UTF8Encoding($false))`
  dan `Replace("`r`n","`n")`.

Pemakai terbanyak class lama yang tersisa (sasaran area berikutnya):
`ink-muted` 25 file, `eyebrow` 23, `btn-outline` 20, `field-input` 17,
`page-subtitle` 17, `page-title` 16, `btn-primary` 15, `btn-small-outline` 15,
`ink` 15, `ink-link` 13, `field-label` 11, `empty-state` 11.
Yang pemakainya tinggal satu area (cepat habis): `app-*` dan `nav-item*` di
`layout`; `login-*` di `auth`; `committee-credit*` di `presentation`;
`compose-chip/-footer/-toolbar` dan `compose-row/-line/-row-label` di `email-ui`;
`btn-danger` (1 file), `notice-warning` (`checkin`), `surface-panel` (2 file).

Belum diverifikasi di browser: `Dialog` baru (judul `text-sm`, tombol tutup
ikon), posisi `ComposeWindow` pada tiga state (full/docked/minimized) dan
menu/tooltip di atasnya, toast dengan ikon baru, tampilan `Upload` dan tanda `*`.

---

## Status: Tahap 2 area `layout` dan `auth` selesai (8 Okt 2026)

Dikerjakan: `app-frame`, `dashboard-shell`, `dashboard-navigation`,
`library-tabs`, `theme-toggle`, `logout-button`, `(auth)/layout`,
`login/page`, `login-form`. Hex 0, inline style 0, tidak ada class lama.
Inline style di seluruh `src` turun dari 30 ke 25 (12 file).

Keputusan dan perubahan perilaku:

- **Sidebar memakai token density**, bukan lebar tetap. `--sidebar-w` 14rem
  dan `--sidebar-w-collapsed` 3.5rem (compact), 16rem dan 4rem (comfortable).
  Sebelumnya 16rem dan 4.5rem, jadi sidebar kini lebih sempit di compact.
  Topbar `min-h-topbar` (48px compact). Padding halaman `px-4 py-section md:px-6`.
- `--sidebar-width`, `.app-*` (kecuali `.app-dialog`, `.app-mark-tile`),
  `.nav-item*`, `.login-*` dihapus dari `globals.css`. Gradien hero login kini
  `from-surface to-background` di kedua tema (dulu light-nya terbalik).
  Cincin dekoratif hero memakai `--sky`, jadi ikut tema.
- **ThemeToggle** kini tombol ikon (Sun/Moon) dengan `aria-label` tetap
  "Switch to dark/light mode"; sebelumnya teks "Dark/Light".
  **LogoutButton** tetap bertulisan, ditambah ikon.
- **Tombol minimize sidebar**: teks `sr-only` hanya dirender saat collapsed.
  Sebelumnya duplikat dengan label yang terlihat. `aria-pressed` dipertahankan.
- **Login**: tombol tampilkan password kini `IconButton` dengan nama
  "Show password" tetap + `aria-pressed` (dulu teks "Show"/"Hide" yang berubah).
  Kolom login tidak diberi `*` (tetap `required` di input, form `noValidate`).
- `Field` kini menerima `id` tetap (`<Field id="password">`) untuk kasus
  yang perlu `aria-controls`. Tanpa itu, jangan mengoper `id` ke `Input`:
  prop eksplisit menimpa id dari `Field` dan label berhenti menunjuk ke input.
- `backdrop-blur` di topbar dibuang (latar `bg-surface` opak, tidak ada efeknya).

**Bug di `tailwind.config.ts` ditemukan dan diperbaiki.** `token()` memanggil
`opacityValue.startsWith`, padahal Tailwind bisa mengirim angka. Build gagal
dengan `TypeError: opacityValue.startsWith is not a function`. Kini nilainya
dinormalisasi lewat `String()` dulu. Pelajaran: build yang lolos di tahap
sebelumnya belum menjalankan semua bentuk modifier opacity; jalankan build
setelah menambah class dengan `/xx` baru.

Utility terhapus (nol pemakai, dikonfirmasi grep): `.app-topbar`,
`.app-sidebar`, `.app-content`, `.app-shell-collapsed`, `.nav-item`,
`-active`, `-collapsed`, `-mobile`, `-icon`, `.login-shell`, `-frame`,
`-theme-toggle`, `-hero`, `-hero-card`, `-panel`. Dari 60 nama class
tersisa 45. Masih dipakai di area lain: `.app-mark-tile` (`brand-mark`,
area `ui-core`) dan `.app-dialog` (hanya `::backdrop`, dipertahankan).

Typography helper `.eyebrow`, `.page-title`, `.page-subtitle`,
`.section-title` sengaja tidak dimigrasikan: bukan primitif, sudah berbasis
token, dan dipakai 16-23 file. Keputusan yang masih terbuka: buat komponen
`PageHeader`, atau terima mereka sebagai utility permanen. Pilih sebelum
area `events-*`, karena paling banyak memakainya.

Jebakan tooling baru: output `npx.cmd ... ` di tool shell sering tertelan
spinner. Arahkan ke file: `cmd /c "npx.cmd next build > $env:TEMP\x.log 2>&1"`
lalu baca lognya. Jangan percaya baris "exit 0" bila lognya kosong.

Belum diverifikasi di browser: sidebar compact (lebar, collapse/expand,
transisi), topbar 48px, ikon navigasi, login (hero, cincin dekoratif, light
theme), tombol tampilkan password, tooltip ikon theme.

---

## Status: Tahap 2 area `dashboard` dan `library` selesai (8 Okt 2026)

Dikerjakan: `dashboard/page`, `(dashboard)/loading`, dan di `library/`:
`email-templates` (page, loading), `contacts` (page, loading),
`contacts/[listId]` (page, loading). Hex 0, inline style 0, class lama 0.
Inline style di seluruh `src`: 18 di 7 file (dari 25 di 12).

Konsolidasi aksi (aturan toolbar), tidak ada aksi yang dihapus:

| Lokasi | Sebelum (terlihat) | Sesudah |
|---|---|---|
| Kartu template global | Edit, Remove | Edit, menu [Remove] |
| Kartu daftar kontak | Open, Export CSV, Export Excel, Rename, Delete | Open, menu [Export CSV, Export Excel, Rename, Delete] |
| Header detail kontak | Export CSV, Export Excel, Import, Add | Import, Add, menu [Export CSV, Export Excel] |
| Baris tabel kontak | Remove | menu [Remove] |

Pola yang dipakai ulang untuk area lain:

- **Aksi destruktif dari menu**: taruh `ActionForm` tersembunyi di luar menu
  (`id`, `className="hidden"`, `footer={<></>}`), lalu pakai
  `<OverflowMenuFormItem formId=... danger>`. Item memanggil
  `form.requestSubmit()`. Jangan pakai item `type="submit"`: item bisa
  hilang dari DOM sebelum browser menjalankan aksi default klik.
  Catatan: `footer={null}` tidak cukup, `null ?? default` tetap merender
  tombol bawaan; pakai fragment kosong.
- **Modal dari menu**: pakai `Modal` terkontrol (`open`, `onOpenChange`), state
  disimpan di komponen client yang tetap mounted (lihat
  `components/library/contact-list-actions.tsx`). `ModalTrigger` kini hanya
  tombol + `Modal`; jangan menaruhnya di dalam konten menu.
- **`Card asChild`**: `<Card asChild><article>...</article></Card>` atau
  `<Card asChild><Link>...</Link></Card>` menjaga elemen semantik/link asli.
  Karena `Card` flex-col, anak `inline-flex` (StatusPill, Button) meregang:
  tambahkan `items-start`.
- `Field` dan `ActionForm` menerima `id`; `OverflowMenu` menerima `size`
  (`icon-sm` agar sejajar dengan tombol `sm`).

Perubahan perilaku yang perlu diingat:

- `CardTitle` adalah `h3`. Kartu daftar dulu memakai `h2` yang sejajar dengan
  judul seksi; hierarki heading kini benar.
- Langkah workflow di dashboard memakai ikon, bukan angka; urutan dipertahankan
  untuk pembaca layar lewat teks `sr-only` "Step n:".
- Field modal kontak memakai `Field`, jadi label memakai `for`/`id`.

Utility dihapus: `.surface-panel` (nol pemakai). Dari 79 nama class sekarang
tersisa 44. Pemakai terbanyak yang tersisa dan sasaran berikutnya:
`ink-muted` 16, `eyebrow` ~20, `btn-outline` 17, `field-input` 14,
`btn-primary` 13, `btn-small-outline` 12, `ink` 11, `ink-link` 9,
`field-label` 8, `empty-state` 7, `status-neutral` 7.

Jebakan tooling: menjalankan `next build` bersama perintah lain dalam satu
panggilan shell memotong build di tengah (log hanya 153 byte, tanpa baris
"Compiled"). Jalankan build sendirian dalam satu panggilan, lalu periksa
ukuran log dan baris `Compiled successfully` di panggilan berikutnya.

Belum diverifikasi di browser: menu `⋯` pada kartu dan baris (posisi, tidak
menggeser layout), Rename dari menu membuka modal dan menutup setelah simpan,
Delete/Remove memunculkan dialog konfirmasi lewat `requestSubmit`, link Export
dari menu mengunduh berkas, tabel kontak responsif di bawah 640px, kartu
dashboard (hover, ikon workflow).

---

## Status: Tahap 2 area `ui-core` dan `events-list` selesai (8 Okt 2026)

Dikerjakan: `skeleton`, `status-pill`, `brand-mark`, `events/page`,
`events/loading`, `events/[eventId]/page`, `events/[eventId]/loading`,
`events/[eventId]/settings/page`. `events/new/page` dan `edit/page` tidak
berubah: isinya hanya `EventForm` (area `events-forms`) dan typography helper.
Hex 0, inline style 0, class lama 0 di semua file itu.

Komponen baru:

- `ui/detail-list.tsx` (`DetailList`): pengganti `.detail-grid`. Dua kolom dari
  640px, bertumpuk di bawahnya. Pakai `<dt>` / `<dd>` langsung sebagai anak.
- `events/event-status-badge.tsx` (`EventStatusBadge`, `eventStatusVariant`):
  satu pemetaan status event ke `Badge`. Dulu `statusClass()` disalin di dua
  halaman. Area `events-subpages` (participants, tickets, doorprize, email)
  masih memakai `.status-*`; pakai komponen ini saat memigrasikannya.
- `Badge` mengekspor `BadgeProps`. `StatusPill` kini membungkus `Badge`
  (tone `sky`/`leaf`/`sun` menjadi `info`/`positive`/`warning`); warnanya sama.
- `Skeleton` memakai utilitas Tailwind (`after:animate-shimmer`, keyframes
  `shimmer` di `tailwind.config.ts`). Kelas `.skeleton`, `.app-mark-tile`,
  dan `@keyframes skeleton-shimmer` dihapus dari `globals.css`.
- Kartu statistik yang dapat diklik: bungkus `Stat` dengan
  `<Link className="group block rounded-md">` dan beri `Stat`
  `className="group-hover:border-sky"`.

Perubahan yang terlihat: `BrandMark` 36px (dulu 40px), judul `text-sm`;
filter daftar event memakai `Input`/`Select` kepadatan compact; tombol "Open"
di baris tabel tetap ada walau nama event sudah berupa tautan.

Utility terhapus: `.app-mark-tile`, `.skeleton` (+ `::after`, override tema
terang, keyframes). Dari 79 nama class awal tersisa 42. Sisa pemakai:
`detail-grid` 2 file, `stat-card` 1, `status-*` 1-5, `notice-*` 1-7,
`compact-table` 4, `responsive-table` 3.

**Jebakan build yang penting (ditemukan di sesi ini):**

- Jalankan `next build` saat `next dev` atau `next start` hidup dari folder
  yang sama merusak `.next`. Gejalanya: `Compiled successfully` lalu gagal di
  "Collecting page data" dengan `Invariant: no direct app page entry found for
  /_not-found`. Itu bukan error kode. Periksa dulu:
  `Get-CimInstance Win32_Process -Filter "Name='node.exe'" | ? CommandLine -match 'next'`.
- Jangan matikan proses itu tanpa izin user. Verifikasi lewat salinan:
  salin `src`, `public`, dan file konfigurasi ke `d:\CDP-Project\_ui-build-check`
  (harus drive yang sama dengan proyek; `geist` gagal resolve font bila beda
  drive), sambungkan `node_modules` dengan junction (`mklink /J`), build di
  sana, lalu hapus dengan `rmdir` pada junction **dulu** sebelum `rmdir /s /q`
  folder salinan, agar `node_modules` asli tidak ikut terhapus.
- Grep nama class harus `-CaseSensitive`. Tanpa itu `Skeleton` (komponen)
  terhitung sebagai pemakai class `.skeleton`.

Belum diverifikasi di browser: daftar event (filter, tabel responsif,
keadaan kosong dengan tombol buat event), kartu statistik klik, halaman detail
event (readiness, committee), animasi shimmer skeleton di dua tema, lencana
status di dark/light, halaman settings mode read-only.

---

## Status: Tahap 2 selesai untuk SEMUA area, Tahap 2b dijalankan penuh (8 Okt 2026)

Area terakhir yang dikerjakan: `events-forms`, `events-subpages`, `checkin`,
`email-ui`, `public`, `presentation`. Tahap 3 (preset tema dan picker) belum.

**Hasil akhir yang terukur**

- Hex di `src/**/*.ts(x)`: 4, semuanya pengecualian sah
  (`services/email.ts` 3, `email-builder.tsx` 1 untuk pratinjau tombol).
- Inline `style={{}}`: 5 (`email-builder.tsx` 4: `textAlign`/`height` dari data blok;
  `committee-credits.tsx` 1: `animationPlayState` runtime). Semuanya dinamis.
- `globals.css`: 334 baris menjadi 227; nama class 79 menjadi 11.
  CSS hasil build 54 KB menjadi 43 KB. `!important` tinggal satu (reduced-motion).
- Class yang sengaja tetap: `.eyebrow`, `.page-title`, `.page-subtitle`,
  `.section-title` (typography helper, 9-23 pemakai; keputusan: utility
  permanen, belum ada `PageHeader`), `.responsive-table` (dipakai `Table`),
  `.committee-credit*` (animasi kredit), `.app-dialog` (hanya `::backdrop`).
- Verifikasi: tsc, eslint, vitest (18 file, 60 test), dan `next build`
  (13/13 halaman) semuanya lolos pada kode akhir.

**Kejadian penting: agen lain menulis ke folder yang sama**

Di antara dua sesi saya, Codex mengerjakan Tahap 2 yang sama pada ~15 file
(13:54-14:03) lalu berhenti di tengah. Tidak ada git di folder ini, jadi tidak
ada cara membatalkan kalau dua agen saling menimpa. Akibatnya satu edit saya
sempat merusak `committee-editor.tsx` (impor `Input` hilang, 3 error tsc);
sudah diperbaiki. Pelajaran:

1. Sebelum edit besar jalankan `Get-ChildItem -Recurse src -File | sort LastWriteTime -desc | select -first 10`.
   Waktu tulis yang bukan milik sesi ini berarti ada penulis lain.
2. Ambil snapshot `robocopy src ..\_src-snapshot-<stamp> /E` sebelum mulai,
   dan bandingkan hash per file untuk tahu apa yang berubah.
3. Baca ulang file tepat sebelum menulis. Pembacaan lama bisa basi.
   Pakai edit terarah, bukan `fs_write` penuh, untuk file yang pernah disentuh agen lain.
4. Jangan jalankan dua agen UI pada folder yang sama.

Pekerjaan Codex yang saya periksa dan pertahankan: `Button`/`Table`/`EmptyState`
di committee-editor, `DetailList` di halaman peserta. Satu hal saya koreksi:
pratinjau tombol di `email-builder` diganti ke token `bg-sky`, padahal email
asli selalu `#2f81f7` (token berubah di tema terang). Dikembalikan ke
`bg-[#2F81F7]`, sesuai skill `email-management` (pratinjau meniru email,
bukan tema).

**Pola yang ditambahkan di sesi ini**

- `OverflowMenuFormItem` kini menerima `confirm={{ message, title?, confirmLabel? }}`:
  konfirmasi jalan dari provider global sehingga selamat dari menutupnya menu.
  Pola baku aksi destruktif: `<form id className="hidden" action=... />` di luar
  menu + `OverflowMenuFormItem formId=... danger confirm=...`.
- `Select` menerima `wrapperClassName` (untuk `col-span` dan lebar; `className`
  mengenai `<select>`-nya).
- Komponen bersama email: `email/compose-parts.tsx`
  (`ComposeRow/RowLabel/Line/Chip/Footer`). `Toolbar` + menu `Insert` memadatkan
  8 tombol blok menjadi satu baris tinggi tetap (tidak lagi `flex-wrap`).
- `EventStatusBadge`, `ParticipantStatusBadge`, `CopyLinkMenuItem` (aksi salin
  tautan sebagai item menu, umpan balik lewat toast).
- Panel yang harus bisa tertutup jangan memakai atribut `hidden` bersama kelas
  `display` (grid/flex): `display` penulis mengalahkan atribut. Pakai kelas
  `hidden` kondisional. Ini memperbaiki panel "Template settings" yang selama
  ini tidak pernah menutup.
- Area yang memakai `data-density="comfortable"`: check-in, kontrol presentasi,
  dan halaman kredit komite.

**Konsolidasi aksi (tidak ada aksi yang dihapus)**

| Lokasi | Terlihat sekarang | Masuk menu `⋯` |
|---|---|---|
| Committee editor | Add member, Save | Import Excel, Template, Dummy data |
| Peserta (header) | Preview form | Copy link, Back to overview |
| Peserta (baris PENDING/WAITLIST) | Approve | Waitlist, Review |
| Detail peserta | Approve, Reject (+alasan) | Move to waitlist, Cancel registration |
| Awards (kartu) | Edit | Delete |
| Doorprize (kartu) | Draw winner, Edit | Delete |
| Doorprize (pemenang) | (tidak ada) | Remove winner |
| Email builder (toolbar) | Undo, Redo, Insert, Live preview | 8 jenis blok di menu Insert |
| Email builder (blok) | grip, naik, turun | Remove block |

**Belum diverifikasi di browser** (build hijau tidak membuktikannya): semua
menu `⋯` baru (posisi, fokus, tidak menggeser layout); konfirmasi dari item
menu lalu submit form lewat `requestSubmit`; modal Edit award/prize;
Import Excel dari menu (input file dipertahankan di luar menu);
toolbar email dan menu Insert; panel Template settings yang kini menutup;
tampilan dark/light di semua halaman; layar check-in komfortable di tablet.

**Selisih terhadap `design.md` (belum diputuskan; `design.md` masih sumber UI)**

`design.md` menyebut font Inter dan JetBrains Mono, tetapi UI kini Geist Sans/Mono
(keputusan Tahap 1). Tooltip: delay 200ms dan lebar maks 250px di `design.md`;
implementasi 400ms dan `max-w-xs` (320px). Panel navigasi atas 64px di `design.md`;
topbar kini 48px (compact). Radius maks 6px: `rounded-xl` masih ada di
`award-display` dan `display/doorprize` (layar panggung). `design.md` perlu
diperbarui di Tahap 3 atau komponen disesuaikan; pilih salah satu.

## Status: Tahap 3 selesai (8 Okt 2026)

Verifikasi: `tsc` 0 error, `eslint src` bersih, `vitest run` 18 file / 60 test
lulus, `next build` sukses, generator `--check` sinkron (7 preset), kontras
teks wajib lulus di semua preset baru.

**Sumber kebenaran warna**
- `src/lib/theme/presets.ts` (`colorTokens`, `sizeTokens`, `themePresets`,
  `selectablePresets`, `defaultThemeId`, `themeBootScript()`).
- Blok `[data-theme]` di `globals.css` antara `/* theme-presets:start */` dan
  `/* theme-presets:end */` DIHASILKAN oleh `scripts/generate-theme-css.ts`.
  Jangan edit manual. Jalankan `pnpm theme:css` setelah mengubah preset;
  `pnpm theme:css -- --check` untuk memeriksa sinkron.
- `pnpm theme:contrast [--all]` menghitung rasio kontras per preset. Warn
  bersifat informasional, hanya pasangan teks wajib yang menggagalkan.

**Preset**: `dark`, `light` (palet Primer/Octo, tidak diubah), `geist-dark`,
`geist-light`, `brand-dryport`, `high-contrast` (teks >= 7:1), `stage`
(scope "stage": tidak bisa dipilih user, dipasang di
`src/app/(presentation)/layout.tsx`, mengatur token tipografi besar).
Selector preset non-dark/light: `html[data-theme="x"], [data-theme="x"]`.
`.app-dialog::backdrop` dibuat per tema karena `::backdrop` tidak mewarisi
variabel dengan andal.

**Perilaku**
- Tanpa pilihan tersimpan, tema mengikuti `prefers-color-scheme`
  ("Match system" menghapus key tersimpan). Nilai lama "light"/"dark" tetap valid.
- Picker tema + density ada di `OverflowMenu` top bar (`AccountMenu`, radio
  tema, radio density, item Log out). `ThemePicker` (ikon Palette) hanya di
  halaman login. `theme-toggle.tsx` dihapus; `LogoutButton` -> `LogoutMenuItem`.
- Token baru: `text-display`, `text-title`, warna `hero-start/hero-end`
  (halaman presentasi). `cn.ts` mengenali `display`/`title` sebagai grup font-size.
- Tooltip disesuaikan ke `design.md` (delay 200ms, `max-w-[250px]`).
- `design.md` diperbarui untuk penyimpangan yang disengaja (font Geist,
  topbar compact 48px / comfortable 60px, skala tipografi, menu, bagian
  "Token layer, themes and density"). Steering `.kiro/steering/design-system.md`
  (fileMatch `src/**/*.tsx`) menegakkan aturan token.
- Skill `app-shell` dan `project-foundation` (di `.codex` dan `.kiro`) diperbarui.

**Catatan / belum terverifikasi di browser**
- Tampilan visual semua preset, perilaku radio di picker, FOUC dan
  `prefers-color-scheme`, scope `stage`, density switch, menu tidak menggeser layout.
- Portal (menu/dialog) memakai tema user, bukan `stage`.
- Border input (`outline` pada `surface-sunken`) < 3:1 di semua preset kecuali
  `high-contrast`; diwarisi dari palet Octo. `ink-subtle` pada `surface` dark 2.09:1.
- `brand-dryport` diturunkan dari logo, BUKAN warna brand resmi; `primary-hover`
  digelapkan (#1d4ed8) agar lolos kontras.
- Sisa hex yang diizinkan: `services/email.ts` (3), `email-builder.tsx` (1).
- Keputusan terbuka: komponen `PageHeader` (utility `.eyebrow/.page-title/
  .page-subtitle/.section-title` dipertahankan permanen).

**Jebakan**
- Jangan `next build` di folder project saat `next dev`/`next start` hidup
  (merusak `.next`, error `Invariant: no direct app page entry found for
  /_not-found`). Pakai salinan terisolasi; hapus junction `node_modules` dengan
  `rmdir` SEBELUM `rmdir /s /q`.
- Test DB kadang deadlock (`ER_LOCK_DEADLOCK`) saat cleanup paralel; flaky,
  ulangi run. Test memakai `TEST_DATABASE_URL`.
