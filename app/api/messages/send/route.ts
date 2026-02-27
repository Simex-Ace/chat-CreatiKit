import { NextRequest, NextResponse } from 'next/server';
import { sendMessage } from '@/lib/messages';
import getSupabase from '@/lib/supabase';
import Pusher from 'pusher';

// Initialize Pusher client
const pusher = new Pusher({
  appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID || '',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
  secret: process.env.NEXT_PUBLIC_PUSHER_SECRET || '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
  useTLS: true,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderId, receiverId, content } = body;

    if (!senderId || !receiverId || !content) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 简单的XSS过滤
    const sanitizedContent = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    // 模拟消息发送，当Supabase未配置时
    if (!getSupabase()) {
      const mockMessage = {
        id: `mock-${Date.now()}`,
        sender_id: senderId,
        receiver_id: receiverId,
        content: sanitizedContent,
        created_at: new Date().toISOString(),
        read: false
      };

      // Trigger Pusher event for real-time messaging (non-blocking)
      (async () => {
        try {
          // 生成频道名称的哈希值，避免中文字符导致的错误
          const generateChannelHash = (id: string) => {
            let hash = 0;
            for (let i = 0; i < id.length; i++) {
              const char = id.charCodeAt(i);
              hash = ((hash << 5) - hash) + char;
              hash = hash & hash;
            }
            return Math.abs(hash).toString(16);
          };
          
          // 统一频道命名规则，确保双方订阅同一个频道
          const sortedIds = [senderId, receiverId].sort();
          const channelHash = sortedIds.map(generateChannelHash).join('-');
          const channelName = `public-chat-${channelHash}`;
          await pusher.trigger(channelName, 'new-message', mockMessage);
          console.log('Pusher event triggered:', channelName);
        } catch (pusherError) {
          console.error('Error triggering Pusher event:', pusherError);
        }
      })();

      return NextResponse.json({ message: mockMessage }, { status: 200 });
    }

    const message = await sendMessage(senderId, receiverId, sanitizedContent);

    if (!message) {
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // Trigger Pusher event for real-time messaging (non-blocking)
    (async () => {
      try {
        // 生成频道名称的哈希值，避免中文字符导致的错误
        const generateChannelHash = (id: string) => {
          let hash = 0;
          for (let i = 0; i < id.length; i++) {
            const char = id.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
          }
          return Math.abs(hash).toString(16);
        };
        
        // 统一频道命名规则，确保双方订阅同一个频道
        const sortedIds = [senderId, receiverId].sort();
        const channelHash = sortedIds.map(generateChannelHash).join('-');
        const channelName = `public-chat-${channelHash}`;
        await pusher.trigger(channelName, 'new-message', message);
        console.log('Pusher event triggered:', channelName);
      } catch (pusherError) {
        console.error('Error triggering Pusher event:', pusherError);
      }
    })();

    return NextResponse.json({ message }, { status: 200 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}