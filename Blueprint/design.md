---
version: alpha
name: BrewSpace — The Modern Coffeehouse
description: >-
  BrewSpace AI's warm, contemporary, human-centered visual identity. A premium
  modern coffeehouse aesthetic with understated intelligent-product polish;
  one coherent language for Café Flow, Café Connect, and Coffee Circles.
colors:
  primary: "#352A24"
  on-primary: "#F7F3EA"
  primary-hover: "#4B3930"
  secondary: "#56715D"
  on-secondary: "#FFFFFF"
  tertiary: "#985239"
  on-tertiary: "#FFFFFF"
  neutral: "#F7F3EA"
  accent-terracotta: "#BD7656"
  accent-sage: "#788A72"
  accent-honey: "#B78B42"
  light:
    background: "#F7F3EA"
    surface: "#FFFCF7"
    surface-raised: "#FFFFFF"
    surface-muted: "#F1E9DE"
    on-surface: "#352A24"
    on-surface-muted: "#62574F"
    border: "#D7C7B9"
    border-strong: "#9A8577"
    focus-ring: "#3C5A45"
  dark:
    background: "#241C18"
    surface: "#2C231F"
    surface-raised: "#3A2E28"
    surface-muted: "#45362E"
    on-surface: "#F7F3EA"
    on-surface-muted: "#E5D6C8"
    border: "#725F53"
    focus-ring: "#E6B68E"
  flow:
    background: "#E6EDE3"
    foreground: "#3C5A45"
  connect:
    background: "#F3DFD5"
    foreground: "#7E3F2D"
  circles:
    background: "#F3E6C9"
    foreground: "#72531B"
  feedback:
    success-background: "#E6EDE3"
    success-foreground: "#3C5A45"
    warning-background: "#F3E6C9"
    warning-foreground: "#72531B"
    error-background: "#FAE3DF"
    error-foreground: "#9C3B33"
typography:
  display:
    fontFamily: Fraunces
    fontSize: 60px
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: -0.035em
  headline-lg:
    fontFamily: Fraunces
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: -0.03em
  headline-md:
    fontFamily: Fraunces
    fontSize: 36px
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: -0.025em
  headline-sm:
    fontFamily: Fraunces
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.22
    letterSpacing: -0.015em
  title-lg:
    fontFamily: DM Sans
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.015em
  title-md:
    fontFamily: DM Sans
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: -0.01em
  body-lg:
    fontFamily: DM Sans
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
  body-sm:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.3
  caption:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0.01em
rounded:
  xs: 6px
  sm: 8px
  md: 12px
  lg: 18px
  xl: 24px
  2xl: 32px
  pill: 999px
spacing:
  1: 4px
  2: 8px
  3: 12px
  4: 16px
  6: 24px
  8: 32px
  12: 48px
  16: 64px
motion:
  fast:
    duration: 120ms
    timingFunction: ease-out
  standard:
    duration: 200ms
    timingFunction: ease-in-out
  gentle:
    duration: 300ms
    timingFunction: ease-out
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: 16px
    height: 48px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.light.surface-muted}"
    textColor: "{colors.light.on-surface}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: 16px
    height: 48px
  button-sage:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: 16px
    height: 48px
  button-terracotta:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: 16px
    height: 48px
  card-default:
    backgroundColor: "{colors.light.surface}"
    textColor: "{colors.light.on-surface}"
    rounded: "{rounded.lg}"
    padding: 24px
  card-raised:
    backgroundColor: "{colors.light.surface-raised}"
    textColor: "{colors.light.on-surface}"
    rounded: "{rounded.xl}"
    padding: 24px
  field-default:
    backgroundColor: "{colors.light.surface-raised}"
    textColor: "{colors.light.on-surface}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 48px
  module-flow:
    backgroundColor: "{colors.flow.background}"
    textColor: "{colors.flow.foreground}"
    rounded: "{rounded.lg}"
    padding: 16px
  module-connect:
    backgroundColor: "{colors.connect.background}"
    textColor: "{colors.connect.foreground}"
    rounded: "{rounded.lg}"
    padding: 16px
  module-circles:
    backgroundColor: "{colors.circles.background}"
    textColor: "{colors.circles.foreground}"
    rounded: "{rounded.lg}"
    padding: 16px
  alert-success:
    backgroundColor: "{colors.feedback.success-background}"
    textColor: "{colors.feedback.success-foreground}"
    rounded: "{rounded.md}"
    padding: 16px
  alert-warning:
    backgroundColor: "{colors.feedback.warning-background}"
    textColor: "{colors.feedback.warning-foreground}"
    rounded: "{rounded.md}"
    padding: 16px
  alert-error:
    backgroundColor: "{colors.feedback.error-background}"
    textColor: "{colors.feedback.error-foreground}"
    rounded: "{rounded.md}"
    padding: 16px
  dark-card:
    backgroundColor: "{colors.dark.surface}"
    textColor: "{colors.dark.on-surface}"
    rounded: "{rounded.lg}"
    padding: 24px
