'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient, User } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Order = {
  id: number;
  receipt_number: string;
  customer_name: string;
  phone: string;
  branch: string;
  status: string;
  created_at: string;
};

type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'worker';
  created_at?: string;
};

const statusLabels: Record<string, string> = {
  new: 'جديد',
  ready: 'تم التجهيز',
  closed: 'تم التسليم',
};

const statusStyles: Record<string, string> = {
  new: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  ready: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  closed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [workers, setWorkers] = useState<Profile[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [workerLoading, setWorkerLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [workerName, setWorkerName] = useState('');
  const [workerEmail, setWorkerEmail] = useState('');
  const [workerPassword, setWorkerPassword] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    console.log('PROFILE:', data, error);

    if (error) {
      setProfile(null);
      return null;
    }

    if (!data) {
      setProfile(null);
      return null;
    }

    setProfile(data as Profile);
    return data as Profile;
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('ORDERS ERROR:', error);
      return;
    }

    if (data) {
      setOrders(data as Order[]);
    }
  };

  const fetchWorkers = async () => {
    if (profile?.role !== 'admin') return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'worker')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('WORKERS ERROR:', error);
      return;
    }

    if (data) {
      setWorkers(data as Profile[]);
    }
  };

  const login = async () => {
    if (!loginEmail || !loginPassword) {
      showMessage('error', 'أدخل البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoginLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    setLoginLoading(false);

    if (error) {
      showMessage('error', error.message || 'فشل تسجيل الدخول');
      return;
    }

    showMessage('success', 'تم تسجيل الدخول بنجاح');
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setOrders([]);
    setWorkers([]);
    showMessage('success', 'تم تسجيل الخروج');
  };

  const updateStatus = async (id: number, status: string) => {
    setBusyId(id);

    const { error } = await supabase.from('orders').update({ status }).eq('id', id);

    setBusyId(null);

    if (error) {
      console.error('UPDATE STATUS ERROR:', error);
      showMessage('error', 'تعذر تحديث حالة الطلب');
      return;
    }

    showMessage('success', 'تم تحديث حالة الطلب');
    await fetchOrders();
  };

  const createWorker = async () => {
    if (profile?.role !== 'admin') return;

    if (!workerName || !workerEmail || !workerPassword) {
      showMessage('error', 'عبّ جميع حقول العامل');
      return;
    }

    if (workerPassword.length < 6) {
      showMessage('error', 'كلمة المرور لازم تكون 6 أحرف أو أكثر');
      return;
    }

    setWorkerLoading(true);

    try {
      const tempClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
            storageKey: `temp-worker-${Date.now()}`,
          },
        }
      );

      const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({
        email: workerEmail,
        password: workerPassword,
        options: {
          data: {
            full_name: workerName,
            role: 'worker',
          },
        },
      });

      if (signUpError) {
        showMessage('error', signUpError.message || 'فشل إنشاء حساب العامل');
        setWorkerLoading(false);
        return;
      }

      const newUserId = signUpData.user?.id;

      if (!newUserId) {
        showMessage('error', 'تم إنشاء الحساب لكن لم يتم استلام رقم المستخدم');
        setWorkerLoading(false);
        return;
      }

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: newUserId,
        email: workerEmail,
        full_name: workerName,
        role: 'worker',
      });

      if (profileError) {
        showMessage('error', profileError.message || 'تم إنشاء الحساب لكن فشل حفظ بيانات العامل');
        setWorkerLoading(false);
        return;
      }

      setWorkerName('');
      setWorkerEmail('');
      setWorkerPassword('');
      showMessage('success', 'تم إنشاء العامل بنجاح');
      await fetchWorkers();
    } catch (err) {
      console.error('CREATE WORKER ERROR:', err);
      showMessage('error', 'حدث خطأ أثناء إنشاء العامل');
    } finally {
      setWorkerLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!currentUser) {
          setUser(null);
          setProfile(null);
          setAuthLoading(false);
          return;
        }

        setUser(currentUser);
        await fetchProfile(currentUser.id);
      } catch (err) {
        console.error('INIT ERROR:', err);
      } finally {
        setAuthLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }

      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user || !profile) return;

    fetchOrders();

    const channel = supabase
      .channel('orders-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile]);

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchWorkers();
    }
  }, [profile]);

  const visibleOrders = useMemo(() => {
    return orders.filter((o) => o.status !== 'closed');
  }, [orders]);

  const counts = useMemo(() => {
    return {
      total: visibleOrders.length,
      new: visibleOrders.filter((o) => o.status === 'new').length,
      ready: visibleOrders.filter((o) => o.status === 'ready').length,
      closed: orders.filter((o) => o.status === 'closed').length,
    };
  }, [orders, visibleOrders]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return visibleOrders;

    return visibleOrders.filter((o) =>
      o.receipt_number.toString().toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.phone.toLowerCase().includes(q) ||
      o.branch.toLowerCase().includes(q) ||
      (statusLabels[o.status] || o.status).toLowerCase().includes(q)
    );
  }, [visibleOrders, search]);

  if (authLoading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,_#f6f1e7,_#f8f7f3_35%,_#efede7_100%)] px-4"
      >
        <div className="rounded-[28px] border border-white/60 bg-white/85 px-8 py-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          جاري التحميل...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,_#f6f1e7,_#f8f7f3_35%,_#efede7_100%)] px-4 py-8 text-stone-800"
      >
        <div className="w-full max-w-md rounded-[32px] border border-white/60 bg-white/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur md:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[24px] border border-stone-200 bg-white shadow-sm">
              <img
                src="/logo-sahafa.png"
                alt="شعار الصحافة"
                className="h-14 w-14 object-contain"
              />
            </div>
            <h1 className="text-3xl font-extrabold text-stone-900">تسجيل الدخول</h1>
            <p className="mt-2 text-sm text-stone-500">لوحة العامل والإدارة</p>
          </div>

          {message && (
            <div
              className={`mb-4 rounded-2xl px-4 py-3 text-sm font-bold ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                  : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-stone-700">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-stone-700">
                كلمة المرور
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="******"
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
              />
            </div>

            <button
              onClick={login}
              disabled={loginLoading}
              className="w-full rounded-2xl bg-stone-900 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loginLoading ? 'جاري الدخول...' : 'دخول'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,_#f6f1e7,_#f8f7f3_35%,_#efede7_100%)] px-4"
      >
        <div className="rounded-[28px] border border-rose-200 bg-white/90 px-8 py-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <div className="text-lg font-extrabold text-rose-700">
            لم يتم العثور على بيانات المستخدم في profiles
          </div>
          <p className="mt-2 text-sm text-stone-500">{user.email}</p>
          <button
            onClick={logout}
            className="mt-5 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-stone-800"
          >
            تسجيل خروج
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#f6f1e7,_#f8f7f3_35%,_#efede7_100%)] px-4 py-6 text-stone-800 md:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {message && (
          <div
            className={`rounded-[24px] px-5 py-4 text-sm font-bold shadow-sm ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/80 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="absolute inset-0 bg-gradient-to-l from-stone-100/40 via-transparent to-white/20" />
          <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-[24px] border border-stone-200 bg-white shadow-sm">
                <img
                  src="/logo-sahafa.png"
                  alt="شعار الصحافة"
                  className="h-14 w-14 object-contain"
                />
              </div>

              <div>
                <div className="mb-2 inline-flex rounded-full bg-stone-900 px-3 py-1 text-xs font-bold text-white shadow-sm">
                  {profile.role === 'admin' ? 'لوحة الأدمن' : 'لوحة العامل'}
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 md:text-4xl">
                  {profile.role === 'admin' ? 'إدارة الطلبات والعمال' : 'لوحة العامل'}
                </h1>
                <p className="mt-1 text-sm text-stone-500 md:text-base">
                  {profile.full_name || user.email}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-3 md:items-end">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard label="الطلبات المفتوحة" value={counts.total} />
                <StatCard label="طلبات جديدة" value={counts.new} />
                <StatCard label="تم التجهيز" value={counts.ready} />
                <StatCard label="تم التسليم" value={counts.closed} />
              </div>

              <button
                onClick={logout}
                className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-rose-600"
              >
                تسجيل خروج
              </button>
            </div>
          </div>
        </section>

        {profile.role === 'admin' && (
          <section className="overflow-hidden rounded-[32px] border border-white/60 bg-white/85 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur">
            <div className="border-b border-stone-100 px-6 py-5 md:px-8">
              <h2 className="text-xl font-extrabold text-stone-900">إضافة عامل جديد</h2>
              <p className="mt-1 text-sm text-stone-500">
                من هنا تقدر تضيف يوزر جديد للعامل مع كلمة مرور.
              </p>
            </div>

            <div className="grid gap-4 px-6 py-6 md:grid-cols-4 md:px-8">
              <input
                type="text"
                value={workerName}
                onChange={(e) => setWorkerName(e.target.value)}
                placeholder="اسم العامل"
                className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
              />

              <input
                type="email"
                value={workerEmail}
                onChange={(e) => setWorkerEmail(e.target.value)}
                placeholder="بريد العامل"
                className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
              />

              <input
                type="password"
                value={workerPassword}
                onChange={(e) => setWorkerPassword(e.target.value)}
                placeholder="كلمة المرور"
                className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
              />

              <button
                onClick={createWorker}
                disabled={workerLoading}
                className="rounded-2xl bg-stone-900 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {workerLoading ? 'جاري الإضافة...' : 'إضافة العامل'}
              </button>
            </div>

            <div className="border-t border-stone-100 px-6 py-5 md:px-8">
              <h3 className="text-lg font-extrabold text-stone-900">العمال الحاليون</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-right">
                <thead className="bg-stone-50/90 text-sm text-stone-600">
                  <tr>
                    <th className="px-6 py-4 font-bold md:px-8">الاسم</th>
                    <th className="px-6 py-4 font-bold">البريد</th>
                    <th className="px-6 py-4 font-bold">الصلاحية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm md:text-[15px]">
                  {workers.map((w) => (
                    <tr key={w.id} className="transition hover:bg-stone-50/70">
                      <td className="px-6 py-4 font-bold md:px-8">{w.full_name || '-'}</td>
                      <td className="px-6 py-4 text-stone-600">{w.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-stone-900 px-3 py-1 text-xs font-bold text-white">
                          عامل
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {workers.length === 0 && (
                <div className="px-6 py-10 text-center text-stone-500">
                  لا يوجد عمال حالياً
                </div>
              )}
            </div>
          </section>
        )}

        <section className="overflow-hidden rounded-[32px] border border-white/60 bg-white/85 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="border-b border-stone-100 px-6 py-5 md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-stone-900">الطلبات الحالية</h2>
                <p className="mt-1 text-sm text-stone-500">
                  الطلبات المسلمة تختفي من صفحة العامل تلقائيًا.
                </p>
              </div>

              <div className="w-full md:w-[380px]">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث برقم الفاتورة أو اسم العميل أو الجوال أو الفرع"
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-right">
              <thead className="bg-stone-50/90 text-sm text-stone-600">
                <tr>
                  <th className="px-6 py-4 font-bold md:px-8">رقم الفاتورة</th>
                  <th className="px-6 py-4 font-bold">العميل</th>
                  <th className="px-6 py-4 font-bold">الجوال</th>
                  <th className="px-6 py-4 font-bold">الفرع</th>
                  <th className="px-6 py-4 font-bold">الحالة</th>
                  <th className="px-6 py-4 font-bold md:px-8">الإجراء</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100 text-sm md:text-[15px]">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="transition hover:bg-stone-50/70">
                    <td className="px-6 py-4 font-extrabold text-stone-900 md:px-8">
                      #{o.receipt_number}
                    </td>
                    <td className="px-6 py-4 font-semibold">{o.customer_name}</td>
                    <td className="px-6 py-4 text-stone-600" dir="ltr">
                      {o.phone}
                    </td>
                    <td className="px-6 py-4">{o.branch}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          statusStyles[o.status] || 'bg-stone-100 text-stone-700 ring-1 ring-stone-200'
                        }`}
                      >
                        {statusLabels[o.status] || o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 md:px-8">
                      <div className="flex flex-wrap gap-2">
                        {o.status !== 'closed' && (
                          <button
                            onClick={() => updateStatus(o.id, 'ready')}
                            disabled={busyId === o.id || o.status === 'ready'}
                            className={`rounded-2xl px-4 py-2 text-sm font-bold text-white shadow-sm transition ${
                              o.status === 'ready'
                                ? 'cursor-not-allowed bg-stone-400'
                                : 'bg-sky-600 hover:bg-sky-700'
                            }`}
                          >
                            {o.status === 'ready' ? 'تم التجهيز ✔️' : 'تم التجهيز'}
                          </button>
                        )}

                        <button
                          onClick={() => updateStatus(o.id, 'closed')}
                          disabled={busyId === o.id || o.status !== 'ready'}
                          className={`rounded-2xl px-4 py-2 text-sm font-bold text-white shadow-sm transition ${
                            o.status === 'closed'
                              ? 'cursor-not-allowed bg-stone-400'
                              : o.status !== 'ready'
                                ? 'cursor-not-allowed bg-stone-300'
                                : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                        >
                          {o.status === 'closed' ? 'تم التسليم ✔️' : 'تم التسليم'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredOrders.length === 0 && orders.length > 0 && (
              <div className="px-6 py-10 text-center text-stone-500">
                لا توجد نتائج مطابقة أو لا توجد طلبات مفتوحة
              </div>
            )}

            {orders.length === 0 && (
              <div className="px-6 py-10 text-center text-stone-500">
                لا توجد طلبات حالياً
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[22px] border border-stone-200/70 bg-white/90 px-4 py-4 shadow-[0_10px_25px_rgba(0,0,0,0.04)]">
      <div className="text-xs font-bold text-stone-500">{label}</div>
      <div className="mt-2 text-3xl font-extrabold text-stone-900">{value}</div>
    </div>
  );
}