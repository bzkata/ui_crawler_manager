import React, { useEffect, useState, useRef } from 'react';
import { Card, Select, Button, Table, Tag, Progress, Row, Col, message, Typography } from 'antd';
import { PlayCircleOutlined, ReloadOutlined, HistoryOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import client from '../api/client';
import type { Config, TaskHistory, ApiResponse } from '../types';
import dayjs from 'dayjs';

const { Text } = Typography;

const TriggerPage: React.FC = () => {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskHistory | null>(null);

  const [history, setHistory] = useState<TaskHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load configs for dropdown
  useEffect(() => {
    client.get<any, ApiResponse<Config[]>>('/configs').then(res => {
      if (res.code === 0 || Array.isArray(res)) {
        setConfigs(Array.isArray(res) ? res : res.data);
      }
    });
    fetchHistory();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await client.get<any, ApiResponse<TaskHistory[]>>('/tasks');
      if (res.code === 0 || Array.isArray(res)) {
        setHistory(Array.isArray(res) ? res : res.data);
      }
    } catch (e) {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleTrigger = async () => {
    if (!selectedConfigId) {
      message.error('请选择配置');
      return;
    }
    setTriggering(true);
    try {
      const res = await client.post<any, ApiResponse<{ taskId: string }>>('/tasks/trigger', { configId: selectedConfigId });
      const taskId = res.data?.taskId || (res as any).taskId; // Handle flexible mock response
      if (taskId) {
        message.success('任务已启动! ID: ' + taskId);
        setCurrentTaskId(taskId);
        startPolling(taskId);
      } else {
        message.error('启动任务失败');
      }
    } catch (e) {
      console.error(e);
      // If 404/error, mocking the flow for UI demo
      // In real app, remove this mock fallback
      // message.warning('Using mock task for demo');
      // setCurrentTaskId('mock-task-123');
      // startPolling('mock-task-123');
    } finally {
      setTriggering(false);
    }
  };

  const startPolling = (taskId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    // Poll every 2 seconds
    pollingRef.current = setInterval(async () => {
      try {
        const res = await client.get<any, ApiResponse<TaskHistory>>(`/tasks/${taskId}`);
        const data = res.data || (res as any);
        setTaskStatus(data);

        if (['SUCCESS', 'FAILED'].includes(data.status)) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          fetchHistory(); // Refresh history
          if (data.status === 'SUCCESS') {
            message.success('任务成功完成');
          } else {
            message.error('任务失败');
          }
        }
      } catch (e) {
        console.error('Polling error', e);
      }
    }, 2000);
  };

  const columns: ColumnsType<TaskHistory> = [
    {
      title: '时间',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (t) => dayjs(t).format('MM-DD HH:mm:ss')
    },
    {
      title: '配置 ID',
      dataIndex: 'config_id',
      key: 'config_id',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'RUNNING') color = 'processing';
        if (status === 'SUCCESS') color = 'success';
        if (status === 'FAILED') color = 'error';
        if (status === 'PENDING') color = 'orange';

        const map: Record<string, string> = {
          'RUNNING': '运行中',
          'SUCCESS': '成功',
          'FAILED': '失败',
          'PENDING': '等待中'
        };
        return <Tag color={color}>{map[status] || status}</Tag>;
      }
    },
    {
      title: '抓取数',
      dataIndex: 'fetched_count',
      key: 'fetched_count',
    },
    /*
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
         record.log_path ? <Button disabled size="small">日志</Button> : '-'
      )
    }
    */
  ];

  return (
    <div>
      <Row gutter={24}>
        <Col span={24} lg={10}>
          <Card title={<><PlayCircleOutlined /> 触发新任务</>} bordered={false} style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>选择配置:</Text>
              <Select
                style={{ width: '100%', marginTop: 8 }}
                placeholder="选择要运行的配置"
                onChange={setSelectedConfigId}
                loading={configs.length === 0}
              >
                {configs.map(c => (
                  <Select.Option key={c.id} value={c.id}>
                    {c.keywords} ({c.platform})
                  </Select.Option>
                ))}
              </Select>
            </div>

            <Button
              type="primary"
              size="large"
              danger
              icon={<PlayCircleOutlined />}
              onClick={handleTrigger}
              loading={triggering}
              block
              disabled={!selectedConfigId}
            >
              开始爬取
            </Button>

            {currentTaskId && taskStatus && (
              <div style={{ marginTop: 24, padding: 16, background: '#fafafa', borderRadius: 8 }}>
                <Text strong>当前任务: {currentTaskId}</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color={taskStatus.status === 'RUNNING' ? 'blue' : taskStatus.status === 'SUCCESS' ? 'green' : 'red'}>
                    {taskStatus.status === 'RUNNING' ? '运行中' : taskStatus.status === 'SUCCESS' ? '已完成' : '失败'}
                  </Tag>
                  <span style={{ marginLeft: 8 }}>抓取数: {taskStatus.fetched_count}</span>
                </div>
                {taskStatus.status === 'RUNNING' && <Progress percent={60} status="active" showInfo={false} style={{ marginTop: 8 }} />}
              </div>
            )}
          </Card>
        </Col>

        <Col span={24} lg={14}>
          <Card
            title={<><HistoryOutlined /> 历史记录</>}
            extra={<Button size="small" icon={<ReloadOutlined />} onClick={fetchHistory} />}
            bordered={false}
          >
            <Table
              rowKey="id"
              dataSource={history}
              columns={columns}
              loading={historyLoading}
              size="small"
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TriggerPage;
