import React from 'react';
import { ArrowRight } from 'lucide-react';

interface NotFoundPageProps {
  onNavigate: (path: string) => void;
}

export function NotFoundPage({ onNavigate }: NotFoundPageProps) {
  return (
    <section
      className="flex min-h-[55vh] items-center justify-center bg-[#FFF8EE] px-4 py-14 text-center sm:px-6"
      aria-labelledby="not-found-title"
    >
      <div className="max-w-xl">
        <span className="text-sm text-[#B58A42]" aria-hidden="true">✦</span>
        <p className="mt-3 font-serif text-6xl font-bold leading-none text-[#B58A42] sm:text-7xl">404</p>
        <h1 id="not-found-title" className="mt-4 font-serif text-2xl font-bold text-[#682D42] sm:text-3xl">
          This page seems to have wandered off.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#352D2F]/80 sm:text-base">
          The page you’re looking for may have moved or no longer exists.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="inline-flex min-h-11 w-full max-w-56 items-center justify-center rounded-lg bg-[#682D42] px-5 text-sm font-semibold text-[#FFF8EE] transition-colors hover:bg-[#4F1E30] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B58A42]"
          >
            Back to Home
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/store')}
            className="inline-flex min-h-11 w-full max-w-56 items-center justify-center gap-2 rounded-lg border border-[#B58A42]/70 px-5 text-sm font-semibold text-[#682D42] transition-colors hover:bg-[#F6DCE3]/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B58A42]"
          >
            Explore Store <ArrowRight className="h-4 w-4 text-[#B58A42]" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
