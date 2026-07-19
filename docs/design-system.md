# Design System — Service Delivery Intelligence

Single source of truth for colors, typography, spacing, and component patterns used across the web UI and PDF output. Update this file whenever a design decision is made.

---

## Brand Colors

| Role | Value | Where Used |
|------|-------|-----------|
| Section header (PDF) | `#741B47` — `rgb(0.455, 0.106, 0.278)` | PDF section headers (`SECTION_COLOR` in `pdf.ts`) |
| Navy (PDF cover/dark) | `rgb(0.1, 0.15, 0.3)` ≈ `#1A2650` | PDF cover fallback, dark banner (`NAVY` in `pdf.ts`) |
| Blue accent (web) | `blue-600` / `blue-50` | Active sidebar links, cadence labels, focus ring, pill backgrounds |
| Purple accent (web) | `purple-600` / `purple-50` | "AI Synthesised" tag in `SectionCard` |

---

## Status / RAG Colors

Used for Green / Amber / Red traffic-light signals across both web and PDF.

### Web (Tailwind classes)
| Status | Background | Text | Border |
|--------|-----------|------|--------|
| Green | `green-100` / `green-50` | `green-700` / `green-600` | `green-300` |
| Amber | `amber-100` | `amber-700` / `amber-600` | `amber-300` |
| Red | `red-100` | `red-700` / `red-600` | `red-300` |

### PDF (pdf-lib `rgb()`)
| Status | Color |
|--------|-------|
| Green | `rgb(0.22, 0.66, 0.29)` |
| Amber | `rgb(0.96, 0.62, 0.04)` |
| Red | `rgb(0.85, 0.18, 0.18)` |

---

## Neutral Palette (Web — Slate)

The primary neutral system is Tailwind's `slate` scale.

| Token | Class | Role |
|-------|-------|------|
| Heading | `text-slate-800` | Page titles, section headings, bold table cells |
| Body | `text-slate-700` | Paragraph text, primary table content |
| Secondary | `text-slate-600` | Secondary table cells, supporting text |
| Tertiary | `text-slate-500` | Metadata, comments |
| Label / Empty | `text-slate-400` | Table headers (uppercase), placeholder, `—` NA text |
| Divider | `border-slate-200` / `divide-slate-100` | Card borders, table row dividers |
| Surface | `bg-slate-50` | Hover states, rating cards, table header background |

---

## PDF Color Constants (`src/lib/pdf.ts`)

```typescript
const SECTION_COLOR = rgb(0.455, 0.106, 0.278); // #741B47 — section headers
const NAVY         = rgb(0.1, 0.15, 0.3);        // ~#1A2650 — cover/dark areas
const GREY_BODY    = rgb(0.2, 0.2, 0.2);         // body text
const GREY_LIGHT_ROW = rgb(0.97, 0.97, 0.98);    // alternating row background
const GREY_FOOTER  = rgb(0.5, 0.5, 0.5);         // footer text
const WHITE        = rgb(1, 1, 1);
```

---

## Typography

### Web
No custom font — system sans-serif stack via Tailwind default (`font-sans`).

| Usage | Classes |
|-------|---------|
| Page title | `text-3xl font-bold text-slate-800` |
| Section card heading | `text-lg font-bold text-slate-800` |
| Body paragraph | `text-sm leading-relaxed text-slate-700` |
| Table body | `text-sm` |
| Table headers | `text-xs uppercase font-medium text-slate-400` |
| Status pill | `text-xs font-medium` |
| Sidebar label group | `text-xs font-semibold uppercase tracking-wider text-slate-400` |

