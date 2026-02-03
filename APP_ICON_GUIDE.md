# App Icon & Store Assets Implementation Guide

## Current Status

The app currently uses default React Native icons. We need professional app icons for both iOS and Android.

## Requirements

### iOS App Icon
**Sizes Needed:**
- 1024x1024 (App Store)
- 180x180 (iPhone @3x)
- 167x167 (iPad Pro)
- 152x152 (iPad @2x)
- 120x120 (iPhone @2x)
- 87x87 (iPhone @3x Settings)
- 80x80 (iPad @2x Settings)
- 76x76 (iPad)
- 60x60 (iPhone)
- 58x58 (iPad Settings)
- 40x40 (iPad Spotlight)
- 29x29 (Settings)

### Android App Icon
**Sizes Needed:**
- 512x512 (Play Store)
- xxxhdpi: 192x192
- xxhdpi: 144x144
- xhdpi: 96x96
- hdpi: 72x72
- mdpi: 48x48

### Adaptive Icons (Android 8.0+)
- Foreground: 108x108dp safe zone
- Background: Full 108x108dp

## Design Concept

**TheHomeKeeper Icon Design:**
- **Primary Element**: Gold/amber house silhouette
- **Accent**: Green checkmark (completed/maintained)
- **Background**: Warm cream/beige gradient
- **Style**: Modern, friendly, professional

**Color Palette:**
- Primary: #D4A84B (Gold)
- Secondary: #6B8E6B (Sage Green)
- Background: #FAF8F5 to #F0EDE8 gradient

## Icon Design Options

### Option 1: House with Checkmark
```
┌─────────────┐
│             │
│   🏠 ✓      │  Gold house + green checkmark
│             │  Clean, direct messaging
│             │
└─────────────┘
```

### Option 2: House in Circle
```
┌─────────────┐
│             │
│   ⭕🏠      │  House centered in circular badge
│             │  More polished, app-like
│             │
└─────────────┘
```

### Option 3: Roof & Check (Minimal)
```
┌─────────────┐
│             │
│   △ ✓       │  Roof peak + checkmark
│             │  Ultra minimal, modern
│             │
└─────────────┘
```

## Recommended Design (Option 1 Enhanced)

**Final Design:**
- Rounded square background with subtle gradient (cream to light beige)
- Large golden house icon in center (simplified, modern lines)
- Small green checkmark badge on top-right of house
- Soft shadow for depth
- Border radius for iOS: 22.37% of icon size

## Implementation Steps

### Step 1: Create Base Icon (1024x1024)

You can use one of these tools:
1. **Figma** (Recommended) - Professional design tool
2. **Canva** - Easy to use, has templates
3. **Adobe Illustrator** - Professional vector graphics
4. **Sketch** - Mac-only, great for app icons

**Design Specifications:**
- Size: 1024x1024px
- Format: PNG with transparency
- Color Mode: RGB
- No rounded corners (iOS adds them automatically)

### Step 2: Generate All Sizes

**Option A: Using Icon Generator Tool**
```bash
# Install app icon generator
npm install -g app-icon

# Generate all sizes from base icon
app-icon generate -i ./assets/icon.png
```

**Option B: Using Online Tool**
- https://appicon.co - Upload 1024x1024, download all sizes
- https://makeappicon.com - Generate iOS and Android icons

**Option C: Manual with React Native Asset**
```bash
# Install react-native-asset
npm install -g react-native-asset

# Add icon to assets/icon.png
# Run asset linker
react-native-asset
```

### Step 3: iOS Icon Setup

**Location:** `ios/TheHomeKeeper/Images.xcassets/AppIcon.appiconset/`

**Contents.json Structure:**
```json
{
  "images": [
    {
      "size": "20x20",
      "idiom": "iphone",
      "filename": "icon-20@2x.png",
      "scale": "2x"
    },
    // ... all sizes
  ]
}
```

### Step 4: Android Icon Setup

