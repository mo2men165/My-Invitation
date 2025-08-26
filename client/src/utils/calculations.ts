import { PackageData, CartForm } from '@/types';
import { packageData, additionalServices } from '@/constants';

export const calculatePackagePrice = (
  packageType: keyof PackageData,
  form: CartForm
): number => {
  const currentPackage = packageData[packageType];
  const basePrice = currentPackage.pricing.find(
    p => p.invites === form.inviteCount
  )?.price || 0;
  
  const additionalCardsPrice = form.additionalCards * 30;
  
  let gateSupervisorsPrice = 0;
  if (form.gateSupervisors) {
    const gateSupervisorService = additionalServices.find(s => s.id === 'gate-supervisors');
    if (gateSupervisorService?.options) {
      const gateSupervisorOption = gateSupervisorService.options.find(
        opt => opt.range === form.gateSupervisors
      );
      gateSupervisorsPrice = gateSupervisorOption?.price || 0;
    }
  }
  
  const fastDeliveryPrice = form.fastDelivery ? 3000 : 0;
  
  return basePrice + additionalCardsPrice + gateSupervisorsPrice + fastDeliveryPrice;
};

export const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString('ar-SA')} ر.س`;
};
