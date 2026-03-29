import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient(supabaseUrl, serviceRoleKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workerId, newPassword, adminUserId } = body;

    if (!workerId || !newPassword || !adminUserId) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    const cleanPassword = String(newPassword).trim();

    if (cleanPassword.length < 6) {
      return NextResponse.json(
        { error: 'كلمة المرور الجديدة لازم تكون 6 أحرف أو أكثر' },
        { status: 400 }
      );
    }

    // التحقق من أن المرسل أدمن
    const { data: adminProfile, error: adminError } = await adminClient
      .from('profiles')
      .select('id, role')
      .eq('id', adminUserId)
      .maybeSingle();

    console.log('RESET ADMIN CHECK:', adminUserId, adminProfile, adminError);

    if (adminError) {
      return NextResponse.json(
        { error: adminError.message || 'تعذر التحقق من الأدمن' },
        { status: 500 }
      );
    }

    if (!adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'غير مصرح لك بإعادة تعيين كلمة المرور' },
        { status: 403 }
      );
    }

    // التحقق من أن الهدف عامل
    const { data: workerProfile, error: workerError } = await adminClient
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', workerId)
      .maybeSingle();

    console.log('RESET WORKER CHECK:', workerId, workerProfile, workerError);

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
      password: cleanPassword,
    });

    console.log('RESET UPDATE:', workerId, updateError);

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
    console.error('RESET PASSWORD FATAL:', error);
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ غير متوقع' },
      { status: 500 }
    );
  }
}