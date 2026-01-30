# RFIDIA Technology - Design System Guide

## Overview
This document outlines the professional design system implemented for SalesTracker Pro, aligned with RFIDIA Technology branding.

## Brand Colors

### Primary Colors (from RFIDIA Logo)

#### Purple (Primary)
- **Main**: `#6B4C9A` - Deep purple from logo
- **Light**: `#9B7EBD` - Lighter purple variant
- **Dark**: `#4A3567` - Darker purple variant
- **Usage**: Primary actions, headers, key UI elements

#### Coral/Pink (Secondary)
- **Main**: `#E85D75` - Coral pink from logo
- **Light**: `#F28B9D` - Lighter coral variant
- **Usage**: Secondary actions, accents, highlights

#### Turquoise (Accent)
- **Main**: `#4FC3DC` - Turquoise blue from logo
- **Light**: `#7DD3E8` - Lighter turquoise variant
- **Usage**: Success states, interactive elements, call-to-actions

### Background Colors

- **Background**: `#F8F9FC` - Light gray-blue for clean, modern look
- **Card**: `#FFFFFF` - White cards for content
- **Muted**: `#F1F3F9` - Light muted backgrounds

### Text Colors

- **Primary Text**: `#1A1A2E` - Dark text for readability
- **Secondary Text**: `#6B7280` - Gray text for secondary content
- **Light Text**: `#9CA3AF` - Light gray for subtle text

### Status Colors

- **Success**: `#10B981` - Green for success states
- **Warning**: `#F59E0B` - Amber for warnings
- **Error**: `#EF4444` - Red for errors

## Gradients

### RFIDIA Gradient
```css
background: linear-gradient(135deg, #6B4C9A 0%, #E85D75 50%, #4FC3DC 100%);
```
**Usage**: Primary buttons, hero sections, brand elements

### Subtle RFIDIA Gradient
```css
background: linear-gradient(135deg, rgba(107, 76, 154, 0.1) 0%, rgba(232, 93, 117, 0.1) 50%, rgba(79, 195, 220, 0.1) 100%);
```
**Usage**: Hover states, subtle backgrounds

### Text Gradient
```css
background: linear-gradient(135deg, #6B4C9A 0%, #E85D75 50%, #4FC3DC 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```
**Usage**: Headlines, brand text

## Typography

### Font Families
- **Display**: 'Inter Display' - For headings and titles
- **Body**: 'Source Sans 3' - For body text
- **CTA**: 'Outfit' - For buttons and call-to-actions
- **Mono**: 'JetBrains Mono' - For code and technical content

## Components

### Header
- **Height**: 80px (20 in Tailwind)
- **Background**: White with subtle shadow
- **Logo**: RFIDIA logo prominently displayed
- **Navigation**: Clean, modern with hover effects using RFIDIA colors

### Cards
- **Background**: White
- **Border**: Light gray (`#E5E7EB`)
- **Shadow**: Elevated shadow with purple tint
- **Radius**: 16px (rounded-2xl)
- **Hover**: Lift effect with enhanced shadow

### Buttons

#### Primary Button
- **Background**: RFIDIA gradient
- **Text**: White
- **Hover**: Slight opacity change + scale
- **Shadow**: RFIDIA-colored shadow

#### Secondary Button
- **Background**: Subtle gradient background
- **Text**: Primary color
- **Border**: Primary color
- **Hover**: Filled with gradient

### KPI Cards
- **Background**: White with subtle colored overlay
- **Icon**: Gradient background matching KPI type
- **Size**: Larger, more prominent
- **Spacing**: Generous padding for breathing room

## Design Principles

### 1. Professional & Clean
- Ample white space
- Clear hierarchy
- Consistent spacing
- Subtle animations

### 2. Brand Consistency
- RFIDIA logo prominently displayed
- Brand colors used consistently
- Gradient used for key actions
- Professional color palette

### 3. Modern & Accessible
- High contrast for readability
- Clear visual feedback
- Smooth transitions
- Responsive design

### 4. Visual Hierarchy
- Clear distinction between primary and secondary elements
- Consistent use of color to indicate importance
- Typography scale for content hierarchy

## Implementation Notes

### CSS Variables
All colors are defined as CSS variables in `globals.css` for easy maintenance and consistency.

### Tailwind Classes
Custom utility classes added:
- `.gradient-rfidia` - Full RFIDIA gradient
- `.gradient-rfidia-subtle` - Subtle background gradient
- `.text-gradient-rfidia` - Text with gradient
- `.shadow-rfidia` - Brand-colored shadow

### Component Updates
1. **Header**: Updated with RFIDIA logo and new color scheme
2. **Dashboard**: Light background with colored orbs
3. **KPI Cards**: Enhanced with better spacing and shadows
4. **Login Page**: RFIDIA logo and colored orbs
5. **Buttons**: Gradient backgrounds throughout

## Logo Usage

### Primary Logo
- **Location**: `/assets/images/rfidia.png`
- **Header Size**: 48px height (h-12)
- **Login Size**: 256-320px width
- **Always maintain aspect ratio**

### Logo Placement
- **Header**: Left side with separator and tagline
- **Login**: Centered above form
- **Footer**: Optional with copyright

## Accessibility

- **Contrast Ratios**: All text meets WCAG AA standards
- **Focus States**: Clear focus indicators on interactive elements
- **Color Independence**: Information not conveyed by color alone
- **Responsive**: Works on all screen sizes

## Animation Guidelines

- **Duration**: 200-300ms for most transitions
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` for smooth motion
- **Hover Effects**: Subtle scale (1.05) and lift (-translate-y)
- **Loading States**: Smooth fade-in animations

## Spacing System

- **Base Unit**: 4px (Tailwind's default)
- **Component Padding**: 16-24px (4-6 in Tailwind)
- **Section Spacing**: 32-48px (8-12 in Tailwind)
- **Page Margins**: 16-32px (4-8 in Tailwind)

## Shadow System

- **Elevated**: Subtle shadow for cards
- **Prominent**: Stronger shadow for modals/dropdowns
- **RFIDIA**: Brand-colored shadow for primary elements
- **Depth Layered**: Multi-layer shadow for depth

---

**Last Updated**: January 30, 2026
**Version**: 1.0
**Brand**: RFIDIA Technology
