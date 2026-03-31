import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;

    console.log('WHATSAPP_WEBHOOK_URL:', webhookUrl);
    console.log('SEND WHATSAPP BODY:', body);

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Missing webhook URL' },
        { status: 500 }
      );
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const responseText = await res.text();

    console.log('WEBHOOK STATUS:', res.status);
    console.log('WEBHOOK RESPONSE:', responseText);

    if (!res.ok) {
      return NextResponse.json(
        {
          error: 'Webhook failed',
          status: res.status,
          details: responseText,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      details: responseText,
    });
  } catch (error: any) {
    console.error('SEND WHATSAPP ROUTE ERROR:', error);

    return NextResponse.json(
      { error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}