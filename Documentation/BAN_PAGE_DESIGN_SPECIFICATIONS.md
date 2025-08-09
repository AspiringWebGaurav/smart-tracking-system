# Ban Page Design Specifications

## Visual Design System for 4 Ban Categories

This document provides detailed visual specifications for each ban page category, ensuring consistent, professional, and enterprise-grade designs that fit within a single viewport without scrolling.

---

## Design Principles

### Core Requirements
- ✅ **No Scrolling**: All content fits in 100vh viewport
- ✅ **Professional**: Enterprise-grade visual design
- ✅ **Responsive**: Mobile-first approach (320px to 1920px+)
- ✅ **Accessible**: WCAG 2.1 AA compliance
- ✅ **Consistent**: Unified layout structure across all categories
- ✅ **Distinctive**: Each category visually distinct and recognizable

### Layout Structure (Consistent Across All Categories)
```
┌─────────────────────────────────────────────────────────────┐
│ Real-time Status Indicator (if monitoring active)          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    HEADER                           │   │
│  │  [ICON] Category Title                              │   │
│  │         Subtitle & Status                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   CONTENT                           │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │ Policy Ref  │ │ Ban Reason  │ │ Information │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  │                                                     │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │            ACTION SECTION                   │   │   │
│  │  │        [Submit Appeal Button]               │   │   │
│  │  │        Processing Time Info                 │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Category 1: NORMAL (Default/Standard)

### Visual Theme
- **Primary Colors**: `#3B82F6` (Blue 500) to `#06B6D4` (Cyan 500)
- **Background**: `from-slate-900 via-gray-900 to-black`
- **Accent**: `#60A5FA` (Blue 400)
- **Text**: White/Blue tones
- **Border**: `border-blue-500/20`

### Design Characteristics
- **Tone**: Professional, informative, procedural
- **Visual Weight**: Light to moderate
- **Animation**: Subtle pulse effects
- **Icon**: Information circle with "i"

### Content Specifications
```typescript
{
  title: "Access Temporarily Restricted",
  subtitle: "Portfolio access under policy review",
  description: "Your access has been temporarily suspended for policy review. This is a standard procedure.",
  warningLevel: "info",
  processingTime: "24-48 hours",
  appealMessage: "If you believe this restriction was applied in error, you may submit an appeal for review.",
  buttonText: "Submit Appeal",
  buttonStyle: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
}
```

### Responsive Breakpoints
- **Mobile (320-768px)**: Single column, compact spacing
- **Tablet (768-1024px)**: Two-column content grid
- **Desktop (1024px+)**: Three-column content grid

---

## Category 2: MEDIUM (Moderate Violations)

### Visual Theme
- **Primary Colors**: `#F59E0B` (Amber 500) to `#EAB308` (Yellow 500)
- **Background**: `from-slate-900 via-amber-900/10 to-black`
- **Accent**: `#FBBF24` (Amber 400)
- **Text**: White/Amber tones
- **Border**: `border-amber-500/20`

### Design Characteristics
- **Tone**: Cautionary, attention-grabbing, firm
- **Visual Weight**: Moderate
- **Animation**: Warning pulse, gentle shake on load
- **Icon**: Warning triangle with exclamation

### Content Specifications
```typescript
{
  title: "Access Suspended",
  subtitle: "Policy violations detected",
  description: "Your access has been suspended due to policy violations. Immediate attention required.",
  warningLevel: "warning",
  processingTime: "24-48 hours",
  appealMessage: "Review the policy violations and submit an appeal if you believe this action was taken in error.",
  buttonText: "Submit Appeal",
  buttonStyle: "bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
}
```

### Enhanced Visual Elements
- **Warning Indicators**: Animated warning icons
- **Attention Grabbers**: Subtle border glow effects
- **Status Badge**: "REVIEW REQUIRED" badge

---

## Category 3: DANGER (Serious Violations)

### Visual Theme
- **Primary Colors**: `#F97316` (Orange 500) to `#EF4444` (Red 500)
- **Background**: `from-slate-900 via-red-900/20 to-black`
- **Accent**: `#FB923C` (Orange 400)
- **Text**: White/Orange-Red tones
- **Border**: `border-orange-500/30`

### Design Characteristics
- **Tone**: Urgent, serious, authoritative
- **Visual Weight**: Heavy
- **Animation**: Strong pulse, urgent attention effects
- **Icon**: Shield with exclamation mark

### Content Specifications
```typescript
{
  title: "Access Denied",
  subtitle: "Serious policy violations detected",
  description: "Access has been denied due to serious policy violations. This action requires immediate administrative review.",
  warningLevel: "danger",
  processingTime: "48-72 hours",
  appealMessage: "Serious violations have been detected. Appeals will be thoroughly reviewed by our security team.",
  buttonText: "Submit Formal Appeal",
  buttonStyle: "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
}
```

