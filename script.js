// Clase principal para manejar la presentación
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
        
        // Precargar transiciones para mejor rendimiento
        this.preloadTransitions();
    }
    
    initializeElements() {
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.slideCounter = document.getElementById('slideCounter');
        this.progressFill = document.getElementById('progressFill');
        this.slideIndicators = document.getElementById('slideIndicators');
        
        // Asegurar que la primera diapositiva esté activa
        this.slides.forEach((slide, index) => {
            slide.classList.remove('active', 'prev');
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
            indicator.setAttribute('data-slide', i);
            indicator.addEventListener('click', () => this.goToSlide(i));
            indicator.setAttribute('aria-label', `Ir a la diapositiva ${i}`);
            this.slideIndicators.appendChild(indicator);
        }
    }
    
    attachEventListeners() {
        // Botones de navegación
        this.prevBtn.addEventListener('click', () => this.previousSlide());
        this.nextBtn.addEventListener('click', () => this.nextSlide());
        
        // Controles de teclado
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // REMOVER COMPLETAMENTE el event listener de wheel
        // El wheel scroll debe funcionar normalmente
        
        // Touch/swipe para móviles
        this.attachTouchListeners();
        
        // Eventos de ventana
        window.addEventListener('resize', () => this.handleResize());
    }
    
    handleKeyPress(e) {
        if (this.isAnimating) return;
        
        // Verificar si el usuario está interactuando con contenido scrolleable
        const activeElement = document.activeElement;
        const isInScrollableContent = activeElement && (
            activeElement.closest('.slide-content') || 
            activeElement.tagName === 'INPUT' || 
            activeElement.tagName === 'TEXTAREA'
        );
        
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
            case 'ArrowDown':
            case 'ArrowUp':
                // PERMITIR que las flechas funcionen para scroll vertical
                // NO preventDefault aquí
                break;
            case ' ':
                // Solo avanzar slide si no estamos en un elemento de input
                if (!isInScrollableContent) {
                    e.preventDefault();
                    this.nextSlide();
                }
                break;
            case 'Home':
                // Solo si no estamos en contenido scrolleable
                if (!isInScrollableContent) {
                    e.preventDefault();
                    this.goToSlide(1);
                }
                break;
            case 'End':
                // Solo si no estamos en contenido scrolleable
                if (!isInScrollableContent) {
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
        let endX = 0;
        let endY = 0;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;
            this.handleSwipe(startX, startY, endX, endY);
        });
    }
    
    handleSwipe(startX, startY, endX, endY) {
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const minSwipeDistance = 50;
        
        // Solo procesar swipes horizontales significativos
        // Y asegurarse que no sea un scroll vertical
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
                this.previousSlide();
            } else {
                this.nextSlide();
            }
        }
        // Si es un swipe vertical (deltaY > deltaX), no hacer nada
        // para permitir scroll normal
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
        
        // Determinar dirección de la animación
        const isMovingForward = slideNumber > this.currentSlide;
        
        // Aplicar clases de animación
        this.animateSlideTransition(currentSlideElement, targetSlideElement, isMovingForward)
            .then(() => {
                this.currentSlide = slideNumber;
                this.updateUI();
                this.isAnimating = false;
                
                // Disparar evento personalizado
                this.dispatchSlideChangeEvent();
                
                // Auto-animar elementos de la nueva diapositiva
                this.animateSlideContent(targetSlideElement);
            });
    }
    
    animateSlideTransition(currentSlide, targetSlide, isMovingForward) {
        return new Promise((resolve) => {
            // Preparar la diapositiva objetivo
            targetSlide.style.transform = isMovingForward ? 'translateX(100px)' : 'translateX(-100px)';
            targetSlide.style.opacity = '0';
            
            // Remover clases activas
            currentSlide.classList.remove('active');
            
            // Forzar reflow
            targetSlide.offsetHeight;
            
            // Animar salida de la diapositiva actual
            currentSlide.style.transform = isMovingForward ? 'translateX(-100px)' : 'translateX(100px)';
            currentSlide.style.opacity = '0';
            
            // Animar entrada de la nueva diapositiva
            setTimeout(() => {
                targetSlide.classList.add('active');
                targetSlide.style.transform = 'translateX(0)';
                targetSlide.style.opacity = '1';
                
                setTimeout(() => {
                    // Limpiar estilos inline
                    currentSlide.style.transform = '';
                    currentSlide.style.opacity = '';
                    resolve();
                }, 600);
            }, 50);
        });
    }
    
    animateSlideContent(slideElement) {
        const animatableElements = slideElement.querySelectorAll(
            '.example-card, .benefit-card, .component-card, .metric-card, .checklist-item, .question-card'
        );
        
        animatableElements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                element.style.transition = 'all 0.6s ease';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, index * 100);
        });
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
            document.title = `${currentSlideTitle.textContent} - Pipelines Presentation`;
        }
    }
    
    dispatchSlideChangeEvent() {
        const event = new CustomEvent('slideChange', {
            detail: {
                currentSlide: this.currentSlide,
                totalSlides: this.totalSlides,
                slideElement: this.slides[this.currentSlide - 1]
            }
        });
        document.dispatchEvent(event);
    }
    
    preloadTransitions() {
        // Precargar estilos CSS para transiciones más suaves
        const style = document.createElement('style');
        style.textContent = `
            .slide { will-change: transform, opacity; }
            .example-card, .benefit-card, .component-card, .metric-card,
            .checklist-item, .question-card { will-change: transform, opacity; }
        `;
        document.head.appendChild(style);
    }
    
    handleResize() {
        // Reajustar elementos si es necesario en pantallas pequeñas
        if (window.innerWidth < 768) {
            this.adaptForMobile();
        } else {
            this.adaptForDesktop();
        }
    }
    
    adaptForMobile() {
        // Ajustes específicos para móvil
        const navigation = document.querySelector('.navigation');
        if (navigation) {
            navigation.style.gap = '0.5rem';
            navigation.style.padding = '0.5rem 1rem';
        }
    }
    
    adaptForDesktop() {
        // Ajustes específicos para escritorio
        const navigation = document.querySelector('.navigation');
        if (navigation) {
            navigation.style.gap = '2rem';
            navigation.style.padding = '1rem 2rem';
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
    
    // Métodos públicos para control externo
    getCurrentSlide() {
        return this.currentSlide;
    }
    
    getTotalSlides() {
        return this.totalSlides;
    }
    
    getProgress() {
        return (this.currentSlide / this.totalSlides) * 100;
    }
}

// Función auxiliar para efectos visuales adicionales
class VisualEffects {
    static addParallaxEffect() {
        document.addEventListener('mousemove', (e) => {
            const cards = document.querySelectorAll('.example-card, .benefit-card, .component-card, .metric-card');
            const mouseX = e.clientX / window.innerWidth;
            const mouseY = e.clientY / window.innerHeight;
            
            cards.forEach((card, index) => {
                const speed = (index % 3 + 1) * 0.5;
                const x = (mouseX - 0.5) * speed;
                const y = (mouseY - 0.5) * speed;
                
                card.style.transform = `translate(${x}px, ${y}px)`;
            });
        });
    }
    
    static addHoverEffects() {
        const cards = document.querySelectorAll('.example-card, .benefit-card, .component-card, .metric-card');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform += ' scale(1.02)';
                this.style.transition = 'transform 0.3s ease';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = this.style.transform.replace(' scale(1.02)', '');
            });
        });
    }
    
    static addTypingEffect(element, text, speed = 50) {
        let i = 0;
        element.innerHTML = '';
        
        function typeWriter() {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
                setTimeout(typeWriter, speed);
            }
        }
        
        typeWriter();
    }
}

