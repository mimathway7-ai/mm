// ==================== BASEROW CONFIGURATION ====================
console.log('✅ main.js loading...');
const BASEROW_TOKEN = 'OIEan8aAjLjoCoTXKO6Evd4cifbtqRf8';
const BASEROW_TABLE_ID = '882093';
const BASEROW_URL = `https://api.baserow.io/api/database/rows/table/${BASEROW_TABLE_ID}/?user_field_names=true&size=200`;

// ==================== IMAGE OPTIMIZATION (Fallback) ====================
const IMAGE_CDN = 'https://images.weserv.nl/';

if (typeof window.getOptimizedImage === 'undefined') {
    window.getOptimizedImage = function(url, options = {}) {
        if (!url || url.includes('undefined') || url.includes('null')) {
            return 'https://via.placeholder.com/400/2E8B57/ffffff?text=Qoffa+Smart';
        }
        if (url.includes('images.weserv.nl') || url.includes('assets/') || url.includes('placeholder')) {
            return url;
        }
        const { width = 400, height = 0, quality = 80, format = 'webp' } = options;
        let cdnUrl = `${IMAGE_CDN}?url=${encodeURIComponent(url)}`;
        cdnUrl += `&w=${width}`;
        if (height) cdnUrl += `&h=${height}`;
        cdnUrl += `&q=${quality}`;
        cdnUrl += `&output=${format}`;
        cdnUrl += `&l=9`;
        cdnUrl += `&a=smart`;
        return cdnUrl;
    };
}

function getOptimizedImage(url, options = {}) {
    return window.getOptimizedImage(url, options);
}

if (typeof window.generateSrcSet === 'undefined') {
    window.generateSrcSet = function(url, widths = [150, 250, 400]) {
        if (!url || url.includes('undefined') || url.includes('null') || url.includes('placeholder')) {
            return '';
        }
        return widths.map(width => {
            const optimized = window.getOptimizedImage(url, { width, quality: 80 });
            return `${optimized} ${width}w`;
        }).join(', ');
    };
}

function generateSrcSet(url, widths = [150, 250, 400]) {
    return window.generateSrcSet(url, widths);
}

if (typeof window.handleImageError === 'undefined') {
    window.handleImageError = function(img) {
        const productName = img.alt || 'Qoffa Smart';
        const shortName = productName.substring(0, 20);
        img.src = `https://via.placeholder.com/400/2E8B57/ffffff?text=${encodeURIComponent(shortName)}`;
        img.classList.add('placeholder-image');
        img.onerror = null;
    };
}

function handleImageError(img) {
    return window.handleImageError(img);
}

console.log('🖼️ getOptimizedImage available:', typeof window.getOptimizedImage !== 'undefined');
console.log('🖼️ handleImageError available:', typeof window.handleImageError !== 'undefined');

// ==================== GLOBAL VARIABLES ====================
let allProducts = {
    fruits: [],
    vegetables: [],
    herbs: [],
    bundles: []
};
let cart = JSON.parse(localStorage.getItem('qoffaCart')) || [];

// ==================== VARIABLE WEIGHT STATE ====================
let variableWeightState = {
    products: [],
    selectedWeights: {}
};

// ⏰ Variable Weight Safety Timer
const VW_SAFETY_TIMEOUT = 30 * 60 * 1000; // 30 دقيقة
const VW_CHECK_INTERVAL = 60 * 1000; // نتحقق كل دقيقة
let vwSafetyTimer = null;
let vwExitConfirmed = false;

// ==================== HELPER FUNCTIONS ====================
function showLoader(show = true) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.toggle('active', show);
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const existingToasts = container.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${icon}"></i></div>
        <div class="toast-content">${message}</div>
        <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) toast.remove();
    }, 3000);
}

