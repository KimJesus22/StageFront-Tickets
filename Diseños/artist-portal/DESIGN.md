---
name: Ethereal Tech
colors:
  surface: '#141313'
  surface-dim: '#141313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353434'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c7'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#c8c6c8'
  on-secondary: '#313032'
  secondary-container: '#474649'
  on-secondary-container: '#b7b4b7'
  tertiary: '#ffffff'
  on-tertiary: '#2f3131'
  tertiary-container: '#e2e2e2'
  on-tertiary-container: '#636565'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#e5e1e4'
  secondary-fixed-dim: '#c8c6c8'
  on-secondary-fixed: '#1c1b1d'
  on-secondary-fixed-variant: '#474649'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#141313'
  on-background: '#e5e2e1'
  surface-variant: '#353434'
typography:
  display-xl:
    fontFamily: Space Grotesk
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  stack-sm: 8px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style

This design system is built for an exclusive, high-tech ticketing ecosystem where the interface acts as a cinematic backdrop to the artist's world. The brand personality is premium, mysterious, and cutting-edge, targeting a digitally native audience that values scarcity and high-production aesthetics.

The design style leverages **Glassmorphism** and **Minimalism**. By using a deep, monochromatic base, we allow the content and artist-specific neon accents to vibrate against the darkness. The UI should feel lightweight and atmospheric, utilizing background blurs and micro-interactions to simulate a high-end digital concierge experience.

## Colors

The foundation of this design system is `bg-zinc-950`, a near-black gray that provides a sophisticated depth. 

- **Primary:** Pure White is used for core brand elements and high-priority actions to ensure maximum legibility against the dark void.
- **Accents:** A spectrum of subtle neons is used conditionally. These are not permanent UI fixtures but "contextual glows" that shift based on the artist or event type being viewed.
- **Surface:** Semi-transparent whites (5-10% opacity) create the glass layers, while gradients should transition from an accent color at 20% opacity to 0% opacity to maintain a "premium" rather than "gaudy" feel.

## Typography

This design system utilizes a dual-font strategy. **Space Grotesk** is used for headlines to provide a technical, futuristic edge that fits the "high-tech" requirement. Its geometric quirks give the platform a distinctive voice in the ticketing space.

**Inter** handles all functional and body text, ensuring perfect readability and a systematic, utilitarian feel. Letter spacing should be tightened for large headings and widened for small uppercase labels to enhance the premium editorial look.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** with generous inner margins to create a sense of exclusivity and "breathing room." We use a 12-column grid for desktop and a 4-column grid for mobile.

Spacing is governed by a 4px base unit. To achieve the high-end feel, we prioritize larger vertical stacks (`stack-lg`) between major sections to prevent the UI from feeling cluttered. Elements should feel like they are floating in space rather than being boxed in.

## Elevation & Depth

Depth is achieved through **Glassmorphism** and light-based layering rather than traditional shadows.

1.  **Level 0 (Base):** `bg-zinc-950`.
2.  **Level 1 (Cards):** Background blur (20px) with a 1px border of white at 10% opacity.
3.  **Level 2 (Modals/Popovers):** Background blur (40px) with a subtle radial gradient glow in the top-left corner using the contextual accent color at 15% opacity.
4.  **Interactive:** When hovered, glass elements should increase their border opacity and the intensity of the background blur to "lift" toward the user.

## Shapes

The shape language is **Rounded**, striking a balance between the organic feel of modern luxury and the precision of technology. Standard containers use a 0.5rem radius, while large feature cards and interactive surfaces use 1rem (`rounded-lg`) or 1.5rem (`rounded-xl`). This softness contrasts with the sharp technicality of the Space Grotesk typeface.

## Components

- **Buttons:** Primary buttons are solid White with Black text, no border. Secondary buttons use the glass effect: transparent background, 20px blur, and a 1px white border.
- **Artist Context Chips:** Small, pill-shaped elements with a subtle glow (box-shadow: 0 0 12px) using the specific artist’s accent color.
- **Input Fields:** Minimalist under-lines or fully ghosted containers with a 5% white fill. The cursor and focus state should adopt the contextual accent color.
- **Glass Cards:** The signature component. Used for event listings. They feature a "frosted" look where the artist's photography is visible but blurred behind the card's surface.
- **Tickets (Specialty Component):** A skeuomorphic digital ticket utilizing a "punched hole" CSS mask on the sides, featuring a holographic gradient overlay that moves based on the user's mouse position/accelerometer.
- **Status Indicators:** Use the "Neon" palette (e.g., Pastel Green for 'Available', Red for 'Sold Out') with a pulse animation to simulate live hardware LEDs.