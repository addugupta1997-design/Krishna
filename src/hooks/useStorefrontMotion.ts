import { useLayoutEffect, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Scoped ownership: every tween and trigger is reverted on route/data changes. */
export function useStorefrontMotion(root: RefObject<HTMLDivElement | null>, revision: unknown) {
  useLayoutEffect(() => {
    if (!root.current) return;
    const element = root.current;
    const media = gsap.matchMedia();
    media.add({ motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 768px)' }, context => {
      if (!context.conditions?.motion) return;
      const visible = (selector: string) => Array.from(element.querySelectorAll<HTMLElement>(selector)).filter(node => node.getClientRects().length);
      const hero = visible('[data-motion-hero]')[0];
      if (hero) {
        const intro = gsap.timeline({ defaults: { ease: 'power3.out', duration: .9 } });
        intro.from(hero.querySelectorAll('h1, p, [data-motion-actions]'), {
          y: 22, opacity: 0, stagger: .12, clearProps: 'transform,opacity',
        });
        const photo = hero.querySelector('img');
        if (photo) intro.from(photo, { scale: 1.07, duration: 1.3, clearProps: 'transform' }, 0);
      }
      visible('[data-motion-story]').forEach(section => {
        const photo = section.querySelector('img');
        if (!photo) return;
        gsap.from(photo, {
          scale: 1.09, ease: 'none',
          scrollTrigger: { trigger: section, start: 'clamp(top bottom)', end: 'clamp(bottom center)', scrub: .7 },
        });
      });
      visible('[data-motion-categories]').forEach(grid => {
        gsap.from(grid.children, {
          y: 22, opacity: .35, duration: .65, stagger: .08, ease: 'power2.out', clearProps: 'transform,opacity',
          scrollTrigger: { trigger: grid, start: 'top 90%', once: true },
        });
      });
    }, element);
    let frame = 0;
    let disposed = false;
    const refresh = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => { if (!disposed) ScrollTrigger.refresh(); });
    };
    element.addEventListener('load', refresh, true);
    document.fonts.ready.then(() => { if (!disposed) refresh(); });
    refresh();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      element.removeEventListener('load', refresh, true);
      media.revert();
    };
  }, [root, revision]);
}
