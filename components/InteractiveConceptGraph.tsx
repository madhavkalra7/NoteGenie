'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface GraphNode {
  id: string
  label: string
  level: number
  x?: number
  y?: number
  vx?: number
  vy?: number
  category?: string
}

interface GraphEdge {
  from: string
  to: string
  relationship: string
}

interface InteractiveConceptGraphProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

// Color palette for nodes based on level
const nodeColors = [
  { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: '#667eea' }, // Level 0 - Purple
  { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', border: '#f5576c' }, // Level 1 - Pink
  { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', border: '#4facfe' }, // Level 2 - Blue
  { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', border: '#43e97b' }, // Level 3 - Green
  { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', border: '#fa709a' }, // Level 4 - Orange
  { bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', border: '#a8edea' }, // Level 5 - Teal
]

const relationshipColors: Record<string, string> = {
  'depends-on': '#ff6b6b',
  'relates-to': '#4ecdc4',
  'is-part-of': '#ffe66d',
  'leads-to': '#95e1d3',
  'contrasts-with': '#f38181',
}

export default function InteractiveConceptGraph({ nodes: initialNodes, edges }: InteractiveConceptGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragNode, setDragNode] = useState<GraphNode | null>(null)
  const animationRef = useRef<number>()
  const [isSimulating, setIsSimulating] = useState(true)

  // Initialize node positions in a circular layout
  useEffect(() => {
    if (initialNodes.length === 0) return

    const centerX = dimensions.width / 2
    const centerY = dimensions.height / 2
    const radius = Math.min(dimensions.width, dimensions.height) * 0.35

    const positionedNodes = initialNodes.map((node, index) => {
      const angle = (index / initialNodes.length) * 2 * Math.PI - Math.PI / 2
      return {
        ...node,
        x: centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 50,
        y: centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 50,
        vx: 0,
        vy: 0,
      }
    })

    setNodes(positionedNodes)
  }, [initialNodes, dimensions])

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: 500,
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Force simulation
  const simulate = useCallback(() => {
    if (nodes.length === 0 || !isSimulating) return

    setNodes(prevNodes => {
      const newNodes = prevNodes.map(node => ({ ...node }))

      // Apply forces
      newNodes.forEach((node, i) => {
        if (dragNode && node.id === dragNode.id) return

        let fx = 0
        let fy = 0

        // Repulsion between nodes
        newNodes.forEach((other, j) => {
          if (i === j) return
          const dx = (node.x || 0) - (other.x || 0)
          const dy = (node.y || 0) - (other.y || 0)
          const distance = Math.sqrt(dx * dx + dy * dy) || 1
          const force = 3000 / (distance * distance)
          fx += (dx / distance) * force
          fy += (dy / distance) * force
        })

        // Attraction along edges
        edges.forEach(edge => {
          let otherNode: GraphNode | undefined
          if (edge.from === node.id) {
            otherNode = newNodes.find(n => n.id === edge.to)
          } else if (edge.to === node.id) {
            otherNode = newNodes.find(n => n.id === edge.from)
          }

          if (otherNode) {
            const dx = (otherNode.x || 0) - (node.x || 0)
            const dy = (otherNode.y || 0) - (node.y || 0)
            const distance = Math.sqrt(dx * dx + dy * dy) || 1
            const force = distance * 0.01
            fx += (dx / distance) * force
            fy += (dy / distance) * force
          }
        })

        // Center gravity
        const centerX = dimensions.width / 2
        const centerY = dimensions.height / 2
        fx += (centerX - (node.x || 0)) * 0.01
        fy += (centerY - (node.y || 0)) * 0.01

        // Update velocity with damping
        node.vx = (node.vx || 0) * 0.9 + fx * 0.1
        node.vy = (node.vy || 0) * 0.9 + fy * 0.1

        // Update position
        node.x = (node.x || 0) + (node.vx || 0)
        node.y = (node.y || 0) + (node.vy || 0)

        // Boundary constraints
        const padding = 60
        node.x = Math.max(padding, Math.min(dimensions.width - padding, node.x || 0))
        node.y = Math.max(padding, Math.min(dimensions.height - padding, node.y || 0))
      })

      return newNodes
    })
  }, [nodes.length, edges, dimensions, dragNode, isSimulating])

  // Animation loop
  useEffect(() => {
    const animate = () => {
      simulate()
      animationRef.current = requestAnimationFrame(animate)
    }
    animate()
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [simulate])

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || nodes.length === 0) return

    // Set canvas size for retina displays
    const dpr = window.devicePixelRatio || 1
    canvas.width = dimensions.width * dpr
    canvas.height = dimensions.height * dpr
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height)

    // Draw animated background pattern
    const time = Date.now() * 0.001
    ctx.fillStyle = 'rgba(249, 250, 251, 0.8)'
    ctx.fillRect(0, 0, dimensions.width, dimensions.height)

    // Draw edges with glow effect
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from)
      const toNode = nodes.find(n => n.id === edge.to)
      if (!fromNode || !toNode || !fromNode.x || !fromNode.y || !toNode.x || !toNode.y) return

      const isHighlighted = selectedNode && (selectedNode.id === edge.from || selectedNode.id === edge.to)
      const color = relationshipColors[edge.relationship] || '#888'

      // Draw glow
      if (isHighlighted) {
        ctx.strokeStyle = color
        ctx.lineWidth = 6
        ctx.globalAlpha = 0.3
        ctx.beginPath()
        ctx.moveTo(fromNode.x, fromNode.y)
        
        // Curved edge
        const midX = (fromNode.x + toNode.x) / 2
        const midY = (fromNode.y + toNode.y) / 2 - 30
        ctx.quadraticCurveTo(midX, midY, toNode.x, toNode.y)
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      // Draw edge
      ctx.strokeStyle = isHighlighted ? color : '#ccc'
      ctx.lineWidth = isHighlighted ? 3 : 2
      ctx.setLineDash(edge.relationship === 'contrasts-with' ? [5, 5] : [])
      
      ctx.beginPath()
      ctx.moveTo(fromNode.x, fromNode.y)
      
      // Curved edge
      const midX = (fromNode.x + toNode.x) / 2
      const midY = (fromNode.y + toNode.y) / 2 - 20
      ctx.quadraticCurveTo(midX, midY, toNode.x, toNode.y)
      ctx.stroke()
      ctx.setLineDash([])

      // Draw arrow
      const angle = Math.atan2(toNode.y - midY, toNode.x - midX)
      const arrowLength = 12
      ctx.beginPath()
      ctx.moveTo(
        toNode.x - 30 * Math.cos(angle),
        toNode.y - 30 * Math.sin(angle)
      )
      ctx.lineTo(
        toNode.x - 30 * Math.cos(angle) - arrowLength * Math.cos(angle - Math.PI / 6),
        toNode.y - 30 * Math.sin(angle) - arrowLength * Math.sin(angle - Math.PI / 6)
      )
      ctx.moveTo(
        toNode.x - 30 * Math.cos(angle),
        toNode.y - 30 * Math.sin(angle)
      )
      ctx.lineTo(
        toNode.x - 30 * Math.cos(angle) - arrowLength * Math.cos(angle + Math.PI / 6),
        toNode.y - 30 * Math.sin(angle) - arrowLength * Math.sin(angle + Math.PI / 6)
      )
      ctx.stroke()

      // Draw relationship label
      if (isHighlighted) {
        const labelX = midX
        const labelY = midY - 10
        ctx.font = '11px Inter, sans-serif'
        ctx.fillStyle = color
        ctx.textAlign = 'center'
        ctx.fillText(edge.relationship, labelX, labelY)
      }
    })

    // Draw nodes
    nodes.forEach(node => {
      if (!node.x || !node.y) return

      const isSelected = selectedNode?.id === node.id
      const isHovered = hoveredNode?.id === node.id
      const isConnected = selectedNode && edges.some(
        e => (e.from === selectedNode.id && e.to === node.id) || 
             (e.to === selectedNode.id && e.from === node.id)
      )

      const nodeRadius = isSelected || isHovered ? 35 : 30
      const color = nodeColors[node.level % nodeColors.length]

      // Draw glow for selected/hovered nodes
      if (isSelected || isHovered || isConnected) {
        const gradient = ctx.createRadialGradient(
          node.x, node.y, nodeRadius,
          node.x, node.y, nodeRadius + 15
        )
        gradient.addColorStop(0, 'rgba(102, 126, 234, 0.3)')
        gradient.addColorStop(1, 'rgba(102, 126, 234, 0)')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(node.x, node.y, nodeRadius + 15, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw node shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
      ctx.shadowBlur = 10
      ctx.shadowOffsetY = 4

      // Draw node circle with gradient
      const nodeGradient = ctx.createLinearGradient(
        node.x - nodeRadius, node.y - nodeRadius,
        node.x + nodeRadius, node.y + nodeRadius
      )
      
      // Parse gradient colors
      const gradientColors = node.level % nodeColors.length
      const colors = [
        ['#667eea', '#764ba2'],
        ['#f093fb', '#f5576c'],
        ['#4facfe', '#00f2fe'],
        ['#43e97b', '#38f9d7'],
        ['#fa709a', '#fee140'],
        ['#a8edea', '#fed6e3'],
      ]
      
      nodeGradient.addColorStop(0, colors[gradientColors][0])
      nodeGradient.addColorStop(1, colors[gradientColors][1])

      ctx.fillStyle = nodeGradient
      ctx.beginPath()
      ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2)
      ctx.fill()

      // Reset shadow
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0

      // Draw border
      ctx.strokeStyle = isSelected ? '#333' : 'rgba(255, 255, 255, 0.5)'
      ctx.lineWidth = isSelected ? 3 : 2
      ctx.stroke()

      // Draw node label
      ctx.font = `${isSelected || isHovered ? 'bold' : 'normal'} 12px Inter, sans-serif`
      ctx.fillStyle = '#fff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // Truncate label if too long
      let label = node.label
      if (label.length > 12) {
        label = label.substring(0, 10) + '...'
      }
      ctx.fillText(label, node.x, node.y)

      // Draw level indicator
      ctx.font = '10px Inter, sans-serif'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.fillText(`L${node.level}`, node.x, node.y + nodeRadius + 15)
    })

    // Draw animated particles on edges (visual effect)
    if (selectedNode) {
      edges.forEach(edge => {
        if (edge.from !== selectedNode.id && edge.to !== selectedNode.id) return
        
        const fromNode = nodes.find(n => n.id === edge.from)
        const toNode = nodes.find(n => n.id === edge.to)
        if (!fromNode?.x || !fromNode?.y || !toNode?.x || !toNode?.y) return

        const progress = (Math.sin(time * 2) + 1) / 2
        const px = fromNode.x + (toNode.x - fromNode.x) * progress
        const py = fromNode.y + (toNode.y - fromNode.y) * progress - 20 * Math.sin(progress * Math.PI)

        ctx.fillStyle = relationshipColors[edge.relationship] || '#888'
        ctx.beginPath()
        ctx.arc(px, py, 4, 0, Math.PI * 2)
        ctx.fill()
      })
    }

  }, [nodes, edges, selectedNode, hoveredNode, dimensions])

  // Mouse event handlers
  const getNodeAtPosition = useCallback((x: number, y: number): GraphNode | null => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i]
      if (!node.x || !node.y) continue
      const dx = x - node.x
      const dy = y - node.y
      if (Math.sqrt(dx * dx + dy * dy) < 35) {
        return node
      }
    }
    return null
  }, [nodes])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (isDragging && dragNode) {
      setNodes(prev => prev.map(n => 
        n.id === dragNode.id ? { ...n, x, y, vx: 0, vy: 0 } : n
      ))
    } else {
      const node = getNodeAtPosition(x, y)
      setHoveredNode(node)
    }
  }, [isDragging, dragNode, getNodeAtPosition])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const node = getNodeAtPosition(x, y)

    if (node) {
      setIsDragging(true)
      setDragNode(node)
      setSelectedNode(node)
    }
  }, [getNodeAtPosition])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragNode(null)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoveredNode(null)
    setIsDragging(false)
    setDragNode(null)
  }, [])

  // Get connections for selected node
  const getConnections = useCallback(() => {
    if (!selectedNode) return []
    return edges.filter(e => e.from === selectedNode.id || e.to === selectedNode.id)
      .map(e => {
        const otherNodeId = e.from === selectedNode.id ? e.to : e.from
        const otherNode = nodes.find(n => n.id === otherNodeId)
        return {
          ...e,
          otherNode,
          direction: e.from === selectedNode.id ? 'outgoing' : 'incoming'
        }
      })
  }, [selectedNode, edges, nodes])

  return (
    <div className="interactive-graph-container" ref={containerRef}>
      <div className="graph-canvas-wrapper">
        <canvas
          ref={canvasRef}
          style={{ width: dimensions.width, height: dimensions.height }}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
        
        {/* Controls */}
        <div className="graph-controls">
          <button 
            className={`control-btn ${isSimulating ? 'active' : ''}`}
            onClick={() => setIsSimulating(!isSimulating)}
            title={isSimulating ? 'Pause simulation' : 'Resume simulation'}
          >
            {isSimulating ? '⏸️' : '▶️'}
          </button>
          <button 
            className="control-btn"
            onClick={() => setSelectedNode(null)}
            title="Clear selection"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Selected Node Info Panel */}
      {selectedNode && (
        <div className="node-info-panel">
          <div className="panel-header">
            <div className={`node-badge level-${selectedNode.level}`}>
              Level {selectedNode.level}
            </div>
            <button className="close-btn" onClick={() => setSelectedNode(null)}>×</button>
          </div>
          <h3 className="node-title">{selectedNode.label}</h3>
          
          <div className="connections-section">
            <h4>🔗 Connections ({getConnections().length})</h4>
            <div className="connections-list">
              {getConnections().map((conn, idx) => (
                <div key={idx} className={`connection-item ${conn.direction}`}>
                  <span className="direction-icon">
                    {conn.direction === 'outgoing' ? '→' : '←'}
                  </span>
                  <span className="connection-label">{conn.otherNode?.label}</span>
                  <span 
                    className="relationship-badge"
                    style={{ backgroundColor: relationshipColors[conn.relationship] || '#888' }}
                  >
                    {conn.relationship}
                  </span>
                </div>
              ))}
              {getConnections().length === 0 && (
                <p className="no-connections">No connections</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="graph-legend">
        <h4>🎨 Relationships</h4>
        <div className="legend-items">
          {Object.entries(relationshipColors).map(([rel, color]) => (
            <div key={rel} className="legend-item">
              <span className="legend-color" style={{ backgroundColor: color }}></span>
              <span className="legend-label">{rel}</span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .interactive-graph-container {
          position: relative;
          width: 100%;
          border-radius: 16px;
          overflow: hidden;
          background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .graph-canvas-wrapper {
          position: relative;
        }

        canvas {
          display: block;
          cursor: grab;
        }

        canvas:active {
          cursor: grabbing;
        }

        .graph-controls {
          position: absolute;
          top: 16px;
          right: 16px;
          display: flex;
          gap: 8px;
        }

        .control-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: none;
          background: white;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .control-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
        }

        .control-btn.active {
          background: #667eea;
        }

        .node-info-panel {
          position: absolute;
          top: 16px;
          left: 16px;
          width: 280px;
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .node-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: white;
        }

        .node-badge.level-0 { background: linear-gradient(135deg, #667eea, #764ba2); }
        .node-badge.level-1 { background: linear-gradient(135deg, #f093fb, #f5576c); }
        .node-badge.level-2 { background: linear-gradient(135deg, #4facfe, #00f2fe); }
        .node-badge.level-3 { background: linear-gradient(135deg, #43e97b, #38f9d7); }
        .node-badge.level-4 { background: linear-gradient(135deg, #fa709a, #fee140); }
        .node-badge.level-5 { background: linear-gradient(135deg, #a8edea, #fed6e3); }

        .close-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          background: #f0f0f0;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
          color: #666;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: #e0e0e0;
          color: #333;
        }

        .node-title {
          font-size: 18px;
          font-weight: 700;
          color: #333;
          margin: 0 0 16px 0;
        }

        .connections-section h4 {
          font-size: 14px;
          color: #666;
          margin: 0 0 12px 0;
        }

        .connections-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .connection-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #f8f9ff;
          border-radius: 8px;
          font-size: 13px;
        }

        .connection-item.incoming {
          background: #fff8f0;
        }

        .direction-icon {
          font-size: 16px;
          color: #888;
        }

        .connection-label {
          flex: 1;
          font-weight: 500;
          color: #333;
        }

        .relationship-badge {
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 10px;
          color: white;
          font-weight: 600;
        }

        .no-connections {
          color: #999;
          font-size: 13px;
          text-align: center;
          padding: 12px;
        }

        .graph-legend {
          position: absolute;
          bottom: 16px;
          left: 16px;
          background: white;
          border-radius: 12px;
          padding: 12px 16px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .graph-legend h4 {
          font-size: 12px;
          color: #666;
          margin: 0 0 8px 0;
        }

        .legend-items {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 3px;
        }

        .legend-label {
          font-size: 10px;
          color: #666;
        }

        @media (max-width: 768px) {
          .node-info-panel {
            width: calc(100% - 32px);
            position: relative;
            top: 0;
            left: 0;
            margin: 16px;
          }

          .graph-legend {
            position: relative;
            bottom: 0;
            left: 0;
            margin: 16px;
            width: calc(100% - 32px);
          }
        }
      `}</style>
    </div>
  )
}