### Enhanced Visual Elements
- **Urgency Indicators**: Pulsing red accents
- **Security Badges**: "SECURITY REVIEW" status
- **Enhanced Borders**: Thicker, more prominent borders

---

## Category 4: SEVERE (Critical Violations)

### Visual Theme
- **Primary Colors**: `#DC2626` (Red 600) to `#991B1B` (Red 800)
- **Background**: `from-slate-900 via-red-900/30 to-black`
- **Accent**: `#F87171` (Red 400)
- **Text**: White/Red tones
- **Border**: `border-red-600/40`

### Design Characteristics
- **Tone**: Strict, final, maximum authority
- **Visual Weight**: Maximum
- **Animation**: Strong, attention-demanding effects
- **Icon**: Ban/Block symbol (circle with diagonal line)

### Content Specifications
```typescript
{
  title: "Access Permanently Restricted",
  subtitle: "Critical security violation",
  description: "Access has been permanently restricted due to critical policy violations. This decision requires executive review.",
  warningLevel: "critical",
  processingTime: "72-96 hours",
  appealMessage: "Critical violations detected. Appeals require executive review and may take extended time to process.",
  buttonText: "Submit Executive Appeal",
  buttonStyle: "bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900"
}
```

### Enhanced Visual Elements
- **Maximum Urgency**: Strong red pulsing effects
- **Authority Indicators**: "EXECUTIVE REVIEW" badges
- **Final Warning Style**: Bold, unmistakable visual hierarchy

---

## Responsive Design Specifications

### Mobile (320px - 768px)
```css
.ban-page-mobile {
  padding: 1rem;
  
  .header {
    padding: 1rem;
    flex-direction: column;
    text-align: center;
  }
  
  .content-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .action-section {
    padding: 1rem;
    text-align: center;
  }
  
  .policy-reference {
    font-size: 1rem;
    word-break: break-all;
  }
}
```

### Tablet (768px - 1024px)
```css
.ban-page-tablet {
  padding: 1.5rem;
  
  .content-grid {
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
  
  .action-section {
    grid-column: span 2;
  }
}
```

### Desktop (1024px+)
```css
.ban-page-desktop {
  padding: 2rem;
  
  .content-grid {
    grid-template-columns: 1fr 1fr 1fr;
    gap: 2rem;
  }
  
  .action-section {
    grid-column: span 3;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
```

---

## Animation Specifications

### Category Transition Animation
```css
@keyframes categoryTransition {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  50% {
    opacity: 0.5;
    transform: translateY(10px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.category-transition {
  animation: categoryTransition 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Loading States
```css
@keyframes shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}

.loading-shimmer {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  background-size: 200px 100%;
  animation: shimmer 1.5s infinite;
}
```

---

## Accessibility Specifications

### Color Contrast Ratios
- **Normal**: 4.5:1 minimum (WCAG AA)
- **Medium**: 4.5:1 minimum (WCAG AA)
- **Danger**: 7:1 minimum (WCAG AAA)
- **Severe**: 7:1 minimum (WCAG AAA)

### Screen Reader Support
```html
<div role="alert" aria-live="polite" aria-label="Access restriction notice">
  <h1 id="ban-title">Access Temporarily Restricted</h1>
  <p id="ban-description" aria-describedby="ban-title">...</p>
</div>
```

### Keyboard Navigation
- Tab order: Status → Policy Reference → Ban Reason → Information → Appeal Button
- Focus indicators: 2px solid outline with category color
- Skip links: "Skip to appeal form" option

---

## Performance Specifications

### Loading Targets
- **Initial Load**: < 500ms
- **Category Switch**: < 300ms
- **Firebase Sync**: < 200ms
- **Animation Duration**: 300-600ms

### Bundle Size Targets
- **Core Component**: < 15KB gzipped
- **Design Configs**: < 5KB per category
- **Total Addition**: < 35KB to existing bundle

---

## Testing Specifications

### Visual Regression Tests
- Screenshot comparison for each category
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Mobile device testing (iOS Safari, Chrome Mobile)

### Accessibility Tests
- Screen reader compatibility (NVDA, JAWS, VoiceOver)
- Keyboard navigation testing
- Color contrast validation

### Performance Tests
- Lighthouse scores > 90 for all metrics
- Core Web Vitals compliance
- Memory usage monitoring

---

## Implementation Priority

### Phase 1: Core Structure
1. ✅ Base component architecture
2. ✅ Firebase schema setup
3. ✅ Category switching logic

### Phase 2: Visual Implementation
1. 🔄 Normal category design
2. 🔄 Medium category design
3. 🔄 Danger category design
4. 🔄 Severe category design

### Phase 3: Integration
1. 🔄 Admin interface integration
2. 🔄 Real-time sync implementation
3. 🔄 Testing and optimization

This specification ensures each ban page category is visually distinct, professionally designed, and provides appropriate visual feedback for the severity of the violation while maintaining consistency and usability across all designs.