function showConfirmDialog(title, message, onConfirm, onCancel) {
    const existingOverlay = document.getElementById('confirmDialogOverlay');
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'confirmDialogOverlay';
    overlay.className = 'confirm-dialog-overlay';
    overlay.innerHTML = `
        <div class="confirm-dialog-modal">
            <div class="confirm-dialog-header">
                <h3 class="confirm-dialog-title">
                    <i class="fas fa-exclamation-triangle"></i>
                    ${title}
                </h3>
            </div>
            <div class="confirm-dialog-body">
                <p class="confirm-dialog-message">${message}</p>
            </div>
            <div class="confirm-dialog-footer">
                <button class="confirm-dialog-btn confirm-dialog-cancel">
                    <i class="fas fa-times"></i> إلغاء
                </button>
                <button class="confirm-dialog-btn confirm-dialog-confirm">
                    <i class="fas fa-check"></i> تأكيد
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('.confirm-dialog-cancel').addEventListener('click', () => {
        overlay.classList.add('closing');
        setTimeout(() => {
            overlay.remove();
            if (onCancel) onCancel();
        }, 300);
    });

    overlay.querySelector('.confirm-dialog-confirm').addEventListener('click', () => {
        overlay.classList.add('closing');
        setTimeout(() => {
            overlay.remove();
            if (onConfirm) onConfirm();
        }, 300);
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.add('closing');
            setTimeout(() => {
                overlay.remove();
                if (onCancel) onCancel();
            }, 300);
        }
    });

    setTimeout(() => overlay.classList.add('active'), 10);
}

function formatPrice(price) {
    return parseFloat(price).toFixed(2) + ' درهم';
}

// ==================== BASEROW SYNC ====================
function vwParseWeights(rawWeights) {
    if (!rawWeights) return [];
    if (typeof rawWeights === 'string') {
        try {
            const p = JSON.parse(rawWeights.replace(/\\/g, ''));
            return Array.isArray(p) ? p.map(w => parseFloat(w)).filter(w => !isNaN(w) && w > 0) : [];
        } catch (e) {
            return rawWeights.split(',').map(w => parseFloat(w.trim())).filter(w => !isNaN(w) && w > 0);
        }
    }
    if (Array.isArray(rawWeights)) {
        return rawWeights.map(w => parseFloat(w)).filter(w => !isNaN(w) && w > 0);
    }
    return [];
}

async function vwSyncWithBaserow(productId, weight, action) {
    const label = action === 'remove' ? '🔒 حجز' : '🔓 إرجاع';
    console.log(`${label} | منتج:${productId} | وزن:${weight}كجم`);
    try {
        const fetchUrl = `https://api.baserow.io/api/database/rows/table/${BASEROW_TABLE_ID}/${productId}/?user_field_names=true`;
        const response = await fetch(fetchUrl, {
            headers: { 'Authorization': `Token ${BASEROW_TOKEN}` }
        });
        if (!response.ok) return false;
        
        const row = await response.json();
        let weights = vwParseWeights(row.available_weights);
        console.log(`   الأوزان قبل: [${weights.join(', ')}]`);
        
        if (action === 'remove') {
            const idx = weights.findIndex(w => parseFloat(w) === parseFloat(weight));
            if (idx !== -1) weights.splice(idx, 1);
            else { console.warn(`   ⚠️ الوزن ${weight} غير موجود`); return false; }
        } else {
            weights.push(parseFloat(weight));
            weights.sort((a, b) => a - b);
        }
        
        console.log(`   الأوزان بعد: [${weights.join(', ')}]`);
        
        const patchResponse = await fetch(
            `https://api.baserow.io/api/database/rows/table/${BASEROW_TABLE_ID}/${productId}/`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Token ${BASEROW_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ available_weights: JSON.stringify(weights) })
            }
        );
        
        if (patchResponse.ok) {
            console.log(`✅ ${label} ناجح`);
            return true;
        } else {
            console.error(`❌ فشل: ${patchResponse.status}`);
            return false;
        }
    } catch (e) {
        console.error('❌ Sync error:', e);
        return false;
    }
}

async function vwReturnWeightToBaserow(cartItem) {
    if (!cartItem?.isVariableWeight) return true;
    if (!cartItem.baseId || !cartItem.weight) return true;
    return await vwSyncWithBaserow(cartItem.baseId, cartItem.weight, 'add');
}

