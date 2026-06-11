import React from 'react';
import { Document } from '../../types/database';
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { formatBytes, formatDate } from '../../utils/format';

interface DocumentListProps {
  documents: Document[];
  loading: boolean;
}

export const DocumentList: React.FC<DocumentListProps> = ({ documents, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
        <p className="text-slate-500">Loading documents...</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 shadow-sm text-center flex flex-col items-center justify-center min-h-[300px]">
        <FileText className="h-12 w-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-1">No documents yet</h3>
        <p className="text-slate-500">Upload your first PDF to start generating quizzes.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'uploaded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <FileText className="h-3.5 w-3.5" /> Uploaded
          </span>
        );
      case 'extracting':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="h-3.5 w-3.5" /> Extracting PDF
          </span>
        );
      case 'generating':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <Clock className="h-3.5 w-3.5 animate-pulse" /> Generating Quiz
          </span>
        );
      case 'processing': // Legacy fallback
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3.5 w-3.5" /> Processing
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
            <CheckCircle className="h-3.5 w-3.5" /> Completed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="h-3.5 w-3.5" /> Failed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-900">Recent Documents</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
              <th className="px-6 py-3 font-medium">Document</th>
              <th className="px-6 py-3 font-medium">Size</th>
              <th className="px-6 py-3 font-medium">Date Uploaded</th>
              <th className="px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-50 text-red-600 rounded shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-slate-900 truncate max-w-[150px] sm:max-w-[250px]">
                      {doc.file_name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                  {formatBytes(doc.file_size)}
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                  {formatDate(doc.upload_date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(doc.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
