import React, { useEffect, useState, useRef } from 'react';
import { Card, Select, Button, Table, Tag, Progress, Row, Col, message, Typography } from 'antd';
import { PlayCircleOutlined, DownloadOutlined, ReloadOutlined, HistoryOutlined } from '@ant-design/icons';
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
      const res = await client.get<any, ApiResponse<TaskHistory[]>>('/tasks/history');
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
      message.error('Please select a configuration');
      return;
    }
    setTriggering(true);
    try {
      const res = await client.post<any, ApiResponse<{ taskId: string }>>('/trigger', { configId: selectedConfigId });
      const taskId = res.data?.taskId || (res as any).taskId; // Handle flexible mock response
      if (taskId) {
        message.success('Task started! ID: ' + taskId);
        setCurrentTaskId(taskId);
        startPolling(taskId);
      } else {
        message.error('Failed to start task');
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

        if (['completed', 'failed'].includes(data.status)) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          fetchHistory(); // Refresh history
          if (data.status === 'completed') {
            message.success('Task finished successfully');
          } else {
            message.error('Task failed');
          }
        }
      } catch (e) {
        console.error('Polling error', e);
      }
    }, 2000);
  };

  const columns: ColumnsType<TaskHistory> = [
    {
      title: 'Time',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (t) => dayjs(t).format('MM-DD HH:mm:ss')
    },
    {
      title: 'Config ID',
      dataIndex: 'config_id',
      key: 'config_id',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'running') color = 'processing';
        if (status === 'completed') color = 'success';
        if (status === 'failed') color = 'error';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Items',
      dataIndex: 'items_crawled',
      key: 'items_crawled',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        record.csv_url ?
          <Button href={record.csv_url} target="_blank" size="small" icon={<DownloadOutlined />}>CSV</Button> : '-'
      )
    }
  ];

  return (
    <div>
      <Row gutter={24}>
        <Col span={24} lg={10}>
          <Card title={<><PlayCircleOutlined /> Trigger New Job</>} bordered={false} style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Select Configuration:</Text>
              <Select
                style={{ width: '100%', marginTop: 8 }}
                placeholder="Choose a config to run"
                onChange={setSelectedConfigId}
                loading={configs.length === 0}
              >
                {configs.map(c => (
                  <Select.Option key={c.id} value={c.id}>
                    {c.keyword} ({c.platform})
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
              START CRAWLING
            </Button>

            {currentTaskId && taskStatus && (
              <div style={{ marginTop: 24, padding: 16, background: '#fafafa', borderRadius: 8 }}>
                <Text strong>Current Task: {currentTaskId}</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color={taskStatus.status === 'running' ? 'blue' : taskStatus.status === 'completed' ? 'green' : 'red'}>
                    {taskStatus.status.toUpperCase()}
                  </Tag>
                  <span style={{ marginLeft: 8 }}>Items: {taskStatus.items_crawled}</span>
                </div>
                {taskStatus.status === 'running' && <Progress percent={60} status="active" showInfo={false} style={{ marginTop: 8 }} />}
              </div>
            )}
          </Card>
        </Col>

        <Col span={24} lg={14}>
          <Card
            title={<><HistoryOutlined /> History</>}
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
