import MockAdapter from 'axios-mock-adapter';
import client from './client';
import type { Config, Cookie, TaskHistory, ApiResponse } from '../types';

// Create mock adapter
const mock = new MockAdapter(client, { delayResponse: 500 });

// Mock Data Store
let configs: Config[] = [
  { id: '1', platform: 'xhs', keywords: 'React教程,前端开发', type: 'search', lt: 'qrcode', get_comment: 'true', get_sub_comment: 'false', save_data_option: 'json', max_pages: 10 },
  { id: '2', platform: 'bili', keywords: '原神,游戏攻略', type: 'search', lt: 'cookie', get_comment: 'false', get_sub_comment: 'false', save_data_option: 'csv', max_pages: 5 },
];

let cookies: Cookie[] = [
  { id: '1', platform: 'xhs', cookie_value: 'session=1234567890abcdef;', enabled: true, expiry: '2026-12-31T23:59:59', remark: '测试账号1' },
  { id: '2', platform: 'dy', cookie_value: 'session=0987654321fedcba;', enabled: false, expiry: '2025-01-01T00:00:00', remark: '过期账号' },
];

let tasks: TaskHistory[] = [
  { id: 'task_1', config_id: '1', start_time: '2026-01-13T10:00:00', status: 'SUCCESS', fetched_count: 156, log_path: '/logs/1.log' },
  { id: 'task_2', config_id: '2', start_time: '2026-01-13T11:30:00', status: 'FAILED', fetched_count: 0, log_path: '/logs/2.log' },
];

// Helper to wrap response
const success = <T>(data: T): [number, ApiResponse<T>] => [200, { code: 0, data, msg: 'success' }];
const error = (msg: string): [number, ApiResponse<null>] => [200, { code: 1, data: null, msg }];

console.log('[Mock] API Mocking Enabled');

// --- Configs API ---
mock.onGet('/configs').reply(() => success(configs));

mock.onPost('/configs').reply((config) => {
  const newConfig = JSON.parse(config.data);
  newConfig.id = Math.random().toString(36).substr(2, 9);
  configs.push(newConfig);
  return success(newConfig);
});

mock.onPut(new RegExp('/configs/.*')).reply((config) => {
  const id = config.url?.split('/').pop();
  const data = JSON.parse(config.data);
  const index = configs.findIndex(c => c.id === id);
  if (index !== -1) {
    configs[index] = { ...configs[index], ...data };
    return success(configs[index]);
  }
  return error('Config not found');
});

mock.onDelete(new RegExp('/configs/.*')).reply((config) => {
  const id = config.url?.split('/').pop();
  configs = configs.filter(c => c.id !== id);
  return success(null);
});

// --- Cookies API ---
mock.onGet('/cookies').reply(() => success(cookies));

mock.onPost('/cookies').reply((config) => {
  const newCookie = JSON.parse(config.data);
  newCookie.id = Math.random().toString(36).substr(2, 9);
  newCookie.enabled = true;
  newCookie.expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days later
  cookies.push(newCookie);
  return success(newCookie);
});

mock.onPut(new RegExp('/cookies/.*')).reply((config) => {
  const id = config.url?.split('/').pop();
  const data = JSON.parse(config.data);
  const index = cookies.findIndex(c => c.id === id);
  if (index !== -1) {
    cookies[index] = { ...cookies[index], ...data };
    return success(cookies[index]);
  }
  return error('Cookie not found');
});

mock.onDelete(new RegExp('/cookies/.*')).reply((config) => {
  const id = config.url?.split('/').pop();
  cookies = cookies.filter(c => c.id !== id);
  return success(null);
});

mock.onGet('/cookies/random').reply(() => {
  // const platform = config.params.platform;
  // Just return a random cookie
  if (cookies.length > 0) {
    return success(cookies[Math.floor(Math.random() * cookies.length)]);
  }
  return success(null);
});

// --- Tasks API ---
mock.onGet('/tasks').reply(() => success(tasks));

mock.onPost('/tasks/trigger').reply((config) => {
  const { configId } = JSON.parse(config.data);
  const taskId = 'task_' + Math.random().toString(36).substr(2, 9);
  const newTask: TaskHistory = {
    id: taskId,
    config_id: configId,
    start_time: new Date().toISOString(),
    status: 'PENDING',
    fetched_count: 0
  };
  tasks.unshift(newTask); // Add to beginning

  // Simulate task progress in background
  setTimeout(() => {
    const t = tasks.find(t => t.id === taskId);
    if (t) t.status = 'RUNNING';
  }, 1000);

  setTimeout(() => {
    const t = tasks.find(t => t.id === taskId);
    if (t) {
      t.status = Math.random() > 0.2 ? 'SUCCESS' : 'FAILED';
      t.fetched_count = Math.floor(Math.random() * 200);
    }
  }, 8000);

  return success({ taskId });
});

mock.onGet(new RegExp('/tasks/.*')).reply((config) => {
  const id = config.url?.split('/').pop();
  const task = tasks.find(t => t.id === id);
  if (task) {
    // Increment count if running to simulate progress
    if (task.status === 'RUNNING') {
      task.fetched_count = (task.fetched_count || 0) + Math.floor(Math.random() * 5);
    }
    return success(task);
  }
  return error('Task not found');
});

// --- Data API ---
mock.onGet('/data/stats').reply(() => success({
  totalPosts: 12345,
  negativePosts: 123,
  negativeRate: 1.2,
  avgLikes: 567
}));

mock.onGet('/data/posts').reply((config) => {
  const { page = 0, size = 20 } = config.params || {};
  const mockPosts = Array.from({ length: size }).map((_, i) => ({
    note_id: `note_${page}_${i}`,
    title: `Mock Post Title ${page * size + i}`,
    content: `This is the mock content for post ${page * size + i}...`,
    nickname: `User_${Math.floor(Math.random() * 1000)}`,
    likes: Math.floor(Math.random() * 1000),
    comments: Math.floor(Math.random() * 100),
    create_time: [2026, 1, 13, 10, 30, 0]
  }));

  return success({
    content: mockPosts,
    totalPages: 50,
    totalElements: 1000,
    size: size,
    number: page
  });
});

export default mock;
