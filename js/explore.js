// Explore Page - Complete Search & Filter Functionality
class ExplorePage {
    constructor() {
        // State
        this.currentPage = 1;
        this.totalPages = 1;
        this.isLoading = false;
        this.hasMore = true;
        this.totalResults = 0;
        
        // Filters
        this.searchQuery = '';
        this.sortBy = '';
        this.typeFilter = '';
        this.statusFilter = '';
        this.ratingFilter = '';
        this.genreFilter = '';
        this.yearFilter = '';
        this.seasonFilter = '';
        
        // Genre list cache
        this.genres = [];
        
        this.init();
    }
    
    async init() {
        this.parseURLParams();
        this.setupEventListeners();
        await this.loadGenres();
        this.populateYearFilter();
        this.applyURLParams();
        await this.loadAnime(true);
        this.setupInfiniteScroll();
        this.setupBackToTop();
    }
    
    parseURLParams() {
        const params = new URLSearchParams(window.location.search);
        
        this.searchQuery = params.get('search') || '';
        this.sortBy = params.get('sort') || '';
        this.typeFilter = params.get('type') || '';
        this.statusFilter = params.get('status') || '';
        this.ratingFilter = params.get('rating') || '';
        this.genreFilter = params.get('genre') || '';
        this.yearFilter = params.get('year') || '';
        this.seasonFilter = params.get('season') || '';
    }
    
    applyURLParams() {
        // Set search input
        const searchInput = document.getElementById('exploreSearch');
        if (searchInput && this.searchQuery) {
            searchInput.value = this.searchQuery;
            document.getElementById('searchClear').style.display = 'block';
        }
        
        // Set filter selects
        if (this.sortBy) document.getElementById('sortBy').value = this.sortBy;
        if (this.typeFilter) document.getElementById('typeFilter').value = this.typeFilter;
        if (this.statusFilter) document.getElementById('statusFilter').value = this.statusFilter;
        if (this.ratingFilter) document.getElementById('ratingFilter').value = this.ratingFilter;
        if (this.yearFilter) document.getElementById('yearFilter').value = this.yearFilter;
        if (this.seasonFilter) document.getElementById('seasonFilter').value = this.seasonFilter;
        
        // Genre filter will be set after genres are loaded
        setTimeout(() => {
            if (this.genreFilter) {
                document.getElementById('genreFilter').value = this.genreFilter;
            }
        }, 500);
        
        this.updateActiveFilters();
    }
    
    async loadGenres() {
        try {
            const data = await utils.fetchData(`${API_BASE}/genres/anime`);
            if (data && data.data) {
                this.genres = data.data;
                this.populateGenreFilter();
            }
        } catch (error) {
            console.error('Error loading genres:', error);
        }
    }
    
