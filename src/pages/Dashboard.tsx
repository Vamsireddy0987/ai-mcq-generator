import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardOverview } from '../features/dashboard/DashboardOverview';
import { UploadDocument } from '../features/documents/UploadDocument';
import { DocumentList } from '../features/documents/DocumentList';
import { supabase } from '../lib/supabase';
import { Document, Quiz } from '../types/database';
import { useAuth } from '../hooks/useAuth';
import { Play, History, BrainCircuit, Target } from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    
    // Fetch docs
    const { data: docsData } = await supabase
      .from('documents')
      .select('*')
      .order('upload_date', { ascending: false });

    if (docsData) setDocuments(docsData as Document[]);

    // Fetch quizzes
    const { data: quizData } = await supabase
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false });

    if (quizData) setQuizzes(quizData as Quiz[]);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    if (!user) return;

    // Realtime subscription for both documents and quizzes
    const channel = supabase
      .channel('dashboard_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documents', filter: `user_id=eq.${user.id}` },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quizzes', filter: `user_id=eq.${user.id}` },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <div className="pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Manage your study materials and generated quizzes.</p>
        </div>
        <button 
          onClick={() => navigate('/history')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          <History className="h-4 w-4" /> View History
        </button>
      </div>

      <DashboardOverview 
        documentCount={documents.length}
        quizCount={quizzes.length} 
        averageScore={0} // Can be wired to a backend analytics RPC later
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-1">
          <UploadDocument onUploadComplete={fetchData} />
        </div>
        <div className="lg:col-span-2">
          <DocumentList documents={documents} loading={loading} />
        </div>
      </div>

      {/* Available Quizzes Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center gap-2 bg-slate-50">
          <BrainCircuit className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-bold text-slate-900">Ready to Practice</h3>
        </div>
        
        {quizzes.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No quizzes generated yet. Upload a PDF to get started!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {quizzes.map(quiz => (
              <div key={quiz.id} className="border border-slate-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-md transition-all group flex flex-col bg-white">
                <h4 className="font-semibold text-slate-900 mb-2 line-clamp-2" title={quiz.title}>
                  {quiz.title}
                </h4>
                <div className="flex items-center gap-2 mb-6">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium capitalize">
                    <Target className="h-3 w-3" /> {quiz.difficulty}
                  </span>
                </div>
                <div className="mt-auto">
                  <button 
                    onClick={() => navigate(`/quiz/${quiz.id}/take`)}
                    className="w-full flex items-center justify-center gap-2 bg-primary-50 text-primary-700 font-medium py-2.5 rounded-lg group-hover:bg-primary-600 group-hover:text-white transition-colors"
                  >
                    <Play className="h-4 w-4 fill-current" /> Start Quiz
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
