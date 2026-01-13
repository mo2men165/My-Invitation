// components/about/AboutUsSection.tsx
'use client';
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { Sparkles, Star, Zap } from 'lucide-react';

export function AboutUsSection() {
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

  return (
    <section ref={sectionRef} className="relative py-24 bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0">
        {/* Floating Particles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full animate-pulse"
            style={{
              backgroundColor: '#C09B52',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
        
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-[#C09B52]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Text Content */}
          <div className="space-y-8">
            {/* Section Header */}
            <div className="fade-in-element opacity-0 transform translate-y-8">
              <div className="flex items-center space-x-3  mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C09B52] to-amber-600 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-black" />
                </div>
                <div className="h-px bg-gradient-to-r from mr-2-[#C09B52] to-transparent flex-1"></div>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                عن <span className="text-[#C09B52]">INVITATION</span>
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed">
                نحن متحمسون لجعل مناسباتكم الخاصة أكثر تميزًا من خلال دعوات مصممة بشكل جميل وحلول إدارة فعاليات سلسة.
              </p>
            </div>

            {/* Main Content */}
            <div className="space-y-6">
              {/* First Point */}
              <div className="fade-in-element opacity-0 transform translate-y-8" style={{ animationDelay: '0.2s' }}>
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-[#C09B52]/30 transition-all duration-500 group">
                  <div className="flex items-start space-x-4 ">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C09B52] to-amber-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <Star className="w-4 h-4 text-black" />
                    </div>
                    <p className="text-gray-300 leading-relaxed mr-2 group-hover:text-white transition-colors duration-300">
                      أول شركة سعودية للمناسبات والفعاليات باستخدام الذكاء الصناعي. أردنا الجمع بين التصميم الرائع والتكنولوجيا المبتكرة لجعل مناسبتك أكثر سهولة وتميزاً باستخدام أحدث الأدوات التقنية لإدارة كافة أنواع الفعاليات والمناسبات.
                    </p>
                  </div>
                </div>
              </div>

              {/* Second Point */}
              <div className="fade-in-element opacity-0 transform translate-y-8" style={{ animationDelay: '0.4s' }}>
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-[#C09B52]/30 transition-all duration-500 group">
                  <div className="flex items-start space-x-4 ">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C09B52] to-amber-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <Zap className="w-4 h-4 text-black" />
                    </div>
                    <p className="text-gray-300 leading-relaxed mr-2 group-hover:text-white transition-colors duration-300">
                      تقنية بطاقات INVITATION تعمل على توفير تصاميم مميزة تتناسب مع التصميم العام للحفل أو المناسبة وبباركود خاص بكل بطاقة لا تسمح بدخول البطاقات المكررة، وهذا يوفر السهولة في توزيع البطاقات من خلال الجوال وأيضاً التنظيم لصاحب الدعوة.
                    </p>
                  </div>
                </div>
              </div>

              {/* Third Point */}
              <div className="fade-in-element opacity-0 transform translate-y-8" style={{ animationDelay: '0.6s' }}>
                <div className="bg-gradient-to-r from-[#C09B52]/10 to-amber-600/10 backdrop-blur-sm rounded-2xl p-6 border border-[#C09B52]/20 hover:border-[#C09B52]/40 transition-all duration-500 group">
                  <div className="flex items-start space-x-4 ">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C09B52] to-amber-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="w-4 h-4 text-black" />
                    </div>
                    <p className="text-gray-200 leading-relaxed mr-2 group-hover:text-white transition-colors duration-300 font-medium">
                      بطاقات INVITATION أسلوب راقي وعصري وحديث لدعوة الضيوف، بالإضافة إلى فيديو دعوة يتم إعداده ببيانات صاحب المناسبة يتم إرساله مع بطاقات الدخول.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Image Section */}
          <div className="fade-in-element opacity-0 transform translate-y-8" style={{ animationDelay: '0.8s' }}>
            <div className="relative group">
              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-[#C09B52]/20 to-amber-600/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
              
              {/* Image Container */}
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-white/10 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQzA5QjUyIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
                </div>
                
                {/* Placeholder for actual image */}
                <div className="relative aspect-[4/3] bg-gradient-to-br from-[#C09B52]/20 to-amber-600/20 rounded-2xl flex items-center justify-center border border-[#C09B52]/30">
                  <Image
                    src="/invitation.jpg"
                    alt="INVITATION Platform"
                    fill
                    className="object-cover rounded-2xl"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>

                {/* Floating Elements */}
                <div className="absolute top-4 right-4 w-3 h-3 bg-[#C09B52] rounded-full animate-ping"></div>
                <div className="absolute bottom-4 left-4 w-2 h-2 bg-amber-600 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
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