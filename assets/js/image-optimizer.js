/**
 * Image Optimizer Utility - images.weserv.nl CDN Integration
 * Optimizes all Baserow images with compression, lazy loading, and WebP support
 * 
 * Usage:
 * - getOptimizedImage(url, options) - Get optimized image URL
 * - getResponsiveImage(url, width) - Get image for specific width
 * - preloadCriticalImages(imageArray, count) - Preload critical images
 * - optimizeImageElement(img, options) - Apply optimization to image element
 * - handleImageError(img) - Global error handler for images
 */

const IMAGE_CDN = 'https://images.weserv.nl/';

/**
 * Get optimized image URL from any source using images.weserv.nl CDN
 * @param {string} url - Original image URL (from Baserow or any source)
 * @param {object} options - Optimization options
 * @returns {string} - Optimized CDN URL
 */
function getOptimizedImage(url, options = {}) {
    // التحقق من صحة الرابط
    if (!url || typeof url !== 'string') {
        console.warn('⚠️ URL غير صالح:', url);
        return 'https://via.placeholder.com/400/2E8B57/ffffff?text=Qoffa+Smart';
    }
    
    if (url.includes('undefined') || url.includes('null') || url === '') {
        console.warn('⚠️ URL فارغ أو غير معرف');
        return 'https://via.placeholder.com/400/2E8B57/ffffff?text=Qoffa+Smart';
    }

    // إذا كان الرابط محلي أو CDN بالفعل أو placeholder
    if (url.includes('images.weserv.nl') || 
        url.includes('assets/') || 
        url.includes('via.placeholder.com') ||
        url.includes('data:image')) {
        return url;
    }

    const {
        width = 400,
        height = 0,
        quality = 80,
        format = 'webp',
        fit = 'cover',
        crop = 'smart'
    } = options;

    try {
        // بناء رابط CDN مع جميع معلمات التحسين
        let cdnUrl = `${IMAGE_CDN}?url=${encodeURIComponent(url)}`;
        cdnUrl += `&w=${width}`;
        if (height && height > 0) cdnUrl += `&h=${height}`;
        cdnUrl += `&q=${quality}`;
        cdnUrl += `&output=${format}`;
        cdnUrl += `&l=9`; // أقصى مستوى ضغط
        cdnUrl += `&a=${crop}`; // قص ذكي
        cdnUrl += `&fit=${fit}`;
        cdnUrl += `&af`; // تنسيق تلقائي (WebP للمتصفحات المدعومة)
        cdnUrl += `&il`; // تجاهل الأخطاء

        return cdnUrl;
    } catch (error) {
        console.error('❌ خطأ في إنشاء رابط CDN:', error);
        return 'https://via.placeholder.com/400/2E8B57/ffffff?text=Error';
    }
}

/**
 * Get responsive image URL for specific width
 * Useful for srcset generation
 * @param {string} url - Original image URL
 * @param {number} width - Desired width
 * @returns {string} - Optimized CDN URL
 */
function getResponsiveImage(url, width = 400) {
    return getOptimizedImage(url, {
        width: width,
        quality: 80,
        format: 'webp'
    });
}

/**
 * Preload critical images
 * Speeds up initial page load for hero/featured images
 * @param {array} images - Array of image URLs
 * @param {number} count - Number of images to preload (default 6)
 */
function preloadCriticalImages(images, count = 6) {
    if (!images || !Array.isArray(images) || images.length === 0) {
        console.warn('⚠️ لا توجد صور للتحميل المسبق');
        return;
    }

    const validImages = images.filter(url => url && typeof url === 'string' && !url.includes('undefined'));
    
    validImages.slice(0, count).forEach((url, index) => {
        try {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = getOptimizedImage(url, { width: 400, format: 'webp' });
            link.fetchPriority = index < 2 ? 'high' : 'auto'; // أول صورتين أولوية عالية
            
            document.head.appendChild(link);
            console.log(`✅ Preloaded image ${index + 1}/${Math.min(count, validImages.length)}`);
        } catch (error) {
            console.error('❌ فشل التحميل المسبق للصورة:', error);
        }
    });
}

/**
 * Apply optimization to an image element
 * @param {HTMLImageElement} img - Image element to optimize
 * @param {object} options - Optimization options
 */
