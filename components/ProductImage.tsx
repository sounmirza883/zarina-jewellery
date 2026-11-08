'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';

interface ProductImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export function NeutralPlaceholder({ label = 'Zarina Jewels', className = '' }: { label?: string; className?: string }) {
  return (
    <div
      className={`w-full h-full min-h-[160px] bg-[#F5EDE1] flex flex-col items-center justify-center text-center p-4 select-none ${className}`}
      role="img"
      aria-label={label}
    >
      <div className="w-12 h-12 rounded-full border border-[#B8893B]/40 flex items-center justify-center text-[#B8893B] mb-2 bg-[#FAF7F2]">
        <Sparkles className="w-5 h-5 animate-pulse" />
      </div>
      <span className="font-serif tracking-widest text-[#B8893B] text-xs uppercase font-medium">
        Zarina Jewels
      </span>
      <span className="text-[11px] text-[#575757] mt-1 max-w-[140px] truncate">
        {label}
      </span>
    </div>
  );
}

export default function ProductImage({
  src,
  alt,
  fill,
  width,
  height,
  className = '',
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  priority = false,
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError || !src) {
    return <NeutralPlaceholder label={alt} className={className} />;
  }

  if (fill) {
    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          onLoad={() => setIsLoading(false)}
          className={`object-cover transition-opacity duration-300 ${
            isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
        />
        {isLoading && (
          <div className="absolute inset-0 bg-[#F5EDE1] animate-pulse" />
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden inline-block ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width || 500}
        height={height || 625}
        sizes={sizes}
        priority={priority}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        onLoad={() => setIsLoading(false)}
        className={`object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-[#F5EDE1] animate-pulse" />
      )}
    </div>
  );
}
