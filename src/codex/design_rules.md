# Resume Design Rules & Formatting Standards

This document outlines the strict formatting standards for the resume generation. These rules complement the content rules in `drc_rules.md`.

## 1. Layout & Geometry
*   **Margins:** 
    *   PDF Generator: `0in` (No external margins).
    *   CSS: `@page { margin: 0.4in 0.5in; }` (Controls layout for all pages).
*   **Page Size:** Letter (8.5in x 11in).
*   **Alignment:**
    *   **Header:** Must be **Center Aligned**.
    *   **Professional Summary:** Must be **Justified**.
    *   **Section Titles:** Left aligned (unless specified otherwise).
    *   **Body Text:** Left aligned.

## 2. Typography
*   **Fonts:**
    *   Headings: `Merriweather` (Serif)
    *   Body: `Inter` (Sans-serif)
*   **Sizing:**
    *   Name: `20pt`
    *   Section Headers: `9.5pt`
    *   Body Text: `9pt`
    *   Contact Info: `8.5pt`

## 3. Visual Hierarchy
*   **Header Section:**
    *   Name should be prominent.
    *   Contact info should be compact.
    *   Must include a bottom border separator.
*   **Spacing:**
    *   Minimize whitespace to maximize content density.
    *   Use CSS `gap` for consistent spacing between elements.

## 4. CSS Implementation Guidelines
*   Do not rely on browser default margins. Explicitly set `margin: 0` and `padding: 0` for `body` and `@page`.
*   Use Flexbox for layout structures.
*   Colors should use CSS variables defined in `:root`.

## 5. PDF Generation
*   Puppeteer/Chromium must be configured with `margin: { top: 0, right: 0, bottom: 0, left: 0 }`.
*   `printBackground: true` must be enabled.
