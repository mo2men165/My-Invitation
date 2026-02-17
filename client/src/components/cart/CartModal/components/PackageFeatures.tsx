import React, { memo } from 'react';
import { Check } from 'lucide-react';
import { PackageData } from '@/types';
import { packageData } from '@/constants';

interface PackageFeaturesProps {
  selectedPackage: keyof PackageData;
}

const PackageFeatures = memo<PackageFeaturesProps>(({ selectedPackage }) => {
  const currentPackage = packageData[selectedPackage];

  return (
    <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-4 md:p-6">
      <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
        <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
        مميزات الباقة
      </h3>
      <div className="grid gap-2 sm:gap-3">
        {currentPackage.features.map((feature, index) => (
          <div key={index} className="flex items-start gap-2 sm:gap-3 group">
            <div className="relative flex-shrink-0">
              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mt-0.5 group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 bg-green-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <span className="text-gray-300 text-xs sm:text-sm leading-relaxed group-hover:text-white transition-colors">
              {feature}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

PackageFeatures.displayName = 'PackageFeatures';
export default PackageFeatures;
