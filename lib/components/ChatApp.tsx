'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getAnonymousId, regenerateAnonymousId } from '@/lib/auth';
import { findMatch, MatchStatus } from '@/lib/matching';
import { sendMessage, getChatHistory, subscribeToMessages, unsubscribeFromMessages, Message } from '@/lib/messages';
import { setupActivityListener, subscribeToStatusChanges, getUserStatus, isUserOnline } from '@/lib/onlineStatus';

const ChatApp: React.FC = () => {
  // 状态管理
  const [userId, setUserId] = useState<string>('');
  const [matchedUserId, setMatchedUserId] = useState<string | null>(null);
  const [matchStatus, setMatchStatus] = useState<MatchStatus>('idle');
  const [matchMessage, setMatchMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [partnerOnline, setPartnerOnline] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // 在客户端获取真实的匿名ID
  useEffect(() => {
    setUserId(getAnonymousId());
  }, []);

  // 重新生成身份
  const handleRegenerateId = () => {
    const newId = regenerateAnonymousId();
    setUserId(newId);
    setMatchedUserId(null);
    setMatchStatus('idle');
    setMessages([]);
    setPartnerOnline(false);
  };

  // 设置活动监听器
  useEffect(() => {
    setupActivityListener(userId);
  }, [userId]);

  // 订阅在线状态变化
  useEffect(() => {
    subscribeToStatusChanges((data) => {
      if (data.user_id === matchedUserId) {
        setPartnerOnline(data.is_online);
      }
    });
  }, [matchedUserId]);

  // 获取匹配用户的在线状态
  useEffect(() => {
    const fetchPartnerStatus = async () => {
      if (matchedUserId) {
        const status = await getUserStatus(matchedUserId);
        if (status) {
          setPartnerOnline(isUserOnline(status.last_active));
        }
      }
    };

    fetchPartnerStatus();
  }, [matchedUserId]);

  // 开始匹配
  const handleMatch = async () => {
    setMatchStatus('searching');
    setMatchMessage('寻找中...');
    
    try {
      const result = await findMatch(userId);
      setMatchStatus(result.status);
      setMatchMessage(result.message || '');
      
      if (result.status === 'matched' && result.matchedUserId) {
        setMatchedUserId(result.matchedUserId);
        // 加载聊天历史记录
        loadChatHistory(result.matchedUserId);
      }
    } catch (error) {
      console.error('Error matching:', error);
      setMatchStatus('idle');
      setMatchMessage('匹配失败，请重试');
    }
  };

  // 加载聊天历史记录
  const loadChatHistory = async (partnerId: string) => {
    setIsLoading(true);
    try {
      const history = await getChatHistory(userId, partnerId);
      setMessages(history.reverse()); // 按时间正序排列
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !matchedUserId) return;

    const message = inputMessage.trim();
    setInputMessage('');
    setIsTyping(true);
    setSendError(null);

    try {
      const newMessage = await sendMessage(userId, matchedUserId, message);
      if (newMessage) {
        setMessages(prev => [...prev, newMessage]);
      }
    } catch (error) {
      setSendError(error instanceof Error ? error.message : '发送失败');
    } finally {
      setIsTyping(false);
    }
  };

  // 用 ref 保持回调最新，避免闭包陈旧导致收不到消息
  const setMessagesRef = useRef(setMessages);
  setMessagesRef.current = setMessages;

  // 订阅消息
  useEffect(() => {
    if (matchedUserId) {
      subscribeToMessages(userId, matchedUserId, (newMessage) => {
        setMessagesRef.current((prev) => [...prev, newMessage]);
      });

      return () => {
        unsubscribeFromMessages(userId, matchedUserId);
      };
    }
  }, [userId, matchedUserId]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* 身份信息区 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">匿名聊天</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              您的身份: {userId || '加载中...'}
            </p>
          </div>
          <button
            onClick={handleRegenerateId}
            disabled={!userId}
            className={`px-4 py-2 rounded-md transition-colors ${userId ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-400 text-gray-300 cursor-not-allowed'}`}
          >
            重新生成身份
          </button>
        </div>
      </div>

      {/* 匹配区域 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 shadow-md">
        <button
          onClick={handleMatch}
          disabled={matchStatus === 'searching' || !userId}
          className={`w-full py-3 rounded-md font-medium transition-all ${(matchStatus === 'searching' || !userId) ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}
        >
          {!userId ? '加载中...' : matchStatus === 'searching' ? '寻找中...' : '开始匹配'}
        </button>
        {matchMessage && (
          <p className="mt-2 text-center text-gray-600 dark:text-gray-300">
            {matchMessage}
          </p>
        )}
      </div>

      {/* 聊天窗口 */}
      {matchedUserId && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {/* 聊天头部 */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className={`status-indicator ${partnerOnline ? 'status-online' : 'status-offline'}`}></div>
              <h3 className="font-medium">聊天对象: {matchedUserId}</h3>
              <span className="ml-2 text-xs text-gray-500">
                {partnerOnline ? '在线' : '离线'}
              </span>
            </div>
          </div>

          {/* 消息列表 */}
          <div className="h-96 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <p>加载中...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex justify-center items-center h-full text-gray-500">
                <p>开始聊天吧！</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`chat-message mb-4 ${message.sender_id === userId ? 'text-right' : 'text-left'}`}
                >
                  <div
                    className={`inline-block max-w-[80%] p-3 rounded-lg ${message.sender_id === userId ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-700'}`}
                  >
                    <p className="text-xs mb-1 font-medium">
                      {message.sender_id === userId ? '我' : message.sender_id.split('_')[1]}
                    </p>
                    <p>{message.content}</p>
                    <p className="text-xs mt-1 text-gray-500">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 消息输入框 */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {sendError && (
              <p className="mb-2 text-sm text-red-600 dark:text-red-400">{sendError}</p>
            )}
            <div className="flex">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="输入消息..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={handleSendMessage}
                disabled={isTyping || !inputMessage.trim()}
                className={`px-6 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition-colors ${isTyping || !inputMessage.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                发送
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatApp;