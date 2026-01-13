'use client';
import React from 'react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface CompareActionsProps {
  itemCount: number;
}

const CompareActions: React.FC<CompareActionsProps> = ({ itemCount }) => {
  if (itemCount === 0) return null;

  return (
    <div className="text-center mt-12">
      <div className="bg-gradient-to-r from-[#C09B52]/10 to-amber-600/10 backdrop-blur-sm rounded-2xl p-8 border border-[#C09B52]/20 max-w-2xl mx-auto">
        <h3 className="text-2xl font-bold text-white mb-4">هل تحتاج مساعدة في الاختيار؟</h3>
        <p className="text-gray-300 mb-6">تواصل مع فريقنا للحصول على استشارة مجانية</p>
        <Button asChild variant="outline" className="border-[#C09B52] text-[#C09B52] hover:bg-[#C09B52] hover:text-black">
          <Link href="/contact">
            تواصل معنا
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default CompareActions;
