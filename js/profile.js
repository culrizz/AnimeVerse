// Profile Page Manager
class ProfilePage {
    constructor() {
        this.currentUser = null;
        this.watchlist = [];
        this.favorites = [];
        this.completed = [];
        this.reviews = [];
        
        // Avatar options (using DiceBear API for generated avatars)
        this.avatarStyles = [
            'adventurer', 'adventurer-neutral', 'big-ears', 'big-ears-neutral',
            'big-smile', 'bottts', 'croodles', 'fun-emoji', 'icons',
            'lorelei', 'micah', 'miniavs', 'notionists', 'open-peeps',
            'personas', 'pixel-art', 'thumbs'
        ];
        
        this.init();
    }
    
    init() {
        this.currentUser = Auth.getCurrentUser();
        
        // Redirect if not logged in
        if (!this.currentUser) {
            window.location.href = 'login.html?redirect=profile.html';
            return;
        }
        
        this.loadUserData();
        this.loadLists();
        this.renderProfile();
        this.setupEventListeners();
        this.setupTabs();
    }
    
    loadUserData() {
        // Load user data from localStorage
        const users = JSON.parse(localStorage.getItem('animeverse-users') || '[]');
        const userData = users.find(u => u.id === this.currentUser.id);
        
        if (userData) {
            this.currentUser = { ...this.currentUser, ...userData };
        }
    }
    
    loadLists() {
        this.watchlist = JSON.parse(localStorage.getItem('animeverse-watchlist') || '[]');
        this.favorites = JSON.parse(localStorage.getItem('animeverse-favorites') || '[]');
        this.completed = JSON.parse(localStorage.getItem('animeverse-completed') || '[]');
        this.reviews = JSON.parse(localStorage.getItem('animeverse-reviews') || '[]');
    }
    
