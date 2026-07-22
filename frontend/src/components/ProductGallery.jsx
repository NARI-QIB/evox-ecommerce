// filepath: frontend/src/components/ProductGallery.jsx
import { useState, useEffect, useRef } from 'react';
import { FaExpand, FaTimes, FaArrowLeft, FaArrowRight } from 'react-icons/fa';

const ProductGallery = ({ images, productName }) => {
      const [activeImageIndex, setActiveImageIndex] = useState(0);
      const [isLightboxOpen, setIsLightboxOpen] = useState(false);
      const scrollContainerRef = useRef(null);

      useEffect(() => {
            setActiveImageIndex(0);
      }, [images]);

      useEffect(() => {
            if (isLightboxOpen) {
                  document.body.style.overflow = 'hidden';
            } else {
                  document.body.style.overflow = 'unset';
            }
            return () => { document.body.style.overflow = 'unset'; };
      }, [isLightboxOpen]);

      const handleScroll = () => {
            if (scrollContainerRef.current) {
                  const scrollPosition = scrollContainerRef.current.scrollLeft;
                  const width = scrollContainerRef.current.offsetWidth;
                  // 🌟 تصحيح حساب المؤشر ليتوافق مع اتجاه التمرير في RTL
                  const currentIndex = Math.round(Math.abs(scrollPosition) / width);
                  setActiveImageIndex(currentIndex);
            }
      };

      const nextLightboxImage = (e) => {
            e.stopPropagation();
            setActiveImageIndex((prev) => (prev + 1) % images.length);
      };

      const prevLightboxImage = (e) => {
            e.stopPropagation();
            setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
      };

      if (!images || images.length === 0) return null;

      return (
            <div className="w-full flex flex-col h-full">

                  {/* Lightbox / Fullscreen View */}
                  {isLightboxOpen && (
                        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in-up" onClick={() => setIsLightboxOpen(false)}>
                              <button className="absolute top-6 end-6 text-white/50 hover:text-white transition-colors p-2 focus:outline-none z-50">
                                    <FaTimes className="text-3xl" />
                              </button>

                              <div className="relative w-full h-[80vh] flex items-center justify-center px-4 md:px-12">
                                    {images.length > 1 && (
                                          <button onClick={prevLightboxImage} className="absolute start-2 md:start-10 z-50 w-12 h-12 rounded-full bg-white/10 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition-all focus:outline-none">
                                                <FaArrowLeft className="rtl:rotate-180" />
                                          </button>
                                    )}

                                    <img src={images[activeImageIndex] || '/images/placeholder.png'} alt="Fullscreen" className="max-w-full max-h-full object-contain select-none" onClick={(e) => e.stopPropagation()} />

                                    {images.length > 1 && (
                                          <button onClick={nextLightboxImage} className="absolute end-2 md:end-10 z-50 w-12 h-12 rounded-full bg-white/10 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition-all focus:outline-none">
                                                <FaArrowRight className="rtl:rotate-180" />
                                          </button>
                                    )}
                              </div>
                        </div>
                  )}

                  {/* 🌟 Desktop Layout */}
                  <div className="hidden md:flex gap-4 lg:gap-6 h-full min-h-[500px] max-h-[750px]">

                        {/* Vertical Thumbnails */}
                        {images.length > 1 && (
                              <div className="w-20 lg:w-24 flex flex-col gap-3 overflow-y-auto hide-scrollbar pb-2 shrink-0">
                                    {images.map((img, index) => (
                                          <button
                                                key={index}
                                                onClick={() => setActiveImageIndex(index)}
                                                className={`relative aspect-square w-full rounded-2xl overflow-hidden transition-all duration-300 border-2 focus:outline-none bg-white ${ activeImageIndex === index ? 'border-primary shadow-md' : 'border-gray-100 opacity-60 hover:opacity-100 hover:border-gray-300'
                                                      }`}
                                          >
                                                <img
                                                      src={img || '/images/placeholder.png'}
                                                      alt={`View ${ index + 1 }`}
                                                      className="w-full h-full object-contain p-2"
                                                />
                                          </button>
                                    ))}
                              </div>
                        )}

                        {/* Main Image Container */}
                        <div
                              className="flex-1 bg-white rounded-3xl overflow-hidden flex items-center justify-center p-8 relative group cursor-zoom-in border border-gray-100 shadow-sm"
                              onClick={() => setIsLightboxOpen(true)}
                        >
                              <div className="absolute top-6 end-6 z-30 w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-sm">
                                    <FaExpand />
                              </div>
                              <img
                                    src={images[activeImageIndex] || '/images/placeholder.png'}
                                    alt={productName}
                                    className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                              />
                        </div>
                  </div>

                  {/* 🌟 Mobile Layout (Horizontal Swipeable) */}
                  <div className="md:hidden relative w-full bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div
                              ref={scrollContainerRef}
                              onScroll={handleScroll}
                              onClick={() => setIsLightboxOpen(true)}
                              className="flex w-full overflow-x-auto snap-x snap-mandatory hide-scrollbar"
                        >
                              {images.map((img, index) => (
                                    <div key={index} className="w-full shrink-0 snap-center aspect-square p-6 flex items-center justify-center relative">
                                          <img
                                                src={img || '/images/placeholder.png'}
                                                alt={`${ productName } - View ${ index + 1 }`}
                                                className="w-full h-full object-contain"
                                          />
                                          <div className="absolute top-4 end-4 z-30 w-8 h-8 bg-white/90 backdrop-blur-md border border-gray-100 rounded-full flex items-center justify-center text-gray-500 shadow-sm">
                                                <FaExpand className="text-xs" />
                                          </div>
                                    </div>
                              ))}
                        </div>

                        {/* Mobile Pagination Dots */}
                        {images.length > 1 && (
                              <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2 pointer-events-none">
                                    {images.map((_, index) => (
                                          <div
                                                key={index}
                                                className={`transition-all duration-300 rounded-full h-1.5 ${ activeImageIndex === index ? 'bg-primary w-6' : 'bg-gray-300 w-1.5' }`}
                                          ></div>
                                    ))}
                              </div>
                        )}
                  </div>

            </div>
      );
};

export default ProductGallery;