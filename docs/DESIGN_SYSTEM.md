# Campus Connect Design System

**Version:** 1.0.0  
**Last Updated:** November 15, 2025

## Design Principles

1. **Mobile-First**: Always design for mobile, then scale up
2. **Touch-Friendly**: Minimum 44px tap targets
3. **Readable**: Clear hierarchy, proper contrast
4. **Consistent**: Uniform spacing, typography, and components
5. **Accessible**: WCAG 2.1 AA compliance

---

## Spacing System

### Container Padding
```tsx
// Mobile-first approach
className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8"

// Page containers
className="container mx-auto px-4 py-4 sm:py-6 lg:py-8"

// Max-width containers
className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
```

### Gap Spacing
```tsx
// Cards/Grid gaps
gap-4        // Mobile: 1rem (16px)
sm:gap-6     // Tablet: 1.5rem (24px)
lg:gap-8     // Desktop: 2rem (32px)

// Inline spacing
space-x-2    // 0.5rem (8px)
space-x-3    // 0.75rem (12px)
space-x-4    // 1rem (16px)
```

---

## Typography

### Headings
```tsx
// Page Title (H1)
className="text-2xl sm:text-3xl lg:text-4xl font-bold"

// Section Title (H2)
className="text-xl sm:text-2xl lg:text-3xl font-semibold"

// Card Title (H3)
className="text-base sm:text-lg lg:text-xl font-semibold"

// Subsection (H4)
className="text-sm sm:text-base font-medium"
```

### Body Text
```tsx
// Regular text
className="text-sm sm:text-base"

// Muted text
className="text-xs sm:text-sm text-muted-foreground"

// Small text
className="text-xs"
```

### Text Utilities
```tsx
// Truncation
className="truncate"              // Single line
className="line-clamp-2"          // Two lines
className="line-clamp-3"          // Three lines

// Responsive visibility
className="hidden sm:inline"      // Show on tablet+
className="sm:hidden"             // Hide on tablet+
```

---

## Layout Patterns

### Responsive Grid
```tsx
// Standard grid (1 → 2 → 3 columns)
className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"

// Wide grid (1 → 2 → 4 columns)
className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"

// Asymmetric grid (1 → 2 → 3:1 ratio)
className="grid gap-4 sm:gap-6 lg:grid-cols-4"
// Main content: lg:col-span-3
// Sidebar: lg:col-span-1
```

### Flex Layouts
```tsx
// Stack on mobile, row on desktop
className="flex flex-col sm:flex-row items-start sm:items-center gap-4"

// Space between with wrapping
className="flex flex-wrap items-center justify-between gap-4"

// Centered content
className="flex items-center justify-center gap-2"
```

### Header Pattern
```tsx
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
  <div>
    <h1 className="text-2xl sm:text-3xl font-bold">Title</h1>
    <p className="text-sm sm:text-base text-muted-foreground">Description</p>
  </div>
  <Button className="w-full sm:w-auto">Action</Button>
</div>
```

---

## Component Patterns

### Cards
```tsx
<Card className="hover:shadow-md transition-shadow">
  <CardHeader className="pb-3 sm:pb-4">
    <div className="flex items-start justify-between gap-2">
      <CardTitle className="text-base sm:text-lg truncate">Title</CardTitle>
      <Badge className="shrink-0">Status</Badge>
    </div>
    <CardDescription className="text-sm line-clamp-2">
      Description text
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-3">
    {/* Content */}
  </CardContent>
</Card>
```

### Buttons
```tsx
// Primary action
<Button className="w-full sm:w-auto" size="default">
  <Icon className="h-4 w-4 mr-2" />
  <span>Action</span>
</Button>

// Secondary action
<Button variant="outline" size="sm">
  <span className="text-sm">Action</span>
</Button>

// Icon button
<Button variant="ghost" size="icon">
  <Icon className="h-4 w-4" />
</Button>
```

### Badges
```tsx
// Status badge
<Badge variant={isActive ? "default" : "secondary"} className="text-xs">
  {status}
</Badge>

// Count badge
<Badge variant="outline" className="text-xs">
  {count}
</Badge>
```

