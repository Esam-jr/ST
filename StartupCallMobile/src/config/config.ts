import { Platform } from 'react-native';

// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3000/api',
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
};

// App Configuration
export const APP_CONFIG = {
  NAME: 'StartupCall',
  VERSION: '1.0.0',
  ENVIRONMENT: __DEV__ ? 'development' : 'production',
};

// Platform specific configurations
export const PLATFORM_CONFIG = {
  IS_IOS: Platform.OS === 'ios',
  IS_ANDROID: Platform.OS === 'android',
  IS_WEB: Platform.OS === 'web',
};

// Storage Configuration
export const STORAGE_CONFIG = {
  AUTH_TOKEN_KEY: '@auth_token',
  USER_DATA_KEY: '@user_data',
};

// Navigation Configuration
export const NAVIGATION_CONFIG = {
  AUTH_STACK: 'AuthStack',
  MAIN_STACK: 'MainStack',
  BOTTOM_TABS: 'BottomTabs',
}; 