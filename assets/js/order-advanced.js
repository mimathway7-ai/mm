// ===== ORDER PAGE ENHANCED JAVASCRIPT =====
// Script pour améliorer l'interactivité de la page de commande

// Document Ready
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialiser les animations AOS
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true
        });
    }
    
    // Améliorer les animations des formulaires
    enhanceFormAnimations();
    
    // Améliorer les interactions des cartes
    enhanceCardInteractions();
    
    // Smooth number updates
    enhanceNumberAnimations();
    
    // Améliorer les inputs
    enhanceInputs();
    
    // Scroll animations
    enhanceScrollAnimations();
});

/**
 * Améliorer les animations des formulaires
 */
function enhanceFormAnimations() {
    const formGroups = document.querySelectorAll('.form-group');
    
    formGroups.forEach((group, index) => {
        // Ajouter des délais d'animation
        group.style.animationDelay = `${index * 0.1}s`;
        
        // Ajouter des interactions au focus
        const input = group.querySelector('input, select, textarea');
        if (input) {
            input.addEventListener('focus', function() {
                group.classList.add('focused');
            });
            
            input.addEventListener('blur', function() {
                group.classList.remove('focused');
            });
        }
    });
}

/**
 * Améliorer les interactions des cartes
 */
function enhanceCardInteractions() {
    const cards = document.querySelectorAll('.order-summary-card, .order-form-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.classList.add('hovered');
        });
        
        card.addEventListener('mouseleave', function() {
            this.classList.remove('hovered');
        });
    });
}

/**
 * Améliorer les animations des nombres
 */
function enhanceNumberAnimations() {
    const numberElements = [
        { selector: '#subtotalAmount', prefix: '' },
        { selector: '#deliveryAmount', prefix: '' },
        { selector: '#totalAmount', prefix: '' },
        { selector: '.cart-count', prefix: '' }
    ];
    
    numberElements.forEach(el => {
        const element = document.querySelector(el.selector);
        if (element) {
            element.addEventListener('DOMSubtreeModified', function() {
                this.style.animation = 'none';
                setTimeout(() => {
                    this.style.animation = 'fadeInScale 0.3s ease-out';
                }, 10);
            });
        }
    });
}

/**
 * Améliorer les interactions des inputs
 */
function enhanceInputs() {
    const inputs = document.querySelectorAll('.form-control');
    
    inputs.forEach(input => {
        // Valider en temps réel
        input.addEventListener('change', function() {
            validateInput(this);
        });
        
        // Valider aussi au blur
        input.addEventListener('blur', function() {
            validateInput(this);
        });
        
        // Ajouter un petit feedback visuel
        input.addEventListener('input', function() {
            if (this.value.trim()) {
                this.parentElement.classList.add('has-value');
            } else {
                this.parentElement.classList.remove('has-value');
            }
        });
    });
}

/**
 * Valider un input
 */
function validateInput(input) {
    const formGroup = input.closest('.form-group');
    
    if (!formGroup) return;
    
    // Supprimer les messages d'erreur précédents
    const existingError = formGroup.querySelector('.error-message');
    if (existingError) existingError.remove();
    
    let isValid = true;
    let errorMessage = '';
    
    // Validations
    if (input.required && !input.value.trim()) {
        isValid = false;
        errorMessage = 'Ce champ est obligatoire';
    } else if (input.type === 'email' && input.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.value)) {
            isValid = false;
            errorMessage = 'Email invalide';
        }
    } else if (input.type === 'tel' && input.value) {
        const phoneRegex = /^[0-9\s\-\+\(\)]+$/;
        if (!phoneRegex.test(input.value)) {
            isValid = false;
            errorMessage = 'Numéro de téléphone invalide';
        }
    }
    
    if (isValid) {
        formGroup.classList.remove('error');
        formGroup.classList.add('success');
    } else {
        formGroup.classList.remove('success');
        formGroup.classList.add('error');
        
        if (errorMessage) {
            const errorEl = document.createElement('small');
            errorEl.className = 'error-message';
            errorEl.style.color = '#FF5252';
            errorEl.style.marginTop = '5px';
            errorEl.style.display = 'block';
            errorEl.textContent = errorMessage;
            input.after(errorEl);
        }
    }
}

