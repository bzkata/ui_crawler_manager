export type Platform = 'xhs' | 'dy' | 'ks' | 'bili' | 'wb' | 'tieba' | 'zhihu';
// Backend returns caps for status usually, but let's define what we expect. User said: "PENDING"|"RUNNING"|"SUCCESS"|"FAILED"
export type TaskStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
export type LoginType = 'qrcode' | 'phone' | 'cookie';
export type CrawlType = 'search' | 'detail' | 'creator';
export type SaveDataOption = 'csv' | 'db' | 'json' | 'sqlite' | 'mongodb' | 'excel';

export interface Config {
  id: string;
  keyword?: string;
  keywords: string;
  platform: Platform;
  type: CrawlType;
  lt: LoginType;
  cookies?: string; // if lt === 'cookie'
  get_comment: string; // "true" | "false"
  get_sub_comment: string; // "true" | "false"
  save_data_option: SaveDataOption;
  max_pages: number;
  description?: string;
}

export interface Cookie {
  id: string;
  platform: Platform;
  cookie_value: string; // was value
  expiry?: string;
  remark?: string; // was note
  enabled?: boolean; // new
}

export interface TaskHistory {
  id: string;
  config_id: string;
  start_time: string;
  end_time?: string;
  status: TaskStatus;
  fetched_count?: number; // was items_crawled
  log_path?: string;
}

export interface ApiResponse<T> {
  code: number;
  data: T;
  msg: string;
}
