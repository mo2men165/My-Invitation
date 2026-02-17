// components/dashboard/ActivityFeed.tsx
'use client';
import { Bell, CheckCircle, Download, Heart, User, Calendar, CreditCard, Settings } from 'lucide-react';

export function ActivityFeed() {
  const activities = [
    {
      id: 1,
      type: 'order_completed',
      title: 'تم إكمال طلبك',
      description: 'دعوة حفل زفاف أحمد وفاطمة جاهزة للتحميل',
      time: 'منذ 30 دقيقة',
      icon: CheckCircle,
      color: 'text-green-400'
    },
    {
      id: 2,
      type: 'download',
      title: 'تم تحميل الدعوة',
      description: 'تم تحميل دعوة عقد قران سارة ومحمد',
      time: 'منذ ساعتين',
      icon: Download,
      color: 'text-blue-400'
    },
    {
      id: 3,
      type: 'wishlist',
      title: 'إضافة للمفضلة',
      description: 'تم إضافة تصميم "الذهبي الكلاسيكي" للمفضلة',
      time: 'منذ 4 ساعات',
      icon: Heart,
      color: 'text-red-400'
    },
    {
      id: 4,
      type: 'guest_added',
      title: 'إضافة ضيف جديد',
      description: 'تم إضافة 15 ضيف جديد لمناسبة التخرج',
      time: 'أمس',
      icon: User,
      color: 'text-purple-400'
    },
    {
      id: 5,
      type: 'event_scheduled',
      title: 'مناسبة مجدولة',
      description: 'حفل ترقية وليد مجدول في 5 سبتمبر',
      time: 'منذ يومين',
      icon: Calendar,
      color: 'text-orange-400'
    },
    {
      id: 6,
      type: 'payment',
      title: 'تم الدفع بنجاح',
      description: 'دفع 1,250 ر.س لباقة Premium',
      time: 'منذ 3 أيام',
      icon: CreditCard,
      color: 'text-green-400'
    },
    {
      id: 7,
      type: 'settings',
      title: 'تحديث الملف الشخصي',
      description: 'تم تحديث معلومات الاتصال',
      time: 'منذ أسبوع',
      icon: Settings,
      color: 'text-gray-400'
    }
  ];

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-3 sm:p-4 md:p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-[#C09B52]" />
            <span>النشاط الأخير</span>
          </h2>
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#C09B52] rounded-full animate-pulse"></span>
        </div>
      </div>

      {/* Activities List */}
      <div className="p-3 sm:p-4 md:p-6">
        <div className="space-y-2 sm:space-y-3 md:space-y-4 max-h-72 sm:max-h-80 md:max-h-96 overflow-y-auto">
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div
                key={activity.id}
                className="group flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-white/5 transition-all duration-300"
              >
                {/* Icon */}
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${activity.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white group-hover:text-[#C09B52] transition-colors duration-300 text-xs sm:text-sm">
                    {activity.title}
                  </h3>
                  <p className="text-gray-400 text-[10px] sm:text-xs mt-0.5 sm:mt-1 line-clamp-2">
                    {activity.description}
                  </p>
                  <span className="text-gray-500 text-[10px] sm:text-xs mt-1 sm:mt-2 block">
                    {activity.time}
                  </span>
                </div>

                {/* Timeline Dot - Hidden on small mobile */}
                <div className="hidden xs:flex flex-col items-center">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#C09B52] rounded-full"></div>
                  {index !== activities.length - 1 && (
                    <div className="w-px h-8 sm:h-12 bg-gradient-to-b from-[#C09B52] to-transparent mt-1 sm:mt-2"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Button */}
        <div className="mt-4 sm:mt-6 text-center">
          <button className="text-[#C09B52] hover:text-amber-400 text-xs sm:text-sm font-medium transition-colors duration-300">
            عرض جميع الأنشطة
          </button>
        </div>
      </div>
    </div>
  );
}