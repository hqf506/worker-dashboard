import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminClient = createClient(supabaseUrl, serviceRoleKey);

export async function POST(req: NextRequest) {
  try {
    const { workerId, adminUserId } = await req.json();

    if (!workerId || !adminUserId) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    const { data: adminProfile, error: adminError } = await adminClient
      .from('profiles')
      .select('id, role')
      .eq('id', adminUserId)
      .maybeSingle();

    if (adminError || !adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { error: deleteProfileError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', workerId);

    if (deleteProfileError) {
      return NextResponse.json({ error: deleteProfileError.message }, { status: 500 });
    }

    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(workerId);

    if (deleteAuthError) {
      return NextResponse.json({ error: deleteAuthError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'خطأ غير متوقع' }, { status: 500 });
  }
}