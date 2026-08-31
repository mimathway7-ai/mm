/* Bundles Carousel - Blackhole Design JavaScript */

class BlackholeCarousel {
  constructor(carouselSelector, sceneSelector) {
    this.carousel = document.querySelector(carouselSelector);
    this.scene = document.querySelector(sceneSelector);
    this.currentIndex = 0;
    this.wrappers = this.scene?.querySelectorAll('.blackhole-slide-wrapper') || [];
    
    if (!this.carousel || !this.scene) {
      console.error('Carousel or scene element not found');
      return;
    }

    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    const prevBtn = this.carousel.querySelector('.blackhole-prev');
    const nextBtn = this.carousel.querySelector('.blackhole-next');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.move(-1));
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.move(1));
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.move(-1);
      if (e.key === 'ArrowRight') this.move(1);
    });
  }

  move(direction) {
    this.currentIndex = (this.currentIndex + direction + this.wrappers.length) % this.wrappers.length;
    this.updateCarousel();
  }

  updateCarousel() {
    this.wrappers.forEach((el, i) => {
      const diff = (i - this.currentIndex + this.wrappers.length) % this.wrappers.length;

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

  getCurrentBundle() {
    return this.wrappers[this.currentIndex];
  }

  getTotalBundles() {
    return this.wrappers.length;
  }

  goToSlide(index) {
    if (index >= 0 && index < this.wrappers.length) {
      this.currentIndex = index;
      this.updateCarousel();
    }
  }
}

// Legacy function for backward compatibility (if HTML uses onclick)
function blackholeMove(n, sceneId, carouselId) {
  const scene = document.getElementById(sceneId);
  const wrappers = scene.querySelectorAll('.blackhole-slide-wrapper');
  
  // Store index on carousel element if not exists
  const carousel = document.getElementById(carouselId);
  if (!carousel.dataset.index) {
    carousel.dataset.index = 0;
  }

  let index = parseInt(carousel.dataset.index);
  index = (index + n + wrappers.length) % wrappers.length;
  carousel.dataset.index = index;

  wrappers.forEach((el, i) => {
    const diff = (i - index + wrappers.length) % wrappers.length;
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

// Auto-initialize all carousels on page load
document.addEventListener('DOMContentLoaded', function() {
  // Find all carousels and initialize them
  document.querySelectorAll('.blackhole-carousel').forEach((carousel) => {
    const carouselId = carousel.id;
    const sceneId = carousel.querySelector('.blackhole-scene')?.id;

    if (carouselId && sceneId) {
      // Create instance and store it
      const instance = new BlackholeCarousel(`#${carouselId}`, `#${sceneId}`);
      carousel.dataset.carouselInstance = instance;
    }
  });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BlackholeCarousel;
}
