import { PackageData, CartForm } from '@/types';
import { packageData } from '@/constants';

export const calculatePackagePrice = (
  packageType: keyof PackageData,
  form: CartForm
): number => {
  const currentPackage = packageData[packageType];
  
  // Return 0 if package doesn't exist
  if (!currentPackage || !currentPackage.pricing) {
    console.warn(`Package ${packageType} not found or has no pricing`);
    return 0;
  }
  
  const basePrice = currentPackage.pricing.find(
    p => p.invites === form.inviteCount
  )?.price || 0;
  
  // Calculate additional cards price based on package type
  const getExtraCardPrice = (pkgType: string) => {
    switch (pkgType) {
      case 'classic': return 7;
      case 'premium': return 13;
      case 'vip': return 20;
      default: return 7;
    }
  };
  
  const additionalCardsPrice = form.additionalCards * getExtraCardPrice(packageType);
  
  // Calculate gate supervisors price (simplified to count * 450)
  let gateSupervisorsPrice = 0;
  if (typeof form.gateSupervisors === 'number' && form.gateSupervisors > 0) {
    gateSupervisorsPrice = form.gateSupervisors * 450;
  }
  
  const expeditedDeliveryPrice = form.expeditedDelivery ? 3000 : 0;
  
  // Add extra hours cost (250 SAR per hour)
  const extraHoursPrice = (form.extraHours || 0) * 250;
  
  return basePrice + additionalCardsPrice + gateSupervisorsPrice + expeditedDeliveryPrice + extraHoursPrice;
};

export const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString('ar-SA')} ر.س`;
};