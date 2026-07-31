// Profile Management (Local Storage for now, Supabase later)
class ProfileManager {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('animeverse-user') || 'null');
        this.init();
    }
    
    init() {
        if (this.currentUser) {
            this.loadProfile();
        } else {
            window.location.href = 'login.html';
        }
    }
    
    loadProfile() {
        const username = document.getElementById('profileUsername');
        const avatar = document.getElementById('profileAvatar');
        const email = document.getElementById('profileEmail');
        
        if (username) username.textContent = this.currentUser.username;
        if (avatar) avatar.src = this.currentUser.avatar || 'assets/images/avatars/default.png';
        if (email) email.textContent = this.currentUser.email;
        
        this.loadFavorites();
        this.loadWatchlist();
    }
    
    loadFavorites() {
        const favorites = JSON.parse(localStorage.getItem('animeverse-favorites') || '[]');
        const grid = document.getElementById('favoritesGrid');
        if (!grid) return;
        
        if (favorites.length === 0) {
            grid.innerHTML = '<p class="empty-state">No favorites yet. Start exploring anime!</p>';
            return;
        }
        
        // Load anime details for each favorite
        favorites.forEach(async (animeId) => {
            const data = await utils.fetchData(`${API_BASE}/anime/${animeId}`);
            if (data && data.data) {
                grid.insertAdjacentHTML('beforeend', utils.createAnimeCard(data.data));
            }
        });
    }
    
    loadWatchlist() {
        const watchlist = JSON.parse(localStorage.getItem('animeverse-watchlist') || '[]');
        const grid = document.getElementById('watchlistGrid');
        if (!grid) return;
        
        if (watchlist.length === 0) {
            grid.innerHTML = '<p class="empty-state">Your watchlist is empty. Add anime to watch later!</p>';
            return;
        }
        
        // Load anime details for each watchlist item
        watchlist.forEach(async (animeId) => {
            const data = await utils.fetchData(`${API_BASE}/anime/${animeId}`);
            if (data && data.data) {
                grid.insertAdjacentHTML('beforeend', utils.createAnimeCard(data.data));
            }
        });
    }
    
    logout() {
        localStorage.removeItem('animeverse-user');
        window.location.href = 'index.html';
    }
}

// Initialize if on profile page
if (window.location.pathname.includes('profile.html')) {
    new ProfileManager();
}
