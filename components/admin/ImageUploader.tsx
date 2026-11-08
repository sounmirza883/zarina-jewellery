'use client';

import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import ProductImage from '@/components/ProductImage';
import { uploadProductImage } from '@/lib/admin-store';
import { IMAGE_TYPES, MAX_IMAGES, moveItem, validateImageFile } from '@/lib/product-form';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  error?: string;
}

const iconButton =
  'p-1.5 rounded bg-white/90 text-[#1F1F1F] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed shadow-xs';

export default function ImageUploader({ images, onChange, error }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState('');
  const [problems, setProblems] = useState<string[]>([]);
  const busy = progress !== '';

  const handleFiles = async (picked: FileList | null) => {
    if (!picked || picked.length === 0) return;
    const room = MAX_IMAGES - images.length;
    const files = Array.from(picked).slice(0, Math.max(room, 0));
    const issues: string[] = [];
    if (picked.length > files.length) issues.push(`Only ${MAX_IMAGES} images are allowed per product.`);

    let next = [...images];
    for (const [i, file] of files.entries()) {
      const problem = validateImageFile(file);
      if (problem) {
        issues.push(`${file.name}: ${problem}`);
        continue;
      }
      setProgress(`Uploading ${i + 1} of ${files.length}…`);
      try {
        next = [...next, await uploadProductImage(file)];
        onChange(next);
      } catch (e) {
        issues.push(`${file.name}: ${e instanceof Error ? e.message : 'Upload failed.'}`);
      }
    }
    setProgress('');
    setProblems(issues);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      {images.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          {images.map((url, i) => (
            <li key={url} className="relative aspect-[4/5] rounded-md overflow-hidden border border-[#E8DDD0] bg-[#F5EDE1]">
              <ProductImage src={url} alt={`Product image ${i + 1}`} fill sizes="160px" />
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#0B0D12] text-white text-[10px] font-semibold uppercase tracking-wider">
                  Main
                </span>
              )}
              <div className="absolute bottom-1.5 inset-x-1.5 flex items-center justify-between">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => onChange(moveItem(images, i, i - 1))}
                    disabled={i === 0 || busy}
                    className={iconButton}
                    aria-label={`Move image ${i + 1} earlier`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(moveItem(images, i, i + 1))}
                    disabled={i === images.length - 1 || busy}
                    className={iconButton}
                    aria-label={`Move image ${i + 1} later`}
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onChange(images.filter((_, n) => n !== i))}
                  disabled={busy}
                  className={`${iconButton} text-rose-700`}
                  aria-label={`Remove image ${i + 1}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        id="pf-image-files"
        type="file"
        multiple
        accept={IMAGE_TYPES.join(',')}
        onChange={(e) => handleFiles(e.target.files)}
        className="sr-only"
        disabled={busy || images.length >= MAX_IMAGES}
      />
      <label
        htmlFor="pf-image-files"
        className={`inline-flex items-center gap-2 px-4 py-2 border border-dashed border-[#B8893B]/60 rounded-md text-xs font-semibold text-[#B8893B] ${
          busy || images.length >= MAX_IMAGES ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#FAF7F2]'
        }`}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
        <span>{busy ? progress : 'Upload images'}</span>
      </label>
      <p className="text-[11px] text-[#8A8A8A] mt-1.5">
        JPEG, PNG or WebP, up to 5 MB each, at most {MAX_IMAGES} images. The first image is the main one. Large
        images are resized automatically.
      </p>

      {(error || problems.length > 0) && (
        <div role="alert" className="mt-2 text-xs text-rose-700 space-y-0.5">
          {error && <p>{error}</p>}
          {problems.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      )}
    </div>
  );
}
