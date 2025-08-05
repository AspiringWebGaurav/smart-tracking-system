'use client';

import React, { useState, useCallback } from 'react';

interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  processedData?: {
    text: string;
    metadata: any;
    chunks: number;
  };
}

export default function FileUploadTab() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  }, []);

  // Process selected files
  const handleFiles = (files: File[]) => {
    const supportedTypes = [
      'application/pdf',
      'text/markdown',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const validFiles = files.filter(file => {
      const isValidType = supportedTypes.includes(file.type) || 
                         file.name.endsWith('.md') || 
                         file.name.endsWith('.txt') ||
                         file.name.endsWith('.pdf');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      
      if (!isValidType) {
        alert(`File ${file.name} is not supported. Please upload PDF, MD, TXT, or DOC files.`);
        return false;
      }
      
      if (!isValidSize) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      
      return true;
    });

    const newFiles: UploadedFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'pending',
      progress: 0
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  // Remove file from upload list
  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  // Process a single file
  const processFile = async (uploadedFile: UploadedFile) => {
    try {
      // Update status to processing
      setUploadedFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, status: 'processing', progress: 10 }
          : f
      ));

      const { file } = uploadedFile;

      // Update progress
      setUploadedFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, progress: 30 }
          : f
      ));

      // Convert file to base64 for server processing
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Update progress
      setUploadedFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, progress: 50 }
          : f
      ));

      // Send file to server for processing
      const response = await fetch('/api/ai-assistant/training', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'upload',
          fileData,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          uploadId: uploadedFile.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Mark as completed
      setUploadedFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { 
              ...f, 
              status: 'completed', 
              progress: 100,
              processedData: {
                text: result.preview || 'File processed successfully',
                metadata: result.metadata || {},
                chunks: result.chunks || 1
              }
            }
          : f
      ));

    } catch (error) {
      console.error('Error processing file:', error);
      setUploadedFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { 
              ...f, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          : f
      ));
    }
  };

  // Process all pending files
  const processAllFiles = async () => {
    setIsProcessing(true);
    const pendingFiles = uploadedFiles.filter(f => f.status === 'pending');
    
    for (const file of pendingFiles) {
      await processFile(file);
    }
    
    setIsProcessing(false);
  };

  // Get file type icon
  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.pdf')) return '📄';
    if (fileName.endsWith('.md')) return '📝';
    if (fileName.endsWith('.txt')) return '📄';
    if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return '📄';
    return '📄';
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'processing': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Upload Training Documents
        </h3>
        <p className="text-sm text-gray-600">
          Upload PDF resumes, markdown files, or text documents to train your AI assistant.
          Supported formats: PDF, MD, TXT, DOC, DOCX (max 10MB each)
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
      >
        <div className="mx-auto mb-4 text-6xl">📤</div>
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900">
            Drop files here or click to upload
          </p>
          <p className="text-sm text-gray-500">
            PDF, Markdown, Text, Word documents up to 10MB
          </p>
        </div>
        
        <input
          type="file"
          multiple
          accept=".pdf,.md,.txt,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
        >
          Select Files
        </label>
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-900">
              Uploaded Files ({uploadedFiles.length})
            </h4>
            {uploadedFiles.some(f => f.status === 'pending') && (
              <button
                onClick={processAllFiles}
                disabled={isProcessing}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Processing...
                  </>
                ) : (
                  'Process All Files'
                )}
              </button>
            )}
          </div>

          <div className="space-y-3">
            {uploadedFiles.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <span className="text-2xl">{getFileIcon(uploadedFile.file.name)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadedFile.file.name}
                    </p>
                    <div className="flex items-center space-x-4 mt-1">
                      <p className="text-xs text-gray-500">
                        {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p className={`text-xs font-medium ${getStatusColor(uploadedFile.status)}`}>
                        {uploadedFile.status.charAt(0).toUpperCase() + uploadedFile.status.slice(1)}
                      </p>
                      {uploadedFile.status === 'processing' && (
                        <p className="text-xs text-blue-600">
                          {uploadedFile.progress}%
                        </p>
                      )}
                    </div>
                    
                    {/* Progress bar */}
                    {uploadedFile.status === 'processing' && (
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${uploadedFile.progress}%` }}
                        />
                      </div>
                    )}
                    
                    {/* Success info */}
                    {uploadedFile.status === 'completed' && uploadedFile.processedData && (
                      <div className="mt-2 text-xs text-green-600">
                        ✓ Processed into {uploadedFile.processedData.chunks} chunks
                      </div>
                    )}
                    
                    {/* Error message */}
                    {uploadedFile.status === 'error' && uploadedFile.error && (
                      <div className="mt-2 text-xs text-red-600">
                        ✗ {uploadedFile.error}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {uploadedFile.status === 'completed' && (
                    <span className="text-green-500 text-lg">✅</span>
                  )}
                  {uploadedFile.status === 'error' && (
                    <span className="text-red-500 text-lg">❌</span>
                  )}
                  {uploadedFile.status === 'processing' && (
                    <span className="text-blue-500 text-lg animate-spin">⏳</span>
                  )}
                  
                  <button
                    onClick={() => removeFile(uploadedFile.id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                    disabled={uploadedFile.status === 'processing'}
                    title="Remove file"
                    aria-label="Remove file"
                  >
                    <span className="text-red-500">❌</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          📋 Upload Instructions
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>PDF Resume:</strong> Upload your resume PDF for comprehensive AI training</li>
          <li>• <strong>Experience Documents:</strong> Upload work experience or project details</li>
          <li>• <strong>Certificates:</strong> Upload certification documents</li>
          <li>• <strong>Markdown Files:</strong> Upload README.md or other documentation</li>
          <li>• <strong>Processing:</strong> Files are automatically processed and stored in Firebase</li>
          <li>• <strong>AI Training:</strong> Uploaded content enhances AI responses about you</li>
        </ul>
      </div>
    </div>
  );
}