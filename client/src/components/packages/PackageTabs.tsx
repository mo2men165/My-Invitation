'use client';
import React, { memo } from 'react';
import { PackageData } from '@/types';

interface PackageTabProps {
  packageKey: keyof PackageData;
  package: any;
  isActive: boolean;
  onClick: () => void;
}

const PackageTab = memo<PackageTabProps>(({ packageKey, package: pkg, isActive, onClick }) => {
  const IconComponent = pkg.icon;
  
  return (
    <button
      onClick={onClick}
      className={`relative px-8 py-4 rounded-xl font-bold transition-all duration-300 flex items-center gap-3 ${
        isActive 
          ? `bg-gradient-to-r ${pkg.color} text-white shadow-lg transform scale-105` 
          : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
      }`}
    >
      <IconComponent className="w-6 h-6" />
      <span className="text-lg">{pkg.name}</span>
      {isActive && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rounded-full"></div>
      )}
    </button>
  );
});

PackageTab.displayName = 'PackageTab';

interface PackageTabsProps {
  activeTab: keyof PackageData;
  onTabChange: (tab: keyof PackageData) => void;
  packages: PackageData;
}

const PackageTabs: React.FC<PackageTabsProps> = ({ activeTab, onTabChange, packages }) => {
  return (
    <div className="flex justify-center mb-12">
      <div className="flex flex-col md:flex-row gap-4 bg-white/5 backdrop-blur-sm rounded-2xl p-2 border border-white/10">
        {(Object.keys(packages) as Array<keyof PackageData>).map((packageKey) => (
          <PackageTab
            key={packageKey}
            packageKey={packageKey}
            package={packages[packageKey]}
            isActive={activeTab === packageKey}
            onClick={() => onTabChange(packageKey)}
          />
        ))}
      </div>
    </div>
  );
};

export default PackageTabs;
