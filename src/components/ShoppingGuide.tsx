import { useState } from 'react';
import { ArrowUpRight, MessageCircle, Check, ChevronDown } from 'lucide-react';
import { AnimatedHeading } from './AnimatedHeading';
import { BotanicalSprig, FloralDivider, FooterCornerMandala } from './Ornaments';

function Sparkle({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`faq-sparkle pointer-events-none absolute text-[#B58A42] ${className}`} aria-hidden="true">
      <path d="M12 3 C13.2 7 17 9 19 12 C17 15 13.2 17 12 21 C10.8 17 7 15 5 12 C7 9 10.8 7 12 3 Z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15" />
      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
    </svg>
  );
}
import { createWhatsAppCustomLink } from '../utils/whatsapp';
import type { WebsiteSettings } from '../types';

const occasions = ['Wedding', 'Festive celebration', 'Deity shringaar', 'Creative project'];
const interests = ['Accessories', 'Laces & latkans', 'Decorations', 'Gifting'];

export function ShoppingGuide({ settings, onNavigate }: { settings: WebsiteSettings; onNavigate: (path: string) => void }) {
  const [occasion, setOccasion] = useState(occasions[0]);
  const [selected, setSelected] = useState<string[]>([]);
  const message = `Namaste Krishna Tracer! I am shopping for a ${occasion.toLowerCase()}.${selected.length ? ` I am interested in ${selected.join(', ')}.` : ''} Please help me explore suitable options and confirm availability.`;
  const faqs = [
    ['Can I check availability before visiting?', 'Yes. Send us the product name or a reference photo on WhatsApp. Ask the team to confirm current availability before you travel.'],
    ['How do I buy a product?', 'Browse the Store and open a product to see its details. Products enabled for online purchase offer cart and checkout options. For other products or specific requirements, enquire on WhatsApp.'],
    ['Can you help me find a matching accessory?', 'Share a clear photo of your outfit, colour or reference design on WhatsApp. The team can help you explore available options.'],
    ['Where can I visit the store?', `${settings.address.replace(/\n/g, ' ')} Our listed hours are ${settings.timings}; closed ${settings.closedDay}.`],
  ];
  return <>
    <section className="occasion-editorial" aria-labelledby="wedding-edit-title">
      <div className="container-public occasion-editorial__grid">
        <div className="occasion-editorial__photo">
          <img src={settings.storyCelebrationsImage || '/assets/images/story_celebrations.jpg'} alt="Traditional wedding accessories and celebration details" loading="lazy" />
          <span className="occasion-editorial__caption">For the moments you will remember.</span>
        </div>
        <div className="occasion-editorial__copy">
          <span className="text-sm text-[#DFBE7A]">The wedding edit</span>
          <h2 id="wedding-edit-title" className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.05] mt-4 mb-5">A celebration.<br />A thousand little details.</h2>
          <p className="text-sm sm:text-base leading-7 max-w-md text-[#FFF8EE]/80">From the finishing touch on an outfit to the details of a ceremony, find inspiration for your wedding shopping at Krishna Tracer.</p>
          <button onClick={() => onNavigate('/store?category=Wedding')} className="mt-8 inline-flex items-center gap-4 rounded-full border border-[#DFBE7A]/60 px-6 py-3 text-sm hover:bg-[#FFF8EE] hover:text-[#682D42] transition-colors">Explore wedding essentials <ArrowUpRight size={18} aria-hidden="true" /></button>
        </div>
      </div>
    </section>
    <section className="shopping-guide container-public" aria-labelledby="shopping-guide-title">
      <div>
        <span className="text-sm text-[#8C6627]">A little help finding your favourites</span>
        <h2 id="shopping-guide-title" className="font-serif text-4xl sm:text-5xl text-[#682D42] mt-3 mb-4">What are you<br className="hidden md:block" /> celebrating?</h2>
        <p className="text-sm leading-7 max-w-sm text-[#352D2F]/75">Tell us what you have in mind. Start a conversation with the store, with your choices ready to share.</p>
      </div>
      <div className="shopping-guide__form">
        <fieldset><legend className="text-sm font-semibold mb-3">I'm shopping for</legend><div className="flex flex-wrap gap-2">{occasions.map(item => <button type="button" key={item} aria-pressed={occasion === item} onClick={() => setOccasion(item)} className={`guide-choice ${occasion === item ? 'guide-choice--selected' : ''}`}>{item}</button>)}</div></fieldset>
        <fieldset className="mt-6"><legend className="text-sm font-semibold mb-3">I'd like to explore <span className="font-normal text-[#352D2F]/70">(optional)</span></legend><div className="flex flex-wrap gap-2">{interests.map(item => <button type="button" key={item} aria-pressed={selected.includes(item)} onClick={() => setSelected(current => current.includes(item) ? current.filter(value => value !== item) : [...current, item])} className={`guide-choice ${selected.includes(item) ? 'guide-choice--selected' : ''}`}>{selected.includes(item) && <Check size={14} aria-hidden="true" />}{item}</button>)}</div></fieldset>
        <a href={createWhatsAppCustomLink(settings.whatsappNumber, message)} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex items-center justify-center gap-3 rounded-lg bg-[#682D42] px-6 py-3 text-sm font-semibold text-[#FFF8EE] hover:bg-[#4F1E30]"><MessageCircle size={18} aria-hidden="true" /> Ask the store on WhatsApp</a>
        <p className="text-xs leading-5 mt-3 text-[#352D2F]/70">Opens WhatsApp with your choices. You can edit the message before sending.</p>
      </div>
    </section>
    <section className="shopping-faq">
      <BotanicalSprig className="absolute -left-5 bottom-6 w-24 h-36 text-[#B58A42] opacity-30 hidden md:block" />
      <BotanicalSprig className="absolute right-4 top-6 w-20 h-28 text-[#B58A42] opacity-25 -scale-x-100 rotate-6 hidden md:block" />
      <FooterCornerMandala className="absolute -bottom-10 -right-10 w-44 h-44 text-[#B58A42] opacity-20 hidden md:block" />
      <Sparkle className="w-4 h-4 top-16 left-[38%] opacity-40" />
      <Sparkle className="w-3 h-3 top-32 left-[30%] opacity-30" />
      <Sparkle className="w-5 h-5 bottom-24 right-[36%] opacity-35" />
      <Sparkle className="w-3 h-3 bottom-10 right-[28%] opacity-25" />
      <Sparkle className="w-4 h-4 top-10 right-[12%] opacity-30" />
      <div className="container-public shopping-faq__grid"><div><AnimatedHeading>Before you visit</AnimatedHeading><p className="text-sm leading-7 mt-4 text-[#352D2F]/70">A few helpful answers for your next shopping trip.</p><FloralDivider className="mt-2 max-w-xs" /></div><div>{faqs.map(([question, answer]) => <details key={question} className="shopping-faq__item"><summary>{question}<ChevronDown size={18} aria-hidden="true" /></summary><p>{answer}</p></details>)}</div></div></section>
  </>;
}
