// client/src/components/auth/shared/AuthFormWrapper.tsx - Shared wrapper for auth forms
'use client';
import React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface AuthFormWrapperProps {
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

export function AuthFormWrapper({
  title,
  subtitle,
  children,
  onSubmit,
  isLoading,
  error,
  backLink,
  submitText,
  footer
}: AuthFormWrapperProps) {
  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600">{subtitle}</p>
      </div>

      {/* Back Link */}
      {backLink && (
        <div className="flex items-center">
          <Link
            href={backLink.href}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {backLink.text}
          </Link>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-4">
        {children}
        
        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              جاري المعالجة...
            </>
          ) : (
            submitText
          )}
        </Button>
      </form>

      {/* Footer */}
      {footer && (
        <div className="text-center">
          {footer}
        </div>
      )}
    </div>
  );
}

// Shared form field components
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormField({ label, error, required = false, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={label} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  showStrength?: boolean;
  required?: boolean;
}

export function PasswordField({ 
  value, 
  onChange, 
  error, 
  placeholder = "كلمة المرور",
  showStrength = false,
  required = false
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = React.useState(false);

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, text: '', color: '' };
    
    let score = 0;
    const checks = [
      { regex: /.{8,}/, point: 1 }, // Length
      { regex: /[a-z]/, point: 1 }, // Lowercase
      { regex: /[A-Z]/, point: 1 }, // Uppercase
      { regex: /\d/, point: 1 }, // Number
      { regex: /[!@#$%^&*(),.?":{}|<>]/, point: 1 }, // Special char
    ];
    
    checks.forEach(check => {
      if (check.regex.test(password)) score += check.point;
    });
    
    if (score <= 2) return { score, text: 'ضعيفة', color: 'text-red-400' };
    if (score === 3) return { score, text: 'متوسطة', color: 'text-yellow-400' };
    if (score === 4) return { score, text: 'جيدة', color: 'text-blue-400' };
    return { score, text: 'قوية جداً', color: 'text-green-400' };
  };

  const passwordStrength = showStrength ? getPasswordStrength(value) : null;

  return (
    <FormField label="كلمة المرور" error={error} required={required}>
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          {showPassword ? 'إخفاء' : 'إظهار'}
        </button>
      </div>
      {passwordStrength && (
        <div className="mt-1">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  passwordStrength.score <= 2 ? 'bg-red-400' :
                  passwordStrength.score === 3 ? 'bg-yellow-400' :
                  passwordStrength.score === 4 ? 'bg-blue-400' : 'bg-green-400'
                }`}
                style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
              />
            </div>
            <span className={`text-xs ${passwordStrength.color}`}>
              {passwordStrength.text}
            </span>
          </div>
        </div>
      )}
    </FormField>
  );
}
