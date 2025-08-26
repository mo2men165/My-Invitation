// src/app/about/page.tsx
import { AboutUsSection } from '@/components/about/AboutUs';
import { ServicesSection } from '@/components/about/ServicesSection';
import { WhyChooseUsSection } from '@/components/about/WhyChooseUs';
import { CTA } from '@/components/Home/CTA';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'تعرف علينا - INVITATION',
  description: 'تعرف على INVITATION - أول شركة سعودية للمناسبات والفعاليات باستخدام الذكاء الصناعي. نقدم حلول دعوات إلكترونية مبتكرة وخدمات إدارة فعاليات متطورة.',
  keywords: ['INVITATION', 'دعوات إلكترونية', 'مناسبات', 'فعاليات', 'باركود', 'الذكاء الصناعي', 'السعودية'],
  openGraph: {
    title: 'تعرف علينا - INVITATION',
    description: 'أول شركة سعودية للمناسبات والفعاليات باستخدام الذكاء الصناعي',
    type: 'website',
    locale: 'ar_SA',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'تعرف علينا - INVITATION',
    description: 'أول شركة سعودية للمناسبات والفعاليات باستخدام الذكاء الصناعي',
  },
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black">
      
      <AboutUsSection />
      <ServicesSection />
      <WhyChooseUsSection />
      <CTA />
     
    </main>
  );
}