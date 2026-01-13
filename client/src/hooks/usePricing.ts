import { useMemo } from 'react';
import { CartForm, PackageData } from '@/types';
import { calculatePackagePrice } from '@/utils/calculations';

export const usePricing = (selectedPackage: keyof PackageData | null, cartForm: CartForm) => {
  const totalPrice = useMemo(() => {
    if (!selectedPackage) return 0;
    return calculatePackagePrice(selectedPackage, cartForm);
  }, [selectedPackage, cartForm]);

  const priceBreakdown = useMemo(() => {
    if (!selectedPackage) return [];
    
    const items = [];
    // Add breakdown logic here
    return items;
  }, [selectedPackage]);

  return { totalPrice, priceBreakdown };
};
