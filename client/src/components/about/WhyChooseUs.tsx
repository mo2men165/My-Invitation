// components/about/WhyChooseUsSection.tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, Crown, Shield, Smartphone, Users, Zap, DollarSign, RefreshCw } from 'lucide-react';

export function WhyChooseUsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

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

  const features = [
    {
      icon: Crown,
      title: 'أسلوب راقي وعصري',
      description: 'بطاقات الدعوة والدخول بباركود خاص بالضيف - أسلوب جديد وراقي للدعوة',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-500/10 to-pink-500/10',
      delay: '0s'
    },
    {
      icon: Zap,
      title: 'مرونة في التصميم',
      description: 'مرونة في اختيار تصاميم وألوان البطاقات تناسب تصميم قاعة المناسبة',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-500/10 to-cyan-500/10',
      delay: '0.1s'
    },
    {
      icon: Smartphone,
      title: 'سهولة التوزيع',
      description: 'صاحب المناسبة يتولى توزيع البطاقات بسهولة من خلال جواله إلى كل واحد من ضيوفه',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-500/10 to-emerald-500/10',
      delay: '0.2s'
    },
    {
      icon: Shield,
      title: 'ضمان الوصول',
      description: 'ضمان وصول بطاقات الدعوة والدخول للضيوف بأحدث تقنيات التوصيل',
      color: 'from-red-500 to-rose-500',
      bgColor: 'from-red-500/10 to-rose-500/10',
      delay: '0.3s'
    },
    {
      icon: RefreshCw,
      title: 'إعادة الاستخدام',
      description: 'بإمكان صاحب المناسبة في حالة اعتذار عدد من الضيوف إرسال نفس البطاقات لضيوف آخرين دون إهدار',
      color: 'from-orange-500 to-amber-500',
      bgColor: 'from-orange-500/10 to-amber-500/10',
      delay: '0.4s'
    },
    {
      icon: DollarSign,
      title: 'تكلفة مناسبة',
      description: 'التكلفة مناسبة وفي متناول الجميع مع أفضل قيمة مقابل الخدمات المقدمة',
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'from-indigo-500/10 to-purple-500/10',
      delay: '0.5s'
    }
  ];

  return (
    <section ref={sectionRef} className="relative py-24 bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        {/* Animated Gradient Meshes */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-[#C09B52]/20 to-amber-600/20 rounded-full blur-3xl animate-pulse opacity-20"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse opacity-20" style={{ animationDelay: '2s' }}></div>
        
        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full animate-ping"
            style={{
              backgroundColor: Math.random() > 0.5 ? '#C09B52' : '#F59E0B',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="fade-in-element opacity-0 transform translate-y-8">
            <div className="inline-flex items-center space-x-3  mb-6">
              <div className="h-px bg-gradient-to-r from-transparent via-[#C09B52] to-transparent w-16"></div>
              <span className="text-[#C09B52] font-bold tracking-wider uppercase text-sm px-4 py-2 bg-[#C09B52]/10 rounded-full border border-[#C09B52]/20">
                لماذا نحن؟
              </span>
              <div className="h-px bg-gradient-to-r from-transparent via-[#C09B52] to-transparent w-16"></div>
            </div>
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              ميزات الدعوة الإلكترونية
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C09B52] via-amber-400 to-[#C09B52]">
                بباركود
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              نقدم لك أحدث التقنيات وأفضل الحلول لجعل مناسبتك مميزة واستثنائية بكل المقاييس
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isHovered = hoveredCard === index;
            
            return (
              <div
                key={index}
                className="fade-in-element opacity-0 transform translate-y-8"
                style={{ animationDelay: feature.delay }}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="group relative h-full">
                  {/* Dynamic Glow Effect */}
                  <div className={`absolute -inset-1 bg-gradient-to-r ${feature.color} rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-all duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}></div>
                  
                  {/* Main Card */}
                  <div className={`relative h-full bg-gradient-to-br ${feature.bgColor} backdrop-blur-xl rounded-2xl p-8 border border-white/10 group-hover:border-white/30 transition-all duration-500 overflow-hidden ${isHovered ? 'transform scale-105' : ''}`}>
                    
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDIwIDAgTCAwIDAgMCAyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-10"></div>
                    </div>

                    {/* Floating Decoration */}
                    <div className="absolute top-4 left-4 w-16 h-16 rounded-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/10 to-white/5"></div>
                    </div>

                    {/* Icon */}
                    <div className="relative mb-6 z-10">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} p-0.5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                        <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
                          <Icon className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 space-y-4">
                      <h3 className="text-xl font-bold text-white group-hover:text-[#C09B52] transition-colors duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                        {feature.description}
                      </p>
                    </div>

                    {/* Check Mark */}
                    <div className="absolute bottom-6 left-6 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${feature.color} flex items-center justify-center`}>
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    {/* Animated Border */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-gradient-to-r group-hover:from-[#C09B52] group-hover:to-amber-400 transition-all duration-500 pointer-events-none"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Highlight Section */}
        <div className="fade-in-element opacity-0 transform translate-y-8" style={{ animationDelay: '0.6s' }}>
          <div className="relative">
            {/* Glow Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#C09B52]/20 to-amber-600/20 rounded-3xl blur-xl"></div>
            
            {/* Content Card */}
            <div className="relative bg-gradient-to-r from-[#C09B52]/10 to-amber-600/10 backdrop-blur-xl rounded-3xl p-8 lg:p-12 border border-[#C09B52]/30 text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C09B52] to-amber-600 flex items-center justify-center">
                  <Crown className="w-10 h-10 text-black" />
                </div>
              </div>
              
              <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
                الحل الأمثل لمناسباتك المميزة
              </h3>
              
              <p className="text-lg text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                مع INVITATION، احصل على تجربة فريدة تجمع بين الأناقة والتكنولوجيا المتطورة. 
                خدماتنا مصممة خصيصاً لتلبية احتياجاتك وتحقيق توقعاتك في كل التفاصيل.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-[#C09B52]">99%</div>
                  <div className="text-gray-400">معدل رضا العملاء</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-[#C09B52]">24/7</div>
                  <div className="text-gray-400">دعم فني متواصل</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-[#C09B52]">7000+</div>
                  <div className="text-gray-400">مناسبة ناجحة</div>
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