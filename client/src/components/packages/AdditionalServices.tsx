'use client';
import React from 'react';
import { Plus, Users, Zap } from 'lucide-react';
import { additionalServices } from '@/constants';

const AdditionalServices: React.FC = () => {
  const gateSupervisorService = additionalServices.find(s => s.id === 'gate-supervisors');
  
  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-8 text-center">
        <span className="text-[#C09B52]">خدمات</span> إضافية
      </h2>
      
      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Extra Cards */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-[#C09B52]/30 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <Plus className="w-8 h-8 text-[#C09B52]" />
            <h3 className="text-xl font-bold text-white">كروت إضافية</h3>
          </div>
          <p className="text-gray-400 mb-4">أضف المزيد من الدعوات لباقتك</p>
          <div className="text-2xl font-bold text-[#C09B52] mb-2">30 ر.س</div>
          <div className="text-gray-400">للكرت الواحد</div>
        </div>

        {/* Gate Supervisors */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-[#C09B52]/30 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-8 h-8 text-[#C09B52]" />
            <h3 className="text-xl font-bold text-white">مشرفين البوابة</h3>
          </div>
          <p className="text-gray-400 mb-4">مشرفين مع أجهزة قراءة الباركود</p>
          <div className="space-y-2">
            {gateSupervisorService?.options?.map((option, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-300">{option.range}</span>
                <span className="text-[#C09B52]">{option.price.toLocaleString('ar-SA')} ر.س</span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-gray-500">
            متوفر في: {gateSupervisorService?.cities?.join(' - ')}
          </div>
        </div>

        {/* Fast Delivery */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-[#C09B52]/30 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-[#C09B52]" />
            <h3 className="text-xl font-bold text-white">تسريع التنفيذ</h3>
          </div>
          <p className="text-gray-400 mb-4">تنفيذ خلال يومين عمل بدلاً من 4-7 أيام</p>
          <div className="text-2xl font-bold text-[#C09B52] mb-2">3,000 ر.س</div>
          <div className="text-gray-400">خدمة سريعة</div>
        </div>
      </div>
    </div>
  );
};

export default AdditionalServices;
