'use client';
import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

interface PasswordFormProps {
  onSubmit: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<boolean>;
  isLoading: boolean;
}

const PasswordForm: React.FC<PasswordFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'كلمة المرور الحالية مطلوبة';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'كلمة المرور الجديدة مطلوبة';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمة المرور وتأكيدها غير متطابقين';
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'كلمة المرور الجديدة يجب أن تختلف عن الحالية';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const success = await onSubmit(formData);
    if (success) {
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setErrors({});
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-[#C09B52]" />
        <h3 className="text-xl font-bold text-white">تغيير كلمة المرور</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Password */}
        <div className="space-y-2">
          <Label htmlFor="currentPassword" className="text-white flex items-center gap-2">
            <Lock className="w-4 h-4" />
            كلمة المرور الحالية
          </Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showPasswords.current ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              className="bg-white/10 border-white/20 text-white placeholder-gray-400 pr-12"
              placeholder="أدخل كلمة المرور الحالية"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('current')}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-red-400 text-sm">{errors.currentPassword}</p>
          )}
        </div>

        {/* New Password */}
        <div className="space-y-2">
          <Label htmlFor="newPassword" className="text-white flex items-center gap-2">
            <Lock className="w-4 h-4" />
            كلمة المرور الجديدة
          </Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPasswords.new ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className="bg-white/10 border-white/20 text-white placeholder-gray-400 pr-12"
              placeholder="أدخل كلمة المرور الجديدة"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('new')}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-red-400 text-sm">{errors.newPassword}</p>
          )}
          <p className="text-gray-400 text-sm">
            كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل
          </p>
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-white flex items-center gap-2">
            <Lock className="w-4 h-4" />
            تأكيد كلمة المرور الجديدة
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showPasswords.confirm ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="bg-white/10 border-white/20 text-white placeholder-gray-400 pr-12"
              placeholder="أعد إدخال كلمة المرور الجديدة"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirm')}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-400 text-sm">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-bold hover:from-red-600 hover:to-red-700"
        >
          <Shield className="w-4 h-4 mr-2" />
          {isLoading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
        </Button>
      </form>
    </div>
  );
};

export default PasswordForm;