// ==================== VARIABLE WEIGHT EXIT POPUP ====================
function vwShowExitPopup() {
    const cart = JSON.parse(localStorage.getItem('qoffaCart')) || [];
    const vwItems = cart.filter(item => item.isVariableWeight);
    
    if (vwItems.length === 0 || vwExitConfirmed) return false;
    
    // منع الخروج
    vwExitConfirmed = false;
    
    // إنشاء overlay
    const overlay = document.createElement('div');
    overlay.id = 'vwExitOverlay';
    overlay.className = 'vw-exit-overlay';
    
    const itemsList = vwItems.map(item => 
        `<div class="vw-exit-item">🍉 ${item.name_fr || item.name} - ${item.weight}${item.unit || 'كجم'}</div>`
    ).join('');
    
    overlay.innerHTML = `
        <div class="vw-exit-popup">
            <div class="vw-exit-icon">⚖️</div>
            <h3>لديك منتجات محجوزة في السلة</h3>
            <div class="vw-exit-items">${itemsList}</div>
            <p class="vw-exit-note">💡 إذا لم تختر شيئاً، ستعود المنتجات للمخزون تلقائياً بعد 30 دقيقة</p>
            <div class="vw-exit-actions">
                <button class="vw-exit-btn vw-exit-return" id="vwExitReturn">
                    <i class="fas fa-undo"></i> 🗑️ إرجاع للمخزون
                </button>
                <button class="vw-exit-btn vw-exit-keep" id="vwExitKeep">
                    <i class="fas fa-lock"></i> ✅ إبقاء محجوزة
                </button>
                <button class="vw-exit-btn vw-exit-cancel" id="vwExitCancel">
                    <i class="fas fa-times"></i> ❌ إلغاء
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    
    return new Promise((resolve) => {
        // زر الإرجاع
        document.getElementById('vwExitReturn').addEventListener('click', async () => {
            vwExitConfirmed = true;
            await vwReturnAllWeights();
            overlay.remove();
            document.body.style.overflow = '';
            resolve('return');
        });
        
        // زر الإبقاء
        document.getElementById('vwExitKeep').addEventListener('click', () => {
            vwExitConfirmed = true;
            // نخزن وقت الخروج
            localStorage.setItem('vw_left_at', Date.now().toString());
            overlay.remove();
            document.body.style.overflow = '';
            resolve('keep');
        });
        
        // زر الإلغاء
        document.getElementById('vwExitCancel').addEventListener('click', () => {
            overlay.remove();
            document.body.style.overflow = '';
            resolve('cancel');
        });
    });
}

async function vwReturnAllWeights() {
    const currentCart = JSON.parse(localStorage.getItem('qoffaCart')) || [];
    const vwItems = currentCart.filter(item => item.isVariableWeight);
    
    if (vwItems.length === 0) return { success: true, count: 0 };
    
    console.log(`🔄 جاري إرجاع ${vwItems.length} منتجات للمخزون...`);
    
    let returned = 0;
    
    for (const item of vwItems) {
        const synced = await vwSyncWithBaserow(item.baseId, item.weight, 'add');
        if (synced) {
            const idx = currentCart.findIndex(i => i.id === item.id);
            if (idx !== -1) currentCart.splice(idx, 1);
            returned++;
        }
    }
    
    if (returned > 0) {
        localStorage.setItem('qoffaCart', JSON.stringify(currentCart));
        cart = currentCart;
        updateCartCount();
        updateCartSidebar();
        showToast(`✅ تم إرجاع ${returned} منتجات للمخزون`, 'success');
    }
    
    return { success: true, count: returned };
}

function vwCheckSafetyTimeout() {
    const leftAt = localStorage.getItem('vw_left_at');
    if (!leftAt) return;
    
    const elapsed = Date.now() - parseInt(leftAt);
    if (elapsed >= VW_SAFETY_TIMEOUT) {
        console.log('⏰ انتهت مهلة 30 دقيقة - جاري إرجاع الأوزان...');
        vwReturnAllWeights().then(() => {
            localStorage.removeItem('vw_left_at');
            showToast('⏰ تم إرجاع المنتجات للمخزون (انتهت مهلة 30 دقيقة)', 'warning');
        });
    } else {
        console.log(`⏰ متبقي ${Math.round((VW_SAFETY_TIMEOUT - elapsed) / 60000)} دقيقة قبل إرجاع الأوزان`);
    }
}

function vwStartSafetyTimer() {
    if (vwSafetyTimer) clearInterval(vwSafetyTimer);
    vwCheckSafetyTimeout();
    vwSafetyTimer = setInterval(vwCheckSafetyTimeout, VW_CHECK_INTERVAL);
}

function vwStopSafetyTimer() {
    if (vwSafetyTimer) {
        clearInterval(vwSafetyTimer);
        vwSafetyTimer = null;
    }
}

// ==================== FETCH PRODUCTS FROM BASEROW ====================
async function fetchProductsFromBaserow() {
    showLoader(true);
    try {
        console.log('🔄 جاري جلب البيانات من Baserow...');
        const response = await fetch(BASEROW_URL, {
            headers: {
                'Authorization': `Token ${BASEROW_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`فشل في جلب البيانات: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ تم جلب البيانات بنجاح:', data.results.length, 'منتج');
        
        allProducts = {
            fruits: [],
            vegetables: [],
            herbs: [],
            bundles: []
        };
        
        const variableWeightProducts = [];
        
        data.results.forEach(product => {
            function isBaserowRowVisible(row) {
                const toStr = v => (typeof v === 'string' ? v.toLowerCase().trim() : v);
                if (row === null || typeof row !== 'object') return true;
                if (row.hidden === true || row.hidden === 1 || toStr(row.hidden) === '1' || toStr(row.hidden) === 'true') return false;
                if (row.active === false || row.active === 0 || toStr(row.active) === '0' || toStr(row.active) === 'false') return false;
                if (row.is_active === false || row.is_active === 0 || toStr(row.is_active) === '0' || toStr(row.is_active) === 'false') return false;
                return true;
            }

            if (!isBaserowRowVisible(product)) return;
            let originalImageUrl = null;
            if (product.product_image && product.product_image.length > 0) {
                originalImageUrl = product.product_image[0].url;
            }
            
            const displayImage = originalImageUrl 
                ? getOptimizedImage(originalImageUrl, { width: 300, quality: 80 })
                : '/assets/images/default-product.png';
            
            const formattedProduct = {
                id: product.id,
                name: product.name || '',
                name_fr: product.name_fr || '',
                name_ar: product.name_ar || product.name || '',
                price: parseFloat(product.price) || 0,
                originalPrice: product.original_price ? parseFloat(product.original_price) : null,
                image: displayImage,
                imageOriginal: originalImageUrl,
                category: product.category || '',
                subcategory: product.subcategory || '',
                unit: product.unit || product.Unit || '',
                description: product.description || '',
                product_type: product.product_type || 'single',
                inStock: product.availability !== 'out_of_stock'
            };
            
            const category = product.category ? product.category.toLowerCase() : '';
            if (category === 'fruits') {
                allProducts.fruits.push(formattedProduct);
            } else if (category === 'vegetables') {
                allProducts.vegetables.push(formattedProduct);
            } else if (category === 'herbs') {
                allProducts.herbs.push(formattedProduct);
            } else if (category === 'bundles') {
                allProducts.bundles.push(formattedProduct);
            }
            
            if (product.is_variable_weight) {
                let weights = [];
                try {
                    if (typeof product.available_weights === 'string') {
                        let cleanStr = product.available_weights.trim();
                        if (cleanStr.startsWith('[') && cleanStr.endsWith(']')) {
                            weights = JSON.parse(cleanStr);
                        } else {
                            weights = cleanStr.split(',').map(w => parseFloat(w.trim())).filter(w => !isNaN(w));
                        }
                    } else if (Array.isArray(product.available_weights)) {
                        weights = product.available_weights;
                    }
                } catch (e) {
                    weights = [];
                }
                
                const filteredWeights = weights.filter(w => typeof w === 'number' && w > 0).sort((a, b) => a - b);
                
                if (filteredWeights.length > 0) {
                    variableWeightProducts.push({
                        ...formattedProduct,
                        weights: filteredWeights,
                        isVariableWeight: true
                    });
                }
            }
        });
        
        console.log('📊 تنظيم المنتجات:', {
            fruits: allProducts.fruits.length,
            vegetables: allProducts.vegetables.length,
            herbs: allProducts.herbs.length,
            bundles: allProducts.bundles.length,
            variableWeight: variableWeightProducts.length
        });
        
        renderAllCategories();
        renderFeaturedProducts();
        renderRecommendedProducts();
        
        if (variableWeightProducts.length > 0) {
            setTimeout(() => {
                renderVariableWeightCarousel(variableWeightProducts);
            }, 500);
        }
        
        document.dispatchEvent(new Event('productsLoaded'));
        
    } catch (error) {
        console.error('❌ خطأ في جلب المنتجات:', error);
        showToast('حدث خطأ في تحميل المنتجات. يرجى تحديث الصفحة', 'error');
    } finally {
        showLoader(false);
    }
}

// ==================== RENDER FUNCTIONS ====================
function renderProductCard(product, index = 0, options = {}) {
    const isBundle = product.category === 'bundles';
    const discount = product.originalPrice 
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
        : 0;
    
    const productType = typeof product.product_type === 'object' 
        ? (product.product_type.value || 'all') 
        : (product.product_type || 'all');
    
    const displayImage = product.image || '/assets/images/default-product.png';
    const loading = index < 8 ? 'eager' : 'lazy';
    
    return `
        <div class="product-card ${isBundle ? 'bundle-card' : ''}" 
             data-id="${product.id}" 
             data-category="${product.category}" 
             data-subcategory="${product.subcategory}" 
             data-type="${productType}" 
             onclick="window.location.href='/product-detail/?id=${product.id}'" 
             style="cursor: pointer;">
            ${isBundle ? '<div class="bundle-badge"><i class="fas fa-gift"></i> باقة</div>' : ''}
            ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ''}
            <div class="product-image">
                <img src="${displayImage}" 
                     alt="${product.name_fr || product.name}" 
                     loading="${loading}" 
                     decoding="async"
                     data-original-url="${product.imageOriginal || ''}"
                     onerror="handleImageError(this)">
            </div>
            <div class="card-content">
                <div class="brand">Qoffa Smart</div>
                <div class="product-name">
                    <div class="product-fr">
                        ${product.name_fr || product.name}
                        <span class="unit-badge">${product.unit}</span>
                    </div>
                    <div class="product-ar">${product.name_ar || product.name}</div>
                </div>
                <div class="price">
                    ${product.price.toFixed(2)} <span>درهم</span>
                    ${product.originalPrice ? `<del>${product.originalPrice.toFixed(2)}</del>` : ''}
                </div>
                <button class="add-to-cart" data-product-id="${product.id}" onclick="event.stopPropagation(); handleAddToCart(event)">
                    <i class="fas fa-shopping-cart"></i>
                    أضف إلى السلة
                </button>
            </div>
        </div>
    `;
}

function renderCategory(category, filter = 'all') {
    const container = document.getElementById(`${category}Products`);
    if (!container) return;
    
    const products = allProducts[category] || [];
    const filtered = filter === 'all' ? products : products.filter(p => p.subcategory === filter);
    
    if (filtered.length === 0) {
        container.innerHTML = `<div class="no-products" style="grid-column: 1/-1; text-align: center; padding: 50px; color: #999;">لا توجد منتجات في هذا التصنيف</div>`;
        return;
    }
    
    container.innerHTML = filtered.map((product, index) => renderProductCard(product, index)).join('');
}

function renderAllCategories() {
    renderCategory('fruits', 'all');
    renderCategory('vegetables', 'all');
    renderCategory('herbs', 'all');
    renderCategory('bundles', 'all');
}

function renderFeaturedProducts() {
    const container = document.getElementById('productsGrid');
    if (!container) return;
    
    const allProductsList = [
        ...allProducts.fruits,
        ...allProducts.vegetables,
        ...allProducts.herbs,
        ...allProducts.bundles
    ];
    
    const featured = allProductsList.slice(0, 8);
    
    if (featured.length === 0) {
        container.innerHTML = `<div class="no-products" style="grid-column: 1/-1; text-align: center; padding: 50px;">جاري تحميل المنتجات...</div>`;
        return;
    }
    
    container.innerHTML = featured.map((product, index) => 
        renderProductCard(product, index, { width: 350 })
    ).join('');
    
    if (typeof AOS !== 'undefined') AOS.refresh();
}

function getRecommendedProducts(limit = 6) {
    const cartProductIds = new Set(cart.map(item => item.id));
    const allProductsList = [...allProducts.fruits, ...allProducts.vegetables];
    const recommendedProducts = allProductsList.filter(product => !cartProductIds.has(product.id));
    const shuffled = recommendedProducts.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
}

function renderRecommendedProducts() {
    const container = document.getElementById('suggestedProductsGrid') || 
                      document.getElementById('recommendedProductsContainer');
    if (!container) return;
    
    const recommendedProducts = getRecommendedProducts(6);
    
    if (recommendedProducts.length === 0) {
        container.innerHTML = `<div class="no-products" style="grid-column: 1/-1; text-align: center; padding: 50px;">لا توجد منتجات مقترحة</div>`;
        return;
    }
    
    container.innerHTML = recommendedProducts.map((product, index) => renderProductCard(product, index)).join('');
    
    if (typeof AOS !== 'undefined') AOS.refresh();
}

// ==================== VARIABLE WEIGHT FUNCTIONS ====================
function isVariableWeightItem(item) {
    return item && item.isVariableWeight === true;
}

function renderVariableWeightCarousel(products) {
    variableWeightState.products = products;
    
    const section = document.getElementById('variableWeightCarouselSection');
    const container = document.getElementById('variableWeightCards');
    
    if (!section || !container || products.length === 0) return;
    
    section.style.display = 'block';
    
    container.innerHTML = products.map(product => {
        const weights = product.weights || [];
        const stockCount = weights.length;
        const stockClass = stockCount === 0 ? 'out' : stockCount <= 3 ? 'low' : '';
        
        return `
            <div class="vw-card" data-product-id="${product.id}">
                <div class="vw-card-image">
                    <img src="${product.image || 'https://via.placeholder.com/240'}" 
                         alt="${product.name_fr || 'Product'}" 
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/240/2E8B57/ffffff?text=Product'">
                    <span class="vw-stock-badge ${stockClass}">${stockCount} قطع</span>
                </div>
                <div class="vw-card-body">
                    <div class="vw-card-brand">QOFFA SMART</div>
                    <div class="vw-card-name-fr">${product.name_fr || ''}</div>
                    <div class="vw-card-name-ar">${product.name || ''}</div>
                    <div class="vw-card-price">${(product.price || 0).toFixed(2)} <small>درهم/${product.unit || 'كجم'}</small></div>
                    <button class="vw-dropdown-btn" onclick="openWeightPopup(${product.id})">
                        اختر الوزن <i class="fas fa-chevron-down"></i>
                    </button>
                    <button class="vw-add-cart-btn disabled" id="vw-add-btn-${product.id}" 
                            onclick="addVariableWeightToCart(${product.id})" disabled>
                        <i class="fas fa-shopping-cart"></i> أضف إلى السلة
                    </button>
                </div>
            </div>`;
    }).join('');
    
    setupVWCarouselControls();
}

function setupVWCarouselControls() {
    const scroll = document.getElementById('variableWeightCards');
    const prev = document.getElementById('variableWeightPrev');
    const next = document.getElementById('variableWeightNext');
    
    if (prev) {
        const newPrev = prev.cloneNode(true);
        prev.parentNode.replaceChild(newPrev, prev);
        newPrev.addEventListener('click', () => scroll?.scrollBy({ left: -280, behavior: 'smooth' }));
    }
    
    if (next) {
        const newNext = next.cloneNode(true);
        next.parentNode.replaceChild(newNext, next);
        newNext.addEventListener('click', () => scroll?.scrollBy({ left: 280, behavior: 'smooth' }));
    }
}

function openWeightPopup(productId) {
    const product = variableWeightState.products.find(p => p.id === productId);
    if (!product) return;
    
    const weights = product.weights || [];
    if (weights.length === 0) {
        showToast('⚠️ لا توجد أوزان متاحة', 'warning');
        return;
    }
    
    document.getElementById('vwWeightPopupOverlay')?.remove();
    
    // تجميع الأوزان مع عدد القطع
    const weightCounts = {};
    weights.forEach(w => {
        weightCounts[w] = (weightCounts[w] || 0) + 1;
    });
    
    const overlay = document.createElement('div');
    overlay.id = 'vwWeightPopupOverlay';
    overlay.className = 'vw-weight-popup-overlay';
    overlay.innerHTML = `
        <div class="vw-weight-popup">
            <div class="vw-popup-header">
                <div class="vw-popup-title">اختر الوزن - ${product.name_fr}</div>
                <button class="vw-popup-close" onclick="closeWeightPopup()"><i class="fas fa-times"></i></button>
            </div>
            <div class="vw-popup-content">
                ${Object.entries(weightCounts).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])).map(([weight, count]) => `
                    <div class="vw-weight-option ${variableWeightState.selectedWeights[productId]?.weight == weight ? 'selected' : ''}" 
                         onclick="selectPopupWeight(this, ${productId}, ${weight}, ${product.price || 0})">
                        ${weight} ${product.unit || 'كجم'} - ${(weight * (product.price || 0)).toFixed(2)} درهم
                        ${count > 1 ? ` <span class="vw-weight-stock">(${count} قطع)</span>` : ''}
                    </div>
                `).join('')}
            </div>
            <div class="vw-popup-footer">
                <button class="vw-popup-btn vw-popup-btn-cancel" onclick="closeWeightPopup()">
                    <i class="fas fa-times"></i> إلغاء
                </button>
                <button class="vw-popup-btn vw-popup-btn-confirm" id="vwConfirmBtn" 
                        onclick="confirmWeightSelection(${productId})"
                        ${!variableWeightState.selectedWeights[productId] ? 'disabled' : ''}>
                    <i class="fas fa-check"></i> تأكيد
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeWeightPopup();
    });
    
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeWeightPopup();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

