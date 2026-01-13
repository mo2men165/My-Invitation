import React from 'react';
import { Heart, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

const EmptyWishlist: React.FC = () => {
  return (
    <div className="text-center py-20">
      <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-12 border border-white/10 max-w-2xl mx-auto">
        <Heart className="w-20 h-20 text-gray-600 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-white mb-4">قائمة المفضلة فارغة</h2>
        <p className="text-gray-400 mb-8 text-lg">
          ابدأ بإضافة التصاميم والباقات التي تعجبك
        </p>
        <Button asChild className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold hover:from-pink-500 hover:to-red-500">
          <Link href="/packages">
            <Calendar className="w-5 h-5 mr-2" />
            تصفح التصاميم
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default EmptyWishlist;
