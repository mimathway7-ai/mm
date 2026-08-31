// ==================== ABOUT PAGE SPECIFIC FUNCTIONS ====================

// إعداد تأثيرات التمرير للعناصر
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate__animated', 'animate__fadeInUp');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // مراقبة العناصر لإضافة التأثيرات
    const elements = document.querySelectorAll(
        '.model-step, .value-card, .team-member, .timeline-item'
    );
    elements.forEach(el => observer.observe(el));
}

// إضافة تأثير Ripple على الأزرار
function setupRippleEffect() {
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.7);
                transform: scale(0);
                animation: ripple-animation 0.6s linear;
                width: ${size}px;
                height: ${size}px;
                top: ${y}px;
                left: ${x}px;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
}

// إضافة تأثيرات حركة للعناصر
function setupHoverAnimations() {
    // تأثيرات على بطاقات القيم
    document.querySelectorAll('.value-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // تأثيرات على أعضاء الفريق
    document.querySelectorAll('.team-member').forEach(member => {
        member.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.member-image i');
            if (icon) {
                icon.style.transform = 'scale(1.1)';
                icon.style.transition = 'transform 0.3s ease';
            }
        });
        member.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.member-image i');
            if (icon) {
                icon.style.transform = 'scale(1)';
            }
        });
    });
}

// إضافة أنيميشن الريبل إلى CSS
function addRippleAnimation() {
    const rippleStyle = document.createElement('style');
    rippleStyle.textContent = `
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(rippleStyle);
}

// إضافة تأثيرات التمرير السلس
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // إخفاء اللودر بعد التحميل
    const loader = document.getElementById('loader');
    if (loader) {
        setTimeout(() => {
            loader.classList.remove('active');
        }, 500);
    }
    
    // إعداد التأثيرات
    setupScrollAnimations();
    setupRippleEffect();
    setupHoverAnimations();
    setupSmoothScroll();
    addRippleAnimation();
    
    // إضافة تأثير فتح القائمة المتنقلة
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    
    if (mobileMenuBtn && navMenu) {
        // إزالة أي listeners قديمة
        const newMobileMenuBtn = mobileMenuBtn.cloneNode(true);
        mobileMenuBtn.parentNode.replaceChild(newMobileMenuBtn, mobileMenuBtn);
        
        // إضافة الـ listener الجديد
        newMobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            newMobileMenuBtn.innerHTML = navMenu.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
    }
    
    // إغلاق القائمة عند النقر على رابط
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu) navMenu.classList.remove('active');
            if (mobileMenuBtn) mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        });
    });
    
    // تأثير التمرير على الهيدر
    const header = document.getElementById('mainHeader');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
    
    // زر العودة للأعلى
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        backToTop.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });
    }
});