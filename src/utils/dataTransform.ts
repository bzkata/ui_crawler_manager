import type { UnifiedContent, UnifiedComment, FileInfo, TransformResult } from '../types/dataTransform';

// 检测平台类型
export function detectPlatform(data: any[], path?: string): string {
  // 1. 优先尝试从路径中识别平台
  if (path) {
    const lowerPath = path.toLowerCase();
    if (lowerPath.includes('douyin')) return 'douyin';
    if (lowerPath.includes('bili') || lowerPath.includes('bilibili')) return 'bili';
    if (lowerPath.includes('kuaishou') || lowerPath.includes('ks')) return 'kuaishou';
    if (lowerPath.includes('xhs') || lowerPath.includes('xiaohongshu')) return 'xhs';
    if (lowerPath.includes('weibo')) return 'weibo';
  }

  if (!data || data.length === 0) return 'unknown';
  
  const firstItem = data[0];
  
  // 2. 通过字段特征判断平台（按照特征唯一性优先级）
  if (firstItem.aweme_id) {
    return 'douyin'; // 抖音
  }
  
  if (firstItem.video_id) {
    // 哔哩哔哩有video_comment字段
    if (firstItem.video_comment !== undefined || firstItem.video_danmaku !== undefined) {
      return 'bili';
    }
    // 快手有video_play_url字段
    if (firstItem.video_play_url) {
      return 'kuaishou';
    }
    return 'bili'; // 默认作为bili
  }
  
  if (firstItem.note_id) {
    // 微博有gender字段（内容和评论都有）
    if (firstItem.gender !== undefined || firstItem.create_date_time) {
      return 'weibo';
    }
    // 小红书有type字段（video/normal）或者tag_list字段
    if (firstItem.type !== undefined || firstItem.tag_list !== undefined) {
      return 'xhs';
    }
    // 如果有comment_id，且没有gender，可能是小红书的评论
    if (firstItem.comment_id) {
      return 'xhs';
    }
    return 'xhs'; // 默认作为小红书
  }
  
  return 'unknown';
}

// 检测数据类型（内容或评论）
export function detectDataType(data: any[]): 'content' | 'comment' {
  if (!data || data.length === 0) return 'content';
  
  const firstItem = data[0];
  
  // 评论数据通常有 comment_id 字段
  if (firstItem.comment_id) {
    return 'comment';
  }
  
  // 内容数据通常有 note_id, aweme_id, video_id 等字段
  if (firstItem.note_id || firstItem.aweme_id || firstItem.video_id) {
    return 'content';
  }
  
  return 'content';
}

// 将字符串数字转换为数字
function parseNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // 处理"1万"这样的格式
    if (value.includes('万')) {
      return parseFloat(value.replace('万', '')) * 10000;
    }
    if (value.includes('千')) {
      return parseFloat(value.replace('千', '')) * 1000;
    }
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

// 获取时间戳（毫秒）
function getTimestamp(value: any): number {
  if (typeof value === 'number') {
    // 如果是10位数字，可能是秒，转换为毫秒
    if (value < 10000000000) {
      return value * 1000;
    }
    return value;
  }
  if (typeof value === 'string') {
    const num = parseInt(value);
    if (!isNaN(num)) {
      if (num < 10000000000) {
        return num * 1000;
      }
      return num;
    }
  }
  return Date.now();
}

// 转换内容数据
export function transformContent(data: any[], platform: string): UnifiedContent[] {
  return data.map((item) => {
    const unified: UnifiedContent = {
      id: item.note_id || item.aweme_id || item.video_id || '',
      title: item.title || item.desc || '',
      content: item.desc || item.content || item.title || '',
      create_time: getTimestamp(item.time || item.create_time || item.last_update_time),
      user_id: item.user_id || '',
      nickname: item.nickname || '',
      avatar: item.avatar || '',
      liked_count: parseNumber(item.liked_count),
      comment_count: parseNumber(item.comment_count || item.comments_count || item.video_comment),
      share_count: parseNumber(item.share_count || item.shared_count || item.video_share_count),
      url: item.note_url || item.aweme_url || item.video_url || '',
      ip_location: item.ip_location || '',
      source_keyword: item.source_keyword || '',
      platform: platform,
    };
    
    // 保留其他字段
    Object.keys(item).forEach(key => {
      if (!unified.hasOwnProperty(key)) {
        unified[key] = item[key];
      }
    });
    
    return unified;
  });
}

