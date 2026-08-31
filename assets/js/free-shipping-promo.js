/**
 * نظام التنبيهات: قريب من التوصيل المجاني
 * Free Shipping Promo System
 */

class FreeShippingPromo {
    constructor() {
        this.FREE_SHIPPING_THRESHOLD = 200;
        this.PROMO_MIN_THRESHOLD = 150;
        this.NOTIFICATION_HIDE_DURATION = 10 * 60 * 1000; // 10 دقائق
        this.STORAGE_KEY = 'qoffa_promo_hidden_until';
        this.PRIMARY_COLOR = '#2E8B57';
    }

    /**
     * حساب المبلغ المتبقي للتوصيل المجاني
     */
    calculateRemainingAmount(subtotal) {
        const remaining = this.FREE_SHIPPING_THRESHOLD - subtotal;
        return remaining > 0 ? remaining : 0;
    }

    /**
     * حساب نسبة الإنجاز
     */
    calculateProgress(subtotal) {
        const progress = (subtotal / this.FREE_SHIPPING_THRESHOLD) * 100;
        return Math.min(progress, 100);
    }

    /**
     * التحقق من إمكانية عرض الترويج
     */
    shouldShowPromo(subtotal) {
        if (subtotal < this.PROMO_MIN_THRESHOLD) return false;
        
        const hiddenUntil = localStorage.getItem(this.STORAGE_KEY);
        if (hiddenUntil && new Date().getTime() < parseInt(hiddenUntil)) {
            return false;
        }
        
        return true;
    }

    /**
     * إخفاء الترويج لمدة معينة
     */
    hidePromoForDuration() {
        const hideUntil = new Date().getTime() + this.NOTIFICATION_HIDE_DURATION;
        localStorage.setItem(this.STORAGE_KEY, hideUntil.toString());
    }

    /**
     * الحصول على المنتجات القريبة من المبلغ المتبقي
     */
    async getNearbyProducts(remainingAmount, limit = 3) {
        try {
            const BASEROW_TOKEN = 'OIEan8aAjLjoCoTXKO6Evd4cifbtqRf8';
            const PRODUCTS_TABLE_ID = '882093';
            
            const response = await fetch(
                `https://api.baserow.io/api/database/rows/table/${PRODUCTS_TABLE_ID}/?user_field_names=true&size=50`,
                {
                    headers: { 'Authorization': `Token ${BASEROW_TOKEN}` }
                }
            );
            
            if (!response.ok) throw new Error('فشل تحميل المنتجات');
            
            const data = await response.json();
            
            // تصفية المنتجات حسب السعر
            const nearbyProducts = data.results
                .map(p => ({
                    id: p.id,
                    name: p.name || 'منتج',
                    price: parseFloat(p.price) || 0,
                    image: (p.product_image?.[0]?.url) || '/assets/images/default.png',
                    distance: Math.abs(parseFloat(p.price) - remainingAmount)
                }))
                .filter(p => p.price > 0 && p.price <= remainingAmount * 1.5)
                .sort((a, b) => a.distance - b.distance)
                .slice(0, limit);
            
            return nearbyProducts;
        } catch (error) {
            console.error('❌ خطأ في جلب المنتجات:', error);
            return [];
        }
    }

    /**
     * إنشاء HTML للترويج
     */
    createPromoHTML(subtotal, remainingAmount, products) {
        const progress = this.calculateProgress(subtotal);
        
        let productsHTML = '';
        if (products.length > 0) {
            productsHTML = `
                <div class="promo-products">
                    <p class="promo-subtitle">اقترحنا عليك هذه المنتجات:</p>
                    <div class="promo-products-list">
                        ${products.map(p => `
                            <div class="promo-product-item">
                                <img src="${p.image}" alt="${p.name}" onerror="this.src='/assets/images/default.png'">
                                <div class="promo-product-info">
                                    <div class="promo-product-name">${p.name}</div>
                                    <div class="promo-product-price">${p.price.toFixed(0)} درهم</div>
                                </div>
                                <button class="promo-add-btn" onclick="addProductToCart(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.image.replace(/'/g, "\\'")}')" title="أضف للسلة">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        return `
            <div class="free-shipping-promo" id="freeShippingPromo">
                <button class="promo-close" onclick="freeShippingPromo.hidePromoAndNotify()">
                    <i class="fas fa-times"></i>
                </button>
                
                <div class="promo-content">
                    <div class="promo-header">
                        <i class="fas fa-truck promo-icon"></i>
                        <div class="promo-text">
                            <div class="promo-title">🚚 أنت قريب من التوصيل المجاني!</div>
                            <div class="promo-message">أضف <strong>${remainingAmount.toFixed(0)} درهم</strong> فقط</div>
                        </div>
                    </div>
                    
                    <div class="promo-progress">
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-text">${progress.toFixed(0)}% من 200 درهم</div>
                    </div>
                    
                    ${productsHTML}
                </div>
            </div>
        `;
    }

    /**
     * عرض الترويج
     */
    async showPromo(subtotal, targetElement) {
        if (!this.shouldShowPromo(subtotal)) return;
        
        const remainingAmount = this.calculateRemainingAmount(subtotal);
        if (remainingAmount <= 0) return;
        
        const products = await this.getNearbyProducts(remainingAmount);
        const promoHTML = this.createPromoHTML(subtotal, remainingAmount, products);
        
        // إزالة أي ترويج موجود
        const existingPromo = targetElement.querySelector('.free-shipping-promo');
        if (existingPromo) existingPromo.remove();
        
        // إدراج الترويج الجديد
        targetElement.insertAdjacentHTML('afterbegin', promoHTML);
        
        console.log('%c✅ تم عرض ترويج التوصيل المجاني', 'color: #2E8B57; font-weight: bold');
    }

    /**
     * إخفاء الترويج مع الإشعار
     */
    hidePromoAndNotify() {
        const promo = document.getElementById('freeShippingPromo');
        if (promo) {
            promo.style.animation = 'slideOut 0.3s ease-in-out forwards';
            setTimeout(() => promo.remove(), 300);
        }
        
        this.hidePromoForDuration();
        
        // إظهار إشعار
        if (typeof showToast === 'function') {
            showToast('✅ تم إخفاء الرسالة لمدة 10 دقائق', 'info');
        }
    }

    /**
     * تحديث الترويج عند تغيير السلة
     */
    updatePromo(subtotal) {
        // تحديث في /order/
        const orderSummary = document.querySelector('.order-summary-card');
        if (orderSummary) {
            this.showPromo(subtotal, orderSummary);
        }
        
        // تحديث في cart sidebar
        const cartSidebar = document.getElementById('cartSidebar');
        if (cartSidebar) {
            this.showPromo(subtotal, cartSidebar);
        }
        
        // تحديث في /products/
        const productContainer = document.querySelector('.products-container');
        if (productContainer) {
            this.showPromo(subtotal, productContainer);
        }
    }
}

// إنشاء instance عام
const freeShippingPromo = new FreeShippingPromo();

// جعله متاح عالمياً
window.freeShippingPromo = freeShippingPromo;
