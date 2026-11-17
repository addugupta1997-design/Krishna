import React from 'react';
import { Phone } from 'lucide-react';
import { createWhatsAppGeneralLink } from '../utils/whatsapp';
import { DEFAULT_PRIVACY_POLICY } from '../utils/privacyPolicy';
import type { WebsiteSettings } from '../types';

interface PrivacyPolicyPageProps {
  settings: WebsiteSettings;
}

export function PrivacyPolicyPage({ settings }: PrivacyPolicyPageProps) {
  const policy = settings.privacyPolicy?.trim() || DEFAULT_PRIVACY_POLICY;
  const blocks = policy.split(/\n\s*\n/).filter(Boolean);

  return (
    <article
      className="min-h-[60vh] bg-[#FFF8EE] py-10 sm:py-14"
      aria-labelledby="privacy-policy-title"
    >
      <div className="container-public">
        <div className="mx-auto max-w-3xl">
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8C6627]">
          Krishna Tracer
        </p>
        <h1
          id="privacy-policy-title"
          className="mt-2 text-center font-serif text-3xl font-bold text-[#682D42] sm:text-4xl"
        >
          Privacy Policy
        </h1>
        <div className="mx-auto my-5 flex max-w-48 items-center gap-3 text-[#8C6627]" aria-hidden="true">
          <span className="h-px flex-1 bg-[#B58A42]/50" />
          <span className="text-sm">â—‡</span>
          <span className="h-px flex-1 bg-[#B58A42]/50" />
        </div>

        <div className="space-y-7 text-sm leading-7 text-[#352D2F]/90 sm:text-base">
          {blocks.map((block, index) => {
            const lines = block.split('\n');
            const heading = lines[0].startsWith('## ')
              ? lines.shift()?.slice(3)
              : null;
            const paragraph = lines.join('\n');

            return (
              <section key={`${heading || 'paragraph'}-${index}`}>
                {heading && (
                  <h2 className="mb-2 font-serif text-xl font-bold leading-snug text-[#682D42] sm:text-2xl">
                    {heading}
                  </h2>
                )}
                {paragraph && <p className="whitespace-pre-line">{paragraph}</p>}
              </section>
            );
          })}

          <section aria-labelledby="privacy-contact-title">
            <h2 id="privacy-contact-title" className="mb-2 font-serif text-xl font-bold text-[#682D42] sm:text-2xl">
              Contact Krishna Tracer
            </h2>
            <address className="not-italic">
              <p className="whitespace-pre-line">{settings.address}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                <a
                  href={`tel:${settings.primaryCallNumber.replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-1.5 text-[#682D42] underline decoration-[#B58A42]/60 underline-offset-4 hover:text-[#B58A42] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B58A42]"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {settings.primaryCallNumber}
                </a>
                {settings.secondaryCallNumber && (
                  <a
                    href={`tel:${settings.secondaryCallNumber.replace(/\s+/g, '')}`}
                    className="text-[#682D42] underline decoration-[#B58A42]/60 underline-offset-4 hover:text-[#B58A42] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B58A42]"
                  >
                    {settings.secondaryCallNumber}
                  </a>
                )}
              </div>
              <a
                href={createWhatsAppGeneralLink(settings.whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-[#682D42] underline decoration-[#B58A42]/60 underline-offset-4 hover:text-[#B58A42] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B58A42]"
              >
                Contact us on WhatsApp
              </a>
            </address>
          </section>
        </div>
      </div>
    </div>
  </article>
);
}

