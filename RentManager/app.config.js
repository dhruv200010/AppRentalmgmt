export default {
  name: 'RentManager',
  slug: 'rentmanager',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff'
    }
  },
  web: {
    favicon: './assets/favicon.png'
  },
  extra: {
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_cHJlc2VudC1iYXNzLTI1LmNsZXJrLmFjY291bnRzLmRldiQ"
  },
  newArchEnabled: true
}; 