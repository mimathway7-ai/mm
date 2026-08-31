// ==================== BASEROW CONFIGURATION ====================
// Using the public grid URL endpoint instead of API
const BASEROW_FORM_URL = 'https://baserow.io/database/377261/table/908045/1785668/';
const BASEROW_API_TOKEN = 'OIEan8aAjLjoCoTXKO6Evd4cifbtqRf8';
const BASEROW_API_URL = 'https://api.baserow.io/api/database/rows/table/908045/?user_field_names=true';

// ==================== CONTACT FORM CLASS ====================
class ContactForm {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.submitBtn = this.form.querySelector('.btn-submit');
        this.init();
    }
    
    init() {
        if (!this.form) return;
        
        // ملء التاريخ الحالي تلقائياً في الحقل المخفي
        const today = new Date();
        const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
        const dateField = document.getElementById('submissionDate');
        if (dateField) {
            dateField.value = dateString;
            console.log('📅 تاريخ اليوم:', dateString);
        }
        
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.setupValidation();
    }
    
    setupValidation() {
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearError(input));
        });
    }
    
    validateField(field) {
        if (!field.required && !field.value.trim()) return true;
        
        let isValid = true;
        let message = '';
        
        switch(field.id) {
            case 'name':
                if (field.value.trim().length < 3) {
                    isValid = false;
                    message = 'الاسم يجب أن يكون على الأقل 3 أحرف';
                }
                break;
            
            case 'phone':
                const phoneRegex = /^[0-9]{10,15}$/;
                if (!phoneRegex.test(field.value.replace(/\s/g, ''))) {
                    isValid = false;
                    message = 'رقم الهاتف غير صحيح (يجب أن يكون 10-15 رقم)';
                }
                break;
            
            case 'email':
                if (field.value && !this.validateEmail(field.value)) {
                    isValid = false;
                    message = 'البريد الإلكتروني غير صحيح';
                }
                break;
            
            case 'message':
                if (field.value.trim().length < 20) {
                    isValid = false;
                    message = 'الرسالة يجب أن تكون على الأقل 20 حرفاً';
                }
                break;
            
            case 'subject':
                if (!field.value) {
                    isValid = false;
                    message = 'الرجاء اختيار موضوع الرسالة';
                }
                break;
        }
        
        if (!isValid) {
            this.showFieldError(field, message);
        } else {
            this.showFieldSuccess(field);
        }
        
        return isValid;
    }
    
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    showFieldError(field, message) {
        field.classList.remove('success');
        field.classList.add('error');
        
        let errorElement = field.nextElementSibling;
        if (!errorElement || !errorElement.classList.contains('error-message')) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.style.cssText = `
                color: var(--error, #dc3545);
                font-size: 0.9rem;
                margin-top: 5px;
                display: flex;
                align-items: center;
                gap: 5px;
            `;
            errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
            field.parentNode.insertBefore(errorElement, field.nextSibling);
        } else {
            errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        }
    }
    
    showFieldSuccess(field) {
        field.classList.remove('error');
        field.classList.add('success');
        
        const errorElement = field.nextElementSibling;
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.remove();
        }
    }
    
    clearError(field) {
        field.classList.remove('error', 'success');
        const errorElement = field.nextElementSibling;
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.remove();
        }
    }
    
    validateForm() {
        const fields = this.form.querySelectorAll('input, textarea, select');
        let isValid = true;
        
        fields.forEach(field => {
            if (field.required || field.value.trim()) {
                if (!this.validateField(field)) {
                    isValid = false;
                }
            }
        });
        
        return isValid;
    }
    
    getFormData() {
        return {
            'Nom Complet': document.getElementById('name').value.trim(),
            'Téléphone': document.getElementById('phone').value.trim(),
            'Email': document.getElementById('email').value.trim() || '',
            'Sujet': document.getElementById('subject').value,
            'Message': document.getElementById('message').value.trim(),
            'Newsletter': document.getElementById('newsletter')?.checked || false,
            'Statut': 'جديد',
            'Date de Soumission': document.getElementById('submissionDate').value
        };
    }
    
    setLoading(loading) {
        if (loading) {
            this.submitBtn.classList.add('loading');
            this.submitBtn.disabled = true;
        } else {
            this.submitBtn.classList.remove('loading');
            this.submitBtn.disabled = false;
        }
    }
    
    clearForm() {
        this.form.reset();
        const fields = this.form.querySelectorAll('input, textarea, select');
        fields.forEach(field => field.classList.remove('error', 'success'));
        const errors = this.form.querySelectorAll('.error-message');
        errors.forEach(error => error.remove());
    }
    
    showNotification(message, type = 'success') {
        const container = document.getElementById('notificationContainer');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            padding: 15px 20px;
            margin: 10px;
            border-radius: 5px;
            background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
            color: ${type === 'success' ? '#155724' : '#721c24'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'};
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease-out;
        `;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
    
    async submitToBaserow(data) {
        try {
            console.log('%c📤 إرسال إلى Baserow', 'color: blue; font-size: 14px; font-weight: bold');
            
            // بيانات كاملة مع التاريخ
            const payload = {
                'Nom Complet': String(data['Nom Complet'] || '').trim(),
                'Téléphone': String(data['Téléphone'] || '').trim(),
                'Email': String(data['Email'] || '').trim(),
                'Sujet': String(data['Sujet'] || '').trim(),
                'Message': String(data['Message'] || '').trim(),
                'Newsletter': Boolean(data['Newsletter']),
                'Statut': 'جديد',
                'Date de Soumission': String(data['Date de Soumission'] || '')
            };
            
            console.log('%c✏️ البيانات المرسلة:', 'color: #2196F3; font-weight: bold');
            console.table(payload);
            
            const response = await fetch(BASEROW_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${BASEROW_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            const responseText = await response.text();
            
            console.log('%c📡 رد Server:', response.ok ? 'color: #4CAF50; font-weight: bold' : 'color: #F44336; font-weight: bold');
            console.log('HTTP Status:', response.status);
            
            if (responseText) {
                try {
                    const json = JSON.parse(responseText);
                    console.log('Response JSON:', json);
                } catch (e) {
                    console.log('Response (raw):', responseText);
                }
            }
            
            if (!response.ok) {
                console.error('%c❌ فشل HTTP ' + response.status, 'color: #F44336; font-weight: bold; font-size: 14px');
                throw new Error(`فشل الإرسال: HTTP ${response.status}`);
            }
            
            console.log('%c✅ تم حفظ البيانات بنجاح في Baserow!', 'color: #4CAF50; font-weight: bold; font-size: 14px');
            return responseText ? JSON.parse(responseText) : { success: true };
            
        } catch (error) {
            console.error('%c❌ خطأ في الإرسال:', 'color: #F44336; font-weight: bold; font-size: 14px');
            console.error('المشكلة:', error.message);
            throw error;
        }
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            this.showNotification('الرجاء تصحيح الأخطاء في النموذج', 'error');
            return;
        }
        
        this.setLoading(true);
        
        try {
            const formData = this.getFormData();
            await this.submitToBaserow(formData);
            
            this.showNotification('تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.', 'success');
            this.clearForm();
        } catch (error) {
            console.error('خطأ:', error);
            this.showNotification('حدث خطأ أثناء إرسال الرسالة. الرجاء المحاولة مرة أخرى.', 'error');
        } finally {
            this.setLoading(false);
        }
    }
}

// ==================== FAQ ACCORDION ====================
class FAQAccordion {
    constructor() {
        this.items = document.querySelectorAll('.faq-item');
        this.init();
    }
    
    init() {
        if (!this.items.length) {
            console.warn('⚠️ No FAQ items found');
            return;
        }
        
        console.log(`✅ Initializing FAQ with ${this.items.length} items`);
        
        this.items.forEach((item, index) => {
            const question = item.querySelector('.faq-question');
            if (!question) {
                console.warn(`⚠️ FAQ item ${index} has no .faq-question element`);
                return;
            }
            
            // Ensure cursor pointer
            question.style.cursor = 'pointer';
            question.style.userSelect = 'none';
            
            // Add click listener with proper context binding
            question.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleItem(item);
            });
            
            console.log(`✅ Attached click listener to FAQ item ${index + 1}`);
        });
    }
    
    toggleItem(item) {
        const isActive = item.classList.contains('active');
        
        // Close all other items
        this.items.forEach(i => {
            if (i !== item) {
                i.classList.remove('active');
            }
        });
        
        // Toggle current item
        if (isActive) {
            item.classList.remove('active');
            console.log('FAQ collapsed');
        } else {
            item.classList.add('active');
            console.log('FAQ expanded');
        }
    }
}

// ==================== MAP INITIALIZATION ====================
function initMap() {
    if (!document.getElementById('contactMap')) return;
    
    // Mapbox configuration
    mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';
    
    const map = new mapboxgl.Map({
        container: 'contactMap',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-6.8498, 34.0209], // Rabat, Morocco
        zoom: 12,
        pitch: 45,
        bearing: -17.6
    });
    
    map.on('load', () => {
        // Add marker
        new mapboxgl.Marker({
            color: '#2E8B57',
            scale: 1.2
        })
        .setLngLat([-6.8498, 34.0209])
        .setPopup(new mapboxgl.Popup().setHTML(`
            <div style="padding: 15px;">
                <h3 style="margin: 0 0 10px; color: #2E8B57;">Qoffa Smart HQ</h3>
                <p style="margin: 5px 0;">الرباط، المغرب</p>
                <p style="margin: 5px 0;"><i class="fas fa-phone"></i> +212 668-676565</p>
            </div>
        `))
        .addTo(map);
        
        map.addControl(new mapboxgl.NavigationControl());
        map.addControl(new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserHeading: true
        }));
    });
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Map
    try {
        initMap();
    } catch (error) {
        console.log('Map initialization failed:', error);
    }
    
    // Initialize Components
    new ContactForm();
    new FAQAccordion();
    
    // Add ripple animation to CSS
    const rippleStyle = document.createElement('style');
    rippleStyle.textContent = `
        @keyframes ripple-animation {
            to { transform: scale(4); opacity: 0; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(rippleStyle);
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
});