'use client';
import React from 'react';
import { Check } from 'lucide-react';
import { PackageInfo } from '@/types';

interface PackageOverviewProps {
  package: PackageInfo;
}

const PackageOverview: React.FC<PackageOverviewProps> = ({ package: pkg }) => {
  return (
    <div className="mb-12">
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
        <div className="flex items-center gap-4 mb-6">
          <pkg.icon className="w-8 h-8 text-[#C09B52]" />
          <h2 className="text-3xl font-bold text-white">
            مميزات باقة {pkg.name}
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pkg.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
              <span className="text-gray-300">{feature}</span>
            </div>
          ))}
        </div>

        {/* Pricing Table */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-white mb-4">أسعار الباقة</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {pkg.pricing.map((option, index) => (
              <div 
                key={index} 
                className="bg-white/5 rounded-xl p-4 text-center border border-white/10 hover:border-[#C09B52]/30 transition-all duration-300"
              >
                <div className="text-lg font-bold text-white mb-1">{option.invites}</div>
                <div className="text-xs text-gray-400 mb-2">دعوة</div>
                <div className="text-xl font-bold text-[#C09B52]">
                  {option.price.toLocaleString('ar-SA')}
                </div>
                <div className="text-xs text-gray-400">ر.س</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageOverview;
