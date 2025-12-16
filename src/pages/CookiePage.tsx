import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Popconfirm, Tag, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, SecurityScanOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import client from '../api/client';
import type { Cookie, ApiResponse } from '../types';
import dayjs from 'dayjs';

const { Text } = Typography;

const CookiePage: React.FC = () => {
  const [cookies, setCookies] = useState<Cookie[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCookie, setEditingCookie] = useState<Cookie | null>(null);
  const [form] = Form.useForm();

  // Rotation feature
  const [rotateLoading, setRotateLoading] = useState(false);

  const fetchCookies = async () => {
    setLoading(true);
    try {
      const res = await client.get<any, ApiResponse<Cookie[]>>('/cookies');
      if (res.code === 0 || Array.isArray(res)) {
        setCookies(Array.isArray(res) ? res : res.data);
      } else {
        setCookies([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCookies();
  }, []);

  const handleAdd = () => {
    setEditingCookie(null);
    form.resetFields();
    form.setFieldsValue({ platform: 'xhs' });
    setModalOpen(true);
  };

  const handleEdit = (record: Cookie) => {
    setEditingCookie(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await client.delete(`/cookies/${id}`);
      message.success('Deleted successfully');
      fetchCookies();
    } catch (error) {
      // handled elsewhere
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingCookie) {
        await client.put(`/cookies/${editingCookie.id}`, values);
        message.success('Updated successfully');
      } else {
        await client.post('/cookies', values);
        message.success('Created successfully');
      }
      setModalOpen(false);
      fetchCookies();
    } catch (error) {
      // ignore
    }
  };

  const handleRotateTest = async () => {
    setRotateLoading(true);
    try {
      // Just test with a platform, hardcoded for now or prompt user.
      const res = await client.get<any, ApiResponse<Cookie>>('/cookies/rotate?platform=xhs');
      if (res.data) {
        Modal.info({
          title: 'Rotated Cookie Result',
          content: (
            <div>
              <p><b>Platform:</b> {res.data.platform}</p>
              <p><b>Cookie:</b> <Text code>{res.data.value ? res.data.value.substring(0, 20) + '...' : 'N/A'}</Text></p>
            </div>
          )
        });
      } else {
        message.warning('No cookie available');
      }
    } catch (e) {
      // error
    } finally {
      setRotateLoading(false);
    }
  };

  const columns: ColumnsType<Cookie> = [
    {
      title: 'Platform',
      dataIndex: 'platform',
      key: 'platform',
      width: 120,
      render: (text) => {
        let color = 'default';
        if (text === 'xhs') color = 'red';
        if (text === 'douyin') color = 'blue';
        if (text === 'zhihu') color = 'geekblue';
        return <Tag color={color}>{text.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Cookie Value',
      dataIndex: 'value',
      key: 'value',
      ellipsis: true,
      render: (val) => (
        <span style={{ fontFamily: 'monospace' }}>
          {/* Simple masking */}
          {val ? val.substring(0, 4) + '****' + val.substring(val.length - 4) : '-'}
        </span>
      )
    },
    {
      title: 'Expiry',
      dataIndex: 'expiry',
      key: 'expiry',
      render: (d) => d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: 'Note',
      dataIndex: 'note',
      key: 'note',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} />
          <Popconfirm title="Delete cookie?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>Cookie Management</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchCookies}>Refresh</Button>
          <Button icon={<SecurityScanOutlined />} loading={rotateLoading} onClick={handleRotateTest}>Test Rotation (XHS)</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Cookie
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={cookies}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingCookie ? 'Edit Cookie' : 'Add Cookie'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical">
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
            name="value"
            label="Cookie Value"
            rules={[{ required: true, message: 'Please enter cookie' }]}
          >
            <Input.TextArea rows={4} placeholder="Paste raw cookie string here" />
          </Form.Item>
          {/* Optional fields: expiry, note */}
          <Form.Item name="note" label="Note">
            <Input placeholder="Optional remarks" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CookiePage;
