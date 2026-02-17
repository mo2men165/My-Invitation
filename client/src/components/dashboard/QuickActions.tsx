// components/dashboard/QuickActions.tsx
'use client';
import { quickActions } from '@/constants';

export function QuickActions() {

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2">الإجراءات السريعة</h2>
        <p className="text-gray-400 text-xs sm:text-sm md:text-base">الوصول السريع للمهام الأكثر استخداماً</p>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <a
              key={index}
              href={action.href}
              className={`group relative block transition-all duration-300 hover:scale-105 ${
                action.primary ? 'col-span-2' : ''
              }`}
            >
              {/* Glow Effect */}
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${action.color} rounded-lg sm:rounded-xl blur opacity-0 group-hover:opacity-20 transition-all duration-500`}></div>
              
              {/* Card */}
              <div className={`relative h-full bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-white/10 group-hover:border-white/20 transition-all duration-500 ${
                action.primary ? 'lg:p-8' : ''
              }`}>
                
                {/* Icon */}
                <div className="mb-2 sm:mb-3 md:mb-4">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${action.color} p-0.5 group-hover:scale-110 transition-transform duration-500 ${
                    action.primary ? 'lg:w-16 lg:h-16' : ''
                  }`}>
                    <div className="w-full h-full bg-black rounded-lg sm:rounded-xl flex items-center justify-center">
                      <Icon className={`text-white ${action.primary ? 'w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8' : 'w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6'}`} />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-1 sm:space-y-2">
                  <h3 className={`font-bold text-white group-hover:text-[#C09B52] transition-colors duration-300 ${
                    action.primary ? 'text-sm sm:text-base md:text-xl lg:text-2xl' : 'text-xs sm:text-sm md:text-lg'
                  }`}>
                    {action.title}
                  </h3>
                  <p className={`text-gray-400 group-hover:text-gray-300 transition-colors duration-300 line-clamp-2 ${
                    action.primary ? 'text-[10px] sm:text-xs md:text-base lg:text-lg' : 'text-[10px] sm:text-xs md:text-sm'
                  }`}>
                    {action.description}
                  </p>
                </div>

                {/* Arrow - Hidden on mobile */}
                <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300 hidden sm:block">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-r from-[#C09B52] to-amber-400 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                </div>

                {/* Floating Particle */}
                <div className="absolute top-2 sm:top-4 right-2 sm:right-4 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-[#C09B52] to-amber-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}