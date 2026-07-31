// Anime Details Page - Complete Functionality
class AnimeDetailsPage {
    constructor() {
        this.animeId = new URLSearchParams(window.location.search).get('id');
        
        if (!this.animeId) {
            window.location.href = 'explore.html';
            return;
        }
        
        this.animeData = null;
        this.init();
    }
    
    async init() {
        await this.loadAnimeData();
        this.setupEventListeners();
        this.checkUserActions();
    }
    
    async loadAnimeData() {
        try {
            const data = await utils.fetchData(`${API_BASE}/anime/${this.animeId}/full`);
            
            if (!data || !data.data) {
                this.showError();
                return;
            }
            
            this.animeData = data.data;
            this.renderAll();
            
        } catch (error) {
            console.error('Error loading anime:', error);
            this.showError();
        }
    }
    
    renderAll() {
        this.renderHero();
        this.renderSynopsis();
        this.renderTrailer();
        this.renderCharacters();
        this.renderThemes();
        this.renderRecommendations();
        this.updatePageTitle();
    }
    
    renderHero() {
        const anime = this.animeData;
        
        // Backdrop
        const backdrop = document.getElementById('animeBackdrop');
        if (backdrop) {
            backdrop.style.backgroundImage = `url(${anime.images.jpg.large_image_url})`;
        }
        
        // Poster
        const poster = document.getElementById('animePoster');
        if (poster) {
            poster.src = anime.images.jpg.large_image_url;
            poster.alt = anime.title;
        }
        
        // Title
        document.getElementById('animeTitle').textContent = anime.title;
        document.getElementById('animeTitleJp').textContent = anime.title_japanese || '';
        
        // Quick Stats
        document.getElementById('animeScore').textContent = anime.score || 'N/A';
        document.getElementById('animeRank').textContent = anime.rank ? `#${anime.rank}` : 'N/A';
        document.getElementById('animePopularity').textContent = anime.popularity ? `#${anime.popularity}` : 'N/A';
        document.getElementById('animeMembers').textContent = anime.members ? this.formatNumber(anime.members) : 'N/A';
        
        // Meta Data
        document.getElementById('animeType').textContent = anime.type || 'N/A';
        document.getElementById('animeEpisodes').textContent = anime.episodes || 'Unknown';
        document.getElementById('animeStatus').textContent = anime.status || 'N/A';
        document.getElementById('animeAired').textContent = anime.aired?.string || 'N/A';
        document.getElementById('animeSeason').textContent = anime.season ? `${this.capitalize(anime.season)} ${anime.year || ''}` : 'N/A';
        document.getElementById('animeDuration').textContent = anime.duration || 'N/A';
        document.getElementById('animeRating').textContent = anime.rating || 'N/A';
        document.getElementById('animeSource').textContent = anime.source || 'N/A';
        
        // Genres
        const genresContainer = document.getElementById('animeGenres');
        if (genresContainer && anime.genres) {
            genresContainer.innerHTML = anime.genres.map(genre => 
                `<a href="explore.html?genre=${genre.mal_id}" class="genre-tag">${genre.name}</a>`
            ).join('');
        }
        
        // Studios
        const studiosElement = document.getElementById('animeStudios');
        if (studiosElement && anime.studios) {
            const studioNames = anime.studios.map(s => s.name).join(', ');
            studiosElement.innerHTML = `<span class="meta-label">Studios:</span> <span class="meta-value">${studioNames || 'N/A'}</span>`;
        }
    }
    
    renderSynopsis() {
        const anime = this.animeData;
        
        document.getElementById('animeSynopsis').textContent = anime.synopsis || 'No synopsis available.';
        
        // Background info
        if (anime.background) {
            const bgSection = document.getElementById('animeBackground');
            const bgText = document.getElementById('animeBackgroundText');
            
            if (bgSection && bgText) {
                bgSection.style.display = 'block';
                bgText.textContent = anime.background;
            }
        }
    }
    
