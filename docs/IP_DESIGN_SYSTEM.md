I'll analyze your current dashboard and create a comprehensive style guide based on the infographic examples you've provided. Let me first examine your current dashboard implementation.
Read file: src/app/dashboard/page.tsx
Read file: src/components/dashboard/dashboard-feature.tsx
Read file: src/app/globals.css
Now let me examine your current theme and UI component structure to better understand the foundation we're building on.
Read file: tailwind.config.ts
Ran tool
Ran tool
Based on my analysis of your current codebase and the infographic examples you've provided, I'll create a comprehensive style guide and design language for your IP OnChain Next project. Here's the complete brief:

## **IP OnChain Next Design System & Style Guide**

### **Design Philosophy: "Data as Art"**

Transform your dashboard into a living infographic that makes complex IP and royalty data immediately understandable and visually compelling. Think of each screen as a magazine spread where data tells a story through purposeful visual hierarchy, strategic use of space, and meaningful data visualization.

---

## **Visual Language Principles**

### **1. Infographic-First Approach**

- **Modular Card System**: Each data point lives in its own "infographic module"
- **Visual Data Storytelling**: Numbers are never alone - they're always accompanied by context, trends, and visual indicators
- **Scannable Hierarchy**: Information flows from macro (overview) to micro (details) like a well-designed magazine layout

### **2. Color Psychology & Application**

**Primary Palette:**

