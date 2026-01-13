import AccountSettingsPage from '@/components/account/AccountSettingsPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function Page() {
  return (
    <ProtectedRoute requireAuth>
        <AccountSettingsPage />
    </ProtectedRoute>
  )
}

export const metadata = {
  title: 'إعدادات الحساب - My Invitation',
  description: 'إدارة معلومات حسابك الشخصي وإعدادات الأمان',
};
