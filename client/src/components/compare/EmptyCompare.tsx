import React from 'react';
import { GitCompare, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

const EmptyCompare: React.FC = () => {
  return (
    <div className="text-center py-20">
      <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-12 border border-white/10 max-w-2xl mx-auto">
        <GitCompare className="w-20 h-20 text-gray-600 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-white mb-4">لا توجد تصاميم للمقارنة</h2>
        <p className="text-gray-400 mb-8 text-lg">
          ابدأ بإضافة تصاميم من صفحة التصاميم لمقارنتها هنا
        </p>
        <Button asChild className="bg-gradient-to-r from-[#C09B52] to-amber-600 text-black font-bold hover:from-amber-600 hover:to-[#C09B52]">
          <Link href="/packages">
            <ShoppingCart className="w-5 h-5 mr-2" />
            تصفح التصاميم
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default EmptyCompare;
