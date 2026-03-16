import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AiOutlineClose } from "react-icons/ai";
import api from '../api/api';

// ─── Node type lookup (fixes 'familys' bug) ───
const typeToKey = { family: 'families', group: 'groups', tag: 'tags' };

// ─── NODE COMPONENTS (outside component to prevent remounting) ───

const FamilyNode = ({ data }) => {
  const isSelected = data.isSelected;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0, border: 'none', background: 'transparent' }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0, border: 'none', background: 'transparent' }} />
      <div style={{
        width: '60px', height: '60px',
        borderRadius: '50%',
        backgroundColor: '#a855f7',
        border: `4px solid ${isSelected ? '#7c3aed' : '#d8b4fe'}`,
        boxShadow: isSelected
          ? '0 0 0 6px rgba(168,85,247,0.35), 0 4px 12px rgba(0,0,0,0.2)'
          : '0 4px 6px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }} />
      <div style={{
        marginTop: '8px', fontSize: '12px', fontWeight: '500',
        color: '#4b5563', whiteSpace: 'nowrap',
      }}>
        {data.label}
      </div>
    </div>
  );
};

const GroupNode = ({ data }) => {
  const isSelected = data.isSelected;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0, border: 'none', background: 'transparent' }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0, border: 'none', background: 'transparent' }} />
      <div style={{
        width: '44px', height: '44px',
        borderRadius: '50%',
        backgroundColor: '#eab308',
        border: `3px solid ${isSelected ? '#a16207' : '#fde047'}`,
        boxShadow: isSelected
          ? '0 0 0 6px rgba(234,179,8,0.35), 0 4px 12px rgba(0,0,0,0.2)'
          : '0 4px 6px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }} />
      <div style={{
        marginTop: '8px', fontSize: '12px', fontWeight: '500',
        color: '#4b5563', whiteSpace: 'nowrap',
      }}>
        {data.label}
      </div>
    </div>
  );
};

const TagNode = ({ data }) => {
  const isSelected = data.isSelected;
  const isActive = data.isActive !== false;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0, border: 'none', background: 'transparent' }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0, border: 'none', background: 'transparent' }} />
      <div style={{
        width: '30px', height: '30px',
        borderRadius: '50%',
        backgroundColor: isActive ? '#10b981' : '#6b7280',
        border: `2px solid ${isActive ? '#6ee7b7' : '#9ca3af'}`,
        boxShadow: isSelected
          ? '0 0 0 5px rgba(16,185,129,0.35), 0 2px 8px rgba(0,0,0,0.15)'
          : '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }} />
      <div style={{
        marginTop: '6px', fontSize: '12px', fontWeight: '500',
        color: '#4b5563', whiteSpace: 'nowrap',
      }}>
        {data.label}
      </div>
    </div>
  );
};

// ─── CRITICAL: defined outside component ───
const nodeTypes = { family: FamilyNode, group: GroupNode, tag: TagNode };

