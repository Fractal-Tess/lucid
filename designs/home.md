# Alpha Study App - Home Page Wireframe

## Overview

A stunning dark-themed landing page with the DarkVeil animated WebGL background,
featuring a centered hero section with the Alpha logo, headline, and a single
call-to-action button.

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                             │
│                                                                                             │
│                              ╭─────────────────────────╮                                    │
│                              │                         │                                    │
│                              │    ⚛️                   │                                    │
│                              │                         │                                    │
│                              │    Alpha                │                                    │
│                              │                         │                                    │
│                              ╰─────────────────────────╯                                    │
│                                                                                             │
│                         Master Your Studies with AI-Powered                                 │
│                              Learning Tools                                                 │
│                                                                                             │
│                              ┌────────────┐                                                 │
│                              │ Get Started│                                                 │
│                              └────────────┘                                                 │
│                                                                                             │
│                                                                                             │
│                                                                                             │
│                                                                                             │
│                                                                                             │
│                                                                                             │
│                                                                                             │
│                                                                                             │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Background: DarkVeil Component

### Component Location

`packages/ui/src/lib/components/dark-veil/DarkVeil.svelte`

### Usage

```svelte
<script>
  import { DarkVeil } from '@alpha/ui/dark-veil';
</script>

<div class="fixed inset-0 -z-10">
  <DarkVeil
    hueShift={0}
    noiseIntensity={0}
    scanlineIntensity={0}
    speed={0.5}
    scanlineFrequency={0}
    warpAmount={0}
    resolutionScale={1}
  />
</div>
```

### Visual Effect

- **Type**: Animated WebGL shader background using CPPN (Compositional Pattern
  Producing Network)
- **Animation**: Organic, flowing patterns that evolve over time
- **Colors**: Deep purples, blues, and magentas with smooth gradients
- **Speed**: Slow, hypnotic movement (configurable via `speed` prop)
- **Style**: Abstract, neural-network-generated aesthetic

### Props Interface

| Prop                | Type   | Default | Description                           |
| ------------------- | ------ | ------- | ------------------------------------- |
| `hueShift`          | number | 0       | Shift the color hue (degrees)         |
| `noiseIntensity`    | number | 0       | Add noise/grain effect (0-1)          |
| `scanlineIntensity` | number | 0       | CRT scanline effect intensity         |
| `speed`             | number | 0.5     | Animation speed multiplier            |
| `scanlineFrequency` | number | 0       | Scanline frequency                    |
| `warpAmount`        | number | 0       | Warp/distortion amount                |
| `resolutionScale`   | number | 1       | Resolution multiplier for performance |

---

## Hero Section

**Position**: Centered vertically and horizontally **Max-width**: 800px
**Text-align**: Center **Z-index**: Above background (z-10)

### Logo Section

**Layout**: Centered, stacked vertically **Margin-bottom**: 32px

#### Logo Icon

- **Size**: 64px x 64px
- **Icon**: Alpha symbol (α) or custom geometric logo
- **Color**: White (`#ffffff`)
- **Style**: Clean, modern, slightly rounded

#### Logo Text

- **Text**: "Alpha"
- **Font-size**: 32px
- **Font-weight**: 700
- **Color**: White
- **Letter-spacing**: 0.05em
- **Margin-top**: 16px

---

## Headline

**Text**: "Master Your Studies with AI-Powered Learning Tools" **Alternative**:
"Your Personal AI Study Companion"

- **Font-size**: 48px (desktop) / 32px (mobile)
- **Font-weight**: 700
- **Color**: White
- **Line-height**: 1.2
- **Max-width**: 700px
- **Margin-bottom**: 16px

---

## Subheadline

**Text**: "Upload your materials, chat with AI, generate flashcards, quizzes,
and more."

- **Font-size**: 18px
- **Font-weight**: 400
- **Color**: `rgba(255, 255, 255, 0.7)`
- **Line-height**: 1.6
- **Max-width**: 600px
- **Margin-bottom**: 40px

---

## Call-to-Action Button

**Layout**: Single centered button

### Primary Button - "Get Started"

- **Background**: White
- **Text color**: `#0a0a0a` (near-black)
- **Padding**: 16px 32px
- **Border-radius**: 9999px (pill)
- **Font-size**: 16px
- **Font-weight**: 600
- **Hover**:
  - Scale: 1.05
  - Shadow: `0 10px 40px rgba(255, 255, 255, 0.2)`
  - Transition: 300ms cubic-bezier(0.4, 0, 0.2, 1)