**Locations:**
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-hdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-mdpi/ic_launcher.png`

**For Adaptive Icons (Android 8.0+):**
- Foreground: `ic_launcher_foreground.png`
- Background: `ic_launcher_background.xml` (solid color) or `.png`

### Step 5: Verify Icons

**iOS:**
1. Clean build: `cd ios && pod install && cd ..`
2. Run app: `npm run ios`
3. Check home screen icon
4. Check settings icon
5. Check app switcher icon

**Android:**
1. Clean build: `cd android && ./gradlew clean && cd ..`
2. Run app: `npm run android`
3. Check launcher icon
4. Check different launchers (if possible)

## Screenshot Requirements

### iOS Screenshots

**iPhone 6.7" (iPhone 15 Pro Max):**
- 1290 x 2796 pixels
- 3-5 screenshots required

**iPhone 6.5" (iPhone 11 Pro Max, XS Max):**
- 1242 x 2688 pixels
- 3-5 screenshots required

**iPad Pro 12.9" (3rd gen):**
- 2048 x 2732 pixels
- 3-5 screenshots required

### Android Screenshots

**Phone:**
- Minimum: 320px
- Maximum: 3840px
- 16:9 or 9:16 aspect ratio
- 2-8 screenshots required

**7" Tablet:**
- 1024 x 600 or higher
- Optional but recommended

**10" Tablet:**
- 1280 x 800 or higher
- Optional but recommended

## Screenshots to Capture

### Must-Have Screens:
1. **Onboarding/Welcome** - First impression
2. **Dashboard with Items** - Main functionality
3. **Add Item Screen** - Core feature
4. **Item Detail/Edit** - Feature showcase
5. **Notifications** - Value proposition

### Optional Screens:
6. **Dark Mode** - Show theme support
7. **Categories** - Organization feature
8. **Settings** - Customization options

## Screenshot Tips

1. **Populate with realistic data** - Don't use "Test Item 1, 2, 3"
2. **Use attractive examples**:
   - "HVAC Filter Replacement"
   - "Water Heater Maintenance"
   - "Lawn Mower Service"
3. **Show variety** - Different categories, statuses
4. **Clean UI** - No errors, good internet connection
5. **Localization** - Take screenshots in all supported languages

## Feature Graphic (Android)

**Size:** 1024 x 500 pixels

**Design:**
- Hero image showing app value
- App name "TheHomeKeeper"
- Tagline: "Never miss home maintenance"
- Key features or benefits
- Matches app icon color scheme

## Promo Images

### iOS App Preview (Optional)
- Video: 15-30 seconds
- Shows key app flows
- Portrait or landscape
- Multiple device sizes

### Android Promo Video (Optional)
- Video: 30 seconds - 2 minutes
- Shows app in action
- YouTube link or uploaded video

## Implementation Checklist

### Icon Creation
- [ ] Design 1024x1024 base icon
- [ ] Test icon at small sizes (29x29)
- [ ] Ensure icon looks good on light and dark backgrounds
- [ ] Remove alpha channel for Android (if needed)

### Icon Integration
- [ ] Generate all iOS sizes
- [ ] Add to Xcode asset catalog
- [ ] Generate all Android sizes
- [ ] Add to Android mipmap folders
- [ ] Create adaptive icon (Android)
- [ ] Test on both platforms

### Screenshots
- [ ] Prepare app with good demo data
- [ ] Capture iPhone screenshots (6.7" + 6.5")
- [ ] Capture iPad screenshots (12.9")
- [ ] Capture Android phone screenshots
- [ ] Capture Android tablet screenshots (optional)
- [ ] Edit/annotate screenshots if needed
- [ ] Add captions/titles to screenshots

### Store Graphics
- [ ] Create feature graphic (Android)
- [ ] Create promo images (optional)
- [ ] Create app preview video (optional)

## Tools & Resources

### Icon Design
- **Figma** - https://figma.com (Free)
- **Canva** - https://canva.com (Free tier available)
- **Icon generators** - https://appicon.co

### Screenshot Tools
- **iOS Simulator** - Built into Xcode (Cmd+S to capture)
- **Android Emulator** - Android Studio built-in
- **Fastlane Snapshot** - Automated screenshot tool
- **Screenshots.pro** - Framing tool for store screenshots

### Screenshot Editors
- **Figma** - Add annotations, titles
- **Canva** - Templates for app screenshots
- **Sketch** - Mac-only screenshot templates

## Current Icon Status

**Current State:**
- Using default React Native icon
- No custom branding
- Generic appearance

**Target State:**
- Custom TheHomeKeeper icon with house + checkmark
- Professional appearance
- Matches brand colors (gold + sage green)
- All required sizes generated
- Installed on both platforms

## Next Steps

1. **Design the icon** - Use Figma or Canva with provided specs
2. **Generate all sizes** - Use app-icon or online generator
3. **Integrate into project** - Replace default icons
4. **Test on devices** - Verify appearance
5. **Capture screenshots** - Document app features
6. **Create store graphics** - Feature graphic for Android

## Estimated Time

- Icon design: 2-3 hours (or hire designer: $50-$200)
- Icon integration: 1 hour
- Screenshots: 2-3 hours
- Store graphics: 1-2 hours

**Total: 6-9 hours** (or 3-4 hours with pre-made icon)
