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
    form.setFieldsValue({
      max_pages: 50,
      type: 'search',
      lt: 'qrcode',
      get_comment: 'false',
      get_sub_comment: 'false',
      save_data_option: 'json',
      platform: 'xhs'
    });
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
      message.success('删除成功');
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
        message.success('更新成功');
      } else {
        await client.post('/configs', values);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchConfigs();
    } catch (error) {
      // validation or api error
    }
  };

  const columns: ColumnsType<Config> = [
    {
      title: '关键词',
      dataIndex: 'keywords',
      key: 'keywords',
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (text) => {
        const map: Record<string, string> = {
          xhs: '小红书', dy: '抖音', ks: '快手', bili: '哔哩哔哩',
          wb: '微博', tieba: '百度贴吧', zhuihu: '知乎'
        };
        return <Tag color="blue">{map[text] || text}</Tag>;
      }
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (t) => t === 'search' ? '搜索' : t === 'detail' ? '详情' : '创作者'
    },
    {
      title: '登录',
      dataIndex: 'lt',
      key: 'lt',
      render: (t) => t === 'qrcode' ? '二维码' : t === 'phone' ? '手机号' : 'Cookie'
    },
    {
      title: '评论(一级/二级)',
      key: 'comments',
      render: (_, r) => (
        <Space>
          <Tag>{r.get_comment === 'true' ? '是' : '否'}</Tag>
          /
          <Tag>{r.get_sub_comment === 'true' ? '是' : '否'}</Tag>
        </Space>
      )
    },
    {
      title: '操作',
      key: 'actions',
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
        <h2>配置管理</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchConfigs}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加配置
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
        title={editingConfig ? '编辑配置' : '添加配置'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
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
            name="keywords"
            label="关键词"
            rules={[{ required: true, message: '请输入关键词' }]}
          >
            <Input placeholder="多个关键词用逗号分隔，如 布鲁可,积木人" />
          </Form.Item>

          <Form.Item label="爬取类型" name="type" rules={[{ required: true }]}>
            <Select options={[
              { label: '搜索', value: 'search' },
              { label: '详情', value: 'detail' },
              { label: '创作者', value: 'creator' },
            ]} />
          </Form.Item>

          <Form.Item label="登录方式" name="lt" rules={[{ required: true }]}>
            <Select options={[
              { label: '二维码', value: 'qrcode' },
              { label: '手机号', value: 'phone' },
              { label: 'Cookie', value: 'cookie' },
            ]} />
          </Form.Item>

          <Form.Item noStyle dependencies={['lt']}>
            {({ getFieldValue }) =>
              getFieldValue('lt') === 'cookie' && (
                <Form.Item label="Cookie 值" name="cookies" rules={[{ required: true }]}>
                  <Input.TextArea rows={4} />
                </Form.Item>
              )}
          </Form.Item>

          <Form.Item 
            label="抓取一级评论"
            name="get_comment"
            valuePropName="checked"
            getValueProps={(val) => ({ checked: val === 'true' })}
            normalize={(val) => val ? 'true' : 'false'}
          >
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>

          <Form.Item 
            label="抓取二级评论"
            name="get_sub_comment"
            valuePropName="checked" 
            getValueProps={(val) => ({ checked: val === 'true' })}
            normalize={(val) => val ? 'true' : 'false'}
          >
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>

          <Form.Item label="数据保存方式" name="save_data_option" rules={[{ required: true }]}>
            <Select options={[
              { label: 'JSON', value: 'json' },
              { label: 'CSV', value: 'csv' },
              { label: 'SQLite', value: 'sqlite' },
              { label: 'Excel', value: 'excel' },
              { label: 'MongoDB', value: 'mongodb' },
              { label: 'Database', value: 'db' },
            ]} />
          </Form.Item>

          {/* Keeping max_pages as hidden or secondary if needed, or explicitly exposing it */}
          <Form.Item
            name="max_pages"
            label="最大页数"
            rules={[{ required: true }]}
            initialValue={50}
          >
            <InputNumber min={1} max={1000} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ConfigPage;
