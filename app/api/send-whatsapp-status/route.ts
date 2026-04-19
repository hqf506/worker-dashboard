import { NextResponse } from 'next/server';

const RAILWAY_WEBHOOK_URL =
  process.env.RAILWAY_WEBHOOK_URL ||
  'https://n8n-production-6d4c.up.railway.app/webhook/order-status';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log('API route hit');
    console.log('Sending webhook to:', RAILWAY_WEBHOOK_URL);
    console.log('Request body:', body);

    if (!RAILWAY_WEBHOOK_URL) {
      return NextResponse.json(
        {
          success: false,
          error: 'RAILWAY_WEBHOOK_URL is missing',
        },
        { status: 500 }
      );
    }

    const response = await fetch(RAILWAY_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const text = await response.text();

    console.log('Webhook response status:', response.status);
    console.log('Webhook response text:', text);

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'Webhook failed',
          status: response.status,
          details: text,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        details: text,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Server error',
      },
      { status: 500 }
    );
  }
}