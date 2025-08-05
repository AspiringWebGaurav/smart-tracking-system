'use client';

import React, { useState, useCallback, useEffect } from 'react';

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

interface Document {
  id: string;
  title: string;
  content: string;
  type: string;
  category: string;
  metadata: any;
  uploadedAt: string;
  processed: boolean;
  chunkCount?: number;
}

export default function UnifiedTrainingTab() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load documents on component mount
  useEffect(() => {
    loadDocuments();
  }, []);

  // Load documents from Firebase
  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/ai-assistant/training');
      if (response.ok) {
        const data = await response.json();
        if (data.documents) {
          setDocuments(data.documents);
        }
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

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

      // Reload documents to show the new one
      await loadDocuments();

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

  // Delete a document
  const deleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const response = await fetch('/api/ai-assistant/training', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          documentId
        }),
      });

      if (response.ok) {
        await loadDocuments();
      } else {
        alert('Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error deleting document');
    }
  };

  // Test search functionality
  const testSearch = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter a search query');
      return;
    }

    setIsSearching(true);
    try {
      // Simple search through documents
      const results = documents.filter(doc => 
        doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
      ).map(doc => ({
        content: doc.content.substring(0, 200) + '...',
        title: doc.title,
        category: doc.category,
        similarity: 0.8 // Mock similarity score
      }));

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsSearching(false);
    }
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
          AI Training Data Management
        </h3>
        <p className="text-sm text-gray-600">
          Upload and manage documents to train your AI assistant. Supported formats: PDF, MD, TXT, DOC, DOCX (max 10MB each)
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

      {/* File Upload Queue */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-900">
              Upload Queue ({uploadedFiles.length})
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

      {/* Search Test */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Test Search Functionality</h4>
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your training data..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && testSearch()}
          />
          <button
            onClick={testSearch}
            disabled={isSearching}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-3">
            <h5 className="font-medium text-gray-900">Search Results ({searchResults.length}):</h5>
            {searchResults.map((result, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-blue-600">{result.title}</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {result.category}
                  </span>
                </div>
                <p className="text-gray-700 text-sm">{result.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Training Documents */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">Training Documents ({documents.length})</h4>
        </div>
        
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No documents uploaded yet.</p>
            <p className="text-sm text-gray-400 mt-2">Upload files above to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getFileIcon(doc.title)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                          <div className="text-sm text-gray-500">
                            {doc.chunkCount ? `${doc.chunkCount} chunks` : 'Processing...'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase">
                      {doc.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        doc.processed 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {doc.processed ? 'Processed' : 'Processing'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          📋 How It Works
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Upload:</strong> Drag & drop or select your resume PDF and other documents</li>
          <li>• <strong>Process:</strong> Files are automatically processed and chunked for AI training</li>
          <li>• <strong>Train:</strong> Your AI assistant learns from the uploaded content</li>
          <li>• <strong>Test:</strong> Use the search function to verify content is accessible</li>
          <li>• <strong>Dynamic:</strong> Uploaded files immediately appear in the training data list</li>
        </ul>
      </div>
    </div>
  );
}