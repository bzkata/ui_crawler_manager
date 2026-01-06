import React, { useState } from 'react';
import "@excalidraw/excalidraw/index.css";
import { Excalidraw } from '@excalidraw/excalidraw';
import { Button, Form, Modal, message, Input } from 'antd';

const ExcalidrawEditor = () => {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAnchorMode, setIsAnchorMode] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [form] = Form.useForm();

  const toggleAnchorMode = () => {
    setIsAnchorMode((prev) => !prev);
    message.info(isAnchorMode ? '已退出锚定模式' : '已进入锚定模式：点击图片添加锚定点');
  };

  const onPointerDown = (event) => {
    if (isAnchorMode && excalidrawAPI) {
      const { activeTool, sceneElements } = excalidrawAPI.getAppState();
      const clickedElement = sceneElements.find(el => el.id === event.elementId);
      if (clickedElement && clickedElement.type === 'image') {
        setSelectedImageId(clickedElement.id);
        const anchorId = Date.now().toString();
        const relativeX = event.x - clickedElement.x;
        const relativeY = event.y - clickedElement.y;
        const anchorElement = {
          type: 'ellipse',
          id: anchorId,
          x: clickedElement.x + relativeX - 5,
          y: clickedElement.y + relativeY - 5,
          width: 10,
          height: 10,
          fillStyle: 'solid',
          backgroundColor: 'red',
          groupIds: [clickedElement.id], // Group with image for following movement
        };
        excalidrawAPI.updateScene({
          elements: [...excalidrawAPI.getSceneElements(), anchorElement],
        });
        message.success('锚定点添加成功，可从锚定点拖拽箭头');
      }
    }
  };

  const addAnnotation = (values) => {
    if (excalidrawAPI) {
      const text = `P: ${values.P}\nC: ${values.C}\nM: ${values.M}\nF: ${values.F}`;
      const textElement = {
        type: 'text',
        text,
        x: Math.random() * 500 + 300,
        y: Math.random() * 300,
        width: 200,
        height: 100,
        fontSize: 12,
      };
      excalidrawAPI.updateScene({
        elements: [...excalidrawAPI.getSceneElements(), textElement],
      });
      setIsModalVisible(false);
      message.success('属性标注添加成功，使用箭头工具连接');
    }
  };

  return (
    <div style={{ height: '80vh', position: 'relative' }}>
      <Excalidraw
        ref={(api) => setExcalidrawAPI(api)}
        onPointerDown={onPointerDown}
        initialData={{
          appState: { isBindingEnabled: true },
        }}
      />
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, display: 'flex', gap: 10 }}>
        <Button type={isAnchorMode ? 'primary' : 'default'} onClick={toggleAnchorMode}>锚定模式</Button>
        <Button onClick={() => setIsModalVisible(true)}>添加属性标注</Button>
      </div>
      <Modal title="添加属性标注" visible={isModalVisible} onOk={() => form.submit()} onCancel={() => setIsModalVisible(false)}>
        <Form form={form} onFinish={addAnnotation}>
          <Form.Item name="P" label="P"><Input /></Form.Item>
          <Form.Item name="C" label="C"><Input /></Form.Item>
          <Form.Item name="M" label="M"><Input /></Form.Item>
          <Form.Item name="F" label="F"><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ExcalidrawEditor;