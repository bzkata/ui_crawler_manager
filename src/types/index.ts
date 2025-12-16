export type Platform = 'xhs' | 'douyin' | 'zhihu';

export interface Config {
  id: string;
  keyword: string;
  platform: Platform;
  max_pages: number;
  fetch_comments: boolean;
}

export interface Cookie {
  id: string;
  platform: Platform;
  value: string;
  expiry?: string;
  note?: string;
}

export interface TaskHistory {
  id: string;
  config_id: string;
  start_time: string;
  end_time?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  items_crawled: number;
  csv_url?: string;
}

export interface ApiResponse<T> {
  code: number;
  data: T;
  msg: string;
}
