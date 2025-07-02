"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import AdminNavigation from '../../components/Admin/AdminNavigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login');
      } else if (session.user.email !== 'saisrikarpersonal@gmail.com') {
        router.replace('/login');
      } else {
        setLoading(false);
      }
    });
    // Listen for auth changes (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session || session.user.email !== 'saisrikarpersonal@gmail.com') {
        router.replace('/login');
      }
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return <div className="text-center py-10">Checking authentication...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      <main>{children}</main>
    </div>
  );
} 