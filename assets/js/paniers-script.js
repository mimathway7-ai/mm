// ==================== CONFIGURATION ====================
const BASEROW_TOKEN = 'OIEan8aAjLjoCoTXKO6Evd4cifbtqRf8';
const BASEROW_TABLE_ID = '882093';
const BASEROW_URL = `https://api.baserow.io/api/database/rows/table/${BASEROW_TABLE_ID}/?user_field_names=true&size=200`;

// ==================== GLOBAL VARIABLES ====================
let allBundles = [];
let cart = JSON.parse(localStorage.getItem('qoffaCart')) || [];
let activeFilter = 'all';

// ==================== SAMPLE BUNDLES DATA (Fallback) ====================
const sampleBundles = [
    {
        id: 1,
        name: 'الباقة اليومية',
        name_fr: 'Pack Quotidien',
        price: 120,
        originalPrice: 150,
        category: 'bundles',
        sub_category: 'daily',
        unit: 'باقة',
        description: 'باقة يومية متكاملة تحتوي على الخضروات والفواكه الأساسية لليوم',
        items: ['طماطم (1 كجم)', 'بصل (500 جم)', 'بطاطس (1 كجم)', 'تفاح (1 كجم)', 'موز (500 جم)', 'خس (1 رأس)', 'جزر (500 جم)', 'ليمون (250 جم)'],
        image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400',
        badge: 'popular',
        badgeText: 'الأكثر مبيعاً'
    },
    {
        id: 2,
        name: 'الباقة العائلية',
        name_fr: 'Pack Familial',
        price: 250,
        originalPrice: 350,
        category: 'bundles',
        sub_category: 'family',
        unit: 'باقة',
        description: 'باقة أسبوعية كاملة للعائلة، تكفي 4-5 أشخاص',
        items: ['طماطم (2 كجم)', 'بصل (1 كجم)', 'بطاطس (2 كجم)', 'تفاح (2 كجم)', 'برتقال (2 كجم)', 'خيار (1 كجم)', 'فلفل (500 جم)', 'ليمون (500 جم)', 'موز (1 كجم)', 'عنب (500 جم)'],
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
        badge: 'sale',
        badgeText: 'وفر 100 درهم'
    },
    {
        id: 3,
        name: 'باقة الهدايا الفاخرة',
        name_fr: 'Pack Cadeau Premium',
        price: 400,
        originalPrice: 500,
        category: 'bundles',
        sub_category: 'gift',
        unit: 'باقة',
        description: 'باقة هدايا فاخرة مع تغليف أنيق، مثالية للمناسبات الخاصة',
        items: ['تفاح أحمر فاخر (1 كجم)', 'عنب مستورد (1 كجم)', 'كيوي (500 جم)', 'فراولة (500 جم)', 'مانجو (2 حبة)', 'أفوكادو (2 حبة)', 'أناناس (1 حبة)', 'رمان (2 حبة)'],
        image: 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400',
        badge: 'new',
        badgeText: 'جديد'
    },
    {
        id: 4,
        name: 'باقة العصائر الطازجة',
        name_fr: 'Pack Jus Frais',
        price: 180,
        originalPrice: 220,
        category: 'bundles',
        sub_category: 'premium',
        unit: 'باقة',
        description: 'باقة مخصصة لعشاق العصائر الطبيعية، فواكه مختارة بعناية',
        items: ['برتقال (2 كجم)', 'جزر (1 كجم)', 'تفاح (1 كجم)', 'ليمون (500 جم)', 'زنجبيل (200 جم)', 'أناناس (1 حبة)', 'فراولة (250 جم)'],
        image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400',
        badge: 'sale',
        badgeText: 'خصم 18%'
    },
    {
        id: 5,
        name: 'الباقة الاقتصادية',
        name_fr: 'Pack Économique',
        price: 80,
        originalPrice: 100,
        category: 'bundles',
        sub_category: 'daily',
        unit: 'باقة',
        description: 'باقة اقتصادية مناسبة للاستهلاك اليومي السريع',
        items: ['طماطم (500 جم)', 'بصل (500 جم)', 'بطاطس (1 كجم)', 'تفاح (500 جم)', 'ليمون (250 جم)', 'خيار (500 جم)'],
        image: 'https://images.unsplash.com/photo-1579113800032-c38bd7635818?w=400',
        badge: 'popular',
        badgeText: 'قيمة ممتازة'
    },
    {
        id: 6,
        name: 'باقة الشواء والحفلات',
        name_fr: 'Pack BBQ & Fêtes',
        price: 350,
        originalPrice: 420,
        category: 'bundles',
        sub_category: 'premium',
        unit: 'باقة',
        description: 'كل ما تحتاجه لحفلة شواء مثالية مع العائلة والأصدقاء',
        items: ['طماطم (2 كجم)', 'بصل (1 كجم)', 'فلفل (1 كجم)', 'باذنجان (1 كجم)', 'كوسة (1 كجم)', 'ليمون (1 كجم)', 'ذرة (6 حبات)', 'بطاطس (2 كجم)', 'بطيخ (1 حبة)'],
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
        badge: 'new',
        badgeText: 'موسمي'
    }
];