// Función para inicializar tooltips
function initializeTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', function(e) {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = this.getAttribute('data-tooltip');
            tooltip.style.cssText = `
                position: absolute;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 8px;
                font-size: 0.9rem;
                z-index: 10000;
                pointer-events: none;
                white-space: nowrap;
            `;
            
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
            tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
            
            this._tooltip = tooltip;
        });
        
        element.addEventListener('mouseleave', function() {
            if (this._tooltip) {
                this._tooltip.remove();
                this._tooltip = null;
            }
        });
    });
}

// Función para manejar el modo de presentación
function initializePresentationMode() {
    let presentationMode = false;
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F5' || (e.key === 'Enter' && e.altKey)) {
            e.preventDefault();
            presentationMode = !presentationMode;
            
            if (presentationMode) {
                document.body.classList.add('presentation-mode');
                document.querySelector('.navigation').style.display = 'none';
                document.querySelector('.slide-indicators').style.display = 'none';
            } else {
                document.body.classList.remove('presentation-mode');
                document.querySelector('.navigation').style.display = 'flex';
                document.querySelector('.slide-indicators').style.display = 'flex';
            }
        }
    });
}

// Función para auto-avanzar slides (útil para demos)
function initializeAutoAdvance(intervalMs = 30000) {
    let autoAdvanceInterval;
    let isAutoAdvancing = false;
    
    window.startAutoAdvance = function() {
        if (isAutoAdvancing) return;
        
        isAutoAdvancing = true;
        autoAdvanceInterval = setInterval(() => {
            if (presentation.getCurrentSlide() < presentation.getTotalSlides()) {
                presentation.nextSlide();
            } else {
                stopAutoAdvance();
            }
        }, intervalMs);
    };
    
    window.stopAutoAdvance = function() {
        if (autoAdvanceInterval) {
            clearInterval(autoAdvanceInterval);
            autoAdvanceInterval = null;
            isAutoAdvancing = false;
        }
    };
    
    // Pausar auto-avance con cualquier interacción del usuario
    ['click', 'keydown', 'touchstart'].forEach(event => {
        document.addEventListener(event, () => {
            if (isAutoAdvancing) {
                stopAutoAdvance();
            }
        });
    });
}

