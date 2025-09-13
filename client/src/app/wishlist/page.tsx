import { InstantRouteGuard } from "@/components/auth/InstantRouteGuard";
import WishlistPage from "@/components/wishlist/WishlistPage";

export default function Page() {
  return (
    <InstantRouteGuard allowedRoles={['user']}>
      <WishlistPage />
    </InstantRouteGuard>
  )
}

export const metadata = {
  title: 'قائمة المفضلة - My Invitation',
  description: 'اطلع على قائمة التصاميم والباقات المحفوظة في المفضلة',
};
