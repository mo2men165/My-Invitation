// src/app/contact/page.tsx
import { Metadata } from 'next';
import { ContactFormSection } from '@/components/contact/ContactFormSection';
import { ContactInfoSection } from '@/components/contact/ContactInfoSection';
import { FAQSection } from '@/components/contact/FAQSection';

export const metadata: Metadata = {
  title: 'اتصل بنا - INVITATION',
  description: 'تواصل مع فريق INVITATION للحصول على المساعدة والدعم. نحن هنا لمساعدتك في إنشاء دعوات إلكترونية مميزة لمناسباتك الخاصة.',
  keywords: ['تواصل', 'اتصل بنا', 'دعم فني', 'INVITATION', 'خدمة العملاء', 'مساعدة'],
  openGraph: {
    title: 'اتصل بنا - INVITATION',
    description: 'تواصل مع فريق INVITATION للحصول على المساعدة والدعم في إنشاء دعوات إلكترونية مميزة',
    type: 'website',
    locale: 'ar_SA',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'اتصل بنا - INVITATION',
    description: 'تواصل مع فريق INVITATION للحصول على المساعدة والدعم',
  },
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-black">
      {/* Hero Section with Contact Form */}
      <div id="contact-form">
        <ContactFormSection />
      </div>
      
      {/* Contact Information Section */}
      <ContactInfoSection />
      
      {/* FAQ Section */}
      <FAQSection />
      
      {/* Additional CTA Section */}
      <section className="relative py-20 bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="container mx-auto px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              ابدأ مناسبتك المميزة اليوم
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              انضم إلى آلاف العملاء الذين وثقوا بنا لجعل مناسباتهم استثنائية ولا تُنسى
            </p>
            
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="text-3xl font-bold text-[#C09B52] mb-2">1000+</div>
                <div className="text-gray-400">مناسبة ناجحة</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="text-3xl font-bold text-[#C09B52] mb-2">99%</div>
                <div className="text-gray-400">رضا العملاء</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="text-3xl font-bold text-[#C09B52] mb-2">24/7</div>
                <div className="text-gray-400">دعم متواصل</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="text-3xl font-bold text-[#C09B52] mb-2">5+</div>
                <div className="text-gray-400">سنوات خبرة</div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="/register"
                className="px-8 py-4 bg-gradient-to-r from-[#C09B52] to-amber-600 text-black font-bold rounded-xl hover:from-amber-600 hover:to-[#C09B52] transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-[#C09B52]/30"
              >
                ابدأ الآن مجاناً
              </a>
              <a
                href="/packages"
                className="px-8 py-4 border border-[#C09B52] text-[#C09B52] rounded-xl font-medium hover:bg-[#C09B52] hover:text-black transition-all duration-300"
              >
                استكشف الباقات
              </a>
              <a
                href="/about"
                className="px-8 py-4 text-white hover:text-[#C09B52] transition-colors duration-300 font-medium"
              >
                تعرف علينا أكثر
              </a>
            </div>
          </div>
        </div>
        
        {/* Background Decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#C09B52]/5 rounded-full blur-3xl"></div>
        </div>
      </section>
    </main>
  );
}