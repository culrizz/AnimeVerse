// Characters Page - Complete Functionality
class CharactersPage {
    constructor() {
        // State
        this.currentPage = 1;
        this.totalPages = 1;
        this.isLoading = false;
        this.hasMore = true;
        this.totalResults = 0;
        this.currentView = 'grid';
        
        // Filters
        this.searchQuery = '';
        this.activeFilter = 'all';
        this.animeId = null;
        this.animeContext = null;
        
        // Favorites (local storage)
        this.favoriteCharacters = JSON.parse(localStorage.getItem('animeverse-favorite-characters') || '[]');
        
        this.init();
    }
    
    async init() {
        this.parseURLParams();
        this.setupEventListeners();
        this.setupBackToTop();
        
        if (this.animeId) {
            await this.loadAnimeContext();
        }
        
        await this.loadCharacters(true);
        this.setupInfiniteScroll();
    }
    
    parseURLParams() {
        const params = new URLSearchParams(window.location.search);
        
        this.searchQuery = params.get('search') || '';
        this.animeId = params.get('anime') || null;
        this.activeFilter = params.get('filter') || 'all';
        
        // Set search input if query exists
        if (this.searchQuery) {
            const searchInput = document.getElementById('characterSearch');
            if (searchInput) {
                searchInput.value = this.searchQuery;
                document.getElementById('searchClear').style.display = 'block';
            }
        }
        
        // Set active filter chip
        if (this.activeFilter && this.activeFilter !== 'all') {
            document.querySelectorAll('.filter-chip').forEach(chip => {
                chip.classList.remove('active');
                if (chip.dataset.filter === this.activeFilter) {
                    chip.classList.add('active');
                }
            });
        }
    }
    
    async loadAnimeContext() {
        try {
            const data = await utils.fetchData(`${API_BASE}/anime/${this.animeId}`);
            if (data && data.data) {
                this.animeContext = data.data;
                this.renderAnimeContext();
            }
        } catch (error) {
            console.error('Error loading anime context:', error);
        }
    }
    
    renderAnimeContext() {
        const contextSection = document.getElementById('animeContext');
        const contextCard = document.getElementById('contextCard');
        
        if (!contextSection || !contextCard || !this.animeContext) return;
        
        contextSection.style.display = 'block';
        contextCard.innerHTML = `
            <img src="${this.animeContext.images.jpg.small_image_url}" 
                 alt="${this.animeContext.title}"
                 onerror="this.src='assets/images/placeholder.jpg'">
            <div class="context-card-info">
                <h3>Characters from ${this.animeContext.title}</h3>
                <p>${this.animeContext.type} • ${this.animeContext.episodes || '?'} episodes</p>
            </div>
            <i class="fas fa-chevron-right context-card-arrow"></i>
        `;
        
        contextCard.addEventListener('click', () => {
            window.location.href = `anime.html?id=${this.animeId}`;
        });
    }
    
    buildAPIURL() {
        const params = new URLSearchParams();
        params.append('page', this.currentPage);
        params.append('limit', 24);
        
        if (this.searchQuery) {
            // Search by name
            params.append('q', this.searchQuery);
        }
        
        // Different endpoints based on filter
        let url = `${API_BASE}/characters`;
        
        switch (this.activeFilter) {
            case 'top':
                url = `${API_BASE}/top/characters`;
                break;
            case 'favorites':
                params.append('order_by', 'favorites');
                params.append('sort', 'desc');
                break;
            case 'popular':
                params.append('order_by', 'favorites');  // Closest to popularity
                params.append('sort', 'desc');
                break;
        }
        
        // If coming from anime page, load that anime's characters
        if (this.animeId && !this.searchQuery) {
            url = `${API_BASE}/anime/${this.animeId}/characters`;
            params.delete('q');
        }
        
        return `${url}?${params.toString()}`;
    }
    