function selectPopupWeight(element, productId, weight, pricePerKg) {
    variableWeightState.selectedWeights[productId] = {
        weight: parseFloat(weight),
        pricePerKg: parseFloat(pricePerKg),
        totalPrice: parseFloat(weight) * parseFloat(pricePerKg)
    };
    
    document.querySelectorAll('.vw-weight-option').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');
    
    const confirmBtn = document.getElementById('vwConfirmBtn');
    if (confirmBtn) confirmBtn.disabled = false;
}

function confirmWeightSelection(productId) {
    const selection = variableWeightState.selectedWeights[productId];
    if (!selection) return;
    closeWeightPopup();
    selectWeightOnCard(productId, selection.weight, selection.pricePerKg);
}

function closeWeightPopup() {
    const overlay = document.getElementById('vwWeightPopupOverlay');
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.2s ease';
        setTimeout(() => overlay.remove(), 200);
    }
}

function selectWeightOnCard(productId, weight, pricePerKg) {
    const totalPrice = weight * pricePerKg;
    const card = document.querySelector(`.vw-card[data-product-id="${productId}"]`);
    if (!card) return;
    
    const dropdownBtn = card.querySelector('.vw-dropdown-btn');
    const addBtn = card.querySelector('.vw-add-cart-btn');
    
    if (dropdownBtn) {
        dropdownBtn.innerHTML = `${weight} كجم - ${totalPrice.toFixed(2)} درهم <i class="fas fa-chevron-down"></i>`;
        dropdownBtn.classList.add('selected');
    }
    
    if (addBtn) {
        addBtn.className = 'vw-add-cart-btn enabled';
        addBtn.disabled = false;
        addBtn.innerHTML = `<i class="fas fa-shopping-cart"></i> أضف ${weight} كجم (${totalPrice.toFixed(2)} درهم)`;
    }
}

