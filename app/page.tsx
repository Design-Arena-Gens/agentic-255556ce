'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import MindMapEditor from '@/components/MindMapEditor';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [mindMapData, setMindMapData] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile || uploadedFile.type !== 'application/pdf') {
      setError('Please upload a valid PDF file');
      return;
    }

    setFile(uploadedFile);
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const response = await fetch('/api/process-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process PDF');
      }

      const data = await response.json();
      setMindMapData(data);
    } catch (err) {
      setError('Failed to process PDF. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Medical Mind Map AI
          </h1>
          <p className="text-gray-600">
            Convert PDF notes to interactive mind maps with AI-powered medical accuracy verification
          </p>
        </header>

        {!mindMapData ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <Upload className="w-10 h-10 text-blue-600" />
                </div>

                <h2 className="text-2xl font-semibold text-gray-800">
                  Upload Your PDF Notes
                </h2>

                <p className="text-gray-600 text-center">
                  Upload your medical notes in PDF format. Our AI will extract the content,
                  create an interactive mind map, and verify medical accuracy.
                </p>

                <label className="w-full">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={loading}
                  />
                  <div className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    {loading ? (
                      <div className="flex flex-col items-center space-y-2">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="text-gray-600">Processing PDF...</p>
                      </div>
                    ) : (
                      <>
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">
                          Click to browse or drag and drop your PDF file here
                        </p>
                      </>
                    )}
                  </div>
                </label>

                {error && (
                  <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <p className="text-red-800">{error}</p>
                  </div>
                )}

                {file && !loading && (
                  <div className="w-full bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <p className="text-green-800">File uploaded: {file.name}</p>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Features:</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    AI-powered extraction of key concepts from PDF notes
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    Interactive mind map with draggable nodes and connections
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    Medical accuracy verification with reputable sources
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    Edit, add, or remove nodes and connections
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    Export to PDF or JPEG format
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <MindMapEditor
            initialData={mindMapData}
            onBack={() => {
              setMindMapData(null);
              setFile(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
