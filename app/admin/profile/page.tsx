'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminProfilePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main profile page
    router.replace('/profile');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
    </div>
  );
}