import React from 'react';

/**
 * Antique Gold Floral & Botanical Ornaments
 * Faithfully reproducing the delicate gold flourishes from the Krishna Tracer design
 */

export function BotanicalSprig({
  className = 'w-20 h-28 text-[#B58A42]',
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 80 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* Graceful curving central stem */}
      <path
        d="M12 110 C 16 85, 28 55, 62 14"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Top leaf */}
      <path
        d="M62 14 C 64 6, 70 8, 72 16 C 68 20, 62 18, 62 14 Z"
        stroke="currentColor"
        strokeWidth="1"
        fill="currentColor"
        fillOpacity="0.2"
      />
      {/* Leaf pair 1 */}
      <path
        d="M50 32 C 60 26, 68 32, 62 40 C 54 40, 50 36, 50 32 Z"
        stroke="currentColor"
        strokeWidth="1"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <path
        d="M48 35 C 38 30, 32 38, 38 44 C 44 44, 48 40, 48 35 Z"
        stroke="currentColor"
        strokeWidth="1"
        fill="currentColor"
        fillOpacity="0.2"
      />
      {/* Leaf pair 2 */}
      <path
        d="M36 55 C 46 50, 54 56, 48 64 C 40 64, 36 60, 36 55 Z"
        stroke="currentColor"
        strokeWidth="1"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <path
        d="M34 58 C 24 54, 18 62, 24 68 C 30 68, 34 64, 34 58 Z"
        stroke="currentColor"
        strokeWidth="1"
        fill="currentColor"
        fillOpacity="0.2"
      />
      {/* Leaf pair 3 */}
      <path
        d="M24 78 C 34 74, 40 82, 34 88 C 26 88, 24 84, 24 78 Z"
        stroke="currentColor"
        strokeWidth="1"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <path
        d="M22 80 C 14 78, 8 86, 14 92 C 18 92, 22 86, 22 80 Z"
        stroke="currentColor"
        strokeWidth="1"
        fill="currentColor"
        fillOpacity="0.2"
      />
      {/* Delicate tiny berries */}
      <circle cx="56" cy="24" r="1.5" fill="currentColor" />
      <circle cx="44" cy="46" r="1.5" fill="currentColor" />
      <circle cx="30" cy="70" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function FloralCorner({ className = 'w-16 h-16 text-[#B58A42]' }: { className?: string }) {
  return <BotanicalSprig className={className} />;
}

export function FloralDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 my-2 text-[#B58A42] ${className}`} aria-hidden="true">
      <span className="h-[1px] w-10 sm:w-14 bg-gradient-to-r from-transparent to-[#B58A42]/60" />
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-current shrink-0">
        <path
          d="M12 3 C13.2 7 17 9 19 12 C17 15 13.2 17 12 21 C10.8 17 7 15 5 12 C7 9 10.8 7 12 3 Z"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="currentColor"
          fillOpacity="0.15"
        />
        <circle cx="12" cy="12" r="1.8" fill="currentColor" />
      </svg>
      <span className="h-[1px] w-10 sm:w-14 bg-gradient-to-l from-transparent to-[#B58A42]/60" />
    </div>
  );
}

export function FooterCornerMandala({ className = 'w-16 h-16 text-[#B58A42]' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none opacity-40 ${className}`}
      aria-hidden="true"
    >
      <path
        d="M0 100 A 100 100 0 0 1 100 0"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeDasharray="2 4"
      />
      <path
        d="M0 70 A 70 70 0 0 1 70 0"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M0 40 A 40 40 0 0 1 40 0"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M0 85 C 20 85, 35 70, 35 50 C 35 30, 20 15, 0 15"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M85 0 C 85 20, 70 35, 50 35 C 30 35, 15 20, 15 0"
        stroke="currentColor"
        strokeWidth="1"
      />
      <circle cx="15" cy="85" r="3" fill="currentColor" />
      <circle cx="85" cy="15" r="3" fill="currentColor" />
      <circle cx="50" cy="50" r="3" fill="currentColor" />
    </svg>
  );
}

export function BrandLogo({
  size = 48,
  className = '',
  src = '/assets/images/logo_emblem.png',
}: {
  size?: number;
  className?: string;
  src?: string;
}) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden border border-[#B58A42]/40 bg-[#FFF8EE] shadow-sm ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <img
        src={src}
        alt="Krishna Tracer Est 1955 Logo"
        className="w-full h-full object-cover"
        loading="eager"
      />
    </div>
  );
}

export function PhotoEnquiryGraphic({
  className = 'w-16 h-12 text-[#B58A42]',
}: {
  className?: string;
}) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} aria-hidden="true">
      {/* Tilted Photo frame */}
      <svg width="44" height="40" viewBox="0 0 44 40" fill="none" className="rotate-[-6deg]">
        <rect x="2" y="2" width="38" height="34" rx="4" fill="#FFF8EE" stroke="#B58A42" strokeWidth="1.4" />
        <rect x="6" y="6" width="30" height="20" rx="2" fill="#F6DCE3" stroke="#B58A42" strokeWidth="0.8" strokeDasharray="1 2" />
        {/* Mountain/landscape inside photo */}
        <path d="M10 22 L17 14 L24 22 Z" fill="#B58A42" fillOpacity="0.4" />
        <path d="M20 22 L26 16 L32 22 Z" fill="#B58A42" fillOpacity="0.6" />
        <circle cx="28" cy="11" r="2" fill="#B58A42" fillOpacity="0.6" />
      </svg>
      {/* WhatsApp chat bubble overlapping */}
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="absolute -bottom-1 -right-2 rotate-[4deg]">
        <path
          d="M12 2C6.48 2 2 6.48 2 12C2 13.85 2.5 15.58 3.38 17.07L2 22L7.07 20.65C8.54 21.52 10.22 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"
          fill="#682D42"
          stroke="#DFBE7A"
          strokeWidth="1.2"
        />
        <path
          d="M8.5 7.5C8.2 6.8 7.8 6.8 7.5 6.8C7.2 6.8 6.9 6.8 6.6 7.1C6.3 7.4 5.5 8.1 5.5 9.6C5.5 11.1 6.6 12.5 6.8 12.7C7 12.9 8.9 16 11.8 17.1C14.2 18 14.7 17.7 15.2 17.6C15.7 17.5 16.8 16.9 17 16.3C17.2 15.7 17.2 15.2 17.1 15.1C17 15 16.7 14.9 16.2 14.6C15.7 14.3 13.3 13.1 12.9 13C12.5 12.8 12.2 12.8 11.9 13.2C11.6 13.6 10.8 14.6 10.6 14.9C10.4 15.2 10.1 15.2 9.6 15C9.1 14.7 7.7 14.2 6.7 13.2C5.9 12.4 5.4 11.5 5.2 11.1C5 10.7 5.2 10.5 5.4 10.3C5.6 10.1 5.9 9.8 6.1 9.5C6.3 9.2 6.4 9 6.5 8.7C6.6 8.4 6.6 8.2 6.4 8C6.3 7.8 5.7 6.4 8.5 7.5Z"
          fill="#FFF8EE"
        />
      </svg>
    </div>
  );
}
