'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RedirectBody() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams.toString();
    router.replace(
      q
        ? `/payment/result?provider=tamara&status=cancel&${q}`
        : '/payment/result?provider=tamara&status=cancel'
    );
  }, [router, searchParams]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      جاري تحويلك…
    </div>
  );
}

export default function PaymentCancelRedirectPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>…</div>}>
      <RedirectBody />
    </Suspense>
  );
}
