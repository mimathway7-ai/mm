// ===== نظام الـ Reorder Popup (إعادة الطلب) =====
// يعرض popup عندما يرجع العميل للموقع ويكون عنده طلب سابق

class ReorderPopupSystem {
    constructor() {
        this.lastOrder = null;
        this.customerName = null;
        this.init();
    }

    init() {
        // انتظر تحميل الـ DOM كاملاً
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        console.log('%c🔄 نظام إعادة الطلب معطّل - لا يتم عرض البوب أب', 'color: #e74c3c; font-weight: bold; font-size: 14px');

        // تحميل بيانات الطلب السابق
        this.loadLastOrder();

        // إنشاء الـ Popup HTML إذا لم يكن موجود
        this.createPopupHTML();

        // ❌ تم تعطيل عرض الـ Popup بالكامل
        // لا يتم عرض الـ Popup تحت أي ظرف
        console.log('%c⚠️ البوب أب معطّل ولن يظهر', 'color: #e74c3c');
    }

    loadLastOrder() {
        try {
            // محاولة تحميل الطلب من localStorage
            const savedOrder = localStorage.getItem('qoffa_last_order');
            const savedCustomerName = localStorage.getItem('qoffa_customer_name');

            if (savedOrder) {
                this.lastOrder = JSON.parse(savedOrder);
                this.customerName = savedCustomerName || 'العميل';
                console.log('%c✅ تم تحميل الطلب السابق:', 'color: #27ae60', this.lastOrder);
            }
        } catch (error) {
            console.error('%c❌ خطأ في تحميل الطلب السابق:', 'color: #e74c3c', error);
        }
    }

