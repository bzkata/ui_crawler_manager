import React, { useState, useEffect } from 'react';
import {
  Card,
  Upload,
  Button,
  Modal,
  Table,
  message,
  Space,
  Typography,
  Tag,
  Progress,
} from 'antd';
import { InboxOutlined, FileTextOutlined, DownloadOutlined, FileExcelOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import type { RcFile } from 'antd/es/upload';
import type { TableRowSelection } from 'antd/es/table/interface';
import JSZip from 'jszip';
import { transformFile, parseFile, dataToCsv } from '../utils/dataTransform';
import type { FileInfo, TransformResult } from '../types/dataTransform';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const DataTransformPage: React.FC = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [fileInfos, setFileInfos] = useState<FileInfo[]>([]);
  const [transforming, setTransforming] = useState(false);
  const [transformProgress, setTransformProgress] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 平台名称映射
  const platformNames: Record<string, string> = {
    xhs: '小红书',
    weibo: '微博',
    douyin: '抖音',
    bili: '哔哩哔哩',
    kuaishou: '快手',
    unknown: '未知',
  };

  // 处理文件上传
  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    const fileObj = file as RcFile;

    const lowerName = fileObj.name.toLowerCase();
    if (!lowerName.endsWith('.json') && !lowerName.endsWith('.csv')) {
      onSuccess?.("ignored");
      return;
    }

    try {
      // 尝试获取文件路径 (webkitRelativePath)
      const path = (fileObj as any).webkitRelativePath || fileObj.name;
      const fileInfo = await parseFile(fileObj, path);

      setFileInfos((prev) => [...prev, fileInfo]);

      // 更新文件列表
      setFileList((prev) => {
        const newFile: UploadFile = {
          uid: fileInfo.name + Date.now(), // 确保唯一ID
          name: fileInfo.name,
          status: 'done',
          originFileObj: fileObj,
        };
        return [...prev, newFile];
      });

      onSuccess?.(fileInfo);
      // message.success(`文件 ${fileInfo.name} 解析成功`); // 能够批量拖入时，提示太多会刷屏，可以考虑去掉或者优化
    } catch (error: any) {
      console.error(error);
      message.error(`${fileObj.name} 解析失败: ${error.message || '未知错误'}`);
      onError?.(error);
    }
  };

  // 移除文件
  const handleClear = () => {
    setFileList([]);
    setFileInfos([]);
    setSelectedRowKeys([]);
  };

  // 预览表格列
  const previewColumns = [
    {
      title: '文件名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: FileInfo) => (
        <Space direction="vertical" size={0}>
          <Space>
            <FileTextOutlined />
            <Text strong>{text}</Text>
          </Space>
          {record.path && record.path !== record.name && (
            <Text type="secondary" style={{ fontSize: 12 }}>{record.path}</Text>
          )}
        </Space>
      ),
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => (
        <Tag color={platform === 'unknown' ? 'default' : 'blue'}>
          {platformNames[platform] || platform}
        </Tag>
      ),
    },
    {
      title: '数据类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'content' ? 'green' : 'orange'}>
          {type === 'content' ? '内容' : '评论'}
        </Tag>
      ),
    },
    {
      title: '数据条数',
      dataIndex: 'count',
      key: 'count',
      render: (count: number) => <strong>{count.toLocaleString()}</strong>,
    },
    {
      title: '文件大小',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => {
        const kb = (size / 1024).toFixed(2);
        return `${kb} KB`;
      },
    },
  ];

  // 表格行选择配置
  const rowSelection: TableRowSelection<FileInfo> = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  // 开始转换
  const handleTransform = async (format: 'json' | 'csv') => {
    const targetFiles = selectedRowKeys.length > 0
      ? fileInfos.filter(f => selectedRowKeys.includes(f.name))
      : fileInfos;

    if (targetFiles.length === 0) {
      message.warning('没有可转换的文件');
      return;
    }

    setTransforming(true);
    setTransformProgress(0);

    try {
      const results: TransformResult[] = [];
      const total = targetFiles.length;

      // 逐个转换文件
      for (let i = 0; i < total; i++) {
        const fileInfo = targetFiles[i];
        const result = transformFile(fileInfo, format);
        results.push(result);
        setTransformProgress(((i + 1) / total) * 100);
      }

      // 创建ZIP文件
      const zip = new JSZip();

      results.forEach((result) => {
        let content: string;
        if (format === 'csv') {
          // 如果是CSV，调用 unparse
          content = dataToCsv(result.data as any[]);
          // Add BOM for Excel compatibility with UTF-8 CSVs
          content = '\ufeff' + content;
        } else {
          content = JSON.stringify(result.data, null, 2);
        }
        zip.file(result.fileName, content);
      });

      // 生成ZIP文件
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // 下载ZIP文件
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `data_formatted_${format}_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success(`转换完成！共转换 ${results.length} 个文件`);

    } catch (error: any) {
      message.error(`转换失败: ${error.message}`);
    } finally {
      setTransforming(false);
      setTransformProgress(0);
    }
  };

  // 当文件信息加载后，默认全选所有文件
  useEffect(() => {
    if (fileInfos.length > 0) {
      setSelectedRowKeys(fileInfos.map(f => f.name));
    } else {
      setSelectedRowKeys([]);
    }
  }, [fileInfos]);

  return (
    <div>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Title level={4}>数据转换</Title>
            <Text type="secondary">
              支持拖入单个文件或整个文件夹。系统将自动解析路径识别平台（如 .../data/bili/...）。
              转换后的文件将统一命名为 [平台]-[原文件名]-formatted.[json|csv]。
            </Text>
          </div>

          <Dragger
            customRequest={handleUpload}
            fileList={fileList}
            showUploadList={false} // 隐藏默认列表
            multiple
            directory // 支持文件夹
            height={150}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件/文件夹到此区域</p>
          </Dragger>

          {fileInfos.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>已加载 {fileInfos.length} 个文件</Text>
                <Space>
                  <Button danger onClick={handleClear}>
                    清空列表
                  </Button>
                  <Button
                    onClick={() => handleTransform('csv')}
                    loading={transforming}
                    disabled={selectedRowKeys.length === 0}
                    icon={<FileExcelOutlined />}
                  >
                    下载 .csv
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => handleTransform('json')}
                    loading={transforming}
                    disabled={selectedRowKeys.length === 0}
                    icon={<DownloadOutlined />}
                  >
                    下载 .json
                  </Button>
                </Space>
              </div>

              <Table
                rowSelection={rowSelection}
                dataSource={fileInfos}
                columns={previewColumns}
                rowKey="name" // 注意：如果有同名文件可能会有问题，建议生成唯一ID
                pagination={{ pageSize: 50 }}
                size="small"
                scroll={{ y: 500 }}
              />
            </>
          )}
        </Space>
      </Card>

      {transforming && (
        <Modal
          open={transforming}
          footer={null}
          closable={false}
          centered
          width={400}
        >
          <div style={{ textAlign: 'center', padding: 20 }}>
            <Title level={5}>正在转换中...</Title>
            <Progress percent={Math.round(transformProgress)} status="active" />
            <div style={{ marginTop: 10 }}>正在处理数据并打包下载</div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DataTransformPage;
