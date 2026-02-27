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

// 生成匿名ID
export const generateAnonymousId = (): string => {
  return `匿名_${generateChineseNickname()}`;
};

// 获取匿名ID
export const getAnonymousId = (): string => {
  if (!isBrowser) {
    // 在服务器端，返回一个临时ID
    return generateAnonymousId();
  }

  const storedId = localStorage.getItem('anonymousId');
  const storedExpiry = localStorage.getItem('anonymousIdExpiry');
  const now = Date.now();

  // 检查是否存在有效ID
  if (storedId && storedExpiry) {
    const expiry = parseInt(storedExpiry, 10);
    if (now < expiry) {
      return storedId;
    }
  }

  // 生成新ID
  const newId = generateAnonymousId();
  const newExpiry = now + 30 * 24 * 60 * 60 * 1000; // 30天

  localStorage.setItem('anonymousId', newId);
  localStorage.setItem('anonymousIdExpiry', newExpiry.toString());

  return newId;
};

// 重新生成匿名ID
export const regenerateAnonymousId = (): string => {
  const newId = generateAnonymousId();
  
  if (isBrowser) {
    const newExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30天
    localStorage.setItem('anonymousId', newId);
    localStorage.setItem('anonymousIdExpiry', newExpiry.toString());
  }

  return newId;
};

// 清除匿名ID
export const clearAnonymousId = (): void => {
  if (isBrowser) {
    localStorage.removeItem('anonymousId');
    localStorage.removeItem('anonymousIdExpiry');
  }
};