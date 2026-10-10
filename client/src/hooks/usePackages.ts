'use client';
import { useState, useMemo } from 'react';
import { PackageData } from '@/types';
import { packageData, purchasablePackageData, PURCHASABLE_PACKAGE_KEYS } from '@/constants';

export const usePackages = () => {
  // Starts on the first package that is actually on sale - classic is disabled
  // for now, see PURCHASABLE_PACKAGE_KEYS in constants/packageData.
  const [activeTab, setActiveTab] = useState<keyof PackageData>(PURCHASABLE_PACKAGE_KEYS[0]);
  
  const currentPackage = useMemo(() => 
    packageData[activeTab], 
    [activeTab]
  );
  
  return {
    activeTab,
    setActiveTab,
    currentPackage,
    allPackages: purchasablePackageData
  };
};