function optimizeImageElement(img, options = {}) {
    if (!img || !(img instanceof HTMLImageElement)) {
        console.warn('⚠️ عنصر صورة غير صالح');
        return;
    }

    const originalSrc = img.src || img.dataset.src || img.getAttribute('src');
    if (!originalSrc || originalSrc.includes('undefined')) return;

    const {
        width = 400,
        height = 0,
        quality = 80,
        loading = 'lazy',
        decoding = 'async'
    } = options;

    try {
        // تعيين src المحسن
        const optimizedSrc = getOptimizedImage(originalSrc, { width, height, quality });
        
        // إذا كانت الصورة تستخدم data-src (lazy loading)
        if (img.dataset.src) {
            img.dataset.src = optimizedSrc;
        } else {
            img.src = optimizedSrc;
        }

        // تعيين سمات الأداء
        img.loading = loading;
        img.decoding = decoding;
        img.setAttribute('data-optimized', 'true');
        img.setAttribute('data-original-url', originalSrc);

        // إضافة srcset للصور المتجاوبة
        if (!img.srcset && width >= 400) {
            const sizes = [200, 400, 800];
            const srcset = sizes
                .map(w => `${getOptimizedImage(originalSrc, { width: w, quality })} ${w}w`)
                .join(', ');
            img.srcset = srcset;
            img.sizes = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px';
        }

        // إضافة معالج أخطاء
        img.onerror = function() {
            handleImageError(this);
        };

    } catch (error) {
        console.error('❌ فشل تحسين الصورة:', error);
    }
}

/**
 * Handle image loading errors with fallback
 * @param {HTMLImageElement} img - Image element
 */
function handleImageError(img) {
    if (!img) return;
    
    const productName = img.alt || 'Qoffa Smart';
    const shortName = productName.substring(0, 15);
    const fallbackUrl = `https://via.placeholder.com/400/2E8B57/ffffff?text=${encodeURIComponent(shortName)}`;
    
    // منع الحلقات اللانهائية
    if (img.src === fallbackUrl) return;
    
    console.warn(`⚠️ فشل تحميل الصورة: ${img.alt || 'بدون اسم'}`);
    
    img.src = fallbackUrl;
    img.classList.add('placeholder-image');
    img.style.opacity = '0.8';
    img.onerror = null; // منع التكرار
}

/**
 * Optimize all images in a container
 * @param {HTMLElement} container - Container element
 * @param {object} options - Optimization options
 */
function optimizeContainerImages(container, options = {}) {
    if (!container || !(container instanceof HTMLElement)) {
        console.warn('⚠️ حاوية غير صالحة');
        return;
    }

    const images = container.querySelectorAll('img:not([data-optimized="true"])');
    const {
        width = 400,
        lazyLoad = true,
        quality = 80
    } = options;

    if (images.length === 0) return;

    images.forEach((img, index) => {
        const originalSrc = img.src || img.dataset.src;
        if (!originalSrc || originalSrc.includes('undefined')) return;

        // استراتيجية التحميل: أول 4 صور eager، الباقي lazy
        const loading = lazyLoad && index >= 4 ? 'lazy' : 'eager';

        optimizeImageElement(img, {
            width,
            quality,
            loading,
            decoding: 'async'
        });
    });

    console.log(`✅ تم تحسين ${images.length} صورة في الحاوية`);
}

/**
 * Create responsive background image with CDN optimization
 * @param {HTMLElement} element - Element with background image
 * @param {string} url - Image URL
 * @param {number} width - Image width
 */
function optimizeBackgroundImage(element, url, width = 1200) {
    if (!element || !url) return;

    try {
        const optimizedUrl = getOptimizedImage(url, { width, quality: 85 });
        element.style.backgroundImage = `url('${optimizedUrl}')`;
        element.setAttribute('data-optimized-bg', 'true');
    } catch (error) {
        console.error('❌ فشل تحسين صورة الخلفية:', error);
    }
}

/**
 * Generate srcset for responsive images
 * @param {string} url - Image URL
 * @param {array} widths - Array of widths (default: [200, 400, 800, 1200])
 * @returns {string} - srcset string
 */
function generateSrcSet(url, widths = [200, 400, 800, 1200]) {
    if (!url || url.includes('undefined')) return '';

    try {
        return widths
            .map(w => `${getOptimizedImage(url, { width: w, quality: 80 })} ${w}w`)
            .join(', ');
    } catch (error) {
        console.error('❌ فشل إنشاء srcset:', error);
        return '';
    }
}

/**
 * Batch optimize multiple image URLs
 * @param {array} urls - Array of image URLs
 * @param {object} options - Optimization options
 * @returns {array} - Array of optimized URLs
 */
function batchOptimizeImages(urls, options = {}) {
    if (!urls || !Array.isArray(urls)) return [];

    return urls
        .filter(url => url && typeof url === 'string' && !url.includes('undefined'))
        .map(url => {
            try {
                return getOptimizedImage(url, options);
            } catch (error) {
                console.error('❌ فشل تحسين الصورة:', url);
                return 'https://via.placeholder.com/400/2E8B57/ffffff?text=Error';
            }
        });
}

