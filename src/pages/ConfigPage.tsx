import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, Switch, Space, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import client from '../api/client';
import type { Config, ApiResponse } from '../types';

const ConfigPage: React.FC = () => {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Config | null>(null);
  const [form] = Form.useForm();

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      // Assuming GET /configs returns list directly or { data: list }
      // Adjust based on actual API response structure. 
      // Using ApiResponse<Config[]> wrapper logic here.
      const res = await client.get<any, ApiResponse<Config[]>>('/configs');
      if (res.code === 0 || Array.isArray(res)) {
        // fallback if API returns array directly
        setConfigs(Array.isArray(res) ? res : res.data);
      } else {
        // If undefined or error structure
        setConfigs([]);
      }
    } catch (error) {
      console.error(error);
      // For demo purposes, if API fails, we might want to show empty or mock? 
      // mocking handled in client or just empty.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleAdd = () => {
    setEditingConfig(null);
    form.resetFields();
    form.setFieldsValue({ max_pages: 50, fetch_comments: false, platform: 'xhs' });
    setModalOpen(true);
  };

  const handleEdit = (record: Config) => {
    setEditingConfig(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await client.delete(`/configs/${id}`);
      message.success('Deleted successfully');
      fetchConfigs();
    } catch (error) {
      // Error handled by interceptor
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingConfig) {
        await client.put(`/configs/${editingConfig.id}`, values);
        message.success('Updated successfully');
      } else {
        await client.post('/configs', values);
        message.success('Created successfully');
      }
      setModalOpen(false);
      fetchConfigs();
    } catch (error) {
      // validation or api error
    }
  };

  const columns: ColumnsType<Config> = [
    {
      title: 'Keyword',
      dataIndex: 'keyword',
      key: 'keyword',
    },
    {
      title: 'Platform',
      dataIndex: 'platform',
      key: 'platform',
      render: (text) => {
        let color = 'default';
        if (text === 'xhs') color = 'red';
        if (text === 'douyin') color = 'blue';
        if (text === 'zhihu') color = 'geekblue';
        return <Tag color={color}>{text.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Max Pages',
      dataIndex: 'max_pages',
      key: 'max_pages',
    },
    {
      title: 'Comments',
      dataIndex: 'fetch_comments',
      key: 'fetch_comments',
      render: (val) => <Switch checked={val} disabled size="small" />,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} />
          <Popconfirm title="Are you sure?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>Config Management</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchConfigs}>Refresh</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Config
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={configs}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingConfig ? 'Edit Config' : 'Add Config'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="keyword"
            label="Keyword"
            rules={[{ required: true, message: 'Please enter keyword' }]}
          >
            <Input placeholder="e.g. 旅游攻略" />
          </Form.Item>
          <Form.Item
            name="platform"
            label="Platform"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="xhs">Xiaohongshu</Select.Option>
              <Select.Option value="douyin">Douyin</Select.Option>
              <Select.Option value="zhihu">Zhihu</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="max_pages"
            label="Max Pages"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={1000} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="fetch_comments"
            label="Fetch Comments"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ConfigPage;
