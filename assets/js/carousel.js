/**
 * ============================================================
 * QOFFA SMART CAROUSEL – Module principal
 * ============================================================
 */

class QoffaCarousel {
    /**
     * @param {string|Element} container - Sélecteur ou élément DOM du conteneur
     * @param {Object} options - Options de configuration
     */
    constructor(container, options = {}) {
        // Éléments DOM
        this.container = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
        
        if (!this.container) {
            console.error('❌ Carousel container not found');
            return;
        }

        // Configuration
        this.options = {
            autoplay: true,
            interval: 5500,
            morphTransition: true,
            ...options
        };

        // État
        this.slides = [];
        this.currentIndex = 0;
        this.isAnimating = false;
        this.isPaused = false;
        this.autoPlayInterval = null;
        this.totalSlides = 0;

        // Initialisation
        this.init();
    }

    /**
     * Initialise le carousel
     */
    init() {
        // Récupère les slides
        this.slides = this.container.querySelectorAll('.q-carousel__slide');
        this.totalSlides = this.slides.length;

        if (this.totalSlides === 0) {
            console.warn('⚠️ Aucune slide trouvée');
            return;
        }

        // Active la première slide
        this.slides.forEach((slide, i) => {
            slide.classList.toggle('q-carousel__slide--active', i === 0);
        });

        // Initialise les contrôles
        this.initControls();

        // Démarre l'autoplay
        if (this.options.autoplay) {
            this.startAutoplay();
        }

        console.log(`✅ Carousel initialisé avec ${this.totalSlides} slides`);
    }

    /**
     * Initialise les contrôles (dots, boutons)
     */
    initControls() {
        // Dots
        const dotsContainer = this.container.querySelector('.q-carousel__dots');
        if (dotsContainer) {
            dotsContainer.innerHTML = '';
            this.slides.forEach((_, i) => {
                const dot = document.createElement('button');
                dot.className = 'q-carousel__dot' + (i === 0 ? ' q-carousel__dot--active' : '');
                dot.setAttribute('aria-label', `Aller à la slide ${i + 1}`);
                dot.addEventListener('click', () => this.goTo(i));
                dotsContainer.appendChild(dot);
            });
            this.dots = dotsContainer.querySelectorAll('.q-carousel__dot');
        }

        // Boutons précédent/suivant
        const prevBtn = this.container.querySelector('.q-carousel__btn--prev');
        const nextBtn = this.container.querySelector('.q-carousel__btn--next');

        if (prevBtn) prevBtn.addEventListener('click', () => { this.prev();
            this.resetAutoplay(); });
        if (nextBtn) nextBtn.addEventListener('click', () => { this.next();
            this.resetAutoplay(); });

        // Counter
        this.counter = this.container.querySelector('.q-carousel__counter');

        // Mise à jour initiale
        this.updateUI();

        // Pause au hover
        this.container.addEventListener('mouseenter', () => this.pause());
        this.container.addEventListener('mouseleave', () => this.resume());

        // Navigation clavier
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') { this.next();
                this.resetAutoplay(); }
            if (e.key === 'ArrowLeft') { this.prev();
                this.resetAutoplay(); }
        });
    }

    /**
     * Va à une slide spécifique
     */
    goTo(index) {
        if (this.isAnimating || index === this.currentIndex) return;
        if (index < 0) index = this.totalSlides - 1;
        if (index >= this.totalSlides) index = 0;

        this.isAnimating = true;

        const currentSlide = this.slides[this.currentIndex];
        const nextSlide = this.slides[index];

        // Transition Morph
        if (this.options.morphTransition) {
            // Slide sortante : animation EXIT
            currentSlide.classList.add('q-carousel__slide--exit');
            currentSlide.classList.remove('q-carousel__slide--active');

            // Après l'animation de sortie
            setTimeout(() => {
                currentSlide.classList.remove('q-carousel__slide--exit');
                nextSlide.classList.add('q-carousel__slide--active');

                this.currentIndex = index;
                this.updateUI();
                this.isAnimating = false;
            }, 400);
        } else {
            // Transition simple
            currentSlide.classList.remove('q-carousel__slide--active');
            nextSlide.classList.add('q-carousel__slide--active');
            this.currentIndex = index;
            this.updateUI();
            this.isAnimating = false;
        }

        this.resetAutoplay();
    }

    /**
     * Slide suivante
     */
    next() {
        this.goTo(this.currentIndex + 1);
    }

    /**
     * Slide précédente
     */
    prev() {
        this.goTo(this.currentIndex - 1);
    }

    /**
     * Met à jour l'interface (dots, counter)
     */
    updateUI() {
        // Dots
        if (this.dots) {
            this.dots.forEach((dot, i) => {
                dot.classList.toggle('q-carousel__dot--active', i === this.currentIndex);
            });
        }

        // Counter
        if (this.counter) {
            this.counter.innerHTML = `
                ${String(this.currentIndex + 1).padStart(2, '0')} 
                <span>/ ${this.totalSlides}</span>
            `;
        }
    }

    /**
     * Démarre l'autoplay
     */
    startAutoplay() {
        if (this.autoPlayInterval) clearInterval(this.autoPlayInterval);
        this.autoPlayInterval = setInterval(() => {
            if (!this.isPaused) {
                this.next();
            }
        }, this.options.interval);
    }

    /**
     * Réinitialise l'autoplay
     */
    resetAutoplay() {
        if (this.options.autoplay) {
            if (this.autoPlayInterval) {
                clearInterval(this.autoPlayInterval);
                this.startAutoplay();
            }
        }
    }

    /**
     * Met en pause l'autoplay
     */
    pause() {
        this.isPaused = true;
    }

    /**
     * Reprend l'autoplay
     */
    resume() {
        this.isPaused = false;
    }

    /**
     * Détruit l'instance (nettoyage)
     */
    destroy() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
        console.log('🗑️ Carousel détruit');
    }
}

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QoffaCarousel;
}