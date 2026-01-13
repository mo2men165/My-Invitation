// components/about/ServicesSection.tsx
'use client';
import { useEffect, useRef } from 'react';
import { QrCode, Palette, Share2, Shield, Video, Settings, Smartphone, Users } from 'lucide-react';

export function ServicesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = sectionRef.current?.querySelectorAll('.fade-in-element');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const services = [
    {
      icon: QrCode,
      title: 'بطاقات دعوة بباركود',
      description: 'تصميم بطاقات دعوة إلكترونية مميزة مع باركود فريد لكل ضيف يضمن الأمان ومنع التكرار',
      gradient: 'from-blue-500 to-cyan-500',
      delay: '0s'
    },
    {
      icon: Palette,
      title: 'تصاميم مخصصة',
      description: 'مكتبة واسعة من التصاميم الأنيقة القابلة للتخصيص لتناسب طبيعة مناسبتك وذوقك الشخصي',
      gradient: 'from-purple-500 to-pink-500',
      delay: '0.1s'
    },
    {
      icon: Share2,
      title: 'مشاركة سهلة',
      description: 'إرسال الدعوات مباشرة عبر الواتساب، الإيميل، أو وسائل التواصل الاجتماعي بضغطة واحدة',
      gradient: 'from-green-500 to-emerald-500',
      delay: '0.2s'
    },
    {
      icon: Shield,
      title: 'أمان متقدم',
      description: 'نظام حماية شامل يمنع دخول البطاقات المكررة أو المزيفة مع تتبع دقيق للحضور',
      gradient: 'from-red-500 to-rose-500',
      delay: '0.3s'
    },
    {
      icon: Video,
      title: 'فيديوهات دعوة',
      description: 'إنشاء فيديوهات دعوة شخصية مذهلة مع بيانات المناسبة وتفاصيل الحدث بجودة عالية',
      gradient: 'from-orange-500 to-amber-500',
      delay: '0.4s'
    },
    {
      icon: Settings,
      title: 'إدارة شاملة',
      description: 'لوحة تحكم متكاملة لإدارة الضيوف، تتبع الحضور، وإرسال التذكيرات والتحديثات',
      gradient: 'from-indigo-500 to-blue-500',
      delay: '0.5s'
    },
    {
      icon: Smartphone,
      title: 'متوافق مع الجوال',
      description: 'تطبيق محسن للهواتف الذكية يضمن تجربة مستخدم سلسة ومريحة لجميع الأجهزة',
      gradient: 'from-teal-500 to-cyan-500',
      delay: '0.6s'
    },
    {
      icon: Users,
      title: 'دعم فني 24/7',
      description: 'فريق دعم متخصص متاح على مدار الساعة لمساعدتك في جميع استفساراتك ومتطلباتك',
      gradient: 'from-violet-500 to-purple-500',
      delay: '0.7s'
    }
  ];

  return (
    <section ref={sectionRef} className="relative py-24 bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQzA5QjUyIiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
        
        {/* Floating Orbs */}
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-[#C09B52]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="container mx-auto px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="fade-in-element opacity-0 transform translate-y-8">
            <div className="inline-flex items-center space-x-3  mb-6">
              <div className="w-2 h-2 bg-[#C09B52] rounded-full animate-pulse"></div>
              <span className="text-[#C09B52] font-medium tracking-wider uppercase text-sm">خدماتنا</span>
              <div className="w-2 h-2 bg-[#C09B52] rounded-full animate-pulse"></div>
            </div>
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              حلول <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C09B52] to-amber-400">متكاملة</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              نقدم مجموعة شاملة من الخدمات المبتكرة لجعل مناسباتكم استثنائية ولا تُنسى
            </p>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={index}
                className="fade-in-element opacity-0 transform translate-y-8"
                style={{ animationDelay: service.delay }}
              >
                <div className="group relative h-full">
                  {/* Glow Effect */}
                  <div className={`absolute -inset-0.5 bg-gradient-to-r ${service.gradient} rounded-2xl blur opacity-0 group-hover:opacity-20 transition-all duration-500`}></div>
                  
                  {/* Card */}
                  <div className="relative h-full bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500 group-hover:transform group-hover:scale-105">
                    {/* Icon */}
                    <div className="mb-6">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.gradient} p-0.5 group-hover:scale-110 transition-transform duration-500`}>
                        <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-white group-hover:text-[#C09B52] transition-colors duration-300">
                        {service.title}
                      </h3>
                      <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                        {service.description}
                      </p>
                    </div>

                    {/* Hover Arrow */}
                    <div className="absolute bottom-6 left-6 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#C09B52] to-amber-400 flex items-center justify-center">
                        <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Floating Particle */}
                    <div className="absolute top-4 right-4 w-2 h-2 bg-gradient-to-r from-[#C09B52] to-amber-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>


      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(2rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
      `}</style>
    </section>
  );
}