- **Primary (#7073d1)**: Trust, technology, intelligence - use for key actions, primary data points, and interactive elements
- **Secondary (#202020)**: Authority, sophistication - use for text hierarchy and structural elements
- **Accent (#dcddff)**: Clarity, highlight - use for backgrounds, subtle highlights, and success states

**Extended Palette:**

```css
:root {
  /* Core Palette */
  --primary: #7073d1;
  --secondary: #202020;
  --accent: #dcddff;

  /* Functional Extensions */
  --primary-light: #9499d9;
  --primary-dark: #5a5db8;
  --accent-strong: #b8bbf7;
  --accent-subtle: #f0f1ff;

  /* Data Visualization Palette */
  --data-positive: #10b981;
  --data-negative: #ef4444;
  --data-neutral: #6b7280;
  --data-highlight: #f59e0b;

  /* Surface Colors */
  --surface-primary: #ffffff;
  --surface-secondary: #f8fafc;
  --surface-accent: rgba(220, 221, 255, 0.1);
}
```

---

## **Typography System**

### **Font Hierarchy (Infographic-Inspired)**

**Display Typography:**

- **Hero Numbers**: `font-['Space_Grotesk'] text-4xl md:text-6xl font-bold` - For key metrics
- **Section Headers**: `font-['Space_Grotesk'] text-2xl md:text-3xl font-semibold` - For major sections
- **Card Titles**: `font-['Space_Grotesk'] text-lg font-medium` - For individual data modules

**Body Typography:**

- **Primary Text**: `font-['Futura'] text-base font-normal` - For descriptions and secondary content
- **Label Text**: `font-['Futura'] text-sm font-medium uppercase tracking-wider` - For data labels
- **Caption Text**: `font-['Futura'] text-xs font-normal` - For metadata and fine print

---

## **Layout System: "Magazine Grid"**

### **Grid Foundation**

```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1.5rem;
  padding: 2rem;
  max-width: 1440px;
  margin: 0 auto;
}

/* Responsive breakpoints */
@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
  }
}
```

### **Module Sizing (Infographic Blocks)**

- **Hero Module**: `grid-column: span 12` - Key performance indicators
- **Primary Modules**: `grid-column: span 6` - Major metrics and charts
- **Secondary Modules**: `grid-column: span 4` - Supporting data
- **Tertiary Modules**: `grid-column: span 3` - Quick stats
- **Detail Modules**: `grid-column: span 8` - Tables and detailed views

---

## **Component Design Patterns**

### **1. Metric Cards (Infographic Modules)**

**Structure:**

```tsx
interface MetricModule {
  icon: React.ComponentType
  label: string
  value: string | number
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    percentage: number
    period: string
  }
  context: string
  visualization?: 'spark' | 'progress' | 'chart'
}
```

**Design Specifications:**

- **Padding**: `24px` (creates breathing room like magazine layouts)
- **Border Radius**: `12px` (modern, approachable)
- **Shadow**: Subtle depth with `0 4px 12px rgba(112, 115, 209, 0.08)`
- **Border**: `1px solid rgba(220, 221, 255, 0.3)`
- **Hover State**: Slight lift with `transform: translateY(-2px)` and increased shadow

### **2. Data Visualization Principles**

**Chart Color Mapping:**

- **Primary Data**: Use primary color (#7073d1)
- **Comparative Data**: Use accent variations
- **Negative Values**: Use data-negative (#ef4444)
- **Positive Values**: Use data-positive (#10b981)

**Visual Hierarchy in Charts:**

- **Main Data**: 100% opacity
- **Supporting Data**: 60% opacity
- **Background Elements**: 20% opacity

### **3. Interactive Elements**

**Hover States:**

- **Cards**: Lift effect with enhanced shadow
- **Buttons**: Background color shift to accent-strong
- **Data Points**: Tooltip with detailed context

**Loading States:**

- **Skeleton**: Use accent-subtle with gentle pulse animation
- **Progressive Loading**: Show structural elements first, then populate with data

---

## **Dashboard Implementation Strategy**

### **Phase 1: Hero Section (Week 1)**

```tsx
// Hero Metrics Grid
<section className="dashboard-hero grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
  <MetricCard
    size="large"
    title="Total Royalties"
    value="$47,892"
    trend={{ direction: 'up', value: '12%', period: 'this month' }}
    visualization="spark"
  />
  <MetricCard title="Active Works" value="156" icon={Music} context="Generating revenue" />
  <MetricCard title="Contributors" value="89" icon={Users} context="Across all projects" />
  <MetricCard title="Organizations" value="12" icon={Building} context="Managing IP" />
</section>
```

### **Phase 2: Data Visualization Grid (Week 2)**

```tsx
// Main Content Grid
<section className="dashboard-content grid grid-cols-12 gap-6">
  {/* Revenue Trends - Takes up 8 columns */}
  <Card className="col-span-12 lg:col-span-8">
    <RevenueChart />
  </Card>

  {/* Quick Stats - Takes up 4 columns */}
  <div className="col-span-12 lg:col-span-4 space-y-6">
    <TopPerformingWorks />
    <RecentActivity />
  </div>

  {/* Works Overview - Full width */}
  <Card className="col-span-12">
    <WorksTable />
  </Card>
</section>
```

### **Phase 3: Micro-interactions & Polish (Week 3)**

- **Staggered Animations**: Cards animate in with slight delays
- **Data Loading**: Progressive enhancement as data loads
- **Responsive Breakpoints**: Seamless mobile experience
- **Accessibility**: Proper ARIA labels and keyboard navigation

---

## **Technical Implementation Guidelines**

### **CSS Custom Properties for Consistency**

```css
:root {
  /* Spacing Scale (Based on 8px grid) */
  --space-xs: 0.5rem; /* 8px */
  --space-sm: 0.75rem; /* 12px */
  --space-md: 1rem; /* 16px */
  --space-lg: 1.5rem; /* 24px */
  --space-xl: 2rem; /* 32px */
  --space-2xl: 3rem; /* 48px */

  /* Border Radius Scale */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  /* Typography Scale */
  --text-xs: 0.75rem; /* 12px */
  --text-sm: 0.875rem; /* 14px */
  --text-base: 1rem; /* 16px */
  --text-lg: 1.125rem; /* 18px */
  --text-xl: 1.25rem; /* 20px */
  --text-2xl: 1.5rem; /* 24px */
  --text-3xl: 1.875rem; /* 30px */
  --text-4xl: 2.25rem; /* 36px */
}
```

### **Component Architecture**

```tsx
// Base Metric Card Component
export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  context,
  size = 'medium',
  visualization,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        'hover:shadow-lg hover:-translate-y-1',
        'border border-accent/30 bg-surface-primary',
        size === 'large' && 'p-8',
        size === 'medium' && 'p-6',
        size === 'small' && 'p-4',
      )}
    >
      {/* Implementation */}
    </Card>
  )
}
```

---

## **Success Metrics**

**User Experience Goals:**

- **Scan Time**: Users should understand key metrics within 3 seconds
- **Information Density**: Maximum data insights with minimal cognitive load
- **Visual Appeal**: Dashboard should feel like a premium data magazine
- **Mobile Experience**: Seamless responsive behavior across all devices

**Technical Performance:**

- **Load Time**: Initial render under 1.5 seconds
- **Interaction Response**: All hover/click states under 150ms
- **Animation Performance**: 60fps for all transitions

This design system transforms your dashboard from a simple data display into an engaging, infographic-style experience that makes complex IP and royalty information immediately accessible and visually compelling.
