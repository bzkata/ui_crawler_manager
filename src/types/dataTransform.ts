// 统一的内容数据格式
export interface UnifiedContent {
  id: string; // 内容ID（note_id/aweme_id/video_id）
  title?: string; // 标题
  content?: string; // 内容/描述
  create_time: number; // 创建时间（时间戳，毫秒）
  user_id: string; // 用户ID
  nickname: string; // 昵称
  avatar?: string; // 头像
  liked_count: number; // 点赞数
  comment_count: number; // 评论数
  share_count: number; // 分享数
  url?: string; // 链接
  ip_location?: string; // IP位置
  source_keyword?: string; // 来源关键词
  platform: string; // 平台标识
  // 其他字段作为扩展
  [key: string]: any;
}

// 统一的评论数据格式
export interface UnifiedComment {
  comment_id: string; // 评论ID
  create_time: number; // 创建时间（时间戳，毫秒）
  content_id: string; // 关联内容ID（note_id/aweme_id/video_id）
  content: string; // 评论内容
  user_id: string; // 用户ID
  nickname: string; // 昵称
  avatar?: string; // 头像
  like_count: number; // 点赞数
  parent_comment_id?: string | number; // 父评论ID
  sub_comment_count: number; // 子评论数
  ip_location?: string; // IP位置
  platform: string; // 平台标识
  // 其他字段作为扩展
  [key: string]: any;
}

// 文件信息
export interface FileInfo {
  name: string; // 文件名
  size: number; // 文件大小
  type: 'content' | 'comment'; // 数据类型
  count: number; // 数据条数
  platform?: string; // 平台标识
  data: any[]; // 原始数据
}

// 转换结果
export interface TransformResult {
  fileName: string; // 转换后的文件名
  originalFileName: string; // 原始文件名
  type: 'content' | 'comment'; // 数据类型
  count: number; // 转换后的数据条数
  data: UnifiedContent[] | UnifiedComment[]; // 转换后的数据
}
