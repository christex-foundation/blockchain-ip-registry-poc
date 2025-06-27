# Volcano Design System

## Overview

The Volcano landing page adopts a minimal, cinematic aesthetic inspired by the natural power and beauty of volcanic landscapes. The design emphasizes visual impact through negative space, dramatic imagery, and clean typography.

## Design Philosophy

- **Minimal**: Less is more - let the content breathe
- **Cinematic**: Full-screen immersive experience
- **Natural**: Drawing inspiration from volcanic landscapes
- **Elegant**: Refined typography and spacing
- **Accessible**: High contrast and readable text

## Color Palette

### Primary Colors

- **Background Image**: Natural volcanic landscape with warm tones
- **Overlay**: `rgba(0, 0, 0, 0.5)` - Semi-transparent black for readability
- **Text Primary**: Pure white (`#ffffff`) for maximum contrast
- **Text Secondary**: White with 90% opacity (`rgba(255, 255, 255, 0.9)`)
- **Text Muted**: White with 70% opacity (`rgba(255, 255, 255, 0.7)`)
- **Text Footer**: White with 60% opacity (`rgba(255, 255, 255, 0.6)`)

### Interactive Elements

- **Button Background**: White with 10% opacity + backdrop blur
- **Button Hover**: White with 20% opacity
- **Button Border**: White with 20% opacity

## Typography

### Font Weights

- **Ultra Light**: `font-extralight` (200) - Main "volcano" title
- **Light**: `font-light` (300) - Subtitles and body text
- **Normal**: Default weight for UI elements

### Font Sizes

- **Hero Title**: `text-8xl md:text-9xl lg:text-[180px]` - Massive, impactful
- **Navigation**: `text-2xl` - Clean and readable
- **Subtitle**: `text-2xl md:text-3xl` - Prominent but not competing
- **Body Text**: `text-lg md:text-xl` - Comfortable reading size
- **Footer**: `text-sm` - Minimal and unobtrusive

### Typography Principles

- **Letter Spacing**: `tracking-tight` for titles, `tracking-wide` for UI elements
- **Line Height**: `leading-none` for titles, `leading-relaxed` for body text
- **Text Alignment**: Centered for hero content

## Layout & Spacing

### Grid System

- **Container**: `max-w-4xl mx-auto` - Focused content width
- **Padding**: `px-8 py-6` - Consistent spacing throughout
- **Vertical Rhythm**: `space-y-6`, `space-y-8`, `space-y-12` - Progressive spacing

### Layout Structure

```
┌─────────────────────────────────┐
│ Navigation (Fixed Top)          │
├─────────────────────────────────┤
│  ┌─────┐ ┌─────────────┐ ┌─────┐ │
│  │Secur│ │             │ │Users│ │
│  └─────┘ │    Hero     │ └─────┘ │
│          │   Content   │         │
│  ┌─────┐ │  (Center)   │ ┌─────┐ │
│  │ Zap │ │             │ │ ??? │ │
│  └─────┘ └─────────────┘ └─────┘ │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──┐ │
│  │10K+  │ │ $2M+ │ │ 500+ │ │24│ │
│  └──────┘ └──────┘ └──────┘ └──┘ │
├─────────────────────────────────┤
│ Footer (Fixed Bottom)           │
└─────────────────────────────────┐
```

## Components

### Navigation

- **Position**: Fixed top with minimal styling
- **Logo**: Simple text-based logo "volcano"
- **Menu**: Single hamburger menu icon
- **Background**: Transparent with hover states

### Hero Section

- **Layout**: CSS Grid with 12x8 bento box structure
- **Main Hero**: 8-column span, centered content
- **Hierarchy**:
  1. Main title "volcano" (dominant)
  2. Question subtitle (supporting)
  3. Descriptive text (context)
  4. Call-to-action button (action)

### Bento Box Grid

- **Feature Cards**: 2-column spans with icons and minimal text
- **Stats Cards**: 3-column spans with key metrics
- **Glass Morphism**: Semi-transparent cards with backdrop blur
- **Responsive**: Adapts from 12-column grid on desktop to stacked on mobile

### Footer

- **Style**: Minimal with copyright and social links
- **Position**: Fixed bottom
- **Content**: Essential information only

## Visual Effects

### Background Treatment

- **Image**: High-resolution futuristic volcanic landscape with dramatic lighting
- **Aesthetic**: Combines natural volcanic power with sci-fi elements
- **Overlay**: Gradient overlay from black/60 to black/70 for text readability
- **Sizing**: `bg-cover bg-center` for optimal display

### Interactive Elements

- **Buttons**: Glass morphism effect with backdrop blur
- **Hover States**: Subtle opacity changes
- **Transitions**: Smooth and natural feeling

## Responsive Design

### Breakpoints

- **Mobile**: Base styles with smaller text
- **Tablet**: `md:` - Increased text sizes
- **Desktop**: `lg:` - Maximum impact with largest text

### Progressive Enhancement

- Text sizes scale appropriately across devices
- Spacing adjusts for different screen sizes
- Background image remains impactful on all devices

## Accessibility

### Contrast Ratios

- White text on dark overlay meets WCAG AA standards
- Interactive elements have clear focus states
- Text sizes are large enough for comfortable reading

### Navigation

- Keyboard accessible
- Screen reader friendly
- Clear visual hierarchy

## Brand Voice

The design reflects a brand that is:

- **Powerful**: Like a volcano's natural force
- **Minimal**: Clean and uncluttered
- **Premium**: High-quality and refined
- **Trustworthy**: Professional and reliable
- **Modern**: Contemporary aesthetic

## Implementation Notes

### Performance

- Background image is optimized through Unsplash CDN
- Minimal JavaScript and CSS for fast loading
- Modern CSS features like backdrop-filter for visual effects

### Browser Support

- Modern browsers supporting backdrop-filter
- Graceful degradation for older browsers
- Responsive design works across all device sizes
