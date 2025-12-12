import React, { useState } from 'react';
import { WSTGTest, TestProgress, TestStatus, PayloadItem } from '../types';
import AIChat from './AIChat';
import { CheckSquare, Info, FileText, Activity, Terminal, ShieldAlert, Crosshair, BookOpen, Plus, Trash2, Save } from 'lucide-react';

interface TestDetailProps {
  test: WSTGTest;
  progress: TestProgress;
  onUpdateStatus: (testId: string, status: TestStatus, userPayloads: PayloadItem[]) => void;
}

const TestDetail: React.FC<TestDetailProps> = ({ test, progress, onUpdateStatus }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'ai'>('details');
  const [newPayloadCode, setNewPayloadCode] = useState('');
  const [newPayloadDesc, setNewPayloadDesc] = useState('');
  
  const currentProgress = progress[test.id] || { status: TestStatus.NOT_STARTED, userPayloads: [] };
  
  // Ensure we have an array (migration safety)
  const userPayloads = Array.isArray(currentProgress.userPayloads) ? currentProgress.userPayloads : [];

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateStatus(test.id, e.target.value as TestStatus, userPayloads);
  };

  const handleAddPayload = () => {
    if (!newPayloadCode.trim()) return;
    const newPayload: PayloadItem = {
        code: newPayloadCode,
        description: newPayloadDesc || 'Custom payload'
    };
    const updatedPayloads = [...userPayloads, newPayload];
    onUpdateStatus(test.id, currentProgress.status, updatedPayloads);
    setNewPayloadCode('');
    setNewPayloadDesc('');
  };

  const handleDeletePayload = (index: number) => {
    const updatedPayloads = userPayloads.filter((_, i) => i !== index);
    onUpdateStatus(test.id, currentProgress.status, updatedPayloads);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // Split instructions by newlines to render steps
  const instructionSteps = test.instructions.split('\n').filter(line => line.trim().length > 0);

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-mono font-bold border border-slate-200">
                {test.id}
              </span>
              <span className="text-sm text-slate-500 font-medium">{test.category}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getSeverityColor(test.severity)}`}>
                {test.severity.toUpperCase()}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{test.title}</h2>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex flex-col items-end">
                <label className="text-xs text-slate-500 font-semibold uppercase mb-1">Trạng thái</label>
                <select
                  value={currentProgress.status}
                  onChange={handleStatusChange}
                  className={`appearance-none px-4 py-2 pr-8 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer
                    ${currentProgress.status === TestStatus.COMPLETED ? 'bg-green-50 border-green-200 text-green-700 focus:ring-green-500' : ''}
                    ${currentProgress.status === TestStatus.IN_PROGRESS ? 'bg-yellow-50 border-yellow-200 text-yellow-700 focus:ring-yellow-500' : ''}
                    ${currentProgress.status === TestStatus.NOT_STARTED ? 'bg-white border-slate-300 text-slate-700 focus:ring-slate-500' : ''}
                    ${currentProgress.status === TestStatus.NOT_BUG ? 'bg-slate-100 border-slate-200 text-slate-500 focus:ring-slate-400' : ''}
                  `}
                >
                  <option value={TestStatus.NOT_STARTED}>Not Started</option>
                  <option value={TestStatus.IN_PROGRESS}>In Progress</option>
                  <option value={TestStatus.COMPLETED}>Completed</option>
                  <option value={TestStatus.NOT_BUG}>Not Bug / Non Vuln</option>
                </select>
             </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mt-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-3 text-sm font-medium flex items-center gap-2 transition-colors relative ${
              activeTab === 'details' 
                ? 'text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText size={16} />
            Chi tiết & Payloads
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`pb-3 text-sm font-medium flex items-center gap-2 transition-colors relative ${
              activeTab === 'ai' 
                ? 'text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity size={16} />
            Trợ lý AI
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 max-w-6xl mx-auto w-full">
        {activeTab === 'details' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Description & Strategy Card */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Info className="text-indigo-500" size={20} />
                    Mô tả
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    {test.description}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100">
                   <h4 className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                     <Crosshair size={16} className="text-slate-500" /> Chiến lược khuyến nghị
                   </h4>
                   <p className="text-slate-600 text-sm">{test.strategy}</p>
                </div>
              </div>

              {/* Instructions Card (Step by Step) */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <BookOpen className="text-indigo-500" size={20} />
                  Quy trình thực hiện
                </h3>
                
                <div className="space-y-4">
                   {instructionSteps.map((step, idx) => (
                       <div key={idx} className="flex gap-4">
                           <div className="shrink-0 w-8 h-8 bg-indigo-50 text-indigo-600 font-bold rounded-full flex items-center justify-center text-sm border border-indigo-100">
                               {idx + 1}
                           </div>
                           <div className="pt-1.5 text-slate-700 text-sm leading-relaxed">
                               {step}
                           </div>
                       </div>
                   ))}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <CheckSquare className="text-slate-500" size={16} />
                    Mục tiêu kiểm thử
                    </h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {test.objectives.map((obj, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm bg-slate-50 p-2 rounded border border-slate-100">
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                            <span className="text-slate-700">{obj}</span>
                        </li>
                    ))}
                    </ul>
                </div>
              </div>

              {/* Static Payloads Card */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                 <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Terminal className="text-indigo-500" size={20} />
                  Payload / Lệnh mẫu
                </h3>
                <div className="space-y-4">
                  {test.payloads.map((payload, i) => (
                    <div key={i} className="group border border-slate-200 rounded-lg overflow-hidden hover:border-indigo-300 transition-colors">
                      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-xs font-semibold text-slate-500 flex justify-between items-center">
                          <span>Payload #{i + 1}</span>
                          <span className="text-[10px] uppercase tracking-wider text-indigo-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Suggested</span>
                      </div>
                      <div className="p-3 bg-slate-900 font-mono text-xs text-green-400 overflow-x-auto whitespace-pre">
                          {payload.code}
                      </div>
                      <div className="px-4 py-2 bg-white text-xs text-slate-600 italic border-t border-slate-100">
                          {payload.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* User Payloads / Custom Actions */}
            <div className="lg:col-span-1">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sticky top-28 max-h-[calc(100vh-140px)] overflow-y-auto">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Terminal size={16} /> My Custom Payloads
                </h3>
                
                {/* List of User Payloads */}
                <div className="space-y-3 mb-4 flex-1">
                    {userPayloads.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4 italic border border-dashed border-slate-300 rounded">
                            Chưa có payload nào được thêm.
                        </p>
                    ) : (
                        userPayloads.map((p, idx) => (
                            <div key={idx} className="bg-white border border-indigo-100 rounded-lg shadow-sm relative group">
                                <button 
                                    onClick={() => handleDeletePayload(idx)}
                                    className="absolute top-1 right-1 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={12} />
                                </button>
                                <div className="p-2 bg-slate-800 text-green-400 font-mono text-[10px] rounded-t-lg overflow-x-auto">
                                    {p.code}
                                </div>
                                <div className="p-2 text-xs text-slate-600 border-t border-slate-100">
                                    {p.description}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Add New Payload Form */}
                <div className="mt-auto pt-4 border-t border-slate-200">
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Thêm Payload/Command mới:</label>
                    <input 
                        className="w-full text-xs font-mono bg-white border border-slate-300 rounded px-2 py-1.5 mb-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        placeholder="Ví dụ: ' OR 1=1--"
                        value={newPayloadCode}
                        onChange={e => setNewPayloadCode(e.target.value)}
                    />
                    <input 
                        className="w-full text-xs bg-white border border-slate-300 rounded px-2 py-1.5 mb-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        placeholder="Mô tả ngắn gọn..."
                        value={newPayloadDesc}
                        onChange={e => setNewPayloadDesc(e.target.value)}
                    />
                    <button 
                        onClick={handleAddPayload}
                        disabled={!newPayloadCode.trim()}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-1 transition-colors"
                    >
                        <Plus size={14} /> Thêm vào danh sách
                    </button>
                </div>

              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
             <AIChat test={test} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TestDetail;