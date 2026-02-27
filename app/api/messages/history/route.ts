import { NextRequest, NextResponse } from 'next/server';
import { getChatHistory } from '@/lib/messages';
import getSupabase from '@/lib/supabase';

// 标记为动态路由，避免静态渲染错误
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId');
    const partnerId = searchParams.get('partnerId');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!userId || !partnerId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 模拟聊天历史记录，当Supabase未配置时
    if (!getSupabase()) {
      const mockMessages = Array.from({ length: 5 }, (_, i) => ({
        id: `mock-${Date.now()}-${i}`,
        sender_id: i % 2 === 0 ? userId : partnerId,
        receiver_id: i % 2 === 0 ? partnerId : userId,
        content: `这是一条模拟消息 ${i + 1}`,
        created_at: new Date(Date.now() - i * 60000).toISOString(),
        read: i % 3 !== 0
      }));
      return NextResponse.json({ messages: mockMessages }, { status: 200 });
    }

    const messages = await getChatHistory(userId, partnerId, limit, offset);

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}