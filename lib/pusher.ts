import Pusher from 'pusher-js';

// 检查是否在浏览器环境中
const isBrowser = typeof window !== 'undefined';

let pusher: Pusher | null = null;

if (isBrowser) {
  // 获取用户ID用于Pusher认证
  const getUserId = () => {
    try {
      return localStorage.getItem('anonymousId') || '';
    } catch {
      return '';
    }
  };

  pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
    authEndpoint: '/api/pusher/auth',
    auth: {
      headers: {
        'Content-Type': 'application/json',
      },
      params: {
        user_id: getUserId()
      }
    },
  });
}

export default pusher;