// Función para exportar presentación como PDF (usando window.print)
function initializePrintFunctionality() {
    window.printPresentation = function() {
        // Crear una versión especial para imprimir
        const printWindow = window.open('', '_blank');
        const printDoc = printWindow.document;
        
        printDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Pipelines Presentation - Print Version</title>
                <style>
                    @page { size: landscape; margin: 1cm; }
                    body { font-family: Arial, sans-serif; }
                    .slide-print { page-break-after: always; padding: 2cm; }
                    .slide-print:last-child { page-break-after: avoid; }
                    h1 { color: #2c3e50; }
                    .no-print { display: none; }
                </style>
            </head>
            <body>
        `);
        
        // Agregar cada slide como una página
        document.querySelectorAll('.slide').forEach((slide, index) => {
            const slideContent = slide.innerHTML;
            printDoc.write(`
                <div class="slide-print">
                    <h2>Slide ${index + 1}</h2>
                    ${slideContent}
                </div>
            `);
        });
        
        printDoc.write('</body></html>');
        printDoc.close();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 1000);
    };
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Verificar que todos los elementos necesarios estén presentes
    if (!document.querySelector('.slide') || !document.getElementById('prevBtn')) {
        console.error('Elementos de presentación no encontrados');
        return;
    }
    
    // Inicializar la presentación principal
    window.presentation = new PipelinePresentation();
    
    // Inicializar características adicionales
    VisualEffects.addHoverEffects();
    initializeTooltips();
    initializePresentationMode();
    initializeAutoAdvance();
    initializePrintFunctionality();
    
    // Agregar efectos visuales después de un breve delay
    setTimeout(() => {
        VisualEffects.addParallaxEffect();
    }, 1000);
    
    // Manejar errores globales
    window.addEventListener('error', function(e) {
        console.error('Error en la presentación:', e.error);
    });
    
    // Agregar mensaje de bienvenida en consola
    console.log(`
    🎯 Presentación de Pipelines inicializada
    📊 Total de slides: ${window.presentation.getTotalSlides()}
    ⌨️  Controles de teclado:
    - Flechas: Navegar
    - Espacio: Siguiente slide
    - Escape: Pantalla completa
    - F5: Modo presentación
    
    🚀 Funciones disponibles:
    - startAutoAdvance(): Iniciar avance automático
    - stopAutoAdvance(): Detener avance automático
    - printPresentation(): Imprimir presentación
    `);
});

// Manejar visibilidad de la página para pausar animaciones
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Pausar animaciones cuando la página no es visible
        document.body.style.animationPlayState = 'paused';
    } else {
        // Reanudar animaciones cuando la página es visible
        document.body.style.animationPlayState = 'running';
    }
});

// Exportar funciones para uso externo si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PipelinePresentation,
        VisualEffects
    };
}