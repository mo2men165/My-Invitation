// client/src/constants/formData.ts - Form related constants

// Saudi cities list
export const saudiCities = [
  'جدة',
  'الرياض',
  'الدمام',
  'مكة المكرمة',
  'الطائف',
  'المدينة المنورة',
  'اخري'
];

// Password strength checks
export const passwordStrengthChecks = [
  { regex: /.{8,}/, point: 1 }, // Length
  { regex: /[a-z]/, point: 1 }, // Lowercase
  { regex: /[A-Z]/, point: 1 }, // Uppercase
  { regex: /\d/, point: 1 }, // Number
  { regex: /[!@#$%^&*(),.?":{}|<>]/, point: 1 }, // Special char
];

// Password strength levels
export const passwordStrengthLevels = {
  weak: { score: 0, text: 'ضعيفة', color: 'text-red-400' },
  medium: { score: 3, text: 'متوسطة', color: 'text-yellow-400' },
  good: { score: 4, text: 'جيدة', color: 'text-blue-400' },
  strong: { score: 5, text: 'قوية جداً', color: 'text-green-400' }
};

// Time options for event forms
export const generateTimeOptions = () => {
  const times: { value: string; label: string }[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const displayTime = new Date(`1970-01-01T${timeStr}`).toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      times.push({ value: timeStr, label: displayTime });
    }
  }
  return times;
};

// Validation regex patterns
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[5][0-9]{8}$/,
  arabic: /[\u0600-\u06FF]/
};