/**
 * Améliorer les animations au scroll
 */
function enhanceScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            }
        });
    }, observerOptions);
    
    // Observer les éléments animables
    document.querySelectorAll('.product-card, .order-item').forEach(el => {
        observer.observe(el);
    });
}

/**
 * Améliorer les interactions des boutons
 */
function enhanceButtonInteractions() {
    const buttons = document.querySelectorAll('.btn, .add-to-cart');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Créer un effet ripple
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            // Supprimer le ripple précédent s'il existe
            const oldRipple = this.querySelector('.ripple');
            if (oldRipple) oldRipple.remove();
            
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
}

/**
 * Améliorer le feedback de la commande
 */
function enhanceOrderFeedback() {
    const form = document.getElementById('orderForm');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Valider tous les champs
            let isFormValid = true;
            this.querySelectorAll('.form-control[required]').forEach(input => {
                validateInput(input);
                if (input.value.trim() === '') {
                    isFormValid = false;
                }
            });
            
            if (isFormValid) {
                // Afficher un message de succès
                showSuccessMessage();
            } else {
                // Scroller vers le premier erreur
                const firstError = this.querySelector('.error .form-control');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstError.focus();
                }
            }
        });
    }
}

/**
 * Afficher un message de succès
 */
function showSuccessMessage() {
    const message = document.createElement('div');
    message.className = 'success-message';
    message.innerHTML = `
        <div style="background: linear-gradient(135deg, #4CAF50, #2E8B57); color: white; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center; box-shadow: 0 8px 25px rgba(46,139,87,0.3);">
            <i class="fas fa-check-circle" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
            <h3 style="margin: 10px 0; font-size: 1.3rem;">شكراً لك!</h3>
            <p style="margin: 8px 0; opacity: 0.9;">سيتم معالجة طلبك قريباً</p>
        </div>
    `;
    
    const form = document.getElementById('orderForm');
    form.before(message);
    
    // Scroller vers le message
    message.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Supprimer le message après 5 secondes
    setTimeout(() => {
        message.style.opacity = '0';
        message.style.transition = 'opacity 0.5s ease-out';
        setTimeout(() => message.remove(), 500);
    }, 5000);
}

/**
 * Améliorer les cartes produits suggérées
 */
function enhanceProductCards() {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-15px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

/**
 * Ajouter des raccourcis clavier
 */
function addKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + S pour soumettre le formulaire
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const form = document.getElementById('orderForm');
            if (form) form.dispatchEvent(new Event('submit'));
        }
        
        // Escape pour fermer les overlays
        if (e.key === 'Escape') {
            const overlays = document.querySelectorAll('.overlay');
            overlays.forEach(overlay => {
                if (overlay.style.display !== 'none') {
                    overlay.style.display = 'none';
                }
            });
        }
    });
}

/**
 * Améliorer le performance et l'accessibilité
 */
function improveAccessibility() {
    // Ajouter des labels pour les inputs non labelisés
    const inputs = document.querySelectorAll('.form-control:not([aria-label])');
    
    inputs.forEach((input, index) => {
        if (!input.getAttribute('aria-label')) {
            const label = input.previousElementSibling;
            if (label && label.classList.contains('form-label')) {
                input.setAttribute('aria-label', label.textContent.trim());
            }
        }
    });
    
    // Ajouter des attributs ARIA aux boutons
    document.querySelectorAll('.btn').forEach(btn => {
        if (!btn.getAttribute('role')) {
            btn.setAttribute('role', 'button');
        }
    });
}

// Initialiser à nouveau si le contenu est chargé dynamiquement
document.addEventListener('page:loaded', function() {
    enhanceFormAnimations();
    enhanceCardInteractions();
    enhanceProductCards();
    enhanceButtonInteractions();
    enhanceOrderFeedback();
    improveAccessibility();
});

// Initialiser tous les améliorements
window.addEventListener('load', function() {
    enhanceProductCards();
    enhanceButtonInteractions();
    enhanceOrderFeedback();
    improveAccessibility();
    addKeyboardShortcuts();
});
