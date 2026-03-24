'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

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

const statusLabels: Record<string, string> = {
  new: 'جديد',
  ready: 'تم التجهيز',
  delivered: 'تم التسليم',
};

const statusStyles: Record<string, string> = {
  new: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  ready: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  delivered: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
};

export default function Home() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('id', { ascending: false });

    if (data) setOrders(data as Order[]);
  };

  const updateStatus = async (id: number, status: string) => {
    setBusyId(id);
    await supabase.from('orders').update({ status }).eq('id', id);
    setBusyId(null);
  };

  useEffect(() => {
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
  }, []);

  const counts = useMemo(() => {
    return {
      total: orders.length,
      new: orders.filter((o) => o.status === 'new').length,
      ready: orders.filter((o) => o.status === 'ready').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return orders;

    return orders.filter((o) =>
      o.receipt_number.toString().toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.phone.toLowerCase().includes(q) ||
      o.branch.toLowerCase().includes(q) ||
      (statusLabels[o.status] || o.status).toLowerCase().includes(q)
    );
  }, [orders, search]);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#f6f1e7,_#f8f7f3_35%,_#efede7_100%)] px-4 py-6 text-stone-800 md:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-6">
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
                  فرع الصحافة
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 md:text-4xl">
                  لوحة العامل
                </h1>
                <p className="mt-1 text-sm text-stone-500 md:text-base">
                  إدارة الطلبات بشكل مباشر، سريع، وواضح.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="إجمالي الطلبات" value={counts.total} />
              <StatCard label="طلبات جديدة" value={counts.new} />
              <StatCard label="تم التجهيز" value={counts.ready} />
              <StatCard label="تم التسليم" value={counts.delivered} />
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[32px] border border-white/60 bg-white/85 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="border-b border-stone-100 px-6 py-5 md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-stone-900">الطلبات الحالية</h2>
                <p className="mt-1 text-sm text-stone-500">
                  آخر الطلبات تظهر أولاً، والحالة تتحدث مباشرة.
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
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusStyles[o.status] || 'bg-stone-100 text-stone-700 ring-1 ring-stone-200'}`}
                      >
                        {statusLabels[o.status] || o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 md:px-8">
                      <div className="flex flex-wrap gap-2">
                        {o.status !== 'delivered' && (
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
                          onClick={() => updateStatus(o.id, 'delivered')}
                          disabled={busyId === o.id || o.status !== 'ready'}
                          className={`rounded-2xl px-4 py-2 text-sm font-bold text-white shadow-sm transition ${
                            o.status === 'delivered'
                              ? 'cursor-not-allowed bg-stone-400'
                              : o.status !== 'ready'
                                ? 'cursor-not-allowed bg-stone-300'
                                : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                        >
                          {o.status === 'delivered' ? 'تم التسليم ✔️' : 'تم التسليم'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredOrders.length === 0 && (
              <div className="px-6 py-10 text-center text-stone-500">
                لا توجد نتائج مطابقة للبحث
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