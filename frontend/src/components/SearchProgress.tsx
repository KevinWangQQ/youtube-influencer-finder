import React from 'react';
import { Steps, Progress, Card } from 'antd';
import { 
  RobotOutlined, 
  SearchOutlined, 
  ThunderboltOutlined, 
  CheckCircleOutlined 
} from '@ant-design/icons';

interface SearchProgressProps {
  currentStep: 'idle' | 'expanding' | 'searching' | 'processing' | 'complete';
  visible: boolean;
}

const { Step } = Steps;

export const SearchProgress: React.FC<SearchProgressProps> = ({ currentStep, visible }) => {
  if (!visible) return null;

  const steps = [
    {
      key: 'expanding',
      title: 'AI 扩展关键词',
      description: '使用 OpenAI 分析并扩展搜索关键词...',
      icon: <RobotOutlined />,
    },
    {
      key: 'searching', 
      title: '搜索 YouTube',
      description: '在 YouTube 上搜索相关影响者频道...',
      icon: <SearchOutlined />,
    },
    {
      key: 'processing',
      title: '处理结果',
      description: '分析频道数据和相关性评分...',
      icon: <ThunderboltOutlined />,
    },
    {
      key: 'complete',
      title: '搜索完成',
      description: '结果已准备就绪！',
      icon: <CheckCircleOutlined />,
    },
  ];

  const getCurrentStepIndex = () => {
    const stepMap = {
      'idle': -1,
      'expanding': 0,
      'searching': 1,
      'processing': 2,
      'complete': 3,
    };
    return stepMap[currentStep];
  };

  const getProgress = () => {
    const stepIndex = getCurrentStepIndex();
    if (stepIndex === -1) return 0;
    return ((stepIndex + 1) / steps.length) * 100;
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <Card className="mb-6 search-progress-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white m-0">搜索进度</h3>
          <div className="text-sm opacity-90">
            {currentStep === 'expanding' && '正在扩展关键词...'}
            {currentStep === 'searching' && '正在搜索频道...'}
            {currentStep === 'processing' && '正在处理结果...'}
            {currentStep === 'complete' && '搜索完成！'}
          </div>
        </div>
        
        <Progress 
          percent={getProgress()} 
          status={currentStep === 'complete' ? 'success' : 'active'}
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
          className="mb-4"
        />

        <Steps 
          current={currentStepIndex} 
          size="small"
          className="search-steps"
        >
          {steps.map((step, index) => (
            <Step
              key={step.key}
              title={<span className="text-white text-sm">{step.title}</span>}
              description={
                <span className="text-white text-xs opacity-75">
                  {index === currentStepIndex ? step.description : ''}
                </span>
              }
              icon={
                <div className={`step-icon ${index <= currentStepIndex ? 'active' : ''}`}>
                  {step.icon}
                </div>
              }
              status={
                index < currentStepIndex ? 'finish' : 
                index === currentStepIndex ? 'process' : 'wait'
              }
            />
          ))}
        </Steps>
      </div>

      <style>{`
        .search-progress-card {
          border: none;
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
        }
        
        .search-steps .ant-steps-item-title {
          color: white !important;
        }
        
        .search-steps .ant-steps-item-description {
          color: rgba(255,255,255,0.75) !important;
        }
        
        .search-steps .ant-steps-item-icon {
          background: rgba(255,255,255,0.2) !important;
          border-color: rgba(255,255,255,0.4) !important;
        }
        
        .search-steps .ant-steps-item-process .ant-steps-item-icon {
          background: #1890ff !important;
          border-color: #1890ff !important;
        }
        
        .search-steps .ant-steps-item-finish .ant-steps-item-icon {
          background: #52c41a !important;
          border-color: #52c41a !important;
        }
        
        .step-icon {
          color: white;
          transition: all 0.3s ease;
        }
        
        .step-icon.active {
          color: #1890ff;
          transform: scale(1.1);
        }
      `}</style>
    </Card>
  );
};