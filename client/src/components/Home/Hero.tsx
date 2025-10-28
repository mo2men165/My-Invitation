// components/sections/HeroSection.tsx
'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { ArrowDown, Sparkles, Calendar, Users, Send, BarChart3 } from 'lucide-react';

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const slides = [
    {
      title: "منصة إدارة الدعوات الذكية",
      subtitle: "تجربة استثنائية لمناسباتك المميزة",
      description: "نظم مناسباتك وأرسل دعواتك الرقمية بطريقة احترافية وسهلة. من الزفاف إلى التخرج، كل شيء في مكان واحد.",
      highlight: "أكثر من 7000 مناسبة ناجحة"
    },
    {
      title: "دعوات رقمية بتصميم مبتكر",
      subtitle: "إبداع لا حدود له في كل دعوة",
      description: "اختر من مئات التصاميم المتميزة أو أنشئ تصميمك الخاص. دعوات تفاعلية تترك انطباعاً لا يُنسى.",
      highlight: "أكثر من 500 تصميم حصري"
    },
    {
      title: "تحليلات ذكية ومتقدمة",
      subtitle: "فهم أعمق لنجاح مناسبتك",
      description: "احصل على تقارير مفصلة وتحليلات ذكية لمعرفة معدل الحضور والتفاعل مع دعواتك.",
      highlight: "دقة تصل إلى 99%"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const floatingIcons = [
    { Icon: Calendar, delay: 0, x: 10, y: 20 },
    { Icon: Users, delay: 1, x: 85, y: 15 },
    { Icon: Send, delay: 2, x: 15, y: 75 },
    { Icon: BarChart3, delay: 3, x: 80, y: 80 },
    { Icon: Sparkles, delay: 4, x: 50, y: 10 },
  ];

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black">
      
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Dynamic gradient orbs */}
        <div 
          className="absolute w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(192, 155, 82, 0.2) 0%, rgba(192, 155, 82, 0.1) 100%)',
            left: `${mousePosition.x * 0.02}%`,
            top: `${mousePosition.y * 0.02}%`,
            animation: 'float 6s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute w-64 h-64 rounded-full blur-2xl animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(192, 155, 82, 0.15) 0%, rgba(192, 155, 82, 0.05) 100%)',
            right: `${mousePosition.x * 0.01}%`,
            bottom: `${mousePosition.y * 0.01}%`,
            animation: 'float 8s ease-in-out infinite reverse'
          }}
        />
        
        {/* Geometric patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 border rotate-45 animate-spin-slow" style={{ borderColor: '#C09B52' }} />
          <div className="absolute bottom-20 right-20 w-24 h-24 border-2 rounded-full animate-pulse" style={{ borderColor: '#C09B52' }} />
          <div 
            className="absolute top-1/2 left-10 w-16 h-16 rotate-12 animate-bounce-slow"
            style={{ background: 'linear-gradient(to right, #C09B52, transparent)' }}
          />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full animate-twinkle"
              style={{
                backgroundColor: '#C09B52',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Floating Icons */}
      {floatingIcons.map(({ Icon, delay, x, y }, index) => (
        <div
          key={index}
          className="absolute opacity-20"
          style={{
            color: '#C09B52',
            left: `${x}%`,
            top: `${y}%`,
            animation: `floatIcon 4s ease-in-out infinite ${delay}s`
          }}
        >
          <Icon className="w-8 h-8" />
        </div>
      ))}

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-8 py-20 min-h-screen flex items-center">
        <div className="grid lg:grid-cols-2 gap-16 items-center w-full">
          
          {/* Content Side */}
          <div className="text-center lg:text-right space-y-8">
            
            {/* Badge */}
            <div 
              className="inline-flex items-center rounded-full px-6 py-2 backdrop-blur-sm"
              style={{ 
                backgroundColor: 'rgba(192, 155, 82, 0.1)', 
                border: '1px solid rgba(192, 155, 82, 0.3)' 
              }}
            >
              <Sparkles className="w-4 h-4 mr-2 ml-2" style={{ color: '#C09B52' }} />
              <span className="text-sm font-medium" style={{ color: '#C09B52' }}>
                {slides[currentSlide].highlight}
              </span>
            </div>

            {/* Main Title with Animation */}
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                <span 
                  className="bg-clip-text text-transparent animate-gradient"
                  style={{ 
                    background: `linear-gradient(to right, #ffffff, #f3f4f6, #C09B52)`,
                    backgroundSize: '200% 200%',
                    WebkitBackgroundClip: 'text'
                  }}
                >
                  {slides[currentSlide].title}
                </span>
              </h1>
              <h2 className="text-2xl lg:text-3xl font-medium animate-fade-in" style={{ color: '#C09B52' }}>
                {slides[currentSlide].subtitle}
              </h2>
            </div>

            {/* Description */}
            <p className="text-xl text-gray-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed animate-slide-up">
              {slides[currentSlide].description}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start items-center">
              <Button 
                size="lg" 
                asChild 
                className="group text-black font-bold px-8 py-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105"
                style={{ 
                  background: `linear-gradient(to right, #C09B52, #D4AD63)`,
                  boxShadow: '0 25px 50px -12px rgba(192, 155, 82, 0.5)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #D4AD63, #C09B52)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #C09B52, #D4AD63)';
                }}
              >
                <Link href="/packages" className="flex items-center">
                  الباقات
                  <ArrowDown className="mr-2 w-5 h-5 group-hover:animate-bounce" />
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                asChild 
                className="border-2 px-8 py-4 rounded-full backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
                style={{ 
                  borderColor: '#C09B52', 
                  color: '#C09B52' 
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#C09B52';
                  e.currentTarget.style.color = '#000000';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#C09B52';
                }}
              >
                <Link href="/about" className="flex items-center">
                  تعرف علينا
                  <Sparkles className="mr-2 w-5 h-5" />
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-700">
              <div className="text-center">
                <div className="text-3xl font-bold animate-counter" style={{ color: '#C09B52' }}>7000K+</div>
                <div className="text-gray-400 text-sm">مناسبة ناجحة</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold animate-counter" style={{ color: '#C09B52' }}>99%</div>
                <div className="text-gray-400 text-sm">رضا العملاء</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold animate-counter" style={{ color: '#C09B52' }}>24/7</div>
                <div className="text-gray-400 text-sm">دعم فني</div>
              </div>
            </div>
          </div>

          {/* Visual Side */}
          <div className="relative">
            {/* Main Visual Container */}
            <div className="relative w-full h-96 lg:h-[500px]">
              
              {/* Central Device Mockup */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Phone Mockup */}
                  <div className="w-64 h-96 bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl border-4 border-gray-700 shadow-2xl transform rotate-6 hover:rotate-3 transition-transform duration-500">
                    <div className="p-6 h-full flex flex-col">
                      <div 
                        className="w-full h-32 rounded-2xl mb-4 flex items-center justify-center"
                        style={{ background: `linear-gradient(to right, #C09B52, #D4AD63)` }}
                      >
                        <Calendar className="w-12 h-12 text-black" />
                      </div>
                      <div className="space-y-3 flex-1">
                        <div className="h-4 bg-gray-600 rounded animate-pulse" />
                        <div className="h-4 bg-gray-600 rounded w-3/4 animate-pulse" />
                        <div className="h-4 bg-gray-600 rounded w-1/2 animate-pulse" />
                      </div>
                      <div 
                        className="w-full h-12 rounded-xl flex items-center justify-center mt-4"
                        style={{ backgroundColor: '#C09B52' }}
                      >
                        <span className="text-black font-bold text-sm">إرسال الدعوة</span>
                      </div>
                    </div>
                  </div>

                  {/* Floating Cards */}
                  <div 
                    className="absolute -top-8 -left-8 w-20 h-20 rounded-2xl shadow-lg animate-float transform rotate-12 flex items-center justify-center"
                    style={{ background: `linear-gradient(to bottom right, #C09B52, #D4AD63)` }}
                  >
                    <Users className="w-8 h-8 text-black" />
                  </div>
                  
                  <div 
                    className="absolute -bottom-8 -right-8 w-24 h-24 rounded-2xl shadow-lg animate-float-delayed transform -rotate-12 flex items-center justify-center"
                    style={{ background: `linear-gradient(to bottom right, #D4AD63, #C09B52)` }}
                  >
                    <BarChart3 className="w-10 h-10 text-black" />
                  </div>

                  <div 
                    className="absolute top-1/2 -right-12 w-16 h-16 rounded-full shadow-lg animate-pulse flex items-center justify-center"
                    style={{ background: `linear-gradient(to bottom right, #C09B52, #D4AD63)` }}
                  >
                    <Send className="w-6 h-6 text-black" />
                  </div>
                </div>
              </div>

              {/* Connecting Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                <defs>
                  <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#C09B52" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#C09B52" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                <path 
                  d="M100 100 Q200 50 300 100" 
                  stroke="url(#line-gradient)" 
                  strokeWidth="2" 
                  fill="none"
                  className="animate-draw-line"
                />
                <path 
                  d="M400 300 Q300 250 200 300" 
                  stroke="url(#line-gradient)" 
                  strokeWidth="2" 
                  fill="none"
                  className="animate-draw-line-delayed"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'w-8' 
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
            style={index === currentSlide ? { backgroundColor: '#C09B52' } : {}}
          />
        ))}
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 right-8 animate-bounce">
        <ArrowDown className="w-6 h-6" style={{ color: '#C09B52' }} />
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes floatIcon {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-15px) scale(1.1); }
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes counter {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes draw-line {
          from { stroke-dasharray: 300; stroke-dashoffset: 300; }
          to { stroke-dasharray: 300; stroke-dashoffset: 0; }
        }
        
        .animate-spin-slow { animation: spin 8s linear infinite; }
        .animate-bounce-slow { animation: bounce 3s infinite; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-float-delayed { animation: float 3s ease-in-out infinite 1.5s; }
        .animate-gradient { animation: gradient 3s ease infinite; background-size: 200% 200%; }
        .animate-fade-in { animation: fade-in 1s ease-out; }
        .animate-slide-up { animation: slide-up 1s ease-out 0.3s both; }
        .animate-counter { animation: counter 1s ease-out 0.6s both; }
        .animate-draw-line { animation: draw-line 2s ease-in-out infinite; }
        .animate-draw-line-delayed { animation: draw-line 2s ease-in-out infinite 1s; }
        .animate-twinkle { animation: twinkle 3s ease-in-out infinite; }
      `}</style>
    </section>
  );
}