/**
 * Initialize image optimization on page load
 * Automatically optimizes all images with data attributes
 */
function initImageOptimization() {
    const optimizableImages = document.querySelectorAll('[data-optimize="true"]');
    
    if (optimizableImages.length === 0) return;

    optimizableImages.forEach(img => {
        try {
            const width = parseInt(img.dataset.width) || 400;
            const quality = parseInt(img.dataset.quality) || 80;
            const loading = img.dataset.loading || 'lazy';
            
            optimizeImageElement(img, { width, quality, loading });
        } catch (error) {
            console.error('❌ فشل تهيئة الصورة:', error);
        }
    });

    console.log(`✅ تم تهيئة ${optimizableImages.length} صورة`);
}

/**
 * Monitor lazy-loaded images and optimize when they enter viewport
 * Uses Intersection Observer API
 * @param {string} selector - CSS selector for images to monitor
 * @param {object} options - Optimization options
 */
function observeLazyImages(selector = 'img[loading="lazy"]:not([data-optimized="true"])', options = {}) {
    if (!('IntersectionObserver' in window)) {
        console.warn('⚠️ IntersectionObserver غير مدعوم');
        // تحسين جميع الصور مباشرة
        document.querySelectorAll(selector).forEach(img => {
            optimizeImageElement(img, options);
        });
        return;
    }

    const images = document.querySelectorAll(selector);
    
    if (images.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                optimizeImageElement(img, options);
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '100px', // تحميل قبل 100px من الظهور
        threshold: 0.01
    });

    images.forEach(img => observer.observe(img));
    console.log(`👁️ مراقبة ${images.length} صورة للتحميل الكسول`);
}

/**
 * Convert old Baserow URLs to optimized CDN URLs
 * @param {string} url - Original URL
 * @returns {string} - Optimized URL
 */
function convertToOptimizedUrl(url) {
    if (!url) return '';

    // إذا كان يستخدم CDN بالفعل
    if (url.includes('images.weserv.nl')) return url;

    // تحويل روابط Baserow أو S3
    if (url.includes('api.baserow.io') || 
        url.includes('baserow.io') || 
        url.includes('s3.amazonaws.com') ||
        url.includes('amazonaws.com')) {
        return getOptimizedImage(url, { width: 400, quality: 80 });
    }

    // تحويل الروابط الأخرى
    return getOptimizedImage(url, { width: 400, quality: 80 });
}

/**
 * Log optimization statistics
 */
function logOptimizationStats() {
    const allImages = document.querySelectorAll('img');
    const optimizedImages = document.querySelectorAll('img[data-optimized="true"]');
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    
    console.log('═══════════════════════════════════════');
    console.log('📊 إحصائيات تحسين الصور');
    console.log('═══════════════════════════════════════');
    console.log(`📸 إجمالي الصور: ${allImages.length}`);
    console.log(`✅ الصور المحسنة: ${optimizedImages.length}`);
    console.log(`😴 الصور الكسولة: ${lazyImages.length}`);
    console.log(`💾 توفير تقديري للنطاق: 65-80%`);
    console.log(`🚀 مزود CDN: images.weserv.nl`);
    console.log(`🎯 التنسيق: WebP مع احتياطي`);
    console.log(`⚡ مستوى الضغط: 9 (الحد الأقصى)`);
    console.log('═══════════════════════════════════════');
}

// ==================== AUTO-INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة تحسين الصور تلقائياً
    setTimeout(() => {
        // تحسين الصور الموجودة في المنتجات
        const productImages = document.querySelectorAll('.product-image img, .product-card img');
        if (productImages.length > 0) {
            productImages.forEach((img, index) => {
                const loading = index < 4 ? 'eager' : 'lazy';
                optimizeImageElement(img, { 
                    width: index < 4 ? 350 : 300, 
                    loading: loading 
                });
            });
        }
        
        // مراقبة الصور الكسولة
        observeLazyImages();
        
        // تسجيل الإحصائيات
        setTimeout(logOptimizationStats, 2000);
    }, 500);
});

// ==================== EXPORT ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getOptimizedImage,
        getResponsiveImage,
        preloadCriticalImages,
        optimizeImageElement,
        optimizeContainerImages,
        optimizeBackgroundImage,
        generateSrcSet,
        batchOptimizeImages,
        initImageOptimization,
        observeLazyImages,
        handleImageError,
        convertToOptimizedUrl,
        logOptimizationStats
    };
}

// جعل الدوال متاحة عالمياً
window.getOptimizedImage = getOptimizedImage;
window.handleImageError = handleImageError;
window.optimizeImageElement = optimizeImageElement;
window.preloadCriticalImages = preloadCriticalImages;

console.log('✅ image-optimizer.js تم تحميله بنجاح');