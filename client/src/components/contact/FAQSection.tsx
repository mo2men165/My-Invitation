// components/contact/FAQSection.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { ChevronDown, HelpCircle, Lightbulb, Shield, Smartphone } from 'lucide-react';

export function FAQSection() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
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

  const faqs = [
    {
      question: 'ما هي خدمة الدعوات الإلكترونية بباركود؟',
      answer: 'خدمة الدعوات الإلكترونية بباركود هي تقنية حديثة تتيح إنشاء بطاقات دعوة رقمية مميزة مع رمز استجابة سريع (QR Code) فريد لكل ضيف. هذا الباركود يضمن الأمان ومنع التكرار، ويسهل عملية التحقق من صحة الدعوة عند الدخول للمناسبة.',
      icon: HelpCircle,
      category: 'عام'
    },
    {
      question: 'كيف يمكنني إنشاء دعوة لمناسبتي؟',
      answer: 'يمكنك إنشاء دعوة مناسبتك بخطوات بسيطة: 1) سجل حساب جديد أو ادخل لحسابك الحالي 2) اختر نوع المناسبة والتصميم المناسب 3) أدخل تفاصيل المناسبة والضيوف 4) اختر الباقة المناسبة 5) احصل على الدعوات جاهزة للإرسال مع أكواد QR فريدة.',
      icon: Lightbulb,
      category: 'الاستخدام'
    },
    {
      question: 'هل الدعوات آمنة ومحمية من التكرار؟',
      answer: 'نعم، بالتأكيد. كل دعوة تحتوي على باركود فريد وآمن لا يمكن تكراره أو تزويره. نستخدم تقنيات التشفير المتقدمة لضمان أمان البيانات. كما يمكن تتبع حالة كل دعوة ومعرفة ما إذا تم استخدامها أم لا، مما يمنع الدخول غير المصرح به.',
      icon: Shield,
      category: 'الأمان'
    },
    {
      question: 'هل يمكنني تخصيص تصميم الدعوة؟',
      answer: 'نعم، نوفر مكتبة واسعة من التصاميم الجاهزة والقابلة للتخصيص. يمكنك اختيار الألوان والخطوط والخلفيات التي تناسب طبيعة مناسبتك. كما يمكنك إضافة شعارك الخاص والنصوص المخصصة وحتى الصور الشخصية لجعل الدعوة فريدة ومميزة.',
      icon: Smartphone,
      category: 'التصميم'
    },
    {
      question: 'كيف يتم إرسال الدعوات للضيوف؟',
      answer: 'يمكنك إرسال الدعوات بعدة طرق سهلة ومريحة: عبر الواتساب مباشرة، البريد الإلكتروني، الرسائل النصية، أو مشاركتها على وسائل التواصل الاجتماعي. كل دعوة تحتوي على رابط مباشر يمكن للضيف فتحه على هاتفه لعرض التفاصيل وحفظ الدعوة.',
      icon: HelpCircle,
      category: 'الإرسال'
    },
    {
      question: 'ماذا لو اعتذر أحد الضيوف؟',
      answer: 'إذا اعتذر أحد الضيوف، يمكنك بسهولة إلغاء دعوته وإرسال نفس الدعوة لضيف آخر دون أي تكلفة إضافية. هذا يضمن عدم إهدار عدد الدعوات المدفوعة ويتيح لك المرونة الكاملة في إدارة قائمة الضيوف حتى اللحظة الأخيرة.',
      icon: Lightbulb,
      category: 'الإدارة'
    },
    {
      question: 'هل توفرون فيديوهات دعوة مخصصة؟',
      answer: 'نعم، نقدم خدمة إنشاء فيديوهات دعوة مخصصة وجذابة تحتوي على تفاصيل مناسبتك ومعلومات شخصية. هذه الفيديوهات تضيف لمسة شخصية مميزة لدعوتك وتترك انطباعاً رائعاً لدى الضيوف. يمكن مشاركة الفيديو مع بطاقة الدعوة الإلكترونية.',
      icon: Smartphone,
      category: 'الخدمات'
    },
    {
      question: 'ما هي تكلفة الخدمة؟',
      answer: 'نقدم باقات متنوعة تناسب جميع الميزانيات والاحتياجات. تبدأ الأسعار من باقات اقتصادية للمناسبات الصغيرة وصولاً إلى باقات مميزة للفعاليات الكبرى. جميع الباقات تشمل التصاميم الأساسية والدعم الفني. يمكنك مراجعة صفحة الباقات للتفاصيل الكاملة.',
      icon: HelpCircle,
      category: 'التسعير'
    }
  ];

  const categories = ['الكل', ...Array.from(new Set(faqs.map(faq => faq.category)))];
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  const filteredFAQs = selectedCategory === 'الكل' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <section ref={sectionRef} className="relative py-24 bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0">
        {/* Animated gradient meshes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#C09B52]/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-amber-600/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full animate-ping"
            style={{
              backgroundColor: '#C09B52',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="fade-in-element opacity-0 transform translate-y-8">
            <div className="inline-flex items-center space-x-3  mb-6">
              <div className="h-px bg-gradient-to-r from-transparent via-[#C09B52] to-transparent w-16"></div>
              <span className="text-[#C09B52] font-bold tracking-wider uppercase text-sm px-4 py-2 bg-[#C09B52]/10 rounded-full border border-[#C09B52]/20">
                الأسئلة الشائعة
              </span>
              <div className="h-px bg-gradient-to-r from-transparent via-[#C09B52] to-transparent w-16"></div>
            </div>
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              أجوبة على <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C09B52] to-amber-400">استفساراتك</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              نجيب على الأسئلة الأكثر شيوعاً حول خدماتنا لمساعدتك في فهم كيفية عمل منصتنا
            </p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="fade-in-element opacity-0 transform translate-y-8 mb-12" style={{ animationDelay: '0.2s' }}>
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-[#C09B52] to-amber-600 text-black shadow-lg'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white border border-white/20'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ List */}
        <div className="max-w-4xl mx-auto space-y-4">
          {filteredFAQs.map((faq, index) => {
            const Icon = faq.icon;
            const isOpen = openFAQ === index;
            
            return (
              <div
                key={index}
                className="fade-in-element opacity-0 transform translate-y-8"
                style={{ animationDelay: `${0.3 + index * 0.1}s` }}
              >
                <div className="group relative">
                  {/* Glow effect */}
                  <div className={`absolute -inset-0.5 bg-gradient-to-r from-[#C09B52] to-amber-600 rounded-2xl blur opacity-0 transition-all duration-500 ${isOpen ? 'opacity-20' : 'group-hover:opacity-10'}`}></div>
                  
                  {/* FAQ Card */}
                  <div className={`relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl border transition-all duration-500 overflow-hidden ${
                    isOpen 
                      ? 'border-[#C09B52]/30 shadow-lg shadow-[#C09B52]/10' 
                      : 'border-white/10 hover:border-white/20'
                  }`}>
                    
                    {/* Question */}
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="w-full p-6 text-right flex items-center justify-between group-hover:bg-white/5 transition-all duration-300"
                    >
                      <div className="flex items-center space-x-4  flex-1">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-[#C09B52] to-amber-600 flex items-center justify-center transition-transform duration-300 ${isOpen ? 'scale-110' : ''}`}>
                          <Icon className="w-6 h-6 text-black" />
                        </div>
                        <h3 className={`text-lg font-bold transition-colors duration-300 ${isOpen ? 'text-[#C09B52]' : 'text-white group-hover:text-[#C09B52]'}`}>
                          {faq.question}
                        </h3>
                      </div>
                      
                      <ChevronDown className={`w-6 h-6 text-gray-400 transition-all duration-300 ${isOpen ? 'rotate-180 text-[#C09B52]' : 'group-hover:text-white'}`} />
                    </button>

                    {/* Answer */}
                    <div className={`overflow-hidden transition-all duration-500 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                      <div className="px-6 pb-6">
                        <div className="flex items-start space-x-4 ">
                          <div className="w-12 flex-shrink-0"></div>
                          <p className="text-gray-300 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Category Badge */}
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-[#C09B52]/20 text-[#C09B52] text-xs font-medium rounded-full border border-[#C09B52]/30">
                        {faq.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact CTA */}
        <div className="fade-in-element opacity-0 transform translate-y-8 text-center mt-16" style={{ animationDelay: '0.8s' }}>
          <div className="bg-gradient-to-r from-[#C09B52]/10 to-amber-600/10 backdrop-blur-sm rounded-2xl p-8 border border-[#C09B52]/20 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              لم تجد إجابة لسؤالك؟
            </h3>
            <p className="text-gray-300 mb-6">
              فريق الدعم جاهز لمساعدتك في أي وقت
            </p>
            <a
              href="#contact-form"
              className="inline-flex items-center space-x-3  px-8 py-4 bg-gradient-to-r from-[#C09B52] to-amber-600 text-black font-bold rounded-xl hover:from-amber-600 hover:to-[#C09B52] transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-[#C09B52]/30"
            >
              <HelpCircle className="w-5 h-5" />
              <span>تواصل معنا</span>
            </a>
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