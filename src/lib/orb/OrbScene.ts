import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OrbTheme, AgentState } from '@/types';
import { ORB_THEMES } from './theme';

export interface OrbSceneApi {
  rotateBy(deltaTheta: number, deltaPhi: number): void;
  zoomBy(factor: number): void;
  zoomIn(): void;
  zoomOut(): void;
  resetView(): void;
  setTheme(theme: OrbTheme): void;
  setAudioLevel(level: number, bassLevel?: number): void;
  setAgentState(state: AgentState): void;
  dispose(): void;
}

const HOME_POSITION = new THREE.Vector3(0, 0.5, 5.5);
const MIN_DISTANCE = 0.6;
const MAX_DISTANCE = 40;

export function createOrbScene(container: HTMLElement, initialTheme: OrbTheme = 'ultron'): OrbSceneApi {
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  let currentThemeKey: OrbTheme = initialTheme;
  let theme = ORB_THEMES[currentThemeKey];
  let currentAudioLevel = 0;
  let currentBassLevel = 0;
  let currentState: AgentState = 'idle';

  // --- THREE SCENE SETUP ---
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 500);
  camera.position.copy(HOME_POSITION);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  container.appendChild(renderer.domElement);

  // --- POST PROCESSING ---
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    2.0, // strength
    0.45, // radius
    0.18 // threshold
  );
  composer.addPass(bloom);

  const chromaticShader = {
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uIntensity: { value: 0.003 },
      uTint: { value: new THREE.Vector3(1.2, 0.8, 0.6) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float uTime;
      uniform float uIntensity;
      uniform vec3 uTint;
      varying vec2 vUv;
      void main() {
        vec2 dir = vUv - vec2(0.5);
        float d = length(dir);
        float offset = uIntensity * d;
        float flicker = 1.0 + 0.03 * sin(uTime * 30.0) * sin(uTime * 7.3);
        vec4 cr = texture2D(tDiffuse, vUv + dir * offset);
        vec4 cg = texture2D(tDiffuse, vUv);
        vec4 cb = texture2D(tDiffuse, vUv - dir * offset * 0.5);
        gl_FragColor = vec4(cr.r, cg.g * 1.05, cb.b * 0.7, 1.0) * flicker;
        gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * uTint, 0.25);
      }
    `,
  };
  const chromaticPass = new ShaderPass(chromaticShader);
  composer.addPass(chromaticPass);

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.04;
  controls.minDistance = MIN_DISTANCE;
  controls.maxDistance = MAX_DISTANCE;
  controls.zoomSpeed = 1.4;
  controls.enablePan = false;

  const orbGroup = new THREE.Group();
  scene.add(orbGroup);

  // Dynamic Material Collections for Live Theme Swapping
  const brightLines: THREE.LineBasicMaterial[] = [];
  const midLines: THREE.LineBasicMaterial[] = [];
  const dimLines: THREE.LineBasicMaterial[] = [];
  const faintLines: THREE.LineBasicMaterial[] = [];
  const hotMeshes: THREE.Material[] = [];

  function createLineMat(type: 'bright' | 'mid' | 'dim' | 'faint', opacity = 1) {
    const color = type === 'bright' ? theme.bright : type === 'mid' ? theme.mid : type === 'dim' ? theme.dim : theme.faint;
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    if (type === 'bright') brightLines.push(mat);
    else if (type === 'mid') midLines.push(mat);
    else if (type === 'dim') dimLines.push(mat);
    else faintLines.push(mat);
    return mat;
  }

  function latRing(radius: number, lat: number, segs = 120) {
    const r = radius * Math.cos(lat);
    const y = radius * Math.sin(lat);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      pts.push(new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a)));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }

  function meridian(radius: number, lon: number, segs = 120) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= segs; i++) {
      const lat = (i / segs) * Math.PI - Math.PI / 2;
      pts.push(
        new THREE.Vector3(
          radius * Math.cos(lat) * Math.cos(lon),
          radius * Math.sin(lat),
          radius * Math.cos(lat) * Math.sin(lon)
        )
      );
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }

  // --- LAYER 1: OUTER WIREFRAME SHELL ---
  const outerShell = new THREE.Group();
  const R1 = 2.0;
  for (let i = -15; i <= 15; i++) {
    const lat = (i / 15) * (Math.PI / 2) * 0.95;
    const isMajor = i % 3 === 0;
    outerShell.add(new THREE.Line(latRing(R1, lat), createLineMat(isMajor ? 'mid' : 'faint', isMajor ? 0.5 : 0.15)));
  }
  for (let i = 0; i < 24; i++) {
    const lon = (i / 24) * Math.PI * 2;
    const isMajor = i % 6 === 0;
    outerShell.add(new THREE.Line(meridian(R1, lon), createLineMat(isMajor ? 'mid' : 'faint', isMajor ? 0.6 : 0.12)));
  }

  // Equator and Cross bands
  for (let j = 0; j < 16; j++) {
    const t = (j / 15) * 2 - 1;
    const offset = (t * 0.35) / 2;
    const opacity = 0.8 * (1 - Math.abs(t) * 0.65);
    outerShell.add(new THREE.Line(latRing(R1, offset, 160), createLineMat(Math.abs(t) < 0.3 ? 'bright' : 'mid', opacity)));
  }
  for (let i = 0; i < 4; i++) {
    const lon = (i / 4) * Math.PI * 2;
    for (let j = 0; j < 14; j++) {
      const t = (j / 13) * 2 - 1;
      const offset = (t * 0.25) / 2;
      const opacity = 0.85 * (1 - Math.abs(t) * 0.7);
      outerShell.add(new THREE.Line(meridian(R1, lon + offset, 160), createLineMat(Math.abs(t) < 0.3 ? 'bright' : 'mid', opacity)));
    }
  }
  orbGroup.add(outerShell);

  // --- LAYER 2: SECONDARY SHELL ARCS ---
  const shell2 = new THREE.Group();
  const R2 = 2.12;
  for (let i = 0; i < 14; i++) {
    const lat = (Math.random() - 0.5) * Math.PI * 0.85;
    const startLon = Math.random() * Math.PI * 2;
    const arcLen = 0.4 + Math.random() * 1.0;
    const pts: THREE.Vector3[] = [];
    const segs = 40;
    const r = R2 * Math.cos(lat);
    const y = R2 * Math.sin(lat);
    for (let j = 0; j <= segs; j++) {
      const a = startLon + (j / segs) * arcLen;
      pts.push(new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a)));
    }
    shell2.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), createLineMat('mid', 0.25 + Math.random() * 0.25)));
  }
  orbGroup.add(shell2);

  // --- LAYER 3: INNER SPIRAL CORE ---
  const innerCore = new THREE.Group();
  const R3 = 0.92;
  for (let s = 0; s < 8; s++) {
    const pts: THREE.Vector3[] = [];
    const turns = 3.5;
    const segs = 240;
    const phase = (s / 8) * Math.PI * 2;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const lat = t * Math.PI - Math.PI / 2;
      const lon = t * turns * Math.PI * 2 + phase;
      pts.push(
        new THREE.Vector3(
          R3 * Math.cos(lat) * Math.cos(lon),
          R3 * Math.sin(lat),
          R3 * Math.cos(lat) * Math.sin(lon)
        )
      );
    }
    innerCore.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), createLineMat('bright', 0.35 + Math.random() * 0.2)));
  }
  orbGroup.add(innerCore);

  // --- LAYER 4: INNERMOST ICOSAHEDRON & GLOW CORE ---
  const icoGeo = new THREE.IcosahedronGeometry(0.26, 1);
  const icoEdges = new THREE.EdgesGeometry(icoGeo);
  const icoWireMat = new THREE.LineBasicMaterial({
    color: theme.hot,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  });
  hotMeshes.push(icoWireMat);
  const icoWire = new THREE.LineSegments(icoEdges, icoWireMat);
  orbGroup.add(icoWire);

  const coreSphereMat = new THREE.MeshBasicMaterial({
    color: theme.hot,
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending,
  });
  hotMeshes.push(coreSphereMat);
  const coreSphere = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), coreSphereMat);
  orbGroup.add(coreSphere);

  // --- LAYER 5: ORBITING PARTICLES & DUST ---
  const dustCount = 400;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  const dustScales = new Float32Array(dustCount);

  for (let i = 0; i < dustCount; i++) {
    const phi = Math.random() * Math.PI * 2;
    const costheta = Math.random() * 2 - 1;
    const theta = Math.acos(costheta);
    const rad = 1.0 + Math.random() * 2.2;
    dustPos[i * 3] = rad * Math.sin(theta) * Math.cos(phi);
    dustPos[i * 3 + 1] = rad * Math.sin(theta) * Math.sin(phi);
    dustPos[i * 3 + 2] = rad * Math.cos(theta);
    dustScales[i] = Math.random();
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));

  const dustMat = new THREE.PointsMaterial({
    color: theme.bright,
    size: 0.04,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
  });
  brightLines.push(dustMat as any);
  const dustPoints = new THREE.Points(dustGeo, dustMat);
  orbGroup.add(dustPoints);

  // --- LAYER 6: SCAN RINGS ---
  const ringGroup = new THREE.Group();
  const ringGeo1 = new THREE.RingGeometry(2.4, 2.42, 64);
  const ringMat1 = new THREE.MeshBasicMaterial({
    color: theme.mid,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  midLines.push(ringMat1 as any);
  const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
  ring1.rotation.x = Math.PI / 2;
  ringGroup.add(ring1);

  const ringGeo2 = new THREE.RingGeometry(2.7, 2.715, 64);
  const ringMat2 = new THREE.MeshBasicMaterial({
    color: theme.bright,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  brightLines.push(ringMat2 as any);
  const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
  ring2.rotation.x = Math.PI / 3;
  ringGroup.add(ring2);
  orbGroup.add(ringGroup);

  // --- ANIMATION LOOP ---
  let animId = 0;
  let time = 0;

  function animate() {
    animId = requestAnimationFrame(animate);
    time += 0.016;

    // State & Audio modifiers
    let baseSpeed = 0.003;
    let pulseScale = 1.0;

    if (currentState === 'listening') {
      baseSpeed = 0.008 + currentAudioLevel * 0.02;
      pulseScale = 1.0 + currentAudioLevel * 0.35 + currentBassLevel * 0.2;
    } else if (currentState === 'thinking') {
      baseSpeed = 0.025;
      pulseScale = 1.0 + Math.sin(time * 12) * 0.08;
    } else if (currentState === 'speaking') {
      baseSpeed = 0.01 + currentAudioLevel * 0.015;
      pulseScale = 1.0 + currentAudioLevel * 0.25 + Math.sin(time * 6) * 0.05;
    } else {
      pulseScale = 1.0 + Math.sin(time * 1.5) * 0.02;
    }

    // Rotations
    outerShell.rotation.y += baseSpeed * 0.8;
    outerShell.rotation.x += baseSpeed * 0.3;

    shell2.rotation.y -= baseSpeed * 1.2;
    shell2.rotation.z += baseSpeed * 0.5;

    innerCore.rotation.y += baseSpeed * 2.0;
    innerCore.rotation.x -= baseSpeed * 1.5;
    innerCore.scale.set(pulseScale, pulseScale, pulseScale);

    icoWire.rotation.x += baseSpeed * 3.0;
    icoWire.rotation.y += baseSpeed * 2.5;
    icoWire.scale.set(pulseScale * 1.1, pulseScale * 1.1, pulseScale * 1.1);

    ring1.rotation.z += baseSpeed * 0.7;
    ring2.rotation.z -= baseSpeed * 0.9;
    dustPoints.rotation.y += baseSpeed * 0.5;

    // Post-processing time update
    chromaticShader.uniforms.uTime.value = time;
    chromaticShader.uniforms.uIntensity.value = 0.002 + (currentState === 'thinking' ? 0.005 : currentAudioLevel * 0.004);
    bloom.strength = 1.8 + currentAudioLevel * 1.2 + (currentState === 'thinking' ? 0.8 : 0);

    controls.update();
    composer.render();
  }

  animate();

  // Resize Handler
  function onResize() {
    if (!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    bloom.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  function applyTheme(newThemeKey: OrbTheme) {
    currentThemeKey = newThemeKey;
    theme = ORB_THEMES[newThemeKey];

    brightLines.forEach((m) => m.color.setHex(theme.bright));
    midLines.forEach((m) => m.color.setHex(theme.mid));
    dimLines.forEach((m) => m.color.setHex(theme.dim));
    faintLines.forEach((m) => m.color.setHex(theme.faint));
    hotMeshes.forEach((m: any) => m.color && m.color.setHex(theme.hot));

    // Update chromatic shader tint
    const colorObj = new THREE.Color(theme.bright);
    chromaticShader.uniforms.uTint.value.set(colorObj.r * 1.2, colorObj.g * 1.1, colorObj.b * 1.1);
  }

  return {
    rotateBy(deltaTheta: number, deltaPhi: number) {
      const spherical = new THREE.Spherical().setFromVector3(camera.position);
      spherical.theta += deltaTheta;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi + deltaPhi));
      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 0, 0);
    },
    zoomBy(factor: number) {
      const curDist = camera.position.length();
      const newDist = Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, curDist * factor));
      camera.position.setLength(newDist);
    },
    zoomIn() {
      this.zoomBy(0.85);
    },
    zoomOut() {
      this.zoomBy(1.18);
    },
    resetView() {
      camera.position.copy(HOME_POSITION);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
    },
    setTheme(newTheme: OrbTheme) {
      applyTheme(newTheme);
    },
    setAudioLevel(level: number, bassLevel = 0) {
      currentAudioLevel = level;
      currentBassLevel = bassLevel;
    },
    setAgentState(state: AgentState) {
      currentState = state;
    },
    dispose() {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      composer.dispose();
      controls.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    },
  };
}
