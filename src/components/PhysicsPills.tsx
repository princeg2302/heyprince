import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';
import { bannerTechPills, TechPill } from '../data/siteContent';

interface PhysicsPillsProps {
  items?: TechPill[];
  count?: number;
}

export const PhysicsPills: React.FC<PhysicsPillsProps> = ({ items, count }) => {
  const pills = items ?? (count ? bannerTechPills.slice(0, count) : bannerTechPills);
  const containerRef = useRef<HTMLDivElement>(null);
  const pillElementsRef = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId: number;
    let runner: Matter.Runner;
    let engine: Matter.Engine;
    let removeGlobalListeners: (() => void) | null = null;

    // Start physics right as preloader begins to lift (~800ms)
    // so the falling animation is visibly witnessed on page reload
    const timeout = setTimeout(() => {
      let currentWidth = container.clientWidth || window.innerWidth;
      let currentHeight = container.clientHeight || window.innerHeight;

      // Determine pill dimensions (matching responsive CSS)
      let pillWidth = 200;
      let pillHeight = 74;
      let pillRadius = 37;

      if (currentWidth < 576) {
        pillWidth = 120;
        pillHeight = 44;
        pillRadius = 22;
      } else if (currentWidth < 992) {
        pillWidth = 140;
        pillHeight = 52;
        pillRadius = 26;
      } else if (currentWidth < 1200) {
        pillWidth = 150;
        pillHeight = 55;
        pillRadius = 27;
      } else if (currentWidth < 1580) {
        pillWidth = 180;
        pillHeight = 66;
        pillRadius = 33;
      }

      // If pill element is already rendered, measure actual dimensions
      const firstEl = pillElementsRef.current[0];
      if (firstEl && firstEl.offsetWidth > 0) {
        pillWidth = firstEl.offsetWidth;
        pillHeight = firstEl.offsetHeight;
        pillRadius = pillHeight / 2;
      }

      const { Engine, Runner, Bodies, Composite, Mouse, MouseConstraint, Events, Body, Query } = Matter;

      engine = Engine.create({
        positionIterations: 10,
        velocityIterations: 8,
      });
      engine.gravity.y = 1.05;

      // Bowl-shaped floor at bottom so pills settle naturally toward the center
      const floorY = currentHeight - 25;
      const floorLeft = Bodies.rectangle(currentWidth * 0.25, floorY, currentWidth * 0.55, 40, {
        isStatic: true,
        angle: 0.025,
        friction: 0.5,
        restitution: 0.3,
      });

      const floorRight = Bodies.rectangle(currentWidth * 0.75, floorY, currentWidth * 0.55, 40, {
        isStatic: true,
        angle: -0.025,
        friction: 0.5,
        restitution: 0.3,
      });

      // Side walls with low friction and near-zero restitution to prevent edge vibration
      const wallOptions = {
        isStatic: true,
        friction: 0.02,
        restitution: 0.05,
      };
      const leftWall = Bodies.rectangle(-30, currentHeight / 2, 60, currentHeight * 4, wallOptions);
      const rightWall = Bodies.rectangle(currentWidth + 30, currentHeight / 2, 60, currentHeight * 4, wallOptions);

      Composite.add(engine.world, [floorLeft, floorRight, leftWall, rightWall]);

      // Create pill physics bodies
      const boxes: Matter.Body[] = [];
      const numPills = pills.length;
      const availableWidth = Math.min(currentWidth * 0.85, 1200);
      const stepX = availableWidth / Math.max(numPills - 1, 1);
      const startX = (currentWidth - availableWidth) / 2;

      for (let i = 0; i < numPills; i++) {
        // Cascade spawn positions above the top edge
        const spawnX = startX + i * stepX + (Math.random() - 0.5) * 40;
        const spawnY = -90 - i * 85;

        const box = Bodies.rectangle(spawnX, spawnY, pillWidth, pillHeight, {
          chamfer: { radius: pillRadius },
          restitution: 0.45,
          friction: 0.3,
          frictionAir: 0.015,
          density: 0.002,
          angle: (Math.random() - 0.5) * 0.6,
        });

        // Initial subtle drift and spin
        Body.setVelocity(box, {
          x: (Math.random() - 0.5) * 2,
          y: Math.random() * 2 + 1,
        });
        Body.setAngularVelocity(box, (Math.random() - 0.5) * 0.05);

        boxes.push(box);
        Composite.add(engine.world, box);
      }

      // Mouse constraint for interactive drag and toss with damping to absorb oscillations
      const mouse = Mouse.create(container);
      
      // CRITICAL: Remove Matter.js wheel listener so page scrolling is never blocked
      try {
        container.removeEventListener('wheel', (mouse as any).mousewheel);
        container.removeEventListener('touchmove', (mouse as any).mousemove);
      } catch {
        // Safe fallback
      }

      const mouseConstraint = MouseConstraint.create(engine, {
        mouse,
        constraint: {
          stiffness: 0.2,
          damping: 0.15,
          render: { visible: false },
        },
      });

      Composite.add(engine.world, mouseConstraint);

      // Disable bouncing and reduce friction while dragging so pills don't fight boundaries
      Events.on(mouseConstraint, 'startdrag', (event: any) => {
        const body = event.body;
        if (body) {
          (body as any)._origRestitution = body.restitution;
          (body as any)._origFriction = body.friction;
          body.restitution = 0;
          body.friction = 0.02;
        }
      });

      Events.on(mouseConstraint, 'enddrag', (event: any) => {
        const body = event.body;
        if (body) {
          body.restitution = (body as any)._origRestitution ?? 0.45;
          body.friction = (body as any)._origFriction ?? 0.3;
        }
      });

      // Frame-by-frame stabilization: clamp boundaries and dampen rotational chatter
      Events.on(engine, 'beforeUpdate', () => {
        if (mouseConstraint.body) {
          const body = mouseConstraint.body;

          // Strongly dampen angular velocity during drag to eliminate edge rotational chatter
          Body.setAngularVelocity(body, body.angularVelocity * 0.82);

          // Keep pill smoothly inside container boundaries
          const padding = 2;
          if (body.bounds.min.x < padding) {
            Body.translate(body, { x: padding - body.bounds.min.x, y: 0 });
            if (body.velocity.x < 0) Body.setVelocity(body, { x: 0, y: body.velocity.y });
          } else if (body.bounds.max.x > currentWidth - padding) {
            Body.translate(body, { x: (currentWidth - padding) - body.bounds.max.x, y: 0 });
            if (body.velocity.x > 0) Body.setVelocity(body, { x: 0, y: body.velocity.y });
          }
        }
      });

      // Global window listeners for drag tracking and release
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const rawX = e.clientX - rect.left;
        const rawY = e.clientY - rect.top;

        if (mouseConstraint.body) {
          // Clamp mouse position within container bounds so spring doesn't over-stretch outside edges
          const clampedX = Math.max(15, Math.min(currentWidth - 15, rawX));
          const clampedY = Math.max(15, Math.min(currentHeight - 15, rawY));
          mouse.position.x = clampedX;
          mouse.position.y = clampedY;
        } else {
          (mouse as any).mousemove?.(e);
        }
      };

      const handleGlobalMouseUp = (e: MouseEvent) => {
        (mouse as any).mouseup?.(e);
      };

      const handleGlobalTouchMove = (e: TouchEvent) => {
        if (e.touches.length > 0) {
          handleGlobalMouseMove(e.touches[0] as unknown as MouseEvent);
        }
      };

      const handleGlobalTouchEnd = (e: TouchEvent) => {
        handleGlobalMouseUp(e as unknown as MouseEvent);
      };

      window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
      window.addEventListener('mouseup', handleGlobalMouseUp, { passive: true });
      window.addEventListener('touchmove', handleGlobalTouchMove, { passive: true });
      window.addEventListener('touchend', handleGlobalTouchEnd, { passive: true });

      removeGlobalListeners = () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
        window.removeEventListener('touchmove', handleGlobalTouchMove);
        window.removeEventListener('touchend', handleGlobalTouchEnd);
      };

      // Subtle hover impulse when mouse passes pills (only when NOT dragging)
      let hoverThrottled = false;
      Events.on(mouseConstraint, 'mousemove', (event) => {
        if (hoverThrottled || mouseConstraint.body) return;
        const found = Query.point(boxes, event.mouse.position);
        if (found.length > 0) {
          hoverThrottled = true;
          const body = found[0];
          Body.applyForce(body, body.position, {
            x: (Math.random() - 0.5) * 0.03,
            y: -0.04,
          });
          setTimeout(() => {
            hoverThrottled = false;
          }, 350);
        }
      });

      runner = Runner.create();
      Runner.run(runner, engine);

      // High-performance 60fps render loop syncing physics bodies to DOM
      const updatePositions = () => {
        for (let i = 0; i < boxes.length; i++) {
          const box = boxes[i];
          const el = pillElementsRef.current[i];
          if (el && box) {
            const halfW = pillWidth / 2;
            const halfH = pillHeight / 2;
            // Visual clamping so rendered elements never flicker past edges
            const x = Math.max(0, Math.min(currentWidth - pillWidth, box.position.x - halfW));
            const y = box.position.y - halfH;
            el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${box.angle.toFixed(3)}rad)`;
            el.style.opacity = '1';
          }
        }
        animId = requestAnimationFrame(updatePositions);
      };

      animId = requestAnimationFrame(updatePositions);

      // Dynamically reposition floor and walls on resize
      const handleResize = () => {
        if (!container) return;
        currentWidth = container.clientWidth;
        currentHeight = container.clientHeight;
        const newFloorY = currentHeight - 25;

        Body.setPosition(floorLeft, { x: currentWidth * 0.25, y: newFloorY });
        Body.setPosition(floorRight, { x: currentWidth * 0.75, y: newFloorY });
        Body.setPosition(leftWall, { x: -30, y: currentHeight / 2 });
        Body.setPosition(rightWall, { x: currentWidth + 30, y: currentHeight / 2 });
      };

      window.addEventListener('resize', handleResize);

      // Return cleanup inside timeout
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, 850);

    return () => {
      clearTimeout(timeout);
      if (animId) cancelAnimationFrame(animId);
      if (removeGlobalListeners) removeGlobalListeners();
      if (runner) Matter.Runner.stop(runner);
      if (engine) Matter.Engine.clear(engine);
    };
  }, [pills.length]);

  return (
    <div id="js-physics-container" className="physics-pills" ref={containerRef}>
      {pills.map((pill, index) => (
        <a
          href="#about"
          key={pill.name || index}
          ref={(el) => {
            pillElementsRef.current[index] = el;
          }}
          style={{ opacity: 0 }}
          onClick={(e) => {
            e.preventDefault();
          }}
          onDragStart={(e) => {
            e.preventDefault();
          }}
          title={pill.name}
          aria-label={`${pill.name} technology pill`}
        >
          <img src={pill.image} alt={`${pill.name} tech`} draggable={false} />
        </a>
      ))}
    </div>
  );
};

export default PhysicsPills;