---

## Color Scheme

| Element             | Color       | Hex Code                   |
| ------------------- | ----------- | -------------------------- |
| Background          | Near-black  | `#0a0a0a`                  |
| Text primary        | White       | `#ffffff`                  |
| Text secondary      | Muted white | `rgba(255, 255, 255, 0.7)` |
| Button primary bg   | White       | `#ffffff`                  |
| Button primary text | Near-black  | `#0a0a0a`                  |
| Button hover shadow | White glow  | `rgba(255, 255, 255, 0.2)` |

---

## Typography

- **Font Family**: System sans-serif (-apple-system, BlinkMacSystemFont, 'Segoe
  UI', Roboto, 'Helvetica Neue', sans-serif)
- **Logo text**: 32px, font-weight 700, letter-spacing 0.05em
- **Headline**: 48px (desktop) / 32px (mobile), font-weight 700, line-height 1.2
- **Subheadline**: 18px, font-weight 400, line-height 1.6
- **Button text**: 16px, font-weight 600

---

## Spacing & Layout

### Page

- **Min-height**: 100vh
- **Display**: Flex
- **Align-items**: Center
- **Justify-content**: Center
- **Padding**: 24px horizontal

### Hero Container

- **Max-width**: 800px
- **Text-align**: Center
- **Z-index**: 10 (above background)

### Elements

- **Logo margin-bottom**: 32px
- **Headline margin-bottom**: 16px
- **Subheadline margin-bottom**: 40px

---

## Components

### Logo Component

```
Size: 64px icon + 32px text
Color: White
Layout: Flex column, centered
```

### DarkVeil Background

```
Position: Fixed, inset-0
Z-index: -10
Full coverage behind content
```

### Primary Button

```
Background: #ffffff
Color: #0a0a0a
Padding: 16px 32px
Border-radius: 9999px
Font-weight: 600
Hover: scale(1.05), white glow shadow
Transition: 300ms cubic-bezier(0.4, 0, 0.2, 1)
```

---

## Interactions

### Page Load Animation

1. **Background**: Starts immediately
2. **Logo**: Fade in + scale from 0.9 to 1 (0.6s delay, 0.8s duration)
3. **Headline**: Fade in + translate Y from 20px (0.8s delay, 0.6s duration)
4. **Subheadline**: Fade in + translate Y from 20px (1s delay, 0.6s duration)
5. **Button**: Fade in + scale from 0.95 to 1 (1.2s delay, 0.5s duration)

### Hover States

- **Button**: Scale 1.05, white glow shadow
- **Transition**: 300ms cubic-bezier(0.4, 0, 0.2, 1)

### Focus States

- **Button**: Outline 2px offset with semi-transparent white

---

## Responsive Behavior

### Desktop (1024px+)

- Full layout as described
- Headline: 48px
- Logo: 64px icon + 32px text

### Tablet (768px - 1023px)

- Headline: 40px
- Logo: 56px icon + 28px text

### Mobile (< 768px)

- Headline: 32px
- Subheadline: 16px
- Logo: 48px icon + 24px text
- Button: Full width (max 300px)

---

## Implementation Notes

### Component Structure

```
Home Page
├── DarkVeil (background, fixed, z-[-10])
└── Hero Container (centered, z-10)
    ├── Logo
    │   ├── Logo Icon (64px)
    │   └── Logo Text "Alpha"
    ├── Headline
    ├── Subheadline
    └── CTA Button "Get Started"
```

### Key Design Principles

1. **Minimalist**: Only essential elements
2. **Dark first**: DarkVeil background creates atmosphere
3. **Centered focus**: All content centered for impact
4. **Smooth animations**: Staggered entrance animations
5. **High contrast**: White text on dark animated background

### Performance Considerations

- DarkVeil uses WebGL - ensure proper cleanup on unmount
- Use `resolutionScale` prop to reduce rendering cost on mobile
- Consider reducing animation speed on low-power devices

---

## Future Sections (Below the fold)

### Potential additions for full landing page:

1. **Features grid**: 3-6 feature cards with icons
2. **How it works**: Step-by-step process
3. **Testimonials**: User quotes
4. **Pricing**: Simple pricing table
5. **FAQ**: Accordion-style questions
6. **Footer**: Links, social, copyright

These would follow the same dark theme with the DarkVeil background continuing
or transitioning to a static dark background.
