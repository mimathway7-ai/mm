// ==================== ORDER PAGE SPECIFIC FUNCTIONS ====================

// Baserow Configuration
const BASEROW_CONFIG = {
    token: 'OIEan8aAjLjoCoTXKO6Evd4cifbtqRf8',
    ordersTableId: '852045',
    soldProductsTableId: '852927',
    baseUrl: 'https://api.baserow.io/api/database/rows/table/'
};

// Field Names for Orders Table (mapped to Baserow)
const ORDER_FIELDS = {
    fullName: 'الاسم الكامل',
    phone: 'رقم الهاتف',
    address: 'العنوان',
    neighborhood: 'الحي',
    deliveryTime: 'وقت التوصيل المقترح',
    products: 'تفاصيل المنتجات',
    subtotal: 'المجموع الفرعي',
    deliveryFee: 'رسوم التوصيل',
    total: 'المجموع الكلي',
    cartTotal: 'إجمالي السعر',
    date: 'تاريخ الطلب',
    status: 'حالة الطلب',
    notes: 'ملاحظات',
    utc: 'UTC'
};

// Field Names for Sold Products Table
const SOLD_FIELDS = {
    productName: 'اسم المنتج',
    quantity: 'الكمية',
    unit: 'الوحدة',
    price: 'السعر',
    saleDate: 'تاريخ البيع',
    orderRef: 'رقم الطلب',
    clientId: 'معرف العميل'
};

// Get or create unique client ID
function getClientId() {
    let clientId = localStorage.getItem('qoffaClientId');
    if (!clientId) {
        clientId = 'CLIENT_' + Date.now().toString(36).toUpperCase() + 
                  Math.random().toString(36).substring(2, 10).toUpperCase();
        localStorage.setItem('qoffaClientId', clientId);
    }
    return clientId;
}

// Save last order for reorder popup
function saveLastOrder(cart, orderInfo = {}) {
    if (!cart || cart.length === 0) return;
    
    try {
        const lastOrder = {
            items: cart.map(item => ({
                id: item.id,
                productId: item.id,
                productName: item.name,
                productImage: item.image, // Save the image URL
                price: item.price,
                quantity: item.quantity,
                unit: item.unit || 'كجم',
                category: item.category || ''
            })),
            orderDate: new Date().toISOString(),
            subtotal: calculateSubtotal(cart),
            deliveryFee: calculateSubtotal(cart) >= 200 ? 0 : 20,
            total: calculateSubtotal(cart) + (calculateSubtotal(cart) >= 200 ? 0 : 20),
            totalPrice: calculateCartTotal ? calculateCartTotal() : 0
        };
        
        localStorage.setItem('qoffa_last_order', JSON.stringify(lastOrder));
        localStorage.setItem('qoffa_customer_name', orderInfo.customerName || 'عميل جديد');
        
        console.log('%c✅ تم حفظ الطلب السابق', 'color: #27ae60', lastOrder);
    } catch (error) {
        console.error('%c❌ خطأ في حفظ الطلب:', 'color: #e74c3c', error);
    }
}

// Helper function to calculate subtotal
function calculateSubtotal(cart) {
    if (!cart) return 0;
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Save order to Baserow
async function saveOrderToBaserow(orderData) {
    const url = `${BASEROW_CONFIG.baseUrl}${BASEROW_CONFIG.ordersTableId}/?user_field_names=true`;
    
    // Format date as dd/mm/yyyy
    const orderDate = new Date();
    const day = String(orderDate.getDate()).padStart(2, '0');
    const month = String(orderDate.getMonth() + 1).padStart(2, '0');
    const year = orderDate.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;
    
    const dataToSend = {
        [ORDER_FIELDS.fullName]: orderData.fullName,
        [ORDER_FIELDS.phone]: orderData.phone || '',
        [ORDER_FIELDS.address]: orderData.address,
        [ORDER_FIELDS.neighborhood]: orderData.neighborhood,
        [ORDER_FIELDS.deliveryTime]: orderData.deliveryTime,
        [ORDER_FIELDS.products]: orderData.productsDetails,
        [ORDER_FIELDS.subtotal]: orderData.subtotal,
        [ORDER_FIELDS.deliveryFee]: orderData.deliveryFee,
        [ORDER_FIELDS.total]: orderData.total,
        [ORDER_FIELDS.weight]: orderData.weight,
        [ORDER_FIELDS.date]: formattedDate,
        [ORDER_FIELDS.utc]: new Date().toISOString(),
        [ORDER_FIELDS.status]: 'جديد',
        [ORDER_FIELDS.notes]: orderData.notes || ''
    };
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${BASEROW_CONFIG.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        });
        
        if (response.ok) {
            const data = await response.json();
            return { success: true, orderId: data.id };
        } else {
            const error = await response.text();
            console.error('Baserow error:', error);
            return { success: false, error };
        }
    } catch (error) {
        console.error('Error saving order:', error);
        return { success: false, error: error.message };
    }
}

