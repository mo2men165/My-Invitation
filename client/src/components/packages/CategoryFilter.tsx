// client/src/components/packages/CategoryFilter.tsx - Category filter component to reduce nesting
'use client';
import React from 'react';

interface CategoryFilterProps {
  selectedCategories: string[];
  onToggleCategory: (category: string) => void;
  categories: Array<{ value: string; label: string }>;
}

export default function CategoryFilter({ 
  selectedCategories, 
  onToggleCategory, 
  categories 
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-8 justify-center">
      {categories.map((category) => (
        <button
          key={category.value}
          onClick={() => onToggleCategory(category.value)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            selectedCategories.includes(category.value)
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
