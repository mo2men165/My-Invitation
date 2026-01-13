// client/src/types/components.ts - Component specific types and interfaces
import { ErrorInfo } from 'react';

// Dashboard component types
export interface QuickAction {
  title: string;
  description: string;
  icon: any;
  color: string;
  href: string;
  primary?: boolean;
}

export interface StatsConfig {
  title: string;
  icon: string;
  color: string;
  bgColor: string;
}

export interface OrderStatusConfig {
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

// Layout component types
export interface NavLink {
  href: string;
  label: string;
}

export interface SocialLink {
  icon: string;
  href: string;
  label: string;
  color: string;
}

export interface FooterLink {
  label: string;
  href: string;
}

// Home component types
export interface CounterItem {
  icon: any;
  number: number;
  label: string;
  delay: number;
}

export interface CTAFeature {
  icon: any;
  title: string;
  description: string;
}

export interface InvitationSliderItem {
  id: number;
  title: string;
  category: string;
  image: string;
  likes: number;
  views: number;
  position?: number;
}

// Form component types
export interface PasswordStrengthCheck {
  regex: RegExp;
  point: number;
}

export interface PasswordStrengthLevel {
  score: number;
  text: string;
  color: string;
}

export interface TimeOption {
  value: string;
  label: string;
}

// Map component types
export interface CityBoundary {
  lat: number;
  lng: number;
  radius: number;
}

export interface MapConfig {
  defaultZoom: number;
  defaultCenter: { lat: number; lng: number };
  componentRestrictions: { country: string };
  fields: string[];
}

// Auth component types
export interface AuthFormWrapperProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error?: string | null;
  backLink?: {
    href: string;
    text: string;
  };
  submitText: string;
  footer?: React.ReactNode;
}

export interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  showStrength?: boolean;
  required?: boolean;
}

// Package component types
export interface CategoryFilterProps {
  selectedCategories: string[];
  onToggleCategory: (category: string) => void;
  categories: Array<{ value: string; label: string }>;
}

// Error boundary types
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

// Item management types
export interface ItemManagementConfig {
  sliceName: 'wishlist' | 'compare';
  maxItems?: number;
  toastMessages: {
    add: { title: string; description: string; variant: string };
    remove: { title: string; description: string; variant: string };
    limit: { title: string; description: string; variant: string };
    error: { title: string; description: string; variant: string };
  };
}

export interface PackageLogicState {
  selectedCategories: string[];
  filteredDesigns: any[];
  isLoading: boolean;
}

export interface PackageLogicActions {
  toggleCategory: (category: string) => void;
  selectAllCategories: () => void;
  clearCategories: () => void;
  getCategoryStats: () => Record<string, number>;
}
