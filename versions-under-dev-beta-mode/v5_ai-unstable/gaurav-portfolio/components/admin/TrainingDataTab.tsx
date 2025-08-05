"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface Document {
  id: string;
  fileName: string;
  fileType: string;
  category: string;
  title: string;
  wordCount: number;
  chunks: number;
  createdAt: string;
  updatedAt: string;
}

interface VectorStats {
  totalEmbeddings: number;
  categoryCounts: Record<string, number>;
  averageImportance: number;
}

interface SearchResult {
  content: string;
  similarity: number;
  section: string;
  importance: number;
  keywords: string[];
}

const TrainingDataTab: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [vectorStats, setVectorStats] = useState<VectorStats | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load initial data
  useEffect(() => {
    loadDocuments();
    loadVectorStats();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/ai-assistant/training?action=list_documents');
      const data = await response.json();
      
      if (data.success) {
        setDocuments(data.data.documents);
      } else {
        toast.error('Failed to load documents');
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Error loading documents');
    }
  };

  const loadVectorStats = async () => {
    try {
      const response = await fetch('/api/ai-assistant/training?action=vector_stats');
      const data = await response.json();
      
      if (data.success) {
        setVectorStats(data.data);
      } else {
        toast.error('Failed to load vector statistics');
      }
    } catch (error) {
      console.error('Error loading vector stats:', error);
      toast.error('Error loading vector statistics');
    }
  };

  const processTrainingFiles = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/ai-assistant/training', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'process_training_files'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Processing complete! Processed: ${data.data.processed}, Skipped: ${data.data.skipped}, Errors: ${data.data.errors}`);
        
        // Show detailed results
        data.data.results.forEach((result: any) => {
          if (result.status === 'success') {
            toast.success(`✅ ${result.file}: ${result.chunks} chunks created`);
          } else if (result.status === 'skipped') {
            toast.info(`⏭️ ${result.file}: ${result.reason}`);
          } else if (result.status === 'error') {
            toast.error(`❌ ${result.file}: ${result.error}`);
          }
        });
        
        // Reload data
        loadDocuments();
        loadVectorStats();
      } else {
        toast.error(`Processing failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error processing training files:', error);
      toast.error('Error processing training files');
    } finally {
      setIsProcessing(false);
    }
  };

  const testSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/ai-assistant/training?action=search_test&query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.data.results);
        toast.success(`Found ${data.data.results.length} results`);
      } else {
        toast.error('Search failed');
      }
    } catch (error) {
      console.error('Error testing search:', error);
      toast.error('Error testing search');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document and all its embeddings?')) {
      return;
    }

    try {
      const response = await fetch('/api/ai-assistant/training', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Document deleted successfully');
        loadDocuments();
        loadVectorStats();
      } else {
        toast.error(`Delete failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Error deleting document');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">AI Training Data Management</h2>
        <button
          onClick={processTrainingFiles}
          disabled={isProcessing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Process Training Files
            </>
          )}
        </button>
      </div>

      {/* Statistics Cards */}
      {vectorStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Total Embeddings</h3>
            <p className="text-3xl font-bold text-blue-400">{vectorStats.totalEmbeddings}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Categories</h3>
            <div className="space-y-1">
              {Object.entries(vectorStats.categoryCounts).map(([category, count]) => (
                <div key={category} className="flex justify-between text-sm">
                  <span className="text-gray-300 capitalize">{category}:</span>
                  <span className="text-white font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Avg. Importance</h3>
            <p className="text-3xl font-bold text-green-400">{vectorStats.averageImportance.toFixed(1)}/10</p>
          </div>
        </div>
      )}

      {/* Search Test */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-4">Test Search Functionality</h3>
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter search query (e.g., 'Gaurav experience', 'React projects')"
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            onKeyPress={(e) => e.key === 'Enter' && testSearch()}
          />
          <button
            onClick={testSearch}
            disabled={isLoading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Searching...' : 'Test Search'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-lg font-medium text-white">Search Results:</h4>
            {searchResults.map((result, index) => (
              <div key={index} className="bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-blue-400 uppercase">{result.section}</span>
                  <div className="flex gap-2 text-xs">
                    <span className="bg-green-600 px-2 py-1 rounded">
                      Similarity: {(result.similarity * 100).toFixed(1)}%
                    </span>
                    <span className="bg-purple-600 px-2 py-1 rounded">
                      Importance: {result.importance}/10
                    </span>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-2">{result.content}</p>
                <div className="flex flex-wrap gap-1">
                  {result.keywords.map((keyword, i) => (
                    <span key={i} className="bg-gray-600 text-xs px-2 py-1 rounded">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documents List */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-4">Processed Documents</h3>
        
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No documents processed yet.</p>
            <p className="text-sm text-gray-500 mt-2">Click "Process Training Files" to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300">File Name</th>
                  <th className="text-left py-3 px-4 text-gray-300">Category</th>
                  <th className="text-left py-3 px-4 text-gray-300">Type</th>
                  <th className="text-left py-3 px-4 text-gray-300">Words</th>
                  <th className="text-left py-3 px-4 text-gray-300">Chunks</th>
                  <th className="text-left py-3 px-4 text-gray-300">Created</th>
                  <th className="text-left py-3 px-4 text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-gray-700 hover:bg-gray-700">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-white font-medium">{doc.fileName}</p>
                        <p className="text-xs text-gray-400">{doc.title}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-blue-600 text-xs px-2 py-1 rounded capitalize">
                        {doc.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300 uppercase">{doc.fileType}</td>
                    <td className="py-3 px-4 text-gray-300">{doc.wordCount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-300">{doc.chunks}</td>
                    <td className="py-3 px-4 text-gray-300">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="text-red-400 hover:text-red-300 text-xs"
                        title="Delete document and embeddings"
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
      <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
        <h4 className="text-lg font-medium text-blue-400 mb-2">Instructions</h4>
        <ul className="text-sm text-blue-200 space-y-1">
          <li>• Click "Process Training Files" to analyze your resume and markdown files</li>
          <li>• Use the search test to verify the AI can find relevant information</li>
          <li>• The AI will use this processed data to answer questions about you</li>
          <li>• Higher importance scores mean more relevant content for AI responses</li>
          <li>• PDF processing requires additional setup - currently only markdown files are processed</li>
        </ul>
      </div>
    </div>
  );
};

export default TrainingDataTab;