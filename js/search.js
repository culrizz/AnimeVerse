// Search Functionality
class SearchManager {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.searchResults = document.getElementById('searchResults');
        this.searchQuery = new URLSearchParams(window.location.search).get('search');
        
        if (this.searchQuery) {
            this.performSearch(this.searchQuery);
        }
        
        this.init();
    }
    
    init() {
        if (this.searchInput) {
            const debouncedSearch = utils.debounce((e) => {
                const query = e.target.value.trim();
                if (query.length >= 3) {
                    this.performSearch(query);
                }
            }, 500);
            
            this.searchInput.addEventListener('input', debouncedSearch);
        }
    }
    
    async performSearch(query) {
        if (!this.searchResults) return;
        
        this.searchResults.innerHTML = '<div class="loading">Searching...</div>';
        
        const data = await utils.fetchData(`${API_BASE}/anime?q=${encodeURIComponent(query)}&limit=20`);
        
        if (!data || !data.data) {
            this.searchResults.innerHTML = '<p>No results found.</p>';
            return;
        }
        
        if (data.data.length === 0) {
            this.searchResults.innerHTML = '<p>No anime found matching your search.</p>';
            return;
        }
        
        this.searchResults.innerHTML = data.data.map(anime => utils.createAnimeCard(anime)).join('');
    }
}

// Initialize search if on explore page
if (document.getElementById('searchResults')) {
    new SearchManager();
}
