import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentApi } from '../utils/api';
import { Button } from '@/components/ui/button';
import { Scale, ArrowLeft, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const DocumentAnalysis = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [documentId, setDocumentId] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setAnalyzing(true);
    try {
      const result = await documentApi.analyze(file);
      setAnalysis(result.analysis);
      setDocumentId(result.id);
      toast.success('Document analyzed successfully');
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Error analyzing document';
      toast.error(errorMessage);
      console.error('Analysis error:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExportAnalysis = async (format) => {
    if (!documentId) {
      toast.error('No analysis to export');
      return;
    }

    try {
      const blob = await documentApi.exportAnalysis(documentId, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis_${documentId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Analysis exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Error exporting analysis');
      console.error('Export error:', error);
    }
  };

  const getRiskColor = (level) => {
    switch (level.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="document-analysis-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                data-testid="back-button"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-2">
                <Scale className="w-6 h-6 text-green-500" />
                <h1 className="text-2xl font-bold text-gray-900">Document Analysis</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Document</h2>
              <p className="text-gray-600 mb-6">
                Upload your legal document for AI-powered analysis
              </p>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  dragActive
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-green-400'
                }`}
                data-testid="drop-zone"
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 mb-2">
                  Drag and drop your file here, or click to browse
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Supported formats: PDF, DOCX, TXT, JPG, PNG
                </p>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  data-testid="file-input"
                />
                <label htmlFor="file-upload">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-2 border-green-500 text-green-600 hover:bg-green-50"
                    onClick={() => document.getElementById('file-upload').click()}
                    data-testid="browse-button"
                  >
                    Browse Files
                  </Button>
                </label>
              </div>

              {file && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg" data-testid="file-preview">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-600">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="text-red-600 hover:text-red-700"
                      data-testid="remove-file-button"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              <Button
                onClick={handleAnalyze}
                disabled={!file || analyzing}
                className="w-full mt-6 bg-green-500 hover:bg-green-600 text-white h-12"
                data-testid="analyze-button"
              >
                {analyzing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </div>
                ) : (
                  'Analyze Document'
                )}
              </Button>
            </div>
          </div>

          {/* Results Section */}
          <div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Analysis Results</h2>
              
              {!analysis ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No analysis yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Upload a document to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-6" data-testid="analysis-results">
                  {/* Key Points */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      Key Points
                    </h3>
                    <ul className="space-y-2">
                      {analysis.key_points?.map((point, index) => (
                        <li key={index} className="text-sm text-gray-700 pl-4 border-l-2 border-green-200">
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Risk Assessment */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                      <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                      Risk Assessment
                    </h3>
                    <div className="space-y-2">
                      {analysis.risks?.map((risk, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${getRiskColor(risk.level)}`}
                        >
                          <p className="font-medium text-sm mb-1">
                            Risk Level: {risk.level.toUpperCase()}
                          </p>
                          <p className="text-sm">{risk.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3">Suggestions</h3>
                    <ul className="space-y-2">
                      {analysis.suggestions?.map((suggestion, index) => (
                        <li key={index} className="text-sm text-gray-700 pl-4 border-l-2 border-blue-200">
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Full Analysis */}
                  {analysis.full_analysis && (
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3">Detailed Analysis</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {analysis.full_analysis}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Export Buttons */}
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleExportAnalysis('pdf')}
                      className="w-full bg-green-500 hover:bg-green-600 text-white"
                      data-testid="export-analysis-pdf"
                    >
                      Export as PDF
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => handleExportAnalysis('docx')}
                        variant="outline"
                        className="border-green-500 text-green-600 hover:bg-green-50"
                        data-testid="export-analysis-docx"
                      >
                        Export as DOCX
                      </Button>
                      <Button
                        onClick={() => handleExportAnalysis('txt')}
                        variant="outline"
                        className="border-green-500 text-green-600 hover:bg-green-50"
                        data-testid="export-analysis-txt"
                      >
                        Export as TXT
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentAnalysis;