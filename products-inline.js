
// Inline script 1

    (function(){
        const path = (location.pathname.split('/').pop() || '/').toLowerCase();
        document.querySelectorAll('#navMenu .nav-link').forEach(a=>a.classList.remove('active'));
        if (path === '/' || path === '') {
            document.querySelector('#navMenu .nav-link[href="/"]')?.classList.add('active');
        } else if (path === '/products/') {
            document.querySelector('#navMenu .nav-link[href="/products/"]')?.classList.add('active');
        } else if (path === '/order/') {
            document.querySelector('#navMenu .nav-link[href="/order/"]')?.classList.add('active');
        }
    })();



// Inline script 4

        // ==================== CONFIGURATION ====================
        const BASEROW_TOKEN = 'OIEan8aAjLjoCoTXKO6Evd4cifbtqRf8';
        const BASEROW_TABLE_ID = '882093';
        const BASEROW_URL = `https://api.baserow.io/api/database/rows/table/${BASEROW_TABLE_ID}/?user_field_names=true&size=200`;

        // ==================== SUBCATEGORY MAPPING ====================
        const SUBCATEGORY_MAP = {
            "خضروات": ["الكل", "ورقية", "جذرية", "ثمرية"],
            "فواكه": ["الكل", "محلية", "مستوردة", "موسمية"],
            "أعشاب": ["الكل", "أعشاب", "عطرية", "سلطات"],
            "باقات": ["الكل", "عائلية", "يومية", "هدايا"]
        };

        // ==================== IMAGE OPTIMIZATION ====================
        function getOptimizedImage(url, options = {}) {
            if (!url || url.includes('undefined') || url.includes('null')) return 'https://via.placeholder.com/300/2E8B57/ffffff?text=Qoffa';
            if (url.includes('images.weserv.nl') || url.includes('assets/') || url.includes('placeholder')) return url;
            const width = options.width || 300;
            return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=${width}&q=80&output=webp&l=9`;
        }

        function handleImageError(img) {
            const name = img.alt || 'Qoffa';
            img.src = `https://via.placeholder.com/300/2E8B57/ffffff?text=${encodeURIComponent(name.substring(0, 10))}`;
            img.onerror = null;
        }

        // ==================== GLOBAL VARIABLES ====================
        let allProducts = { fruits: [], vegetables: [], herbs: [], bundles: [] };
        let cart = JSON.parse(localStorage.getItem('qoffaCart')) || [];
        let pendingDeleteId = null;
        let preventCartClose = false;
        let variableWeightState = { products: [], selectedWeights: {} };
        const filterConfig = { fruits: [], vegetables: [], herbs: [], bundles: [] };
        let activeFilters = { fruits: 'الكل', vegetables: 'الكل', herbs: 'الكل', bundles: 'الكل' };

        // ⏰ Variable Weight Safety Timer
        const VW_SAFETY_TIMEOUT = 30 * 60 * 1000;
        const VW_CHECK_INTERVAL = 60 * 1000;
        let vwSafetyTimer = null;
        let vwExitConfirmed = false;

        // ==================== HELPERS ====================
        function showLoader(show = true) { const loader = document.getElementById('loader'); if (loader) loader.classList.toggle('active', show); }
        function showToast(message, type = 'success') { const container = document.getElementById('toastContainer'); if (!container) return; const existingToast = container.querySelector('.toast'); if (existingToast) existingToast.remove(); const toast = document.createElement('div'); toast.className = `toast ${type}`; toast.innerHTML = `<span>${message}</span>`; container.appendChild(toast); setTimeout(() => toast.remove(), 3000); }
        function isVariableWeightItem(item) { return item && item.isVariableWeight === true; }

        // ==================== BASEROW SYNC ====================
        function vwParseWeights(rawWeights) { if (!rawWeights) return []; if (typeof rawWeights === 'string') { try { const p = JSON.parse(rawWeights.replace(/\\/g, '')); return Array.isArray(p) ? p.map(w => parseFloat(w)).filter(w => !isNaN(w) && w > 0) : []; } catch (e) { return rawWeights.split(',').map(w => parseFloat(w.trim())).filter(w => !isNaN(w) && w > 0); } } if (Array.isArray(rawWeights)) return rawWeights.map(w => parseFloat(w)).filter(w => !isNaN(w) && w > 0); return []; }

        async function vwSyncWithBaserow(productId, weight, action) {
            const label = action === 'remove' ? '🔒 حجز' : '🔓 إرجاع';
            try {
                const fetchUrl = `https://api.baserow.io/api/database/rows/table/${BASEROW_TABLE_ID}/${productId}/?user_field_names=true`;
                console.log(`🔍 جلب البيانات من Baserow للمنتج ${productId}...`);
                const response = await fetch(fetchUrl, { headers: { 'Authorization': `Token ${BASEROW_TOKEN}` } });
                if (!response.ok) {
                    console.error(`❌ vwSyncWithBaserow: فشل جلب البيانات - ${response.status}`);
                    return false;
                }
                const row = await response.json();
                console.log(`✅ البيانات المستلمة من Baserow:`, row);
                console.log(`📊 القيمة الحالية لـ available_weights:`, row.available_weights, `(النوع: ${typeof row.available_weights})`);
                
                let weights = vwParseWeights(row.available_weights);
                console.log(`📦 الأوزان الحالية بعد التحليل:`, weights);
                
                const parsedWeight = parseFloat(weight);
                
                if (action === 'remove') {
                    const idx = weights.findIndex(w => {
                        const pw = parseFloat(w);
                        return Math.abs(pw - parsedWeight) < 0.01;
                    });
                    if (idx !== -1) {
                        weights.splice(idx, 1);
                        console.log(`✅ تم حجز الوزن: ${parsedWeight} كجم (الفهرس: ${idx})`);
                    } else {
                        console.warn(`⚠️ الوزن ${parsedWeight} ليس موجوداً في available_weights:`, weights);
                        return false;
                    }
                } else {
                    weights.push(parsedWeight);
                    weights.sort((a, b) => a - b);
                    console.log(`✅ تم إرجاع الوزن: ${parsedWeight} كجم`);
                }
                
                console.log(`📝 الأوزان الجديدة قبل الحفظ:`, weights);
                
                // Test: try sending as array directly instead of JSON string
                const weightArrayJson = JSON.stringify(weights);
                console.log(`📤 JSON المراد إرساله:`, weightArrayJson);
                
                const patchBody = { available_weights: weightArrayJson };
                console.log(`📤 الجسم الكامل للـ PATCH:`, JSON.stringify(patchBody, null, 2));
                
                // Try with user_field_names=true to ensure the field name is correct
                const patchUrl = `https://api.baserow.io/api/database/rows/table/${BASEROW_TABLE_ID}/${productId}/?user_field_names=true`;
                console.log(`📤 محاولة إرسال الطلب إلى:`, patchUrl);
                
                const patchResponse = await fetch(patchUrl, { 
                    method: 'PATCH', 
                    headers: { 
                        'Authorization': `Token ${BASEROW_TOKEN}`, 
                        'Content-Type': 'application/json' 
                    }, 
                    body: JSON.stringify(patchBody)
                });
                
                console.log(`📊 حالة الرد: ${patchResponse.status} ${patchResponse.statusText}`);
                
                const patchDataText = await patchResponse.text();
                console.log(`📥 نص الرد الخام (الطول: ${patchDataText.length}):`, patchDataText);
                
                let patchData = {};
                try {
                    patchData = JSON.parse(patchDataText);
                    console.log(`📥 البيانات المرجعة المحللة:`, patchData);
                    
                    // CRITICAL: Verify what was actually saved
                    if (patchData.available_weights) {
                        console.log(`🔍 التحقق: القيمة المحفوظة في Baserow:`, patchData.available_weights);
                        const savedWeights = vwParseWeights(patchData.available_weights);
                        console.log(`🔍 الأوزان المحفوظة بعد التحليل:`, savedWeights);
                        
                        if (JSON.stringify(savedWeights.sort((a,b)=>a-b)) !== JSON.stringify(weights.sort((a,b)=>a-b))) {
                            console.error(`❌ عدم تطابق! المتوقع:`, weights, `الفعلي:`, savedWeights);
                        } else {
                            console.log(`✅ التحقق نجح: البيانات متطابقة!`);
                        }
                    }
                } catch (e) {
                    console.error(`❌ فشل تحليل رد Baserow:`, e);
                    console.error(`❌ النص الخام كان:`, patchDataText);
                }
                
                if (!patchResponse.ok) {
                    console.error(`❌ vwSyncWithBaserow: فشل تحديث Baserow - ${patchResponse.status}`);
                    console.error(`❌ تفاصيل الخطأ:`, patchData);
                    return false;
                }
                
                // VERIFY: Re-fetch the product to confirm the update was saved
                console.log(`🔄 إعادة جلب البيانات للتحقق من الحفظ...`);
                const verifyResponse = await fetch(fetchUrl, { headers: { 'Authorization': `Token ${BASEROW_TOKEN}` } });
                if (verifyResponse.ok) {
                    const verifyRow = await verifyResponse.json();
                    const verifyWeights = vwParseWeights(verifyRow.available_weights);
                    console.log(`🔍 التحقق النهائي - الأوزان في Baserow الآن:`, verifyWeights);
                    
                    if (JSON.stringify(verifyWeights.sort((a,b)=>a-b)) === JSON.stringify(weights.sort((a,b)=>a-b))) {
                        console.log(`✅✅✅ تم التحقق: التحديث نجح بنجاح!`);
                    } else {
                        console.error(`❌❌❌ التحديث فشل! Baserow لم يحفظ التغييرات`);
                        console.error(`المتوقع:`, weights.sort((a,b)=>a-b));
                        console.error(`الفعلي:`, verifyWeights.sort((a,b)=>a-b));
                    }
                }
                
                console.log(`✅ vwSyncWithBaserow: تم ${label} بنجاح`);
                console.log(`✅ الأوزان الجديدة: ${weights.join(', ')}`);
                return true;
            } catch (e) {
                console.error(`❌ vwSyncWithBaserow خطأ:`, e.message);
                console.error(`❌ التفاصيل الكاملة:`, e);
                return false;
            }
        }

        async function vwReturnWeightToBaserow(cartItem) { 
            if (!cartItem?.isVariableWeight) return true; 
            if (!cartItem.baseId || !cartItem.weight) {
                console.warn('⚠️ معلومات الوزن ناقصة:', cartItem);
                return true;
            }
            console.log(`🔄 محاولة إرجاع الوزن: ${cartItem.weight} للمنتج ${cartItem.baseId}`);
            return await vwSyncWithBaserow(cartItem.baseId, cartItem.weight, 'add'); 
        }

        // ==================== EXIT POPUP ====================
        function vwShowExitPopup() {
            const currentCart = JSON.parse(localStorage.getItem('qoffaCart')) || [];
            const vwItems = currentCart.filter(item => item.isVariableWeight);
            if (vwItems.length === 0 || vwExitConfirmed) return false;
            vwExitConfirmed = false;
            const overlay = document.createElement('div'); overlay.id = 'vwExitOverlay'; overlay.className = 'vw-exit-overlay';
            const itemsList = vwItems.map(item => `<div class="vw-exit-item">🍉 ${item.name_fr || item.name} - ${item.weight}${item.unit || 'كجم'}</div>`).join('');
            overlay.innerHTML = `<div class="vw-exit-popup"><div class="vw-exit-icon">⚖️</div><h3>لديك منتجات محجوزة في السلة</h3><div class="vw-exit-items">${itemsList}</div><p class="vw-exit-note">💡 إذا لم تختر شيئاً، ستعود تلقائياً بعد 30 دقيقة</p><div class="vw-exit-actions"><button class="vw-exit-btn vw-exit-return" id="vwExitReturn">🗑️ إرجاع للمخزون</button><button class="vw-exit-btn vw-exit-keep" id="vwExitKeep">✅ إبقاء محجوزة</button><button class="vw-exit-btn vw-exit-cancel" id="vwExitCancel">❌ إلغاء</button></div></div>`;
            document.body.appendChild(overlay);
            return new Promise((resolve) => {
                document.getElementById('vwExitReturn').addEventListener('click', async () => { vwExitConfirmed = true; await vwReturnAllWeights(); overlay.remove(); resolve('return'); });
                document.getElementById('vwExitKeep').addEventListener('click', () => { vwExitConfirmed = true; localStorage.setItem('vw_left_at', Date.now().toString()); overlay.remove(); resolve('keep'); });
                document.getElementById('vwExitCancel').addEventListener('click', () => { overlay.remove(); resolve('cancel'); });
            });
        }

        async function vwReturnAllWeights() {
            const currentCart = JSON.parse(localStorage.getItem('qoffaCart')) || [];
            const vwItems = currentCart.filter(item => item.isVariableWeight);
            if (vwItems.length === 0) {
                console.log('✅ لا توجد منتجات متغيرة الوزن للإرجاع');
                return { success: true, count: 0 };
            }
            
            console.log(`🔄 محاولة إرجاع ${vwItems.length} منتجات متغيرة الوزن`);
            let returned = 0;
            
            for (const item of vwItems) { 
                if (await vwSyncWithBaserow(item.baseId, item.weight, 'add')) { 
                    const idx = currentCart.findIndex(i => i.id === item.id); 
                    if (idx !== -1) currentCart.splice(idx, 1); 
                    returned++; 
                } else {
                    console.warn(`⚠️ فشل إرجاع الوزن ${item.weight} للمنتج ${item.baseId}`);
                }
            }
            
            if (returned > 0) { 
                localStorage.setItem('qoffaCart', JSON.stringify(currentCart)); 
                cart = currentCart; 
                updateCartCount(); 
                updateCartSidebar(); 
                showToast(`✅ تم إرجاع ${returned} منتجات للمخزون`, 'success'); 
                console.log(`✅ تم إرجاع ${returned} منتجات بنجاح`);
            }
            return { success: true, count: returned };
        }

        function vwCheckSafetyTimeout() { const leftAt = localStorage.getItem('vw_left_at'); if (!leftAt) return; if (Date.now() - parseInt(leftAt) >= VW_SAFETY_TIMEOUT) { vwReturnAllWeights().then(() => { localStorage.removeItem('vw_left_at'); showToast('⏰ تم إرجاع المنتجات للمخزون (انتهت 30 دقيقة)', 'warning'); }); } }
        function vwStartSafetyTimer() { if (vwSafetyTimer) clearInterval(vwSafetyTimer); vwCheckSafetyTimeout(); vwSafetyTimer = setInterval(vwCheckSafetyTimeout, VW_CHECK_INTERVAL); }
        function vwStopSafetyTimer() { if (vwSafetyTimer) { clearInterval(vwSafetyTimer); vwSafetyTimer = null; } }

        // ==================== CONFIRMATION MODAL ====================
        function showConfirmationModal(productId, productName) { 
            console.log(`📋 عرض modal للحذف: ${productName}, ID: ${productId}`);
            
            pendingDeleteId = productId; 
            
            window.preventCartClose = true; 
            setTimeout(() => { window.preventCartClose = false; }, 1000); 
            
            const nameEl = document.getElementById('confirmProductName');
            if (nameEl) {
                nameEl.textContent = productName || 'المنتج';
            }
            
            const modal = document.getElementById('confirmationModal');
            if (modal) {
                modal.style.display = 'flex';
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }
        
        function cancelDelete() { 
            console.log(`❌ إلغاء الحذف`);
            pendingDeleteId = null;
            
            const modal = document.getElementById('confirmationModal');
            if (modal) {
                modal.classList.remove('active');
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }
            
            const cartSidebar = document.getElementById('cartSidebar'); 
            if (cartSidebar) cartSidebar.classList.add('active'); 
        }
        async function confirmProductDelete() { 
            if (!pendingDeleteId) return; 
            const deletedItem = cart.find(i => String(i.id) === String(pendingDeleteId)); 
            const itemName = deletedItem?.name_fr || deletedItem?.name || 'المنتج';
            
            console.log(`🗑️ محاولة حذف المنتج: ${itemName}`, deletedItem);
            
            // إذا كان منتج Variable Weight، إرجاع الوزن للمخزون
            if (deletedItem?.isVariableWeight) {
                console.log(`🔄 حذف منتج متغير الوزن: ${itemName} - الوزن: ${deletedItem.weight}`);

                // إعلام المستخدم بأن عملية الإرجاع جارية
                showToast(`⏳ جاري إرجاع ${itemName} للمخزون...`, 'info');

                const returnResult = await vwReturnWeightToBaserow(deletedItem);
                
                if (!returnResult) {
                    console.error(`❌ فشل إرجاع الوزن `);
                    showToast('⚠️ فشل إرجاع الوزن للمخزون. الرجاء المحاولة مرة أخرى', 'error');
                    const modal = document.getElementById('confirmationModal');
                    if (modal) {
                        modal.classList.remove('active');
                        modal.style.display = 'none';
                        document.body.style.overflow = '';
                    }
                    pendingDeleteId = null;
                    return;
                }
            }
            
            // حذف المنتج من السلة
            cart = cart.filter(i => String(i.id) !== String(pendingDeleteId)); 
            localStorage.setItem('qoffaCart', JSON.stringify(cart)); 
            
            // أغلق الـ modal
            const modal = document.getElementById('confirmationModal');
            if (modal) {
                modal.classList.remove('active');
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }
            
            pendingDeleteId = null; 
            
            // تحديث السلة
            updateCartCount(); 
            updateCartSidebar(); 
            
            // إبقاء السلة مفتوحة بعد الحذف (مثل /)
            const cartSidebar = document.getElementById('cartSidebar'); 
            if (cartSidebar && !cartSidebar.classList.contains('active')) {
                cartSidebar.classList.add('active');
            }
            // منع إغلاق السلة مؤقتاً بعد التحديث (لمنع handler النقر الخارجي من إغلاقها)
            window.preventCartClose = true;
            setTimeout(() => { window.preventCartClose = false; }, 1000);

            // عرض رسالة النجاح
            showToast(`✅ تم إزالة ${itemName} من السلة`, 'success'); 
        }

        // ==================== FETCH PRODUCTS ====================
        function getBaserowDisplayValue(value) {
            if (value === null || value === undefined) return '';
            if (typeof value === 'string') return value.trim();
            if (typeof value === 'number') return String(value);
            if (Array.isArray(value)) return getBaserowDisplayValue(value[0]);
            if (typeof value === 'object') {
                if (typeof value.value !== 'undefined') return getBaserowDisplayValue(value.value);
                if (typeof value.name !== 'undefined') return getBaserowDisplayValue(value.name);
                if (typeof value.label !== 'undefined') return getBaserowDisplayValue(value.label);
            }
            return '';
        }

        function getBaserowSingleSelectValue(value) {
            const raw = getBaserowDisplayValue(value);
            return raw.toLowerCase().trim();
        }

        async function fetchProducts() {
            showLoader(true);
            try {
                const response = await fetch(BASEROW_URL, { headers: { 'Authorization': `Token ${BASEROW_TOKEN}` } });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                allProducts = { fruits: [], vegetables: [], herbs: [], bundles: [] };
                const variableWeightProducts = [];
                function isBaserowRowVisible(row) {
                    const toStr = v => (typeof v === 'string' ? v.toLowerCase().trim() : v);
                    if (row === null || typeof row !== 'object') return true;
                    // hidden flag means do not show
                    if (row.hidden === true || row.hidden === 1 || toStr(row.hidden) === '1' || toStr(row.hidden) === 'true') return false;
                    // active / is_active boolean or numeric
                    if (row.active === false || row.active === 0 || toStr(row.active) === '0' || toStr(row.active) === 'false') return false;
                    if (row.is_active === false || row.is_active === 0 || toStr(row.is_active) === '0' || toStr(row.is_active) === 'false') return false;
                    return true;
                }

                data.results.forEach(product => {
                    if (!product.name) return;
                    if (!isBaserowRowVisible(product)) return; // skip hidden/inactive rows
                    const imageUrl = product.product_image?.[0]?.url || null;
                    const bundleDetailsUrl = product.bundle_details?.[0]?.url || null;
                    let subCategory = getBaserowDisplayValue(product.subcategory || product.sub_category);
                    if (!subCategory) { 
                        const name = product.name.toLowerCase(); 
                        const category = product.category?.toLowerCase() || ''; 
                        if (category === 'fruits') { 
                            if (name.includes('محلي') || name.includes('مغربي')) subCategory = 'محلية'; 
                            else if (name.includes('مستورد')) subCategory = 'مستوردة'; 
                            else subCategory = 'محلية'; 
                        } else if (category === 'vegetables') { 
                            if (name.includes('ورقي')) subCategory = 'ورقية'; 
                            else if (name.includes('جذر')) subCategory = 'جذرية'; 
                            else subCategory = 'جذرية'; 
                        } else if (category === 'herbs') { 
                            if (name.includes('ورقي') || name.includes('سلطة')) subCategory = 'سلطات'; 
                            else if (name.includes('عطري')) subCategory = 'عطرية'; 
                            else subCategory = 'أعشاب'; 
                        } else if (category === 'bundles') { 
                            if (name.includes('عائل')) subCategory = 'عائلية'; 
                            else if (name.includes('هدية') || name.includes('هدي')) subCategory = 'هدايا'; 
                            else subCategory = 'يومية'; 
                        } else subCategory = category || 'الكل'; 
                    }
                    const formattedProduct = { id: product.id, name: product.name || '', name_fr: product.name_fr || product.name || '', isNew: product.new === true || product.new === 1 || product.new === '1' || product.new === 'true', price: parseFloat(product.price) || 0, originalPrice: product.original_price ? parseFloat(product.original_price) : null, image: imageUrl ? getOptimizedImage(imageUrl, { width: 300 }) : 'https://via.placeholder.com/300/2E8B57/ffffff?text=Qoffa', imageOriginal: imageUrl, bundleDetailsImage: bundleDetailsUrl ? getOptimizedImage(bundleDetailsUrl, { width: 800 }) : null, category: product.category || '', sub_category: subCategory, unit: product.unit || product.Unit || '' };
                    const category = product.category?.toLowerCase() || '';
                    if (category === 'fruits') allProducts.fruits.push(formattedProduct);
                    else if (category === 'vegetables') allProducts.vegetables.push(formattedProduct);
                    else if (category === 'herbs') allProducts.herbs.push(formattedProduct);
                    else if (category === 'bundles') allProducts.bundles.push(formattedProduct);
                    if (product.is_variable_weight) { let weights = []; try { if (typeof product.available_weights === 'string') weights = JSON.parse(product.available_weights.replace(/\\/g, '')); else if (Array.isArray(product.available_weights)) weights = product.available_weights; } catch (e) { weights = []; } variableWeightProducts.push({ ...formattedProduct, weights: weights.filter(w => typeof w === 'number' && w > 0).sort((a, b) => a - b) }); }
                });
                allProducts.fruits = sortProductsByNew(allProducts.fruits);
                allProducts.vegetables = sortProductsByNew(allProducts.vegetables);
                allProducts.herbs = sortProductsByNew(allProducts.herbs);
                allProducts.bundles = sortProductsByNew(allProducts.bundles);
                let sortedVariableWeightProducts = sortProductsByNew(variableWeightProducts);
                buildFilterConfigFromData(); initializeFilters(); renderAllCategories(); initBundlesCarousel(); updateCartCount(); updateCartSidebar();
                const initialCategory = getCategoryFromUrl();
                if (initialCategory) {
                    // Don't scroll - just set active filter and render
                    activeFilters[initialCategory] = 'الكل';
                    renderCategory(initialCategory);
                    activateQuickLink(initialCategory);
                }
                if (sortedVariableWeightProducts.length > 0) { setTimeout(() => { renderVariableWeightCarousel(sortedVariableWeightProducts); document.getElementById('variableWeightCarouselSection').style.display = 'block'; }, 500); }
                // Fetch banners from Baserow after products are loaded
                if (typeof fetchBanners === 'function') {
                    await fetchBanners();
                }
            } catch (error) { console.error('حدث خطأ في تحميل المنتجات:', error); showToast('حدث خطأ في تحميل المنتجات', 'error'); } finally { showLoader(false); }
        }

        // ==================== VARIABLE WEIGHT FUNCTIONS ====================
        function sortProductsByNew(products) {
            if (!Array.isArray(products)) return [];
            return products.slice().sort((a, b) => {
                if (a.isNew === b.isNew) {
                    const aId = parseInt(a.id, 10) || 0;
                    const bId = parseInt(b.id, 10) || 0;
                    return aId - bId;
                }
                return a.isNew ? -1 : 1;
            });
        }

        function renderVariableWeightCarousel(products) {
            variableWeightState.products = products;
            const section = document.getElementById('variableWeightCarouselSection'), container = document.getElementById('variableWeightCards');
            if (!section || !container || products.length === 0) return;
            section.style.display = 'block';
            container.innerHTML = products.map(product => { const weights = product.weights || []; const stockCount = weights.length; const stockClass = stockCount === 0 ? 'out' : stockCount <= 3 ? 'low' : ''; return `<div class="vw-card" data-product-id="${product.id}" style="position: relative;">${product.isNew ? '<span class="new-badge">جديد</span>' : ''}<div class="vw-card-image"><img src="${product.image || 'https://via.placeholder.com/240'}" alt="${product.name_fr || 'Product'}" loading="lazy" onerror="this.src='https://via.placeholder.com/240/2E8B57/ffffff?text=Product'"><span class="vw-stock-badge ${stockClass}">${stockCount} قطع</span></div><div class="vw-card-body"><div class="vw-card-brand">QOFFA SMART</div><div class="vw-card-name-fr">${product.name_fr || ''}</div><div class="vw-card-name-ar">${product.name || ''}</div><div class="vw-card-price">${(product.price || 0).toFixed(2)} <small>درهم/${product.unit || 'كجم'}</small></div><button class="vw-dropdown-btn" onclick="openWeightPopup(${product.id})">اختر الوزن <i class="fas fa-chevron-down"></i></button></div></div>`; }).join('');
            setupVWCarouselControls();
        }
        function setupVWCarouselControls() { const scroll = document.getElementById('variableWeightCards'), prev = document.getElementById('variableWeightPrev'), next = document.getElementById('variableWeightNext'); if (prev) { const np = prev.cloneNode(true); prev.parentNode.replaceChild(np, prev); np.addEventListener('click', () => scroll?.scrollBy({ left: -280, behavior: 'smooth' })); } if (next) { const nn = next.cloneNode(true); next.parentNode.replaceChild(nn, next); nn.addEventListener('click', () => scroll?.scrollBy({ left: 280, behavior: 'smooth' })); } }
        function openWeightPopup(productId) {
            const product = variableWeightState.products.find(p => p.id === productId); if (!product) return;
            const weights = product.weights || []; if (weights.length === 0) { showToast('⚠️ لا توجد أوزان متاحة', 'warning'); return; }
            document.getElementById('vwWeightPopupOverlay')?.remove();
            const weightCounts = {}; weights.forEach(w => { weightCounts[w] = (weightCounts[w] || 0) + 1; });
            const overlay = document.createElement('div'); overlay.id = 'vwWeightPopupOverlay'; overlay.className = 'vw-weight-popup-overlay';
            overlay.innerHTML = `<div class="vw-weight-popup"><div class="vw-popup-header"><div class="vw-popup-title">اختر الوزن - ${product.name_fr}</div><button class="vw-popup-close" onclick="closeWeightPopup()"><i class="fas fa-times"></i></button></div><div class="vw-popup-content">${Object.entries(weightCounts).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])).map(([weight, count]) => `<div class="vw-weight-option" onclick="selectPopupWeight(this, ${productId}, ${weight}, ${product.price || 0})">${weight} ${product.unit || 'كجم'} - ${(weight * (product.price || 0)).toFixed(2)} درهم${count > 1 ? ` <span class="vw-weight-stock">(${count} قطع)</span>` : ''}</div>`).join('')}</div><div class="vw-popup-footer"><button class="vw-popup-btn vw-popup-btn-cancel" onclick="closeWeightPopup()">إغلاق</button><button class="vw-popup-btn vw-popup-btn-confirm" id="vwConfirmBtn" onclick="confirmWeightSelection(${productId})" disabled><i class="fas fa-shopping-cart"></i> إضافة إلى السلة</button></div></div>`;
            document.body.appendChild(overlay); overlay.addEventListener('click', (e) => { if (e.target === overlay) closeWeightPopup(); });
        }
        function selectPopupWeight(element, productId, weight, pricePerKg) { variableWeightState.selectedWeights[productId] = { weight: parseFloat(weight), pricePerKg: parseFloat(pricePerKg), totalPrice: parseFloat(weight) * parseFloat(pricePerKg) }; document.querySelectorAll('.vw-weight-option').forEach(opt => opt.classList.remove('selected')); element.classList.add('selected'); document.getElementById('vwConfirmBtn').disabled = false; }
        async function confirmWeightSelection(productId) { const sel = variableWeightState.selectedWeights[productId]; if (!sel) return; /* apply selection to card first so UI reflects choice immediately */ selectWeightOnCard(productId, sel.weight, sel.pricePerKg); /* close popup */ closeWeightPopup(); /* then attempt to add to cart (handles Baserow sync, toast, UI updates) */ try { await addVariableWeightToCart(productId); } catch (err) { console.error('Error adding variable weight to cart:', err); } }
        function closeWeightPopup() { const overlay = document.getElementById('vwWeightPopupOverlay'); if (overlay) { overlay.style.opacity = '0'; overlay.style.transition = 'opacity 0.2s ease'; setTimeout(() => overlay.remove(), 200); } }
        function selectWeightOnCard(productId, weight, pricePerKg) { const totalPrice = weight * pricePerKg; const card = document.querySelector(`.vw-card[data-product-id="${productId}"]`); if (!card) return; const db = card.querySelector('.vw-dropdown-btn'), ab = card.querySelector('.vw-add-cart-btn'); if (db) { db.innerHTML = `${weight} كجم - ${totalPrice.toFixed(2)} درهم <i class="fas fa-chevron-down"></i>`; db.classList.add('selected'); } if (ab) { ab.className = 'vw-add-cart-btn enabled'; ab.disabled = false; ab.innerHTML = `<i class="fas fa-shopping-cart"></i> أضف ${weight} كجم (${totalPrice.toFixed(2)} درهم)`; } }
        async function addVariableWeightToCart(productId) {
            const selection = variableWeightState.selectedWeights[productId], product = variableWeightState.products.find(p => p.id === productId);
            if (!selection || !product) { 
                console.warn('⚠️ لم يتم العثور على المنتج أو الوزن المختار');
                showToast('⚠️ الرجاء اختيار الوزن أولاً', 'warning'); 
                return; 
            }
            
            console.log(`🔄 محاولة إضافة منتج متغير الوزن:`, { 
                productId, 
                weight: selection.weight, 
                product: product.name,
                availableWeights: product.weights 
            });
            
            // التحقق من أن الوزن موجود بالفعل
            const weightExists = product.weights.some(w => Math.abs(parseFloat(w) - parseFloat(selection.weight)) < 0.01);
            if (!weightExists) {
                console.error(`❌ الوزن ${selection.weight} غير موجود في الأوزان المتاحة:`, product.weights);
                showToast(`⚠️ الوزن ${selection.weight} غير متاح حالياً`, 'error');
                return;
            }
            
            // إعلام المستخدم بأن عملية الحجز جارية
            showToast(`⏳ جاري حجز ${selection.weight}${product.unit || 'كجم'} - ${product.name_fr || product.name}...`, 'info');

            // محاولة حجز الوزن من Baserow
            const synced = await vwSyncWithBaserow(productId, selection.weight, 'remove');
            if (!synced) { 
                console.error(`❌ فشل حجز الوزن ${selection.weight} للمنتج ${productId}`);
                showToast('⚠️ تعذر حجز هذا الوزن، قد يكون محجوزاً', 'error'); 
                return; 
            }

            // إضافة المنتج إلى السلة
            const cartItemId = `${productId}_${selection.weight}`, existing = cart.find(item => item.id === cartItemId);
            if (existing) { 
                existing.quantity = (existing.quantity || 1) + 1; 
                console.log(`➕ زيادة كمية المنتج: ${product.name_fr} (الوزن: ${selection.weight})`);
                showToast(`➕ تم زيادة: ${product.name_fr}`, 'success'); 
            }
            else { 
                cart.push({ 
                    id: cartItemId, 
                    product_id: productId, 
                    baseId: productId, 
                    name: product.name, 
                    name_fr: product.name_fr, 
                    weight: selection.weight, 
                    price: selection.totalPrice, 
                    price_per_kg: selection.pricePerKg, 
                    unit: product.unit || 'كجم', 
                    image: product.image, 
                    quantity: 1, 
                    isVariableWeight: true, 
                    addedAt: Date.now() 
                }); 
                console.log(`✅ إضافة منتج جديد: ${product.name_fr} - وزن: ${selection.weight}${product.unit}`);
                showToast(`✅ تمت الإضافة: ${product.name_fr} - ⚖️ ${selection.weight}${product.unit}`, 'success'); 
            }
            
            // حفظ السلة وتحديث الواجهة
            localStorage.setItem('qoffaCart', JSON.stringify(cart)); 
            updateCartCount(); 
            updateCartSidebar();
            
            // إزالة الوزن من الكاروسيل بمقارنة صحيحة
            const parsedSelection = parseFloat(selection.weight);
            const idx = product.weights.findIndex(w => {
                const pw = parseFloat(w);
                return Math.abs(pw - parsedSelection) < 0.01;
            }); 
            if (idx !== -1) {
                console.log(`✅ إزالة الوزن ${parsedSelection} من الكاروسيل (الفهرس: ${idx})`);
                product.weights.splice(idx, 1);
            } else {
                console.warn(`⚠️ لم أتمكن من إيجاد الوزن ${parsedSelection} في:`, product.weights);
            }
            
            // تنظيف الاختيار وإعادة تحرير الكاروسيل
            delete variableWeightState.selectedWeights[productId]; 
            renderVariableWeightCarousel(variableWeightState.products);
            
            // عرض السلة
            const sidebar = document.getElementById('cartSidebar'); 
            if (sidebar) { 
                sidebar.classList.add('active'); 
                updateCartSidebar(); 
            }
            
            // إطلاق حدث مخصص
            window.dispatchEvent(new CustomEvent('vwAddToCart', { detail: { product_id: productId, name: product.name, weight: selection.weight } }));
        }

        // ==================== RENDER FUNCTIONS ====================
        function renderProductCard(product) { const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0; const hasBundleDetails = product.category?.toLowerCase() === 'bundles'; return `<div class="product-card" style="cursor: pointer; position: relative;">${product.isNew ? '<span class="new-badge">جديد </span>' : ''}${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ''}<div class="product-image" onclick="window.location.href='/product-detail/?id=${product.id}'"><img src="${product.image}" alt="${product.name_fr}" loading="lazy" onerror="handleImageError(this)"></div><div class="card-content"><div class="brand">Qoffa Smart</div><div class="product-name"><div class="product-fr">${product.name_fr} <span class="unit-badge">${product.unit}</span></div><div class="product-ar">${product.name}</div></div><div class="price">${product.price.toFixed(2)} <span>درهم</span>${product.originalPrice ? `<del>${product.originalPrice.toFixed(2)}</del>` : ''}</div><div class="bundle-action-row"><button class="add-to-cart" onclick="event.stopPropagation(); addToCart(${product.id})"><i class="fas fa-shopping-cart"></i> أضف إلى السلة</button>${hasBundleDetails ? `<button class="btn-bundle-details" onclick="event.stopPropagation(); openBundleDetails(${product.id})"><i class="fas fa-search-plus"></i> 📋 تفاصيل القفة</button>` : ''}</div></div></div>`; }
        
        function renderCategory(categoryName) { 
            if (categoryName === 'bundles') { 
                renderBundlesFilterView(); 
                return; 
            } 
            
            const container = document.getElementById(`${categoryName}Products`); 
            if (!container) return; 
            
            let products = sortProductsByNew(allProducts[categoryName] || []); 
            const activeFilter = activeFilters[categoryName];
            
            // Filter products: if activeFilter is set and not 'الكل' (All), filter by exact subcategory match
            if (activeFilter && activeFilter !== 'الكل') {
                products = products.filter(p => {
                    const productSubcategory = (p.sub_category || '').trim();
                    const filterValue = activeFilter.trim();
                    return productSubcategory === filterValue;
                });
            }
            
            container.innerHTML = products.length === 0 ? `<div class="no-products">لا توجد منتجات</div>` : products.map(p => renderProductCard(p)).join(''); 
        }

        function renderBundlesFilterView() { 
            const gc = document.getElementById('bundlesProducts');
            const cc = document.getElementById('bundlesCarousel');
            const af = activeFilters['bundles']; 
            
            if (af && af !== 'الكل') { 
                if (cc) cc.style.display = 'none'; 
                if (gc) gc.style.display = 'grid'; 
                
                let bundles = sortProductsByNew(allProducts.bundles.filter(p => {
                    const productSubcategory = (p.sub_category || '').trim();
                    const filterValue = af.trim();
                    return productSubcategory === filterValue;
                })); 
                
                if (gc) gc.innerHTML = bundles.length === 0 ? `<div class="no-products">لا توجد باقات</div>` : bundles.map(p => renderProductCard(p)).join(''); 
            } else { 
                if (cc) cc.style.display = 'block'; 
                if (gc) gc.style.display = 'none'; 
                renderBundlesCarousel(); 
            } 
        }

        function createBundleSlide(product) {
            const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
            const features = [
                product.sub_category ? product.sub_category : '',
                `${product.price.toFixed(2)} درهم`,
                product.unit ? product.unit : ''
            ].filter(Boolean);

            return `<article class="q-carousel__slide">
                <div class="q-carousel__image">
                    <img src="${product.image}" alt="${product.name_fr || product.name}" loading="lazy" onerror="handleImageError(this)">
                </div>
                <div class="q-carousel__content">
                    <span class="q-carousel__badge">باقة</span>
                    <h2 class="q-carousel__title">${product.name_fr || product.name}</h2>
                    <p class="q-carousel__desc">${product.name || ''}</p>
                    <div class="q-carousel__features">${features.map(item => `<span class="q-carousel__feature">${item}</span>`).join('')}</div>
                    <button class="q-carousel__cta" type="button" onclick="event.stopPropagation(); addToCart(${product.id});">
                        <i class="fas fa-shopping-cart"></i> أضف إلى السلة
                    </button>
                    ${product.bundleDetailsImage ? `<button class="q-carousel__cta q-carousel__cta--secondary" type="button" onclick="event.stopPropagation(); openBundleDetails(${product.id});">📋 تفاصيل القفة</button>` : ''}
                </div>
            </article>`;
        }

        function renderBundlesCarousel() {
            const track = document.getElementById('bundlesCarouselTrack');
            if (!track) return;
            const bundles = sortProductsByNew(allProducts.bundles || []);
            track.innerHTML = bundles.length === 0 ? `<div class="q-carousel__empty"><p>لا توجد باقات</p></div>` : bundles.map(createBundleSlide).join('');
            initBundlesCarousel();
        }

        function initBundlesCarousel() {
            // Initialize the Blackhole Carousel for Bundles
            const scene = document.getElementById('bundlesBlackholeScene');
            if (!scene) return;

            // Clear existing slides
            scene.innerHTML = '';

            // Get bundles from allProducts
            const bundles = allProducts.bundles || [];
            
            if (bundles.length === 0) {
                scene.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">لا توجد باقات متاحة</div>';
                return;
            }

            // Create slides for each bundle
            bundles.forEach(bundle => {
                const slide = document.createElement('div');
                slide.className = 'blackhole-slide-wrapper';
                
                const discount = bundle.originalPrice 
                    ? Math.round(((bundle.originalPrice - bundle.price) / bundle.originalPrice) * 100) 
                    : 0;

                slide.innerHTML = `
                    <div class="blackhole-slide-image">
                        <img src="${bundle.image}" alt="${bundle.name_fr}" loading="lazy" onerror="this.src='https://via.placeholder.com/800/2E8B57/ffffff?text=Bundle'">
                        ${discount > 0 ? `<span class="blackhole-badge">-${discount}%</span>` : ''}
                    </div>
                    <div class="blackhole-content">
                        <h2>${bundle.name_fr || bundle.name}</h2>
                        <div class="subtitle">${bundle.name || ''}</div>
                        <div class="price">${bundle.price.toFixed(2)} درهم</div>
                    </div>
                    <div class="blackhole-buttons-wrapper">
                        <button class="blackhole-btn blackhole-btn-cart" onclick="addToCart(${bundle.id})">🛒 أضف إلى السلة</button>
                        <button class="blackhole-btn blackhole-btn-details" onclick="viewBundleDetails(${bundle.id})">🔍 تفاصيل القفة</button>
                    </div>
                `;
                
                scene.appendChild(slide);
            });

            // Initialize carousel index and reveal the first slide immediately.
            if (!window.bundlesCarouselIndex) {
                window.bundlesCarouselIndex = 0;
            }
            requestAnimationFrame(() => bundlesCarouselMove(0, 'bundlesBlackholeScene', 'bundlesBlackholeCarousel'));
            const carousel = document.getElementById('bundlesBlackholeCarousel');
            if (carousel && !window.qoffaBundlesAutoplay) {
                window.qoffaBundlesAutoplay = setInterval(() => {
                    if (!carousel.matches(':hover')) bundlesCarouselMove(1, 'bundlesBlackholeScene', 'bundlesBlackholeCarousel');
                }, 5600);
            }
        }

        // Function for moving the bundles carousel
        function bundlesCarouselMove(n, sceneId, carouselId) {
            const scene = document.getElementById(sceneId);
            if (!scene) return;

            const wrappers = scene.querySelectorAll('.blackhole-slide-wrapper');
            if (wrappers.length === 0) return;

            if (!window.bundlesCarouselIndex) {
                window.bundlesCarouselIndex = 0;
            }

            window.bundlesCarouselIndex = (window.bundlesCarouselIndex + n + wrappers.length) % wrappers.length;

            wrappers.forEach((el, i) => {
                const diff = (i - window.bundlesCarouselIndex + wrappers.length) % wrappers.length;
                if (diff === 0) {
                    el.style.transform = 'translateZ(0) scale(1)';
                    el.style.zIndex = '10';
                    el.style.opacity = '1';
                } else if (diff === 1) {
                    el.style.transform = 'translateZ(-400px) scale(0.7) rotateY(15deg)';
                    el.style.zIndex = '5';
                    el.style.opacity = '0.5';
                } else {
                    el.style.transform = 'translateZ(-800px) scale(0.4) rotateY(30deg)';
                    el.style.zIndex = '1';
                    el.style.opacity = '0.2';
                }
            });
        }

        // Function to handle bundle details by opening the dedicated bundle modal
        function viewBundleDetails(bundleId) {
            const bundle = (allProducts.bundles || []).find(b => b.id === bundleId);
            if (!bundle) return;
            if (typeof openBundleDetails === 'function') {
                openBundleDetails(bundleId);
                return;
            }
            showToast(`تفاصيل: ${bundle.name_fr}`, 'info');
        }

        function renderAllCategories() { 
            renderCategory('fruits'); 
            renderCategory('vegetables'); 
            renderCategory('herbs'); 
            renderCategory('bundles'); 
            if (typeof AOS !== 'undefined') AOS.refresh(); 
        }

        function getCategoryFromUrl() {
            const params = new URLSearchParams(window.location.search);
            const category = (params.get('category') || '').trim().toLowerCase();
            return category || null;
        }

        function activateQuickLink(categoryName) {
            document.querySelectorAll('.quick-link').forEach(link => {
                link.classList.toggle('active', link.dataset.category === categoryName);
            });
        }

        function scrollToCategory(categoryName) {
            const section = document.getElementById(categoryName);
            if (!section) return;

            const header = document.getElementById('mainHeader');
            const quickCategories = document.getElementById('quickCategories');
            const offset = (header?.offsetHeight || 0) + (quickCategories?.offsetHeight || 0) + 16;
            const scrollContainer = document.scrollingElement || document.documentElement;
            const currentScrollTop = scrollContainer.scrollTop || window.scrollY;
            const targetTop = Math.max(0, section.getBoundingClientRect().top + currentScrollTop - offset);

            // قفزة مباشرة بدل تمرير طويل، مع إبقاء القسم واضحاً تحت الهيدر والشريط الثابت.
            scrollContainer.scrollTop = targetTop;
            activateQuickLink(categoryName);
            history.replaceState(null, '', `#${categoryName}`);
        }

        // ==================== COVERFLOW ====================
        class Coverflow3D { 
            constructor(containerId, products = []) { 
                this.container = document.getElementById(containerId); 
                this.prevBtn = document.getElementById('coverflowPrev'); 
                this.nextBtn = document.getElementById('coverflowNext'); 
                this.indicatorsContainer = document.getElementById('coverflowIndicators'); 
                this.products = products; 
                this.currentIndex = 0; 
                this.visibleCards = this.getResponsiveVisibleCards(); 
                this.isDragging = false; 
                this.touchStartX = 0; 
                this.init(); 
            } 
            
            getResponsiveVisibleCards() { 
                const w = window.innerWidth; 
                return w < 480 ? 1 : w < 768 ? 2 : w < 1024 ? 3 : 5; 
            } 
            
            init() { 
                this.render(); 
                this.attachEvents(); 
            } 
            
            updateProducts(products) { 
                this.products = sortProductsByNew(products || []); 
                this.currentIndex = 0; 
                this.render(); 
            } 
            
            render() { 
                if (!this.container) return; 
                this.container.innerHTML = ''; 
                this.renderIndicators(); 
                if (this.products.length === 0) { 
                    this.container.innerHTML = '<div class="coverflow-empty"><i class="fas fa-gift"></i><p>لا توجد باقات</p></div>'; 
                    if (this.prevBtn) this.prevBtn.disabled = true; 
                    if (this.nextBtn) this.nextBtn.disabled = true; 
                    return; 
                } 
                const hv = Math.floor(this.visibleCards / 2); 
                for (let i = -hv; i <= hv; i++) { 
                    let di = this.currentIndex + i; 
                    if (di < 0) di = this.products.length + di; 
                    if (di >= this.products.length) di = di - this.products.length; 
                    if (di < 0 || di >= this.products.length) continue; 
                    this.container.appendChild(this.createCard(this.products[di], i)); 
                } 
                this.updateNavButtons(); 
                this.updateIndicators(); 
            } 
            
            createCard(product, position) { 
                const card = document.createElement('div'); 
                card.className = 'product-card'; 
                card.setAttribute('data-position', position.toString());
                const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0; 
                
                card.innerHTML = `
                    ${product.isNew ? `<span class="new-badge">جديد</span>` : ''}
                    ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ''}
                    <div class="product-image">
                        <img src="${product.image}" alt="${product.name_fr}" loading="lazy" onerror="handleImageError(this)">
                    </div>
                    <div class="card-content">
                        <div class="brand">Qoffa Smart</div>
                        <div class="product-name">
                            <div class="product-fr">${product.name_fr} <span class="unit-badge">${product.unit}</span></div>
                            <div class="product-ar">${product.name}</div>
                        </div>
                        <div class="price">
                            ${product.price.toFixed(2)} <span>درهم</span>
                            ${product.originalPrice ? `<del>${product.originalPrice.toFixed(2)}</del>` : ''}
                        </div>
                        <div class="bundle-action-row">
                            <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(${product.id})">
                                <i class="fas fa-shopping-cart"></i> أضف إلى السلة
                            </button>
                            ${product.bundleDetailsImage ? `
                                <button class="btn-bundle-details" onclick="event.stopPropagation(); openBundleDetails(${product.id})">
                                    <i class="fas fa-search-plus"></i> 📋 تفاصيل القفة
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
                
                card.style.position = 'absolute';
                card.style.cursor = 'pointer';
                card.style.willChange = 'transform, opacity';
                card.setAttribute('data-product-id', product.id);
                
                return card; 
            } 
            
            renderIndicators() { 
                if (!this.indicatorsContainer) return; 
                this.indicatorsContainer.innerHTML = ''; 
                for (let i = 0; i < this.products.length; i++) { 
                    const dot = document.createElement('button'); 
                    dot.className = `coverflow-dot ${i === this.currentIndex ? 'active' : ''}`; 
                    dot.addEventListener('click', () => this.goTo(i)); 
                    this.indicatorsContainer.appendChild(dot); 
                } 
            } 
            
            updateIndicators() { 
                const dots = this.indicatorsContainer?.querySelectorAll('.coverflow-dot'); 
                if (!dots) return; 
                dots.forEach((dot, index) => { 
                    dot.classList.toggle('active', index === this.currentIndex); 
                }); 
            } 
            
            updateNavButtons() { 
                if (this.products.length <= 1) { 
                    if (this.prevBtn) this.prevBtn.disabled = true; 
                    if (this.nextBtn) this.nextBtn.disabled = true; 
                } else { 
                    if (this.prevBtn) this.prevBtn.disabled = false; 
                    if (this.nextBtn) this.nextBtn.disabled = false; 
                } 
            } 
            
            next() { 
                if (this.products.length === 0) return; 
                this.currentIndex = (this.currentIndex + 1) % this.products.length; 
                this.render(); 
            } 
            
            prev() { 
                if (this.products.length === 0) return; 
                this.currentIndex = (this.currentIndex - 1 + this.products.length) % this.products.length; 
                this.render(); 
            } 
            
            goTo(index) { 
                if (index >= 0 && index < this.products.length) { 
                    this.currentIndex = index; 
                    this.render(); 
                } 
            } 
            
            attachEvents() { 
                this.prevBtn?.addEventListener('click', () => this.prev()); 
                this.nextBtn?.addEventListener('click', () => this.next()); 
                const wrapper = document.getElementById('bundlesCoverflowWrapper'); 
                if (wrapper) { 
                    wrapper.addEventListener('touchstart', (e) => { 
                        this.touchStartX = e.touches[0].clientX; 
                        this.isDragging = true; 
                    }, { passive: true }); 
                    wrapper.addEventListener('touchend', (e) => { 
                        if (!this.isDragging) return; 
                        const diff = this.touchStartX - e.changedTouches[0].clientX; 
                        if (Math.abs(diff) > 50) { 
                            if (diff > 0) this.next(); 
                            else this.prev(); 
                        } 
                        this.isDragging = false; 
                    }); 
                    wrapper.addEventListener('mousedown', (e) => { 
                        this.touchStartX = e.clientX; 
                        this.isDragging = true; 
                    }); 
                    wrapper.addEventListener('mouseup', (e) => { 
                        if (!this.isDragging) return; 
                        const diff = this.touchStartX - e.clientX; 
                        if (Math.abs(diff) > 50) { 
                            if (diff > 0) this.next(); 
                            else this.prev(); 
                        } 
                        this.isDragging = false; 
                    }); 
                } 
                window.addEventListener('resize', () => { 
                    clearTimeout(this.resizeTimeout); 
                    this.resizeTimeout = setTimeout(() => { 
                        const nvc = this.getResponsiveVisibleCards(); 
                        if (nvc !== this.visibleCards) { 
                            this.visibleCards = nvc; 
                            this.render(); 
                        } 
                    }, 250); 
                }); 
            } 
            
            destroy() { } 
        }
        function initCoverflowCarousel() { if (window.coverflowInstance) window.coverflowInstance.destroy(); window.coverflowInstance = new Coverflow3D('bundlesCoverflowContainer', allProducts.bundles || []); }

        // ==================== FILTERS ====================
        // Mapping English category names to Arabic for SUBCATEGORY_MAP
        const CATEGORY_AR_MAP = {
            'fruits': 'فواكه',
            'vegetables': 'الخضروات',
            'herbs': 'الأعشاب',
            'bundles': 'باقات'
        };

        function normalizeSubcategoryValue(value) {
            return String(value ?? '').trim();
        }

        function buildFilterConfigFromData() { 
            filterConfig.fruits = ['الكل', ...new Set(allProducts.fruits.map(p => normalizeSubcategoryValue(p.sub_category)).filter(Boolean))]; 
            filterConfig.vegetables = ['الكل', ...new Set(allProducts.vegetables.map(p => normalizeSubcategoryValue(p.sub_category)).filter(Boolean))]; 
            filterConfig.herbs = ['الكل', ...new Set(allProducts.herbs.map(p => normalizeSubcategoryValue(p.sub_category)).filter(Boolean))]; 
            filterConfig.bundles = ['الكل', ...new Set(allProducts.bundles.map(p => normalizeSubcategoryValue(p.sub_category)).filter(Boolean))]; 
        }

        function initializeFilters() {
            Object.keys(CATEGORY_AR_MAP).forEach(categoryKey => {
                const arabicCategoryName = CATEGORY_AR_MAP[categoryKey];
                const subcategories = (filterConfig[categoryKey] && filterConfig[categoryKey].length > 1)
                    ? filterConfig[categoryKey]
                    : (SUBCATEGORY_MAP[arabicCategoryName] || []);
                
                const fc = document.getElementById(`${categoryKey}Filter`);
                if (!fc) return;
                
                fc.innerHTML = '';
                
                subcategories.forEach((subcategoryName, index) => {
                    const btn = document.createElement('button');
                    btn.className = `filter-btn ${index === 0 ? 'active' : ''}`;
                    btn.dataset.filter = subcategoryName;
                    btn.textContent = subcategoryName;
                    
                    btn.addEventListener('click', function (e) {
                        e.preventDefault();
                        fc.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                        this.classList.add('active');
                        activeFilters[categoryKey] = subcategoryName;
                        renderCategory(categoryKey);
                    });
                    
                    fc.appendChild(btn);
                });
            });
        }

        // ==================== CART FUNCTIONS ====================
        function updateCartCount() { const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0); document.querySelectorAll('.cart-count').forEach(el => el.textContent = count); localStorage.setItem('qoffaCart', JSON.stringify(cart)); updateCartSidebar(); }
        function addToCart(productId) { const all = [...allProducts.fruits, ...allProducts.vegetables, ...allProducts.herbs, ...allProducts.bundles]; const product = all.find(p => p.id === productId); if (!product) { showToast('لم يتم العثور على المنتج', 'error'); return; } const existing = cart.find(item => item.id === productId); if (existing) { existing.quantity += 1; showToast(`تم زيادة كمية ${product.name}`, 'success'); } else { cart.push({ id: product.id, name: product.name, name_fr: product.name_fr, price: product.price, quantity: 1, unit: product.unit, image: product.image, imageOriginal: product.imageOriginal }); showToast(`✅ تم إضافة ${product.name} إلى السلة`, 'success'); } updateCartCount(); }
        function removeFromCart(productId) { 
            console.log(`🗑️ محاولة حذف - ID المستقبل:`, productId, `من النوع: ${typeof productId}`);
            console.log(`🗑️ السلة الحالية:`, cart);
            
            window.preventCartClose = true; 
            setTimeout(() => { window.preventCartClose = false; }, 1000); 
            
            // البحث عن العنصر في السلة
            const item = cart.find(i => String(i.id) === String(productId));
            console.log(`✅ العنصر المجد:`, item);
            
            if (item) {
                console.log(`🗑️ الضغط على حذف:`, item);
                const displayName = item.name_fr || item.name;
                console.log(`📋 اسم المنتج للعرض:`, displayName);
                
                // استدعاء الـ modal
                showConfirmationModal(productId, displayName);
            } else {
                console.error(`❌ لم يتم العثور على المنتج مع ID:`, productId);
                showToast('❌ لم يتم العثور على المنتج', 'error');
            }
        }
        function updateQuantity(productId, newQuantity) { if (newQuantity < 1) { removeFromCart(productId); return; } const item = cart.find(item => item.id === productId); if (item && !isVariableWeightItem(item)) { item.quantity = newQuantity; updateCartCount(); updateCartSidebar(); } }
        function increaseQuantity(productId) { const item = cart.find(item => String(item.id) === String(productId)); if (item && !isVariableWeightItem(item)) { item.quantity += 1; updateCartCount(); updateCartSidebar(); } }
        function decreaseQuantity(productId) { const item = cart.find(item => String(item.id) === String(productId)); if (item && item.quantity > 1 && !isVariableWeightItem(item)) { item.quantity -= 1; updateCartCount(); updateCartSidebar(); } else if (item && item.quantity === 1) { removeFromCart(productId); } }
        function updateCartSidebar() { cart = JSON.parse(localStorage.getItem('qoffaCart')) || []; const container = document.getElementById('cartItems'), totalEl = document.getElementById('cartTotalPrice'); if (!container) return; if (cart.length === 0) { container.innerHTML = '<div class="cart-empty">السلة فارغة</div>'; if (totalEl) totalEl.textContent = '0.00 درهم'; return; } let html = ''; let total = 0; cart.forEach((item, idx) => { total += item.price * (item.quantity || 1); const isVar = isVariableWeightItem(item); const itemId = String(item.id).replace(/'/g, "\\'"); const displayName = (item.name_fr || item.name || 'المنتج').replace(/'/g, "\\'"); html += `<div class="cart-item"><img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.src='https://via.placeholder.com/80'"><div class="cart-item-info"><div class="cart-item-name">${item.name || item.name_fr}${isVar ? ` <span class="vw-weight-badge">${item.weight}${item.unit || 'كجم'}</span>` : ''}</div><div class="cart-item-price">${item.price.toFixed(2)} درهم</div>${!isVar ? `<div class="cart-item-quantity-controls"><button class="qty-btn qty-minus" onclick="event.stopPropagation(); decreaseQuantity('${itemId}')"><i class="fas fa-minus"></i></button><input type="number" class="qty-input" value="${item.quantity || 1}" onchange="updateQuantity('${itemId}',parseInt(this.value))" min="1" max="100"><span class="qty-unit">${item.unit || 'كيلو'}</span><button class="qty-btn qty-plus" onclick="event.stopPropagation(); increaseQuantity('${itemId}')"><i class="fas fa-plus"></i></button></div>` : `<div class="cart-item-weight-display"><span class="weight-value">${item.weight}${item.unit || 'كجم'}</span>${item.quantity > 1 ? `<span class="weight-qty">× ${item.quantity}</span>` : ''}</div>`}</div><button class="cart-item-remove" onclick="showConfirmationModal('${itemId}', '${displayName}')">🗑️</button></div>`; }); container.innerHTML = html; if (totalEl) totalEl.textContent = total.toFixed(2) + ' درهم'; const totalText = document.getElementById('sidebarTotalText'), checkoutBtn = document.getElementById('cartCheckout'), minOrderMsg = document.getElementById('sidebarMinOrderMsg'); if (totalText) totalText.textContent = `المجموع الإجمالي: ${total.toFixed(2)} درهم`; if (checkoutBtn) { if (total >= 150) { checkoutBtn.disabled = false; checkoutBtn.style.opacity = '1'; checkoutBtn.style.cursor = 'pointer'; } else { checkoutBtn.disabled = true; checkoutBtn.style.opacity = '0.5'; checkoutBtn.style.cursor = 'not-allowed'; } } if (minOrderMsg) minOrderMsg.style.display = total < 150 ? 'block' : 'none'; }
        function toggleCart() { const sidebar = document.getElementById('cartSidebar'); if (sidebar) { sidebar.classList.toggle('active'); if (sidebar.classList.contains('active')) updateCartSidebar(); } }

        // ==================== BUNDLE DETAILS ====================
        function openBundleDetails(productId) {
            const all = [...allProducts.fruits, ...allProducts.vegetables, ...allProducts.herbs, ...allProducts.bundles];
            const normalizedId = String(productId);
            const product = all.find(p => String(p.id) === normalizedId);
            if (!product || !product.bundleDetailsImage) {
                showToast('لا توجد تفاصيل', 'error');
                return;
            }
            const overlay = document.createElement('div');
            overlay.className = 'bundle-modal-overlay';
            overlay.id = 'bundleModalOverlay';
            const modal = document.createElement('div');
            modal.className = 'bundle-modal';
            modal.id = 'bundleModal';
            modal.innerHTML = `<div class="bundle-modal-header"><h2 class="bundle-modal-title">🎁 ${product.name}</h2><button type="button" class="bundle-modal-close" onclick="closeBundleDetails()"><i class="fas fa-times"></i></button></div><div class="bundle-modal-body" id="bundleModalBody"><div class="bundle-image-loader" id="bundleImageLoader"></div></div><div class="bundle-modal-footer"><div class="bundle-price-display"><span>💰</span><span>${product.price.toFixed(2)} درهم</span></div><button type="button" class="btn-add-cart-modal" onclick="event.stopPropagation();addToCart(${product.id});closeBundleDetails();"><i class="fas fa-shopping-cart"></i> أضف إلى السلة</button></div>`;
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            overlay.addEventListener('click', (e) => { if (e.target === overlay) closeBundleDetails(); });
            const img = new Image();
            img.onload = function () {
                document.getElementById('bundleImageLoader')?.remove();
                const body = document.getElementById('bundleModalBody');
                if (body) body.innerHTML = `<img src="${product.bundleDetailsImage}" alt="تفاصيل القفة" style="max-width:100%;height:auto;">`;
            };
            img.onerror = function () {
                document.getElementById('bundleImageLoader')?.remove();
                const body = document.getElementById('bundleModalBody');
                if (body) body.innerHTML = '<div style="color:#666;text-align:center;padding:40px;">❌ فشل تحميل الصورة</div>';
            };
            img.src = product.bundleDetailsImage;
        }
        function closeBundleDetails() { const overlay = document.getElementById('bundleModalOverlay'); if (!overlay) return; overlay.querySelector('.bundle-modal')?.classList.add('closing'); overlay.classList.add('closing'); setTimeout(() => { overlay.remove(); document.body.style.overflow = ''; }, 250); }

        // ==================== DELETE PRODUCT ====================
        window.deleteProductFromCart = async function (productId, productName) {
            const item = cart.find(i => String(i.id) === String(productId));
            
            if (!item) {
                console.warn(`⚠️ لم يتم العثور على المنتج: ${productId}`);
                return;
            }

            const itemName = productName || item.name_fr || item.name || 'المنتج';
            
            console.log(`🗑️ محاولة حذف المنتج مباشرة: ${itemName}`, item);
            
            // إذا كان منتج Variable Weight، إرجاع الوزن للمخزون
            if (item?.isVariableWeight) {
                console.log(`🔄 حذف منتج متغير الوزن من السلة: ${item.name_fr || item.name} - الوزن: ${item.weight}`);

                // إعلام المستخدم بأن عملية الإرجاع جارية
                showToast(`⏳ جاري إرجاع ${itemName} للمخزون...`, 'info');

                const returnResult = await vwReturnWeightToBaserow(item);
                console.log(`🔍 نتيجة الإرجاع:`, returnResult);
                
                if (!returnResult) {
                    console.error(`❌ فشل إرجاع الوزن ${item.weight} للمنتج ${item.baseId}`);
                    showToast('⚠️ فشل إرجاع الوزن للمخزون. الرجاء المحاولة مرة أخرى', 'error');
                    return;
                }
                console.log(`✅ تم إرجاع الوزن ${item.weight} بنجاح`);
            }
            
            cart = cart.filter(i => String(i.id) !== String(productId));
            localStorage.setItem('qoffaCart', JSON.stringify(cart)); 
            updateCartCount(); 
            updateCartSidebar(); 
            
            // إبقاء السلة مفتوحة بعد الحذف (مثل /)
            const cartSidebar = document.getElementById('cartSidebar'); 
            if (cartSidebar && !cartSidebar.classList.contains('active')) {
                cartSidebar.classList.add('active');
            }
            // منع إغلاق السلة مؤقتاً بعد التحديث (لمنع handler النقر الخارجي من إغلاقها)
            window.preventCartClose = true;
            setTimeout(() => { window.preventCartClose = false; }, 1000);

            // عرض رسالة النجاح
            showToast(`✅ تم إزالة ${itemName} من السلة`, 'success');
        };

        // ==================== INITIALIZATION ====================
        // ==================== BANNER FUNCTIONS ====================
        let banners = [];
        let currentBannerIndex = 0;
        let bannerInterval = null;

        const productsJourneySlides = [
            { kind: 'journey', localSrc: '/assets/images/products-journey-bundles.png', alt: 'قفة Qoffa Smart الجاهزة', number: '01', category: 'القفف', title: 'ما بغيتيش تختار؟ خلي القفة علينا. 🧺', description: 'قفف مجهزة وموزونة، فيها تشكيلة من الأساسيات اللي كتحتاجها الدار.', cta: 'اكتشف القفف', href: '#bundles' },
            { kind: 'journey', localSrc: '/assets/images/products-journey-fruits.png', alt: 'قفة الفواكه الطرية', number: '02', category: 'الفواكه', title: 'الفواكه الطرية كتسناك 🍎', description: 'اختار فواكهك المفضلة، من الفواكه اليومية حتى الاختيارات الموسمية.', cta: 'تسوق الفواكه', href: '#fruits' },
            { kind: 'journey', localSrc: '/assets/images/products-journey-vegetables.png', alt: 'قفة الخضر اليومية', number: '03', category: 'الخضر', title: 'كل خضرتك اليومية... فـقفة وحدة 🥬', description: 'من المطيشة والبطاطا حتى البصل والجزر والقزبر... كل الأساسيات اللي كتحتاجها فالدار، مختارة بعناية.', cta: 'تسوق الخضر', href: '#vegetables' },
            { kind: 'journey', localSrc: '/assets/images/products-journey-herbs.png', alt: 'الأعشاب الطازجة', number: '04', category: 'الأعشاب', title: 'اللمسة اللي كتكمّل الماكلة 🌿', description: 'قزبر، معدنوس، نعناع وأعشاب طازجة... باش ما تبقاش ناقصاك حتى حاجة.', cta: 'شوف الأعشاب', href: '#herbs' }
        ];

        async function fetchBanners() {
            try {
                if (document.body.classList.contains('products-page')) {
                    banners = productsJourneySlides;
                    renderBanners();
                    startBannerAutoplay();
                    return;
                }
                // Use the Baserow API table endpoint (replace with banner table id)
                const BANNER_TABLE_ID = '1062179';
                const url = `https://api.baserow.io/api/database/rows/table/${BANNER_TABLE_ID}/?user_field_names=true&size=200`;
                console.log('🔍 Fetching banners from Baserow API:', url);
                const response = await fetch(url, { headers: { 'Authorization': `Token ${BASEROW_TOKEN}` } });

                if (!response.ok) {
                    const text = await response.text();
                    console.error('❌ fetchBanners: bad response', response.status, text);
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                console.log('✅ fetchBanners: raw data', data);

                // Support both { results: [...] } and direct array responses
                const rows = Array.isArray(data) ? data : (data.results || []);
                const targetPage = '/products/';

                // Normalize banners and be resilient to field name variations
                banners = rows.map(row => {
                    const pageValue = getBaserowSingleSelectValue(row.page || row.Page || row.page_name || row.Page_name || row.pageName || row.PageName || '');
                    return {
                        raw: row,
                        page: pageValue,
                        title: getBaserowDisplayValue(row.title || row.Title || row.name || row.Name || row.heading || row.Heading),
                        subtitle: getBaserowDisplayValue(row.subtitle || row.Subtitle || row.sub_title),
                        description: getBaserowDisplayValue(row.description || row.Description || row.body || row.text),
                        button_text: getBaserowDisplayValue(row.button_text || row.Button_text || row.button || row.cta_text),
                        button_link: getBaserowDisplayValue(row.button_link || row.Button_link || row.link || row.url),
                        active: row.active === true || row.active === 'true' || row.active === 1 || row.Active === true || row.Active === 'true' || row.Active === 1,
                        imageField: row.image || row.Image || row.images || row.Images || row.banner_image || row.banner || null,
                        videoField: row.video || row.Video || row.video_url || row.Video_url || row.youtube || row.Youtube || row.embed || null,
                        // placeholder for any discovered URL in the row
                        discoveredUrls: []
                    };
                }).filter(b => b.active === true && b.page === targetPage);

                // Scan each raw row for any string that looks like a YouTube or http(s) URL
                banners.forEach(b => {
                    try {
                        const row = b.raw || {};
                        const values = Object.values(row);
                        for (const v of values) {
                            if (!v) continue;
                            // if cell is object (file field) try common props
                            if (typeof v === 'object') {
                                const cand = v.url || v.download_url || v.value || v[0] && v[0].url || null;
                                if (cand && typeof cand === 'string') b.discoveredUrls.push(cand);
                            } else if (typeof v === 'string') {
                                b.discoveredUrls.push(v);
                            }
                        }

                        // prefer explicit videoField, else look for first youtube link in discoveredUrls
                        if (!b.videoField) {
                            const yt = b.discoveredUrls.find(s => typeof s === 'string' && /(?:youtube\.com|youtu\.be)/i.test(s));
                            if (yt) b.videoField = yt;
                        }

                        // if imageField missing but discoveredUrls has an http link, set as imageField candidate
                        if (!b.imageField) {
                            const img = b.discoveredUrls.find(s => typeof s === 'string' && /https?:\/\/.+\.(jpg|jpeg|png|webp|gif)/i.test(s));
                            if (img) b.imageField = img;
                        }
                    } catch (e) {
                        console.warn('scan row urls error', e);
                    }
                });

                console.log('🔎 fetchBanners: normalized banners', banners);

                if (banners.length > 0) {
                    renderBanners();
                    startBannerAutoplay();
                } else {
                    console.log('ℹ️ No active banners found');
                }
            } catch (error) {
                console.error('❌ Error fetching banners:', error);
                showToast('حدث خطأ في تحميل البانرات', 'error');
            }
        }

        function renderBanners() {
            const container = document.getElementById('bannerSlides');
            const dotsContainer = document.getElementById('bannerDots');
            if (!container) return;

            function isYouTubeUrl(u) {
                if (!u) return false;
                try { const s = String(u).toLowerCase(); return s.includes('youtube.com') || s.includes('youtu.be'); } catch (e) { return false; }
            }

            container.innerHTML = banners.map((banner, index) => {
                // Determine image URL and video URL from several possible field shapes
                let imageUrl = null;
                const imgField = banner.imageField || banner.image || banner.Image || null;
                let videoUrl = null;
                const vidField = banner.videoField || banner.video || banner.Video || null;
                if (imgField) {
                    if (Array.isArray(imgField) && imgField.length > 0) {
                        imageUrl = imgField[0].url || imgField[0].download_url || imgField[0].value || null;
                    } else if (typeof imgField === 'object') {
                        imageUrl = imgField.url || imgField.download_url || imgField.value || null;
                    } else if (typeof imgField === 'string') {
                        imageUrl = imgField;
                    }
                }
                if (vidField) {
                    if (Array.isArray(vidField) && vidField.length > 0) {
                        videoUrl = vidField[0].url || vidField[0].download_url || vidField[0].value || null;
                    } else if (typeof vidField === 'object') {
                        videoUrl = vidField.url || vidField.download_url || vidField.value || null;
                    } else if (typeof vidField === 'string') {
                        videoUrl = vidField;
                    }
                }
                const optimizedImage = banner.localSrc || (imageUrl ? getOptimizedImage(imageUrl, { width: 1200 }) : '');
                // Prefer original absolute URL for Baserow URL fields to avoid proxy issues
                const displayImageSrc = banner.localSrc || ((imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('//'))) ? imageUrl : optimizedImage);

                // If image field actually contains a YouTube link, treat it as video
                if (!videoUrl && isYouTubeUrl(displayImageSrc)) {
                    videoUrl = displayImageSrc;
                    imageUrl = null;
                }

                console.log(`ℹ️ banner[${index}] media selection:`, { imageUrl, videoUrl, displayImageSrc });
                // Render video if available (HTML5 or YouTube), otherwise render image
                let mediaHtml = '';
                if (videoUrl) {
                    const v = String(videoUrl || '').trim();
                    if (v.includes('youtube.com') || v.includes('youtu.be')) {
                        // extract YouTube video ID robustly
                        let videoId = null;
                        try {
                            const ytMatch = v.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
                            if (ytMatch && ytMatch[1]) videoId = ytMatch[1];
                            // fallback: last path segment
                            if (!videoId) {
                                const parts = v.split('/').filter(Boolean);
                                videoId = parts[parts.length - 1];
                            }
                        } catch (e) { console.warn('yt id parse error', e); }

                        if (videoId) {
                            // Build embed URL with loop via playlist param
                            const embed = `https://www.youtube.com/embed/${videoId}`;
                            const params = `?rel=0&autoplay=1&mute=1&controls=1&loop=1&playlist=${videoId}`;
                            mediaHtml = `<iframe src="${embed}${params}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; autoplay" allowfullscreen></iframe>`;
                        } else {
                            // fallback to linking to YouTube
                            console.warn('⚠️ Unable to parse YouTube ID for', v);
                            const link = v;
                            mediaHtml = `<div class="banner-video-fallback"><a href="${link}" target="_blank" rel="noopener">تشغيل الفيديو على يوتيوب</a></div>`;
                        }
                    } else {
                        // assume direct video file (mp4, webm)
                        mediaHtml = `<video src="${videoUrl}" playsinline muted loop autoplay preload="metadata"></video>`;
                    }
                } else if (displayImageSrc) {
                    mediaHtml = `<img src="${displayImageSrc}" alt="${banner.alt || banner.title || ''}" loading="lazy">`;
                } else {
                    mediaHtml = '';
                }

                const copyHtml = banner.kind === 'journey' ? `
                    <div class="banner-copy">
                        <span class="banner-kicker"><strong>${banner.number}</strong><span>/ ${banner.category}</span></span>
                        <h2>${banner.title}</h2>
                        <p>${banner.description}</p>
                        <a href="${banner.href}" class="banner-btn banner-cta">${banner.cta}<span aria-hidden="true">→</span></a>
                    </div>
                ` : '<div class="banner-overlay"></div>';

                return `
                    <div class="banner-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                        <div class="banner-media">${mediaHtml}</div>
                        ${copyHtml}
                    </div>
                `;
            }).join('');

            if (dotsContainer) {
                dotsContainer.innerHTML = banners.map((banner, index) => `
                    <button class="banner-dot ${index === 0 ? 'active' : ''}" data-index="${index}" aria-label="${banner.number || String(index + 1).padStart(2, '0')} / ${banner.category || ''}" onclick="goToBanner(${index})"><span class="journey-dot-number">${banner.number || String(index + 1).padStart(2, '0')}</span><span class="journey-dot-label">${banner.category || ''}</span></button>
                `).join('');
            }
        }

        function goToBanner(index) {
            if (index < 0 || index >= banners.length) return;

            currentBannerIndex = index;

            document.querySelectorAll('.banner-slide').forEach((slide, i) => {
                slide.classList.toggle('active', i === index);
            });

            document.querySelectorAll('.banner-dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        }

        function startBannerAutoplay() {
            if (bannerInterval) clearInterval(bannerInterval);
            bannerInterval = setInterval(() => {
                const nextIndex = (currentBannerIndex + 1) % banners.length;
                goToBanner(nextIndex);
            }, 5000);
        }

        function stopBannerAutoplay() {
            if (bannerInterval) {
                clearInterval(bannerInterval);
                bannerInterval = null;
            }
        }
        document.addEventListener('DOMContentLoaded', () => {
            fetchProducts(); vwStartSafetyTimer();
            // Load banners as well
            if (typeof fetchBanners === 'function') fetchBanners();
            // Pause autoplay on hover
            const carousel = document.getElementById('bannerCarousel');
            if (carousel) {
                carousel.addEventListener('mouseenter', stopBannerAutoplay);
                carousel.addEventListener('mouseleave', startBannerAutoplay);
            }
            window.addEventListener('scroll', () => {
                const currentScrollTop = document.scrollingElement?.scrollTop ?? window.scrollY;
                document.getElementById('mainHeader')?.classList.toggle('scrolled', currentScrollTop > 50);
                document.getElementById('backToTop')?.classList.toggle('visible', currentScrollTop > 300);
                updateActiveQuickLink();
            });
            document.getElementById('backToTop')?.addEventListener('click', (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
            document.getElementById('mobileMenuBtn')?.addEventListener('click', function () { document.getElementById('navMenu')?.classList.toggle('active'); document.getElementById('cartSidebar')?.classList.remove('active'); });
            document.getElementById('cartBtn')?.addEventListener('click', function () { document.getElementById('cartSidebar')?.classList.toggle('active'); document.getElementById('navMenu')?.classList.remove('active'); if (document.getElementById('cartSidebar')?.classList.contains('active')) updateCartSidebar(); });
            document.getElementById('cartClose')?.addEventListener('click', () => document.getElementById('cartSidebar')?.classList.remove('active'));
            document.getElementById('cartCheckout')?.addEventListener('click', () => { if (cart.length === 0) { showToast('السلة فارغة!', 'error'); return; } window.location.href = '/order/'; });
            window.addEventListener('vwAddToCart', () => { updateCartCount(); updateCartSidebar(); });
            document.addEventListener('click', (e) => { 
                if (window.preventCartClose) return; 
                const sidebar = document.getElementById('cartSidebar'), 
                      cartBtn = document.getElementById('cartBtn'), 
                      confirmModal = document.getElementById('confirmationModal'),
                      modalContent = confirmModal?.querySelector('.confirmation-content');
                
                // Close cart if clicking outside
                if (sidebar?.classList.contains('active') && !sidebar.contains(e.target) && !cartBtn?.contains(e.target) && !confirmModal?.classList.contains('active')) {
                    sidebar.classList.remove('active');
                }
                
                // Close modal if clicking on backdrop (outside the content)
                if (confirmModal?.classList.contains('active') && e.target === confirmModal) {
                    cancelDelete();
                }
            });
            document.querySelectorAll('.quick-link').forEach(link => link.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                const categoryName = this.dataset.category;
                activeFilters[categoryName] = 'الكل';
                renderCategory(categoryName);
                scrollToCategory(categoryName);
            }));
            document.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', () => document.getElementById('navMenu')?.classList.remove('active')));
            document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeBundleDetails(); } });

            // ⚡ Exit Popup + Mobile Visibility
            window.addEventListener('beforeunload', function (e) { const currentCart = JSON.parse(localStorage.getItem('qoffaCart')) || []; if (currentCart.some(item => item.isVariableWeight) && !vwExitConfirmed) { e.preventDefault(); e.returnValue = ''; } });
            document.addEventListener('visibilitychange', function () { if (document.hidden) { const currentCart = JSON.parse(localStorage.getItem('qoffaCart')) || []; if (currentCart.some(item => item.isVariableWeight)) { localStorage.setItem('vw_left_at', Date.now().toString()); } } else { vwCheckSafetyTimeout(); } });

            if (typeof AOS !== 'undefined') AOS.init({ duration: 800, once: true });
        });

        function updateActiveQuickLink() { const sections = document.querySelectorAll('.category-section'), quickLinks = document.querySelectorAll('.quick-link'); let cs = null, mva = 0; sections.forEach(s => { const r = s.getBoundingClientRect(), hh = 150; if (r.top < window.innerHeight && r.bottom > 0) { const va = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, hh); if (va > mva) { mva = va; cs = s.id; } } }); if (cs) quickLinks.forEach(l => { l.classList.toggle('active', l.dataset.category === cs); }); }

        // ==================== GLOBAL EXPORTS ====================
        window.showToast = showToast; window.updateCartSidebar = updateCartSidebar; window.updateCartCount = updateCartCount;
        window.cancelDelete = cancelDelete; window.confirmProductDelete = confirmProductDelete; window.showConfirmationModal = showConfirmationModal;
        window.isVariableWeightItem = isVariableWeightItem; window.openWeightPopup = openWeightPopup; window.closeWeightPopup = closeWeightPopup;
        window.addVariableWeightToCart = addVariableWeightToCart; window.vwSyncWithBaserow = vwSyncWithBaserow;
        window.vwReturnWeightToBaserow = vwReturnWeightToBaserow; window.vwReturnAllWeights = vwReturnAllWeights;
        window.vwShowExitPopup = vwShowExitPopup;
        window.openBundleDetails = openBundleDetails; window.closeBundleDetails = closeBundleDetails;
        window.bundlesCarouselMove = bundlesCarouselMove; window.viewBundleDetails = viewBundleDetails;
    