### Stats Cards
```tsx
<Card>
  <CardHeader className="pb-2">
    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
      Metric Name
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-xl sm:text-2xl font-bold">{value}</div>
    <p className="text-xs text-muted-foreground mt-1">
      Additional info
    </p>
  </CardContent>
</Card>
```

---

## Responsive Breakpoints

```tsx
// Tailwind default breakpoints
sm: 640px   // Small tablets
md: 768px   // Tablets
lg: 1024px  // Laptops
xl: 1280px  // Desktops
2xl: 1536px // Large desktops

// Usage
className="
  w-full           // Mobile (< 640px)
  sm:w-auto        // Tablet (≥ 640px)
  lg:w-64          // Desktop (≥ 1024px)
"
```

---

## Interactive States

### Hover & Focus
```tsx
// Card hover
className="hover:shadow-md transition-shadow"

// Button hover
className="hover:bg-accent/10 hover:scale-105 transition-all"

// Focus visible
className="focus-visible:ring-2 focus-visible:ring-primary"
```

### Loading States
```tsx
// Skeleton
<Skeleton className="h-4 w-full sm:w-3/4" />

// Spinner
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
```

---

## Color Usage

### Background Layers
```tsx
background           // Base layer
muted/20            // Subtle accent
card                // Elevated content
card/60             // Translucent card
```

### Text Hierarchy
```tsx
foreground          // Primary text
muted-foreground    // Secondary text
primary             // Brand color
destructive         // Error states
```

### Status Colors
```tsx
// Success
className="text-green-500 bg-green-500/10"

// Warning
className="text-yellow-500 bg-yellow-500/10"

// Error
className="text-red-500 bg-red-500/10"

// Info
className="text-blue-500 bg-blue-500/10"
```

---

## Accessibility

### Semantic HTML
```tsx
// Use proper heading hierarchy
<h1> → <h2> → <h3>

// Use semantic elements
<main>, <nav>, <section>, <article>

// Add ARIA labels
<Button aria-label="Close menu">
  <X className="h-4 w-4" />
</Button>
```

### Keyboard Navigation
```tsx
// Focus management
className="focus:outline-none focus-visible:ring-2"

// Tab order
tabIndex={0}  // In natural order
tabIndex={-1} // Not tabbable
```

---

## Mobile-Specific Patterns

### Touch Targets
```tsx
// Minimum 44px × 44px
className="min-h-[44px] min-w-[44px]"

// Button sizing
size="sm"    // 36px (mobile)
size="default" // 40px
size="lg"    // 44px (recommended for mobile)
```

### Safe Areas
```tsx
// Avoid content at screen edges
className="px-4 safe-area-inset-left safe-area-inset-right"

// Bottom navigation spacing
className="pb-24" // Account for dock
```

### Gesture-Friendly
```tsx
// Swipeable elements
className="touch-pan-x"

// Prevent text selection
className="select-none"

// Enable momentum scrolling
className="overflow-y-auto overscroll-contain"
```

---

## Performance

### Image Optimization
```tsx
import Image from "next/image"

<Image
  src="/path/to/image.jpg"
  alt="Description"
  width={400}
  height={300}
  loading="lazy"
  className="rounded-lg"
/>
```

### Conditional Rendering
```tsx
// Load heavy components on demand
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton className="h-64 w-full" />
})
```

---

## Code Examples

### Complete Page Template
```tsx
export default function ExamplePage() {
  const isMobile = useIsMobile()
  
  return (
    <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Page Title</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Description text
          </p>
        </div>
        <Button className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create New
        </Button>
      </div>

      {/* Content Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base sm:text-lg truncate">
                  {item.title}
                </CardTitle>
                <Badge className="shrink-0">{item.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

---

## Checklist for New Features

- [ ] Mobile-first responsive design
- [ ] Touch-friendly interactive elements (≥44px)
- [ ] Proper heading hierarchy
- [ ] Loading states implemented
- [ ] Error states handled
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Text is readable (proper contrast)
- [ ] Images optimized
- [ ] Performance tested on mobile

---

## Resources

- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **Mobile UX**: https://web.dev/mobile