    populateGenreFilter() {
        const select = document.getElementById('genreFilter');
        if (!select) return;
        
        // Keep the default option
        select.innerHTML = '<option value="">All Genres</option>';
        
        this.genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.mal_id;
            option.textContent = genre.name;
            select.appendChild(option);
        });
        
        // Set value after populating
        if (this.genreFilter) {
            select.value = this.genreFilter;
        }
    }
    
    populateYearFilter() {
        const select = document.getElementById('yearFilter');
        if (!select) return;
        
        const currentYear = new Date().getFullYear();
        
        for (let year = currentYear; year >= 1960; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            select.appendChild(option);
        }
        
        if (this.yearFilter) {
            select.value = this.yearFilter;
        }
    }
    
    buildAPIURL() {
        let url = `${API_BASE}/anime`;
        const params = new URLSearchParams();
        
        // Pagination
        params.append('page', this.currentPage);
        params.append('limit', 25);
        
        // Search query
        if (this.searchQuery) {
            url = `${API_BASE}/anime`;
            params.append('q', this.searchQuery);
        }
        
        // Sort
        if (this.sortBy) {
            params.append('order_by', this.sortBy);
            params.append('sort', 'desc');
            
            // Title should be ascending
            if (this.sortBy === 'title') {
                params.set('sort', 'asc');
            }
        }
        
        // Type filter
        if (this.typeFilter) {
            params.append('type', this.typeFilter);
        }
        
        // Status filter
        if (this.statusFilter) {
            params.append('status', this.statusFilter);
        }
        
        // Rating filter
        if (this.ratingFilter) {
            params.append('rating', this.ratingFilter);
        }
        
        // Genre filter
        if (this.genreFilter) {
            params.append('genres', this.genreFilter);
        }
        
        // Year filter (Jikan doesn't have direct year filter, so we use start_date)
        if (this.yearFilter) {
            params.append('start_date', `${this.yearFilter}-01-01`);
        }
        
        // Season filter requires year
        if (this.seasonFilter) {
            const year = this.yearFilter || new Date().getFullYear();
            url = `${API_BASE}/seasons/${year}/${this.seasonFilter}`;
            // Remove some params that don't apply to season endpoint
            params.delete('start_date');
        }
        
        return `${url}?${params.toString()}`;
    }
    
    async loadAnime(reset = false) {
        if (this.isLoading) return;
        if (!this.hasMore && !reset) return;
        
        this.isLoading = true;
        
        if (reset) {
            this.currentPage = 1;
            document.getElementById('resultsGrid').innerHTML = '';
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
            
            // Update pagination
            this.totalResults = data.pagination?.items?.total || 0;
            this.totalPages = data.pagination?.last_visible_page || 1;
            this.hasMore = data.pagination?.has_next_page || false;
            
            // Update results count
            document.getElementById('resultsCount').textContent = 
                `${this.totalResults.toLocaleString()} anime found`;
            
            // Render results
            if (reset) {
                document.getElementById('resultsGrid').innerHTML = 
                    data.data.map(anime => utils.createAnimeCard(anime)).join('');
            } else {
                document.getElementById('resultsGrid').insertAdjacentHTML(
                    'beforeend',
                    data.data.map(anime => utils.createAnimeCard(anime)).join('')
                );
            }
            
            // Show/hide load more
            this.updateLoadMoreButton();
            
            // Show no results if empty
            if (data.data.length === 0 && reset) {
                document.getElementById('noResults').style.display = 'block';
                document.getElementById('loadMoreWrapper').style.display = 'none';
            } else {
                document.getElementById('noResults').style.display = 'none';
            }
            
            // Hide error state
            document.getElementById('errorState').style.display = 'none';
            
        } catch (error) {
            console.error('Error loading anime:', error);
            if (reset) {
                this.showError();
            }
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
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
    
    async loadMore() {
        if (!this.hasMore || this.isLoading) return;
        
        this.currentPage++;
        await this.loadAnime(false);
        
        // Scroll to new content
        const lastCard = document.querySelector('.anime-card:last-child');
        if (lastCard) {
            lastCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    
    applyFilters() {
        this.updateURL();
        this.loadAnime(true);
        
        // Scroll to results
        document.querySelector('.results-section').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
    
    resetFilters() {
        // Reset all filter values
        this.searchQuery = '';
        this.sortBy = '';
        this.typeFilter = '';
        this.statusFilter = '';
        this.ratingFilter = '';
        this.genreFilter = '';
        this.yearFilter = '';
        this.seasonFilter = '';
        
        // Reset UI elements
        document.getElementById('exploreSearch').value = '';
        document.getElementById('searchClear').style.display = 'none';
        document.getElementById('sortBy').value = '';
        document.getElementById('typeFilter').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('ratingFilter').value = '';
        document.getElementById('genreFilter').value = '';
        document.getElementById('yearFilter').value = '';
        document.getElementById('seasonFilter').value = '';
        
        // Clear active filters
        document.getElementById('activeFilters').style.display = 'none';
        
        // Clear URL
        window.history.pushState({}, '', 'explore.html');
        
        // Reload
        this.loadAnime(true);
    }
    
    updateURL() {
        const params = new URLSearchParams();
        
        if (this.searchQuery) params.set('search', this.searchQuery);
        if (this.sortBy) params.set('sort', this.sortBy);
        if (this.typeFilter) params.set('type', this.typeFilter);
        if (this.statusFilter) params.set('status', this.statusFilter);
        if (this.ratingFilter) params.set('rating', this.ratingFilter);
        if (this.genreFilter) params.set('genre', this.genreFilter);
        if (this.yearFilter) params.set('year', this.yearFilter);
        if (this.seasonFilter) params.set('season', this.seasonFilter);
        
        const newURL = `explore.html${params.toString() ? '?' + params.toString() : ''}`;
        window.history.pushState({}, '', newURL);
    }
    
    updateActiveFilters() {
        const container = document.getElementById('activeFilters');
        const filters = [];
        
        // Build filter tags
        if (this.searchQuery) {
            filters.push({ label: `Search: "${this.searchQuery}"`, key: 'search' });
        }
        if (this.typeFilter) {
            filters.push({ label: `Type: ${this.typeFilter.toUpperCase()}`, key: 'type' });
        }
        if (this.statusFilter) {
            filters.push({ label: `Status: ${this.capitalize(this.statusFilter)}`, key: 'status' });
        }
        if (this.ratingFilter) {
            filters.push({ label: `Rating: ${this.ratingFilter.toUpperCase()}`, key: 'rating' });
        }
        if (this.genreFilter) {
            const genre = this.genres.find(g => g.mal_id == this.genreFilter);
            if (genre) {
                filters.push({ label: `Genre: ${genre.name}`, key: 'genre' });
            }
        }
        if (this.yearFilter) {
            filters.push({ label: `Year: ${this.yearFilter}`, key: 'year' });
        }
        if (this.seasonFilter) {
            filters.push({ label: `Season: ${this.capitalize(this.seasonFilter)}`, key: 'season' });
        }
        
        if (filters.length > 0) {
            container.style.display = 'flex';
            container.innerHTML = filters.map(filter => `
                <span class="active-filter-tag">
                    ${filter.label}
                    <button class="remove-filter" data-filter="${filter.key}" aria-label="Remove ${filter.key} filter">
                        <i class="fas fa-times"></i>
                    </button>
                </span>
            `).join('');
            
            // Add click handlers to remove buttons
            container.querySelectorAll('.remove-filter').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const filterKey = e.currentTarget.dataset.filter;
                    this.removeFilter(filterKey);
                });
            });
        } else {
            container.style.display = 'none';
        }
    }
    
    removeFilter(key) {
        switch(key) {
            case 'search':
                this.searchQuery = '';
                document.getElementById('exploreSearch').value = '';
                document.getElementById('searchClear').style.display = 'none';
                break;
            case 'sort':
                this.sortBy = '';
                document.getElementById('sortBy').value = '';
                break;
            case 'type':
                this.typeFilter = '';
                document.getElementById('typeFilter').value = '';
                break;
            case 'status':
                this.statusFilter = '';
                document.getElementById('statusFilter').value = '';
                break;
            case 'rating':
                this.ratingFilter = '';
                document.getElementById('ratingFilter').value = '';
                break;
            case 'genre':
                this.genreFilter = '';
                document.getElementById('genreFilter').value = '';
                break;
            case 'year':
                this.yearFilter = '';
                document.getElementById('yearFilter').value = '';
                break;
            case 'season':
                this.seasonFilter = '';
                document.getElementById('seasonFilter').value = '';
                break;
        }
        
        this.applyFilters();
    }
    
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('exploreSearch');
        const searchClear = document.getElementById('searchClear');
        
        if (searchInput) {
            const debouncedSearch = utils.debounce(() => {
                this.searchQuery = searchInput.value.trim();
                if (searchClear) {
                    searchClear.style.display = this.searchQuery ? 'block' : 'none';
                }
                this.applyFilters();
            }, 500);
            
            searchInput.addEventListener('input', debouncedSearch);
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.searchQuery = searchInput.value.trim();
                    this.applyFilters();
                }
            });
        }
        
        if (searchClear) {
            searchClear.addEventListener('click', () => {
                searchInput.value = '';
                this.searchQuery = '';
                searchClear.style.display = 'none';
                this.applyFilters();
                searchInput.focus();
            });
        }
        
        // Filter selects
        document.getElementById('sortBy').addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('typeFilter').addEventListener('change', (e) => {
            this.typeFilter = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.statusFilter = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('ratingFilter').addEventListener('change', (e) => {
            this.ratingFilter = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('genreFilter').addEventListener('change', (e) => {
            this.genreFilter = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('yearFilter').addEventListener('change', (e) => {
            this.yearFilter = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('seasonFilter').addEventListener('change', (e) => {
            this.seasonFilter = e.target.value;
            this.applyFilters();
        });
        
        // Load more button
        document.getElementById('loadMoreBtn').addEventListener('click', () => {
            this.loadMore();
        });
        
        // Reset filters
        document.getElementById('resetFilters').addEventListener('click', () => {
            this.resetFilters();
        });
        
        // Clear search from no results
        document.getElementById('clearSearchBtn').addEventListener('click', () => {
            this.resetFilters();
        });
        
        // Navigation search
        const navSearch = document.getElementById('navSearch');
        if (navSearch) {
            navSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && navSearch.value.trim()) {
                    this.searchQuery = navSearch.value.trim();
                    document.getElementById('exploreSearch').value = this.searchQuery;
                    document.getElementById('searchClear').style.display = 'block';
                    this.applyFilters();
                }
            });
        }
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
        
        // Observe load more button
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
    
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Initialize explore page
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('explore.html')) {
        new ExplorePage();
    }
});
