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
      message.success('删除成功');
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
        message.success('更新成功');
      } else {
        await client.post('/cookies', values);
        message.success('创建成功');
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
      const res = await client.get<any, ApiResponse<Cookie>>('/cookies/random?platform=xhs');
      if (res.data) {
        Modal.info({
          title: '轮换结果',
          content: (
            <div>
              <p><b>平台:</b> {res.data.platform}</p>
              <p><b>Cookie:</b> <Text code>{res.data.cookie_value ? res.data.cookie_value.substring(0, 20) + '...' : '无'}</Text></p>
            </div>
          )
        });
      } else {
        message.warning('无可用 Cookie');
      }
    } catch (e) {
      // error
    } finally {
      setRotateLoading(false);
    }
  };

  const columns: ColumnsType<Cookie> = [
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 120,
      render: (text) => {
        const map: Record<string, string> = {
          xhs: '小红书', dy: '抖音', ks: '快手', bili: '哔哩哔哩',
          wb: '微博', tieba: '百度贴吧', zhuihu: '知乎'
        };
        const colorMap: Record<string, string> = {
          xhs: 'red', dy: 'blue', zhihu: 'geekblue'
        };
        return <Tag color={colorMap[text] || 'default'}>{map[text] || text.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Cookie 值',
      dataIndex: 'cookie_value',
      key: 'cookie_value',
      ellipsis: true,
      render: (val) => (
        <span style={{ fontFamily: 'monospace' }}>
          {/* Simple masking */}
          {val ? val.substring(0, 4) + '****' + val.substring(val.length - 4) : '-'}
        </span>
      )
    },
    {
      title: '启用状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (e) => <Tag color={e ? 'green' : 'red'}>{e ? '启用' : '禁用'}</Tag>
    },
    {
      title: '过期时间',
      dataIndex: 'expiry',
      key: 'expiry',
      render: (d) => d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} />
          <Popconfirm title="确定删除吗?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>Cookie 管理</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchCookies}>刷新</Button>
          <Button icon={<SecurityScanOutlined />} loading={rotateLoading} onClick={handleRotateTest}>测试轮换 (小红书)</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加 Cookie
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
        title={editingCookie ? '编辑 Cookie' : '添加 Cookie'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="platform"
            label="平台"
            rules={[{ required: true }]}
          >
            <Select options={[
              { label: '小红书', value: 'xhs' },
              { label: '抖音', value: 'dy' },
              { label: '快手', value: 'ks' },
              { label: '哔哩哔哩', value: 'bili' },
              { label: '微博', value: 'wb' },
              { label: '百度贴吧', value: 'tieba' },
              { label: '知乎', value: 'zhihu' },
            ]} />
          </Form.Item>
          <Form.Item
            name="cookie_value"
            label="Cookie 值"
            rules={[{ required: true, message: '请输入 Cookie' }]}
          >
            <Input.TextArea rows={4} placeholder="在此粘贴原始 Cookie 字符串" />
          </Form.Item>
          {/* Optional fields: expiry, note */}
          <Form.Item name="remark" label="备注">
            <Input placeholder="选填备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CookiePage;
