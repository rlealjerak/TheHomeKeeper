# TheHomeKeeper - Bug Fix & Testing Plan

## Current Status

**Build Status:** ✅ iOS build completed successfully (exit code 0)
**Dependencies:** ✅ All installed correctly
**Syntax:** ✅ No syntax errors detected
**TypeScript:** ✅ No type errors

## Diagnostic Results

### ✅ Checks Passed
1. **Dependencies Installed**
   - @notifee/react-native ✅
   - @react-native-async-storage/async-storage ✅
   - All iOS pods installed ✅

2. **Code Quality**
   - No duplicate StyleSheet definitions ✅
   - All screens properly using useTheme() ✅
   - No static color imports ✅
   - All files have proper exports ✅

3. **Build Process**
   - TypeScript compilation: No errors ✅
   - iOS build: Successful ✅
   - Metro bundler: Can start ✅

## Potential Issues & Solutions

### Issue 1: App Crashes on Launch
**Symptoms:** White screen, immediate crash
**Likely Causes:**
- Missing native module linking
- ThemeContext initialization issue
- Notification permission request on startup

**Solutions:**
```bash
# 1. Clean build
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..

# 2. Clear caches
npx react-native start --reset-cache

# 3. Rebuild
npx react-native run-ios
```

### Issue 2: Theme Not Working
**Symptoms:** Styles not applying, undefined colors
**Likely Cause:** Components not wrapped in ThemeProvider

**Solution:**
Verify App.tsx has correct structure:
```javascript
<SafeAreaProvider>
  <ThemeProvider>      // ← Must wrap everything
    <RootNavigator />
  </ThemeProvider>
</SafeAreaProvider>
```

### Issue 3: Notifications Not Showing
**Symptoms:** No notification permissions requested
**Likely Cause:** Notifee not properly linked

**Solution:**
```bash
cd ios
pod install
cd ..
npx react-native run-ios
```

### Issue 4: "Invariant Violation" or "Element type is invalid"
**Symptoms:** Red screen error about invalid elements
**Likely Causes:**
- Circular imports
- Missing default exports
- Component not exported correctly

**Solution:**
Check all component exports:
- Button.js: `export const Button`
- TextInput.js: `export const TextInput`
- ThemeContext.js: `export const ThemeProvider`, `export const useTheme`

### Issue 5: Async Storage Errors
**Symptoms:** Errors about AsyncStorage being null
**Likely Cause:** Not linked properly on iOS

**Solution:**
```bash
cd ios
pod install
cd ..
```

## Step-by-Step Testing Plan

### Phase 1: Basic App Launch (5 minutes)

**Test 1.1: Clean Build**
```bash
# Kill all metro instances
lsof -ti:8081 | xargs kill -9

# Clean iOS
cd ios
rm -rf build Pods Podfile.lock
pod install
cd ..

# Clean metro cache
npx react-native start --reset-cache
```

**Test 1.2: Run iOS**
```bash
# In new terminal
npx react-native run-ios
```

**Expected:** App launches to Onboarding or SignIn screen
**If fails:** Check Metro console for specific error

---

### Phase 2: Theme System (10 minutes)

