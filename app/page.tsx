'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://htsnnlgfsbxwcazzranf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ocCXOns4poDCWX-36G2i7w_MivwdifD';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

type Order = {
  id: number;
  receipt_number: string;
  customer_name: string;
  phone: string;
  branch: string;
  status: string;
  created_at: string;
};

export default function Home() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('id', { ascending: false });

    if (!error && data) {
      setOrders(data);
    }

    setLoading(false);
  };

  const updateStatus = async (id: number, status: string) => {
    setBusyId(id);

    await supabase
      .from('orders')
      .update({ status })
      .eq('id', id);

    setBusyId(null);
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) return <div className="p-10">جاري التحميل...</div>;

  return (
    <div className="p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">لوحة العامل</h1>

      <table className="w-full border text-center">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">رقم الفاتورة</th>
            <th className="p-2">العميل</th>
            <th className="p-2">الجوال</th>
            <th className="p-2">الفرع</th>
            <th className="p-2">الحالة</th>
            <th className="p-2">الإجراء</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t">
              <td className="p-2">{o.receipt_number}</td>
              <td className="p-2">{o.customer_name}</td>
              <td className="p-2">{o.phone}</td>
              <td className="p-2">{o.branch}</td>
              <td className="p-2">{o.status}</td>
              <td className="p-2 space-x-2">
                {o.status !== 'delivered' && (
                  <button
                    onClick={() => updateStatus(o.id, 'ready')}
                    disabled={busyId === o.id || o.status === 'ready'}
                    className={`px-3 py-1 rounded text-white ${
                      o.status === 'ready' ? 'bg-gray-400' : 'bg-blue-500'
                    }`}
                  >
                    {o.status === 'ready' ? 'تم التجهيز ✔️' : 'تم التجهيز'}
                  </button>
                )}

                <button
                  onClick={() => updateStatus(o.id, 'delivered')}
                  disabled={busyId === o.id || o.status !== 'ready'}
                  className={`px-3 py-1 rounded text-white ${
                    o.status === 'delivered' ? 'bg-gray-400' : 'bg-green-600'
                  }`}
                >
                  {o.status === 'delivered' ? 'تم التسليم ✔️' : 'تم التسليم'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}