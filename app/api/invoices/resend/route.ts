import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHmac, timingSafeEqual } from 'node:crypto';

export const runtime = 'nodejs';

const LOYVERSE_ROOT = 'https://api.loyverse.com/v1.0';
const INVOICE_RE = /^[0-9]{1,5}-[0-9]{1,8}$/;
const RAWDA_ID = '28dad045-9aa7-4695-a8da-435a27e84e72';
const SAHAFA_ID = '899fa860-f09e-4ae9-ad95-0c84a14ead5c';
type Receipt = { receipt_number: string; customer_id?: string; store_id?: string; total_money?: number; receipt_type?: string; cancelled_at?: string | null };
type Customer = { name?: string; phone_number?: string };
type Preview = { receipt_number: string; customer_name: string; phone_number: string; total_money: number; branch: string };

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
}

async function loyverse<T>(path: string): Promise<T> {
  const token = process.env.LOYVERSE_API_TOKEN;
  if (!token) throw new Error('Loyverse integration is not configured');
  const response = await fetch(LOYVERSE_ROOT + path, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(12000),
  });
  if (response.status === 404) throw new Error('الفاتورة أو العميل غير موجود');
  if (!response.ok) throw new Error('تعذر جلب بيانات Loyverse');
  return await response.json() as T;
}

function encodeTicket(payload: object, secret: string) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${signature}`;
}

function checkTicket(ticket: string, secret: string): { receipt: string; user: string; expires: number } | null {
  const [data, received, extra] = ticket.split('.');
  if (!data || !received || extra) return null;
  const expected = createHmac('sha256', secret).update(data).digest();
  let supplied: Buffer;
  try { supplied = Buffer.from(received, 'base64url'); } catch { return null; }
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  try {
    const p = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (typeof p.receipt !== 'string' || typeof p.user !== 'string' || !Number.isFinite(p.expires) || p.expires < Date.now()) return null;
    return p;
  } catch { return null; }
}

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return fail('يجب تسجيل الدخول', 401);
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secret = process.env.INVOICE_RESEND_SIGNING_SECRET;
  if (!supaUrl || !supaKey || !secret) return fail('خدمة إعادة الإرسال غير مهيأة', 503);

  const client = createClient(supaUrl, supaKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: auth } },
  });
  const { data: authData, error: authError } = await client.auth.getUser(auth.slice(7));
  if (authError || !authData.user) return fail('انتهت جلسة الدخول', 401);
  const user = authData.user;
  const { data: profile, error: profileError } = await client.from('profiles').select('role, branch').eq('id', user.id).single();
  if (profileError || !profile || !['worker', 'admin'].includes(profile.role)) return fail('غير مصرح بهذه العملية', 403);

  let input: { action?: string; receipt_number?: string; ticket?: string };
  try { input = await request.json(); } catch { return fail('بيانات غير صالحة', 400); }
  const receiptNumber = typeof input.receipt_number === 'string' ? input.receipt_number.trim() : '';
  if (!INVOICE_RE.test(receiptNumber)) return fail('رقم الفاتورة غير صحيح', 400);
  if (input.action !== 'preview' && input.action !== 'send') return fail('إجراء غير معروف', 400);

  if (input.action === 'send') {
    // A send requires an unexpired, user-bound preview ticket. Never trust client-supplied phone or PDF URL.
    const ticket = typeof input.ticket === 'string' ? checkTicket(input.ticket, secret) : null;
    if (!ticket || ticket.user !== user.id || ticket.receipt !== receiptNumber) return fail('انتهت صلاحية المعاينة، ابحث عن الفاتورة مجددًا', 409);
  }

  try {
    const r = await loyverse<Receipt>('/receipts/' + encodeURIComponent(receiptNumber));
    if (r.receipt_number !== receiptNumber || r.receipt_type !== 'SALE' || r.cancelled_at) return fail('الفاتورة غير صالحة لإعادة الإرسال', 400);
    if (!r.customer_id || !r.store_id || ![RAWDA_ID, SAHAFA_ID].includes(r.store_id)) return fail('تعذر تحديد العميل أو الفرع', 400);

    const branch = r.store_id === RAWDA_ID ? 'فرع الروضة' : 'فرع الصحافة';
    if (profile.role === 'worker' && (!profile.branch || profile.branch !== branch)) return fail('الفاتورة ليست ضمن صلاحيات فرعك', 403);
    const customer = await loyverse<Customer>('/customers/' + encodeURIComponent(r.customer_id));
    if (!customer.phone_number || !/^\+?[0-9]{9,15}$/.test(customer.phone_number.replace(/\s/g,''))) return fail('لا يوجد رقم جوال صالح للعميل', 400);

    const invoice: Preview = {
      receipt_number: receiptNumber,
      customer_name: customer.name || 'عميل',
      phone_number: customer.phone_number,
      total_money: Number(r.total_money || 0),
      branch,
    };
    if (input.action === 'preview') {
      const ticket = encodeTicket({ receipt: receiptNumber, user: user.id, expires: Date.now() + 5 * 60_000 }, secret);
      return NextResponse.json({ invoice, ticket }, { headers: { 'Cache-Control': 'no-store' } });
    }

    // This MUST point to a hosted, authenticated n8n webhook set up specifically for invoice resends.
    // No local-host URL and no public form endpoint are accepted.
    const webhook = process.env.INVOICE_RESEND_WEBHOOK_URL;
    const webhookSecret = process.env.INVOICE_RESEND_WEBHOOK_SECRET;
    if (!webhook || !webhookSecret) return fail('إرسال واتساب غير مفعّل بعد. يلزم ربط خدمة n8n المستضافة.', 503);
    const url = new URL(webhook);
    if (url.protocol !== 'https:' || url.username || url.password || /^(localhost|127\.|10\.|192\.168\.)/.test(url.hostname)) {
      return fail('عنوان خدمة الإرسال غير آمن', 503);
    }
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-invoice-resend-secret': webhookSecret },
      body: JSON.stringify({ receipt_number: receiptNumber, requested_by: user.id }),
      cache: 'no-store',
      signal: AbortSignal.timeout(25000),
    });
    const result = await response.json().catch(() => null) as { sent?: boolean | string; error?: string } | null;
    if (!response.ok || (result?.sent !== true && result?.sent !== 'true')) return fail(result?.error || 'لم تؤكد خدمة واتساب قبول الإرسال', 502);
    return NextResponse.json({ accepted: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'فشل الاتصال بالخدمة', 502);
  }
}
