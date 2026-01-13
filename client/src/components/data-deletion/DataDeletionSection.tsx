'use client';
import { useEffect, useRef } from 'react';
import { Trash2, Mail, FileText, Shield, AlertCircle, CheckCircle } from 'lucide-react';

export function DataDeletionSection() {
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
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
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
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-[#C09B52]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-8 relative z-10">
        <div className="max-w-3xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-16 fade-in-element opacity-0 transform translate-y-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C09B52] to-amber-600 flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-black" />
              </div>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              حذف <span className="text-[#C09B52]">البيانات</span>
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed">
              طلب حذف بياناتك الشخصية من منصة My Invitation
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-6 mb-12">
            
            {/* How to Request */}
            <div className="fade-in-element opacity-0 transform translate-y-8 bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-[#C09B52]/30 transition-all duration-500">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C09B52] to-amber-600 flex items-center justify-center ml-4">
                  <Mail className="w-6 h-6 text-black" />
                </div>
                <h2 className="text-2xl font-bold text-white">كيفية الطلب</h2>
              </div>
              <div className="space-y-4 text-gray-300">
                <p>لطلب حذف بياناتك الشخصية، يرجى إرسال بريد إلكتروني إلينا على:</p>
                <div className="bg-yellow-900/20 border-r-4 border-yellow-600 p-4 rounded-lg">
                  <p className="text-yellow-200 font-semibold mb-2">البريد الإلكتروني:</p>
                  <a 
                    href="mailto:customersupport@myinvitation-sa.com?subject=طلب حذف البيانات الشخصية"
                    className="text-2xl font-bold text-[#C09B52] hover:text-amber-400 transition-colors break-all"
                  >
                    customersupport@myinvitation-sa.com
                  </a>
                </div>
              </div>
            </div>

            {/* What to Include */}
            <div className="fade-in-element opacity-0 transform translate-y-8 bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-[#C09B52]/30 transition-all duration-500" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C09B52] to-amber-600 flex items-center justify-center ml-4">
                  <FileText className="w-6 h-6 text-black" />
                </div>
                <h2 className="text-2xl font-bold text-white">ما يجب تضمينه في الطلب</h2>
              </div>
              <ul className="space-y-3 text-gray-300 mr-6">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#C09B52] ml-3 mt-1 flex-shrink-0" />
                  <span>عنوان البريد الإلكتروني المرتبط بالحساب</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#C09B52] ml-3 mt-1 flex-shrink-0" />
                  <span>الاسم الكامل كما هو مسجل في الحساب</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#C09B52] ml-3 mt-1 flex-shrink-0" />
                  <span>رقم الهاتف المرتبط بالحساب</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#C09B52] ml-3 mt-1 flex-shrink-0" />
                  <span>السبب للطلب حذف البيانات (اختياري)</span>
                </li>
              </ul>
            </div>

            {/* What Gets Deleted */}
            <div className="fade-in-element opacity-0 transform translate-y-8 bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-[#C09B52]/30 transition-all duration-500" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C09B52] to-amber-600 flex items-center justify-center ml-4">
                  <Shield className="w-6 h-6 text-black" />
                </div>
                <h2 className="text-2xl font-bold text-white">البيانات المحذوفة</h2>
              </div>
              <div className="space-y-3 text-gray-300">
                <p>بعد التحقق من هويتك، سيتم حذف جميع البيانات التالية:</p>
                <div className="grid md:grid-cols-2 gap-3 mr-6">
                  <div className="flex items-center space-x-reverse">
                    <CheckCircle className="w-4 h-4 text-[#C09B52] ml-2 flex-shrink-0" />
                    <span>معلومات الحساب</span>
                  </div>
                  <div className="flex items-center space-x-reverse">
                    <CheckCircle className="w-4 h-4 text-[#C09B52] ml-2 flex-shrink-0" />
                    <span>بيانات المناسبات</span>
                  </div>
                  <div className="flex items-center space-x-reverse">
                    <CheckCircle className="w-4 h-4 text-[#C09B52] ml-2 flex-shrink-0" />
                    <span>قوائم الضيوف</span>
                  </div>
                  <div className="flex items-center space-x-reverse">
                    <CheckCircle className="w-4 h-4 text-[#C09B52] ml-2 flex-shrink-0" />
                    <span>سجلات المعاملات</span>
                  </div>
                  <div className="flex items-center space-x-reverse">
                    <CheckCircle className="w-4 h-4 text-[#C09B52] ml-2 flex-shrink-0" />
                    <span>الرسائل والتذكيرات</span>
                  </div>
                  <div className="flex items-center space-x-reverse">
                    <CheckCircle className="w-4 h-4 text-[#C09B52] ml-2 flex-shrink-0" />
                    <span>التفضيلات والإعدادات</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="fade-in-element opacity-0 transform translate-y-8 bg-red-900/20 border-r-4 border-red-600 p-6 rounded-xl" style={{ animationDelay: '0.6s' }}>
              <div className="flex items-center mb-3">
                <AlertCircle className="w-6 h-6 text-red-400 ml-3" />
                <h3 className="text-xl font-semibold text-red-300">تنبيهات مهمة</h3>
              </div>
              <ul className="space-y-2 text-red-200 mr-6">
                <li className="flex items-start">
                  <span className="ml-2">•</span>
                  <span>سيتم الاحتفاظ ببيانات المعاملات المالية لمدة 7 سنوات كما يتطلب القانون السعودي</span>
                </li>
                <li className="flex items-start">
                  <span className="ml-2">•</span>
                  <span>عملية الحذف نهائية ولا يمكن التراجع عنها</span>
                </li>
                <li className="flex items-start">
                  <span className="ml-2">•</span>
                  <span>مدة المعالجة: 30 يوماً من تاريخ التحقق من هويتك</span>
                </li>
              </ul>
            </div>

            {/* Alternative Contact */}
            <div className="fade-in-element opacity-0 transform translate-y-8 bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10" style={{ animationDelay: '0.8s' }}>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C09B52] to-amber-600 flex items-center justify-center ml-4">
                  <Mail className="w-6 h-6 text-black" />
                </div>
                <h2 className="text-2xl font-bold text-white">هاتفياً</h2>
              </div>
              <p className="text-gray-300 mb-4">يمكنك أيضاً التواصل معنا عبر الهاتف:</p>
              <a 
                href="tel:+966592706600"
                className="text-2xl font-bold text-[#C09B52] hover:text-amber-400 transition-colors inline-block"
                dir="ltr"
              >
                +966 59 270 6600
              </a>
            </div>

          </div>

          {/* Footer Note */}
          <div className="fade-in-element opacity-0 transform translate-y-8 text-center bg-gradient-to-r from-[#C09B52]/10 to-amber-600/10 backdrop-blur-sm rounded-2xl p-8 border border-[#C09B52]/20" style={{ animationDelay: '1s' }}>
            <p className="text-gray-300 leading-relaxed">
              نحن ملتزمون بحماية خصوصيتك وإتاحة حقك في حذف بياناتك الشخصية
            </p>
            <p className="text-sm text-gray-400 mt-3">
              للاطلاع على سياسة الخصوصية الكاملة، يرجى زيارة 
              <a href="/privacy" className="text-[#C09B52] hover:text-amber-400 mr-1 ml-1">
                صفحة سياسة الخصوصية
              </a>
            </p>
          </div>

        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(2rem); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
      `}</style>
    </section>
  );
}