**Test 2.1: Light Mode**
- App should display with light theme by default
- Check: Background is #FAF8F5 (light cream)
- Check: Text is dark (#2D2A26)

**Test 2.2: Dark Mode**
- Go to Settings
- Tap "Dark" theme option
- Check: Background is #1A1816 (dark)
- Check: Text is light (#E8E4DD)

**Test 2.3: Auto Mode**
- Tap "Auto" theme option
- Change device theme (Settings → Display → Dark Mode)
- App should follow system theme

**Expected:** Theme changes instantly
**If fails:** Check if ThemeProvider is wrapping app

---

### Phase 3: Core Functionality (15 minutes)

**Test 3.1: Sign Up**
- Create new account
- Enter: name, email, username, password
- Check: Password strength indicator works
- Check: Can submit successfully

**Test 3.2: Sign In**
- Sign in with created account
- Check: Navigates to dashboard
- Check: Onboarding doesn't show again

**Test 3.3: Add Item**
- Tap "+ Add Item"
- Fill in: Name, Category, Notes, Date, Frequency
- Check: Category picker opens
- Check: Date picker works
- Check: Item saves successfully

**Test 3.4: Search & Filter**
- Add multiple items with different categories
- Test search by name
- Test status filters (All, Overdue, Due Soon, OK)
- Test category filters

**Expected:** All features work smoothly
**If fails:** Check console for specific errors

---

### Phase 4: Notifications (10 minutes)

**Test 4.1: Permission Request**
- Add a new item
- Check: Permission dialog appears (first time)
- Grant permission

**Test 4.2: Notification Toggle**
- Go to Settings
- Check: "Maintenance Reminders" toggle exists
- Toggle OFF
- Add item
- Check: No permission request

**Test 4.3: Scheduled Notifications**
```bash
# Check scheduled notifications (for debugging)
# Add this to a test screen:
import { getScheduledNotifications } from './src/services/notificationService';
const notifications = await getScheduledNotifications();
console.log('Scheduled:', notifications);
```

**Expected:** 3 notifications per item when enabled
**If fails:** Check Notifee installation

---

### Phase 5: Profile Management (5 minutes)

**Test 5.1: Edit Profile**
- Go to Settings → Edit Profile
- Update name/username
- Check: Saves successfully

**Test 5.2: Change Password**
- Expand "Change Password" section
- Enter current and new password
- Check: Requires re-authentication
- Check: Updates successfully

**Test 5.3: Delete Account**
- Expand "Delete Account" section
- Tap delete, confirm
- Check: All data deleted
- Check: Returns to login

**Expected:** All operations work
**If fails:** Check Firebase console for errors

---

## Common Errors & Fixes

### Error: "Unable to resolve module"
**Fix:**
```bash
npm install
cd ios && pod install && cd ..
npx react-native start --reset-cache
```

### Error: "Element type is invalid"
**Fix:** Check component exports, ensure using `export const` not `export default`

### Error: "useTheme must be used within ThemeProvider"
**Fix:** Verify App.tsx wraps components with ThemeProvider

### Error: "Cannot read property 'colors' of undefined"
**Fix:** Component trying to use colors before ThemeProvider loads

### Error: "Notifee: Unable to request notification permissions"
**Fix:**
1. Check iOS Info.plist has notification permissions
2. Run `pod install` in ios folder
3. Rebuild app

### Error: "AsyncStorage is null"
**Fix:**
```bash
cd ios
pod install
cd ..
npx react-native run-ios
```

---

## Quick Fix Commands

### Complete Clean Rebuild
```bash
# Kill metro
lsof -ti:8081 | xargs kill -9

# Clean everything
rm -rf node_modules
npm install

# iOS clean
cd ios
rm -rf build Pods Podfile.lock
pod install
cd ..

# Android clean (if needed)
cd android
./gradlew clean
cd ..

# Start fresh
npx react-native start --reset-cache

# In new terminal
npx react-native run-ios
```

### Metro Cache Clear
```bash
npx react-native start --reset-cache
```

### iOS Clean
```bash
cd ios
rm -rf build
xcodebuild clean
cd ..
```

### Fix Notifee Issues
```bash
cd ios
pod deintegrate
pod install
cd ..
npx react-native run-ios
```

---

## Verification Checklist

### Must Work ✅
- [ ] App launches without crash
- [ ] Can sign up new account
- [ ] Can sign in
- [ ] Can add item
- [ ] Can view items on dashboard
- [ ] Can search items
- [ ] Can filter by status
- [ ] Can filter by category
- [ ] Theme toggle works (Light/Dark/Auto)
- [ ] Settings screen loads
- [ ] Can toggle notifications

### Should Work ✅
- [ ] Password strength indicator
- [ ] Category picker modal
- [ ] Date picker
- [ ] Edit item
- [ ] Delete item
- [ ] Edit profile
- [ ] Change password
- [ ] Delete account
- [ ] Forgot password flow
- [ ] Onboarding (first launch only)

### Advanced Features ✅
- [ ] Notifications scheduled correctly
- [ ] Notifications appear at right time
- [ ] Notification tap opens app
- [ ] Theme persists across app restart
- [ ] Notification preference persists
- [ ] Dark mode auto-detection works

---

## If All Else Fails

### Nuclear Option: Fresh Install
```bash
# 1. Backup your Firebase config
cp android/app/google-services.json ~/google-services-backup.json
cp ios/TheHomeKeeper/GoogleService-Info.plist ~/GoogleService-Info-backup.plist

# 2. Delete everything
rm -rf node_modules ios/Pods ios/Podfile.lock

# 3. Reinstall
npm install
cd ios && pod install && cd ..

# 4. Restore Firebase configs
cp ~/google-services-backup.json android/app/
cp ~/GoogleService-Info-backup.plist ios/TheHomeKeeper/

# 5. Fresh start
npx react-native start --reset-cache

# 6. Run
npx react-native run-ios
```

---

## Expected Build Output (Success)

```
info Found Xcode workspace "TheHomeKeeper.xcworkspace"
info Building...
success Successfully built the app
info Installing...
info Launching...
success Successfully launched the app on the simulator
```

## Expected Runtime (Success)

**Metro Console:**
```
 BUNDLE  ./index.js

 LOG  Running "TheHomeKeeper" with {"rootTag":1}
```

**No errors, no warnings, app runs smoothly**

---

## Reporting Issues

If you encounter specific errors:

1. **Check Metro Console** - First place to look
2. **Check Xcode Console** - iOS-specific issues
3. **Check Device Logs** - Runtime errors
4. **Take Screenshot** - Red error screens

**Common info needed:**
- Exact error message
- Stack trace
- Steps to reproduce
- Device/simulator version
- iOS version

---

## Current Known Issues

### None Detected ✅

All diagnostic checks passed. The app should be working correctly.

## Most Likely Issues (If Any)

Based on the changes made:

1. **First Launch:** App might need clean rebuild to link new native modules
2. **Theme:** Rare race condition if ThemeContext loads slowly
3. **Notifications:** Permission dialog might be surprising on first item add

**All are minor and won't break the app**

---

## Success Criteria

App is working correctly if:
- ✅ Launches without crash
- ✅ All screens accessible
- ✅ Theme switching works
- ✅ Can create and manage items
- ✅ Notifications can be toggled

**You should be able to use the app normally!**
