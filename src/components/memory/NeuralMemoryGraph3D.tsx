import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import { MemoryItem } from '@/types';
import { ORB_THEMES } from '@/lib/orb/theme';
import { Database, Sparkles, AlertTriangle, Shield, Settings, Tag, X, Info, Zap } from 'lucide-react';
import { audioService } from '@/services/audioService';

interface Node3D {
  memory: MemoryItem;
  mesh: THREE.Mesh;
  halo: THREE.Mesh;
  pos: THREE.Vector3;
  velocity: THREE.Vector3;
  color: string;
}

export const NeuralMemoryGraph3D: React.FC<{ memories: MemoryItem[] }> = ({ memories }) => {
  const { theme, settings } = useAppStore();
  const themeConfig = ORB_THEMES[theme];

  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<MemoryItem | null>(null);
  const [hoveredNode, setHoveredNode] = useState<MemoryItem | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.015);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 15, 45);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // 2. Ambient & Point Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const coreLight = new THREE.PointLight(themeConfig.bright, 3, 100);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    // 3. Central Core Brain Nucleus
    const nucleusGeo = new THREE.IcosahedronGeometry(4, 2);
    const nucleusMat = new THREE.MeshStandardMaterial({
      color: themeConfig.bright,
      wireframe: true,
      emissive: themeConfig.bright,
      emissiveIntensity: 0.6,
    });
    const nucleusMesh = new THREE.Mesh(nucleusGeo, nucleusMat);
    scene.add(nucleusMesh);

    // Inner glowing core
    const innerCore = new THREE.Mesh(
      new THREE.SphereGeometry(2.5, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: false })
    );
    scene.add(innerCore);

    // 4. Memory Color Mapping
    const getCategoryColor = (cat: string) => {
      switch (cat) {
        case 'pattern':
          return 0xa855f7; // Purple
        case 'error':
          return 0xef4444; // Red
        case 'security':
          return 0x10b981; // Emerald
        case 'preference':
          return 0x06b6d4; // Cyan
        case 'workflow':
          return 0xf59e0b; // Amber
        default:
          return 0x3b82f6; // Blue
      }
    };

    // 5. Build Memory Nodes in 3D Space
    const nodeObjects: Node3D[] = [];
    const group = new THREE.Group();
    scene.add(group);

    const count = memories.length || 1;
    memories.forEach((mem, idx) => {
      // Golden Spiral distribution on sphere
      const phi = Math.acos(-1 + (2 * idx) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      const radius = 18 + (idx % 3) * 4;

      const pos = new THREE.Vector3(
        radius * Math.cos(theta) * Math.sin(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(phi)
      );

      const colorHex = getCategoryColor(mem.category);

      // Node Sphere
      const nodeGeo = new THREE.SphereGeometry(1.2, 16, 16);
      const nodeMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.5,
        roughness: 0.2,
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.copy(pos);
      nodeMesh.userData = { memory: mem };
      group.add(nodeMesh);

      // Halo Wireframe Ring
      const haloGeo = new THREE.RingGeometry(1.6, 2.0, 16);
      const haloMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.copy(pos);
      group.add(haloMesh);

      nodeObjects.push({
        memory: mem,
        mesh: nodeMesh,
        halo: haloMesh,
        pos,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        ),
        color: `#${colorHex.toString(16)}`,
      });
    });

    // 6. Synaptic Connecting Filaments (Laser Lines)
    const lineMat = new THREE.LineBasicMaterial({
      color: themeConfig.bright,
      transparent: true,
      opacity: 0.25,
    });

    const linePositions: number[] = [];
    nodeObjects.forEach((node, i) => {
      // Connect to nucleus
      linePositions.push(0, 0, 0, node.pos.x, node.pos.y, node.pos.z);

      // Connect to nearest neighbor
      if (i > 0) {
        const prev = nodeObjects[i - 1];
        linePositions.push(prev.pos.x, prev.pos.y, prev.pos.z, node.pos.x, node.pos.y, node.pos.z);
      }
    });

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const linesMesh = new THREE.LineSegments(lineGeo, lineMat);
    group.add(linesMesh);

    // 7. Raycasting & Mouse Drag Rotation
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-1000, -1000);
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };

    const onPointerMove = (e: MouseEvent) => {
      const rect = mountRef.current?.getBoundingClientRect();
      if (!rect) return;

      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - prevMousePos.x;
        const deltaY = e.clientY - prevMousePos.y;
        group.rotation.y += deltaX * 0.005;
        group.rotation.x += deltaY * 0.005;
        prevMousePos = { x: e.clientX, y: e.clientY };
      }
    };

    const onPointerDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeObjects.map((n) => n.mesh));
      if (intersects.length > 0) {
        const hitMem = intersects[0].object.userData.memory as MemoryItem;
        if (hitMem) {
          if (settings.soundEffects) audioService.playClickSound();
          setSelectedNode(hitMem);
        }
      }
    };

    const dom = mountRef.current;
    dom.addEventListener('mousemove', onPointerMove);
    dom.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mouseup', onPointerUp);
    dom.addEventListener('click', onClick);

    // 8. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Slow auto-rotation
      if (!isDragging) {
        group.rotation.y += 0.002;
        group.rotation.x = Math.sin(elapsed * 0.2) * 0.08;
      }

      // Nucleus pulse
      nucleusMesh.rotation.y += 0.01;
      nucleusMesh.rotation.x += 0.005;
      const scale = 1 + Math.sin(elapsed * 2) * 0.06;
      nucleusMesh.scale.set(scale, scale, scale);

      // Node halos face camera
      nodeObjects.forEach((node) => {
        node.halo.lookAt(camera.position);
      });

      // Hover Raycast
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeObjects.map((n) => n.mesh));
      if (intersects.length > 0) {
        const hovered = intersects[0].object.userData.memory as MemoryItem;
        setHoveredNode(hovered);
        document.body.style.cursor = 'pointer';
      } else {
        setHoveredNode(null);
        document.body.style.cursor = 'default';
      }

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousemove', onPointerMove);
      dom.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mouseup', onPointerUp);
      dom.removeEventListener('click', onClick);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [memories, theme, settings.soundEffects]);

  return (
    <div className="relative w-full h-[620px] rounded-3xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-2xl font-mono select-none">
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top HUD Telemetry */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-md text-xs">
        <Database className="w-4 h-4 text-cyan-400 animate-pulse" />
        <div>
          <span className="font-bold text-white tracking-wider">3D SYNAPTIC BRAIN MATRIX</span>
          <span className="text-[10px] text-zinc-400 block">
            {memories.length} Active Nodes • Drag to rotate in 3D
          </span>
        </div>
      </div>

      {/* Category Legend */}
      <div className="absolute top-4 right-4 z-20 hidden md:flex flex-col gap-1 p-2 rounded-xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-md text-[10px]">
        <div className="flex items-center gap-1.5 text-purple-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-purple-500" /> Patterns / Models
        </div>
        <div className="flex items-center gap-1.5 text-red-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-red-500" /> Errors & Fixes
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Security & Face ID
        </div>
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-cyan-500" /> Preferences & Identity
        </div>
        <div className="flex items-center gap-1.5 text-amber-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-amber-500" /> Workflows
        </div>
      </div>

      {/* Hover Holographic Tooltip */}
      {hoveredNode && !selectedNode && (
        <div className="absolute bottom-6 left-6 z-20 p-3 rounded-xl bg-zinc-900/95 border border-cyan-500/60 shadow-2xl backdrop-blur-xl max-w-sm pointer-events-none animate-fadeIn">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-bold text-white truncate">{hoveredNode.title}</span>
          </div>
          <p className="text-[10px] text-zinc-400 line-clamp-2">{hoveredNode.content}</p>
          <span className="text-[9px] text-cyan-400 uppercase mt-1 block">Click node to inspect</span>
        </div>
      )}

      {/* Selected Node Detailed Modal Card */}
      {selectedNode && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-zinc-950 border-2 border-cyan-500 p-5 rounded-2xl max-w-md w-full shadow-[0_0_40px_rgba(0,243,255,0.3)] space-y-3 relative text-left">
            <button
              onClick={() => setSelectedNode(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              <div>
                <h2 className="text-sm font-bold text-white">{selectedNode.title}</h2>
                <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">
                  Category: {selectedNode.category} • Hits: {selectedNode.hitCount}
                </span>
              </div>
            </div>

            <div className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 text-xs text-zinc-200 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
              {selectedNode.content}
            </div>

            {selectedNode.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {selectedNode.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