    createPopupHTML() {
        // تحقق من أن الـ Popup لم تُنشأ من قبل
        if (document.getElementById('reorderPopupOverlay')) {
            return;
        }

        const popupHTML = `
            <!-- Reorder Popup -->
            <div class="reorder-popup-overlay" id="reorderPopupOverlay">
                <div class="reorder-popup-modal" id="reorderPopupModal">
                    <!-- Header -->
                    <div class="reorder-popup-header">
                        <div class="reorder-popup-header-content">
                            <h2 class="reorder-popup-title">
                                <span class="reorder-popup-title-icon">🔄</span>
                                إعادة طلب سريعة
                            </h2>
                            <p class="reorder-popup-subtitle">يمكنك إعادة طلبك السابق أو بدء طلب جديد</p>
                        </div>
                        <button class="reorder-popup-close" id="reorderPopupClose" title="إغلاق">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <!-- Body -->
                    <div class="reorder-popup-body">
                        <!-- Customer Info -->
                        <div class="reorder-customer-info">
                            <div class="reorder-customer-info-item">
                                <span class="reorder-customer-info-icon">👤</span>
                                <span class="reorder-customer-info-label">العميل:</span>
                                <span class="reorder-customer-info-value" id="reorderCustomerName">-</span>
                            </div>
                            <div class="reorder-customer-info-item">
                                <span class="reorder-customer-info-icon">📅</span>
                                <span class="reorder-customer-info-label">آخر طلب:</span>
                                <span class="reorder-customer-info-value" id="reorderOrderDate">-</span>
                            </div>
                        </div>

                        <!-- Items List -->
                        <div class="reorder-order-items-title">
                            <span>🛒</span>
                            <span>محتوى الطلب السابق</span>
                        </div>
                        <div class="reorder-items-list" id="reorderItemsList">
                            <!-- Items will be added here -->
                        </div>

                        <!-- Order Summary -->
                        <div class="reorder-order-summary">
                            <div class="reorder-summary-row">
                                <span class="reorder-summary-label">السعر الأساسي:</span>
                                <span class="reorder-summary-value" id="reorderSubtotal">0.00 درهم</span>
                            </div>
                            <div class="reorder-summary-row">
                                <span class="reorder-summary-label">رسم التوصيل:</span>
                                <span class="reorder-summary-value" id="reorderDelivery">0.00 درهم</span>
                            </div>
                            <div class="reorder-summary-row total">
                                <span class="reorder-summary-label">الإجمالي:</span>
                                <span class="reorder-summary-value" id="reorderTotal">0.00 درهم</span>
                            </div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div style="padding: 24px; background: white; border-top: 1px solid #e0e0e0;">
                        <div class="reorder-popup-actions">
                            <button class="reorder-popup-btn reorder-popup-btn-reorder" id="reorderPopupBtnReorder">
                                <i class="fas fa-redo"></i>
                                إعادة الطلب
                            </button>
                            <button class="reorder-popup-btn reorder-popup-btn-new" id="reorderPopupBtnNew">
                                <i class="fas fa-plus"></i>
                                طلب جديد
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // أضف الـ Popup إلى نهاية الـ Body
        document.body.insertAdjacentHTML('beforeend', popupHTML);

        // ربط أحداث الأزرار
        this.attachEventListeners();
    }

    attachEventListeners() {
        const closeBtn = document.getElementById('reorderPopupClose');
        const reorderBtn = document.getElementById('reorderPopupBtnReorder');
        const newOrderBtn = document.getElementById('reorderPopupBtnNew');
        const overlay = document.getElementById('reorderPopupOverlay');

        // إغلاق الـ Popup عند الضغط على زر الإغلاق
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closePopup());
        }

        // إغلاق الـ Popup عند الضغط على الخلفية
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closePopup();
                }
            });
        }

        // إعادة الطلب السابق
        if (reorderBtn) {
            reorderBtn.addEventListener('click', () => this.reorderLastOrder());
        }

        // طلب جديد
        if (newOrderBtn) {
            newOrderBtn.addEventListener('click', () => this.newOrder());
        }
    }

    showPopup() {
        const overlay = document.getElementById('reorderPopupOverlay');
        if (!overlay) return;

        // عرض الـ Popup بشكل صريح
        overlay.style.display = 'flex';
        
        // ملء بيانات الـ Popup
        this.populatePopupData();

        // عرض الـ Popup باستخدام class
        setTimeout(() => {
            overlay.classList.add('active');
            console.log('%c✅ تم عرض الـ Popup', 'color: #27ae60');
        }, 10);

        // منع scroll الصفحة
        document.body.style.overflow = 'hidden';
    }

    closePopup() {
        const overlay = document.getElementById('reorderPopupOverlay');
        if (!overlay) return;

        overlay.classList.remove('active');
        console.log('%c🔚 تم إغلاق الـ Popup', 'color: #f39c12');

        // السماح ب scroll الصفحة
        document.body.style.overflow = 'auto';

        // تأكد من إزالة الخلفية
        overlay.style.display = 'none';
        
        // حفظ أن الـ Popup تم إغلاقه لهذه الجلسة
        sessionStorage.setItem('reorder_popup_closed', 'true');
    }

    populatePopupData() {
        if (!this.lastOrder) return;

        try {
            // معلومات العميل
            document.getElementById('reorderCustomerName').textContent = this.customerName || 'عميل جديد';

            // تاريخ الطلب
            const orderDate = new Date(this.lastOrder.orderDate);
            const formattedDate = orderDate.toLocaleDateString('ar-MA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            document.getElementById('reorderOrderDate').textContent = formattedDate;

            // عناصر الطلب
            this.populateItems();

            // ملخص الطلب
            document.getElementById('reorderSubtotal').textContent = `${this.lastOrder.subtotal.toFixed(2)} درهم`;
            document.getElementById('reorderDelivery').textContent = `${this.lastOrder.deliveryFee.toFixed(2)} درهم`;
            document.getElementById('reorderTotal').textContent = `${this.lastOrder.total.toFixed(2)} درهم`;

        } catch (error) {
            console.error('%c❌ خطأ في ملء بيانات الـ Popup:', 'color: #e74c3c', error);
        }
    }

    populateItems() {
        const itemsList = document.getElementById('reorderItemsList');
        if (!itemsList || !this.lastOrder || !this.lastOrder.items) return;

        itemsList.innerHTML = '';

        this.lastOrder.items.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'reorder-item';
            itemElement.style.animationDelay = `${index * 0.1}s`;

            const imageUrl = item.productImage || item.image || 'https://via.placeholder.com/60?text=Qoffa';

            itemElement.innerHTML = `
                <div class="reorder-item-image">
                    <img src="${imageUrl}" alt="${item.productName}" onerror="this.src='https://via.placeholder.com/60?text=Qoffa'">
                </div>
                <div class="reorder-item-info">
                    <div class="reorder-item-name">${item.productName}</div>
                    <div class="reorder-item-meta">${item.price.toFixed(2)} درهم × ${item.quantity} ${item.unit}</div>
                </div>
                <div class="reorder-item-qty">${item.quantity} ${item.unit}</div>
            `;

            itemsList.appendChild(itemElement);
        });
    }

    reorderLastOrder() {
        console.log('%c🔄 إعادة الطلب السابق - إرسال مباشر إلى Baserow', 'color: #27ae60; font-weight: bold');

        if (!this.lastOrder || !this.lastOrder.items) {
            this.showErrorToast('لا توجد عناصر في الطلب السابق');
            return;
        }
        
        // أغلق الـ Popup أولاً
        this.closePopupNow();

        try {
            // جمع معلومات الطلب والعميل
            const orderData = {
                customerName: this.customerName || 'عميل جديد',
                customerPhone: localStorage.getItem('qoffa_customer_phone') || '',
                customerAddress: localStorage.getItem('qoffa_customer_address') || '',
                items: this.lastOrder.items,
                subtotal: this.lastOrder.subtotal,
                deliveryFee: this.lastOrder.deliveryFee,
                total: this.lastOrder.total,
                orderDate: new Date().toISOString(),
                previousOrderDate: this.lastOrder.orderDate,
                isReorder: true
            };

            console.log('%c📤 إرسال بيانات الطلب إلى Baserow:', 'color: #3498db', orderData);

            // إرسال الطلب مباشرة إلى Baserow
            this.sendOrderToBaserow(orderData);

            // عرض رسالة نجاح
            this.showSuccessToast(`✅ تم إرسال طلب إعادة الطلب! سننتظر تأكيدك عبر WhatsApp`);

            // انتقل إلى صفحة المنتجات بعد 2 ثانية
            setTimeout(() => {
                window.location.href = '/products/';
            }, 2000);

        } catch (error) {
            console.error('%c❌ خطأ في إعادة الطلب:', 'color: #e74c3c', error);
            this.showErrorToast('حدث خطأ في إرسال الطلب. حاول مرة أخرى.');
        }
    }

    // دالة إرسال الطلب إلى Baserow
    async sendOrderToBaserow(orderData) {
        try {
            // حول عناصر الطلب إلى نص منسق
            const itemsText = orderData.items.map(item => 
                `${item.productName} × ${item.quantity} ${item.unit} = ${(item.price * item.quantity).toFixed(2)} درهم`
            ).join('\n');

            // بيانات الطلب المراد إرسالها إلى Baserow
            const baserowPayload = {
                'Customer Name': orderData.customerName,
                'Customer Phone': orderData.customerPhone,
                'Customer Address': orderData.customerAddress,
                'Order Items': itemsText,
                'Order Total': orderData.total,
                'Order Type': 'إعادة طلب (Reorder)',
                'Order Date': new Date().toLocaleString('ar-MA'),
                'Previous Order Date': orderData.previousOrderDate,
                'Notes': 'هذا طلب إعادة من عميل سابق',
                'Status': 'جديد'
            };

            console.log('%c📋 بيانات Baserow:', 'color: #9b59b6', baserowPayload);

            // جرب استخدام Baserow API إذا كان متاحاً
            // (استبدل YOUR_TABLE_ID بـ ID الجدول الفعلي)
            const baserowTableId = window.BASEROW_TABLE_ID || 'your_table_id';
            const baserowToken = window.BASEROW_API_TOKEN || '';

            if (baserowToken && baserowTableId !== 'your_table_id') {
                const response = await fetch(
                    `https://api.baserow.io/api/database/rows/table/${baserowTableId}/`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Token ${baserowToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(baserowPayload)
                    }
                );

                if (response.ok) {
                    console.log('%c✅ تم حفظ الطلب في Baserow بنجاح', 'color: #27ae60');
                    return true;
                } else {
                    console.warn('%c⚠️ استجابة Baserow:', 'color: #f39c12', response.status);
                }
            }

            // إذا فشل Baserow، احفظ الطلب محلياً
            this.saveReorderLocally(orderData);
            return false;

        } catch (error) {
            console.error('%c❌ خطأ في إرسال الطلب إلى Baserow:', 'color: #e74c3c', error);
            // احفظ الطلب محلياً كنسخة احتياطية
            this.saveReorderLocally(orderData);
        }
    }

    // حفظ الطلب محلياً
    saveReorderLocally(orderData) {
        try {
            const reorders = JSON.parse(localStorage.getItem('qoffa_reorders') || '[]');
            reorders.push({
                ...orderData,
                savedAt: new Date().toISOString(),
                synced: false
            });

            localStorage.setItem('qoffa_reorders', JSON.stringify(reorders));
            console.log('%c💾 تم حفظ الطلب محلياً:', 'color: #f39c12', reorders);
        } catch (error) {
            console.error('%c❌ خطأ في حفظ الطلب محلياً:', 'color: #e74c3c', error);
        }
    }

    newOrder() {
        console.log('%c➕ طلب جديد', 'color: #3498db; font-weight: bold');

        // أغلق الـ Popup بسرعة
        this.closePopupNow();

        // انتقل إلى صفحة المنتجات
        setTimeout(() => {
            window.location.href = '/products/';
        }, 300);
    }
    
    closePopupNow() {
        const overlay = document.getElementById('reorderPopupOverlay');
        if (!overlay) return;
        
        overlay.classList.remove('active');
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
        sessionStorage.setItem('reorder_popup_closed', 'true');
        console.log('%c🔚 تم إغلاق الـ Popup فوراً', 'color: #f39c12');
    }

    showSuccessToast(message) {
        this.showToast(message, 'success');
    }

    showErrorToast(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        // استخدم نظام Toast الموجود إذا كان متاحاً
        if (window.showToast) {
            window.showToast(message, type);
            return;
        }

        // وإلا أنشئ toast بسيط
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            font-weight: 600;
            animation: slideInUp 0.3s ease;
        `;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// ===== بدء النظام =====
// تأكد من أن النظام يبدأ فقط مرة واحدة
if (!window.reorderPopupSystem) {
    window.reorderPopupSystem = new ReorderPopupSystem();
}

console.log('%c✨ نظام إعادة الطلب (Reorder Popup) جاهز!', 'color: #27ae60; font-weight: bold; font-size: 16px');
