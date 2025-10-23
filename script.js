// Clase para manejar la presentación
class PipelinePresentation {
    constructor() {
        this.currentSlide = 1;
        this.totalSlides = document.querySelectorAll('.slide').length;
        this.slides = document.querySelectorAll('.slide');
        this.isAnimating = false;
        
        this.initializeElements();
        this.createIndicators();
        this.attachEventListeners();
        this.updateUI();
    }
    
    initializeElements() {
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.slideCounter = document.getElementById('slideCounter');
        this.progressFill = document.getElementById('progressFill');
        this.slideIndicators = document.getElementById('slideIndicators');
        
        // Asegurar que solo la primera diapositiva esté activa
        this.slides.forEach((slide, index) => {
            slide.classList.remove('active');
            if (index === 0) {
                slide.classList.add('active');
            }
        });
    }
    
    createIndicators() {
        this.slideIndicators.innerHTML = '';
        for (let i = 1; i <= this.totalSlides; i++) {
            const indicator = document.createElement('div');
            indicator.className = `indicator ${i === 1 ? 'active' : ''}`;
            indicator.addEventListener('click', () => this.goToSlide(i));
            this.slideIndicators.appendChild(indicator);
        }
    }
    
    attachEventListeners() {
        // Botones de navegación
        this.prevBtn.addEventListener('click', () => this.previousSlide());
        this.nextBtn.addEventListener('click', () => this.nextSlide());
        
        // Controles de teclado
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Touch/swipe para móviles
        this.attachTouchListeners();
    }
    
    handleKeyPress(e) {
        if (this.isAnimating) return;
        
        switch(e.key) {
            case 'ArrowRight':
            case 'PageDown':
                e.preventDefault();
                this.nextSlide();
                break;
            case 'ArrowLeft':
            case 'PageUp':
                e.preventDefault();
                this.previousSlide();
                break;
            case ' ':
                if (!e.target.matches('input, textarea')) {
                    e.preventDefault();
                    this.nextSlide();
                }
                break;
            case 'Home':
                if (!e.target.matches('input, textarea')) {
                    e.preventDefault();
                    this.goToSlide(1);
                }
                break;
            case 'End':
                if (!e.target.matches('input, textarea')) {
                    e.preventDefault();
                    this.goToSlide(this.totalSlides);
                }
                break;
            case 'Escape':
                e.preventDefault();
                this.toggleFullscreen();
                break;
        }
    }
    
    attachTouchListeners() {
        let startX = 0;
        let startY = 0;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const minSwipeDistance = 50;
            
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0) {
                    this.previousSlide();
                } else {
                    this.nextSlide();
                }
            }
        });
    }
    
    nextSlide() {
        if (this.isAnimating || this.currentSlide >= this.totalSlides) return;
        this.goToSlide(this.currentSlide + 1);
    }
    
    previousSlide() {
        if (this.isAnimating || this.currentSlide <= 1) return;
        this.goToSlide(this.currentSlide - 1);
    }
    
    goToSlide(slideNumber) {
        if (this.isAnimating || slideNumber === this.currentSlide || 
            slideNumber < 1 || slideNumber > this.totalSlides) return;
        
        this.isAnimating = true;
        
        const currentSlideElement = this.slides[this.currentSlide - 1];
        const targetSlideElement = this.slides[slideNumber - 1];
        
        currentSlideElement.classList.remove('active');
        targetSlideElement.classList.add('active');
        
        setTimeout(() => {
            this.currentSlide = slideNumber;
            this.updateUI();
            this.isAnimating = false;
        }, 600);
    }
    
    updateUI() {
        // Actualizar contador
        this.slideCounter.textContent = `${this.currentSlide} / ${this.totalSlides}`;
        
        // Actualizar barra de progreso
        const progress = (this.currentSlide / this.totalSlides) * 100;
        this.progressFill.style.width = `${progress}%`;
        
        // Actualizar botones
        this.prevBtn.disabled = this.currentSlide === 1;
        this.nextBtn.disabled = this.currentSlide === this.totalSlides;
        
        // Actualizar indicadores
        document.querySelectorAll('.indicator').forEach((indicator, index) => {
            indicator.classList.toggle('active', index + 1 === this.currentSlide);
        });
        
        // Actualizar título de la página
        const currentSlideTitle = this.slides[this.currentSlide - 1].querySelector('h1');
        if (currentSlideTitle) {
            document.title = `${currentSlideTitle.textContent} - Orquestación de Pipelines`;
        }
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Error al entrar en pantalla completa:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    getCurrentSlide() {
        return this.currentSlide;
    }
    
    getTotalSlides() {
        return this.totalSlides;
    }
}

// Funciones auxiliares
function addHoverEffects() {
    const cards = document.querySelectorAll('.feature-card, .char-card, .benefit-item, .metric-card, .other-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Auto-avance para demos
let autoAdvanceInterval = null;

function startAutoAdvance(intervalMs = 10000) {
    if (autoAdvanceInterval) return;
    
    autoAdvanceInterval = setInterval(() => {
        if (window.presentation.getCurrentSlide() < window.presentation.getTotalSlides()) {
            window.presentation.nextSlide();
        } else {
            stopAutoAdvance();
        }
    }, intervalMs);
}

function stopAutoAdvance() {
    if (autoAdvanceInterval) {
        clearInterval(autoAdvanceInterval);
        autoAdvanceInterval = null;
    }
}

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    if (!document.querySelector('.slide')) {
        console.error('No se encontraron diapositivas');
        return;
    }
    
    window.presentation = new PipelinePresentation();
    
    setTimeout(() => {
        addHoverEffects();
    }, 500);
    
    ['click', 'keydown', 'touchstart'].forEach(event => {
        document.addEventListener(event, stopAutoAdvance);
    });
    
    console.log(`
    🎯 Presentación Orquestación de Pipelines inicializada
    📊 Total de slides: ${window.presentation.getTotalSlides()}
    ⌨️ Controles:
    - Flechas/Space: Navegar
    - Escape: Pantalla completa
    
    🚀 Funciones disponibles:
    - startAutoAdvance(): Auto-avance
    - stopAutoAdvance(): Detener auto-avance
    `);
});

// Pausar animaciones cuando la página no es visible
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        document.body.style.animationPlayState = 'paused';
    } else {
        document.body.style.animationPlayState = 'running';
    }
});

// Manejar errores
window.addEventListener('error', function(e) {
    console.error('Error en la presentación:', e.error);
});