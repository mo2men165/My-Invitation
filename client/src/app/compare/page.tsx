import { InstantRouteGuard } from "@/components/auth/InstantRouteGuard";
import ComparePage from "@/components/compare/ComparePage";
import { ComparePageSkeleton } from "@/components/ui/SkeletonLoader";

export default function Page() {
  return (
    <InstantRouteGuard 
      allowedRoles={['user']}
      fallback={<ComparePageSkeleton />}
    >
      <ComparePage />
    </InstantRouteGuard>
  )
}

export const metadata = {
  title: 'مقارنة التصاميم - My Invitation',
  description: 'قارن بين التصاميم المختلفة لاختيار الأنسب لمناسبتك',
};
