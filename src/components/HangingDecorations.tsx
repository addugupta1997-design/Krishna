import React, { useEffect, useRef } from 'react';

export type HangingDecorationPlacement = 'upper-left' | 'upper-right' | 'upper-right-inner';

export interface HangingDecorationProps {
  placement: HangingDecorationPlacement;
  size: string;
  stringLength: string;
  maxRotation: number;
  sensitivity: number;
}

interface HangingDecorationsProps {
  page: 'home' | 'store' | 'story' | 'visit';
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function HangingDecoration({
  placement,
  size,
  stringLength,
  maxRotation,
  sensitivity,
}: HangingDecorationProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef(0);
  const angleRef = useRef(0);
  const velocityRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const lastPointerXRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const resetMotion = () => {
      reducedMotionRef.current = motionPreference.matches;
      if (motionPreference.matches) {
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
        targetRef.current = 0;
        angleRef.current = 0;
        velocityRef.current = 0;
        if (rootRef.current) rootRef.current.style.transform = 'rotate(0deg)';
      }
    };

    resetMotion();
    motionPreference.addEventListener('change', resetMotion);
    return () => {
      motionPreference.removeEventListener('change', resetMotion);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const animate = () => {
    if (reducedMotionRef.current || !rootRef.current) {
      frameRef.current = null;
      return;
    }

    const acceleration = (targetRef.current - angleRef.current) * 0.12;
    velocityRef.current = (velocityRef.current + acceleration) * 0.82;
    angleRef.current += velocityRef.current;
    rootRef.current.style.transform = `rotate(${angleRef.current.toFixed(2)}deg)`;

    if (
      Math.abs(targetRef.current - angleRef.current) < 0.025 &&
      Math.abs(velocityRef.current) < 0.025
    ) {
      angleRef.current = targetRef.current;
      velocityRef.current = 0;
      rootRef.current.style.transform = `rotate(${angleRef.current.toFixed(2)}deg)`;
      frameRef.current = null;
      return;
    }

    frameRef.current = requestAnimationFrame(animate);
  };

  const ensureAnimation = () => {
    if (!reducedMotionRef.current && frameRef.current === null) {
      frameRef.current = requestAnimationFrame(animate);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLImageElement>) => {
    if (reducedMotionRef.current) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const position = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const movement = lastPointerXRef.current === null
      ? 0
      : ((event.clientX - lastPointerXRef.current) / bounds.width) * sensitivity;
    lastPointerXRef.current = event.clientX;
    targetRef.current = clamp(
      position * maxRotation * 0.55 + movement * maxRotation,
      -maxRotation,
      maxRotation,
    );
    ensureAnimation();
  };

  const handlePointerLeave = () => {
    lastPointerXRef.current = null;
    targetRef.current = 0;
    ensureAnimation();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLImageElement>) => {
    if (reducedMotionRef.current || event.pointerType !== 'touch') return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const direction = Math.sign(event.clientX - (bounds.left + bounds.width / 2)) || 1;
    targetRef.current = direction * maxRotation * 0.38;
    ensureAnimation();

    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      targetRef.current = 0;
      ensureAnimation();
      timeoutRef.current = null;
    }, 170);
  };

  return (
    <div
      ref={rootRef}
      className={`hanging-decoration hanging-decoration--${placement}`}
      style={{
        '--lantern-size': size,
        '--string-length': stringLength,
      } as React.CSSProperties}
      aria-hidden="true"
    >
      <span className="hanging-decoration__string" />
      <img
        className="hanging-decoration__lantern"
        src="/assets/images/hanging-lantern.svg"
        alt=""
        draggable={false}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
      />
    </div>
  );
}

export function HangingDecorations({ page }: HangingDecorationsProps) {
  return (
    <div className={`hanging-decorations hanging-decorations--${page}`} aria-hidden="true">
      <HangingDecoration
        placement="upper-left"
        size="clamp(24px, 3.3vw, 50px)"
        stringLength="clamp(5px, 2.2vw, 30px)"
        maxRotation={5.5}
        sensitivity={0.65}
      />
      <HangingDecoration
        placement="upper-right"
        size="clamp(23px, 3.1vw, 46px)"
        stringLength="clamp(6px, 2.7vw, 36px)"
        maxRotation={5}
        sensitivity={0.62}
      />
      <HangingDecoration
        placement="upper-right-inner"
        size="clamp(21px, 2.8vw, 41px)"
        stringLength="clamp(10px, 3.6vw, 48px)"
        maxRotation={7}
        sensitivity={0.82}
      />
    </div>
  );
}
