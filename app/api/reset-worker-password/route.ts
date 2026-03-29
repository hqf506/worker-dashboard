import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient(supabaseUrl, serviceRoleKey);
const normalClient = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workerId, newPassword, adminUserId } = body;

    if (!workerId || !newPassword || !adminUserId) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    if (String(newPassword).trim().length < 6) {
      return NextResponse.json(
        { error: 'كلمة المرور الجديدة لازم تكون 6 أحرف أو أكثر' },
        { status: 400 }
      );
    }

    const { data: adminProfile, error: adminCheckError } = await normalClient
      .from('profiles')
      .select('id, role')
      .eq('id', adminUserId)
      .maybeSingle();

    if (adminCheckError) {
      return NextResponse.json(
        { error: adminCheckError.message || 'تعذر التحقق من صلاحية الأدمن' },
        { status: 500 }
      );
    }

    if (!adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'غير مصرح لك بإعادة تعيين كلمة المرور' },
        { status: 403 }
      );
    }

    const { data: workerProfile, error: workerError } = await adminClient
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', workerId)
      .maybeSingle();

    if (workerError) {
      return NextResponse.json(
        { error: workerError.message || 'تعذر العثور على العامل' },
        { status: 500 }
      );
    }

    if (!workerProfile || workerProfile.role !== 'worker') {
      return NextResponse.json(
        { error: 'المستخدم المحدد ليس عاملًا' },
        { status: 400 }
      );
    }

    const { error: updateError } = await adminClient.auth.admin.updateUserById(workerId, {
      password: String(newPassword).trim(),
    });

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || 'فشل تحديث كلمة المرور' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم تحديث كلمة المرور بنجاح',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ غير متوقع' },
      { status: 500 }
    );
  }
}