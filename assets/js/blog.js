// ==================== BLOG PAGE SPECIFIC FUNCTIONS ====================

// Countdown Timer (30 days from now) - Optimized for performance
function initCountdown() {
    const countdownDate = new Date();
    countdownDate.setDate(countdownDate.getDate() + 30);
    
    const elements = {
        days: document.getElementById('countdownDays'),
        hours: document.getElementById('countdownHours'),
        minutes: document.getElementById('countdownMinutes'),
        seconds: document.getElementById('countdownSeconds')
    };
    
    let lastUpdate = 0;
    const updateInterval = 1000; // Update every second
    
    function updateCountdown(currentTime) {
        if (currentTime - lastUpdate >= updateInterval) {
            const now = new Date().getTime();
            const distance = countdownDate - now;
            
            if (distance < 0) {
                Object.values(elements).forEach(el => el.textContent = '0');
                return;
            }
            
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            // Only update DOM if values changed
            if (elements.days.textContent !== days.toString()) {
                elements.days.textContent = days;
                elements.days.style.animation = 'none';
                elements.days.offsetHeight; // Trigger reflow
                elements.days.style.animation = 'numberChange 0.3s ease';
            }
            if (elements.hours.textContent !== hours.toString()) {
                elements.hours.textContent = hours;
                elements.hours.style.animation = 'none';
                elements.hours.offsetHeight;
                elements.hours.style.animation = 'numberChange 0.3s ease';
            }
            if (elements.minutes.textContent !== minutes.toString()) {
                elements.minutes.textContent = minutes;
                elements.minutes.style.animation = 'none';
                elements.minutes.offsetHeight;
                elements.minutes.style.animation = 'numberChange 0.3s ease';
            }
            if (elements.seconds.textContent !== seconds.toString()) {
                elements.seconds.textContent = seconds;
                elements.seconds.style.animation = 'none';
                elements.seconds.offsetHeight;
                elements.seconds.style.animation = 'numberChange 0.3s ease';
            }
            
            lastUpdate = currentTime;
        }
        
        requestAnimationFrame(updateCountdown);
    }
    
    // Initial update
    updateCountdown(0);
}

// Newsletter Form Submission
function setupNewsletterForm() {
    const form = document.getElementById('newsletterForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = form.querySelector('input[type="email"]').value;
        
        if (!email || !email.includes('@')) {
            showToast('الرجاء إدخال بريد إلكتروني صحيح', 'error');
            return;
        }
        
        showToast('شكراً لتسجيلك! سنرسل لك آخر التحديثات', 'success');
        form.reset();
    });
}

// Notify Form Submission
function setupNotifyForm() {
    const form = document.getElementById('notifyForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = form.querySelector('input[type="email"]').value;
        
        if (!email || !email.includes('@')) {
            showToast('الرجاء إدخال بريد إلكتروني صحيح', 'error');
            return;
        }
        
        showToast('تم التسجيل! سنخبرك عند إطلاق المدونة', 'success');
        form.reset();
    });
}

// Category Chips - Disabled for now (coming soon)
function setupCategoryChips() {
    const chips = document.querySelectorAll('.category-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('المدونة قيد الإعداد حالياً، قريباً جداً', 'info');
        });
    });
}

// Search Functionality
function setupSearch() {
    const searchBtn = document.querySelector('.hero-search button');
    const searchInput = document.querySelector('.hero-search input');
    
    if (!searchBtn || !searchInput) return;
    
    const handleSearch = () => {
        const query = searchInput.value.trim();
        if (query) {
            showToast(`البحث عن "${query}" - المدونة قيد الإعداد حالياً`, 'info');
        } else {
            showToast('الرجاء إدخال كلمة بحث', 'warning');
        }
    };
    
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
}

// Initialize Blog Page
function initBlogPage() {
    initCountdown();
    setupNewsletterForm();
    setupNotifyForm();
    setupCategoryChips();
    setupSearch();
}

// Make functions available globally
window.initBlogPage = initBlogPage;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initBlogPage();
    
    // Update AOS after page load
    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 800, once: true });
    }
});