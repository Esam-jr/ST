// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'startup' | 'sponsor' | 'reviewer';
  createdAt: string;
  updatedAt: string;
}

// Startup Types
export interface Startup {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed';
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Sponsor Types
export interface Sponsor {
  id: string;
  name: string;
  description: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Project Types
export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'in_progress' | 'completed';
  startupId: string;
  createdAt: string;
  updatedAt: string;
}

// Financial Types
export interface FinancialRecord {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  StartupDetails: { startupId: string };
  ProjectDetails: { projectId: string };
  FinancialDetails: { projectId: string };
};

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
} 