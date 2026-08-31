// ==================== HOME PAGE SPECIFIC FUNCTIONS ====================

// Auto-slide animation for hero title
function initHeroTitleAnimation() {
    const heroTitle = document.querySelector('.hero-title');
    if (!heroTitle) return;
    
    const texts = [
        'نوصل طلباتك باحترافية في الدار البيضاء',
        'منتجات عضوية طازجة يومياً',
        'توصيل سريع وآمن لمنزلك'
    ];
    let index = 0;
    
    setInterval(() => {
        index = (index + 1) % texts.length;
        heroTitle.classList.remove('animate__fadeInDown');
        void heroTitle.offsetWidth; // Force reflow
        heroTitle.textContent = texts[index];
        heroTitle.classList.add('animate__fadeInDown');
    }, 5000);
}

// Initialize all home page components
document.addEventListener('DOMContentLoaded', function() {
    initHeroTitleAnimation();
    
    // Smooth scroll for anchor links
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
});