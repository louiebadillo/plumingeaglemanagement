# 🎨 Color Customization Guide

This guide explains how colors are configured in the application and how to customize them for headers, buttons, and other UI elements.

## 📍 Color Configuration Locations

### 1. **Theme Files** (`src/themes/`)

The main color configurations are in the theme files:

- **`src/themes/default.js`** - Default theme (currently active)
- **`src/themes/secondary.js`** - Alternative color scheme
- **`src/themes/success.js`** - Green-based theme
- **`src/themes/dark.js`** - Dark mode theme

### 2. **Current Color Palette** (Default Theme)

```javascript
// src/themes/default.js
const primary = '#536DFE';      // Blue - Used for header, primary buttons
const secondary = '#FF5C93';    // Pink - Used for secondary buttons
const warning = '#FFC260';      // Yellow/Orange - Warning messages
const success = '#3CD4A0';      // Green - Success messages
const info = '#9013FE';         // Purple - Info messages
```

## 🎯 What Colors Control

### **Primary Color** (`theme.palette.primary.main`)
- ✅ **Header/AppBar background** - The top navigation bar
- ✅ **Primary buttons** - Main action buttons (Save, Submit, etc.)
- ✅ **Links and active states**
- ✅ **Selected menu items**
- ✅ **Progress indicators**

### **Secondary Color** (`theme.palette.secondary.main`)
- ✅ **Secondary buttons** - Alternative action buttons
- ✅ **Accent elements**
- ✅ **Hover states**

### **Warning Color** (`theme.palette.warning.main`)
- ✅ **Warning messages and alerts**
- ✅ **Caution indicators**

### **Success Color** (`theme.palette.success.main`)
- ✅ **Success messages and alerts**
- ✅ **Completed status indicators**

### **Info Color** (`theme.palette.info.main`)
- ✅ **Information messages**
- ✅ **Info tooltips**

## 🔧 How to Customize Colors

### Option 1: Edit the Default Theme (Recommended)

Edit `src/themes/default.js`:

```javascript
import tinycolor from 'tinycolor2';

// Change these hex color values to your brand colors
const primary = '#YOUR_PRIMARY_COLOR';      // e.g., '#1976d2' for blue
const secondary = '#YOUR_SECONDARY_COLOR';   // e.g., '#dc004e' for red
const warning = '#FFC260';
const success = '#3CD4A0';
const info = '#9013FE';

// The theme automatically generates light and dark variants
const lightenRate = 7.5;
const darkenRate = 15;

export default {
  palette: {
    primary: {
      main: primary,
      light: tinycolor(primary).lighten(lightenRate).toHexString(),
      dark: tinycolor(primary).darken(darkenRate).toHexString(),
    },
    // ... rest of the palette
  },
};
```

### Option 2: Create a Custom Theme

1. Create a new file: `src/themes/custom.js`
2. Copy the structure from `default.js`
3. Update the color values
4. Add it to `src/themes/index.js`:

```javascript
import customTheme from './custom';

export default {
  default: createTheme({ ...defaultTheme, ...overrides }),
  custom: createTheme({ ...customTheme, ...overrides }), // Add this line
  // ... other themes
};
```

## 🎨 Color Examples

### Common Color Schemes

**Healthcare/Medical:**
```javascript
const primary = '#2E7D32';      // Medical green
const secondary = '#1976D2';    // Trust blue
```

**Corporate/Professional:**
```javascript
const primary = '#1976D2';      // Professional blue
const secondary = '#424242';    // Dark gray
```

**Warm/Inviting:**
```javascript
const primary = '#FF6B35';      // Warm orange
const secondary = '#F7931E';   // Golden yellow
```

**Cool/Modern:**
```javascript
const primary = '#536DFE';      // Modern blue (current)
const secondary = '#FF5C93';    // Modern pink (current)
```

## 📝 Component-Specific Colors

### Header Background
The header uses `theme.palette.primary.main` automatically. To change it:

**File:** `src/components/Header/Header.js`
```javascript
<AppBar position='fixed' className={classes.appBar} sx={{ backgroundColor: '#YOUR_COLOR' }}>
```

Or modify the theme's primary color (recommended).

### Buttons
Buttons use theme colors based on their `color` prop:

```javascript
// Primary button (uses primary color)
<Button variant="contained" color="primary">Save</Button>

// Secondary button (uses secondary color)
<Button variant="contained" color="secondary">Cancel</Button>

// Success button (uses success color)
<Button variant="contained" color="success">Submit</Button>
```

### Text Colors
Text colors are defined in the theme:

```javascript
text: {
  primary: '#4A4A4A',    // Main text
  secondary: '#6E6E6E',   // Secondary text
  hint: '#B9B9B9',       // Hint/disabled text
}
```

## 🔄 Applying Changes

1. **Edit the theme file** (`src/themes/default.js`)
2. **Save the file**
3. **Restart the development server** (if running)
4. **Refresh your browser**

The changes will apply automatically to all components using theme colors.

## 📚 Additional Resources

- **Material-UI Theme Documentation:** https://mui.com/material-ui/customization/theming/
- **Color Picker Tools:** 
  - https://coolors.co/
  - https://material.io/design/color/the-color-system.html
- **Accessibility:** Ensure sufficient contrast ratios (WCAG AA: 4.5:1 for text)

## 🎯 Quick Reference

| Element | Theme Property | Current Value |
|---------|---------------|---------------|
| Header Background | `theme.palette.primary.main` | `#536DFE` |
| Primary Buttons | `theme.palette.primary.main` | `#536DFE` |
| Secondary Buttons | `theme.palette.secondary.main` | `#FF5C93` |
| Success Messages | `theme.palette.success.main` | `#3CD4A0` |
| Warning Messages | `theme.palette.warning.main` | `#FFC260` |
| Info Messages | `theme.palette.info.main` | `#9013FE` |
| Main Text | `theme.palette.text.primary` | `#4A4A4A` |
| Secondary Text | `theme.palette.text.secondary` | `#6E6E6E` |

## 💡 Tips

1. **Test Contrast:** Use a contrast checker to ensure text is readable
2. **Consistency:** Stick to the theme colors throughout the app
3. **Brand Colors:** Use your organization's brand colors for primary/secondary
4. **Accessibility:** Dark text on light backgrounds is more accessible
5. **Preview:** Test color changes in both light and dark conditions