// Add sold products to tracking table
async function addToSoldProductsTable(cartItems, orderReference) {
    if (!cartItems || cartItems.length === 0) return { success: false, successCount: 0 };
    
    const today = new Date().toISOString().split('T')[0];
    const clientId = getClientId();
    let successCount = 0;
    let errorCount = 0;
    
    for (const item of cartItems) {
        const productData = {
            [SOLD_FIELDS.productName]: item.name_fr || item.name || 'منتج',
            [SOLD_FIELDS.quantity]: item.quantity || 1,
            [SOLD_FIELDS.unit]: item.unit || 'وحدة',
            [SOLD_FIELDS.price]: item.price || 0,
            [SOLD_FIELDS.saleDate]: today,
            [SOLD_FIELDS.orderRef]: orderReference,
            [SOLD_FIELDS.clientId]: clientId
        };
        
        try {
            const url = `${BASEROW_CONFIG.baseUrl}${BASEROW_CONFIG.soldProductsTableId}/?user_field_names=true`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${BASEROW_CONFIG.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
            
            if (response.ok) {
                successCount++;
            } else {
                errorCount++;
            }
        } catch (error) {
            errorCount++;
        }
    }
    
    return { success: successCount > 0, successCount, errorCount };
}

// Save delivery info to localStorage
function saveDeliveryInfo() {
    const deliveryInfo = {
        fullName: document.getElementById('fullName')?.value.trim() || '',
        phone: document.getElementById('phone')?.value.trim() || '',
        address: document.getElementById('address')?.value.trim() || '',
        neighborhood: document.getElementById('neighborhood')?.value || '',
        deliveryTime: document.getElementById('deliveryTime')?.value || ''
    };
    localStorage.setItem('qoffaDeliveryInfo', JSON.stringify(deliveryInfo));
}

// Load delivery info from localStorage
function loadDeliveryInfo() {
    const saved = localStorage.getItem('qoffaDeliveryInfo');
    if (saved) {
        try {
            const deliveryInfo = JSON.parse(saved);
            if (deliveryInfo.fullName) document.getElementById('fullName').value = deliveryInfo.fullName;
            if (deliveryInfo.phone) document.getElementById('phone').value = deliveryInfo.phone;
            if (deliveryInfo.address) document.getElementById('address').value = deliveryInfo.address;
            if (deliveryInfo.neighborhood) document.getElementById('neighborhood').value = deliveryInfo.neighborhood;
            if (deliveryInfo.deliveryTime) document.getElementById('deliveryTime').value = deliveryInfo.deliveryTime;
        } catch (e) {}
    }
}

// Render order summary
function updateOrderDisplay() {
    const container = document.getElementById('orderItemsContainer');
    const footer = document.getElementById('orderSummaryFooter');
    
    if (!container) return;
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="order-empty">
                <div class="order-empty-icon"><i class="fas fa-shopping-cart"></i></div>
                <h3>سلة التسوق فارغة</h3>
                <p>أضف بعض المنتجات إلى سلتك أولاً</p>
                <a href="/products/" class="btn btn-primary"><i class="fas fa-store"></i> تصفح المنتجات</a>
            </div>
        `;
        if (footer) footer.style.display = 'none';
        return;
    }
    
    if (footer) footer.style.display = 'block';
    
    let html = '';
    let subtotal = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * (item.quantity || 1);
        subtotal += itemTotal;
        
        let quantityDisplay;
        if (item.unit === 'كيلو' || item.unit === 'kg') {
            quantityDisplay = item.quantity.toFixed(1) + ' كجم';
        } else {
            quantityDisplay = item.quantity + ' ' + (item.unit || 'وحدة');
        }
        
        html += `
            <div class="order-item">
                <div class="order-item-img">
                    <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/100x100?text=Qoffa'">
                </div>
                <div class="order-item-details">
                    <h4 class="order-item-name">${item.name_fr || item.name}</h4>
                    <p class="order-item-name-ar">${item.name || ''}</p>
                    <div class="order-item-price">${item.price} درهم</div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
                        <span class="order-item-subtotal">الكمية: ${quantityDisplay}</span>
                        <span class="order-item-subtotal">المجموع: ${itemTotal.toFixed(2)} درهم</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    const delivery = subtotal >= 200 ? 0 : 20;
    document.getElementById('subtotalAmount').textContent = subtotal.toFixed(2) + ' درهم';
    document.getElementById('deliveryAmount').textContent = delivery + ' درهم';
    document.getElementById('totalAmount').textContent = (subtotal + delivery).toFixed(2) + ' درهم';
}

// Render suggested products
function renderSuggestedProducts() {
    const container = document.getElementById('suggestedProductsGrid');
    if (!container) return;
    
    // استخدام دالة getRecommendedProducts من main.js للحصول على المنتجات المقترحة
    if (typeof getRecommendedProducts === 'function') {
        const recommended = getRecommendedProducts(6);
        
        if (recommended.length === 0) {
            container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 50px;">لا توجد منتجات مقترحة</p>';
            return;
        }
        
        // استخدام renderProductCard من main.js للحصول على تنسيق موحد
        container.innerHTML = recommended.map(product => {
            if (typeof renderProductCard === 'function') {
                return renderProductCard(product);
            }
        }).join('');
        
        // تحديث الرسوم المتحركة
        if (typeof AOS !== 'undefined') {
            AOS.refresh();
        }
    }
}

window.renderSuggestedProducts = renderSuggestedProducts;

// Calculate total price
function calculateCartTotal() {
    return cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
}

// Update price total indicator
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
        }
    } else {
        if (totalText) totalText.style.color = '#dc3545';
        if (minOrderMsg) minOrderMsg.style.display = 'block';
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
            checkoutBtn.style.opacity = '0.5';
        }
    }
}

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const searchOverlay = document.getElementById('searchOverlay');
    const allProducts = window.allProducts || [];
    
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (query.length < 2) {
            searchResults.innerHTML = '';
            return;
        }
        
        const results = allProducts.filter(product => 
            (product.name && product.name.toLowerCase().includes(query)) || 
            (product.name_fr && product.name_fr.toLowerCase().includes(query))
        ).slice(0, 6);
        
        if (results.length === 0) {
            searchResults.innerHTML = '<div style="text-align: center; padding: 20px;">لا توجد نتائج</div>';
            return;
        }
        
        let html = '';
        results.forEach(product => {
            html += `
                <div class="search-result-item" onclick="addToCart(${product.id}); searchOverlay.classList.remove('active');">
                    <img src="${product.image}" alt="${product.name}" class="search-result-img" onerror="this.src='https://via.placeholder.com/60x60?text=Qoffa'">
                    <div>
                        <div style="font-weight: 700;">${product.name_fr}</div>
                        <div style="font-size: 0.85rem; color: var(--text-light);">${product.name}</div>
                        <div style="color: var(--primary); font-weight: 700;">${product.price} درهم</div>
                    </div>
                </div>
            `;
        });
        
        searchResults.innerHTML = html;
    });
}

