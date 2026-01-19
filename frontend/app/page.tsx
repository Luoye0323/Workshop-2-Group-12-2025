'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/main/dashboard');
    }
  }, [user, router]);

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)]">
      <div className="max-w-2xl text-center">
        <img src="/ipetro-logo.svg" alt="IPETRO Logo" className="mx-auto h-12 w-auto" />
        <p className="text-gray-600">AI-Powered RBI Planner</p>
        
        <Link
          href="/login"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Employee Login
        </Link>

        <p className="mt-6 text-sm text-gray-500">
          For authorized personnel only
        </p>
      </div>
    </main>
  );
}