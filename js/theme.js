// Theme Management
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('animeverse-theme') || 'dark';
        this.init();
    }
    
    init() {
        this.applyTheme();
        this.setupToggle();
    }
    
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        
        if (this.theme === 'light') {
            document.documentElement.style.setProperty('--bg-primary', '#f5f5f5');
            document.documentElement.style.setProperty('--bg-secondary', '#ffffff');
            document.documentElement.style.setProperty('--bg-card', '#ffffff');
            document.documentElement.style.setProperty('--bg-card-hover', '#f0f0f0');
            document.documentElement.style.setProperty('--text-primary', '#1a1a1a');
            document.documentElement.style.setProperty('--text-secondary', '#666666');
            document.documentElement.style.setProperty('--text-muted', '#999999');
        } else {
            document.documentElement.style.setProperty('--bg-primary', '#0a0a0f');
            document.documentElement.style.setProperty('--bg-secondary', '#12121a');
            document.documentElement.style.setProperty('--bg-card', '#1a1a2e');
            document.documentElement.style.setProperty('--bg-card-hover', '#222240');
            document.documentElement.style.setProperty('--text-primary', '#ffffff');
            document.documentElement.style.setProperty('--text-secondary', '#b0b0c0');
            document.documentElement.style.setProperty('--text-muted', '#707080');
        }
        
        this.updateToggleIcon();
    }
    
    toggle() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('animeverse-theme', this.theme);
        this.applyTheme();
    }
    
    updateToggleIcon() {
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            const icon = toggle.querySelector('i');
            if (icon) {
                icon.className = this.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }
    
    setupToggle() {
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.addEventListener('click', () => this.toggle());
        }
    }
}

// Initialize theme manager
const themeManager = new ThemeManager();
