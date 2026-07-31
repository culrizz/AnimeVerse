// Hero Slider
class HeroSlider {
    constructor() {
        this.slider = document.getElementById('heroSlider');
        this.currentSlide = 0;
        this.slides = [];
        this.init();
    }
    
    async init() {
        await this.loadAnimeImages();
        if (this.slides.length > 0) {
            this.startSlideshow();
        }
    }
    
    async loadAnimeImages() {
        try {
            const response = await fetch('https://api.jikan.moe/v4/top/anime?limit=5');
            const data = await response.json();
            
            if (data.data) {
                data.data.forEach((anime, index) => {
                    const slide = document.createElement('div');
                    slide.className = 'hero-slide';
                    slide.style.backgroundImage = `url(${anime.images.jpg.large_image_url})`;
                    this.slider.appendChild(slide);
                    this.slides.push(slide);
                    
                    if (index === 0) {
                        slide.classList.add('active');
                    }
                });
            }
        } catch (error) {
            console.error('Error loading hero images:', error);
            // Fallback gradient if images fail to load
            this.slider.style.background = 'var(--gradient-hero)';
        }
    }
    
    startSlideshow() {
        setInterval(() => {
            this.slides[this.currentSlide].classList.remove('active');
            this.currentSlide = (this.currentSlide + 1) % this.slides.length;
            this.slides[this.currentSlide].classList.add('active');
        }, 5000);
    }
}

// Initialize slider when on home page
if (document.getElementById('heroSlider')) {
    new HeroSlider();
}
