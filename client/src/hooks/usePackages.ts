'use client';
import { useState, useMemo } from 'react';
import { PackageData } from '@/types';
import { packageData } from '@/constants';

export const usePackages = () => {
  const [activeTab, setActiveTab] = useState<keyof PackageData>('classic');
  
  const currentPackage = useMemo(() => 
    packageData[activeTab], 
    [activeTab]
  );
  
  return {
    activeTab,
    setActiveTab,
    currentPackage,
    allPackages: packageData
  };
};
