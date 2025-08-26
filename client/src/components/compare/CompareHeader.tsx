'use client';
import React from 'react';
import { GitCompare } from 'lucide-react';

interface CompareHeaderProps {
  itemCount: number;
}

const CompareHeader: React.FC<CompareHeaderProps> = ({ itemCount }) => {
  return (
    <div className="text-center mb-12">
      <div className="inline-flex items-center gap-3 mb-6">
        <GitCompare className="w-8 h-8 text-[#C09B52]" />
        <h1 className="text-4xl lg:text-5xl font-bold text-white">
          مقارنة <span className="text-[#C09B52]">التصاميم</span>
        </h1>
      </div>
      <p className="text-xl text-gray-300 max-w-3xl mx-auto">
        قارن بين التصاميم المختلفة لاختيار الأنسب لمناسبتك ({itemCount}/3)
      </p>
    </div>
  );
};

export default CompareHeader;
