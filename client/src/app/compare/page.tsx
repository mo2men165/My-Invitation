import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import ComparePage from "@/components/compare/ComparePage";

export default function Page() {
  return (
    <ProtectedRoute requireAuth>
      <ComparePage />
    </ProtectedRoute>
  )
}

export const metadata = {
  title: 'مقارنة التصاميم - My Invitation',
  description: 'قارن بين التصاميم المختلفة لاختيار الأنسب لمناسبتك',
};
