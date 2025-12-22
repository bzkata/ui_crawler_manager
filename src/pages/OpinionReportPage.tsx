import React, { useState, useEffect } from 'react';
import { Card, Tag, Typography, Button, Row, Col, Avatar } from 'antd';
import { ArrowRightOutlined, BookOutlined, ClockCircleOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Title, Text } = Typography;

interface ReportItem {
  media_type: string;
  keyword: string;
  jump_url: string;
  create_time: string;
}

// Mock data generator
const generateMockData = (): ReportItem[] => {
  const platforms = ['xhs', 'bilibili', 'weibo', 'douyin'];
  const keywords = [
    '积木车,变形金刚,机械组',
    '乐高,保时捷,GT3 RS',
    'F1,赛车,模型',
    '布加迪,奇隆,超跑',
    '兰博基尼,Sian,FKP 37'
  ];

  return Array.from({ length: 15 }).map((_, index) => {
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const keyword = keywords[Math.floor(Math.random() * keywords.length)];

    return {
      media_type: platform,
      keyword: keyword,
      jump_url: 'http://10.1.92.44:8501/',
      create_time: dayjs().subtract(index * 20 + Math.random() * 20, 'minute').toISOString(),
    };
  });
};

const OpinionReportPage: React.FC = () => {
  const [data, setData] = useState<ReportItem[]>([]);

  useEffect(() => {
    // Simulate loading delay for animation effect
    setTimeout(() => {
      setData(generateMockData());
    }, 100);
  }, []);

  const getMediaInfo = (type: string) => {
    const map: Record<string, { label: string; color: string; bgColor: string }> = {
      xhs: {
        label: '小红书',
        color: '#ff2442',
        bgColor: '#fff0f2'
      },
      bilibili: {
        label: 'B站',
        color: '#00aeec',
        bgColor: '#e3f5ff'
      },
      weibo: {
        label: '微博',
        color: '#e6162d',
        bgColor: '#fff1f2'
      },
      douyin: {
        label: '抖音',
        color: '#000000', // Using black for Douyin as its branding is complex (black/white/neon)
        bgColor: '#f2f2f2'
      }
    };
    return map[type] || { label: type, color: '#1890ff', bgColor: '#e6f7ff' };
  };

  return (
    <div style={{
      minHeight: '100%',
      padding: '40px 24px',
      background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' // Subtle gradient bg
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: '48px', textAlign: 'center' }}>
          <Title level={2} style={{ margin: '0 0 12px 0', fontSize: '32px', fontWeight: 800, color: '#1e293b' }}>
            <span style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <BookOutlined style={{ color: '#8b5cf6' }} />
              舆情监控报告
            </span>
          </Title>
          <Text style={{ fontSize: '16px', color: '#64748b' }}>
            实时追踪全网动态，洞察品牌声量
          </Text>
        </div>

        <Row gutter={[24, 24]}>
          {data.map((item, index) => {
            const media = getMediaInfo(item.media_type);
            return (
              <Col xs={24} sm={12} md={8} lg={6} key={index} className="animate-item" style={{ animationDelay: `${index * 0.05}s` }}>
                <Card
                  bordered={false}
                  hoverable
                  className="premium-card"
                  style={{
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.6)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  bodyStyle={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}
                >
                  {/* Header: Platform & Time */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Avatar
                        size="small"
                        style={{
                          backgroundColor: media.bgColor,
                          color: media.color,
                          fontSize: '12px',
                          border: `1px solid ${media.color}20`
                        }}
                      >
                        {media.label[0]}
                      </Avatar>
                      <Text style={{ fontWeight: 600, color: '#334155', fontSize: '14px' }}>
                        {media.label}
                      </Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {dayjs(item.create_time).format('MM-DD HH:mm')}
                    </Text>
                  </div>

                  {/* Body: Keywords */}
                  <div style={{ flex: 1, marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                      <SearchOutlined style={{ fontSize: '14px', color: '#94a3b8' }} />
                      <Text style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Search Keywords
                      </Text>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {item.keyword.split(',').map((kw, i) => (
                        <Tag
                          key={i}
                          style={{
                            margin: 0,
                            padding: '4px 12px',
                            borderRadius: '100px',
                            background: '#f1f5f9',
                            border: 'none',
                            color: '#475569',
                            fontSize: '13px',
                            fontWeight: 500,
                            transition: 'all 0.2s'
                          }}
                          className="keyword-tag"
                        >
                          #{kw}
                        </Tag>
                      ))}
                    </div>
                  </div>

                  {/* Footer: Action */}
                  <div style={{ paddingTop: '16px', borderTop: '1px dashed #e2e8f0' }}>
                    <Button
                      type="text"
                      block
                      className="action-btn"
                      href={item.jump_url}
                      target="_blank"
                      style={{
                        color: '#6366f1',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontWeight: 600,
                        background: '#f5f3ff',
                        borderRadius: '12px',
                        height: '40px'
                      }}
                    >
                      查看详情 <ArrowRightOutlined />
                    </Button>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
      <style>
        {`
          @keyframes slideUpFade {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          /* Initially hide items to prevent flash before animation */
          .animate-item {
            opacity: 0;
            animation: slideUpFade 0.6s ease-out forwards;
          }

          .premium-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
            background: #ffffff !important;
          }

          .action-btn:hover {
             background: #6366f1 !important;
             color: white !important;
          }

          .keyword-tag:hover {
            background: #e2e8f0 !important;
            color: #1e293b !important;
          }
        `}
      </style>
    </div>
  );
};

export default OpinionReportPage;