async function addVariableWeightToCart(productId) {
    const selection = variableWeightState.selectedWeights[productId];
    const product = variableWeightState.products.find(p => p.id === productId);
    
    if (!selection || !product) {
        showToast('⚠️ الرجاء اختيار الوزن أولاً', 'warning');
        return;
    }
    
    // ⚡ حجز الوزن في Baserow
    const synced = await vwSyncWithBaserow(productId, selection.weight, 'remove');
    if (!synced) {
        showToast('⚠️ تعذر حجز هذا الوزن، قد يكون محجوزاً من قبل عميل آخر', 'error');
        return;
    }
    
    const cartItemId = `${productId}_${selection.weight}`;
    const wasEmpty = cart.length === 0;
    const existing = cart.find(item => item.id === cartItemId);
    
    if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
        showToast(`➕ تم زيادة: ${product.name_fr} (${selection.weight}${product.unit})`, 'success');
    } else {
        cart.push({
            id: cartItemId,
            product_id: productId,
            baseId: productId,
            name: product.name,
            name_fr: product.name_fr,
            name_ar: product.name_ar || product.name,
            weight: selection.weight,
            price: selection.totalPrice,
            price_per_kg: selection.pricePerKg,
            unit: product.unit || 'كجم',
            image: product.image,
            imageOriginal: product.imageOriginal,
            quantity: 1,
            isVariableWeight: true,
            addedAt: Date.now()
        });
        showToast(`✅ تمت الإضافة: ${product.name_fr} - ⚖️ ${selection.weight}${product.unit}`, 'success');
    }
    
    localStorage.setItem('qoffaCart', JSON.stringify(cart));
    updateCartCount();
    updateCartSidebar();
    
    // تحديث محلي
    const idx = product.weights.findIndex(w => parseFloat(w) === parseFloat(selection.weight));
    if (idx !== -1) product.weights.splice(idx, 1);
    delete variableWeightState.selectedWeights[productId];
    
    renderVariableWeightCarousel(variableWeightState.products);
    
    if (wasEmpty) {
        const sidebar = document.getElementById('cartSidebar');
        if (sidebar) {
            sidebar.classList.add('active');
            updateCartSidebar();
        }
    }
    
    window.dispatchEvent(new CustomEvent('vwAddToCart', {
        detail: {
            product_id: productId,
            name: product.name,
            name_fr: product.name_fr,
            weight: selection.weight,
            price: selection.totalPrice
        }
    }));
}

