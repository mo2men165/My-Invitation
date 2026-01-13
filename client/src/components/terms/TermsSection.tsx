'use client';
import { useEffect, useRef, useState } from 'react';
import { FileText, CheckCircle, Ban, AlertCircle, Info } from 'lucide-react';

export function TermsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

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

  const sections = [
    {
      id: 'general',
      title: 'الشروط والأحكام',
      icon: CheckCircle,
      content: (
        <div className="space-y-3">
          <p className="text-gray-300 leading-relaxed">
            يلتزم المستخدم بتقديم معلومات صحيحة ومحدثة.
          </p>
          <p className="text-gray-300 leading-relaxed">
            يتحمل المستخدم مسؤولية الحفاظ على سرية بيانات حسابه.
          </p>
          <p className="text-gray-300 leading-relaxed">
            يحق للمنصة تعليق أو إلغاء الحساب في حال إساءة الاستخدام أو مخالفة الشروط.
          </p>
        </div>
      )
    },
    {
      id: 'booking',
      title: 'تأكيد الحجز',
      icon: Info,
      content: (
        <div className="space-y-3">
          <p className="text-gray-300 leading-relaxed">
            يتم تأكيد الحجز بعد إتمام عملية الدفع بنجاح.
          </p>
        </div>
      )
    },
    {
      id: 'cancellation',
      title: 'سياسة الإلغاء والاسترجاع',
      icon: AlertCircle,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-gray-300 font-semibold">في حال إلغاء المناسبة أو الفعالية من قبل العميل:</p>
            <ul className="list-disc mr-6 space-y-2 text-gray-300">
              <li>
                <strong>بعد 48 ساعة من إتمام الطلب والشراء:</strong> يتم إرجاع 50% من تكلفة المناسبة المدفوعة.
              </li>
              <li>
                <strong>وحتى 96 ساعة من إتمام الطلب والشراء:</strong> يتم إرجاع 25% من تكلفة المناسبة المدفوعة.
              </li>
              <li>
                <strong>بعد مضي 96 ساعة من إتمام الطلب والشراء:</strong> لا يتم إرجاع أي مبلغ من تكلفة المناسبة المدفوعة.
              </li>
            </ul>
          </div>
          <p className="text-gray-300 leading-relaxed">
            المنصة غير مسؤولة عن أي خسائر أو أضرار ناتجة عن إلغاء أو تأجيل المناسبة أو الفعالية سوى حدود نسبة الاسترجاع المذكورة.
          </p>
        </div>
      )
    },
    {
      id: 'technical',
      title: 'المسؤولية التقنية',
      icon: AlertCircle,
      content: (
        <div className="space-y-3">
          <p className="text-gray-300 leading-relaxed">
            لا تتحمل المنصة مسؤولية أي أعطال تقنية خارجة عن السيطرة المعقولة.
          </p>
        </div>
      )
    },
    {
      id: 'intellectual',
      title: 'الملكية الفكرية',
      icon: FileText,
      content: (
        <div className="space-y-3">
          <p className="text-gray-300 leading-relaxed">
            جميع المحتويات والعلامات التجارية والتصاميم على المنصة مملوكة لها أو مرخصة، ولا يجوز استخدامها دون إذن مسبق.
          </p>
        </div>
      )
    },
    {
      id: 'privacy',
      title: 'الخصوصية',
      icon: CheckCircle,
      content: (
        <div className="space-y-3">
          <p className="text-gray-300 leading-relaxed">
            يتم التعامل مع بيانات المستخدمين وفق سياسة الخصوصية المعتمدة، ولن يتم مشاركة البيانات مع أطراف ثالثة إلا بما يقتضيه القانون أو تقديم الخدمة.
          </p>
        </div>
      )
    }
  ];

  return (
    <section ref={sectionRef} className="relative py-24 bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
      <div className="absolute inset-0">
        {[...Array(10)].map((_, i) => (
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
        <div className="text-center mb-16 fade-in-element opacity-0 transform translate-y-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C09B52] to-amber-600 flex items-center justify-center">
              <FileText className="w-8 h-8 text-black" />
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            شروط <span className="text-[#C09B52]">الاستخدام</span>
          </h1>
          <p className="text-xl text-gray-300">
            الشروط والأحكام الخاصة باستخدام منصة My Invitation
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {sections.map((section, index) => {
            const Icon = section.icon;
            const isExpanded = activeSection === section.id;

            return (
              <div
                key={section.id}
                className="fade-in-element opacity-0 transform translate-y-8 mb-6"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-[#C09B52]/30 transition-all duration-500 group">
                  <button
                    onClick={() => setActiveSection(isExpanded ? null : section.id)}
                    className="w-full flex items-center justify-between p-6 text-right"
                  >
                    <div className="flex items-center space-x-reverse flex-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C09B52] to-amber-600 flex items-center justify-center flex-shrink-0 ml-4">
                        <Icon className="w-5 h-5 text-black" />
                      </div>
                      <h3 className="text-xl font-semibold text-white group-hover:text-[#C09B52] transition-colors duration-300">
                        {section.title}
                      </h3>
                    </div>
                    <svg
                      className={`w-6 h-6 text-[#C09B52] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-white/10">
                      <div className="pt-6 animate-fade-in">
                        {section.content}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center fade-in-element opacity-0 transform translate-y-8" style={{ animationDelay: '0.7s' }}>
          <div className="bg-gradient-to-r from-[#C09B52]/10 to-amber-600/10 backdrop-blur-sm rounded-2xl p-8 border border-[#C09B52]/20">
            <p className="text-gray-300 leading-relaxed">
              آخر تحديث: 1 يناير 2025 | للاستفسارات: customersupport@myinvitation-sa.com
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
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </section>
  );
}

