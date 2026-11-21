import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ShyPeacock, mascotCaption, type MascotMood } from './ShyPeacock';

interface AuthStageProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  mood: MascotMood;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

// Shared two-panel auth card for the customer sign-in page and the admin panel.
export function AuthStage({ eyebrow, title, subtitle, mood, children, footer }: AuthStageProps) {
  const reduceMotion = useReducedMotion();

  return (
    <main className="storefront relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FFF8EE] px-4 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 18% 18%, rgba(246,220,227,0.85), transparent 42%), radial-gradient(circle at 84% 78%, rgba(181,138,66,0.16), transparent 45%)',
        }}
      />

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-[#B58A42]/40 bg-[#FFF8EE] shadow-[0_28px_80px_-24px_rgba(104,45,66,0.45)] md:grid-cols-[0.9fr_1fr]"
      >
        {/* Illustration panel */}
        <div className="relative flex min-h-[190px] flex-col items-center justify-center gap-3 overflow-hidden bg-[#682D42] px-6 py-8 text-center md:min-h-[600px] md:gap-5 md:px-8 md:py-12">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full border border-[#DFBE7A]/25" />
            <div className="absolute -bottom-28 -right-16 h-80 w-80 rounded-full border border-[#DFBE7A]/20" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(246,220,227,0.18),transparent_58%)]" />
          </div>

          <div aria-hidden="true" className="relative flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.28em] text-[#DFBE7A]/90">
            <span className="h-px w-8 bg-[#DFBE7A]/50" />
            Est. 1955
            <span className="h-px w-8 bg-[#DFBE7A]/50" />
          </div>

          <ShyPeacock mood={mood} />

          <p
            aria-live="polite"
            className="relative rounded-full border border-[#DFBE7A]/40 bg-[#FFF8EE]/10 px-4 py-1.5 font-serif text-sm italic text-[#FFF8EE] md:text-base"
          >
            {mascotCaption(mood)}
          </p>

          <p aria-hidden="true" className="relative hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-[#DFBE7A]/70 md:block">
            Tilak Nagar · New Delhi
          </p>
        </div>

        {/* Form panel */}
        <div className="bg-[#FFF8EE] px-6 py-8 sm:px-10 md:flex md:flex-col md:justify-center md:px-12 md:py-12">
          <div className="mx-auto w-full max-w-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8C6627]">
              {eyebrow}
            </p>
            <h1 className="mt-1.5 font-serif text-3xl font-bold text-[#682D42] md:text-4xl">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#352D2F]/80">{subtitle}</p>

            <div className="mt-7">{children}</div>
            {footer && <div className="mt-6 border-t border-[#B58A42]/20 pt-5">{footer}</div>}
          </div>
        </div>
      </motion.div>
    </main>
  );
}
