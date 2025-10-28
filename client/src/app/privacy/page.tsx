import { Metadata } from 'next';
import { PrivacyPolicySection } from '@/components/privacy/PrivacyPolicySection';

export const metadata: Metadata = {
  title: 'سياسة الخصوصية - INVITATION',
  description: 'تعرف على كيفية حماية منصة INVITATION لخصوصيتك ومعلوماتك الشخصية. اطلع على سياسة الخصوصية الشاملة الخاصة بنا.',
  keywords: ['سياسة الخصوصية', 'حماية البيانات', 'INVITATION', 'الأمان', 'الخصوصية', 'حماية المعلومات'],
  openGraph: {
    title: 'سياسة الخصوصية - INVITATION',
    description: 'حماية خصوصيتك وأمان معلوماتك الشخصية',
    type: 'website',
    locale: 'ar_SA',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'سياسة الخصوصية - INVITATION',
    description: 'حماية خصوصيتك وأمان معلوماتك الشخصية',
  },
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black">
      <PrivacyPolicySection />
    </main>
  );
}

