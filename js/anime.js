// Anime Details Page
class AnimeDetails {
    constructor() {
        this.animeId = new URLSearchParams(window.location.search).get('id');
        if (this.animeId) {
            this.init();
        }
    }
    
    async init() {
        await this.loadAnimeDetails();
        await this.loadCharacters();
        await this.loadRecommendations();
    }
    
    async loadAnimeDetails() {
        const data = await utils.fetchData(`${API_BASE}/anime/${this.animeId}/full`);
        if (!data || !data.data) return;
        
        const anime = data.data;
        this.renderAnimeDetails(anime);
    }
    
    renderAnimeDetails(anime) {
        // Update page title
        document.title = `${anime.title} - AnimeVerse`;
        
        // Update hero section
        const poster = document.getElementById('animePoster');
        const title = document.getElementById('animeTitle');
        const synopsis = document.getElementById('animeSynopsis');
        
        if (poster) poster.src = anime.images.jpg.large_image_url;
        if (title) title.textContent = anime.title;
        if (synopsis) synopsis.textContent = anime.synopsis || 'No synopsis available.';
        
        // Update metadata
        this.updateMetaData(anime);
        
        // Update trailer
        if (anime.trailer && anime.trailer.embed_url) {
            const trailerContainer = document.getElementById('trailerContainer');
            if (trailerContainer) {
                trailerContainer.innerHTML = `
                    <iframe src="${anime.trailer.embed_url}" 
                            frameborder="0" 
                            allowfullscreen
                            class="trailer-video">
                    </iframe>
                `;
            }
        }
    }
    
    updateMetaData(anime) {
        const metaData = [
            { id: 'animeScore', value: anime.score || 'N/A' },
            { id: 'animeRank', value: anime.rank ? `#${anime.rank}` : 'N/A' },
            { id: 'animePopularity', value: anime.popularity ? `#${anime.popularity}` : 'N/A' },
            { id: 'animeType', value: anime.type || 'N/A' },
            { id: 'animeEpisodes', value: anime.episodes || 'Unknown' },
            { id: 'animeStatus', value: anime.status || 'N/A' },
            { id: 'animeAired', value: anime.aired?.string || 'N/A' },
            { id: 'animeSeason', value: anime.season ? `${anime.season} ${anime.year}` : 'N/A' },
            { id: 'animeStudios', value: anime.studios?.map(s => s.name).join(', ') || 'N/A' },
            { id: 'animeGenres', value: anime.genres?.map(g => g.name).join(', ') || 'N/A' }
        ];
        
        metaData.forEach(({ id, value }) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }
    
    async loadCharacters() {
        const data = await utils.fetchData(`${API_BASE}/anime/${this.animeId}/characters`);
        if (!data || !data.data) return;
        
        const grid = document.getElementById('charactersGrid');
        if (!grid) return;
        
        const characters = data.data.slice(0, 12);
        grid.innerHTML = characters.map(item => {
            const char = item.character;
            return `
                <div class="character-card" onclick="window.location.href='characters.html?id=${char.mal_id}'">
                    <div class="character-card-image">
                        <img src="${char.images.jpg.image_url}" 
                             alt="${char.name}" 
                             loading="lazy"
                             onerror="this.src='assets/images/placeholder.jpg'">
                    </div>
                    <h3 class="character-card-name">${char.name}</h3>
                    <p class="character-role">${item.role}</p>
                </div>
            `;
        }).join('');
    }
    
    async loadRecommendations() {
        const data = await utils.fetchData(`${API_BASE}/anime/${this.animeId}/recommendations`);
        if (!data || !data.data) return;
        
        const grid = document.getElementById('recommendationsGrid');
        if (!grid) return;
        
        const recommendations = data.data.slice(0, 6);
        grid.innerHTML = recommendations.map(rec => {
            return utils.createAnimeCard(rec.entry);
        }).join('');
    }
}

// Initialize if on anime details page
if (window.location.pathname.includes('anime.html')) {
    new AnimeDetails();
}