// ==================== CONFIRMATION MODAL FUNCTIONS ====================
function showConfirmationModal(itemId, itemName) {
    const modal = document.getElementById('confirmationModal');
    if (!modal) return;
    
    window.currentConfirmProductId = itemId;
    window.currentConfirmProductName = itemName;
    
    const nameEl = document.getElementById('confirmProductName');
    if (nameEl) nameEl.textContent = itemName || 'المنتج';
    
    modal.classList.add('active');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

window.confirmDelete = function(callback) {
    const productId = window.currentConfirmProductId;
    const productName = window.currentConfirmProductName;
    
    if (callback && typeof callback === 'function') {
        callback(productId, productName);
    }
    
    cancelDelete();
};

window.cancelDelete = function() {
    const modal = document.getElementById('confirmationModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
    document.body.style.overflow = 'auto';
    
    window.currentConfirmProductId = null;
    window.currentConfirmProductName = null;
};

// ==================== CART FUNCTIONS ====================
function calculateCartTotal() {
    return cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'flex' : 'none';
    });
    localStorage.setItem('qoffaCart', JSON.stringify(cart));
    updateCartSidebar();
    renderRecommendedProducts();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    if (item.isVariableWeight) return;
    
    let newQuantity;
    if (item.unit === 'كيلو' || item.unit === 'kg' || item.unit === 'كجم') {
        newQuantity = (item.quantity || 1) + (change * 0.5);
        newQuantity = Math.max(0.5, Math.round(newQuantity * 2) / 2);
    } else {
        newQuantity = (item.quantity || 1) + change;
        newQuantity = Math.max(1, newQuantity);
    }
    
    item.quantity = newQuantity;
    localStorage.setItem('qoffaCart', JSON.stringify(cart));
    updateCartCount();
    updateCartSidebar();
    updateCartTotalIndicator();
}

function removeFromCart(productId) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    showConfirmationModal(item.id, item.name_fr || item.name);
}

// ✅ حذف المنتج من السلة مع إرجاع Variable Weight
window.deleteProductFromCart = async function(productId, productName) {
    const item = cart.find(i => String(i.id) === String(productId));
    
    // ⚡ إرجاع الوزن لـ Baserow
    if (item?.isVariableWeight) {
        await vwReturnWeightToBaserow(item);
    }
    
    cart = cart.filter(item => String(item.id) !== String(productId));
    localStorage.setItem('qoffaCart', JSON.stringify(cart));
    updateCartCount();
    updateCartSidebar();
    
    const sidebar = document.getElementById('cartSidebar');
    if (sidebar && !sidebar.classList.contains('active')) {
        sidebar.classList.add('active');
    }
    
    window.preventCartClose = true;
    setTimeout(() => { window.preventCartClose = false; }, 500);
    
    showToast(productName ? `✅ تم إزالة ${productName} من السلة` : 'تم إزالة المنتج من السلة', 'success');
};

