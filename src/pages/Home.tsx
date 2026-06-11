import React from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Home = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center pt-20 text-center">
      <div className="bg-primary-50 p-4 rounded-full mb-8">
        <BrainCircuit className="h-12 w-12 text-primary-600" />
      </div>
      <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
        Generate Quizzes from PDFs <br />
        <span className="text-primary-600">in seconds using AI.</span>
      </h1>
      <p className="text-lg text-slate-600 max-w-2xl mb-10">
        Transform your study materials into interactive multiple-choice questions instantly. Perfect for students preparing for exams and teachers creating assessments.
      </p>
      {user ? (
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-primary-700 transition-all hover:scale-105"
        >
          Go to Dashboard
          <ArrowRight className="h-5 w-5" />
        </Link>
      ) : (
        <div className="flex items-center gap-4">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-primary-700 transition-all hover:scale-105 shadow-md shadow-primary-500/20"
          >
            Get Started
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-white text-slate-700 border border-slate-300 px-8 py-4 rounded-full font-semibold hover:bg-slate-50 transition-all shadow-sm"
          >
            Log in
          </Link>
        </div>
      )}
    </div>
  );
};
