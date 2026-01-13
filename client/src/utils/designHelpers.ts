import { invitationDesigns, packageData } from '@/constants';
import { InvitationDesign, PackageData } from '@/types';

export const getDesignById = (designId: string): InvitationDesign | undefined => {
  return invitationDesigns.find(design => design.id === designId);
};

export const getDesignsByIds = (designIds: string[]): InvitationDesign[] => {
  return designIds
    .map(id => getDesignById(id))
    .filter((design): design is InvitationDesign => design !== undefined);
};

export const formatAddedDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'gregory' // Ensure Gregorian calendar
  });
};

export const getArabicItemCount = (count: number): string => {
  if (count === 0) return 'لا توجد عناصر';
  if (count === 1) return 'عنصر واحد';
  if (count === 2) return 'عنصران';
  if (count >= 3 && count <= 10) return `${count} عناصر`;
  return `${count} عنصراً`;
};

export const getPackageFeatures = (packageType: keyof PackageData) => {
  return packageData[packageType].features;
};
