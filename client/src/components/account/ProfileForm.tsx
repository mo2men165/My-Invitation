'use client';
import React, { useState, useEffect } from 'react';
import { Save, User, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { saudiCities } from '@/constants';

interface ProfileFormProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    city: string;
  };
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    city: string;
  }) => Promise<boolean>;
  isLoading: boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ user, onSubmit, isLoading }) => {
  // FIXED: Strip +966 from phone number for display
  const getDisplayPhone = (phone: string) => {
    return phone.startsWith('+966') ? phone.slice(4) : phone;
  };

  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: getDisplayPhone(user.phone), // FIXED: Display without +966
    city: user.city
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: getDisplayPhone(user.phone), // FIXED: Always strip +966
      city: user.city
    });
  }, [user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'الاسم الأول مطلوب';
    } else if (formData.firstName.length > 25) {
      newErrors.firstName = 'الاسم الأول لا يجب أن يتجاوز 25 حرف';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'الاسم الأخير مطلوب';
    } else if (formData.lastName.length > 25) {
      newErrors.lastName = 'الاسم الأخير لا يجب أن يتجاوز 25 حرف';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }

    // FIXED: Validate phone without +966 prefix (9 digits starting with 5)
    if (!formData.phone.trim()) {
      newErrors.phone = 'رقم الهاتف مطلوب';
    } else if (!/^[5][0-9]{8}$/.test(formData.phone)) {
      newErrors.phone = 'رقم الهاتف يجب أن يكون 9 أرقام ويبدأ بـ 5';
    }

    if (!formData.city) {
      newErrors.city = 'المدينة مطلوبة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Send the phone without +966 - the backend will add it
    const success = await onSubmit(formData);
    if (success) {
      setErrors({});
    }
  };

  // FIXED: Handle phone input changes with length restriction
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove any non-digit characters
    value = value.replace(/\D/g, '');
    
    // Ensure it starts with 5 if user types something
    if (value && !value.startsWith('5')) {
      value = '5' + value.slice(1);
    }
    
    // FIXED: Limit to 9 digits maximum
    if (value.length > 9) {
      value = value.slice(0, 9);
    }
    
    setFormData({ ...formData, phone: value });
  };


  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
      <div className="flex items-center gap-3 mb-6">
        <User className="w-6 h-6 text-[#C09B52]" />
        <h3 className="text-xl font-bold text-white">المعلومات الشخصية</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-white">
              الاسم الأول
            </Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="bg-white/10 border-white/20 text-white placeholder-gray-400"
              placeholder="أدخل الاسم الأول"
              maxLength={25}
            />
            {errors.firstName && (
              <p className="text-red-400 text-sm">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-white">
              الاسم الأخير
            </Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="bg-white/10 border-white/20 text-white placeholder-gray-400"
              placeholder="أدخل الاسم الأخير"
              maxLength={25}
            />
            {errors.lastName && (
              <p className="text-red-400 text-sm">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white flex items-center gap-2">
            <Mail className="w-4 h-4" />
            البريد الإلكتروني
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="bg-white/10 border-white/20 text-white placeholder-gray-400"
            placeholder="أدخل البريد الإلكتروني"
          />
          {errors.email && (
            <p className="text-red-400 text-sm">{errors.email}</p>
          )}
        </div>

        {/* Phone - FIXED VERSION */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-white flex items-center gap-2">
            <Phone className="w-4 h-4" />
            رقم الهاتف
          </Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
              +966
            </div>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={handlePhoneChange} // FIXED: Use custom handler
              className="bg-white/10 border-white/20 text-white placeholder-gray-400 pl-16"
              placeholder="5xxxxxxxx"
              maxLength={9} // FIXED: Limit to 9 digits
              dir="ltr" // Left-to-right for phone numbers
            />
          </div>
          {errors.phone && (
            <p className="text-red-400 text-sm">{errors.phone}</p>
          )}
          <p className="text-gray-400 text-sm">
            أدخل 9 أرقام تبدأ بالرقم 5 (سيتم إضافة +966 تلقائياً)
          </p>
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="city" className="text-white flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            المدينة
          </Label>
          <select
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#C09B52]"
          >
            <option value="" className="bg-gray-800">اختر المدينة</option>
            {cities.map(city => (
              <option key={city} value={city} className="bg-gray-800">
                {city}
              </option>
            ))}
          </select>
          {errors.city && (
            <p className="text-red-400 text-sm">{errors.city}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-[#C09B52] to-amber-600 text-black font-bold hover:from-amber-600 hover:to-[#C09B52]"
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </Button>
      </form>
    </div>
  );
};

export default ProfileForm;