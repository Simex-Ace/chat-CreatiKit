-- 创建消息表
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX idx_messages_receiver_sender ON messages(receiver_id, sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- 启用RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- 允许用户查看自己发送或接收的消息
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (
    sender_id = auth.uid()::text OR receiver_id = auth.uid()::text
  );

-- 允许用户发送消息（插入）
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()::text
  );

-- 允许用户更新自己的消息
CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (
    sender_id = auth.uid()::text
  );

-- 允许用户删除自己的消息
CREATE POLICY "Users can delete their own messages" ON messages
  FOR DELETE USING (
    sender_id = auth.uid()::text
  );

-- 创建用户在线状态表
CREATE TABLE user_status (
  user_id TEXT PRIMARY KEY,
  is_online BOOLEAN DEFAULT FALSE,
  last_active TIMESTAMP DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_user_status_online ON user_status(is_online);

-- 启用RLS
ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- 允许用户查看自己的状态
CREATE POLICY "Users can view their own status" ON user_status
  FOR SELECT USING (
    user_id = auth.uid()::text
  );

-- 允许用户更新自己的状态
CREATE POLICY "Users can update their own status" ON user_status
  FOR ALL USING (
    user_id = auth.uid()::text
  );