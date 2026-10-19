'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface CyberHero3DProps {
  className?: string;
}

export const CyberHero3D: React.FC<CyberHero3DProps> = ({ className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- 1. SCENE, CAMERA & RENDERER SETUP ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07090e, 0.0018);

    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      2000
    );
    camera.position.set(0, 0, 480);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0); // Pure transparent canvas
    container.appendChild(renderer.domElement);

    // --- 2. PARTICLES & NEURAL LATTICE SETUP ---
    const PARTICLE_COUNT = 160;
    const BOUNDS_X = 650;
    const BOUNDS_Y = 400;
    const BOUNDS_Z = 350;
    const CONNECT_DISTANCE = 110;

    interface NodePoint {
      basePos: THREE.Vector3;
      pos: THREE.Vector3;
      velocity: THREE.Vector3;
      color: THREE.Color;
      size: number;
    }

    const nodes: NodePoint[] = [];
    const colorRed = new THREE.Color('#d40027');
    const colorCrimson = new THREE.Color('#ff3355');
    const colorCyan = new THREE.Color('#00f2fe');
    const colorWhite = new THREE.Color('#ffffff');

    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    const particleColors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * BOUNDS_X * 2,
        (Math.random() - 0.5) * BOUNDS_Y * 2,
        (Math.random() - 0.5) * BOUNDS_Z * 2
      );

      // Distribute brand cyber palette
      const r = Math.random();
      let col = colorWhite;
      if (r < 0.45) col = colorRed;
      else if (r < 0.75) col = colorCrimson;
      else if (r < 0.9) col = colorCyan;

      nodes.push({
        basePos: pos.clone(),
        pos: pos.clone(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.3
        ),
        color: col,
        size: Math.random() * 3.5 + 2.0,
      });

      particlePositions[i * 3] = pos.x;
      particlePositions[i * 3 + 1] = pos.y;
      particlePositions[i * 3 + 2] = pos.z;

      particleColors[i * 3] = col.r;
      particleColors[i * 3 + 1] = col.g;
      particleColors[i * 3 + 2] = col.b;
    }

    // Circular particle texture generator for smooth glow dots
    const createCircleTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.3, 'rgba(255,255,255,0.85)');
        gradient.addColorStop(0.7, 'rgba(255,255,255,0.15)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
      }
      return new THREE.CanvasTexture(canvas);
    };

    const particleTexture = createCircleTexture();
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 7,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // Dynamic neural connection lines
    const maxLines = (PARTICLE_COUNT * (PARTICLE_COUNT - 1)) / 2;
    const linePositions = new Float32Array(maxLines * 6);
    const lineColors = new Float32Array(maxLines * 6);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(linesMesh);

    // --- 3. 3D HOLOGRAPHIC CYBER CORE (FLOATING SCULPTURE) ---
    const coreGroup = new THREE.Group();
    // Position core floating in right-center region behind hero branding
    coreGroup.position.set(220, 15, -60);

    // Outer Geodesic Icosahedron Wireframe
    const outerGeo = new THREE.IcosahedronGeometry(75, 1);
    const outerWire = new THREE.WireframeGeometry(outerGeo);
    const outerMat = new THREE.LineBasicMaterial({
      color: 0xd40027,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
    });
    const outerMesh = new THREE.LineSegments(outerWire, outerMat);
    coreGroup.add(outerMesh);

    // Middle Concentric Dodecahedron Wireframe
    const midGeo = new THREE.DodecahedronGeometry(52, 0);
    const midWire = new THREE.WireframeGeometry(midGeo);
    const midMat = new THREE.LineBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    const midMesh = new THREE.LineSegments(midWire, midMat);
    coreGroup.add(midMesh);

    // Inner Glowing Particle Core
    const innerCoreCount = 70;
    const innerPositions = new Float32Array(innerCoreCount * 3);
    const innerColors = new Float32Array(innerCoreCount * 3);
    for (let i = 0; i < innerCoreCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 28;
      const sinPhi = Math.sin(phi);
      innerPositions[i * 3] = r * sinPhi * Math.cos(theta);
      innerPositions[i * 3 + 1] = r * sinPhi * Math.sin(theta);
      innerPositions[i * 3 + 2] = r * Math.cos(phi);

      const isCoreRed = Math.random() > 0.4;
      innerColors[i * 3] = isCoreRed ? 1.0 : 0.0;
      innerColors[i * 3 + 1] = isCoreRed ? 0.2 : 0.95;
      innerColors[i * 3 + 2] = isCoreRed ? 0.3 : 1.0;
    }

    const innerGeo = new THREE.BufferGeometry();
    innerGeo.setAttribute('position', new THREE.BufferAttribute(innerPositions, 3));
    innerGeo.setAttribute('color', new THREE.BufferAttribute(innerColors, 3));
    const innerMat = new THREE.PointsMaterial({
      size: 5,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const innerPoints = new THREE.Points(innerGeo, innerMat);
    coreGroup.add(innerPoints);

    // Cyber Orbital Rings
    const ringGeo1 = new THREE.TorusGeometry(88, 0.7, 8, 80);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0xff3355,
      transparent: true,
      opacity: 0.35,
      wireframe: true,
      blending: THREE.AdditiveBlending,
    });
    const ringMesh1 = new THREE.Mesh(ringGeo1, ringMat1);
    ringMesh1.rotation.x = Math.PI * 0.35;
    coreGroup.add(ringMesh1);

    const ringGeo2 = new THREE.TorusGeometry(105, 0.5, 8, 80);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.28,
      wireframe: true,
      blending: THREE.AdditiveBlending,
    });
    const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
    ringMesh2.rotation.y = Math.PI * 0.45;
    coreGroup.add(ringMesh2);

    scene.add(coreGroup);

    // --- 4. INTERACTION: MOUSE & CURSOR PHYSICS ---
    const mouse = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      worldPos: new THREE.Vector3(0, 0, 0),
      isHovered: false,
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouse.targetX = normX;
      mouse.targetY = normY;
      mouse.isHovered = true;

      // Project 2D screen coordinates into 3D world space at z = 0
      const vector = new THREE.Vector3(normX, normY, 0.5);
      vector.unproject(camera);
      const dir = vector.sub(camera.position).normalize();
      const distance = -camera.position.z / dir.z;
      mouse.worldPos = camera.position.clone().add(dir.multiplyScalar(distance));
    };

    const handleMouseLeave = () => {
      mouse.targetX = 0;
      mouse.targetY = 0;
      mouse.isHovered = false;
    };

    // Click pulse shockwave
    let shockwaveRadius = -1;
    const handlePointerDown = () => {
      shockwaveRadius = 0;
      // Brief scale pulse on holographic core
      coreGroup.scale.set(1.15, 1.15, 1.15);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('pointerdown', handlePointerDown);

    // Scroll depth reaction
    let scrollY = 0;
    const handleScroll = () => {
      scrollY = window.scrollY || document.documentElement.scrollTop;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Responsive resize handler
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);

      // Adjust core position for mobile vs desktop screens
      if (width < 768) {
        coreGroup.position.set(0, 40, -120);
        coreGroup.scale.set(0.68, 0.68, 0.68);
      } else if (width < 1200) {
        coreGroup.position.set(120, 20, -80);
        coreGroup.scale.set(0.85, 0.85, 0.85);
      } else {
        coreGroup.position.set(220, 15, -60);
        coreGroup.scale.set(1, 1, 1);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // --- 5. PERFORMANCE: PAUSE WHEN SCROLLED OUT OF VIEW ---
    let isVisible = true;
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          isVisible = entries[0].isIntersecting;
        },
        { threshold: 0.05 }
      );
      observer.observe(container);
    }

    // --- 6. 60FPS THREE.JS ANIMATION LOOP ---
    let animationFrameId = 0;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Save 100% GPU/CPU if user scrolls down to other sections
      if (!isVisible) return;

      const elapsed = clock.getElapsedTime();
      const delta = clock.getDelta();

      // Smooth mouse coordinate lerping
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      // Camera responds gently to mouse and scroll depth
      camera.position.x = mouse.x * 45;
      camera.position.y = mouse.y * 30 - scrollY * 0.12;
      camera.lookAt(0, -scrollY * 0.08, 0);

      // Holographic Core organic rotation & smooth tilt toward mouse
      const rotSpeed = prefersReducedMotion ? 0.002 : 0.008;
      outerMesh.rotation.x += rotSpeed;
      outerMesh.rotation.y += rotSpeed * 1.3;

      midMesh.rotation.x -= rotSpeed * 1.2;
      midMesh.rotation.z += rotSpeed * 0.9;

      ringMesh1.rotation.z += rotSpeed * 1.5;
      ringMesh2.rotation.x += rotSpeed * 1.8;

      innerPoints.rotation.y += rotSpeed * 2.2;

      // Gentle floating levitation on core
      coreGroup.position.y += Math.sin(elapsed * 1.8) * 0.35;

      // Core scale decay back from click pulse
      coreGroup.scale.lerp(new THREE.Vector3(1, 1, 1), 0.08);

      // Handle shockwave expansion
      if (shockwaveRadius >= 0) {
        shockwaveRadius += 14;
        if (shockwaveRadius > 900) {
          shockwaveRadius = -1;
        }
      }

      // Update Particle Lattice positions & Mouse Repulsion Physics
      let lineIndex = 0;
      const positions = particleGeometry.attributes.position.array as Float32Array;
      const linePosArray = lineGeometry.attributes.position.array as Float32Array;
      const lineColArray = lineGeometry.attributes.color.array as Float32Array;

      const repulseRadius = 140;
      const repulseForce = 8.0;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const node = nodes[i];

        if (!prefersReducedMotion) {
          // Organic drift
          node.pos.add(node.velocity);

          // Soft boundary bounce
          if (Math.abs(node.pos.x) > BOUNDS_X) node.velocity.x *= -1;
          if (Math.abs(node.pos.y) > BOUNDS_Y) node.velocity.y *= -1;
          if (Math.abs(node.pos.z) > BOUNDS_Z) node.velocity.z *= -1;

          // Mouse cursor interaction physics
          if (mouse.isHovered) {
            const dx = node.pos.x - mouse.worldPos.x;
            const dy = node.pos.y - mouse.worldPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < repulseRadius && dist > 1) {
              const force = (1 - dist / repulseRadius) * repulseForce;
              node.pos.x += (dx / dist) * force;
              node.pos.y += (dy / dist) * force;
            }
          }

          // Shockwave impulse on click
          if (shockwaveRadius >= 0) {
            const distFromShock = node.pos.distanceTo(coreGroup.position);
            const diff = Math.abs(distFromShock - shockwaveRadius);
            if (diff < 40) {
              const impulseDir = node.pos.clone().sub(coreGroup.position).normalize();
              node.pos.add(impulseDir.multiplyScalar(3.5));
            }
          }

          // Spring return to base orbit
          node.pos.x += (node.basePos.x - node.pos.x) * 0.015;
          node.pos.y += (node.basePos.y - node.pos.y) * 0.015;
          node.pos.z += (node.basePos.z - node.pos.z) * 0.015;
        }

        positions[i * 3] = node.pos.x;
        positions[i * 3 + 1] = node.pos.y;
        positions[i * 3 + 2] = node.pos.z;

        // Compute dynamic neural filaments between close neighbor particles
        for (let j = i + 1; j < PARTICLE_COUNT; j++) {
          const other = nodes[j];
          const dist = node.pos.distanceTo(other.pos);

          if (dist < CONNECT_DISTANCE) {
            const alpha = (1 - dist / CONNECT_DISTANCE) * 0.45;

            linePosArray[lineIndex * 6] = node.pos.x;
            linePosArray[lineIndex * 6 + 1] = node.pos.y;
            linePosArray[lineIndex * 6 + 2] = node.pos.z;

            linePosArray[lineIndex * 6 + 3] = other.pos.x;
            linePosArray[lineIndex * 6 + 4] = other.pos.y;
            linePosArray[lineIndex * 6 + 5] = other.pos.z;

            // Blend colors between connected nodes
            lineColArray[lineIndex * 6] = node.color.r * alpha;
            lineColArray[lineIndex * 6 + 1] = node.color.g * alpha;
            lineColArray[lineIndex * 6 + 2] = node.color.b * alpha;

            lineColArray[lineIndex * 6 + 3] = other.color.r * alpha;
            lineColArray[lineIndex * 6 + 4] = other.color.g * alpha;
            lineColArray[lineIndex * 6 + 5] = other.color.b * alpha;

            lineIndex++;
          }
        }
      }

      particleGeometry.attributes.position.needsUpdate = true;
      lineGeometry.attributes.position.needsUpdate = true;
      lineGeometry.attributes.color.needsUpdate = true;
      lineGeometry.setDrawRange(0, lineIndex * 2);

      renderer.render(scene, camera);
    };

    animate();

    // --- 7. CLEANUP ON UNMOUNT ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (observer) observer.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);

      // Dispose Three.js GPU resources
      particleGeometry.dispose();
      particleMaterial.dispose();
      particleTexture.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      outerGeo.dispose();
      outerWire.dispose();
      outerMat.dispose();
      midGeo.dispose();
      midWire.dispose();
      midMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      renderer.dispose();

      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`cyber-3d-hero-canvas ${className}`}
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        zIndex: 1,
        overflow: 'hidden',
      }}
    />
  );
};

export default CyberHero3D;
