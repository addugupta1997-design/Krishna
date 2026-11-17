import { useLayoutEffect, useRef, type HTMLAttributes } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type HeadingLevel = 'h2' | 'h3';

interface AnimatedHeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: HeadingLevel;
  children: string;
}

const levelStyles: Record<HeadingLevel, string> = {
  h2: 'text-2xl sm:text-3xl md:text-4xl',
  h3: 'text-lg sm:text-xl',
};

export function AnimatedHeading({
  as: Heading = 'h2',
  children,
  className = '',
  ...props
}: AnimatedHeadingProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    const heading = headingRef.current;
    if (!heading) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(heading.querySelectorAll('.animated-heading__letter'), {
        yPercent: 45, opacity: .2, duration: .55, stagger: { amount: .4 },
        ease: 'power3.out', clearProps: 'transform,opacity',
        scrollTrigger: { trigger: heading, start: 'top 92%', once: true },
      });
    }, heading);
    return () => media.revert();
  }, [children]);
  return (
    <Heading
      {...props}
      ref={headingRef}
      aria-label={children}
      className={`font-serif font-bold tracking-tight text-[#682D42] transition-colors duration-300 hover:text-[#B58A42] ${levelStyles[Heading]} ${className}`}
    >
      {Array.from(children).map((letter, index) =>
        letter === ' ' ? (
          <span key={`space-${index}`} aria-hidden="true" className="animated-heading__space">
            {' '}
          </span>
        ) : (
          <span
            key={`${letter}-${index}`}
            aria-hidden="true"
            className="animated-heading__letter"
          >
            {letter}
          </span>
        ),
      )}
    </Heading>
  );
}
