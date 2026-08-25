---
name: YarnMe Modern Nigerian Fintech
colors:
  surface: '#f8f9ff'
  surface-dim: '#d0dbed'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dee9fc'
  surface-container-highest: '#d9e3f6'
  on-surface: '#121c2a'
  on-surface-variant: '#3f4944'
  inverse-surface: '#27313f'
  inverse-on-surface: '#eaf1ff'
  outline: '#6f7a73'
  outline-variant: '#bec9c2'
  surface-tint: '#106b4f'
  primary: '#00513a'
  on-primary: '#ffffff'
  primary-container: '#0f6b4f'
  on-primary-container: '#97e8c5'
  inverse-primary: '#86d6b4'
  secondary: '#795900'
  on-secondary: '#ffffff'
  secondary-container: '#ffc329'
  on-secondary-container: '#6f5100'
  tertiary: '#3e4941'
  on-tertiary: '#ffffff'
  tertiary-container: '#556158'
  on-tertiary-container: '#cfdbd0'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a1f3cf'
  primary-fixed-dim: '#86d6b4'
  on-primary-fixed: '#002115'
  on-primary-fixed-variant: '#00513a'
  secondary-fixed: '#ffdf9f'
  secondary-fixed-dim: '#f9bd22'
  on-secondary-fixed: '#261a00'
  on-secondary-fixed-variant: '#5c4300'
  tertiary-fixed: '#d9e6da'
  tertiary-fixed-dim: '#bdcabe'
  on-tertiary-fixed: '#131e17'
  on-tertiary-fixed-variant: '#3e4a41'
  background: '#f8f9ff'
  on-background: '#121c2a'
  surface-variant: '#d9e3f6'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 20px
  lg: 32px
  xl: 48px
  container-margin: 20px
  gutter: 16px
---

## Brand & Style

The design system is built on the philosophy of "Intelligent Warmth." It bridges the gap between high-precision financial technology and the communal, conversational nature of an AI assistant within the Nigerian context. The aesthetic is **Premium Minimalist with Tactile Warmth**, eschewing the cold, clinical blues of traditional fintech for a palette that feels grounded and prestigious.

The UI avoids "Generic SaaS" tropes by prioritizing organic whitespace over grid-heavy boxiness and utilizing a sophisticated ivory foundation. The goal is to evoke an emotional response of security, cultural resonance, and effortless intelligence. Every interaction should feel like a guided conversation with a trusted expert rather than a transaction with a machine.

## Colors

The color palette is a modern interpretation of growth and prosperity.

*   **Primary (Deep Green):** Used for key brand moments, primary actions, and authoritative UI states. It represents stability and the "Green-White-Green" heritage in a sophisticated, muted tone.
*   **Accent (Amber):** Used sparingly for highlighting intelligence (AI insights), notifications, and specific "call-to-attention" elements. 
*   **Background (Ivory):** The primary canvas. This warm off-white reduces eye strain and differentiates the platform from standard white-label apps.
*   **Secondary Surface (Light Mint):** Used for card backgrounds, success states, and subtle container differentiation.
*   **Text (Charcoal):** High-contrast gray for maximum legibility, ensuring the interface meets WCAG AA standards.

## Typography

This design system uses **Plus Jakarta Sans** across all levels to maintain a clean, contemporary feel. 

*   **Hierarchy:** Headlines use extra-bold weights to establish a "Strong Voice." 
*   **Accessibility:** Body text starts at 18px for the primary reading experience to ensure it is inclusive of all users.
*   **Character:** Tighten letter-spacing slightly on larger headlines to give them a premium, editorial feel. 
*   **Mobile Adaptation:** Large display headings scale down for mobile to prevent awkward line breaks while maintaining their visual impact.

## Layout & Spacing

The layout philosophy follows a **Mobile-First Fluid Grid**. 

1.  **Rhythm:** An 8px linear scale is used to define all spacing.
2.  **Margins:** Mobile views use a 20px safe margin to ensure content doesn't feel cramped against the screen edge.
3.  **Whitespace:** High density is avoided. The "Fintech AI" experience should feel calm. Use `xl` (48px) spacing between major sections to allow the user's eyes to rest.
4.  **Touch Targets:** All interactive elements must have a minimum hit area of 48x48px, even if the visual asset is smaller.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layering** and **Soft Ambient Shadows**.

*   **Base Layer:** The Ivory background (#FFF8E7).
*   **Surface Layer:** Secondary surface (Light Mint) or pure white cards. These use a very subtle `0 4px 20px rgba(15, 107, 79, 0.05)` shadow—a primary-tinted shadow that feels more natural and "warm" than a neutral gray.
*   **Raised Elements:** Active buttons and floating action buttons (FABs) use a slightly more pronounced shadow to indicate interactability. 
*   **AI Context:** The Amber accent is used as a "glow" or soft border to indicate where the AI assistant is currently processing or providing an insight.

## Shapes

The design system utilizes **Rounded** shapes to reinforce the "Warm/Friendly" brand personality.

*   **Standard Radius:** 8px (0.5rem) for input fields, list items, and small buttons.
*   **Large Radius:** 16px (1rem) for containers, cards, and modal sheets.
*   **Pill Shapes:** Full rounding is reserved for Chips, Tags, and primary "Action" buttons to make them feel inviting and "squishy" (tactile).

## Components

*   **Buttons:** Primary buttons are Deep Green with White text, using a Pill-shape. Secondary buttons use an Ivory background with a Deep Green border. Primary buttons should have a minimum height of 56px for mobile accessibility.
*   **Cards:** Use the Light Mint surface with a 16px radius. Avoid heavy borders; instead, use the subtle primary-tinted shadow for separation.
*   **Input Fields:** Ghost-style with a soft 1px border in a darker mint shade. When focused, the border thickens and changes to Deep Green with a subtle Amber glow for the AI assistant's "listening" state.
*   **AI Yarn Bubbles:** Chat bubbles from the AI assistant should use the Deep Green background with White text, with a unique 16px radius where the bottom-left corner is 4px (creating a "tail").
*   **Chips:** Small, Pill-shaped elements in Light Mint with Deep Green text for filtering or category selection.
*   **Progress Indicators:** Use the Amber accent for high-visibility progress tracking, representing the "intelligence" at work.