    async loadCharacters(reset = false) {
        if (this.isLoading) return;
        if (!this.hasMore && !reset) return;
        
        this.isLoading = true;
        
        if (reset) {
            this.currentPage = 1;
            document.getElementById('charactersGrid').innerHTML = '';
            this.hasMore = true;
        }
        
        this.showLoading(true);
        
        try {
            const url = this.buildAPIURL();
            const data = await utils.fetchData(url);
            
            if (!data || !data.data) {
                this.showError();
                return;
            }
            
            // Handle different response structures
            let characters = [];
            if (this.animeId && !this.searchQuery) {
                // Anime characters endpoint returns { character: ..., role: ... }
                characters = data.data.map(item => ({
                    ...item.character,
                    role: item.role,
                    voice_actors: item.voice_actors || []
                }));
            } else {
                characters = data.data;
            }
            
            // Update pagination
            this.totalResults = data.pagination?.items?.total || characters.length;
            this.totalPages = data.pagination?.last_visible_page || 1;
            this.hasMore = data.pagination?.has_next_page || false;
            
            // Update results count
            document.getElementById('resultsCount').textContent = 
                `${this.totalResults.toLocaleString()} characters found`;
            
            // Render
            if (reset) {
                document.getElementById('charactersGrid').innerHTML = 
                    characters.map(char => this.createCharacterCard(char)).join('');
            } else {
                document.getElementById('charactersGrid').insertAdjacentHTML(
                    'beforeend',
                    characters.map(char => this.createCharacterCard(char)).join('')
                );
            }
            
            // Update load more button
            this.updateLoadMoreButton();
            
            // Show/hide no results
            if (characters.length === 0 && reset) {
                document.getElementById('noResults').style.display = 'block';
                document.getElementById('loadMoreWrapper').style.display = 'none';
            } else {
                document.getElementById('noResults').style.display = 'none';
            }
            
            document.getElementById('errorState').style.display = 'none';
            
            // Re-apply view mode
            this.applyViewMode();
            
        } catch (error) {
            console.error('Error loading characters:', error);
            if (reset) {
                this.showError();
            }
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }
    
    createCharacterCard(character) {
        const isFavorite = this.favoriteCharacters.includes(character.mal_id.toString());
        const name = character.name || 'Unknown';
        const imageUrl = character.images?.jpg?.image_url || 'assets/images/placeholder.jpg';
        
        // For list view - voice actors
        const voiceActors = character.voice_actors?.slice(0, 2) || [];
        const voiceActorsHTML = voiceActors.map(va => `
            <div class="voice-actor-mini">
                <img src="${va.person.images?.jpg?.image_url || 'assets/images/placeholder.jpg'}" 
                     alt="${va.person.name}"
                     onerror="this.style.display='none'">
                <span>${va.person.name}</span>
            </div>
        `).join('');
        
        return `
            <div class="character-card" data-id="${character.mal_id}" onclick="charactersPage.openCharacterDetail(${character.mal_id})">
                <div class="character-card-image">
                    <img src="${imageUrl}" 
                         alt="${name}" 
                         loading="lazy"
                         onerror="this.src='assets/images/placeholder.jpg'">
                </div>
                <button class="character-card-favorite ${isFavorite ? 'active' : ''}" 
                        data-id="${character.mal_id}"
                        onclick="event.stopPropagation(); charactersPage.toggleFavorite(${character.mal_id}, this)"
                        title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                    <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                </button>
                <div class="character-card-info">
                    <h3 class="character-card-name">${name}</h3>
                    ${character.role ? `<p class="character-card-role">${character.role}</p>` : ''}
                    ${this.currentView === 'list' && voiceActors.length > 0 ? 
                        `<div class="character-voice-actors">${voiceActorsHTML}</div>` : ''}
                </div>
            </div>
        `;
    }
    
    async openCharacterDetail(characterId) {
        const modal = document.getElementById('characterModal');
        const modalBody = document.getElementById('modalBody');
        
        if (!modal || !modalBody) return;
        
        // Show loading in modal
        modal.style.display = 'flex';
        modalBody.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading character details...</p></div>';
        
        try {
            const data = await utils.fetchData(`${API_BASE}/characters/${characterId}/full`);
            if (!data || !data.data) {
                modalBody.innerHTML = '<p class="error-state">Failed to load character details.</p>';
                return;
            }
            
            const char = data.data;
            this.renderCharacterDetail(char, modalBody);
            
        } catch (error) {
            console.error('Error loading character details:', error);
            modalBody.innerHTML = '<p class="error-state">Failed to load character details.</p>';
        }
    }
    
    renderCharacterDetail(char, container) {
        const voiceActors = char.voice_actors || [];
        const animeAppearances = char.anime || [];
        const mangaAppearances = char.manga || [];
        
        container.innerHTML = `
            <div class="character-detail">
                <div class="character-detail-image">
                    <img src="${char.images?.jpg?.image_url || 'assets/images/placeholder.jpg'}" 
                         alt="${char.name}"
                         onerror="this.src='assets/images/placeholder.jpg'">
                </div>
                <div class="character-detail-info">
                    <h2>${char.name}</h2>
                    ${char.name_kanji ? `<p class="character-detail-name-jp">${char.name_kanji}</p>` : ''}
                    
                    ${char.about ? `
                        <div class="character-detail-about">
                            <p>${char.about.substring(0, 500)}${char.about.length > 500 ? '...' : ''}</p>
                        </div>
                    ` : ''}
                    
                    <div class="character-detail-meta">
                        ${char.nicknames?.length ? `
                            <div class="detail-meta-item">
                                <span class="label">Nicknames</span>
                                <span class="value">${char.nicknames.join(', ')}</span>
                            </div>
                        ` : ''}
                        ${char.favorites ? `
                            <div class="detail-meta-item">
                                <span class="label">Favorites</span>
                                <span class="value">${char.favorites.toLocaleString()}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${voiceActors.length > 0 ? `
                        <div class="voice-actors-section">
                            <h3><i class="fas fa-microphone"></i> Voice Actors</h3>
                            ${voiceActors.slice(0, 5).map(va => `
                                <div class="voice-actor-card">
                                    <img src="${va.person.images?.jpg?.image_url || 'assets/images/placeholder.jpg'}" 
                                         alt="${va.person.name}"
                                         onerror="this.src='assets/images/placeholder.jpg'">
                                    <div class="voice-actor-card-info">
                                        <h4>${va.person.name}</h4>
                                        <p>${va.language}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    ${animeAppearances.length > 0 ? `
                        <div class="anime-appearances">
                            <h3><i class="fas fa-tv"></i> Anime Appearances</h3>
                            ${animeAppearances.slice(0, 10).map(anime => `
                                <div class="appearance-card" onclick="window.location.href='anime.html?id=${anime.anime.mal_id}'">
                                    <img src="${anime.anime.images?.jpg?.small_image_url || 'assets/images/placeholder.jpg'}" 
                                         alt="${anime.anime.title}"
                                         onerror="this.style.display='none'">
                                    <span>${anime.anime.title}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    toggleFavorite(characterId, button) {
        const id = characterId.toString();
        const index = this.favoriteCharacters.indexOf(id);
        
        if (index > -1) {
            this.favoriteCharacters.splice(index, 1);
            button.classList.remove('active');
            button.querySelector('i').className = 'far fa-heart';
            button.title = 'Add to favorites';
        } else {
            this.favoriteCharacters.push(id);
            button.classList.add('active');
            button.querySelector('i').className = 'fas fa-heart';
            button.title = 'Remove from favorites';
        }
        
        localStorage.setItem('animeverse-favorite-characters', JSON.stringify(this.favoriteCharacters));
        
        // Animate heart
        button.style.transform = 'scale(1.3)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 200);
    }
    
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('characterSearch');
        const searchClear = document.getElementById('searchClear');
        
        if (searchInput) {
            const debouncedSearch = utils.debounce(() => {
                this.searchQuery = searchInput.value.trim();
                if (searchClear) {
                    searchClear.style.display = this.searchQuery ? 'block' : 'none';
                }
                // Clear anime context when searching
                if (this.searchQuery && this.animeId) {
                    this.animeId = null;
                    this.animeContext = null;
                    document.getElementById('animeContext').style.display = 'none';
                }
                this.updateURL();
                this.loadCharacters(true);
            }, 500);
            
            searchInput.addEventListener('input', debouncedSearch);
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.searchQuery = searchInput.value.trim();
                    this.updateURL();
                    this.loadCharacters(true);
                }
            });
        }
        
        if (searchClear) {
            searchClear.addEventListener('click', () => {
                searchInput.value = '';
                this.searchQuery = '';
                searchClear.style.display = 'none';
                this.updateURL();
                this.loadCharacters(true);
                searchInput.focus();
            });
        }
        
        // Filter chips
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.activeFilter = chip.dataset.filter;
                this.updateURL();
                this.loadCharacters(true);
            });
        });
        
        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentView = btn.dataset.view;
                this.applyViewMode();
            });
        });
        
        // Load more
        document.getElementById('loadMoreBtn').addEventListener('click', () => {
            this.loadMore();
        });
        
        // Clear search from no results
        document.getElementById('clearSearchBtn').addEventListener('click', () => {
            searchInput.value = '';
            this.searchQuery = '';
            searchClear.style.display = 'none';
            this.updateURL();
            this.loadCharacters(true);
        });
        
        // Modal close
        document.getElementById('modalClose').addEventListener('click', () => {
            document.getElementById('characterModal').style.display = 'none';
        });
        
        document.getElementById('characterModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                document.getElementById('characterModal').style.display = 'none';
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.getElementById('characterModal').style.display = 'none';
            }
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
    
    applyViewMode() {
        const grid = document.getElementById('charactersGrid');
        if (this.currentView === 'list') {
            grid.classList.add('list-view');
        } else {
            grid.classList.remove('list-view');
        }
    }
    
    async loadMore() {
        if (!this.hasMore || this.isLoading) return;
        this.currentPage++;
        await this.loadCharacters(false);
    }
    
    setupInfiniteScroll() {
        const options = {
            root: null,
            rootMargin: '200px',
            threshold: 0.1
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && this.hasMore && !this.isLoading) {
                    this.loadMore();
                }
            });
        }, options);
        
        const loadMoreWrapper = document.getElementById('loadMoreWrapper');
        if (loadMoreWrapper) {
            observer.observe(loadMoreWrapper);
        }
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
    
    updateURL() {
        const params = new URLSearchParams();
        
        if (this.searchQuery) params.set('search', this.searchQuery);
        if (this.animeId && !this.searchQuery) params.set('anime', this.animeId);
        if (this.activeFilter && this.activeFilter !== 'all') params.set('filter', this.activeFilter);
        
        const newURL = `characters.html${params.toString() ? '?' + params.toString() : ''}`;
        window.history.pushState({}, '', newURL);
    }
    
    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        
        if (show && this.currentPage > 1) {
            spinner.style.display = 'block';
            if (loadMoreBtn) loadMoreBtn.disabled = true;
        } else {
            spinner.style.display = 'none';
            if (loadMoreBtn) loadMoreBtn.disabled = false;
        }
    }
    
    updateLoadMoreButton() {
        const wrapper = document.getElementById('loadMoreWrapper');
        const btn = document.getElementById('loadMoreBtn');
        
        if (this.hasMore) {
            wrapper.style.display = 'block';
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-plus"></i> Load More';
            }
        } else if (this.totalResults > 0) {
            wrapper.style.display = 'block';
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-check"></i> All Loaded';
            }
        } else {
            wrapper.style.display = 'none';
        }
    }
    
    showError() {
        document.getElementById('errorState').style.display = 'block';
        document.getElementById('noResults').style.display = 'none';
        document.getElementById('loadMoreWrapper').style.display = 'none';
    }
}

// Initialize characters page
let charactersPage;
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('characters.html')) {
        charactersPage = new CharactersPage();
    }
});
