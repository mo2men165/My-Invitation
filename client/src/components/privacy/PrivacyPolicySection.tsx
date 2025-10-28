'use client';
import { useEffect, useRef, useState } from 'react';
import { Shield, Lock, UserCheck, Database, Eye, FileText, Clock, Mail, Phone } from 'lucide-react';

export function PrivacyPolicySection() {
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
      id: 'introduction',
      title: 'مقدمة',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300 leading-relaxed">
            في منصة My Invitation، نحن ملتزمون بحماية خصوصيتك والأمان الكامل لمعلوماتك الشخصية. تشرح هذه السياسة كيفية جمع واستخدام وحماية المعلومات التي تشاركها معنا.
          </p>
          <p className="text-gray-300 leading-relaxed">
            باستخدامك لمنصتنا، فإنك تقر بموافقتك على ممارسات جمع واستخدام المعلومات المذكورة في هذه السياسة.
          </p>
        </div>
      )
    },
    {
      id: 'data-collection',
      title: 'المعلومات التي نجمعها',
      icon: Database,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="text-lg font-semibold text-[#C09B52] mb-3">المعلومات الشخصية:</h4>
            <ul className="list-disc mr-6 space-y-2 text-gray-300">
              <li>الاسم الكامل والعنوان</li>
              <li>البريد الإلكتروني</li>
              <li>رقم الهاتف</li>
              <li>بيانات الدفع والفوترة</li>
              <li>بيانات الحساب وتاريخ التسجيل</li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-[#C09B52] mb-3">معلومات الحدث:</h4>
            <ul className="list-disc mr-6 space-y-2 text-gray-300">
              <li>نوع المناسبة (زفاف، تخرج، عيد ميلاد، إلخ)</li>
              <li>تفاصيل الحدث (التاريخ، الموقع، الوقت)</li>
              <li>الصور والتصاميم المخصصة</li>
              <li>قائمة الضيوف وأرقام هواتفهم</li>
              <li>ملاحظات وتفضيلات خاصة</li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-[#C09B52] mb-3">معلومات الأمان والتكنولوجيا:</h4>
            <ul className="list-disc mr-6 space-y-2 text-gray-300">
              <li>عنوان IP وعنوان MAC</li>
              <li>نوع المتصفح ونظام التشغيل</li>
              <li>بيانات الوصول وسجلات النشاط</li>
              <li>ملفات تعريف الارتباط (Cookies)</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'data-usage',
      title: 'كيف نستخدم معلوماتك',
      icon: Eye,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300 leading-relaxed">
            نستخدم المعلومات التي نجمعها للأغراض التالية:
          </p>
          <ul className="list-disc mr-6 space-y-2 text-gray-300">
            <li>توفير خدمات الدعوات الرقمية وإدارة الأحداث</li>
            <li>معالجة المدفوعات والتحقق من المعاملات</li>
            <li>إرسال التذكيرات والرسائل الخاصة بالحدث</li>
            <li>تقديم الدعم الفني والرد على استفساراتك</li>
            <li>تحسين خدماتنا وتجربة المستخدم</li>
            <li>الامتثال للقوانين والأنظمة المعمول بها في المملكة العربية السعودية</li>
            <li>منع الاحتيال وحماية أمن المنصة</li>
          </ul>
        </div>
      )
    },
    {
      id: 'data-security',
      title: 'الأمان وحماية البيانات',
      icon: Shield,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300 leading-relaxed">
            نطبق تدابير أمنية صارمة لحماية معلوماتك الشخصية:
          </p>
          <ul className="list-disc mr-6 space-y-2 text-gray-300">
            <li>التشفير المتقدم لجميع البيانات الحساسة باستخدام تقنيات SSL/TLS</li>
            <li>التشفير التلقائي للكلمات السرية ومعلومات الدفع</li>
            <li>الجدران النارية وأنظمة الحماية من الاختراق</li>
            <li>النسخ الاحتياطي الآمن والدوري للبيانات</li>
            <li>مراقبة مستمرة لعدم الوصول غير المصرح به</li>
            <li>تدريب موظفينا على أفضل ممارسات الأمان</li>
            <li>التوافق مع معايير أمان البيانات الدولية</li>
          </ul>
        </div>
      )
    },
    {
      id: 'data-sharing',
      title: 'مشاركة المعلومات',
      icon: UserCheck,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300 leading-relaxed">
            نحن لا نبيع معلوماتك الشخصية لأي جهة خارجية. قد نشارك معلوماتك فقط في الحالات التالية:
          </p>
          <ul className="list-disc mr-6 space-y-2 text-gray-300">
            <li>مع مزودي الخدمة الموثوقين (معالجات الدفع، خدمات البريد الإلكتروني، خدمات الاستضافة)</li>
            <li>عند وجود التزام قانوني أو استجابة لطلب من السلطات</li>
            <li>لحماية حقوقنا ومستخدمينا من الاحتيال أو سوء الاستخدام</li>
            <li>في حالة نقل الأعمال أو الاندماج (مع ضمان حماية البيانات)</li>
          </ul>
          <div className="bg-yellow-900/20 border-r-4 border-yellow-600 p-4 rounded-lg">
            <p className="text-yellow-200 text-sm">
              <strong>ملاحظة مهمة:</strong> جميع المزودين الذين نتعامل معهم ملزمون بسياسات الخصوصية المشددة وعدم استخدام معلوماتك لأغراض أخرى.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'data-retention',
      title: 'الاحتفاظ بالبيانات',
      icon: Clock,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300 leading-relaxed">
            نحتفظ بمعلوماتك الشخصية طالما كان ذلك ضرورياً لتقديم خدماتنا أو حسب المتطلبات القانونية:
          </p>
          <ul className="list-disc mr-6 space-y-2 text-gray-300">
            <li>بيانات الحساب: لمدة عامين بعد آخر نشاط</li>
            <li>بيانات المعاملات: لمدة 7 سنوات حسب متطلبات المملكة</li>
            <li>بيانات الأحداث: للمدة المحددة من قبل العميل أو حسب الحاجة</li>
            <li>سجلات الأمان: لمدة سنتين</li>
          </ul>
          <p className="text-gray-300 leading-relaxed">
            عند حذف معلوماتك، نقوم بذلك بشكل آمن ولا رجعة فيه باستخدام أدوات محو البيانات المتقدمة.
          </p>
        </div>
      )
    },
    {
      id: 'user-rights',
      title: 'حقوقك',
      icon: Lock,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300 leading-relaxed">
            كصاحب بيانات، لديك الحقوق التالية:
          </p>
          <ul className="list-disc mr-6 space-y-2 text-gray-300">
            <li><strong>الحق في المعرفة:</strong> معرفة ما إذا كنا نحتفظ بمعلوماتك</li>
            <li><strong>الحق في الوصول:</strong> طلب نسخة من معلوماتك الشخصية</li>
            <li><strong>الحق في التصحيح:</strong> تحديث أو تصحيح معلوماتك</li>
            <li><strong>الحق في الحذف:</strong> طلب حذف معلوماتك وفقاً للأنظمة</li>
            <li><strong>الحق في الاعتراض:</strong> الاعتراض على استخدام معلوماتك لأغراض تسويقية</li>
            <li><strong>الحق في تقييد المعالجة:</strong> طلب تقييد كيفية استخدام معلوماتك</li>
            <li><strong>الحق في التنقل:</strong> نقل معلوماتك إلى خدمة أخرى</li>
          </ul>
          <p className="text-gray-300 leading-relaxed">
            لممارسة هذه الحقوق، يرجى التواصل معنا عبر البريد الإلكتروني أو الهاتف المذكورين أدناه.
          </p>
        </div>
      )
    },
    {
      id: 'cookies',
      title: '糕ف تعريف الارتباط (Cookies)',
      icon: Lock,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300 leading-relaxed">
            نستخدم ملفات تعريف الارتباط لتحسين تجربتك على المنصة:
          </p>
          <ul className="list-disc mr-6 space-y-2 text-gray-300">
            <li><strong>ملفات أساسية:</strong> ضرورية لعمل المنصة (الحسابات، السلة، إلخ)</li>
            <li><strong>ملفات أداء:</strong> لتحسين سرعة وكفاءة الموقع</li>
            <li><strong>ملفات وظيفية:</strong> لتذكر تفضيلاتك وإعداداتك</li>
            <li><strong>ملفات تحليلات:</strong> لفهم كيفية استخدام المنصة</li>
          </ul>
          <p className="text-gray-300 leading-relaxed">
            يمكنك التحكم في ملفات تعريف الارتباط من خلال إعدادات متصفحك، ولكن قد يؤثر ذلك على وظائف المنصة.
          </p>
        </div>
      )
    },
    {
      id: 'third-party',
      title: 'خدمات الطرف الثالث',
      icon: Database,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300 leading-relaxed">
            نستخدم خدمات موثوقة من طرف ثالث لدعم تشغيل المنصة:
          </p>
          <ul className="list-disc mr-6 space-y-2 text-gray-300">
            <li><strong>معال developers الدفع:</strong> لمعالجة المعاملات المالية بشكل آمن</li>
            <li><strong>خدمات البريد الإلكتروني:</strong> لإرسال الرسائل والتحديثات</li>
            <li><strong>خدمات الاستضافة والحوسبة السحابية:</strong> لتخزين البيانات</li>
            <li><strong>خدمات الخرائط:</strong> لعرض مواقع الأحداث</li>
            <li><strong>أدوات التحليلات:</strong> لتحسين خدماتنا</li>
          </ul>
          <p className="text-gray-300 leading-relaxed">
            هذه الخدمات قد تجمع معلوماتك وفقاً لسياسات خصوصيتها الخاصة. نوصي بمراجعة سياسات الخصوصية الخاصة بهم.
          </p>
        </div>
      )
    },
    {
      id: 'children-privacy',
      title: 'خصوصية الأطفال',
      icon: Shield,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300 leading-relaxed">
            منصتنا غير مخصصة للأشخاص دون سن 18 عاماً. نحن لا نجمع معلومات شخصية عن الأطفال.
          </p>
          <p className="text-gray-300 leading-relaxed">
            إذا علمنا بأننا جمعنا معلومات من طفل دون السن القانوني، سنحذف هذه المعلومات فوراً.
          </p>
          <p className="text-gray-300 leading-relaxed">
            إذا كنت والداً أو وصياً وأعتقد أن طفلك قد قدم معلومات شخصية لنا، يرجى الاتصال بنا.
          </p>
        </div>
      )
    },
    {
      id: 'changes',
      title: 'تغييرات السياسة',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300 leading-relaxed">
            قد نحدث هذه السياسة من وقت لآخر لتتماشى مع أفضل الممارسات والتغييرات القانونية.
          </p>
          <p className="text-gray-300 leading-relaxed">
            سنخطرك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار على المنصة.
          </p>
          <p className="text-gray-300 leading-relaxed">
            تاريخ آخر تحديث: 1 يناير 2025
          </p>
        </div>
      )
    },
    {
      id: 'contact',
      title: 'اتصل بنا',
      icon: Mail,
      content: (
        <div className="space-y-6">
          <p className="text-gray-300 leading-relaxed">
            لأي أسئلة أو مخاوف تتعلق بسياسة الخصوصية أو ممارستك لحقوقك، يمكنك التواصل معنا:
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-[#C09B52]/30 transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C09B52] to-amber-600 flex items-center justify-center mr-4">
                  <Mail className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h5 className="text-lg font-semibold text-white">البريد الإلكتروني</h5>
                  <p className="text-sm text-gray-400">للتواصل والاستفسارات</p>
                </div>
              </div>
              <a 
                href="mailto:customersupport@myinvitation-sa.com"
                className="text-[#C09B52] hover:text-amber-400 transition-colors duration-300 font-medium"
              >
                customersupport@myinvitation-sa.com
              </a>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-[#C09B52]/30 transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C09B52] to-amber-600 flex items-center justify-center mr-4">
                  <Phone className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h5 className="text-lg font-semibold text-white">الهاتف</h5>
                  <p className="text-sm text-gray-400">دعم فني متواصل</p>
                </div>
              </div>
              <a 
                href="tel:+966592706600"
                className="text-[#C09B52] hover:text-amber-400 transition-colors duration-300 font-medium"
                dir="ltr"
              >
                +966 59 270 6600
              </a>
            </div>
          </div>

          <div className="bg-blue-900/20 border-r-4 border-blue-500 p-4 rounded-lg">
            <p className="text-blue-200 text-sm">
              <strong>استجابة سريعة:</strong> نحن ملتزمون بالرد على جميع استفسارات الخصوصية في غضون 48 ساعة عمل.
            </p>
          </div>
        </div>
      )
    }
  ];

  return (
    <section ref={sectionRef} className="relative py-24 bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0">
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
        
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-[#C09B52]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 fade-in-element opacity-0 transform translate-y-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C09B52] to-amber-600 flex items-center justify-center">
              <Shield className="w-8 h-8 text-black" />
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            سياسة <span className="text-[#C09B52]">الخصوصية</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            التزامنا بحماية خصوصيتك وأمان معلوماتك الشخصية
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {sections.map((section, index) => {
            const TranslatedIcon = section.icon;
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
                        <TranslatedIcon className="w-5 h-5 text-black" />
                      </div>
                      <h3 className="text-xl font-semibold text-white group-hover:text-[#C09B52] transition-colors duration-300">
                        {section.title}
                      </h3>
                    </div>
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                      <svg
                        className={`w-6 h-6 text-[#C09B52] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
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

        {/* Footer Note */}
        <div className="mt-12 text-center fade-in-element opacity-0 transform translate-y-8" style={{ animationDelay: '1.2s' }}>
          <div className="bg-gradient-to-r from-[#C09B52]/10 to-amber-600/10 backdrop-blur-sm rounded-2xl p-8 border border-[#C09B52]/20">
            <p className="text-gray-300 leading-relaxed mb-4">
              شكراً لثقتك في منصة My Invitation. نحن ملتزمون بحماية خصوصيتك وتقديم تجربة آمنة ومميزة.
            </p>
            <p className="text-sm text-gray-400">
              © 2025 My Invitation. جميع الحقوق محفوظة.
            </p>
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
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </section>
  );
}

