import { useState } from 'react';
import { ChevronLeft, ChevronRight, Camera } from 'lucide-react';

interface GalleryProps {
    images: string[];
}

const Gallery = ({ images }: GalleryProps) => {
    const [activeImage, setActiveImage] = useState(0);

    // Ensure we have at least one image
    const displayImages = images && images.length > 0 ? images : ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'];

    const nextImage = () => setActiveImage((prev) => (prev + 1) % displayImages.length);
    const prevImage = () => setActiveImage((prev) => (prev - 1 + displayImages.length) % displayImages.length);

    return (
        <div className="mb-4">
            {/* Main Image Stage */}
            <div className="relative h-96 bg-gray-100 rounded-xl overflow-hidden mb-4 group border border-gray-100">
                <img
                    src={displayImages[activeImage]}
                    alt="Property View"
                    className="w-full h-full object-contain bg-gray-50"
                />

                {/* Navigation Buttons */}
                <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all text-gray-800"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all text-gray-800"
                >
                    <ChevronRight size={24} />
                </button>

                {/* Counter Badge */}
                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-sm font-bold px-3 py-1.5 rounded-full flex items-center gap-2">
                    <Camera size={16} />
                    <span>{activeImage + 1} / {displayImages.length}</span>
                </div>
            </div>

            {/* Thumbnails Strip */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-1">
                {displayImages.map((img, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveImage(idx)}
                        className={`relative w-24 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                    >
                        <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Gallery;
