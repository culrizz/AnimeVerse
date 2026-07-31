// AnimeVerse - Main Application JavaScript
// Powered by Jikan API v4

const API_BASE = 'https://api.jikan.moe/v4';

// Utility Functions
const utils = {
    // Fetch data from API with error handling
    async fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching data:', error);
            return null;
        }
    },

    // Debounce function for search
    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    // Truncate text
    truncateText(text, maxLength = 100) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    // Format date
    formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    },

    // Get anime type color
    getTypeColor(type) {
        const colors = {
            'TV': '#6c5ce7',
            'Movie': '#fd79a8',
            'OVA': '#00cec9',
            'Special': '#fdcb6e',
            'ONA': '#e17055',
            'Music': '#a29bfe'
        };
        return colors[type] || '#6c5ce7';
    },

    // Get season icon
    getSeasonIcon(season) {
        const icons = {
            'spring': 'fa-seedling',
            'summer': 'fa-sun',
            'fall': 'fa-leaf',
            'winter': 'fa-snowflake'
        };
        return icons[season] || 'fa-calendar';
    },

    // Create anime card HTML
    createAnimeCard(anime) {
        return `
            <div class="anime-card" onclick="window.location.href='anime.html?id=${anime.mal_id}'">
                <div class="anime-card-image">
                    <img src="${anime.images.jpg.large_image_url}" 
                         alt="${anime.title}" 
                         loading="lazy"
                         onerror="this.src='assets/images/placeholder.jpg'">
                    ${anime.rank ? `<span class="anime-card-rank">#${anime.rank}</span>` : ''}
                    <div class="anime-card-overlay">
                        <p class="anime-synopsis">${utils.truncateText(anime.synopsis || 'No synopsis available.', 150)}</p>
                    </div>
                </div>
                <div class="anime-card-info">
                    <h3 class="anime-card-title" title="${anime.title}">${anime.title}</h3>
                    <div class="anime-card-meta">
                        <span class="anime-card-rating">
                            <i class="fas fa-star"></i> ${anime.score || 'N/A'}
                        </span>
                        <span class="anime-card-type" style="background: ${utils.getTypeColor(anime.type)}; 
                              color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">
                            ${anime.type || 'Unknown'}
                        </span>
                    </div>
                </div>
            </div>
        `;
    },

    // Create character card HTML
    createCharacterCard(character) {
        return `
            <div class="character-card" onclick="window.location.href='characters.html?id=${character.mal_id}'">
                <div class="character-card-image">
                    <img src="${character.images.jpg.image_url}" 
                         alt="${character.name}" 
                         loading="lazy"
                         onerror="this.src='assets/images/placeholder.jpg'">
                </div>
                <h3 class="character-card-name">${character.name}</h3>
            </div>
        `;
    },

    // Create news card HTML (placeholder for now)
    createNewsCard(anime) {
        return `
            <div class="news-card" onclick="window.location.href='news.html'">
                <div class="news-card-image">
                    <img src="${anime.images.jpg.large_image_url}" 
                         alt="News" 
                         loading="lazy"
                         onerror="this.src='assets/images/placeholder.jpg'">
                </div>
                <div class="news-card-content">
                    <span class="news-card-category">Update</span>
                    <h3 class="news-card-title">${anime.title} - New Season Announced!</h3>
                    <span class="news-card-date">${utils.formatDate(new Date())}</span>
                </div>
            </div>
        `;
    }
};

// Home Page Functions
const homePage = {
    async loadTrending() {
        const grid = document.getElementById('trendingGrid');
        if (!grid) return;

        const data = await utils.fetchData(`${API_BASE}/top/anime?filter=airing&limit=10`);
        if (!data || !data.data) return;

        grid.innerHTML = data.data.map(anime => utils.createAnimeCard(anime)).join('');
    },

    async loadTopRated() {
        const grid = document.getElementById('topRatedGrid');
        if (!grid) return;

        const data = await utils.fetchData(`${API_BASE}/top/anime?filter=bypopularity&limit=10`);
        if (!data || !data.data) return;

        grid.innerHTML = data.data.map(anime => utils.createAnimeCard(anime)).join('');
    },

    async loadAiring() {
        const grid = document.getElementById('airingGrid');
        if (!grid) return;

        const data = await utils.fetchData(`${API_BASE}/seasons/now?limit=10`);
        if (!data || !data.data) return;

        grid.innerHTML = data.data.map(anime => utils.createAnimeCard(anime)).join('');
    },

    async loadCharacters() {
        const grid = document.getElementById('charactersGrid');
        if (!grid) return;

        const data = await utils.fetchData(`${API_BASE}/top/characters?limit=12`);
        if (!data || !data.data) return;

        grid.innerHTML = data.data.map(char => utils.createCharacterCard(char)).join('');
    },

    async loadNews() {
        const grid = document.getElementById('newsGrid');
        if (!grid) return;

        // Using top anime as placeholder for news
        const data = await utils.fetchData(`${API_BASE}/top/anime?limit=3`);
        if (!data || !data.data) return;

        grid.innerHTML = data.data.map(anime => utils.createNewsCard(anime)).join('');
    },

    init() {
        this.loadTrending();
        this.loadTopRated();
        this.loadAiring();
        this.loadCharacters();
        this.loadNews();
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    homePage.init();
});

// Handle navigation search
const navSearch = document.getElementById('navSearch');
if (navSearch) {
    navSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && navSearch.value.trim()) {
            window.location.href = `explore.html?search=${encodeURIComponent(navSearch.value.trim())}`;
        }
    });
}

// Handle navigation scroll effect
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
});
