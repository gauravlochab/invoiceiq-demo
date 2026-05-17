# InvoiceIQ Detect — HTML Output Standard

## The Rule

**Markdown is what agents read. HTML is what humans share.**

Spec files (`rules/*.md`, `domains/*/spec.md`) stay markdown — they are version-controlled, human-edited, agent-parsed inputs. Agent-generated artifacts delivered to humans (plans, reports, explainers, demo docs) are rendered as HTML.

---

## When to Generate HTML

Generate a self-contained HTML file when the output is:

| Output type | Generate HTML? | Why |
|-------------|---------------|-----|
| Implementation plan from a spec | **Yes** | SVG diagrams, phase tables, code snippets, navigable |
| Brainstorm / exploration of options | **Yes** | Side-by-side cards, visual comparison |
| PR review explainer | **Yes** | Rendered diff, inline annotations, severity color-coding |
| Stakeholder demo report (Parkland, execs) | **Yes** | KPI hero, swimlane diagram, shareable link |
| Domain spec rendered for review | **Yes** | Sidebar nav, anchors, placeholder highlighting |
| Code walkthrough / feature explainer | **Yes** | Annotated snippets, flowcharts, readable structure |
| activeContext.md update | **No** | Agent memory file — markdown, stays in git |
| progress.md entry | **No** | Append-only log — markdown, stays in git |
| Domain spec file itself | **No** | Source of truth — markdown, diffable, agent-readable |
| Decision log / ADR | **No** | Version-controlled record — markdown |

---

## HTML Output Rules

### Structure
- Every HTML output is **self-contained** — one `.html` file, no external dependencies except CDN fonts
- Use `<style>` blocks with CSS variables for theming — never inline `style=` attributes on every element
- Include a `<meta name="viewport">` tag — outputs may be read on mobile

### Styling
- Use the InvoiceIQ design token colors as a reference: `--bg: #0f172a`, `--blue: #3b82f6`, `--emerald: #10b981`
- Diagrams must use inline SVG — no image tags pointing to external files
- Code snippets use `<pre><code>` with syntax highlighting via CSS classes, not a JS library

### Accessibility
- Semantic HTML tags: `<nav>`, `<main>`, `<section>`, `<article>`, `<header>`, `<footer>`
- All SVG diagrams have `aria-label` or `<title>` elements
- Color is never the only means of conveying information (use icons or labels alongside)

### Interactivity
- Tab switchers, collapsibles, and copy buttons are encouraged — use vanilla JS only
- Always include a "Copy as prompt" or "Copy as JSON" button on any editing interface so changes can be fed back to Claude Code
- No `<iframe>`, no external scripts, no `eval()`

---

## Where HTML Outputs Live

HTML outputs are **not committed to git** — they are derived artifacts, not source.

- **Local:** Open directly in browser (`claude open output.html` or double-click)
- **Shareable:** Upload to S3 or a static host to get a link
- **PR attachment:** Link to the HTML file in a PR comment, not committed to the branch
- **Exception:** A `/demo/` folder may contain committed HTML artifacts for a specific release or client presentation that must be reproducible

Do not create a `/html-outputs/` folder in the repo — it will fill with stale renders.

---

## Prompt Templates

### 1. Implementation Plan
```
Generate a self-contained HTML implementation plan for [FEATURE]. Include:
(1) an inline SVG data flow diagram, (2) a phased timeline table with owners,
(3) syntax-highlighted code snippets for key interfaces, (4) a risk register.
Use CSS variables. No external JS dependencies.
```

### 2. Brainstorm Explorer
```
Generate a self-contained HTML file showing [N] alternative approaches to [PROBLEM].
Each approach gets a card: title, 1-sentence summary, pros/cons, effort badge (S/M/L),
risk dot (green/yellow/red). Include a sticky comparison bar at top.
```

### 3. PR Review Explainer
```
Generate a self-contained HTML code review for this diff: [DIFF].
Two-column before/after layout. Red for deletions, green for additions.
Inline annotation bubbles at key lines. Summary section: files changed, risk badge, checklist.
```

### 4. Stakeholder Demo Report
```
Generate a self-contained HTML executive report for [HOSPITAL_NAME] procurement team.
Sections: (1) hero with headline metric, (2) three KPI cards with trend arrows,
(3) before/after SVG swimlane diagram, (4) ROI table, (5) next steps CTA.
Tone: clinical, confident. No external dependencies.
```

### 5. Domain Spec Renderer
```
Convert this markdown spec into a self-contained HTML document: [PASTE_SPEC].
Auto-generate sidebar nav from ## and ### headings with smooth-scroll anchors.
Add spec metadata bar at top (version, status, owner). Highlight [PLACEHOLDER] tokens in amber.
Add floating "Copy section" button on each heading. Vanilla JS only.
```

---

## Anti-Patterns

- **NEVER** return raw markdown inside a `<div>` and call it an HTML output — render it properly
- **NEVER** link to external CDN scripts for core functionality (fonts CDN is fine)
- **NEVER** commit HTML outputs to git as if they were specs — they are derived artifacts
- **NEVER** generate HTML that requires a backend to function — all outputs are static
- **NEVER** use `<meta>` tags with values that could trigger WAF filtering in proxy setups

---

<!-- CHANGELOG -->
<!-- 2026-05-18: html-outputs.md created as part of SpecLayer HTML-first output strategy. Inspired by Thariq (@trq212, Claude Code, Anthropic) "The Unreasonable Effectiveness of HTML" — 12.4M views. -->