---

# BrewSpace — Design System

## Overview

**Theme:** The Modern Coffeehouse, with a hint of **Cozy Futurism**. BrewSpace should feel like walking into a beautifully considered neighborhood café: warm light, natural materials, comfortable conversation, and a quiet sense of intelligence. Premium but never exclusive; friendly but never childish; technologically capable without looking like a science-fiction dashboard.

**Brand promise:** *Your café. Your space. Your people.*

**Product context:** BrewSpace is a mobile-first AI café companion connecting three experiences: **Café Flow** (find a suitable space and focus), **Café Connect** (meet compatible people by mutual choice), and **Coffee Circles** (join small, interest-based conversations). One visual identity applies throughout. The three capabilities may have distinct gentle accent treatments, never distinct design systems.

**Design adjectives:** Warm, tactile, unhurried, contemporary, human, breathable, trustworthy, quietly playful.

**Not the aesthetic:** Neither a dark SaaS control center nor a rustic chalkboard café menu; not a dating app, gamified social feed, or neon AI startup. The intelligence should be *felt through clarity and relevance*, not through robotic decorations or constant gradients.

**Scope:** This file governs visual identity and presentation behavior, not sitemap, page structure, or user flows. Screens should follow the BrewSpace PRD and IA separately. Default to a warm light appearance; a dark espresso variant may be used where supported.

## Colors

The palette is inspired by espresso, steamed milk, sun-warmed clay, plant leaves, and honey-toned timber. Cream and espresso establish the brand. Sage suggests calm; terracotta suggests human connection; honey adds a hint of group energy.

- **Espresso Brown — Primary (`#352A24`):** Brand anchor, large headings, principal text, and primary actions. Pair with Warm Cream (`#F7F3EA`). Strong rather than stark.
- **Warm Cream — Neutral (`#F7F3EA`):** Main light canvas, softer and more inviting than pure white.
- **Porcelain (`#FFFCF7`), Fresh Milk (`#FFFFFF`), and Oat Milk (`#F1E9DE`):** Layered surfaces that give gentle visual depth without clutter.
- **Muted Terracotta (`#BD7656`):** Decorative warmth, illustration details, and nonessential emphasis. **For small text or active controls**, use the accessible deeper Terracotta Ink (`#985239`) with white text, or Dark Clay (`#7E3F2D`) on the pale Connect tint.
- **Sage Leaf (`#788A72`):** Soft, natural decorative accents. **For functional foregrounds**, use deeper Sage Ink (`#56715D`) with white text or Forest Ink (`#3C5A45`) on light sage.
- **Honey (`#B78B42`):** Restrained decorative highlight for Coffee Circles; use dark Honey Ink (`#72531B`) for readable text on Honey Cream (`#F3E6C9`).
- **Quiet Stone (`#62574F`):** Secondary light-mode text. Reserve lighter, lower-contrast colors for borders and nonessential decoration.

**Module color cues (subtle, not full-page recoloring):**

| Experience | Soft surface | Legible foreground | Emotional signal |
|---|---|---|---|
| Café Flow | Soft Sage `#E6EDE3` | Forest Ink `#3C5A45` | Peaceful, focused, grounded |
| Café Connect | Blush Clay `#F3DFD5` | Dark Clay `#7E3F2D` | Warm, welcoming, personal |
| Coffee Circles | Honey Cream `#F3E6C9` | Honey Ink `#72531B` | Communal, optimistic, gently lively |

**Dark variation:** Use deep espresso background (`#241C18`), cocoa surfaces (`#2C231F`, `#3A2E28`), and warm ivory text (`#F7F3EA`). Avoid pure black, cold gray, or glowing neon. The dark variant should evoke a softly lit café in the evening.

**Semantic status colors:** Success, warning, and error use a pale tinted background plus a sufficiently dark foreground. Never convey status through color alone; always pair with words and, when appropriate, an icon.

**Accessibility:** Target WCAG AA contrast: at least 4.5:1 for normal text and 3:1 for large text and meaningful non-text indicators. Prefer the darker functional foreground tokens over the decorative terracotta, sage, or honey colors. Active focus must be visible in both appearances.

## Typography

