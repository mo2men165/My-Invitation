import { Metadata } from 'next';
import { TermsSection } from '@/components/terms/TermsSection';

export const metadata: Metadata = {
  title: 'شروط الاستخدام - INVITATION',
  description: 'شروط وأحكام استخدام منصة INVITATION. تعرف على حقوقك والتزاماتك عند استخدام خدماتنا.',
  keywords: ['شروط الاستخدام', 'أحكام الاستخدام', 'INVITATION', 'الشروط والأحكام'],
  openGraph: {
    title: 'شروط الاستخدام - INVITATION',
    description: 'شروط وأحكام استخدام منصة INVITATION',
    type: 'website',
    locale: 'ar_SA',
  },
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black">
      <TermsSection />
    </main>
  );
}

