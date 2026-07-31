// Wallpapers Page Manager
class WallpapersPage {
    constructor() {
        // State
        this.currentPage = 1;
        this.isLoading = false;
        this.hasMore = true;
        this.activeCategory = 'all';
        this.activeResolution = 'all';
        this.searchQuery = '';
        this.allWallpapers = [];
        this.filteredWallpapers = [];
        
        // Favorites
        this.favoriteWallpapers = JSON.parse(localStorage.getItem('animeverse-favorite-wallpapers') || '[]');
        
        // Resolutions for display
        this.resolutions = ['3840x2160', '1920x1080', '2560x1440', '1280x720', '1920x1200', '3440x1440'];
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        this.setupBackToTop();
        await this.loadWallpapers();
    }
    
    async loadWallpapers() {
        try {
            // Fetch top anime to use their images as wallpapers
            // We fetch multiple categories for variety
            const promises = [
                utils.fetchData(`${API_BASE}/top/anime?limit=25`),
                utils.fetchData(`${API_BASE}/anime?type=movie&order_by=score&sort=desc&limit=15`),
                utils.fetchData(`${API_BASE}/seasons/now?limit=15`),
                utils.fetchData(`${API_BASE}/anime?genres=1&order_by=score&sort=desc&limit=10`), // Action
                utils.fetchData(`${API_BASE}/anime?genres=2&order_by=score&sort=desc&limit=10`), // Adventure
                utils.fetchData(`${API_BASE}/anime?genres=10&order_by=score&sort=desc&limit=10`), // Fantasy
                utils.fetchData(`${API_BASE}/anime?genres=24&order_by=score&sort=desc&limit=10`), // Sci-Fi
                utils.fetchData(`${API_BASE}/anime?genres=22&order_by=score&sort=desc&limit=10`), // Romance
                utils.fetchData(`${API_BASE}/anime?genres=4&order_by=score&sort=desc&limit=10`), // Comedy
                utils.fetchData(`${API_BASE}/anime?genres=14&order_by=score&sort=desc&limit=10`), // Horror
            ];
            
            const results = await Promise.allSettled(promises);
            
            this.allWallpapers = [];
            const seenIds = new Set();
            
            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value?.data) {
                    result.value.data.forEach(anime => {
                        // Avoid duplicates
                        if (!seenIds.has(anime.mal_id) && anime.images?.jpg?.large_image_url) {
                            seenIds.add(anime.mal_id);
                            
                            // Assign category based on which request it came from
                            let category = 'action';
                            if (index === 0) category = this.getRandomCategory();
                            else if (index === 1) category = 'action';
                            else if (index === 2) category = 'adventure';
                            else if (index === 3) category = 'action';
                            else if (index === 4) category = 'adventure';
                            else if (index === 5) category = 'fantasy';
                            else if (index === 6) category = 'sci-fi';
                            else if (index === 7) category = 'romance';
                            else if (index === 8) category = 'comedy';
                            else if (index === 9) category = 'horror';
                            
                            this.allWallpapers.push(this.createWallpaper(anime, category));
                        }
                    });
                }
            });
            
            // Shuffle for variety
            this.shuffleArray(this.allWallpapers);
            
            // Filter and render
            this.filterAndRender();
            
        } catch (error) {
            console.error('Error loading wallpapers:', error);
            this.showError();
        }
    }
    
    getRandomCategory() {
        const categories = ['action', 'adventure', 'fantasy', 'sci-fi', 'romance', 'comedy'];
        return categories[Math.floor(Math.random() * categories.length)];
    }
    
    createWallpaper(anime, category) {
        return {
            id: anime.mal_id,
            title: anime.title,
            image: anime.images.jpg.large_image_url,
            thumbnail: anime.images.jpg.image_url,
            category: category,
            resolution: this.resolutions[Math.floor(Math.random() * this.resolutions.length)],
            score: anime.score,
            type: anime.type,
            year: anime.year,
            genres: anime.genres?.map(g => g.name) || []
        };
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    filterAndRender() {
        // Apply filters
        this.filteredWallpapers = this.allWallpapers.filter(wp => {
            // Category filter
            if (this.activeCategory !== 'all' && wp.category !== this.activeCategory) {
                return false;
            }
            
            // Resolution filter
            if (this.activeResolution !== 'all') {
                const resNum = parseInt(wp.resolution.split('x')[1]);
                if (this.activeResolution === '4k' && resNum < 2160) return false;
                if (this.activeResolution === '1080p' && (resNum < 1080 || resNum >= 1440)) return false;
                if (this.activeResolution === '720p' && resNum >= 1080) return false;
            }
            
            // Search filter
            if (this.searchQuery && !wp.title.toLowerCase().includes(this.searchQuery.toLowerCase())) {
                return false;
            }
            
            return true;
        });
        
        // Render
        this.renderGrid();
        this.updateCount();
    }
    
    renderGrid() {
        const grid = document.getElementById('wallpapersGrid');
        if (!grid) return;
        
        const wallpapers = this.filteredWallpapers.slice(0, 24);
        
        if (wallpapers.length === 0) {
            document.getElementById('noResults').style.display = 'block';
            document.getElementById('loadMoreWrapper').style.display = 'none';
            grid.innerHTML = '';
            return;
        }
        
        document.getElementById('noResults').style.display = 'none';
        document.getElementById('loadMoreWrapper').style.display = 'block';
        
        grid.innerHTML = wallpapers.map(wp => this.createWallpaperCard(wp)).join('');
        
        // Add event listeners
        grid.querySelectorAll('.masonry-item').forEach((item, index) => {
            item.addEventListener('click', (e) => {
                // Don't trigger if clicking action buttons
                if (e.target.closest('.wallpaper-action-btn')) return;
                this.openPreview(wallpapers[index]);
            });
        });
        
        // Favorite buttons
        grid.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.toggleFavorite(id, btn);
            });
        });
        
        // Download buttons
        grid.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.downloadWallpaper(id);
            });
        });
    }
    
    createWallpaperCard(wp) {
        const isFavorite = this.favoriteWallpapers.includes(wp.id);
        const categoryLabel = wp.category.replace('-', ' ');
        
        return `
            <div class="masonry-item">
                <img src="${wp.thumbnail || wp.image}" 
                     alt="${wp.title}" 
                     loading="lazy"
                     onerror="this.src='assets/images/placeholder.jpg'">
                <span class="wallpaper-category-badge">${categoryLabel}</span>
                <div class="wallpaper-overlay">
                    <div class="wallpaper-info">
                        <h3 class="wallpaper-title">${wp.title}</h3>
                        <p class="wallpaper-resolution">${wp.resolution}</p>
                        <div class="wallpaper-actions">
                            <button class="wallpaper-action-btn favorite-btn ${isFavorite ? 'active' : ''}" 
                                    data-id="${wp.id}"
                                    title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                                <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                            </button>
                            <button class="wallpaper-action-btn download-btn" data-id="${wp.id}">
                                <i class="fas fa-download"></i> Download
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    openPreview(wp) {
        const modal = document.getElementById('wallpaperModal');
        const preview = document.getElementById('wallpaperPreview');
        
        if (!modal || !preview) return;
        
        modal.style.display = 'flex';
        
        const isFavorite = this.favoriteWallpapers.includes(wp.id);
        
        preview.innerHTML = `
            <img src="${wp.image}" alt="${wp.title}" onerror="this.src='assets/images/placeholder.jpg'">
            <div class="wallpaper-preview-info">
                <h2>${wp.title}</h2>
                <div class="wallpaper-preview-meta">
                    <span><i class="fas fa-tag"></i> ${wp.category.replace('-', ' ')}</span>
                    <span><i class="fas fa-desktop"></i> ${wp.resolution}</span>
                    ${wp.score ? `<span><i class="fas fa-star"></i> ${wp.score}</span>` : ''}
                    ${wp.type ? `<span><i class="fas fa-tv"></i> ${wp.type}</span>` : ''}
                    ${wp.year ? `<span><i class="fas fa-calendar"></i> ${wp.year}</span>` : ''}
                </div>
                ${wp.genres?.length ? `
                    <div class="wallpaper-preview-meta">
                        <span><strong>Genres:</strong> ${wp.genres.join(', ')}</span>
                    </div>
                ` : ''}
                <div class="preview-actions">
                    <button class="btn btn-primary" onclick="wallpapersPage.downloadWallpaper(${wp.id})">
                        <i class="fas fa-download"></i> Download (${wp.resolution})
                    </button>
                    <button class="btn ${isFavorite ? 'btn-accent' : 'btn-secondary'}" 
                            id="previewFavoriteBtn"
                            onclick="wallpapersPage.toggleFavoriteFromPreview(${wp.id})">
                        <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i> 
                        ${isFavorite ? 'Favorited' : 'Add to Favorites'}
                    </button>
                    <a href="anime.html?id=${wp.id}" class="btn btn-secondary">
                        <i class="fas fa-info-circle"></i> View Anime
                    </a>
                </div>
            </div>
        `;
        
        // Scroll to top of modal
        document.getElementById('wallpaperModalContent').scrollTop = 0;
    }
    
    toggleFavorite(id, button) {
        const index = this.favoriteWallpapers.indexOf(id);
        
        if (index > -1) {
            this.favoriteWallpapers.splice(index, 1);
            if (button) {
                button.classList.remove('active');
                button.querySelector('i').className = 'far fa-heart';
                button.title = 'Add to favorites';
            }
            this.showToast('Removed from favorites');
        } else {
            this.favoriteWallpapers.push(id);
            if (button) {
                button.classList.add('active');
                button.querySelector('i').className = 'fas fa-heart';
                button.title = 'Remove from favorites';
            }
            this.showToast('Added to favorites!');
        }
        
        localStorage.setItem('animeverse-favorite-wallpapers', JSON.stringify(this.favoriteWallpapers));
    }
    
    toggleFavoriteFromPreview(id) {
        const index = this.favoriteWallpapers.indexOf(id);
        const btn = document.getElementById('previewFavoriteBtn');
        
        if (index > -1) {
            this.favoriteWallpapers.splice(index, 1);
            if (btn) {
                btn.className = 'btn btn-secondary';
                btn.innerHTML = '<i class="far fa-heart"></i> Add to Favorites';
            }
            this.showToast('Removed from favorites');
        } else {
            this.favoriteWallpapers.push(id);
            if (btn) {
                btn.className = 'btn btn-accent';
                btn.style.background = 'var(--accent)';
                btn.innerHTML = '<i class="fas fa-heart"></i> Favorited';
            }
            this.showToast('Added to favorites!');
        }
        
        localStorage.setItem('animeverse-favorite-wallpapers', JSON.stringify(this.favoriteWallpapers));
        
        // Update grid button if visible
        const gridBtn = document.querySelector(`.favorite-btn[data-id="${id}"]`);
        if (gridBtn) {
            this.toggleFavorite(id, gridBtn);
        }
    }
    
    downloadWallpaper(id) {
        const wp = this.allWallpapers.find(w => w.id === id);
        if (!wp) return;
        
        // Create a temporary link to download
        const link = document.createElement('a');
        link.href = wp.image;
        link.download = `${wp.title.replace(/[^a-zA-Z0-9]/g, '_')}_${wp.resolution}.jpg`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast('Downloading wallpaper...');
    }
    
    updateCount() {
        document.getElementById('wallpaperCount').textContent = 
            `${this.filteredWallpapers.length} wallpapers`;
    }
    
    setupEventListeners() {
        // Category chips
        document.querySelectorAll('.category-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.activeCategory = chip.dataset.category;
                this.filterAndRender();
            });
        });
        
        // Resolution chips
        document.querySelectorAll('.res-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.res-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.activeResolution = chip.dataset.res;
                this.filterAndRender();
            });
        });
        
        // Search
        const searchInput = document.getElementById('wallpaperSearch');
        const searchClear = document.getElementById('searchClear');
        
        if (searchInput) {
            const debouncedSearch = utils.debounce(() => {
                this.searchQuery = searchInput.value.trim();
                if (searchClear) {
                    searchClear.style.display = this.searchQuery ? 'block' : 'none';
                }
                this.filterAndRender();
            }, 400);
            
            searchInput.addEventListener('input', debouncedSearch);
        }
        
        if (searchClear) {
            searchClear.addEventListener('click', () => {
                searchInput.value = '';
                this.searchQuery = '';
                searchClear.style.display = 'none';
                this.filterAndRender();
                searchInput.focus();
            });
        }
        
        // Clear search from no results
        document.getElementById('clearSearchBtn')?.addEventListener('click', () => {
            // Reset all filters
            this.activeCategory = 'all';
            this.activeResolution = 'all';
            this.searchQuery = '';
            
            document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
            document.querySelector('.category-chip[data-category="all"]')?.classList.add('active');
            
            document.querySelectorAll('.res-chip').forEach(c => c.classList.remove('active'));
            document.querySelector('.res-chip[data-res="all"]')?.classList.add('active');
            
            if (searchInput) {
                searchInput.value = '';
                searchClear.style.display = 'none';
            }
            
            this.filterAndRender();
        });
        
        // Modal close
        document.getElementById('wallpaperModalClose')?.addEventListener('click', () => {
            document.getElementById('wallpaperModal').style.display = 'none';
        });
        
        document.getElementById('wallpaperModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                document.getElementById('wallpaperModal').style.display = 'none';
            }
        });
        
        // Close modal with Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.getElementById('wallpaperModal').style.display = 'none';
            }
        });
        
        // Load more
        document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
            this.loadMore();
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
    
    loadMore() {
        // Since we load all at once, show message
        const btn = document.getElementById('loadMoreBtn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-check"></i> All Wallpapers Loaded';
        }
        this.showToast('All wallpapers are displayed');
    }
    
    setupBackToTop() {
        const btn = document.getElementById('backToTop');
        
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 500) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        });
        
        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    showToast(message) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        toast.textContent = message;
        toast.style.display = 'block';
        toast.style.animation = 'none';
        toast.offsetHeight;
        toast.style.animation = 'toastIn 0.3s ease';
        
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }
    
    showError() {
        document.getElementById('wallpapersGrid').innerHTML = `
            <div class="error-state" style="column-span: all; text-align: center; padding: var(--spacing-3xl);">
                <i class="fas fa-exclamation-triangle" style="font-size: 64px; color: #ff6b6b; display: block; margin-bottom: var(--spacing-lg);"></i>
                <h3>Failed to load wallpapers</h3>
                <p>Please try again later.</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

// Initialize wallpapers page
let wallpapersPage;
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('wallpapers.html')) {
        wallpapersPage = new WallpapersPage();
    }
});
