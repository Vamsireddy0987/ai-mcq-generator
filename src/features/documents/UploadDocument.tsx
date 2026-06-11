import React, { useState, useRef } from 'react';
import { UploadCloud, File, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { formatBytes } from '../../utils/format';

interface UploadDocumentProps {
  onUploadComplete: () => void;
}

export const UploadDocument: React.FC<UploadDocumentProps> = ({ onUploadComplete }) => {
  const { user } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (selectedFile: File) => {
    setError('');
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return false;
    }
    if (selectedFile.size > MAX_SIZE) {
      setError('File size must be less than 20MB.');
      return false;
    }
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);
    setError('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`; // Enforce RLS folder structure

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Insert metadata into Database
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          file_name: file.name,
          storage_path: filePath,
          file_size: file.size,
          status: 'uploaded' // Will trigger webhook
        });

      if (dbError) throw dbError;

      setFile(null);
      onUploadComplete();
    } catch (err: any) {
      setError(err.message || 'An error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Upload Study Material</h3>
      
      {!file ? (
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
            dragActive ? 'border-primary-500 bg-primary-50' : 'border-slate-300 hover:border-primary-400 hover:bg-slate-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            onChange={handleChange}
            className="hidden"
          />
          <UploadCloud className="h-10 w-10 text-slate-400 mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-700 mb-1">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-slate-500">PDF up to 20MB</p>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg shrink-0">
                <File className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
              </div>
            </div>
            <button
              onClick={() => setFile(null)}
              disabled={uploading}
              className="text-slate-400 hover:text-slate-600 disabled:opacity-50 shrink-0 ml-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full bg-primary-600 text-white py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
              </>
            ) : (
              'Upload and Generate Quiz'
            )}
          </button>
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
      )}
    </div>
  );
};
