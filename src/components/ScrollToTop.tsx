import { useLayoutEffect, useRef } from 'react';
import { ArrowUp } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function ScrollToTop({ route }: { route: string }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    const button = buttonRef.current;
    if (!button) return;
    const media = gsap.matchMedia();
    media.add({ motion: '(prefers-reduced-motion: no-preference)', reduced: '(prefers-reduced-motion: reduce)' }, context => {
      const animation = gsap.fromTo(button, { autoAlpha: 0, y: context.conditions?.motion ? 12 : 0 }, {
        autoAlpha: 1, y: 0, duration: context.conditions?.motion ? .25 : 0, paused: true, ease: 'power2.out',
      });
      ScrollTrigger.create({
        start: 400, end: 'max',
        onUpdate: self => { if (self.scroll() > 400) animation.play(); else animation.reverse(); },
        onRefresh: self => { if (self.scroll() > 400) animation.play(); else animation.reverse(); },
      });
    });
    return () => media.revert();
  }, [route]);
  return (
    <button ref={buttonRef} type="button" aria-label="Back to top" title="Back to top"
      style={{ visibility: 'hidden' }}
      onClick={() => {
        window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
        document.querySelector<HTMLButtonElement>('#navbar-home')?.focus({ preventScroll: true });
      }}
      className="fixed bottom-5 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-[#B58A42]/70 bg-[#FFF8EE] text-[#682D42] shadow-md hover:bg-[#F6DCE3] sm:right-6">
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
