import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList, AuthStackParamList, MainStackParamList, BottomTabParamList } from './types';
import { COLORS } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import HomeScreen from '../screens/main/HomeScreen';
import StartupsScreen from '../screens/main/StartupsScreen';
import ProjectsScreen from '../screens/main/ProjectsScreen';
import FinancialScreen from '../screens/main/FinancialScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import StartupDetailsScreen from '../screens/main/StartupDetailsScreen';
import ProjectDetailsScreen from '../screens/main/ProjectDetailsScreen';
import FinancialDetailsScreen from '../screens/main/FinancialDetailsScreen';

// Create navigators
const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const BottomTab = createBottomTabNavigator<BottomTabParamList>();

// Auth Stack Navigator
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
};

// Bottom Tab Navigator
const BottomTabNavigator = () => {
  return (
    <BottomTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray[500],
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopWidth: 1,
          borderTopColor: COLORS.gray[200],
        },
      }}
    >
      <BottomTab.Screen name="Home" component={HomeScreen} />
      <BottomTab.Screen name="Startups" component={StartupsScreen} />
      <BottomTab.Screen name="Projects" component={ProjectsScreen} />
      <BottomTab.Screen name="Financial" component={FinancialScreen} />
      <BottomTab.Screen name="Profile" component={ProfileScreen} />
    </BottomTab.Navigator>
  );
};

// Main Stack Navigator
const MainNavigator = () => {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <MainStack.Screen name="BottomTabs" component={BottomTabNavigator} />
      <MainStack.Screen name="StartupDetails" component={StartupDetailsScreen} />
      <MainStack.Screen name="ProjectDetails" component={ProjectDetailsScreen} />
      <MainStack.Screen name="FinancialDetails" component={FinancialDetailsScreen} />
    </MainStack.Navigator>
  );
};

// Root Navigator
const Navigation = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation; 