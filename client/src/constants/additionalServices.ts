// client/src/constants/additionalServices.ts - Additional services constants
import { AdditionalService } from '@/types';

export const additionalServices: AdditionalService[] = [  
  {
    id: 'extra-cards-classic',
    name: 'كروت إضافية - كلاسيكية',
    description: 'كرت إضافي للباقة الكلاسيكية',
    price: 7,
    unit: 'كرت'
  },
  {
    id: 'extra-cards-premium',
    name: 'كروت إضافية - بريميوم',
    description: 'كرت إضافي للباقة البريميوم',
    price: 13,
    unit: 'كرت'
  },
  {
    id: 'extra-cards-vip',
    name: 'كروت إضافية - VIP',
    description: 'كرت إضافي للباقة VIP',
    price: 20,
    unit: 'كرت'
  },
  {
    id: 'gate-supervisors',
    name: 'خدمة مشرفين البوابة',
    description: 'مشرف لقراءة الكيو آر كود',
    price: 450,
    unit: 'مشرف'
  }
];