The typographic identity pairs **Fraunces** (an expressive, contemporary serif) with **DM Sans** (a clean, warm, highly legible sans serif). The contrast feels editorial and personable without becoming nostalgic.

- **Fraunces:** For brand moments, hero statements, and prominent editorial headings. Use its curved personality sparingly to make BrewSpace recognizable. Do not use it for dense data, control labels, forms, or small mobile text.
- **DM Sans:** For everyday reading, navigation, descriptions, prompts, actions, metadata, and operational information. Favor regular and medium/semibold weights over heavy bold.
- **Hierarchy:** Large headlines 48–60px on spacious canvases; section heads 28–36px; interface titles 18–22px; body 16px; small support copy 14px; metadata 12px only when comfortably readable.
- **Rhythm:** Comfortable body line height (~1.55), tight but not crushed headline tracking, sentence-case labels. Allow generous paragraph spacing.
- **Responsive behavior:** Scale headline sizes down on narrow screens rather than shrinking body text. Do not force all-capital labels, dense tracking, or tiny status text.
- **Fallback:** Fraunces → Georgia → serif; DM Sans → system-ui → sans-serif. Use the named fonts if available, without blocking rendering if font loading fails.

## Layout

The layout language is **airy, calm, and content-led**. The aim is to create the visual equivalent of space between café tables: room to breathe, clear focal points, no visual crowding.

- Use a **4px base spacing rhythm**, with common steps of 8, 12, 16, 24, 32, 48, and 64px. Prefer spacing tokens from the YAML front matter rather than invented gaps.
- Maintain a clear hierarchy through whitespace, typography, and surface contrast—not through numerous borders, badges, or competing accent colors.
- Use generous outer breathing room on desktop, comfortable mobile gutters, and a readable line length for explanatory content.
- Keep groupings visually intuitive. Related information should appear together; separate distinct ideas with whitespace or a fine warm border.
- Favor aligned edges, proportional margins, and an understated grid. Controlled asymmetry is welcome for editorial brand moments, but core product information must feel steady and predictable.
- Use photographs or illustrations as atmospheric support, not as background noise behind important interactive content.
- Design mobile-first, with touch-friendly affordances and scalable typography. Treat 44px as a minimum target for common touch controls.
- Do **not** interpret these principles as a required homepage layout, card count, or navigation structure; those belong to the IA and screen designs.

## Elevation & Depth

Depth should evoke a **matte ceramic cup resting on a natural-wood table**: gentle and tangible, never glossy or floating excessively.

- Prefer nuanced contrast between cream canvas, porcelain surfaces, and oat-colored containers before adding shadow.
- Use a fine, warm border (`#D7C7B9`) for subtle separation, with a stronger warm border (`#9A8577`) only when necessary.
- When a surface truly needs elevation, use a very soft diffuse shadow such as `0 6px 24px rgba(53, 42, 36, 0.07)`; never stack strong dark shadows around every card.
- Avoid glassmorphism, excessive blur, neon outlines, metallic sheen, and dramatic three-dimensional effects.
- On dark surfaces, rely more on tonal layers than shadow for depth.
- A faint paper or natural-grain texture is acceptable for noninteractive brand surfaces, but it must never obscure text or create visual noise.

## Shapes

Shapes are **softly organic and contemporary**, inspired by café ceramics and rounded furniture rather than cartoon bubbles.

- **Small elements:** Gentle 6–8px curvature.
- **Fields and compact containers:** Calm 12px radius.
- **Cards and panels:** Inviting 18–24px radius.
- **Larger brand surfaces:** Up to 32px where spaciousness supports it.
- **Primary actions and small tags:** Pill-shaped ends (`999px`) when the design needs a friendly, tactile feel.
- **Icons:** Simple, rounded-stroke line icons with consistent optical size; avoid mixing heavy solid icons with delicate outlined ones.
- **Decorative forms:** Subtle coffee-bean ellipses, concentric cup-ring motifs, imperfect ovals, and softly curved paths. Use sparingly; never as generic wallpaper.
- Avoid jagged geometry, extreme bubbly shapes, and gratuitous corner-radius variation.

## Motion & Micro-interaction

Motion should feel like a **small, polite gesture**, not a product demanding attention.

- **Fast response (`120ms`):** Hover, press, focus, and simple microfeedback.
- **Standard transition (`200ms`):** Color, border, selection, and light surface changes.
- **Gentle transition (`300ms`):** Context changes, subtle reveals, and calm visual transitions.
- Favor opacity and very small translation changes; avoid aggressive scaling, rubber-band effects, bouncing, parallax, or animated gradient backgrounds.
- AI-related activity should be indicated through restrained, accessible status feedback rather than a permanently glowing orb.
- Respect `prefers-reduced-motion`; disable nonessential motion while preserving clear state changes.
- Do not use motion alone to signal confirmation, availability, or an invitation.

