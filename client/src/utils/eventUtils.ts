import { parsePhoneNumber } from 'libphonenumber-js';
import { PackageDetails, StatusDetails, ApprovalStatusDetails } from '@/types/event';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle 
} from 'lucide-react';

export const getPackageDetails = (packageType: string): PackageDetails => {
  switch (packageType) {
    case 'classic':
      return { name: 'كلاسيك', color: 'from-blue-600 to-blue-700' };
    case 'premium':
      return { name: 'بريميوم', color: 'from-purple-600 to-purple-700' };
    case 'vip':
      return { name: 'VIP', color: 'from-yellow-600 to-yellow-700' };
    default:
      return { name: 'غير محدد', color: 'from-gray-600 to-gray-700' };
  }
};

export const getStatusDetails = (status: string): StatusDetails => {
  switch (status) {
    case 'upcoming':
      return { name: 'قادمة', color: 'text-green-400', bgColor: 'bg-green-500/20' };
    case 'done':
      return { name: 'مكتملة', color: 'text-gray-400', bgColor: 'bg-gray-500/20' };
    case 'cancelled':
      return { name: 'ملغية', color: 'text-red-400', bgColor: 'bg-red-500/20' };
    default:
      return { name: 'غير محدد', color: 'text-gray-400', bgColor: 'bg-gray-500/20' };
  }
};

export const getApprovalStatusDetails = (approvalStatus: string): ApprovalStatusDetails => {
  switch (approvalStatus) {
    case 'pending':
      return { 
        name: 'في انتظار الموافقة', 
        color: 'text-yellow-400', 
        bgColor: 'bg-yellow-500/20',
        icon: AlertCircle
      };
    case 'approved':
      return { 
        name: 'معتمد', 
        color: 'text-green-400', 
        bgColor: 'bg-green-500/20',
        icon: CheckCircle
      };
    case 'rejected':
      return { 
        name: 'مرفوض', 
        color: 'text-red-400', 
        bgColor: 'bg-red-500/20',
        icon: XCircle
      };
    default:
      return { 
        name: 'غير محدد', 
        color: 'text-gray-400', 
        bgColor: 'bg-gray-500/20',
        icon: AlertCircle
      };
  }
};

export const formatEventDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'gregory' // Force Gregorian calendar
  });
};

export const getCountryFromPhone = (phone: string): string => {
  try {
    const phoneNumber = parsePhoneNumber(phone);
    return phoneNumber?.country || 'Unknown';
  } catch {
    return 'Unknown';
  }
};