function clearCart() {
    if (cart.length === 0) {
        showToast('السلة فارغة بالفعل', 'info');
        return;
    }
    
    showConfirmDialog(
        `حذف ${cart.length} منتج من السلة؟`,
        'هل أنت متأكد من حذف جميع المنتجات؟ لا يمكن التراجع عن هذا الإجراء!',
        () => {
            cart = [];
            localStorage.setItem('qoffaCart', JSON.stringify(cart));
            updateCartCount();
            updateCartSidebar();
            showToast('✅ تم حذف جميع المنتجات من السلة', 'success');
        },
        () => {
            showToast('❌ تم إلغاء الحذف', 'info');
        }
    );
}

function handleAddToCart(event) {
    event.preventDefault();
    const btn = event.target.closest('button');
    const productId = parseInt(btn.getAttribute('data-product-id'));
    
    let product = null;
    for (const category of Object.values(allProducts)) {
        product = category.find(p => p.id === productId);
        if (product) break;
    }
    
    if (!product) {
        showToast('لم يتم العثور على المنتج', 'error');
        return;
    }
    
    addToCart(product);
}

function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    
    let cartImage = product.image;
    if (product.imageOriginal && !product.imageOriginal.includes('assets/')) {
        cartImage = getOptimizedImage(product.imageOriginal, { width: 80, height: 80, quality: 80 });
    }
    
    if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
        showToast(`تم زيادة كمية ${product.name_fr || product.name}`, 'success');
    } else {
        cart.push({ 
            id: product.id,
            name: product.name,
            name_fr: product.name_fr,
            name_ar: product.name_ar,
            price: product.price,
            quantity: 1,
            unit: product.unit || product.Unit || '',
            image: cartImage,
            imageOriginal: product.imageOriginal,
            category: product.category
        });
        showToast(`✅ تم إضافة ${product.name_fr || product.name} إلى السلة`, 'success');
    }
    
    localStorage.setItem('qoffaCart', JSON.stringify(cart));
    updateCartCount();
}

function increaseQuantity(productId) {
    const item = cart.find(item => String(item.id) === String(productId));
    if (item?.isVariableWeight) return;
    updateQuantity(productId, 1);
}

function decreaseQuantity(productId) {
    const item = cart.find(item => String(item.id) === String(productId));
    if (item?.isVariableWeight) return;
    updateQuantity(productId, -1);
}

function updateCartTotalIndicator() {
    const cartTotal = calculateCartTotal();
    const totalText = document.getElementById('sidebarTotalText');
    const minOrderMsg = document.getElementById('sidebarMinOrderMsg');
    const checkoutBtn = document.getElementById('cartCheckout');
    
    if (totalText) {
        totalText.textContent = `💰 المجموع الإجمالي: ${cartTotal.toFixed(2)} درهم`;
    }
    
    if (cartTotal >= 150) {
        if (totalText) totalText.style.color = '#2E8B57';
        if (minOrderMsg) minOrderMsg.style.display = 'none';
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.style.opacity = '1';
            checkoutBtn.style.cursor = 'pointer';
        }
    } else {
        if (totalText) totalText.style.color = '#dc3545';
        if (minOrderMsg) minOrderMsg.style.display = 'flex';
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
            checkoutBtn.style.opacity = '0.5';
            checkoutBtn.style.cursor = 'not-allowed';
        }
    }
}

function updateCartSidebar() {
    cart = JSON.parse(localStorage.getItem('qoffaCart')) || [];
    
    const sidebar = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotalPrice');
    
    if (!sidebar) return;
    
    if (cart.length === 0) {
        sidebar.innerHTML = `
            <div class="cart-empty">
                <i class="fas fa-shopping-cart fa-3x"></i>
                <p>السلة فارغة</p>
                <a href="/products/" class="btn btn-primary">تصفح المنتجات</a>
            </div>
        `;
        if (totalEl) totalEl.textContent = '0.00 درهم';
        updateCartTotalIndicator();
        return;
    }
    
    let html = '';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * (item.quantity || 1);
        total += itemTotal;
        
        const isVar = isVariableWeightItem(item);
        
        let quantityDisplay;
        if (isVar) {
            quantityDisplay = `${item.quantity || 1} × ${item.weight}${item.unit || 'كجم'}`;
        } else if (item.unit === 'كيلو' || item.unit === 'kg' || item.unit === 'كجم') {
            quantityDisplay = item.quantity.toFixed(1) + ' كيلو';
        } else {
            quantityDisplay = item.quantity + ' ' + (item.unit || 'وحدة');
        }
        
        const itemImage = item.image || '/assets/images/default-product.png';
        
        html += `
            <div class="cart-item" data-id="${item.id}" style="position: relative;">
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})" title="حذف المنتج">
                    <i class="fas fa-trash"></i>
                </button>
                <img src="${itemImage}" 
                     alt="${item.name_fr || item.name}" 
                     class="cart-item-img" 
                     loading="lazy" 
                     decoding="async" 
                     onerror="this.src='https://via.placeholder.com/80/2E8B57/ffffff?text=${encodeURIComponent((item.name_fr || item.name).substring(0, 10))}'">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name_fr || item.name}${isVar ? ` <span class="vw-weight-badge">${item.weight}${item.unit || 'كجم'}</span>` : ''}</div>
                    <div class="cart-item-price">${formatPrice(item.price)}</div>
                    ${!isVar ? `
                        <div class="cart-item-quantity">
                            <button class="qty-btn-sm" onclick="decreaseQuantity(${item.id})">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="quantity-display">${quantityDisplay}</span>
                            <button class="qty-btn-sm" onclick="increaseQuantity(${item.id})">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    ` : `
                        <div class="cart-item-weight-display">
                            <span class="weight-value">${item.weight}${item.unit || 'كجم'}</span>
                            ${item.quantity > 1 ? `<span class="weight-qty">× ${item.quantity}</span>` : ''}
                        </div>
                    `}
                </div>
            </div>
        `;
    });
    
    sidebar.innerHTML = html;
    if (totalEl) totalEl.textContent = formatPrice(total);
    updateCartTotalIndicator();
}