// 转换评论数据
export function transformComment(data: any[], platform: string): UnifiedComment[] {
  return data.map((item) => {
    const unified: UnifiedComment = {
      comment_id: item.comment_id || '',
      create_time: getTimestamp(item.create_time),
      content_id: item.note_id || item.aweme_id || item.video_id || '',
      content: item.content || '',
      user_id: item.user_id || '',
      nickname: item.nickname || '',
      avatar: item.avatar || '',
      like_count: parseNumber(item.like_count || item.comment_like_count),
      parent_comment_id: item.parent_comment_id || 0,
      sub_comment_count: parseNumber(item.sub_comment_count || 0),
      ip_location: item.ip_location || '',
      platform: platform,
    };
    
    // 保留其他字段
    Object.keys(item).forEach(key => {
      if (!unified.hasOwnProperty(key)) {
        unified[key] = item[key];
      }
    });
    
    return unified;
  });
}

import Papa from 'papaparse';

// ... (existing helper functions)

// 解析CSV文件
export async function parseCsvFile(file: File, path?: string): Promise<FileInfo> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data;
          const filePath = path || (file as any).path || (file as any).webkitRelativePath || file.name;
          const platform = detectPlatform(data, filePath);
          const type = detectDataType(data);

          resolve({
            name: file.name,
            size: file.size,
            type: type,
            count: data.length,
            platform: platform,
            path: filePath,
            data: data,
          });
        } catch (error) {
          reject(new Error(`解析CSV文件失败: ${error}`));
        }
      },
      error: (error) => {
        reject(new Error(`读取文件失败: ${error.message}`));
      }
    });
  });
}

// 解析文件（支持JSON和CSV）
export async function parseFile(file: File, path?: string): Promise<FileInfo> {
  if (file.name.toLowerCase().endsWith('.csv')) {
    return parseCsvFile(file, path);
  }
  return parseJsonFile(file, path);
}

// 解析JSON文件
export async function parseJsonFile(file: File, path?: string): Promise<FileInfo> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        
        if (!Array.isArray(data)) {
          reject(new Error('JSON文件必须包含数组数据'));
          return;
        }
        
        const filePath = path || (file as any).path || (file as any).webkitRelativePath || file.name;
        const platform = detectPlatform(data, filePath);
        const type = detectDataType(data);
        
        resolve({
          name: file.name,
          size: file.size,
          type: type,
          count: data.length,
          platform: platform,
          path: filePath,
          data: data,
        });
      } catch (error) {
        reject(new Error(`解析JSON文件失败: ${error}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };
    
    reader.readAsText(file);
  });
}

// 转换文件数据
export function transformFile(fileInfo: FileInfo, format: 'json' | 'csv' = 'json'): TransformResult {
  const platform = fileInfo.platform || 'unknown';
  let transformedData: UnifiedContent[] | UnifiedComment[];
  
  if (fileInfo.type === 'content') {
    transformedData = transformContent(fileInfo.data, platform);
  } else {
    transformedData = transformComment(fileInfo.data, platform);
  }
  
  // 生成新文件名：【平台名】-【原文件名】-formatted.[格式]
  const originalName = fileInfo.name.replace(/\.(json|csv)$/i, '');
  const newFileName = `${platform}-${originalName}-formatted.${format}`;

  // 如果是CSV格式，需要将数据转换为CSV字符串
  // 注意：Types currently defines data as UnifiedContent[] | UnifiedComment[], which works for JSON.
  // For CSV, we might want to return the string content or handle wrapping outside?
  // Ideally TransformResult.data implies the structure content.
  // But standard flow returns JSON object.
  // If we want CSV string, we should probably handle it here or in the page.
  // Let's modify logic: The page will handle the "stringification" to JSON or CSV.
  // Wait, `transformFile` returns `TransformResult` with `data`.
  // Let's adhere to returning objects here, and let the zipper handle conversion.
  // BUT the request says "Download .csv" or "Download .json".
  
  return {
    fileName: newFileName,
    originalFileName: fileInfo.name,
    type: fileInfo.type,
    count: transformedData.length,
    data: transformedData, // Return objects, page handles serialization
  };
}

// 将数据转换为CSV字符串
export function dataToCsv(data: any[]): string {
  return Papa.unparse(data);
}
