// src/app/layout.tsx - Updated root layout
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { StoreProvider } from '@/store/StoreProvider';
import { AuthProvider } from '@/components/auth/AuthProvider';
import './globals.css';
import { ConditionalLayout } from '@/components/layout/ConditionalLayout';
import { AdminRouteBlocker } from '@/components/auth/AdminRouteBlocker';
import { UserToAdminBlocker } from '@/components/auth/UserToAdminBlocker';
import { Toaster } from '@/components/ui/Toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'My Invitation - منصة الدعوات الرقمية',
  description: 'منصة متقدمة لإنشاء وإدارة الدعوات الرقمية المميزة',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={inter.className}>
        <StoreProvider>
          <AuthProvider>
            <AdminRouteBlocker>
              <UserToAdminBlocker>
                <ConditionalLayout>
                  {children}
                </ConditionalLayout>
              </UserToAdminBlocker>
            </AdminRouteBlocker>
            <Toaster />
          </AuthProvider>
        </StoreProvider>
      </body>
    </html>
  );
}