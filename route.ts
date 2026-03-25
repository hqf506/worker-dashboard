import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { full_name, username, password, adminUserId } = body;

    if (!full_name || !username || !password || !adminUserId) {
      return NextResponse.json({ error: 'البيانات ناقصة' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'كلمة المرور لازم تكون 6 أحرف أو أكثر' },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim().toLowerCase();

    const { data: adminProfile, error: adminError } = await supabaseAnon
      .from('profiles')
      .select('id, role')
      .eq('id', adminUserId)
      .single();

    if (adminError || !adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'غير مصرح لك بإضافة عمال' },
        { status: 403 }
      );
    }

    const { data: existingUsername } = await supabaseAnon
      .from('profiles')
      .select('id')
      .eq('username', cleanUsername)
      .maybeSingle();

    if (existingUsername) {
      return NextResponse.json(
        { error: 'اسم المستخدم مستخدم من قبل' },
        { status: 409 }
      );
    }

    const fakeEmail = `${cleanUsername}@worker.local`;

    const { data: createdUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: fakeEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          username: cleanUsername,
          role: 'worker',
        },
      });

    if (createError || !createdUser.user) {
      return NextResponse.json(
        { error: createError?.message || 'فشل إنشاء المستخدم' },
        { status: 400 }
      );
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: createdUser.user.id,
        email: fakeEmail,
        full_name,
        username: cleanUsername,
        role: 'worker',
      });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id);

      return NextResponse.json(
        { error: profileError.message || 'فشل حفظ بيانات العامل' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء العامل بنجاح',
    });
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع' },
      { status: 500 }
    );
  }
}