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
  
  // Get expedited delivery price based on package type
  const getExpeditedDeliveryPrice = (pkgType: string, isExpedited: boolean) => {
    if (!isExpedited) return 0;
    
    const EXPEDITED_COSTS = {
      classic: 600,
      premium: 1000,
      vip: 1500,
    };
    
    return EXPEDITED_COSTS[pkgType as keyof typeof EXPEDITED_COSTS] || EXPEDITED_COSTS.classic;
  };
  
  const expeditedDeliveryPrice = getExpeditedDeliveryPrice(packageType, form.expeditedDelivery || false);
  
  // Add extra hours cost (150 SAR per hour)
  const extraHoursPrice = (form.extraHours || 0) * 150;
  
  return basePrice + additionalCardsPrice + gateSupervisorsPrice + expeditedDeliveryPrice + extraHoursPrice;
};

export const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString('ar-SA')} ر.س`;
};