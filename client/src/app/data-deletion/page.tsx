import { Metadata } from 'next';
import { DataDeletionSection } from '@/components/data-deletion/DataDeletionSection';

export const metadata: Metadata = {
  title: 'حذف البيانات - INVITATION',
  description: 'تعليمات وطلب حذف بياناتك الشخصية من منصة INVITATION. اتبع الخطوات البسيطة لطلب حذف حسابك وبياناتك.',
  keywords: ['حذف البيانات', 'حذف الحساب', 'INVITATION', 'حذف البيانات الشخصية'],
  openGraph: {
    title: 'حذف البيانات - INVITATION',
    description: 'طلب حذف بياناتك الشخصية من منصة INVITATION',
    type: 'website',
    locale: 'ar_SA',
  },
  alternates: {
    canonical: '/data-deletion',
  },
};

export default function DataDeletionPage() {
  return (
    <main className="min-h-screen bg-black">
      <DataDeletionSection />
    </main>
  );
}

