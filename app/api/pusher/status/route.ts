import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * 调试接口：检查 Pusher 环境变量是否已配置
 * 访问 /api/pusher/status 即可验证
 */
export async function GET() {
  const hasAppId = !!process.env.NEXT_PUBLIC_PUSHER_APP_ID;
  const hasKey = !!process.env.NEXT_PUBLIC_PUSHER_KEY;
  const hasSecret = !!process.env.NEXT_PUBLIC_PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || '(未设置)';

  const configured = hasAppId && hasKey && hasSecret;

  return NextResponse.json({
    configured,
    checks: {
      appId: hasAppId,
      key: hasKey,
      secret: hasSecret,
      cluster,
    },
    message: configured
      ? 'Pusher 环境变量已配置'
      : 'Pusher 环境变量未完整配置，请在 Vercel 项目设置中添加',
  });
}
