import getSupabase from './supabase';

// 匹配状态类型
export type MatchStatus = 'idle' | 'searching' | 'matched';

// 匹配结果类型
export interface MatchResult {
  status: MatchStatus;
  matchedUserId?: string;
  message?: string;
}

// 生成随机中文昵称
const generateChineseNickname = (): string => {
  const surnames = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴'];
  const adjectives = ['快乐的', '勇敢的', '聪明的', '善良的', '活泼的', '安静的', '幽默的', '温柔的', '热情的', '冷静的'];
  const nouns = ['小猫', '小狗', '小鸟', '小鱼', '小熊', '小兔', '小虎', '小狮', '小龙', '小蛇'];
  
  const surname = surnames[Math.floor(Math.random() * surnames.length)];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${surname}${adjective}${noun}`;
};

// 检查是否在浏览器环境中
const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

// 在线用户存储键名
const ONLINE_USERS_KEY = 'chat_online_users';
const LAST_ACTIVE_KEY = 'chat_last_active';

// 添加在线用户
export const addOnlineUser = (userId: string): void => {
  if (!isBrowser) return;
  
  // 从localStorage获取在线用户列表
  let onlineUsers = getOnlineUsers();
  
  // 确保用户ID唯一
  if (!onlineUsers.includes(userId)) {
    onlineUsers.push(userId);
    // 更新localStorage
    localStorage.setItem(ONLINE_USERS_KEY, JSON.stringify(onlineUsers));
  }
  
  // 更新最后活动时间
  const lastActive = {
    [userId]: Date.now()
  };
  const existingLastActive = JSON.parse(localStorage.getItem(LAST_ACTIVE_KEY) || '{}');
  localStorage.setItem(LAST_ACTIVE_KEY, JSON.stringify({ ...existingLastActive, ...lastActive }));
  
  console.log('Added online user:', userId);
  console.log('Current online users:', getOnlineUsers());
};

// 移除在线用户
export const removeOnlineUser = (userId: string): void => {
  if (!isBrowser) return;
  
  const onlineUsers = getOnlineUsers();
  const updatedUsers = onlineUsers.filter(id => id !== userId);
  localStorage.setItem(ONLINE_USERS_KEY, JSON.stringify(updatedUsers));
  
  console.log('Removed online user:', userId);
  console.log('Current online users:', getOnlineUsers());
};

// 获取在线用户列表
export const getOnlineUsers = (): string[] => {
  if (!isBrowser) return [];
  
  try {
    const onlineUsers = JSON.parse(localStorage.getItem(ONLINE_USERS_KEY) || '[]');
    const lastActive = JSON.parse(localStorage.getItem(LAST_ACTIVE_KEY) || '{}');
    const now = Date.now();
    const thirtySeconds = 30 * 1000;
    
    // 过滤掉30秒内无活动的用户
    const activeUsers = onlineUsers.filter((userId: string) => {
      const lastActiveTime = lastActive[userId] || 0;
      return now - lastActiveTime < thirtySeconds;
    });
    
    // 确保用户ID唯一
    const uniqueUsers = [...new Set(activeUsers)];
    
    // 更新在线用户列表
    localStorage.setItem(ONLINE_USERS_KEY, JSON.stringify(uniqueUsers));
    
    return uniqueUsers;
  } catch (error) {
    console.error('Error getting online users:', error);
    return [];
  }
};

// 页面卸载时移除用户
if (isBrowser) {
  window.addEventListener('beforeunload', () => {
    // 注意：这里无法直接获取userId，实际项目中需要在组件中处理
    console.log('Page unload - should remove user');
  });
}

// 定期更新在线状态
if (isBrowser) {
  setInterval(() => {
    // 刷新在线用户列表
    getOnlineUsers();
  }, 10000); // 每10秒更新一次
}

// 查找匹配用户
export const findMatch = async (userId: string): Promise<MatchResult> => {
  // 1. 先添加自己到在线列表
  addOnlineUser(userId);
  
  // 2. 清理并获取在线用户列表
  const onlineUserList = getOnlineUsers().filter(id => id !== userId);
  
  console.log('Online users before matching:', onlineUserList);
  console.log('Current user:', userId);
  
  if (onlineUserList.length > 0) {
    // 选择第一个在线用户
    const matchedUserId = onlineUserList[0];
    console.log('Matched with:', matchedUserId);
    return {
      status: 'matched',
      matchedUserId,
      message: '匹配成功！'
    };
  }

  // 3. 当无在线用户时，不返回模拟用户，而是提示无匹配对象
  console.log('No online users found');
  return {
    status: 'idle',
    message: '暂无可用的匹配对象'
  };
};

// 取消匹配
export const cancelMatch = (userId: string): void => {
  // 实现取消匹配的逻辑
  removeOnlineUser(userId);
};