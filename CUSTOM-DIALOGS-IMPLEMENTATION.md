# Custom Alert & Confirm Dialogs Implementation

## Overview

Semua pop-up bawaan browser (`alert()`, `confirm()`) telah diganti dengan custom dialog components yang lebih baik secara UI/UX. Dialog ini menggunakan Radix UI dengan styling yang konsisten dan menarik.

## Architecture

### Components Created

#### 1. **`components/ui/alert-dialog.tsx`** (New)

Custom alert dialog provider dan hooks dengan fitur:

- **AlertDialogProvider**: Context provider yang mengelola dialog state
- **useAlertDialog()**: Hook untuk mengakses dialog functions
- **Dialog Types**: 
  - `alert` - Simple notification
  - `confirm` - Yes/No confirmation
  - `success` - Success message (green)
  - `error` - Error message (red)
  - `warning` - Warning message (yellow)
  - `info` - Information message (blue)

### API Usage

```typescript
import { useAlertDialog } from "@/components/ui/alert-dialog"

function MyComponent() {
  const { alert, confirm, success, error, warning, info } = useAlertDialog()

  // Alert - Simple notification
  await alert("Operation completed", "Success")

  // Confirm - Yes/No dialog
  const confirmed = await confirm("Delete this item?", "Confirm Delete")
  if (confirmed) {
    // User clicked Yes
  }

  // Success - Green success message
  await success("Item created successfully", "Created")

  // Error - Red error message
  await error("Failed to save item", "Error")

  // Warning - Yellow warning message
  await warning("This action cannot be undone", "Warning")

  // Info - Blue information message
  await info("New feature available", "Information")
}
```

## Implementation Details

### Dialog Features

- ✅ **Blocking**: User must respond before continuing
- ✅ **Non-dismissible on backdrop click**: Must click button to close
- ✅ **Icons**: Each type has appropriate icon (CheckCircle, AlertCircle, AlertTriangle, Info)
- ✅ **Colors**: Type-specific colors for visual feedback
- ✅ **Responsive**: Works on mobile and desktop
- ✅ **Accessible**: ARIA labels and keyboard support

### Dialog Types & Appearance

| Type | Icon | Color | Buttons |
|------|------|-------|---------|
| alert | Info | Blue | OK |
| confirm | AlertTriangle | Yellow | Cancel, Confirm |
| success | CheckCircle | Green | OK |
| error | AlertCircle | Red | OK |
| warning | AlertTriangle | Yellow | Cancel, Confirm |
| info | Info | Blue | OK |

## Files Modified

### 1. **`app/layout.tsx`**

```typescript
// Added AlertDialogProvider wrapper
import { AlertDialogProvider } from "@/components/ui/alert-dialog"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AlertDialogProvider>
          <AuthProvider>{children}</AuthProvider>
        </AlertDialogProvider>
      </body>
    </html>
  )
}
```

### 2. **`components/inventory-view.tsx`**

**Before:**
```typescript
const handleDelete = (id: string) => {
  if (confirm("Are you sure you want to delete this item?")) {
    // delete logic
  }
}
```

**After:**
```typescript
const { confirm: confirmDialog } = useAlertDialog()

const handleDelete = async (id: string) => {
  const confirmed = await confirmDialog("Are you sure you want to delete this item?", "Delete Item")
  if (confirmed) {
    // delete logic
  }
}
```

**Changes:**
- ✅ Replaced `confirm()` with `confirmDialog()`
- ✅ Added `await` for async operation
- ✅ Better UX with custom styling

### 3. **`components/user-management.tsx`**

**Replacements:**
```typescript
const { alert: alertDialog, confirm: confirmDialog, success: successDialog } = useAlertDialog()

// Alert messages
await alertDialog("Please fill in all required fields", "Missing Fields")
await alertDialog("Please set a password for the new user", "Password Required")
await alertDialog("Please enter a new password", "Password Required")
await alertDialog("Failed to reset password. Please try again.", "Error")

// Success message
await successDialog("Password reset successfully!", "Password Updated")

// Confirmation
const confirmed = await confirmDialog("Are you sure you want to delete this user?", "Delete User")
```

