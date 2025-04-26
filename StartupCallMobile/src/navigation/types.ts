import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  Startups: undefined;
  Projects: undefined;
  Financial: undefined;
};

export type MainStackParamList = {
  BottomTabs: NavigatorScreenParams<BottomTabParamList>;
  StartupDetails: { startupId: string };
  ProjectDetails: { projectId: string };
  FinancialDetails: { projectId: string };
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
}; 