    renderTrailer() {
        const anime = this.animeData;
        const trailerSection = document.getElementById('trailerSection');
        const trailerContainer = document.getElementById('trailerContainer');
        
        if (trailerSection && trailerContainer && anime.trailer?.embed_url) {
            trailerSection.style.display = 'block';
            trailerContainer.innerHTML = `
                <iframe 
                    src="${anime.trailer.embed_url}" 
                    frameborder="0" 
                    allowfullscreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    title="${anime.title} Trailer">
                </iframe>
            `;
        }
    }
    
    async renderCharacters() {
        const charactersList = document.getElementById('charactersList');
        if (!charactersList) return;
        
        try {
            const data = await utils.fetchData(`${API_BASE}/anime/${this.animeId}/characters`);
            
            if (!data || !data.data || data.data.length === 0) {
                charactersList.innerHTML = '<p class="empty-state">No character information available.</p>';
                return;
            }
            
            // Show first 10 characters
            const characters = data.data.slice(0, 10);
            
            charactersList.innerHTML = characters.map(item => {
                const character = item.character;
                const voiceActors = item.voice_actors || [];
                const mainVA = voiceActors.find(va => va.language === 'Japanese') || voiceActors[0];
                
                return `
                    <div class="character-item" onclick="window.location.href='characters.html?id=${character.mal_id}'">
                        <div class="character-item-image">
                            <img src="${character.images?.jpg?.image_url || 'assets/images/placeholder.jpg'}" 
                                 alt="${character.name}"
                                 loading="lazy"
                                 onerror="this.src='assets/images/placeholder.jpg'">
                        </div>
                        <div class="character-item-info">
                            <div class="character-item-name">${character.name}</div>
                            <div class="character-item-role">${item.role}</div>
                        </div>
                        ${mainVA ? `
                            <div class="character-item-voice">
                                <div class="voice-actor-image">
                                    <img src="${mainVA.person.images?.jpg?.image_url || 'assets/images/placeholder.jpg'}" 
                                         alt="${mainVA.person.name}"
                                         loading="lazy"
                                         onerror="this.src='assets/images/placeholder.jpg'">
                                </div>
                                <div class="voice-actor-info">
                                    <div class="voice-actor-name">${mainVA.person.name}</div>
                                    <div class="voice-actor-lang">${mainVA.language}</div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
            
            // Update "View All" link
            const viewAllLink = document.getElementById('viewAllCharacters');
            if (viewAllLink) {
                viewAllLink.href = `characters.html?anime=${this.animeId}`;
            }
            
        } catch (error) {
            console.error('Error loading characters:', error);
            charactersList.innerHTML = '<p class="empty-state">Failed to load characters.</p>';
        }
    }
    
    renderThemes() {
        const anime = this.animeData;
        const themesSection = document.getElementById('themesSection');
        
        if (!anime.theme?.openings?.length && !anime.theme?.endings?.length) {
            if (themesSection) themesSection.style.display = 'none';
            return;
        }
        
        if (themesSection) themesSection.style.display = 'block';
        
        const openingList = document.getElementById('openingList');
        const endingList = document.getElementById('endingList');
        
        if (openingList && anime.theme?.openings) {
            openingList.innerHTML = anime.theme.openings.map(op => 
                `<li>"${op}"</li>`
            ).join('') || '<li>No opening themes listed</li>';
        }
        
        if (endingList && anime.theme?.endings) {
            endingList.innerHTML = anime.theme.endings.map(ed => 
                `<li>"${ed}"</li>`
            ).join('') || '<li>No ending themes listed</li>';
        }
    }
    
    async renderRecommendations() {
        const grid = document.getElementById('recommendationsGrid');
        if (!grid) return;
        
        try {
            const data = await utils.fetchData(`${API_BASE}/anime/${this.animeId}/recommendations`);
            
            if (!data || !data.data || data.data.length === 0) {
                grid.innerHTML = '<p class="empty-state">No recommendations available.</p>';
                return;
            }
            
            const recommendations = data.data.slice(0, 10);
            
            grid.innerHTML = recommendations.map(rec => 
                utils.createAnimeCard(rec.entry)
            ).join('');
            
        } catch (error) {
            console.error('Error loading recommendations:', error);
            grid.innerHTML = '<p class="empty-state">Failed to load recommendations.</p>';
        }
    }
    
    updatePageTitle() {
        document.title = `${this.animeData.title} - AnimeVerse`;
    }
    
    setupEventListeners() {
        // Add to Watchlist
        const watchlistBtn = document.getElementById('addToWatchlist');
        if (watchlistBtn) {
            watchlistBtn.addEventListener('click', () => this.toggleWatchlist());
        }
        
        // Add to Favorites
        const favoritesBtn = document.getElementById('addToFavorites');
        if (favoritesBtn) {
            favoritesBtn.addEventListener('click', () => this.toggleFavorite());
        }
        
        // Navigation search
        const navSearch = document.getElementById('navSearch');
        if (navSearch) {
            navSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && navSearch.value.trim()) {
                    window.location.href = `explore.html?search=${encodeURIComponent(navSearch.value.trim())}`;
                }
            });
        }
    }
    
    checkUserActions() {
        this.updateWatchlistButton();
        this.updateFavoriteButton();
    }
    
    toggleWatchlist() {
        if (!Auth.isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }
        
        const watchlist = JSON.parse(localStorage.getItem('animeverse-watchlist') || '[]');
        const index = watchlist.indexOf(this.animeId);
        
        if (index > -1) {
            watchlist.splice(index, 1);
        } else {
            watchlist.push(this.animeId);
        }
        
        localStorage.setItem('animeverse-watchlist', JSON.stringify(watchlist));
        this.updateWatchlistButton();
        
        // Show toast
        this.showToast(index > -1 ? 'Removed from watchlist' : 'Added to watchlist');
    }
    
    toggleFavorite() {
        if (!Auth.isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }
        
        const favorites = JSON.parse(localStorage.getItem('animeverse-favorites') || '[]');
        const index = favorites.indexOf(this.animeId);
        
        if (index > -1) {
            favorites.splice(index, 1);
        } else {
            favorites.push(this.animeId);
        }
        
        localStorage.setItem('animeverse-favorites', JSON.stringify(favorites));
        this.updateFavoriteButton();
        
        this.showToast(index > -1 ? 'Removed from favorites' : 'Added to favorites');
    }
    
    updateWatchlistButton() {
        const btn = document.getElementById('addToWatchlist');
        if (!btn) return;
        
        const watchlist = JSON.parse(localStorage.getItem('animeverse-watchlist') || '[]');
        const isInWatchlist = watchlist.includes(this.animeId);
        
        btn.innerHTML = isInWatchlist 
            ? '<i class="fas fa-check"></i> In Watchlist'
            : '<i class="fas fa-bookmark"></i> Add to Watchlist';
        
        btn.classList.toggle('btn-primary', !isInWatchlist);
        btn.classList.toggle('btn-secondary', isInWatchlist);
    }
    
    updateFavoriteButton() {
        const btn = document.getElementById('addToFavorites');
        if (!btn) return;
        
        const favorites = JSON.parse(localStorage.getItem('animeverse-favorites') || '[]');
        const isFavorite = favorites.includes(this.animeId);
        
        btn.innerHTML = isFavorite 
            ? '<i class="fas fa-heart"></i> Favorited'
            : '<i class="far fa-heart"></i> Add to Favorites';
        
        btn.classList.toggle('btn-accent', isFavorite);
        
        if (isFavorite) {
            btn.style.background = 'var(--accent)';
            btn.style.color = 'white';
            btn.style.borderColor = 'var(--accent)';
        } else {
            btn.style.background = '';
            btn.style.color = '';
            btn.style.borderColor = '';
        }
    }
    
    showToast(message) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--primary);
            color: white;
            padding: 12px 24px;
            border-radius: var(--radius-full);
            font-weight: 600;
            z-index: 10000;
            animation: fadeInUp 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
            box-shadow: var(--shadow-lg);
        `;
        
        document.body.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    showError() {
        document.getElementById('animeTitle').textContent = 'Anime Not Found';
        document.getElementById('animeSynopsis').textContent = 'Sorry, we couldn\'t find the anime you\'re looking for. It may have been removed or the ID is invalid.';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('anime.html')) {
        new AnimeDetailsPage();
    }
});

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(20px); }
    }
`;
document.head.appendChild(style);
