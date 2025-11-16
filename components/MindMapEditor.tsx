'use client';

import { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Download,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  FileImage,
  FileText as FileTextIcon,
  ExternalLink,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface MindMapEditorProps {
  initialData: any;
  onBack: () => void;
}

export default function MindMapEditor({ initialData, onBack }: MindMapEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.edges || []);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [verificationResults, setVerificationResults] = useState<any>(initialData.verifications || {});
  const [verifying, setVerifying] = useState(false);
  const [showSourcePanel, setShowSourcePanel] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setShowSourcePanel(true);
  }, []);

  const addNewNode = () => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'default',
      position: { x: Math.random() * 500, y: Math.random() * 500 },
      data: { label: 'New Concept' },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const deleteNode = () => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
      setSelectedNode(null);
      setShowSourcePanel(false);
    }
  };

  const updateNodeLabel = (nodeId: string, newLabel: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, label: newLabel } } : node
      )
    );
  };

  const verifyNode = async (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setVerifying(true);
    try {
      const response = await fetch('/api/verify-medical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept: node.data.label }),
      });

      const result = await response.json();
      setVerificationResults((prev: any) => ({
        ...prev,
        [nodeId]: result,
      }));

      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                className: result.verified ? 'verified' : 'unverified',
              }
            : n
        )
      );
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setVerifying(false);
    }
  };

  const regenerateNode = async (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setVerifying(true);
    try {
      const response = await fetch('/api/regenerate-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept: node.data.label }),
      });

      const result = await response.json();
      if (result.suggestion) {
        updateNodeLabel(nodeId, result.suggestion);
        await verifyNode(nodeId);
      }
    } catch (error) {
      console.error('Regeneration failed:', error);
    } finally {
      setVerifying(false);
    }
  };

  const exportToPDF = async () => {
    if (!reactFlowWrapper.current) return;

    const canvas = await html2canvas(reactFlowWrapper.current, {
      backgroundColor: '#ffffff',
      scale: 2,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save('mindmap.pdf');
  };

  const exportToJPEG = async () => {
    if (!reactFlowWrapper.current) return;

    const canvas = await html2canvas(reactFlowWrapper.current, {
      backgroundColor: '#ffffff',
      scale: 2,
    });

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'mindmap.jpg';
        link.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/jpeg');
  };

  return (
    <div className="flex h-[calc(100vh-200px)] bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>

        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 space-y-2">
          <button
            onClick={onBack}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            onClick={addNewNode}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Node</span>
          </button>

          <button
            onClick={deleteNode}
            disabled={!selectedNode}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>

          <div className="border-t border-gray-200 pt-2 mt-2">
            <button
              onClick={exportToPDF}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mb-2"
            >
              <FileTextIcon className="w-4 h-4" />
              <span>Export PDF</span>
            </button>

            <button
              onClick={exportToJPEG}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <FileImage className="w-4 h-4" />
              <span>Export JPEG</span>
            </button>
          </div>
        </div>
      </div>

      {showSourcePanel && selectedNode && (
        <div className="w-96 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Node Details</h3>
            <button
              onClick={() => setShowSourcePanel(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Concept Label
              </label>
              <input
                type="text"
                value={selectedNode.data.label}
                onChange={(e) => updateNodeLabel(selectedNode.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => verifyNode(selectedNode.id)}
                disabled={verifying}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Verify</span>
              </button>

              <button
                onClick={() => regenerateNode(selectedNode.id)}
                disabled={verifying}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Regenerate</span>
              </button>
            </div>

            {verificationResults[selectedNode.id] && (
              <div className="mt-4 space-y-3">
                <div
                  className={`p-3 rounded-lg ${
                    verificationResults[selectedNode.id].verified
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {verificationResults[selectedNode.id].verified ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium text-sm text-gray-800">
                        {verificationResults[selectedNode.id].verified
                          ? 'Medically Verified'
                          : 'Needs Review'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {verificationResults[selectedNode.id].summary}
                      </p>
                    </div>
                  </div>
                </div>

                {verificationResults[selectedNode.id].sources && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Sources:</h4>
                    <div className="space-y-2">
                      {verificationResults[selectedNode.id].sources.map(
                        (source: any, idx: number) => (
                          <a
                            key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-2 bg-white border border-gray-200 rounded-lg hover:border-blue-500 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">
                                  {source.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{source.domain}</p>
                              </div>
                              <ExternalLink className="w-4 h-4 text-gray-400 ml-2" />
                            </div>
                          </a>
                        )
                      )}
                    </div>
                  </div>
                )}

                {verificationResults[selectedNode.id].suggestion && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-gray-800 mb-1">
                      Suggested Correction:
                    </p>
                    <p className="text-sm text-gray-600">
                      {verificationResults[selectedNode.id].suggestion}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
