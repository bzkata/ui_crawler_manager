// src/pages/DataPage.tsx
import { Table, Card, Statistic, Spin, message } from 'antd';
import { useEffect, useState } from 'react';
import api from '../api/client';

export const dataApi = {
  posts: (page = 0, size = 20) => api.get('/data/posts', { params: { page, size } }),
  stats: () => api.get('/data/stats'),
};

interface Post {
  note_id: string;
  title: string;
  content: string;
  nickname: string;
  likes: number;
  comments: number;
  create_time: number[];
}

interface Stats {
  totalPosts: number;
  negativePosts: number;
  negativeRate: number;
  avgLikes: number;
}

interface PostsResponse {
  size: number;
  totalPages: number;
  currentPage: number;
  content: Post[];
}

export default function DataPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<Stats>({ totalPosts: 0, negativePosts: 0, negativeRate: 0, avgLikes: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [postsRes, statsRes] = await Promise.all([
        dataApi.posts(page, 20),
        dataApi.stats()
      ]);
      const postsData = postsRes as unknown as PostsResponse;
      const statsData = statsRes as unknown as Stats;
      setPosts(postsData.content || []);
      // 使用 stats.totalPosts 作为总数，或者根据 totalPages 计算
      setTotal(statsData.totalPosts || (postsData.totalPages || 0) * (postsData.size || 20) || 0);
      setStats(statsData);
    } catch (e) {
      message.error('加载数据失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30秒刷新
    return () => clearInterval(interval);
  }, [page]);

  const formatTime = (timeArray: number[]) => {
    if (!Array.isArray(timeArray) || timeArray.length < 6) return '';
    const [year, month, day, hour, minute, second] = timeArray;
    return new Date(year, month - 1, day, hour, minute, second).toLocaleString();
  };

  const columns = [
    { title: '标题', dataIndex: 'title', width: 300, ellipsis: true },
    { title: '作者', dataIndex: 'nickname' },
    { title: '点赞', dataIndex: 'likes' },
    { title: '评论', dataIndex: 'comments' },
    { title: '时间', dataIndex: 'create_time', render: (t: number[]) => formatTime(t) },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 24 }}>
          <Statistic title="总帖数" value={stats.totalPosts} />
          <Statistic title="负面帖数" value={stats.negativePosts} />
          <Statistic title="负面占比" value={`${stats.negativeRate}%`} />
          <Statistic title="平均点赞" value={stats.avgLikes} />
        </div>
      </Card>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={posts}
          rowKey="note_id"
          pagination={{
            current: page + 1,
            pageSize: 20,
            total: total,
            onChange: (p) => setPage(p - 1),
          }}
        />
      </Spin>
    </div>
  );
}