// ─────────────────────────────────────────────
function NetworkViewInner({ onClose }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const reactFlowInstance = useReactFlow();

  const [visibility, setVisibility] = useState({
    families: true, groups: true, tags: true,
  });

  const fetchNetworkData = async () => {
    try {
      setLoading(true);
      const [famRes, grpRes, tagRes] = await Promise.all([
        api.get('/families'),
        api.get('/groups'),
        api.get('/tags'),
      ]);

      const families = famRes.data;
      const groups   = grpRes.data;
      const tags     = tagRes.data;

      const newNodes = [];
      const newEdges = [];

      // Column X positions
      const famX = -100;
      const grpX = 280;
      const tagX = 700;

      // Y gaps per column
      const famYGap = 160;
      const grpYGap = 120;
      const tagYGap = 80;

      // Vertically center each column
      const famH = Math.max(0, (families.length - 1) * famYGap);
      const grpH = Math.max(0, (groups.length   - 1) * grpYGap);
      const tagH = Math.max(0, (tags.length     - 1) * tagYGap);
      const maxH = Math.max(famH, grpH, tagH);

      const famStartY = (maxH - famH) / 2;
      const grpStartY = (maxH - grpH) / 2;
      const tagStartY = (maxH - tagH) / 2;

      // Family nodes
      families.forEach((fam, i) => {
        const id = `fam-${fam._id}`;
        newNodes.push({
          id,
          type: 'family',
          position: { x: famX, y: famStartY + i * famYGap },
          width: 80, height: 90,
          style: { background: 'transparent', border: 'none', padding: 0, boxShadow: 'none' },
          data: { label: fam.name, originalData: fam, type: 'family', isSelected: false },
        });

        (Array.isArray(fam.groups) ? fam.groups : []).forEach((g) => {
          const gid = typeof g === 'object' ? g._id : g;
          if (gid) newEdges.push({
            id: `e-${id}-grp-${gid}`,
            source: id,
            target: `grp-${gid}`,
            type: 'default',
            style: { stroke: '#8b5cf6', strokeWidth: 1.5 },
            // animated: true,
          });
        });
      });

      // Group nodes
      groups.forEach((grp, i) => {
        const id = `grp-${grp._id}`;
        newNodes.push({
          id,
          type: 'group',
          position: { x: grpX, y: grpStartY + i * grpYGap },
          width: 60, height: 70,
          style: { background: 'transparent', border: 'none', padding: 0, boxShadow: 'none' },
          data: { label: grp.name, originalData: grp, type: 'group', isSelected: false },
        });

        (Array.isArray(grp.tags) ? grp.tags : []).forEach((t) => {
          const tid = typeof t === 'object' ? t._id : t;
          if (tid) newEdges.push({
            id: `e-${id}-tag-${tid}`,
            source: id,
            target: `tag-${tid}`,
            type: 'default',
            style: { stroke: '#10b981', strokeWidth: 1.5 },
          });
        });
      });

      // Tag nodes
      tags.forEach((tag, i) => {
        newNodes.push({
          id: `tag-${tag._id}`,
          type: 'tag',
          position: { x: tagX, y: tagStartY + i * tagYGap },
          width: 50, height: 55,
          style: { background: 'transparent', border: 'none', padding: 0, boxShadow: 'none' },
          data: { label: tag.name, originalData: tag, isActive: tag.isActive, type: 'tag', isSelected: false },
        });
      });

      setNodes(newNodes);
      setEdges(newEdges);

      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.25, duration: 400 });
      }, 300);

    } catch (err) {
      console.error('Network fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Selection: fade unselected nodes & edges ──
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        style: {
          background: 'transparent', border: 'none', padding: 0, boxShadow: 'none',
          opacity: selectedNodeId && n.id !== selectedNodeId ? 0.2 : 1,
          filter:  selectedNodeId && n.id !== selectedNodeId ? 'blur(0.8px)' : 'none',
          transition: 'opacity 0.25s ease, filter 0.25s ease',
          zIndex: n.id === selectedNodeId ? 10 : 1,
        },
        data: { ...n.data, isSelected: n.id === selectedNodeId },
      }))
    );
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        style: {
          ...e.style,
          opacity: selectedNodeId && e.source !== selectedNodeId && e.target !== selectedNodeId
            ? 0.08 : 1,
          transition: 'opacity 0.25s ease',
        },
      }))
    );
  }, [selectedNodeId, setNodes, setEdges]);

  const handleVisibilityToggle = (type) => {
    setVisibility((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const onNodeClick = useCallback((_, node) => {
    setSelectedNodeId((prev) => prev === node.id ? null : node.id);
    setSelectedNode((prev) => prev?.id === node.id ? null : node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedNode(null);
  }, []);

  // ── FIXED: use typeToKey to avoid 'familys' bug ──
  const visibleNodes = useMemo(() =>
    nodes.filter(n => visibility[typeToKey[n.data.type]])
  , [nodes, visibility]);

  const visibleEdges = useMemo(() => {
    return edges.filter(e => {
      const src = nodes.find(n => n.id === e.source);
      const tgt = nodes.find(n => n.id === e.target);
      if (!src || !tgt) return false;
      return visibility[typeToKey[src.data.type]] && visibility[typeToKey[tgt.data.type]];
    });
  }, [edges, nodes, visibility]);

  const zoomLevel = reactFlowInstance.getZoom
    ? Math.round(reactFlowInstance.getZoom() * 100) : 100;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
      display: 'flex', height: '100vh', width: '100vw',
      backgroundColor: '#fff', overflow: 'hidden',
    }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: '240px', minWidth: '240px',
        borderRight: '1px solid #e5e7eb', padding: '24px',
        display: 'flex', flexDirection: 'column',
        backgroundColor: '#fff', overflowY: 'auto',
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
          Curved Tree Network
        </h3>
        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 24px 0' }}>
          Organic visualization of tag relationships
        </p>

        <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 16px 0' }}>
          Visibility Controls
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
          {[
            { key: 'families', label: 'Tag Families',    color: '#a855f7' },
            { key: 'groups',   label: 'Tag Groups',      color: '#eab308' },
            { key: 'tags',     label: 'Individual Tags', color: '#10b981' },
          ].map(({ key, label, color }) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color, fontSize: '16px' }}>●</span> {label}
              </span>
              <label className="switch">
                <input type="checkbox" checked={visibility[key]} onChange={() => handleVisibilityToggle(key)} />
                <span className="slider"></span>
              </label>
            </div>
          ))}
        </div>

        {selectedNode ? (
          <div style={{
            padding: '16px', border: '1px solid #e5e7eb', borderRadius: '12px',
            marginBottom: '24px', backgroundColor: '#f9fafb',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{
                color: selectedNode.data.type === 'family' ? '#a855f7'
                     : selectedNode.data.type === 'group'  ? '#eab308' : '#10b981',
                fontSize: '18px',
              }}>●</span>
              <span style={{ fontWeight: '600', fontSize: '16px', color: '#111827' }}>
                {selectedNode.data.label}
              </span>
            </div>
            <span style={{
              fontSize: '10px', padding: '4px 10px', borderRadius: '12px',
              backgroundColor: '#ede9fe', color: '#6d28d9',
              textTransform: 'uppercase', fontWeight: '600',
              display: 'inline-block', marginBottom: '16px',
            }}>
              {selectedNode.data.type}
            </span>
            <div style={{ fontSize: '12px', color: '#4b5563' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '10px', textTransform: 'uppercase', fontWeight: '600', color: '#9ca3af' }}>Description</p>
              <p style={{ margin: '0 0 16px 0', lineHeight: '1.4' }}>
                {selectedNode.data.originalData?.description || 'No description available.'}
              </p>
              <p style={{ margin: '0 0 4px 0', fontSize: '10px', textTransform: 'uppercase', fontWeight: '600', color: '#9ca3af' }}>Type</p>
              <p style={{ margin: 0, textTransform: 'capitalize' }}>{selectedNode.data.type}</p>
            </div>
          </div>
        ) : (
          <div style={{
            padding: '24px 16px', border: '1px dashed #d1d5db', borderRadius: '12px',
            marginBottom: '24px', textAlign: 'center', color: '#6b7280', fontSize: '13px',
          }}>
            <p style={{ margin: 0 }}>Click on a node to view details</p>
          </div>
        )}

        <div style={{ marginTop: 'auto', borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Network Statistics</h4>
          {[
            { label: 'Total Nodes:', value: visibleNodes.length },
            { label: 'Connections:', value: visibleEdges.length },
            { label: 'Zoom Level:',  value: `${zoomLevel}%` },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#4b5563' }}>
              <span>{label}</span>
              <span style={{ fontWeight: '600', color: '#111827' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Canvas ── */}
      <div style={{
        flex: 1, position: 'relative',
        backgroundColor: '#f9fafb',
        height: '100vh', width: '100%',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px', zIndex: 10,
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 16px', backgroundColor: '#fff',
          border: '1px solid #e5e7eb', borderRadius: '8px',
          cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', fontSize: '14px',
        }}>
          <AiOutlineClose /> Close Network View
        </button>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#6b7280' }}>
            Loading network...
          </div>
        ) : (
          <ReactFlow
            nodes={visibleNodes}
            edges={visibleEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            style={{ width: '100%', height: '100%' }}
            attributionPosition="bottom-right"
            minZoom={0.1}
            maxZoom={2}
            nodesDraggable={true}
            nodesConnectable={false}
            selectNodesOnDrag={false}
            nodesFocusable={false}
            elementsSelectable={true}
          >
            <Background color="#e5e7eb" gap={20} size={1} />
            <Controls />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}

export default function NetworkView({ onClose }) {
  return (
    <ReactFlowProvider>
      <NetworkViewInner onClose={onClose} />
    </ReactFlowProvider>
  );
}