import React from 'react';
import { FileText, BrainCircuit, Target } from 'lucide-react';

interface DashboardOverviewProps {
  documentCount: number;
  quizCount: number;
  averageScore: number;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ 
  documentCount, 
  quizCount, 
  averageScore 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
          <FileText className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Documents</p>
          <h3 className="text-2xl font-bold text-slate-900">{documentCount}</h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="p-4 bg-primary-50 text-primary-600 rounded-xl">
          <BrainCircuit className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Quizzes Generated</p>
          <h3 className="text-2xl font-bold text-slate-900">{quizCount}</h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="p-4 bg-amber-50 text-amber-600 rounded-xl">
          <Target className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Avg. Score</p>
          <h3 className="text-2xl font-bold text-slate-900">{averageScore}%</h3>
        </div>
      </div>
    </div>
  );
};
