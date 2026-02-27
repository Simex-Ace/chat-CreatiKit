import { NextRequest, NextResponse } from 'next/server';
import { findMatch, addOnlineUser } from '@/lib/matching';
import getSupabase from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing required parameter' }, { status: 400 });
    }

    // 添加用户到在线列表
    addOnlineUser(userId);

    // 模拟匹配结果，当Supabase未配置时
    if (!getSupabase()) {
      const mockMatchResult = {
        status: 'matched' as const,
        matchedUserId: `anonymous_mock_${Math.random().toString(36).substr(2, 9)}`,
        message: '匹配成功！（模拟数据）'
      };
      return NextResponse.json({ matchResult: mockMatchResult }, { status: 200 });
    }

    // 查找匹配
    const matchResult = await findMatch(userId);

    return NextResponse.json({ matchResult }, { status: 200 });
  } catch (error) {
    console.error('Error finding match:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}