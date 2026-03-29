import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient(supabaseUrl, serviceRoleKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      full_name,
      username,
      email,
      password,
      adminUserId,
      role = 'worker',
      language = 'ar',
      branch = '',
    } = body;

    if (!full_name || !username || !email || !password || !adminUserId) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    const cleanName = String(full_name).trim();
    const cleanUsername = String(username).trim().toLowerCase();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password).trim();
    const cleanRole = String(role).trim().toLowerCase();
    const cleanLanguage = String(language).trim().toLowerCase();
    const cleanBranch = String(branch || '').trim();

    if (cleanPassword.length < 6) {
      return NextResponse.json(
        { error: 'كلمة المرور لازم تكون 6 أحرف أو أكثر' },
        { status: 400 }
      );
    }

    if (!['worker', 'admin'].includes(cleanRole)) {
      return NextResponse.json({ error: 'صلاحية غير صحيحة' }, { status: 400 });
    }

    if (!['ar', 'en'].includes(cleanLanguage)) {
      return NextResponse.json({ error: 'لغة غير صحيحة' }, { status: 400 });
    }

    const { data: adminProfile, error: adminError } = await adminClient
      .from('profiles')
      .select('id, role')
      .eq('id', adminUserId)
      .maybeSingle();

    if (adminError) {
      return NextResponse.json(
        { error: adminError.message || 'تعذر التحقق من الأدمن' },
        { status: 500 }
      );
    }

    if (!adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 403 });
    }

    const { data: existingByUsername, error: usernameCheckError } = await adminClient
      .from('profiles')
      .select('id')
      .eq('username', cleanUsername)
      .maybeSingle();

    if (usernameCheckError) {
      return NextResponse.json(
        { error: usernameCheckError.message || 'تعذر التحقق من اسم المستخدم' },
        { status: 500 }
      );
    }

    if (existingByUsername) {
      return NextResponse.json(
        { error: 'اسم المستخدم مستخدم بالفعل' },
        { status: 400 }
      );
    }

    const { data: existingByEmail, error: emailCheckError } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (emailCheckError) {
      return NextResponse.json(
        { error: emailCheckError.message || 'تعذر التحقق من الإيميل' },
        { status: 500 }
      );
    }

    if (existingByEmail) {
      return NextResponse.json(
        { error: 'الإيميل مستخدم بالفعل' },
        { status: 400 }
      );
    }

    const { data: createdUser, error: createUserError } = await adminClient.auth.admin.createUser({
      email: cleanEmail,
      password: cleanPassword,
      email_confirm: true,
      user_metadata: {
        full_name: cleanName,
        username: cleanUsername,
      },
    });

    if (createUserError || !createdUser?.user?.id) {
      return NextResponse.json(
        { error: createUserError?.message || 'فشل إنشاء مستخدم Auth' },
        { status: 500 }
      );
    }

    const newUserId = createdUser.user.id;

    const { error: insertProfileError } = await adminClient.from('profiles').insert({
      id: newUserId,
      email: cleanEmail,
      username: cleanUsername,
      full_name: cleanName,
      role: cleanRole,
      language: cleanLanguage,
      branch: cleanBranch || null,
    });

    if (insertProfileError) {
      await adminClient.auth.admin.deleteUser(newUserId);

      return NextResponse.json(
        { error: insertProfileError.message || 'فشل حفظ بيانات المستخدم في profiles' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء المستخدم بنجاح',
      userId: newUserId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ غير متوقع' },
      { status: 500 }
    );
  }
}