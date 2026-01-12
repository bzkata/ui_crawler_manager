import React, { useState } from 'react';
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
import { UploadOutlined, FileTextOutlined, DownloadOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import JSZip from 'jszip';
import { parseJsonFile, transformFile } from '../utils/dataTransform';
import { FileInfo, TransformResult } from '../types/dataTransform';

const { Title } = Typography;

const DataTransformPage: React.FC = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [fileInfos, setFileInfos] = useState<FileInfo[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [transforming, setTransforming] = useState(false);
  const [transformProgress, setTransformProgress] = useState(0);

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

    try {
      const fileInfo = await parseJsonFile(file as File);
      setFileInfos((prev) => [...prev, fileInfo]);

      // 更新文件列表
      setFileList((prev) => {
        const newFile: UploadFile = {
          uid: fileInfo.name,
          name: fileInfo.name,
          status: 'done',
          originFileObj: file as File,
        };
        return [...prev, newFile];
      });

      onSuccess?.(fileInfo);
      message.success(`文件 ${fileInfo.name} 解析成功`);
    } catch (error: any) {
      message.error(error.message || '文件解析失败');
      onError?.(error);
    }
  };

  // 移除文件
  const handleRemove = (file: UploadFile) => {
    setFileList((prev) => prev.filter((item) => item.uid !== file.uid));
    setFileInfos((prev) => prev.filter((item) => item.name !== file.name));
  };

  // 预览表格列
  const previewColumns = [
    {
      title: '文件名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <FileTextOutlined />
          {text}
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

  // 开始转换
  const handleTransform = async () => {
    if (fileInfos.length === 0) {
      message.warning('请先上传文件');
      return;
    }

    setTransforming(true);
    setTransformProgress(0);

    try {
      const results: TransformResult[] = [];
      const total = fileInfos.length;

      // 逐个转换文件
      for (let i = 0; i < fileInfos.length; i++) {
        const fileInfo = fileInfos[i];
        const result = transformFile(fileInfo);
        results.push(result);
        setTransformProgress(((i + 1) / total) * 100);
      }

      // 创建ZIP文件
      const zip = new JSZip();

      results.forEach((result) => {
        const jsonString = JSON.stringify(result.data, null, 2);
        zip.file(result.fileName, jsonString);
      });

      // 生成ZIP文件
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // 下载ZIP文件
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `data_formated_${new Date().getTime()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success(`转换完成！共转换 ${results.length} 个文件`);
      
      // 清空文件列表
      setFileList([]);
      setFileInfos([]);
    } catch (error: any) {
      message.error(`转换失败: ${error.message}`);
    } finally {
      setTransforming(false);
      setTransformProgress(0);
    }
  };

  return (
    <div>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Title level={4}>数据转换</Title>
            <p style={{ color: '#666', marginTop: 8 }}>
              上传JSON格式的数据文件，系统会自动识别平台和数据类型，并转换为统一格式。
              转换完成后将自动打包为ZIP文件下载。
            </p>
          </div>

          <Upload
            customRequest={handleUpload}
            fileList={fileList}
            onRemove={handleRemove}
            accept=".json"
            multiple
            maxCount={100}
          >
            <Button icon={<UploadOutlined />}>选择JSON文件</Button>
          </Upload>

          {fileInfos.length > 0 && (
            <div>
              <Space style={{ marginBottom: 16 }}>
                <Button
                  type="primary"
                  onClick={() => setPreviewVisible(true)}
                  icon={<FileTextOutlined />}
                >
                  预览文件信息 ({fileInfos.length})
                </Button>
                <Button
                  type="primary"
                  onClick={handleTransform}
                  loading={transforming}
                  icon={<DownloadOutlined />}
                >
                  开始转换
                </Button>
              </Space>

              {transforming && (
                <div style={{ marginTop: 16 }}>
                  <Progress percent={Math.round(transformProgress)} status="active" />
                </div>
              )}
            </div>
          )}
        </Space>
      </Card>

      <Modal
        title="文件预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>,
          <Button
            key="transform"
            type="primary"
            onClick={() => {
              setPreviewVisible(false);
              handleTransform();
            }}
            loading={transforming}
          >
            开始转换
          </Button>,
        ]}
        width={800}
      >
        <Table
          dataSource={fileInfos}
          columns={previewColumns}
          rowKey="name"
          pagination={false}
          size="small"
        />
      </Modal>
    </div>
  );
};

export default DataTransformPage;
