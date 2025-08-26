// components/contact/ContactInfoSection.tsx
'use client';
import { useEffect, useRef } from 'react';
import { MapPin, Clock, Globe, Users, Award, Headphones } from 'lucide-react';

export function ContactInfoSection() {
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

  const contactInfo = [
    {
      icon: MapPin,
      title: 'موقعنا',
      description: 'المملكة العربية السعودية',
      details: 'نخدم جميع أنحاء المملكة',
      gradient: 'from-blue-500 to-cyan-500',
      delay: '0s'
    },
    {
      icon: Clock,
      title: 'ساعات العمل',
      description: 'الأحد - الخميس',
      details: '9:00 ص - 6:00 م',
      gradient: 'from-green-500 to-emerald-500',
      delay: '0.1s'
    },
    {
      icon: Globe,
      title: 'خدمة عالمية',
      description: 'متاح في 15+ دولة',
      details: 'خدمات متعددة اللغات',
      gradient: 'from-purple-500 to-pink-500',
      delay: '0.2s'
    },
    {
      icon: Users,
      title: 'فريق الدعم',
      description: '50+ خبير متخصص',
      details: 'جاهزون لمساعدتك',
      gradient: 'from-orange-500 to-red-500',
      delay: '0.3s'
    },
    {
      icon: Award,
      title: 'الخبرة',
      description: '+5 سنوات خبرة',
      details: '1000+ مناسبة ناجحة',
      gradient: 'from-yellow-500 to-orange-500',
      delay: '0.4s'
    },
    {
      icon: Headphones,
      title: 'دعم 24/7',
      description: 'خدمة متواصلة',
      details: 'نحن هنا دائماً',
      gradient: 'from-indigo-500 to-purple-500',
      delay: '0.5s'
    }
  ];

  return (
    <section ref={sectionRef} className="relative py-24 bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQzA5QjUyIiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#C09B52]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="container mx-auto px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="fade-in-element opacity-0 transform translate-y-8">
            <div className="inline-flex items-center space-x-3  mb-6">
              <div className="w-2 h-2 bg-[#C09B52] rounded-full animate-pulse"></div>
              <span className="text-[#C09B52] font-medium tracking-wider uppercase text-sm">معلومات التواصل</span>
              <div className="w-2 h-2 bg-[#C09B52] rounded-full animate-pulse"></div>
            </div>
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              نحن هنا <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C09B52] to-amber-400">لخدمتك</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              فريقنا المتخصص جاهز لمساعدتك في كل خطوة لضمان نجاح مناسبتك
            </p>
          </div>
        </div>

        {/* Contact Info Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {contactInfo.map((info, index) => {
            const Icon = info.icon;
            return (
              <div
                key={index}
                className="fade-in-element opacity-0 transform translate-y-8"
                style={{ animationDelay: info.delay }}
              >
                <div className="group relative h-full">
                  {/* Glow Effect */}
                  <div className={`absolute -inset-0.5 bg-gradient-to-r ${info.gradient} rounded-2xl blur opacity-0 group-hover:opacity-20 transition-all duration-500`}></div>
                  
                  {/* Card */}
                  <div className="relative h-full bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500 group-hover:transform group-hover:scale-105 text-center">
                    {/* Icon */}
                    <div className="mb-6 flex justify-center">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${info.gradient} p-0.5 group-hover:scale-110 transition-transform duration-500`}>
                        <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-white group-hover:text-[#C09B52] transition-colors duration-300">
                        {info.title}
                      </h3>
                      <p className="text-gray-300 font-medium group-hover:text-white transition-colors duration-300">
                        {info.description}
                      </p>
                      <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-300">
                        {info.details}
                      </p>
                    </div>

                    {/* Floating Particle */}
                    <div className="absolute top-4 right-4 w-2 h-2 bg-gradient-to-r from-[#C09B52] to-amber-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Map Section */}
        <div className="fade-in-element opacity-0 transform translate-y-8" style={{ animationDelay: '0.6s' }}>
          <div className="relative">
            {/* Glow Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#C09B52]/20 to-amber-600/20 rounded-3xl blur-xl"></div>
            
            {/* Map Container */}
            <div className="relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-3xl p-8 border border-white/10 overflow-hidden">
              <div className="text-center mb-8">
                <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
                  موقعنا الجغرافي
                </h3>
                <p className="text-gray-300">
                  نخدم عملاءنا في جميع أنحاء المملكة العربية السعودية
                </p>
              </div>

              {/* Placeholder for Map */}
              <div className="relative h-96 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden border border-white/10">
                {/* Map Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDIwIDAgTCAwIDAgMCAyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQzA5QjUyIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
                </div>
                
                {/* Map Content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#C09B52] to-amber-600 flex items-center justify-center animate-pulse">
                      <MapPin className="w-10 h-10 text-black" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg">المملكة العربية السعودية</h4>
                      <p className="text-gray-400">نخدم جميع المناطق</p>
                    </div>
                  </div>
                </div>

                {/* Animated Markers */}
                <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-[#C09B52] rounded-full animate-ping"></div>
                <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-[#C09B52] rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
              </div>

              {/* Contact Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-2xl font-bold text-[#C09B52] mb-2">1000+</div>
                  <div className="text-gray-400 text-sm">عميل سعيد</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-2xl font-bold text-[#C09B52] mb-2">24/7</div>
                  <div className="text-gray-400 text-sm">خدمة مستمرة</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-2xl font-bold text-[#C09B52] mb-2">5+</div>
                  <div className="text-gray-400 text-sm">سنوات خبرة</div>
                </div>
              </div>
            </div>
          </div>
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