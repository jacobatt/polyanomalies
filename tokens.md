# Tokens

Lifted from direction B (`desk-dashboard.jsx`). Add to `app/globals.css` as CSS variables and surface through `tailwind.config.ts` so `bg-bg`, `text-fg-dim`, etc. work.

## Colors

```css
:root {
  --bg:           #0d1014;   /* page background */
  --surface:      #13171c;   /* cards, panels */
  --surface-2:    #181d23;   /* inputs, hover, nested cards */
  --border:       rgba(255, 255, 255, 0.07);
  --border-hi:    rgba(255, 255, 255, 0.10);

  --fg:           #e6e8eb;   /* primary text */
  --fg-dim:       #9aa0a8;   /* secondary text, labels */
  --fg-faint:     #5a6068;   /* tertiary, captions, mono labels */

  --green:        #22c55e;   /* primary accent — BUY, live, positive */
  --green-soft:   rgba(34, 197, 94, 0.12);

  --red:          #ef4444;   /* SELL, error, MEGA whale */
  --red-soft:     rgba(239, 68, 68, 0.12);

  --amber:        #f59e0b;   /* whale notional, counter-trend */
}
```

**Use the accent green sparingly.** It's the primary accent for BUY, live status, scores, and CTAs. Never on more than ~5% of the screen at once. Numbers and KPIs that aren't actively interesting stay neutral `--fg`.

## Typography

```ts
// app/layout.tsx
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';

export const sans = IBM_Plex_Sans({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-sans',
});

export const mono = IBM_Plex_Mono({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
});
```

Rules:
- **Body, headings, labels** → IBM Plex Sans
- **All numbers** → IBM Plex Mono (notional, score, price, time, addresses, %s)
- **All-caps section labels** → IBM Plex Mono, 10–11px, `letter-spacing: 0.1em`, `--fg-faint` color

Type scale (px):
| Use | Size | Weight |
|---|---|---|
| Page title | 18 | 600 |
| Section heading | 14 | 600 |
| Body | 12.5 | 400 |
| KPI value | 24–28 | 600 mono |
| Mono caption | 11 | 400 mono |
| Tag / badge | 10.5 | 600 mono, 0.04em tracking |
| All-caps label | 10 | 600 mono, 0.1em tracking |

## Spacing

Use a 4-px base unit. Common values: 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 32. Don't get clever with arbitrary values — these cover everything in the prototype.

## Radii
- Inputs / small buttons: `6px`
- Cards / panels: `8px`
- Large containers / modals: `10–12px`
- Pills / chips: `999px`

## Borders
Always `1px solid var(--border)`. For active/hover, step up to `var(--border-hi)`. Never use a colored border except for error states (`rgba(239,68,68,0.3)`).

## Shadows
Generally none — the design is flat. Exception: side-drawer (`-12px 0 32px rgba(0,0,0,0.4)`) and toast (`0 12px 32px rgba(0,0,0,0.3)`).

## Density
Two density modes — implement as a `data-density` attribute on `<html>`:
- `data-density="comfortable"` (default) — values above
- `data-density="compact"` — multiply paddings by 0.75, font-sizes minus 0.5px

For v1, ship comfortable only. Build the system so compact is a one-line CSS swap later.
