---
inclusion: fileMatch
fileMatchPattern: "src/**/*.tsx"
---

# Design system

Berlaku untuk semua UI di `src/**/*.tsx`. Sumber kebenaran visual tetap `design.md`; dokumen ini menjelaskan cara memakainya di kode.

## Aturan keras

1. **Jangan tulis hex di `src`.** Pakai utility berbasis token (`bg-surface`, `text-ink-muted`, `border-outline`).
   Pengecualian yang sah, karena bukan UI aplikasi:
   - `src/services/email.ts`: HTML email, klien email tidak mendukung CSS variable.
   - `src/components/email/email-builder.tsx`: pratinjau tombol, harus sama dengan output email (`#2F81F7`).
   - `src/app/t/[token]/page.tsx`: parameter warna generator QR.
   - Kertas pratinjau email memakai token `paper*` dan kelas `slate`/putih sengaja; jangan di-tema-kan.
2. **Jangan tulis `style={{ ... }}` untuk warna atau spasi.** Inline style hanya untuk nilai yang dihitung saat runtime (mis. `textAlign` dari data blok, `animationPlayState`).
3. **Jangan tulis `[var(--x)]` arbitrer** untuk token warna. Hanya token ukuran (`--icon-size`, `--sidebar-w`) yang boleh, dan hanya bila tidak ada utility.
4. **Jangan menulis nama class lama** (`btn-*`, `field-*`, `status-*`, `notice-*`, `stat-card`, `surface-card`, `ink-*`, `empty-state`, `compact-table`, `detail-grid`, `tab-*`). Sudah dihapus; pakai primitif di bawah.
5. **Menu tidak boleh menggeser layout.** Panel melayang (portal atau popover native), bukan `<details>` atau panel in-flow.
6. **Presentational only.** Perubahan UI tidak boleh mengubah logika, server action, schema, atau props signature.

## Token (CSS variable, Tailwind utility)

Tema memilih nilainya lewat `data-theme` di `<html>`; kepadatan lewat `data-density`. Nilai semua warna ada di **`src/lib/theme/presets.ts`**, bukan di `globals.css` (blok `[data-theme]` di sana tergenerasi: `pnpm theme:css`).

| Kelompok | Utility |
|---|---|
| Permukaan | `bg-background`, `bg-surface`, `bg-surface-raised`, `bg-surface-sunken`, `bg-overlay` (menu, popover), `bg-backdrop` (scrim) |
| Teks | `text-ink`, `text-ink-strong`, `text-ink-muted`, `text-ink-subtle`, `text-link` |
| Batas | `border-outline`, `border-outline-soft`, `border-outline-strong` |
| Merek | `bg-primary` (`-hover`, `-fg`, `-soft`), `text-accent`, `bg-sky` / `bg-sky-soft` |
| Status | `success`, `warning`, `danger`, `info`, masing-masing `DEFAULT`, `-soft`, `-ink` (`bg-danger-soft text-danger-ink`) |
| Kertas email | `bg-paper`, `text-paper-ink`, `text-paper-muted`, `border-paper-outline` |
| Gradien hero | `from-hero-start to-hero-end` |
| Bayangan | `shadow-sm/md/lg`: hanya untuk lapisan melayang |
| Radius | `rounded-sm` 4px, `rounded-md` 6px, `rounded-lg` 8px |
| Z-index | `z-compose` 60, `z-menu` 100, `z-tooltip` 110, `z-toast` 200 |

Opacity modifier jalan: `border-danger/60`, `bg-primary/20`.

### Ukuran sadar kepadatan

`compact` adalah default; sentuh dan layar ≤639px otomatis `comfortable`. Subtree boleh memilih sendiri dengan `data-density="comfortable"` (check-in, kontrol presentasi, halaman kredit).

`h-ctl-sm|md|lg`, `min-h-ctl-*`, `size-ctl-*` (28/32/40px compact), `h-row`, `h-thead`, `p-card`, `gap-section`, `min-h-topbar`, `text-body` (13px), `text-label` (11px), `text-display`, `text-title`.
Jika menambah nilai spacing baru di `tailwind.config.ts`, daftarkan juga di `src/lib/cn.ts` (tailwind-merge tidak mengenalinya otomatis).

### Tema

