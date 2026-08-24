import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';

interface ImageUploadProps {
    value?: string | null;
    onChange: (file: File) => void;
    onRemove?: () => void;
    label?: string;
    hint?: string;
    className?: string;
    aspectRatio?: 'square' | 'landscape' | 'portrait';
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
    value,
    onChange,
    onRemove,
    label = 'Upload Image',
    hint = 'JPEG, PNG, WebP — max 5MB',
    className,
    aspectRatio = 'square',
}) => {
    const { t } = useTranslation();
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) onChange(file);
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onChange(file);
        e.target.value = '';
    };

    const aspectClass = { square: 'aspect-square', landscape: 'aspect-video', portrait: 'aspect-[4/5]' }[aspectRatio];

    return (
        <div className={cn('space-y-2', className)}>
            <div
                className={cn(
                    'relative border-2 border-dashed rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer',
                    isDragging ? 'border-amber-500 bg-amber-50' : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50',
                    aspectClass
                )}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
            >
                {value ? (
                    <>
                        <img src={value} alt="Preview" className="w-full h-full object-cover" />
                        {onRemove && (
                            <button
                                type="button"
                                onClick={e => { e.stopPropagation(); onRemove(); }}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                            <span className="opacity-0 hover:opacity-100 text-white text-sm font-medium bg-black/50 px-3 py-1.5 rounded-lg">
                                {t('restaurant.change_image')}
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-neutral-400">
                        <div className="p-4 sm:p-3 bg-neutral-100 rounded-2xl transition-transform group-active:scale-90">
                            {isDragging ? <Upload className="w-8 h-8 sm:w-6 sm:h-6 text-amber-500" /> : <ImageIcon className="w-8 h-8 sm:w-6 sm:h-6" />}
                        </div>
                        <div className="text-center px-6">
                            <p className="text-sm font-bold text-neutral-700">{label}</p>
                            <p className="text-xs font-medium text-neutral-400 mt-1 sm:mt-0.5">{hint}</p>
                        </div>
                    </div>
                )}
                <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </div>
        </div>
    );
};