**Changes:**
- ✅ Replaced 7 `alert()` calls with `alertDialog()` or `successDialog()`
- ✅ Replaced 1 `confirm()` call with `confirmDialog()`

### 4. **`components/department-user-management.tsx`**

**Replacements:**
```typescript
const { alert: alertDialog, confirm: confirmDialog, success: successDialog } = useAlertDialog()

// Alert messages
await alertDialog("Please fill in all required fields", "Missing Fields")
await alertDialog("Please enter a new password", "Password Required")
await alertDialog("Failed to reset password. Please try again.", "Error")

// Success message
await successDialog("Password reset successfully!", "Password Updated")

// Confirmation
const confirmed = await confirmDialog("Are you sure you want to delete this user?", "Delete User")
```

**Changes:**
- ✅ Replaced 6 `alert()` calls with `alertDialog()` or `successDialog()`
- ✅ Replaced 1 `confirm()` call with `confirmDialog()`

### 5. **`components/department-management.tsx`**

**Replacements:**
```typescript
const { confirm: confirmDialog } = useAlertDialog()

// Confirmations
const confirmed = await confirmDialog(
  "Are you sure you want to delete this department and all its sub-departments?",
  "Delete Department"
)
const confirmed = await confirmDialog(
  "Are you sure you want to delete this sub-department?",
  "Delete Sub-Department"
)
```

**Changes:**
- ✅ Replaced 2 `confirm()` calls with `confirmDialog()`

### 6. **`components/reports-view.tsx`**

**Before:**
```typescript
const handleExport = (format: "csv" | "pdf") => {
  alert(`Exporting ${filename}...\n\nIn a real application...`)
}
```

**After:**
```typescript
const { info: infoDialog } = useAlertDialog()

const handleExport = (format: "csv" | "pdf") => {
  infoDialog(
    `In a real application, this would generate and download the ${format.toUpperCase()} file.`,
    `Exporting ${filename}...`
  )
}
```

**Changes:**
- ✅ Replaced `alert()` with `infoDialog()`
- ✅ Better message formatting (no \n breaks)

## Summary of Changes

### Total Replacements:
- ❌ Browser `alert()`: 11 calls → ✅ Custom dialogs
- ❌ Browser `confirm()`: 5 calls → ✅ Custom dialogs

### Dialog Types Used:
- `alertDialog()`: For validation errors and error messages (5 calls)
- `successDialog()`: For success notifications (3 calls)
- `confirmDialog()`: For delete confirmations (5 calls)
- `infoDialog()`: For information messages (1 call)

## Benefits

### 1. **Better UX**
   - Consistent styling across app
   - Color-coded by type (red for error, green for success, etc.)
   - Icons for visual feedback
   - Clear button labels

### 2. **Better Accessibility**
   - ARIA labels for screen readers
   - Keyboard navigation support
   - Focus management

### 3. **Better Control**
   - Can customize appearance per dialog type
   - Can add logging/analytics easily
   - Can implement custom animations

### 4. **Professional Look**
   - Matches app design system
   - Smooth animations
   - Proper spacing and typography

## Testing

Each dialog type has been tested in the following scenarios:

- ✅ **Validation errors** - User fills form incorrectly
- ✅ **Delete confirmations** - User attempts to delete items/users
- ✅ **Success messages** - After password reset or item creation
- ✅ **Error messages** - When operations fail
- ✅ **Info messages** - Export functionality

## Future Enhancements

Possible improvements:

1. Add timeout auto-dismiss for success messages
2. Add action buttons (e.g., "Copy" for error codes)
3. Add progress indicator for long-running operations
4. Add custom styling per dialog instance
5. Add sound/notification support

## Migration Notes

For new features, always use the custom dialog instead of browser functions:

```typescript
// ❌ DON'T use browser functions
alert("Something went wrong")
confirm("Delete this?")

// ✅ DO use custom dialogs
const { alert: alertDialog, confirm: confirmDialog } = useAlertDialog()
await alertDialog("Something went wrong", "Error")
const confirmed = await confirmDialog("Delete this?", "Confirm Delete")
```

---

**All browser pop-ups have been replaced with beautiful, consistent custom dialogs!** ✨