// ==================== IMAGE OPTIMIZATION ====================
function getOptimizedImage(url, options = {}) {
    if (!url || url.includes('undefined') || url.includes('null')) {
        return 'https://via.placeholder.com/400/2E8B57/ffffff?text=Qoffa+Bundle';
    }
    if (url.includes('images.weserv.nl') || url.includes('assets/') || url.includes('placeholder')) {
        return url;
    }
    const width = options.width || 400;
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=${width}&q=80&output=webp&l=9`;
}

// ==================== FETCH BUNDLES FROM BASEROW ====================
async function fetchBundles() {
    showLoader(true);
    try {
        console.log('🔄 جاري جلب الباقات من Baserow...');
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
        
        // Filter only bundles
        const bundlesFromApi = data.results.filter(product => 
            product.category && product.category.toLowerCase() === 'bundles'
        );
        
        if (bundlesFromApi.length > 0) {
            allBundles = bundlesFromApi.map(product => {
                let imageUrl = null;
                if (product.product_image && product.product_image.length > 0) {
                    imageUrl = product.product_image[0].url;
                }
                
                return {
                    id: product.id,
                    name: product.name_ar || product.name || '',
                    name_fr: product.name_fr || product.name || '',
                    price: parseFloat(product.price) || 0,
                    originalPrice: product.original_price ? parseFloat(product.original_price) : null,
                    category: 'bundles',
                    sub_category: product.subcategory || product.sub_category || 'daily',
                    unit: product.unit || 'باقة',
                    description: product.description || '',
                    items: product.bundle_items ? product.bundle_items.split('\n').filter(item => item.trim()) : [],
                    image: imageUrl ? getOptimizedImage(imageUrl, { width: 400 }) : 'https://via.placeholder.com/400/2E8B57/ffffff?text=Qoffa+Bundle',
                    imageOriginal: imageUrl,
                    badge: product.sub_category === 'gift' ? 'new' : (product.sub_category === 'premium' ? 'sale' : 'popular'),
                    badgeText: product.sub_category === 'gift' ? 'جديد' : (product.sub_category === 'premium' ? 'مميز' : 'الأكثر مبيعاً')
                };
            });
        }
        
        // If no bundles from API, use sample data
        if (allBundles.length === 0) {
            console.log('⚠️ لا توجد باقات في API، استخدام البيانات النموذجية');
            allBundles = sampleBundles;
        }
        
    } catch (error) {
        console.error('❌ خطأ في جلب الباقات:', error);
        console.log('⚠️ استخدام البيانات النموذجية كبديل');
        allBundles = sampleBundles;
    } finally {
        showLoader(false);
        renderBundles();
    }
}

// ==================== RENDER BUNDLES ====================
function renderBundles() {
    const grid = document.getElementById('bundlesGrid');
    const noBundles = document.getElementById('noBundles');
    
    if (!grid) return;
    
    let filteredBundles = allBundles;
    
    if (activeFilter !== 'all') {
        filteredBundles = allBundles.filter(bundle => bundle.sub_category === activeFilter);
    }
    
    if (filteredBundles.length === 0) {
        grid.innerHTML = '';
        if (noBundles) noBundles.style.display = 'block';
        return;
    }
    
    if (noBundles) noBundles.style.display = 'none';
    
    grid.innerHTML = filteredBundles.map(bundle => {
        const discount = bundle.originalPrice 
            ? Math.round(((bundle.originalPrice - bundle.price) / bundle.originalPrice) * 100) 
            : 0;
        
        const badgeClass = bundle.badge === 'popular' ? 'badge-popular' : 
                          bundle.badge === 'sale' ? 'badge-sale' : 'badge-new';
        
        const itemsPreview = bundle.items.slice(0, 4).map(item => 
            `<span class="bundle-item-tag">${item}</span>`
        ).join('');
        
        const moreItems = bundle.items.length > 4 ? 
            `<span class="bundle-item-tag">+${bundle.items.length - 4} منتجات أخرى</span>` : '';
        
        return `
            <div class="bundle-card" data-id="${bundle.id}">
                ${bundle.badge ? `<div class="bundle-card-badge ${badgeClass}">${bundle.badgeText}</div>` : ''}
                <div class="bundle-image">
                    <img src="${bundle.image}" alt="${bundle.name_fr || bundle.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/400/2E8B57/ffffff?text=Qoffa'">
                </div>
                <div class="bundle-content">
                    <div class="bundle-category">باقة ${bundle.sub_category === 'daily' ? 'يومية' : bundle.sub_category === 'family' ? 'عائلية' : bundle.sub_category === 'gift' ? 'هدايا' : 'مميزة'}</div>
                    <h3 class="bundle-name">${bundle.name_fr || bundle.name}</h3>
                    <p class="bundle-desc">${bundle.description}</p>
                    <div class="bundle-items">
                        ${itemsPreview}
                        ${moreItems}
                    </div>
                    <div class="bundle-price-section">
                        <span class="bundle-price">${bundle.price.toFixed(2)} <span>درهم</span></span>
                        ${bundle.originalPrice ? `<span class="bundle-old-price">${bundle.originalPrice.toFixed(2)}</span>` : ''}
                        ${discount > 0 ? `<span class="bundle-discount">-${discount}%</span>` : ''}
                    </div>
                    <div class="bundle-actions">
                        <button class="btn-add-to-cart" onclick="addToCart(${bundle.id})">
                            <i class="fas fa-shopping-cart"></i> أضف إلى السلة
                        </button>
                        <button class="btn-details" onclick="showBundleDetails(${bundle.id})">
                            <i class="fas fa-eye"></i> تفاصيل
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== SHOW BUNDLE DETAILS MODAL ====================
function showBundleDetails(bundleId) {
    const bundle = allBundles.find(b => b.id === bundleId);
    if (!bundle) return;
    
    const discount = bundle.originalPrice 
        ? Math.round(((bundle.originalPrice - bundle.price) / bundle.originalPrice) * 100) 
        : 0;
    
    const modalOverlay = document.getElementById('bundleModalOverlay');
    const modalContent = document.getElementById('modalContent');
    
    if (!modalOverlay || !modalContent) return;
    
    modalContent.innerHTML = `
        <div class="modal-image">
            <img src="${bundle.image}" alt="${bundle.name_fr || bundle.name}" onerror="this.src='https://via.placeholder.com/400/2E8B57/ffffff?text=Qoffa'">
        </div>
        <h2 class="modal-bundle-name">${bundle.name_fr || bundle.name}</h2>
        <p class="modal-bundle-desc">${bundle.description}</p>
        <h3 style="color: #1a1a1a; margin-bottom: 15px;">📦 محتويات الباقة:</h3>
        <ul class="modal-items-list">
            ${bundle.items.map(item => `<li><i class="fas fa-check-circle"></i> ${item}</li>`).join('')}
        </ul>
        <div class="modal-price-section">
            <span class="modal-price">${bundle.price.toFixed(2)} <span>درهم</span></span>
            ${bundle.originalPrice ? `<span class="modal-old-price">${bundle.originalPrice.toFixed(2)} درهم</span>` : ''}
            ${discount > 0 ? `<span style="color: #FF5252; font-weight: 700;">توفير ${discount}%</span>` : ''}
        </div>
        <button class="modal-add-to-cart" onclick="addToCart(${bundle.id}); closeModal();">
            <i class="fas fa-shopping-cart"></i> أضف إلى السلة
        </button>
    `;
    
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modalOverlay = document.getElementById('bundleModalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ==================== CART FUNCTIONS ====================
function addToCart(bundleId) {
    const bundle = allBundles.find(b => b.id === bundleId);
    if (!bundle) return;
    
    const existing = cart.find(item => item.id === bundle.id);
    
    if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
        showToast(`تم زيادة كمية ${bundle.name_fr || bundle.name}`, 'success');
    } else {
        cart.push({
            id: bundle.id,
            name: bundle.name,
            name_fr: bundle.name_fr,
            price: bundle.price,
            quantity: 1,
            unit: bundle.unit || 'باقة',
            image: bundle.image,
            category: bundle.category,
            isBundle: true
        });
        showToast(`✅ تم إضافة ${bundle.name_fr || bundle.name} إلى السلة`, 'success');
    }
    
    saveCart();
    updateCartCount();
}

function saveCart() {
    localStorage.setItem('qoffaCart', JSON.stringify(cart));
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = count || '0';
    });
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showLoader(show = true) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.toggle('active', show);
    }
}

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 تهيئة صفحة الباقات...');
    
    // Fetch bundles
    fetchBundles();
    
    // Update cart count from localStorage
    cart = JSON.parse(localStorage.getItem('qoffaCart')) || [];
    updateCartCount();
    
    // Header scroll effect
    const header = document.getElementById('mainHeader');
    window.addEventListener('scroll', function() {
        if (header) {
            header.classList.toggle('scrolled', window.scrollY > 50);
        }
        
        const backToTop = document.getElementById('backToTop');
        if (backToTop) {
            backToTop.classList.toggle('visible', window.scrollY > 300);
        }
    });
    
    // Back to top
    document.getElementById('backToTop')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            activeFilter = this.dataset.filter;
            renderBundles();
        });
    });
    
    // Modal close
    document.getElementById('modalClose')?.addEventListener('click', closeModal);
    document.getElementById('bundleModalOverlay')?.addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    // Close modal on Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
    
    // Cart button
    document.getElementById('cartBtn')?.addEventListener('click', function() {
        window.location.href = '/order/';
    });
    
    // Mobile menu
    document.getElementById('mobileMenuBtn')?.addEventListener('click', function() {
        const navMenu = document.getElementById('navMenu');
        if (navMenu) {
            navMenu.classList.toggle('active');
        }
    });
    
    console.log('✅ صفحة الباقات جاهزة!');
});

// Fonction de suppression avec callback
function deleteProductFromCartLocal(bundleId, bundleName) {
    cart = cart.filter(item => item.id !== bundleId);
    localStorage.setItem('qoffaCart', JSON.stringify(cart));
    updateCartCount();
    document.getElementById('cartSidebar')?.classList.remove('active');
    const message = bundleName ? `✅ تم إزالة ${bundleName} من السلة` : 'تم إزالة المنتج من السلة';
    showToast(message, 'success');
}

// Expose functions globally
window.addToCart = addToCart;
window.showBundleDetails = showBundleDetails;
window.deleteProductFromCart = deleteProductFromCartLocal;
window.closeModal = closeModal;