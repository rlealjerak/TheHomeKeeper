# Boot Splash Screen Fix Guide

## Problem
Your boot splash logo appears tiny because the source logo is only **100x100 pixels**.

## Solution

### Option 1: Quick Fix (Recommended)
Use the react-native-bootsplash generator with a larger logo size setting.

```bash
# From project root
npx react-native generate-bootsplash assets/bootsplash/logo.png \
  --background-color=F7F5F2 \
  --logo-width=150 \
  --assets-output-path=./android/app/src/main/res
```

This will make the 100x100 logo appear at 150dp width (1.5x larger).

### Option 2: Better Solution (Create Larger Source Logo)

1. **Create a new logo at 800x800 pixels minimum**
   - Use any design tool (Figma, Canva, Photoshop, etc.)
   - Design options:
     - Simple house icon
     - "TheHomeKeeper" text
     - Home + tools icon
   - Save as PNG with transparent background
   - Use your primary color (#C65D47)

2. **Generate bootsplash assets**
```bash
# Replace NEW_LOGO.png with your new logo file
npx react-native generate-bootsplash assets/NEW_LOGO.png \
  --background-color=F7F5F2 \
  --logo-width=200 \
  --assets-output-path=./
```

### Option 3: Use App Icon (If You Have One)

If you already have an app icon, you can use it:

```bash
# For Android
npx react-native generate-bootsplash android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png \
  --background-color=F7F5F2 \
  --logo-width=180 \
  --assets-output-path=./

# For iOS
npx react-native generate-bootsplash ios/TheHomeKeeper/Images.xcassets/AppIcon.appiconset/icon-1024.png \
  --background-color=F7F5F2 \
  --logo-width=180 \
  --assets-output-path=./
```

## Quick Test Commands

After regenerating:

```bash
# Android
npm run android

# iOS
npm run ios
```

The splash screen will appear when you launch the app.

## Logo Design Resources (Free)

If you need to create a logo:

1. **Feather Icons** (we're already using this library!)
   - Export the "home" icon at large size
   - https://feathericons.com/

2. **Canva** (free templates)
   - Search "app icon"
   - Use house templates
   - Export as PNG 1024x1024

3. **Figma** (free)
   - Create 1024x1024 frame
   - Design simple house icon
   - Export as PNG

## Recommended Logo Style for TheHomeKeeper

**Minimalist House Icon**
```
┌───────┐
│   🏠  │  ← Simple house outline
│       │     Color: #C65D47 (terracotta)
└───────┘     Background: transparent or #F7F5F2
```

**Simple & Professional**
- One color (terracotta primary)
- Clean lines
- Recognizable at small sizes
- Matches warm, homey theme

## After Regenerating

1. **Clean build** (recommended):
```bash
# Android
cd android && ./gradlew clean && cd ..

# iOS
cd ios && rm -rf build && pod install && cd ..
```

2. **Rebuild app**:
```bash
npm run android
# or
npm run ios
```

## Expected Result

- Logo should be prominently visible on launch
- Smooth fade transition to app
- Background color matches your warm theme (#F7F5F2)
