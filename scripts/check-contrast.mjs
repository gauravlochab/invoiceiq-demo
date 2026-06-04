// OKLCH → sRGB → WCAG luminance & contrast checker
// Ad-hoc audit tool — verifies the four goal pairs after the 2026-05-23 v2 fix.

// --- OKLCH → linear sRGB → sRGB conversion (Björn Ottosson) ---

function oklchToLinearRgb(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  // OKLab
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const r =  4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  return [r, g, bl];
}

function linearToSrgb(c) {
  if (c <= 0) return 0;
  if (c >= 1) return 1;
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function oklchToSrgb(L, C, h) {
  const [lr, lg, lb] = oklchToLinearRgb(L, C, h);
  return [linearToSrgb(lr), linearToSrgb(lg), linearToSrgb(lb)];
}

// WCAG relative luminance from sRGB 0..1
function relativeLuminance([r, g, b]) {
  const toLin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

function contrast(L1, L2) {
  const a = Math.max(L1, L2);
  const b = Math.min(L1, L2);
  return (a + 0.05) / (b + 0.05);
}

// Alpha-composite a foreground sRGB color onto a background sRGB color.
// Returns the resulting opaque sRGB.
function composite(fg, alpha, bg) {
  return [0, 1, 2].map((i) => fg[i] * alpha + bg[i] * (1 - alpha));
}

const toHex = (rgb) =>
  '#' + rgb.map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('');

// --- Tokens (post-fix) ---

const T = {
  // Light
  light_bg:                 [1, 0, 0],
  light_destructive:        [0.577, 0.245, 27.325],
  light_destructive_text:   [0.45, 0.20, 27],
  light_ring:               [0.55, 0, 0],
  // Dark — proposed fix
  dark_bg:                  [0.145, 0, 0],
  dark_destructive:         [0.5, 0.2, 22.216],      // NEW (was 0.704 0.191 22.216)
  dark_destructive_text:    [0.78, 0.16, 22],        // NEW (was missing)
  dark_destructive_fg:      [0.985, 0, 0],           // white
};

function srgb(name) {
  const [L, C, h] = T[name];
  return oklchToSrgb(L, C, h);
}

function L(name) {
  return relativeLuminance(srgb(name));
}

function check(label, fg, bgComp, threshold = 4.5) {
  const Lfg = relativeLuminance(fg);
  const Lbg = relativeLuminance(bgComp);
  const ratio = contrast(Lfg, Lbg);
  const pass = ratio >= threshold;
  console.log(
    `  ${pass ? 'PASS' : 'FAIL'}  ${ratio.toFixed(2)}:1  (>=${threshold}:1)  — ${label}`
  );
  console.log(
    `         fg=${toHex(fg)} bg=${toHex(bgComp)}`
  );
  return ratio;
}

console.log('\n=== Goal pair 1: dark --destructive-foreground on dark --destructive (>=4.5) ===');
check(
  'dark white on dark destructive fill',
  srgb('dark_destructive_fg'),
  srgb('dark_destructive')
);

console.log('\n=== Goal pair 2: light destructive badge text on its /10 chip (>=4.5) ===');
{
  const chipLight = composite(srgb('light_destructive'), 0.10, srgb('light_bg'));
  check(
    'light --destructive-text on bg-destructive/10 (over white)',
    srgb('light_destructive_text'),
    chipLight
  );
}

console.log('\n=== Goal pair 3: dark destructive badge text on its /20 chip (>=4.5) ===');
{
  const chipDark = composite(srgb('dark_destructive'), 0.20, srgb('dark_bg'));
  check(
    'dark --destructive-text on bg-destructive/20 (over dark bg)',
    srgb('dark_destructive_text'),
    chipDark
  );
}

console.log('\n=== Goal pair 4: light --ring on white (>=3.0) ===');
check(
  'light --ring on white',
  srgb('light_ring'),
  srgb('light_bg'),
  3.0
);

console.log('\n=== Additional sanity: dark --destructive-text on dark --background (informational, >=4.5) ===');
check(
  'dark --destructive-text on dark --background',
  srgb('dark_destructive_text'),
  srgb('dark_bg')
);

console.log('\n=== Sanity: dark --destructive on dark --background (non-text, >=3.0) ===');
check(
  'dark --destructive on dark --background',
  srgb('dark_destructive'),
  srgb('dark_bg'),
  3.0
);

console.log('\nDone.\n');
