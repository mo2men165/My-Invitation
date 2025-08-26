import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import WishlistPage from "@/components/wishlist/WishlistPage";

export default function Page() {
  return (
    <ProtectedRoute requireAuth>
      <WishlistPage />
    </ProtectedRoute>
  )
}

export const metadata = {
  title: 'قائمة المفضلة - My Invitation',
  description: 'اطلع على قائمة التصاميم والباقات المحفوظة في المفضلة',
};