### PDF (`src/lib/pdf.ts`)
| Usage | Size | Font | Color |
|-------|------|------|-------|
| Section header | 14pt | Bold | `SECTION_COLOR` (#741B47) |
| Section format | `{number}.0  {Title}` | — | — |
| Body text | 10pt | Regular | `GREY_BODY` |
| Table header | 8pt | Bold | `WHITE` on navy bg |
| Table cell | 9pt | Regular | `GREY_BODY` |
| Footer | 7–8pt | Regular | `GREY_FOOTER` |
| Line height | `size × 1.6` | — | `drawParagraph()` |

---

## Spacing & Layout (Web)

| Element | Value |
|---------|-------|
| Section card padding | `p-7` (28px) |
| Section card border radius | `rounded-xl` (12px) |
| Item card padding | `p-4` (16px) |
| Item card border radius | `rounded-lg` (10px) |
| Section heading bottom gap | `mb-5` (20px) |
| List item gap | `space-y-4` |
| Table cell padding | `py-3 pr-4` |
| Table header padding | `pb-3` |
| Page container | centered, `max-w-[1400px]`, `p-8` |
| Sidebar width | `w-64` (256px), sticky, hidden below `lg` |

### PDF Layout (`src/lib/pdf.ts`)
| Constant | Value |
|----------|-------|
| `PAGE_WIDTH` | 595pt (A4) |
| `PAGE_HEIGHT` | 842pt (A4) |
| `MARGIN` | 50pt |
| `FOOTER_RESERVE` | 55pt — content stops here; footer drawn at y=22–33 |
| Table header row height | 24pt |
| Table cell padding Y | 9pt |

---

## Component Patterns (Web)

### SectionCard — universal report section wrapper
```tsx
// src/components/report/SectionCard.tsx
<div className="rounded-xl border border-slate-200 bg-white p-7">
  <div className="mb-5 flex items-center gap-3">
    <span className="text-lg font-bold text-slate-800">{number} · {title}</span>
    {tag === "ai" && <PurplePill>AI Synthesised</PurplePill>}
    {tag === "submission" && <SlatePill>Submitted</SlatePill>}
  </div>
  {children}
</div>
```

### Status badge (inline pill)
```tsx
<span className="rounded px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">Green</span>
```

### Left-border urgency accent
```tsx
<div className="rounded-lg border border-slate-200 bg-white p-4 border-l-4 border-l-red-500">
```

### Table structure
```tsx
<table className="w-full text-sm">
  <thead>
    <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
      <th className="pb-3 text-left font-medium">Column</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-slate-100">
    <tr><td className="py-3 pr-4 text-slate-700">…</td></tr>
  </tbody>
</table>
```

### Cross-analysis relationship tags (web)
| Tag | Color classes |
|-----|--------------|
| AGREE | `bg-green-100 text-green-700` |
| DISAGREE | `bg-red-100 text-red-700` |
| COMPLEMENT | `bg-blue-100 text-blue-700` |
| BLIND SPOT | `bg-amber-100 text-amber-700` |

---

## Shadcn/ui Setup

- **Style**: `base-nova`
- **Base color**: `slate`
- **Icons**: `lucide-react`
- **CSS variables**: enabled (OKLCH color space, all achromatic — brand color is applied via direct Tailwind classes, not tokens)

Installed components: `button`, `card`, `badge`, `input`, `label`, `select`, `tabs`, `sonner`, `progress`, `textarea`, `checkbox`, `dropdown-menu`, `separator`, `avatar`, `dialog`, `sheet`

---

## PDF Section Header Format

All PDF section headers follow this pattern (implemented in `drawSectionHeader()` in `pdf.ts`):

```
4.0  Delivery Summary
```

- Number format: `{n}.0` in `SECTION_COLOR` bold 14pt
- Title: same color, same size, offset 8pt after the number
- No underline
- `ensureSpace(100)` called before drawing to avoid orphaned headers

---

## Cover Page (PDF)

- Background: `public/assets/cover_bg.png` — drawn with object-fit: cover (maintains aspect ratio, centered crop)
- SELISE logo: top-right, width 120pt, aspect-ratio-preserved
- Dark banner: bottom 25% of page, navy overlay
- Customer logo: bottom-right inside banner (optional, hidden if not uploaded)
- Text on banner: Customer Name (bold 22pt white), Reporting Period (14pt white), Date (11pt light grey)
- Footer on cover: none — footer only appears on content pages