// Initialize order page
function initOrderPage() {
    // Load delivery info
    loadDeliveryInfo();
    
    // Update displays
    updateOrderDisplay();
    renderSuggestedProducts();
    updateCartTotalIndicator();
    
    // Setup search
    setupSearch();
    
    // Save delivery info on input changes
    const formFields = ['fullName', 'phone', 'address', 'neighborhood', 'deliveryTime'];
    formFields.forEach(field => {
        const element = document.getElementById(field);
        if (element) {
            element.addEventListener('input', saveDeliveryInfo);
            if (field === 'neighborhood' || field === 'deliveryTime') {
                element.addEventListener('change', saveDeliveryInfo);
            }
        }
    });
    
    // Form submission
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Validate cart
            if (cart.length === 0) {
                showToast('❌ السلة فارغة! أضف منتجات قبل إرسال الطلب', 'error');
                return;
            }
            
            // Validate total price
            const cartTotal = calculateCartTotal();
            if (cartTotal < 150) {
                showToast(`⚠️ المجموع الإجمالي ${cartTotal.toFixed(2)} درهم - الحد الأدنى للطلب 150 درهم`, 'warning');
                return;
            }
            
            // Get form values
            const fullName = document.getElementById('fullName').value.trim();
            const phone = document.getElementById('phone').value.trim() || '';
            const address = document.getElementById('address').value.trim();
            const neighborhood = document.getElementById('neighborhood').value;
            const deliveryTime = document.getElementById('deliveryTime').value;
            const notes = document.getElementById('notes').value.trim() || '';
            
            // Validate required fields
            if (!fullName) { showToast('❌ الرجاء إدخال الاسم الكامل', 'error'); return; }
            if (!address) { showToast('❌ الرجاء إدخال العنوان', 'error'); return; }
            if (!neighborhood) { showToast('❌ الرجاء اختيار الحي', 'error'); return; }
            if (!deliveryTime) { showToast('❌ الرجاء اختيار وقت التوصيل', 'error'); return; }
            
            // Calculate totals
            let subtotal = 0;
            let productsDetails = '';
            
            cart.forEach((item, index) => {
                const itemTotal = item.price * (item.quantity || 1);
                subtotal += itemTotal;
                
                // توحيد اسم الوحدة
                let unit = item.unit || 'كجم';
                if (unit === 'kg' || unit === 'كيلو') {
                    unit = 'كجم';
                } else if (unit === 'piece' || unit === 'وحدة' || unit === 'pieces') {
                    unit = 'وحدة';
                } else if (unit === 'bunch' || unit === 'حزمة' || unit === 'bunches') {
                    unit = 'حزمة';
                }
                
                // تنسيق الكمية: عشري للكجم، صحيح لباقي الوحدات
                let quantityDisplay;
                if (unit === 'كجم') {
                    quantityDisplay = (item.quantity || 1).toFixed(1);
                } else {
                    quantityDisplay = Math.floor(item.quantity || 1);
                }
                
                // التنسيق الموحد: 🔸 اسم المنتج - الكمية الوحدة - السعر درهم
                productsDetails += `\n🔸 ${item.name_fr || item.name} - ${quantityDisplay} ${unit} - ${item.price} درهم`;
            });
            
            const deliveryFee = subtotal >= 200 ? 0 : 20;
            const finalTotal = subtotal + deliveryFee;
            
            // Show loader
            const loader = document.getElementById('loader');
            if (loader) loader.classList.add('active');
            
            // Prepare order data
            const orderData = {
                fullName,
                phone,
                address,
                neighborhood,
                deliveryTime,
                notes,
                productsDetails: productsDetails.trim(),
                subtotal: subtotal,
                deliveryFee: deliveryFee,
                total: finalTotal,
                weight: totalWeight
            };
            
            // Save to Baserow
            const result = await saveOrderToBaserow(orderData);
            
            // If order saved successfully, add to sold products
            if (result.success) {
                await addToSoldProductsTable(cart, result.orderId);
            }
            
            // Save last order for reorder popup (if saveLastOrder function exists)
            if (typeof saveLastOrder === 'function') {
                saveLastOrder(cart, {
                    customerName: fullName
                });
            }
            
            // Hide loader
            if (loader) loader.classList.remove('active');
            
            // Show success message
            if (result.success) {
                showToast(`✅ تم إرسال الطلب #${result.orderId} بنجاح`, 'success');
            } else {
                showToast('✅ تم إرسال الطلب بنجاح', 'success');
            }
            
            // Clear cart and update UI
            cart = [];
            localStorage.setItem('qoffaCart', JSON.stringify(cart));
            updateCartCount();
            updateOrderDisplay();
            updateCartTotalIndicator();
            renderSuggestedProducts(); // تحديث المنتجات المقترحة
            
            // Close cart sidebar if open
            const cartSidebar = document.getElementById('cartSidebar');
            if (cartSidebar) cartSidebar.classList.remove('active');
            
            // Optionally redirect or reset form
            document.getElementById('orderForm').reset();
            loadDeliveryInfo(); // Reload saved info if any
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initOrderPage();
});

// Make functions available globally
window.addToCart = addToCart;
window.toggleCart = toggleCart;
window.clearCart = clearCart;
window.removeFromCart = removeFromCart;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.updateCartTotalIndicator = updateCartTotalIndicator;
window.calculateCartTotal = calculateCartTotal;