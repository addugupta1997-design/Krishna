import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

// Mor (मोर) — the Krishna Tracer peacock. He hides his eyes while a password is typed.
export type MascotMood = 'idle' | 'hiding' | 'peeking';

export function useMascotMood(password: string, visible: boolean): MascotMood {
  if (password.length > 0) return visible ? 'peeking' : 'hiding';
  return 'idle';
}

export function mascotCaption(mood: MascotMood): string {
  if (mood === 'hiding') return 'Not peeking. Promise.';
  if (mood === 'peeking') return '…alright, just one eye.';
  return 'Mayur Symbolises the Elegance';
}

const FEATHER_ANGLES = [-50, -34, -17, 0, 17, 34, 50];

export function ShyPeacock({ mood }: { mood: MascotMood }) {
  const reduceMotion = useReducedMotion();

  return (
    <svg
      viewBox="0 0 240 240"
      role="img"
      aria-label="A shy peacock covering its eyes with its wings"
      className="h-44 w-44 md:h-56 md:w-56"
    >
      <defs>
        <linearGradient id="mor-feather" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#8C6627" />
          <stop offset="45%" stopColor="#B58A42" />
          <stop offset="100%" stopColor="#DFBE7A" />
        </linearGradient>
        <linearGradient id="mor-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#682D42" />
          <stop offset="100%" stopColor="#4F1E30" />
        </linearGradient>
      </defs>

      {/* Tail fan */}
      <motion.g
        animate={reduceMotion ? undefined : { rotate: [-1.2, 1.2, -1.2] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '120px 190px' }}
      >
        {FEATHER_ANGLES.map((angle) => (
          <g key={angle} transform={`rotate(${angle} 120 190)`}>
            <path
              d="M120 190 C97 144 99 96 120 42 C141 96 143 144 120 190 Z"
              fill="url(#mor-feather)"
              opacity="0.95"
            />
            <ellipse cx="120" cy="64" rx="10" ry="15" fill="#DFBE7A" />
            <ellipse cx="120" cy="64" rx="6" ry="10" fill="#682D42" />
            <circle cx="120" cy="61" r="2.6" fill="#FFF8EE" />
          </g>
        ))}
      </motion.g>

      {/* Legs */}
      <g stroke="#B58A42" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M108 204 L104 216 M104 216 L97 218 M104 216 L111 219" />
        <path d="M132 204 L136 216 M136 216 L129 218 M136 216 L143 219" />
      </g>

      {/* Body */}
      <ellipse cx="120" cy="170" rx="38" ry="44" fill="url(#mor-body)" />
      <ellipse cx="120" cy="180" rx="19" ry="24" fill="#F6DCE3" opacity="0.92" />
      <path d="M108 148 Q120 158 132 148" stroke="#B58A42" strokeWidth="1.6" fill="none" strokeLinecap="round" />

      {/* Head — large and round so the face reads clearly */}
      <circle cx="120" cy="96" r="43" fill="#682D42" />
      <circle cx="120" cy="96" r="43" fill="none" stroke="#B58A42" strokeWidth="1.5" opacity="0.5" />

      {/* Crest */}
      <g stroke="#DFBE7A" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M110 58 L103 42" />
        <path d="M120 54 L120 36" />
        <path d="M130 58 L137 42" />
      </g>
      <g fill="#DFBE7A">
        <circle cx="103" cy="41" r="3.6" />
        <circle cx="120" cy="35" r="3.6" />
        <circle cx="137" cy="41" r="3.6" />
      </g>

      {/* Blush */}
      <g fill="#F6DCE3" opacity="0.4">
        <ellipse cx="92" cy="109" rx="8" ry="5" />
        <ellipse cx="148" cy="109" rx="8" ry="5" />
      </g>

      {/* Eyes — blink only while idle */}
      <motion.g
        animate={reduceMotion || mood !== 'idle' ? { scaleY: 1 } : { scaleY: [1, 1, 0.1, 1, 1] }}
        transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
        style={{ transformOrigin: '120px 96px' }}
      >
        <ellipse cx="105" cy="94" rx="10" ry="11" fill="#FFF8EE" />
        <ellipse cx="135" cy="94" rx="10" ry="11" fill="#FFF8EE" />
        <circle cx="106" cy="95" r="4.5" fill="#352D2F" />
        <circle cx="136" cy="95" r="4.5" fill="#352D2F" />
        <circle cx="107.8" cy="92.8" r="1.6" fill="#FFFFFF" />
        <circle cx="137.8" cy="92.8" r="1.6" fill="#FFFFFF" />
      </motion.g>

      {/* Beak and smile */}
      <path d="M120 104 L112 114 L128 114 Z" fill="#DFBE7A" />
      <path d="M120 114 L120 120" stroke="#8C6627" strokeWidth="1.6" strokeLinecap="round" />

      {/* Wings — drawn last so they sit in front of the face.
          CSS transforms (not Motion) so reduced-motion settings keep the pose but skip easing. */}
      <g
        style={{
          transform: mood === 'idle' ? 'translate(0px, 0px) rotate(0deg)' : 'translate(25px, -74px) rotate(-8deg)',
          transformOrigin: '80px 170px',
          transition: reduceMotion ? 'none' : 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <ellipse cx="80" cy="170" rx="13" ry="24" fill="#F6DCE3" stroke="#B58A42" strokeWidth="2" />
        <path d="M74 158 L86 182 M80 154 L92 178" stroke="#B58A42" strokeWidth="1.3" opacity="0.6" />
      </g>
      <g
        style={{
          transform: mood === 'hiding' ? 'translate(-25px, -74px) rotate(8deg)' : 'translate(0px, 0px) rotate(0deg)',
          transformOrigin: '160px 170px',
          transition: reduceMotion ? 'none' : 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <ellipse cx="160" cy="170" rx="13" ry="24" fill="#F6DCE3" stroke="#B58A42" strokeWidth="2" />
        <path d="M166 158 L154 182 M160 154 L148 178" stroke="#B58A42" strokeWidth="1.3" opacity="0.6" />
      </g>

      {/* Gold dust */}
      {[
        { x: 30, y: 82 },
        { x: 208, y: 72 },
        { x: 24, y: 162 },
        { x: 216, y: 170 },
      ].map((dot, index) => (
        <motion.circle
          key={`${dot.x}-${dot.y}`}
          cx={dot.x}
          cy={dot.y}
          r="2.5"
          fill="#DFBE7A"
          animate={reduceMotion ? undefined : { opacity: [0.25, 0.9, 0.25] }}
          transition={{ duration: 2.6, repeat: Infinity, delay: index * 0.5 }}
        />
      ))}
    </svg>
  );
}