function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    if (sidebar) sidebar.classList.toggle('active');
}

function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.toggle('active');
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 تهيئة التطبيق...');
    
    let preventCartClose = false;
    window.preventCartClose = false;
    
    fetchProductsFromBaserow();
    updateCartCount();
    updateCartTotalIndicator();
    
    // ⏰ تشغيل مؤقت الأمان
    vwStartSafetyTimer();
    
    const header = document.getElementById('mainHeader');
    window.addEventListener('scroll', function() {
        if (header) header.classList.toggle('scrolled', window.scrollY > 50);
        const backToTop = document.getElementById('backToTop');
        if (backToTop) backToTop.classList.toggle('visible', window.scrollY > 300);
    });
    
    document.getElementById('backToTop')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    document.getElementById('mobileMenuBtn')?.addEventListener('click', function() {
        document.getElementById('navMenu')?.classList.toggle('active');
        document.getElementById('cartSidebar')?.classList.remove('active');
    });
    
    document.getElementById('cartBtn')?.addEventListener('click', function() {
        document.getElementById('cartSidebar')?.classList.toggle('active');
        document.getElementById('navMenu')?.classList.remove('active');
        if (document.getElementById('cartSidebar')?.classList.contains('active')) {
            updateCartSidebar();
        }
    });
    
    document.getElementById('cartClose')?.addEventListener('click', function() {
        document.getElementById('cartSidebar')?.classList.remove('active');
    });
    
    document.getElementById('cartCheckout')?.addEventListener('click', function() {
        if (cart.length === 0) {
            showToast('السلة فارغة! أضف منتجات قبل إتمام الطلب', 'error');
            return;
        }
        if (calculateCartTotal() < 150) {
            showToast('الحد الأدنى للطلب هو 150 درهم', 'error');
            return;
        }
        window.location.href = '/order/';
    });
    
    // ⚡ Popup عند الخروج
    window.addEventListener('beforeunload', function(e) {
        const currentCart = JSON.parse(localStorage.getItem('qoffaCart')) || [];
        const hasVW = currentCart.some(item => item.isVariableWeight);
        
        if (hasVW && !vwExitConfirmed) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
    
    // 📱 موبايل - visibility change
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            const currentCart = JSON.parse(localStorage.getItem('qoffaCart')) || [];
            const hasVW = currentCart.some(item => item.isVariableWeight);
            if (hasVW) {
                localStorage.setItem('vw_left_at', Date.now().toString());
            }
        } else {
            // رجع فتح الصفحة - تحقق من المهلة
            vwCheckSafetyTimeout();
        }
    });
    
    document.addEventListener('click', function(e) {
        if (window.preventCartClose) return;
        const sidebar = document.getElementById('cartSidebar');
        const cartBtn = document.getElementById('cartBtn');
        const confirmModal = document.getElementById('confirmationModal');
        if (sidebar && sidebar.classList.contains('active') && 
            !sidebar.contains(e.target) && 
            !cartBtn.contains(e.target) && 
            !confirmModal?.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.getElementById('navMenu')?.classList.remove('active');
            document.getElementById('cartSidebar')?.classList.remove('active');
        }
    });
    
    window.addEventListener('vwAddToCart', function() {
        updateCartCount();
        updateCartSidebar();
        const sidebar = document.getElementById('cartSidebar');
        if (sidebar) sidebar.classList.add('active');
    });
    
    document.querySelectorAll('.products-filter').forEach(filterContainer => {
        filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const parent = this.closest('.products-filter');
                parent.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                const category = parent.id.replace('Filter', '');
                const filter = this.dataset.filter;
                renderCategory(category, filter);
                
                const categorySection = document.getElementById(category);
                if (categorySection) {
                    categorySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    });
    
    document.querySelectorAll('.quick-link').forEach(link => {
        link.addEventListener('click', function(e) {
            document.querySelectorAll('.quick-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            document.getElementById('navMenu')?.classList.remove('active');
        });
    });
    
    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 800, once: true });
    }
    
    console.log('✅ التطبيق جاهز!');
});

// ==================== EXPOSE GLOBALLY ====================
window.getOptimizedImage = getOptimizedImage;
window.handleImageError = handleImageError;
window.showConfirmDialog = showConfirmDialog;
window.renderFeaturedProducts = renderFeaturedProducts;
window.renderRecommendedProducts = renderRecommendedProducts;
window.getRecommendedProducts = getRecommendedProducts;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.handleAddToCart = handleAddToCart;
window.addToCart = addToCart;
window.toggleCart = toggleCart;
window.formatPrice = formatPrice;
window.calculateCartTotal = calculateCartTotal;
window.updateCartSidebar = updateCartSidebar;
window.updateCartCount = updateCartCount;
window.showToast = showToast;

// ✅ Variable Weight exports
window.isVariableWeightItem = isVariableWeightItem;
window.renderVariableWeightCarousel = renderVariableWeightCarousel;
window.openWeightPopup = openWeightPopup;
window.selectPopupWeight = selectPopupWeight;
window.confirmWeightSelection = confirmWeightSelection;
window.closeWeightPopup = closeWeightPopup;
window.addVariableWeightToCart = addVariableWeightToCart;
window.vwSyncWithBaserow = vwSyncWithBaserow;
window.vwReturnWeightToBaserow = vwReturnWeightToBaserow;
window.vwReturnAllWeights = vwReturnAllWeights;
window.vwShowExitPopup = vwShowExitPopup;

console.log('✅ main.js complete - Variable Weight Safety System ready');