// src/app/not-found.tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, Search, ArrowLeft, Calendar, Heart, ShoppingCart, Phone } from 'lucide-react';

export default function NotFound() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const quickLinks = [
    {
      title: 'الصفحة الرئيسية',
      description: 'العودة للرئيسية',
      href: '/',
      icon: Home,
      color: 'from-[#C09B52] to-amber-600'
    },
    {
      title: 'الباقات',
      description: 'تصفح باقاتنا',
      href: '/packages',
      icon: Calendar,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'المفضلة',
      description: 'عرض المحفوظات',
      href: '/wishlist',
      icon: Heart,
      color: 'from-red-500 to-pink-500'
    },
    {
      title: 'السلة',
      description: 'إدارة المشتريات',
      href: '/cart',
      icon: ShoppingCart,
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'تواصل معنا',
      description: 'احصل على المساعدة',
      href: '/contact',
      icon: Phone,
      color: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      
      {/* Interactive Background */}
      <div className="absolute inset-0">
        {/* Floating Particles */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full animate-ping"
            style={{
              backgroundColor: Math.random() > 0.5 ? '#C09B52' : '#F59E0B',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
        
        {/* Mouse Follow Effect */}
        <div
          className="absolute w-96 h-96 bg-[#C09B52]/10 rounded-full blur-3xl pointer-events-none transition-all duration-1000"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
          }}
        />
      </div>

      <div className="container mx-auto px-8 py-12 relative z-10">
        <div className="text-center">
          
          {/* 404 Animation */}
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative inline-block mb-8">
              <h1 className="text-9xl lg:text-[12rem] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#C09B52] to-amber-400 leading-none">
                404
              </h1>
              
              {/* Glowing Effect */}
              <div className="absolute inset-0 text-9xl lg:text-[12rem] font-bold text-[#C09B52]/20 blur-2xl leading-none">
                404
              </div>
              
              {/* Floating Elements */}
              <div className="absolute top-1/4 -right-8 w-4 h-4 bg-[#C09B52] rounded-full animate-bounce"></div>
              <div className="absolute top-1/2 -left-8 w-3 h-3 bg-amber-400 rounded-full animate-ping"></div>
              <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-[#C09B52] rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Main Content */}
          <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                عذراً، لا يمكن العثور على هذه الصفحة
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed mb-8">
                يبدو أن الصفحة التي تبحث عنها قد تم نقلها أو حذفها أو أن الرابط غير صحيح.
                لا تقلق، يمكنك العثور على ما تبحث عنه من خلال الروابط أدناه.
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="max-w-2xl mx-auto mb-12">
              <div className="relative">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  type="text"
                  placeholder="ابحث عن الباقات والتصاميم..."
                  className="w-full pl-6 pr-16 py-4 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-2xl backdrop-blur-sm focus:border-[#C09B52] focus:ring-2 focus:ring-[#C09B52]/20 transition-all"
                />
                <button className="absolute left-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-[#C09B52] to-amber-600 text-black font-bold rounded-xl hover:from-amber-600 hover:to-[#C09B52] transition-all duration-300">
                  بحث
                </button>
              </div>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className={`transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h3 className="text-2xl font-bold text-white mb-8">أو انتقل إلى إحدى هذه الصفحات</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
              {quickLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={index}
                    href={link.href}
                    className="group block transition-all duration-500 hover:scale-105"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Glow Effect */}
                    <div className={`absolute -inset-0.5 bg-gradient-to-r ${link.color} rounded-2xl blur opacity-0 group-hover:opacity-20 transition-all duration-500`}></div>
                    
                    {/* Card */}
                    <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 group-hover:border-white/20 p-6 h-full transition-all duration-500">
                      
                      {/* Icon */}
                      <div className="mb-4">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${link.color} p-0.5 group-hover:scale-110 transition-transform duration-500`}>
                          <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-2">
                        <h4 className="text-lg font-bold text-white group-hover:text-[#C09B52] transition-colors duration-300">
                          {link.title}
                        </h4>
                        <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300 text-sm">
                          {link.description}
                        </p>
                      </div>

                      {/* Arrow */}
                      <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#C09B52] to-amber-400 flex items-center justify-center">
                          <ArrowLeft className="w-3 h-3 text-black" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Help Section */}
          <div className={`transition-all duration-1000 delay-900 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-gradient-to-r from-[#C09B52]/10 to-amber-600/10 backdrop-blur-sm rounded-3xl p-8 border border-[#C09B52]/20 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-white mb-4">
                تحتاج مساعدة إضافية؟
              </h3>
              <p className="text-gray-300 mb-6">
                فريق الدعم متاح لمساعدتك في العثور على ما تبحث عنه
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="px-8 py-4 bg-gradient-to-r from-[#C09B52] to-amber-600 text-black font-bold rounded-xl hover:from-amber-600 hover:to-[#C09B52] transition-all duration-300 transform hover:scale-105"
                >
                  تواصل معنا
                </Link>
                <Link
                  href="/"
                  className="px-8 py-4 border border-[#C09B52] text-[#C09B52] rounded-xl font-medium hover:bg-[#C09B52] hover:text-black transition-all duration-300"
                >
                  العودة للرئيسية
                </Link>
              </div>
            </div>
          </div>

          {/* Fun Facts */}
          <div className={`transition-all duration-1000 delay-1100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-3xl font-bold text-[#C09B52] mb-2">1000+</div>
                <div className="text-gray-400 text-sm">دعوة تم إنشاؤها</div>
              </div>
              <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-3xl font-bold text-[#C09B52] mb-2">99%</div>
                <div className="text-gray-400 text-sm">رضا العملاء</div>
              </div>
              <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-3xl font-bold text-[#C09B52] mb-2">24/7</div>
                <div className="text-gray-400 text-sm">دعم فني</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Background Animations */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#C09B52]/5 to-transparent"></div>
      <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-amber-600/5 to-transparent"></div>
    </div>
  );
}