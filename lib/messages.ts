import pusher from './pusher';
import getSupabase from './supabase';

// 消息类型
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

// 发送消息
export const sendMessage = async (
  senderId: string,
  receiverId: string,
  content: string
): Promise<Message | null> => {
  try {
    // 通过API路由发送消息
    const response = await fetch('/api/messages/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ senderId, receiverId, content }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData?.error || errData?.details || `发送失败 (${response.status})`;
      throw new Error(errMsg);
    }

    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
};

// 标记消息为已读
export const markMessageAsRead = async (messageId: string): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn('Supabase not configured');
    return false;
  }
  
  try {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', messageId);

    if (error) {
      console.error('Error marking message as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking message as read:', error);
    return false;
  }
};

// 获取聊天历史记录
export const getChatHistory = async (
  userId: string,
  partnerId: string,
  limit: number = 20,
  offset: number = 0
): Promise<Message[]> => {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn('Supabase not configured');
    return [];
  }
  
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }

    return messages || [];
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return [];
  }
};

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

// 订阅消息频道
export const subscribeToMessages = (
  userId: string,
  partnerId: string,
  callback: (message: Message) => void
): void => {
  if (!pusher) return;
  
  // 统一频道命名规则，确保双方订阅同一个频道
  const sortedIds = [userId, partnerId].sort();
  const channelHash = sortedIds.map(generateChannelHash).join('-');
  const channelName = `public-chat-${channelHash}`;
  const channel = pusher.subscribe(channelName);

  channel.bind('new-message', (data: Message) => {
    // 只处理对方发来的消息，自己的消息已由 API 返回添加，避免重复
    if (data.sender_id !== userId) {
      callback(data);
    }
  });
};

// 取消订阅消息频道
export const unsubscribeFromMessages = (
  userId: string,
  partnerId: string
): void => {
  if (!pusher) return;
  
  // 统一频道命名规则，确保取消订阅正确的频道
  const sortedIds = [userId, partnerId].sort();
  const channelHash = sortedIds.map(generateChannelHash).join('-');
  const channelName = `public-chat-${channelHash}`;
  pusher.unsubscribe(channelName);
};