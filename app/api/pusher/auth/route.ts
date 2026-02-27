import { NextRequest, NextResponse } from 'next/server';
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID || '',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
  secret: process.env.NEXT_PUBLIC_PUSHER_SECRET || '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
  useTLS: true,
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { socket_id, channel_name, user_id } = body;

  if (!socket_id || !channel_name || !user_id) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  const auth = pusher.authenticate(socket_id, channel_name, {
    user_id,
    user_info: {
      id: user_id,
    },
  });

  return NextResponse.json(auth);
}