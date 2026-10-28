'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PagamentosRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/configuracoes?tab=pagamentos');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
