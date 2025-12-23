import React from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';
import type { Connection, Node } from 'reactflow';
import 'reactflow/dist/style.css';
import { Upload, Button, Form, Input, message } from 'antd';
import { UploadOutlined, ExportOutlined } from '@ant-design/icons';
import { saveAs } from 'file-saver';
import { Document as PDFDocument, Page, Text, StyleSheet, pdf } from '@react-pdf/renderer';

// 简单的 PDF 样式，避免类型错误
const styles = StyleSheet.create({
  page: {
    padding: 24,
  },
});

// 自定义图片节点
const ImageNode = ({ data }: { data: any }) => (
  <div style={{ border: '1px solid #ddd', padding: 10, background: '#fff' }}>
    <img src={data.src} alt="uploaded" style={{ width: 100, height: 100 }} />
  </div>
);

// 自定义属性框节点（用Antd Form）
const PropertyNode = ({ data }: { data: any }) => (
  <div style={{ border: '1px solid blue', padding: 10, background: '#f0f0f0' }}>
    <Form layout="vertical" initialValues={data.properties}>
      <Form.Item label="P" name="P"><Input /></Form.Item>
      <Form.Item label="M" name="M"><Input /></Form.Item>
      <Form.Item label="C" name="C"><Input /></Form.Item>
      <Form.Item label="F" name="F"><Input /></Form.Item>
    </Form>
  </div>
);

const nodeTypes = { imageNode: ImageNode, propertyNode: PropertyNode };

const InfiniteCanvasEditor = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any[]>([]);
  const onConnect = (params: Connection) => setEdges((eds) => addEdge(params, eds));

  // 添加图片节点
  const handleUpload = ({ file }: { file: any }) => {
    const realFile = file?.originFileObj || file;
    if (!(realFile instanceof Blob)) {
      message.error('无效的图片文件');
      return;
    }
    const src = URL.createObjectURL(realFile);
    const newNode: Node = {
      id: `${Date.now()}`,
      type: 'imageNode',
      position: { x: Math.random() * 500, y: Math.random() * 500 },
      data: { src },
    };
    setNodes((nds) => nds.concat(newNode));
    message.success('图片添加成功');
  };

  // 添加属性框节点
  const addPropertyNode = () => {
    const newNode: Node = {
      id: `${Date.now()}`,
      type: 'propertyNode',
      position: { x: Math.random() * 500, y: Math.random() * 500 },
      data: { properties: { P: '', M: '', C: '', F: '' } },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  // 导出JSON
  const exportJSON = () => {
    const data = { nodes, edges };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    saveAs(blob, 'canvas.json');
  };

  // 导出PDF（简化：列出节点和连接）
  const exportPDF = async () => {
    const MyDocument = () => (
      <PDFDocument>
        <Page size="A4" style={styles.page}>
          <Text>画板内容：</Text>
          {nodes.map((node: any) => (
            <Text key={node.id}>
              {node.type} at ({node.position.x}, {node.position.y})
            </Text>
          ))}
          {edges.map((edge: any) => (
            <Text key={edge.id}>
              连接: {edge.source} - {edge.target}
            </Text>
          ))}
        </Page>
      </PDFDocument>
    );
    const blob = await pdf(<MyDocument />).toBlob();
    saveAs(blob, 'canvas.pdf');
  };

  return (
    // 这里的 212 = Header(64) + Content 上下 margin(24 + 124)，保证画板刚好在可视区域内不溢出
    <div style={{ position: 'relative', height: '100%', minHeight: 'calc(100vh - 212px)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 10,
          display: 'flex',
          gap: 8,
          background: '#fff',
          padding: 8,
          borderRadius: 4,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <Upload accept="image/*" showUploadList={false} customRequest={handleUpload}>
          <Button icon={<UploadOutlined />}>添加图片</Button>
        </Upload>
        <Button onClick={addPropertyNode}>添加属性框</Button>
        <Button icon={<ExportOutlined />} onClick={exportJSON}>导出JSON</Button>
        <Button icon={<ExportOutlined />} onClick={exportPDF}>导出PDF</Button>
      </div>
    </div>
  );
};

export default InfiniteCanvasEditor;