// app/packages/page.tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import PackagesPage from '@/components/packages/PackagesPage';

export default function Page() {
  return (
    <ProtectedRoute requireAuth redirectTo='/register'>
      <PackagesPage />
    </ProtectedRoute>
  )
}