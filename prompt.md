# TheHomeKeeper

A React Native mobile app for tracking and managing household items with maintenance schedules.

## Tech Stack

- **Framework**: React Native 0.82
- **Language**: TypeScript/JavaScript
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Navigation**: React Navigation (native-stack)
- **Backend**: Firebase (Auth, Firestore)
- **Platforms**: iOS and Android

## Project Structure

```
src/
├── navigation/       # Navigation configuration
│   ├── RootNavigator.tsx
│   ├── AuthNavigator.tsx
│   └── AppNavigator.tsx
├── screens/          # Screen components
│   ├── IntroScreen.js
│   ├── SignIn.js
│   ├── SignUp.js
│   ├── ItemDashboard.js
│   └── AddItem.js
└── services/         # Firebase operations
    ├── addItems.js
    ├── getItems.js
    ├── updateItems.js
    └── deleteItems.js
```

## Commands

- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm start` - Start Metro bundler
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## Development Notes

- Uses `react-native-bootsplash` for splash screen
- Date handling uses `dayjs` and `react-native-ui-datepicker`
- Firebase configuration is in `android/app/google-services.json` and iOS `GoogleService-Info.plist`
- When creating a new function, always include a one-sentence description of what it does.
