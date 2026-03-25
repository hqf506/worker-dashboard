'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient, User } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ✅ هذا أهم تعديل (حل التعليق)
  useEffect(() => {
    const loadUser = async () => {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData?.user) {
        setLoading(false);
        return;
      }

      setUser(userData.user);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .single();

      console.log('PROFILE:', data, error);

      if (data) {
        setProfile(data);
      } else {
        // 👈 fallback (مهم)
        setProfile({
          full_name: 'مستخدم',
          role: 'worker',
        });
      }

      setLoading(false);
    };

    loadUser();
  }, []);

  // ✅ حل التعليق
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        جاري التحميل...
      </main>
    );
  }

  // 🔐 صفحة تسجيل الدخول
  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <h1>تسجيل الدخول</h1>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">
        {profile?.role === 'admin' ? 'لوحة الأدمن' : 'لوحة العامل'}
      </h1>

      <p>{profile?.full_name}</p>
    </main>
  );
}