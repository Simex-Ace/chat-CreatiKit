import getSupabase from './supabase';
import pusher from './pusher';

// 在线状态类型
export interface UserStatus {
  user_id: string;
  is_online: boolean;
  last_active: string;
}

// 更新用户在线状态
export const updateUserStatus = async (userId: string, isOnline: boolean): Promise<void> => {
  const supabase = getSupabase();
  if (!supabase) return;
  
  try {
    const { error } = await supabase
      .from('user_status')
      .upsert({
        user_id: userId,
        is_online: isOnline,
        last_active: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('Error updating user status:', error);
    }

    // 注意：在客户端无法使用pusher.trigger，需要通过服务器端API来广播状态变化
    // 这里暂时只更新数据库中的状态
  } catch (error) {
    console.error('Error updating user status:', error);
  }
};

// 获取用户在线状态
export const getUserStatus = async (userId: string): Promise<UserStatus | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('user_status')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error getting user status:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting user status:', error);
    return null;
  }
};

// 检测用户是否在线（基于最后活动时间）
export const isUserOnline = (lastActive: string): boolean => {
  const lastActiveTime = new Date(lastActive).getTime();
  const now = Date.now();
  const thirtySeconds = 30 * 1000;
  
  return now - lastActiveTime < thirtySeconds;
};

// 检查是否在浏览器环境中
const isBrowser = typeof window !== 'undefined';

// 活动检测定时器
let activityTimer: NodeJS.Timeout | null = null;

// 重置活动定时器
export const resetActivityTimer = (userId: string): void => {
  if (!isBrowser) return;
  
  // 清除之前的定时器
  if (activityTimer) {
    clearTimeout(activityTimer);
  }

  // 更新在线状态
  updateUserStatus(userId, true);

  // 设置30秒后标记为离线
  activityTimer = setTimeout(() => {
    updateUserStatus(userId, false);
  }, 30000);
};

// 监听用户活动
export const setupActivityListener = (userId: string): void => {
  if (!isBrowser) return;
  
  const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

  activityEvents.forEach(event => {
    window.addEventListener(event, () => resetActivityTimer(userId), { passive: true });
  });
};

// 订阅在线状态变化
export const subscribeToStatusChanges = (
  callback: (data: { user_id: string; is_online: boolean }) => void
): void => {
  if (!pusher) return;
  
  const channel = pusher.subscribe('presence-online-status');
  channel.bind('status-change', callback);
};