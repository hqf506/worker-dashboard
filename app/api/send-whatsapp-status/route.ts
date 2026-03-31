import { NextRequest, NextResponse } from 'next/server';

const buildMessage = (payload: any) => {
  const statusLabel =
    payload.status === 'ready'
      ? 'تم تجهيز طلبك'
      : payload.status === 'closed'
      ? 'تم تسليم طلبك'
      : `تم تحديث حالة طلبك إلى ${payload.status}`;

  return [
    'Leather Fix | شكراً لزيارتكم 🌹',
    '',
    statusLabel,
    '',
    `رقم الفاتورة: ${payload.receipt_number || '-'}`,
    `العميل: ${payload.customer_name || 'عميلنا العزيز'}`,
    `الفرع: ${payload.branch || '-'}`,
  ].join('\n');
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'WHATSAPP_WEBHOOK_URL is not set' },
        { status: 500 }
      );
    }

    if (!body?.phone) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
    }

    const payload = {
      ...body,
      message: buildMessage(body),
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const rawText = await response.text();
    let parsed: any = null;

    try {
      parsed = rawText ? JSON.parse(rawText) : null;
    } catch {
      parsed = rawText;
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Webhook request failed',
          status: response.status,
          details: parsed,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, result: parsed });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