`dark` (default, Octo Code), `light`, `geist-dark`, `geist-light`, `brand-dryport`, `high-contrast`, dan `stage` (hanya layar presentasi, dipasang oleh `src/app/(presentation)/layout.tsx`; tidak bisa dipilih pengguna).
Pilihan pengguna disimpan di `localStorage` (`event-theme`, `event-density`) dan diterapkan sebelum paint oleh skrip di `src/app/layout.tsx`; tanpa pilihan, mengikuti sistem operasi.
Menambah tema: tambah entri di `presets.ts` → `pnpm theme:css` → `pnpm theme:contrast`. Semua pasangan teks wajib ≥4.5:1 (≥7:1 untuk `high-contrast`).

## Primitif (`src/components/ui`)

Server-safe kecuali disebut client. Selalu pakai `cn()` dari `@/lib/cn` untuk menggabungkan class.

| Primitif | Varian dan catatan |
|---|---|
| `Button` | `variant`: primary, secondary, outline, ghost, danger. `size`: sm, md, lg, icon-sm, icon, icon-lg. `asChild` (untuk `Link`), `loading`. |
| `IconButton` | `label` wajib (aria-label + tooltip, `tooltip={false}` untuk mematikan). |
| `Card` (+`CardHeader/Title/Description/Content/Footer`) | `asChild` menjaga `<section>`, `<article>`, `<Link>`. Anak `inline-flex` meregang di dalam `Card`: beri `items-start`. |
| `Badge` | `neutral`, `positive`, `warning`, `negative`, `info`. Turunan: `StatusPill`, `EventStatusBadge`, `ParticipantStatusBadge`. |
| `Alert` | `info`, `success`, `warning`, `danger` (`role` otomatis). |
| `Stat`, `EmptyState`, `DetailList`, `Skeleton`/`LoadingStatus` | `DetailList` memakai `<dt>`/`<dd>` langsung. |
| `Table`, `Thead`, `Tbody`, `Tr`, `Th`, `Td` | `responsive` menumpuk baris di <640px (pakai `data-label` pada `Td`). Header sticky butuh `containerClassName` dengan tinggi terbatas. |
| `TabsNav`, `TabLink` | Tab rute; pemanggil menentukan `active`. |
| `Field`, `Label`, `FieldError`, `Fieldset`, `FormActions` (client) | `Field` menyalurkan `id`, `aria-describedby`, `aria-invalid` ke `Input`/`Textarea`/`Select`. Jangan oper `id` ke kontrol di dalam `Field`; beri `id` pada `Field`. |
| `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `RadioGroup`, `Switch`, `FileInput` (client) | Elemen native. `Select`: `className` ke `<select>`, `wrapperClassName` ke kotak luarnya. |
| `Dialog`, `Modal`, `ModalTrigger`, `ComposeWindow`, `ComposeTrigger` (client) | `Modal` terkontrol (`open`, `onOpenChange`). Jangan taruh `ModalTrigger` di dalam menu: ia ikut hilang saat menu tutup. |
| `OverflowMenu`, `OverflowMenuItem`, `OverflowMenuFormItem`, `DropdownMenu*`, `ContextMenu*`, `Tooltip`, `Toolbar*`, `ToggleGroup` (client) | Lihat aturan toolbar. |
| `ActionMenu` (client) | Menu untuk anak berupa komponen (popover native). Untuk daftar aksi baru pakai `OverflowMenu`. |

### Aturan toolbar

- Maksimal **2 aksi terlihat** per kartu, baris, atau header: 1 utama, 1 sekunder. Sisanya masuk `OverflowMenu`.
- **Aksi destruktif selalu di menu**, paling bawah, `danger`, dan tetap lewat dialog konfirmasi.
- Pola baku aksi destruktif: `<form id=... className="hidden" action=... />` **di luar** menu + `<OverflowMenuFormItem formId=... danger confirm={{ message, confirmLabel }}>`.
- Modal dari item menu: pakai `Modal` terkontrol dengan state di komponen yang tetap mounted.
- Klik kanan hanya penguat, bukan satu-satunya jalan; selalu sediakan tombol `⋯` yang sama.
- Toolbar editor: tinggi tetap, tidak `flex-wrap`; yang tidak muat masuk menu.

## Helper tipografi yang sengaja tetap

`.eyebrow`, `.page-title`, `.page-subtitle`, `.section-title` (di `globals.css`), plus `.responsive-table`, `.committee-credit*`, `.app-dialog` (hanya `::backdrop`). Selain ini, jangan menambah class di `globals.css`; gunakan utility.

## Verifikasi UI

```powershell
pnpm theme:css --check      # CSS tema sinkron dengan presets.ts
pnpm theme:contrast         # kontras WCAG per preset
```

Build hijau tidak membuktikan menu tidak menggeser layout atau tema terlihat benar; uji manual di browser. Jangan jalankan `next build` saat `next dev` atau `next start` hidup di folder yang sama.