    renderProfile() {
        // Set avatar
        const avatar = document.getElementById('profileAvatar');
        const userAvatar = document.getElementById('userAvatar');
        const avatarUrl = this.currentUser.avatar || 'assets/images/avatars/default.png';
        
        if (avatar) avatar.src = avatarUrl;
        if (userAvatar) userAvatar.src = avatarUrl;
        
        // Set user info
        document.getElementById('profileUsername').textContent = this.currentUser.username;
        document.getElementById('profileEmail').textContent = this.currentUser.email;
        
        // Format join date
        const joinDate = this.currentUser.createdAt 
            ? new Date(this.currentUser.createdAt) 
            : new Date();
        document.getElementById('profileJoined').textContent = 
            `Joined ${joinDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
        
        // Set stats
        document.getElementById('statWatchlist').textContent = this.watchlist.length;
        document.getElementById('statFavorites').textContent = this.favorites.length;
        document.getElementById('statCompleted').textContent = this.completed.length;
        document.getElementById('statReviews').textContent = this.reviews.length;
        
        // Set tab counts
        document.getElementById('watchlistCount').textContent = this.watchlist.length;
        document.getElementById('favoritesCount').textContent = this.favorites.length;
        document.getElementById('completedCount').textContent = this.completed.length;
        document.getElementById('reviewsCount').textContent = this.reviews.length;
        
        // Load watchlist and favorites
        this.loadAnimeList('watchlist', this.watchlist);
        this.loadAnimeList('favorites', this.favorites);
        this.loadAnimeList('completed', this.completed);
        
        // Settings form
        document.getElementById('settingsUsername').value = this.currentUser.username || '';
        document.getElementById('settingsEmail').value = this.currentUser.email || '';
        document.getElementById('settingsBio').value = this.currentUser.bio || '';
        
        // Generate avatar options
        this.generateAvatarOptions();
        
        // Set theme option
        const currentTheme = localStorage.getItem('animeverse-theme') || 'dark';
        document.querySelectorAll('.theme-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.theme === currentTheme);
        });
    }
    
    async loadAnimeList(type, idList) {
        const grid = document.getElementById(`${type}Grid`);
        const empty = document.getElementById(`${type}Empty`);
        
        if (!grid) return;
        
        if (idList.length === 0) {
            grid.innerHTML = '';
            if (empty) empty.style.display = 'block';
            return;
        }
        
        if (empty) empty.style.display = 'none';
        
        // Show loading
        grid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
        
        // Load anime details for each ID
        const animeCards = [];
        
        for (const id of idList.slice(0, 20)) { // Limit to 20 for performance
            try {
                const data = await utils.fetchData(`${API_BASE}/anime/${id}`);
                if (data && data.data) {
                    animeCards.push(this.createAnimeCardWithActions(data.data, type));
                }
            } catch (error) {
                console.error(`Error loading anime ${id}:`, error);
            }
        }
        
        grid.innerHTML = animeCards.join('') || '<p class="empty-state">Failed to load anime.</p>';
        
        // Add event listeners to action buttons
        this.setupAnimeCardActions(type);
    }
    
    createAnimeCardWithActions(anime, listType) {
        const isInWatchlist = this.watchlist.includes(anime.mal_id.toString());
        const isInFavorites = this.favorites.includes(anime.mal_id.toString());
        const isCompleted = this.completed.includes(anime.mal_id.toString());
        
        return `
            <div class="anime-card" data-id="${anime.mal_id}">
                <div class="anime-card-image" onclick="window.location.href='anime.html?id=${anime.mal_id}'">
                    <img src="${anime.images.jpg.large_image_url}" 
                         alt="${anime.title}" 
                         loading="lazy"
                         onerror="this.src='assets/images/placeholder.jpg'">
                    ${anime.score ? `<span class="anime-card-score">⭐ ${anime.score}</span>` : ''}
                </div>
                <div class="anime-card-info">
                    <h3 class="anime-card-title" onclick="window.location.href='anime.html?id=${anime.mal_id}'">${anime.title}</h3>
                    <div class="anime-card-actions">
                        <button class="card-action-btn ${isInWatchlist ? 'active' : ''}" 
                                data-action="watchlist" 
                                data-id="${anime.mal_id}"
                                title="${isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}">
                            <i class="fas fa-bookmark"></i>
                        </button>
                        <button class="card-action-btn ${isInFavorites ? 'active' : ''}" 
                                data-action="favorites" 
                                data-id="${anime.mal_id}"
                                title="${isInFavorites ? 'Remove from favorites' : 'Add to favorites'}">
                            <i class="fas fa-heart"></i>
                        </button>
                        <button class="card-action-btn ${isCompleted ? 'active' : ''}" 
                                data-action="completed" 
                                data-id="${anime.mal_id}"
                                title="${isCompleted ? 'Mark as incomplete' : 'Mark as completed'}">
                            <i class="fas fa-check"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    setupAnimeCardActions(listType) {
        const grid = document.getElementById(`${listType}Grid`);
        if (!grid) return;
        
        grid.querySelectorAll('.card-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const animeId = btn.dataset.id;
                this.toggleAnimeAction(action, animeId, btn);
            });
        });
    }
    
    toggleAnimeAction(action, animeId, button) {
        let list;
        
        switch (action) {
            case 'watchlist':
                list = this.watchlist;
                break;
            case 'favorites':
                list = this.favorites;
                break;
            case 'completed':
                list = this.completed;
                break;
            default:
                return;
        }
        
        const index = list.indexOf(animeId);
        
        if (index > -1) {
            list.splice(index, 1);
            button.classList.remove('active');
            this.showToast(`Removed from ${action}`);
        } else {
            list.push(animeId);
            button.classList.add('active');
            this.showToast(`Added to ${action}`);
        }
        
        // Save to localStorage
        localStorage.setItem(`animeverse-${action}`, JSON.stringify(list));
        
        // Update stats
        this.updateStats();
    }
    
    updateStats() {
        document.getElementById('statWatchlist').textContent = this.watchlist.length;
        document.getElementById('statFavorites').textContent = this.favorites.length;
        document.getElementById('statCompleted').textContent = this.completed.length;
        
        document.getElementById('watchlistCount').textContent = this.watchlist.length;
        document.getElementById('favoritesCount').textContent = this.favorites.length;
        document.getElementById('completedCount').textContent = this.completed.length;
    }
    
    generateAvatarOptions() {
        const grid = document.getElementById('avatarGrid');
        if (!grid) return;
        
        const currentAvatar = this.currentUser.avatar || '';
        
        // Generate avatars using DiceBear API
        const avatars = [];
        const seed = this.currentUser.username || 'default';
        
        this.avatarStyles.forEach((style, index) => {
            const url = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}${index}`;
            avatars.push(url);
        });
        
        // Add default avatar
        avatars.unshift('assets/images/avatars/default.png');
        
        grid.innerHTML = avatars.map(url => `
            <img src="${url}" 
                 class="avatar-option ${url === currentAvatar ? 'selected' : ''}" 
                 data-avatar="${url}"
                 alt="Avatar option"
                 onclick="profilePage.selectAvatar('${url}', this)"
                 onerror="this.style.display='none'">
        `).join('');
    }
    
    selectAvatar(url, element) {
        // Update UI
        document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
        element.classList.add('selected');
        
        // Update current user
        this.currentUser.avatar = url;
        document.getElementById('profileAvatar').src = url;
        document.getElementById('userAvatar').src = url;
        
        // Save to localStorage
        const users = JSON.parse(localStorage.getItem('animeverse-users') || '[]');
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        
        if (userIndex > -1) {
            users[userIndex].avatar = url;
            localStorage.setItem('animeverse-users', JSON.stringify(users));
        }
        
        // Update current session
        const sessionUser = JSON.parse(localStorage.getItem('animeverse-user') || '{}');
        sessionUser.avatar = url;
        localStorage.setItem('animeverse-user', JSON.stringify(sessionUser));
        
        this.showToast('Avatar updated!');
    }
    
    setupEventListeners() {
        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                Auth.logout();
            });
        }
        
        // Save profile
        document.getElementById('saveProfileBtn').addEventListener('click', () => {
            this.saveProfile();
        });
        
        // Delete account
        document.getElementById('deleteAccountBtn').addEventListener('click', () => {
            document.getElementById('deleteModal').style.display = 'flex';
        });
        
        document.getElementById('deleteModalClose').addEventListener('click', () => {
            document.getElementById('deleteModal').style.display = 'none';
        });
        
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
            document.getElementById('deleteModal').style.display = 'none';
        });
        
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
            this.deleteAccount();
        });
        
        // Close modal on overlay click
        document.getElementById('deleteModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                document.getElementById('deleteModal').style.display = 'none';
            }
        });
        
        // Theme options
        document.querySelectorAll('.theme-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const theme = opt.dataset.theme;
                document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                
                localStorage.setItem('animeverse-theme', theme);
                themeManager.theme = theme;
                themeManager.applyTheme();
            });
        });
        
        // Watchlist/Favorites sort
        document.getElementById('watchlistSort')?.addEventListener('change', () => {
            this.sortList('watchlist');
        });
        
        document.getElementById('favoritesSort')?.addEventListener('change', () => {
            this.sortList('favorites');
        });
        
        // Avatar edit button
        document.getElementById('avatarEditBtn')?.addEventListener('click', () => {
            // Switch to settings tab
            document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
            document.querySelector('[data-tab="settings"]').classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById('settingsTab').classList.add('active');
            
            // Scroll to avatar section
            document.querySelector('.avatar-grid')?.scrollIntoView({ behavior: 'smooth' });
        });
        
        // Nav search
        const navSearch = document.getElementById('navSearch');
        if (navSearch) {
            navSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && navSearch.value.trim()) {
                    window.location.href = `explore.html?search=${encodeURIComponent(navSearch.value.trim())}`;
                }
            });
        }
    }
    
    setupTabs() {
        const tabs = document.querySelectorAll('.profile-tab');
        const contents = document.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Show target content
                contents.forEach(c => c.classList.remove('active'));
                document.getElementById(`${targetTab}Tab`).classList.add('active');
                
                // Reload lists if needed
                if (targetTab === 'watchlist') this.loadAnimeList('watchlist', this.watchlist);
                if (targetTab === 'favorites') this.loadAnimeList('favorites', this.favorites);
                if (targetTab === 'completed') this.loadAnimeList('completed', this.completed);
            });
        });
    }
    
    saveProfile() {
        const username = document.getElementById('settingsUsername').value.trim();
        const bio = document.getElementById('settingsBio').value.trim();
        
        if (!username || username.length < 3) {
            this.showToast('Username must be at least 3 characters');
            return;
        }
        
        // Update current user
        this.currentUser.username = username;
        this.currentUser.bio = bio;
        
        // Save to users list
        const users = JSON.parse(localStorage.getItem('animeverse-users') || '[]');
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        
        if (userIndex > -1) {
            users[userIndex].username = username;
            users[userIndex].bio = bio;
            localStorage.setItem('animeverse-users', JSON.stringify(users));
        }
        
        // Update session
        const sessionUser = JSON.parse(localStorage.getItem('animeverse-user') || '{}');
        sessionUser.username = username;
        localStorage.setItem('animeverse-user', JSON.stringify(sessionUser));
        
        // Update UI
        document.getElementById('profileUsername').textContent = username;
        
        this.showToast('Profile updated!');
    }
    
    deleteAccount() {
        // Remove from users list
        const users = JSON.parse(localStorage.getItem('animeverse-users') || '[]');
        const filteredUsers = users.filter(u => u.id !== this.currentUser.id);
        localStorage.setItem('animeverse-users', JSON.stringify(filteredUsers));
        
        // Clear user data
        localStorage.removeItem('animeverse-user');
        localStorage.removeItem('animeverse-watchlist');
        localStorage.removeItem('animeverse-favorites');
        localStorage.removeItem('animeverse-completed');
        localStorage.removeItem('animeverse-reviews');
        localStorage.removeItem('animeverse-favorite-characters');
        
        // Redirect to home
        window.location.href = 'index.html';
    }
    
    sortList(type) {
        const sortBy = document.getElementById(`${type}Sort`)?.value;
        // Sorting is visual only for now; would need anime data loaded first
        this.loadAnimeList(type, this[type]);
    }
    
    showToast(message) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        toast.textContent = message;
        toast.style.display = 'block';
        
        // Reset animation
        toast.style.animation = 'none';
        toast.offsetHeight; // Trigger reflow
        toast.style.animation = 'toastIn 0.3s ease';
        
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }
}

// Initialize profile page
let profilePage;
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('profile.html')) {
        profilePage = new ProfilePage();
    }
});
