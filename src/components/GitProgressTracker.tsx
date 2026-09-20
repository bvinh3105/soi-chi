import React from 'react';

export type StepStatus = 'working' | 'shipping' | 'delivered' | 'paused' | 'stopped' | 'empty';

export interface ProgressStep {
  id: string;
  status: StepStatus;
  title: string;
  description: string;
  timestamp?: string;
  branchType?: 'none' | 'issue' | 'revert';
}

interface GitProgressTrackerProps {
  orderId: string;
  steps: ProgressStep[];
  compact?: boolean;
}

export default function GitProgressTracker({ orderId = 'SC-8492', steps = [], compact = false }: GitProgressTrackerProps) {
  const getStatusColor = (status: StepStatus) => {
    switch (status) {
      case 'working': return 'bg-blue-500';
      case 'shipping': return 'bg-yellow-500';
      case 'delivered': return 'bg-green-500';
      case 'paused': return 'bg-purple-500';
      case 'stopped': return 'bg-red-500';
      case 'empty': return 'bg-gray-300';
      default: return 'bg-gray-300';
    }
  };

  const getTextColor = (status: StepStatus) => {
    switch (status) {
      case 'working': return 'text-blue-700';
      case 'shipping': return 'text-yellow-700';
      case 'delivered': return 'text-green-700';
      case 'paused': return 'text-purple-700';
      case 'stopped': return 'text-red-700';
      case 'empty': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const currentStep = steps.find(s => s.status === 'working' || s.status === 'paused') || steps[steps.length - 1];
  const statusLabel = currentStep?.status === 'paused' ? 'Tạm dừng' : currentStep?.status === 'working' ? 'Đang xử lý' : 'Hoàn thành';
  const statusColor = currentStep?.status === 'paused' ? 'bg-purple-50 text-purple-700 border-purple-100' : currentStep?.status === 'working' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-green-50 text-green-700 border-green-100';

  return (
    <div className={compact ? 'w-full font-sans p-2' : 'w-full max-w-2xl bg-white border border-gray-200 rounded-xl shadow-sm p-6 font-sans'}>
      <div className={`flex items-center justify-between ${compact ? 'mb-4 pb-2' : 'mb-8 pb-4'} border-b border-gray-100`}>
        <div>
          <h2 className={`font-bold text-gray-900 ${compact ? 'text-sm' : 'text-lg'}`}>Tiến trình sản xuất</h2>
          <p className={`text-gray-500 font-mono mt-1 ${compact ? 'text-xs' : 'text-sm'}`}>branch: order/{orderId}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColor}`}>
          {statusLabel}
        </div>
      </div>

      {/* Legend */}
      <div className={`flex flex-wrap gap-3 text-xs font-medium text-gray-700 ${compact ? 'mb-4 gap-2' : 'mb-8'}`}>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-500"></div> Đang làm</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-yellow-500"></div> Đang giao</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-500"></div> Giao thành công</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-purple-500"></div> Tạm dừng</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-500"></div> Dừng (Hủy)</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-gray-300"></div> Trống</div>
      </div>

      {/* Timeline */}
      <div className="relative pl-2">
        {/* Continuous vertical line */}
        <div className="absolute left-[1.25rem] top-2 bottom-2 w-1 bg-gray-200 rounded-full z-0"></div>

        {steps.map((step) => {
          const isPending = step.status === 'empty' || step.status === 'shipping' || step.status === 'delivered';
          const opacityClass = isPending && step.status !== 'delivered' && step.status !== 'shipping' ? 'opacity-50' : '';
          
          return (
            <div key={step.id} className={`relative flex items-start ${compact ? 'mb-5' : 'mb-8'} group ${opacityClass}`}>
              
              {/* Branching SVGs/Lines for special statuses */}
              {step.branchType === 'issue' && (
                <div className="absolute left-[1.15rem] top-6 w-8 h-8 border-l-4 border-b-4 border-purple-200 rounded-bl-xl z-0 -mt-2.5"></div>
              )}
              {step.branchType === 'revert' && (
                <div className="absolute left-[1.15rem] -top-8 w-8 h-12 border-l-4 border-t-4 border-red-200 rounded-tl-xl z-0 ml-8 -scale-x-100"></div>
              )}

              {/* Node (Square with rounded corners) */}
              <div 
                className={`relative z-10 w-10 h-10 rounded-lg border-4 border-white flex items-center justify-center shadow-sm ${getStatusColor(step.status)} ${step.status === 'working' && !step.title.includes('Tạo') ? 'animate-pulse' : ''} ${step.branchType === 'issue' ? 'ml-8' : ''} ${step.branchType === 'revert' ? 'ml-16' : ''}`}
              >
                {/* Node Icons based on status */}
                {step.status === 'delivered' && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                {step.title.includes('Tạo') && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                {step.status === 'stopped' && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>}
                {step.status === 'paused' && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>}
                {step.status === 'working' && !step.title.includes('Tạo') && <div className="w-2 h-2 bg-white rounded-full"></div>}
              </div>

              {/* Content */}
              <div className={`ml-6 pt-1 ${step.branchType === 'issue' ? '-ml-2' : ''} ${step.branchType === 'revert' ? '-ml-10' : ''}`}>
                <h3 className={`font-bold ${getTextColor(step.status)}`}>{step.title}</h3>
                <p className={`text-sm mt-1 ${step.status === 'empty' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {step.description}
                </p>
                {step.timestamp && (
                  <span className="text-xs text-gray-400 font-mono mt-2 block">{step.timestamp}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