## Voice & Content Strategy

BrewSpace sounds like a thoughtful host who knows when to help and when to leave someone to enjoy their coffee. The voice is **warm, straightforward, observant, and consent-aware**.

- Prefer natural, short sentences and human language: “A quiet spot with a charging point is available.”
- Explain *why* suggestions are relevant without claiming magical certainty: “This seat fits your quiet-work preference.”
- Use **suggested**, **pending**, and **confirmed** precisely; avoid presenting recommendations as guaranteed reservations or mutual matches.
- Make social experiences explicitly optional: “Would you like to connect?” not “You've been paired.”
- Respect focused time; supportive messages should never sound urgent without a genuine reason.
- Avoid manipulative scarcity, forced excitement, emojis in every heading, overfamiliarity, robotic “AI-powered” repetition, and cliché café puns.
- Use sentence case in product copy. Brand name is **BrewSpace**; module names are **Café Flow**, **Café Connect**, and **Coffee Circles**.
- The interface should feel human-first. Gemini is the enabling intelligence, not the visual protagonist.

## Components

These are **styling principles**, not prescriptions for specific screens or workflows. Tokenized variants appear in `components` above.

- **Primary buttons:** Espresso Brown fill (`#352A24`), Warm Cream text (`#F7F3EA`), generously rounded pill shape, stable medium-weight label. Hover deepens to `#4B3930`. Strong, legible, calm.
- **Secondary buttons:** Oat Milk fill (`#F1E9DE`), Espresso Brown text, same basic geometry. Quietly supportive without competing with a primary action.
- **Contextual action variants:** Functional Sage Ink (`#56715D`) and Terracotta Ink (`#985239`) with white text. Use only where an accent strengthens meaning; maintain one visually primary action at a time.
- **Cards and panels:** Porcelain (`#FFFCF7`) or Fresh Milk (`#FFFFFF`) with 18–24px corners, restrained borders, and optional whisper-soft shadow. Avoid an endless mosaic of brightly colored cards.
- **Fields:** Fresh Milk background, dark readable text, warm border, 12px rounding, adequate padding, and a clear high-contrast focus indicator. Placeholder copy is a hint, never the only label.
- **Module accents:** Café Flow uses pale sage; Café Connect uses pale clay; Coffee Circles uses pale honey. Prefer small chips, illustrated details, section accents, or selected contextual surfaces rather than full-screen color changes.
- **Tags and status pills:** Compact, accessible, and neutral by default. Use semantic tints only when a meaningful state genuinely needs distinction.
- **AI assistant surfaces:** Match the same cream/espresso design language. A tiny sparkle or subtle warm accent is acceptable, but never default to a purple-blue gradient, neon border, or glowing chatbot bubble.
- **Feedback states:** Soft tinted background with dark readable text and explicit wording, as defined by success, warning, and error tokens.
- **Dark-mode equivalents:** Deep cocoa surfaces with warm ivory text and tonal separation; preserve the same shapes and typography instead of inventing a different visual identity.

## Do's and Don'ts

**Do**

- Make every experience feel like the same welcoming BrewSpace café, regardless of module.
- Lead with cream, espresso, authentic warmth, and strong typography.
- Use sage, terracotta, and honey as measured emotional cues, not competing brand colors.
- Keep content legible, spatially calm, and accessible on small screens.
- Prefer natural-light café imagery and candid, diverse, consent-respecting social moments.
- Use high-quality, understated line illustrations where photography would be excessive.
- Maintain a refined and recognizable identity even when there is no photography.
- Treat warmth and clarity as more important than decorative novelty.

**Don't**

- Use cyberpunk neon, default purple AI gradients, glossy 3D chatbot robots, or glowing mesh backgrounds.
- Make BrewSpace look like a corporate analytics dashboard, dating app, arcade, or vintage coffee menu.
- Fill every surface with terracotta/sage/honey or give each product module an unrelated visual system.
- Use muted accent colors for small text without checking contrast.
- Rely on heavy shadows, excessive blur, stock-photo collages, busy textures, or constant animations.
- Sacrifice functional clarity for editorial experimentation.
- Render private social suggestions as public or confirmed merely because they are visually attractive.

**Design north star:** *A beautiful, modern coffeehouse that happens to be intelligent—not an AI app decorated with coffee imagery.*
