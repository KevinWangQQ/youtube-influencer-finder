import { useState } from 'react';
import { Form, Input, Button, Card, Select, InputNumber, Space, Collapse } from 'antd';
import { SearchOutlined, SettingOutlined } from '@ant-design/icons';
import type { SearchFilters } from '../types';

interface SearchFormProps {
  onSearch: (topic: string, filters: SearchFilters) => void;
  loading: boolean;
}

export const SearchForm = ({ onSearch, loading }: SearchFormProps) => {
  const [form] = Form.useForm();
  const [topic, setTopic] = useState('');

  const handleSubmit = (values: any) => {
    if (topic.trim()) {
      const filters: SearchFilters = {
        region: values.region || 'US',
        minSubscribers: values.minSubscribers || 1000,
        minViews: values.minViews || 10000,
        maxResults: values.maxResults || 50
      };
      onSearch(topic.trim(), filters);
    }
  };

  const regions = [
    { value: 'US', label: 'United States' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'CA', label: 'Canada' },
    { value: 'AU', label: 'Australia' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    { value: 'ES', label: 'Spain' },
    { value: 'IT', label: 'Italy' },
    { value: 'JP', label: 'Japan' },
    { value: 'KR', label: 'South Korea' },
    { value: 'IN', label: 'India' },
    { value: 'BR', label: 'Brazil' },
  ];

  return (
    <Card 
      className="mb-8 search-form-card" 
      style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
      }}
    >
      <Form
        form={form}
        onFinish={handleSubmit}
        layout="vertical"
        initialValues={{
          region: 'US',
          minSubscribers: 1000,
          minViews: 10000,
          maxResults: 50
        }}
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            🔍 AI-Powered Influencer Discovery
          </h2>
          <p className="text-white/80">
            Find the perfect YouTube influencers for your brand with intelligent keyword expansion
          </p>
        </div>

        <Space.Compact style={{ width: '100%' }} size="large">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="输入搜索主题，如：TP-Link路由器、美食博主、科技评测..."
            size="large"
            style={{ 
              borderRadius: '8px 0 0 8px',
              fontSize: '16px'
            }}
            disabled={loading}
            required
          />
          <Button
            type="primary"
            size="large"
            icon={<SearchOutlined />}
            loading={loading}
            disabled={!topic.trim()}
            htmlType="submit"
            style={{
              borderRadius: '0 8px 8px 0',
              background: '#1890ff',
              borderColor: '#1890ff',
              minWidth: '120px'
            }}
          >
            {loading ? '搜索中...' : '搜索'}
          </Button>
        </Space.Compact>

        <Collapse 
          ghost
          size="small"
          className="mt-4"
          items={[
            {
              key: 'advanced',
              label: (
                <span className="text-white/90 flex items-center">
                  <SettingOutlined className="mr-2" />
                  高级筛选选项
                </span>
              ),
              children: (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Form.Item 
                    label={<span className="text-white">地区</span>} 
                    name="region"
                  >
                    <Select
                      options={regions}
                      placeholder="选择地区"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>

                  <Form.Item 
                    label={<span className="text-white">最少订阅数</span>} 
                    name="minSubscribers"
                  >
                    <InputNumber
                      min={0}
                      max={10000000}
                      step={1000}
                      placeholder="1000"
                      style={{ width: '100%' }}
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    />
                  </Form.Item>

                  <Form.Item 
                    label={<span className="text-white">最少播放量</span>} 
                    name="minViews"
                  >
                    <InputNumber
                      min={0}
                      max={1000000000}
                      step={10000}
                      placeholder="10000"
                      style={{ width: '100%' }}
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    />
                  </Form.Item>

                  <Form.Item 
                    label={<span className="text-white">最大结果数</span>} 
                    name="maxResults"
                  >
                    <InputNumber
                      min={1}
                      max={100}
                      placeholder="50"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </div>
              )
            }
          ]}
        />
      </Form>

      <style>{`
        .search-form-card .ant-collapse-ghost .ant-collapse-item {
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .search-form-card .ant-collapse-ghost .ant-collapse-header {
          padding: 12px 0;
        }
        
        .search-form-card .ant-collapse-content-box {
          padding: 16px 0 0 0;
        }
      `}</style>
    </Card>
  );
};