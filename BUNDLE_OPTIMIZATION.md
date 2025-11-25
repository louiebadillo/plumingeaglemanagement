# Bundle Size Optimization Guide

## Current Bundle Size
- **Main Bundle**: ~1.59 MB (gzipped)
- **Total**: ~1.65 MB (gzipped)

## Large Dependencies Analysis

### 🔴 Potentially Unused Large Dependencies

#### 1. **Leaflet & React-Leaflet** (~200-300 KB)
- **Status**: ❌ NOT USED (You're using Google Maps)
- **Files**: `leaflet`, `react-leaflet`
- **Action**: Can be removed
```bash
npm uninstall leaflet react-leaflet
```

#### 2. **ApexCharts** (~400-500 KB)
- **Status**: ⚠️ USED in template pages (charts)
- **Files**: `apexcharts`, `react-apexcharts`
- **Location**: `src/pages/charts/`
- **Action**: 
  - If you're not using the charts template pages, remove them
  - If you only use Recharts (which you do in Progress Reports), consider removing ApexCharts

#### 3. **FullCalendar** (~300-400 KB)
- **Status**: ⚠️ USED in calendar page
- **Files**: `@fullcalendar/*` (6 packages)
- **Location**: `src/pages/calendar/Calendar.js`
- **Action**: 
  - If calendar page is not used, remove it
  - If used, keep it

#### 4. **Moment.js** (~200-300 KB)
- **Status**: ⚠️ USED in multiple places
- **Files**: `moment`
- **Location**: Multiple files (see grep results)
- **Action**: 
  - Consider migrating to `date-fns` (already installed, smaller)
  - Or use native JavaScript Date methods

#### 5. **Lodash** (~70-100 KB)
- **Status**: ⚠️ USED in 2 files
- **Files**: `lodash`
- **Location**: `src/index.js`, `src/components/FormItems/iniValues.js`
- **Action**: 
  - Replace with native JavaScript or specific lodash functions
  - Use `lodash-es` with tree-shaking if needed

#### 6. **React Simple Maps** (~100-150 KB)
- **Status**: ⚠️ USED in VectorMaps page
- **Files**: `react-simple-maps`
- **Location**: `src/pages/maps/VectorMap.js`
- **Action**: Remove if not using vector maps

#### 7. **React Syntax Highlighter** (~200-300 KB)
- **Status**: ⚠️ USED in Code component
- **Files**: `react-syntax-highlighter`
- **Location**: `src/components/Code/Code.js`
- **Action**: Remove if not using code display

#### 8. **Font Awesome** (~100-150 KB)
- **Status**: ⚠️ USED in Icons page
- **Files**: `font-awesome`
- **Location**: `src/pages/icons/Icons.js`
- **Action**: Remove if not using (you have MUI icons)

#### 9. **MUI DataTables** (~150-200 KB)
- **Status**: ⚠️ USED in Tables page
- **Files**: `mui-datatables`
- **Location**: `src/pages/tables/Tables.js`
- **Action**: Remove if not using

#### 10. **React Swipeable Views** (~50-100 KB)
- **Status**: ⚠️ USED in Tabs/Carousel pages
- **Files**: `react-swipeable-views`, `react-swipeable-views-utils`
- **Location**: Multiple template pages
- **Action**: Remove if not using

#### 11. **MUI X Date Pickers Pro** (~200-300 KB)
- **Status**: ⚠️ Check if Pro features are used
- **Files**: `@mui/x-date-pickers-pro`
- **Action**: 
  - If not using Pro features, use regular `@mui/x-date-pickers` only
  - Pro version is much larger

### 🟡 Template Pages (Not in Use)

Many template pages are imported in `src/components/Layout/Layout.js` but may not be used:
- Typography, Colors, Grid
- Static/Dynamic Tables
- Icons, Badges, Carousels, Cards, Modals, Notifications, Navbars, Tooltips, Tabs, Progress, Widgets
- Ecommerce pages
- Forms pages
- Charts pages (if not using ApexCharts)
- DraggableGrid
- Maps (VectorMaps)
- Timeline, Search, Gallery, Invoice, Calendar

**Action**: Remove unused route imports from `Layout.js` to enable tree-shaking.

## Optimization Steps

### Step 1: Remove Unused Dependencies

```bash
# Remove definitely unused
npm uninstall leaflet react-leaflet

# Remove if not using template pages
npm uninstall react-simple-maps react-syntax-highlighter font-awesome mui-datatables react-swipeable-views react-swipeable-views-utils

# Remove if not using Pro date picker features
npm uninstall @mui/x-date-pickers-pro
```

### Step 2: Replace Moment.js with date-fns

Moment.js is large and deprecated. You already have `date-fns` installed.

**Files using Moment:**
- `src/pages/staff/StaffManagement.js`
- `src/pages/timeline/Timeline.js`
- `src/pages/user/UserList.js`
- `src/pages/profile/Components/Calendar/Week.js`
- `src/pages/profile/Components/Calendar/Calendar.js`
- `src/pages/draggablegrid/mock.js`
- `src/pages/calendar/Calendar.js`
- `src/components/FormItems/preparedValues.js`
- `src/components/FormItems/iniValues.js`
- `src/components/FormItems/formValidations.js`

### Step 3: Remove Unused Route Imports

Edit `src/components/Layout/Layout.js` and remove imports for pages you don't use.

### Step 4: Code Splitting

Implement lazy loading for large components:

```javascript
// Instead of:
import ProgressReport from '../../pages/reports/ProgressReport';

// Use:
const ProgressReport = React.lazy(() => import('../../pages/reports/ProgressReport'));
```

### Step 5: Analyze Bundle

```bash
npm run analyze
```

This will open a visual representation of your bundle showing what's taking up space.

## Expected Savings

If you remove unused dependencies:
- **Leaflet**: ~250 KB
- **ApexCharts** (if unused): ~450 KB
- **Moment.js** (replace with date-fns): ~250 KB
- **Template libraries**: ~500-700 KB

**Total potential savings**: ~1.5-1.7 MB (uncompressed)

## Quick Wins

1. ✅ Remove `leaflet` and `react-leaflet` (definitely unused)
2. ✅ Remove unused template page imports from Layout.js
3. ✅ Check if `@mui/x-date-pickers-pro` is needed (use regular version if not)
4. ✅ Remove `react-simple-maps` if not using vector maps
5. ✅ Remove `font-awesome` if not using (you have MUI icons)

## How to Use Bundle Analyzer

1. Run: `npm run analyze`
2. A browser window will open showing an interactive treemap
3. Hover over blocks to see package sizes
4. Look for large blocks that you don't recognize or use

