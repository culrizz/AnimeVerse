// News Page Manager
class NewsPage {
    constructor() {
        // State
        this.currentPage = 1;
        this.isLoading = false;
        this.hasMore = true;
        this.activeCategory = 'all';
        this.allArticles = [];
        this.filteredArticles = [];
        
        // Article generators for different categories
        this.articleTemplates = {
            'new-releases': {
                title: (anime) => `New Release: ${anime.title}`,
                excerpt: (anime) => `${anime.title} has been released! ${anime.synopsis ? anime.synopsis.substring(0, 150) + '...' : 'Check out this new anime now!'}`,
                badge: 'New Release',
                badgeClass: 'badge-new'
            },
            'upcoming': {
                title: (anime) => `Coming Soon: ${anime.title}`,
                excerpt: (anime) => `Get ready for ${anime.title}! Scheduled for release. ${anime.synopsis ? anime.synopsis.substring(0, 150) + '...' : 'Stay tuned for more details.'}`,
                badge: 'Upcoming',
                badgeClass: 'badge-upcoming'
            },
            'trending': {
                title: (anime) => `Trending: ${anime.title} Gains Popularity`,
                excerpt: (anime) => `${anime.title} is currently trending with a score of ${anime.score || 'N/A'}! Fans are loving this ${anime.type?.toLowerCase() || 'anime'}. ${anime.synopsis ? anime.synopsis.substring(0, 120) + '...' : ''}`,
                badge: 'Trending',
                badgeClass: 'badge-trending'
            },
            'movies': {
                title: (anime) => `Anime Movie: ${anime.title}`,
                excerpt: (anime) => `Don't miss ${anime.title}, an exciting anime movie! ${anime.synopsis ? anime.synopsis.substring(0, 150) + '...' : 'Experience it on the big screen.'}`,
                badge: 'Movie',
                badgeClass: 'badge-movie'
            },
            'seasonal': {
                title: (anime) => `This Season: ${anime.title}`,
                excerpt: (anime) => `${anime.title} is airing this season! ${anime.synopsis ? anime.synopsis.substring(0, 150) + '...' : 'Watch the latest episodes now.'}`,
                badge: 'Seasonal',
                badgeClass: 'badge-seasonal'
            }
        };
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        this.setupBackToTop();
        await this.loadAllArticles();
        this.updateQuickStats();
        this.generateTopics();
    }
    
    async loadAllArticles() {
        try {
            // Fetch multiple sources for news-like content
            const [seasonal, upcoming, topRated, movies] = await Promise.all([
                utils.fetchData(`${API_BASE}/seasons/now?limit=8`),
                utils.fetchData(`${API_BASE}/seasons/upcoming?limit=8`),
                utils.fetchData(`${API_BASE}/top/anime?limit=8`),
                utils.fetchData(`${API_BASE}/anime?type=movie&order_by=score&sort=desc&limit=8`)
            ]);
            
            this.allArticles = [];
            
            // Process seasonal anime
            if (seasonal?.data) {
                seasonal.data.forEach(anime => {
                    this.allArticles.push(this.createArticle(anime, 'seasonal'));
                });
            }
            
            // Process upcoming anime
            if (upcoming?.data) {
                upcoming.data.forEach(anime => {
                    this.allArticles.push(this.createArticle(anime, 'upcoming'));
                });
            }
            
            // Process top rated as trending
            if (topRated?.data) {
                topRated.data.forEach((anime, index) => {
                    this.allArticles.push(this.createArticle(anime, 'trending'));
                });
            }
            
            // Process movies
            if (movies?.data) {
                movies.data.forEach(anime => {
                    this.allArticles.push(this.createArticle(anime, 'movies'));
                });
            }
            
            // Add some "new releases" from top anime
            if (topRated?.data) {
                topRated.data.slice(0, 4).forEach(anime => {
                    this.allArticles.push(this.createArticle(anime, 'new-releases'));
                });
            }
            
            // Shuffle articles for variety
            this.shuffleArray(this.allArticles);
            
            // Add unique IDs and dates
            this.allArticles = this.allArticles.map((article, index) => ({
                ...article,
                id: index + 1,
                date: this.generateRandomDate(),
                views: Math.floor(Math.random() * 10000) + 500,
                comments: Math.floor(Math.random() * 200)
            }));
            
            // Render
            this.filterAndRender();
            
        } catch (error) {
            console.error('Error loading news:', error);
            this.showError();
        }
    }
    
    createArticle(anime, category) {
        const template = this.articleTemplates[category] || this.articleTemplates['new-releases'];
        
        return {
            animeId: anime.mal_id,
            title: template.title(anime),
            excerpt: template.excerpt(anime),
            badge: template.badge,
            badgeClass: template.badgeClass,
            category: category,
            image: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || 'assets/images/placeholder.jpg',
            animeTitle: anime.title,
            score: anime.score,
            type: anime.type,
            episodes: anime.episodes,
            status: anime.status,
            synopsis: anime.synopsis,
            year: anime.year,
            season: anime.season,
            genres: anime.genres?.map(g => g.name) || [],
            studios: anime.studios?.map(s => s.name) || []
        };
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    generateRandomDate() {
        const now = new Date();
        const daysAgo = Math.floor(Math.random() * 30);
        const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        return date.toISOString();
    }
    
    filterAndRender() {
        // Filter by category
        if (this.activeCategory === 'all') {
            this.filteredArticles = [...this.allArticles];
        } else {
            this.filteredArticles = this.allArticles.filter(
                article => article.category === this.activeCategory
            );
        }
        
        // Render featured article (first one)
        this.renderFeatured();
        
        // Render news grid (first 12)
        this.renderNewsGrid();
        
        // Update load more
        this.updateLoadMoreButton();
    }
    
    renderFeatured() {
        const featuredCard = document.getElementById('featuredCard');
        if (!featuredCard || this.filteredArticles.length === 0) return;
        
        const article = this.filteredArticles[0];
        
        featuredCard.innerHTML = `
            <div class="featured-card-image" style="background-image: url('${article.image}');"></div>
            <div class="featured-card-overlay"></div>
            <div class="featured-card-content">
                <span class="featured-badge">${article.badge}</span>
                <h2>${article.title}</h2>
                <p>${article.excerpt}</p>
                <div class="featured-meta">
                    <span><i class="fas fa-calendar"></i> ${utils.formatDate(article.date)}</span>
                    <span><i class="fas fa-eye"></i> ${article.views.toLocaleString()} views</span>
                    <span><i class="fas fa-comment"></i> ${article.comments} comments</span>
                </div>
            </div>
        `;
        
        featuredCard.addEventListener('click', () => this.openArticle(article));
    }
    
    renderNewsGrid() {
        const grid = document.getElementById('newsGrid');
        if (!grid) return;
        
        // Skip the first article (it's featured)
        const articles = this.filteredArticles.slice(1, 13);
        
        if (articles.length === 0) {
            grid.innerHTML = `
                <div class="no-results" style="grid-column: 1/-1;">
                    <i class="fas fa-newspaper"></i>
                    <h3>No news articles</h3>
                    <p>Check back later for updates!</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = articles.map(article => this.createNewsCard(article)).join('');
        
        // Add click handlers
        grid.querySelectorAll('.news-card').forEach((card, index) => {
            card.addEventListener('click', () => this.openArticle(articles[index]));
        });
    }
    
    createNewsCard(article) {
        return `
            <div class="news-card">
                <div class="news-card-image">
                    <img src="${article.image}" 
                         alt="${article.animeTitle}" 
                         loading="lazy"
                         onerror="this.src='assets/images/placeholder.jpg'">
                    <span class="news-card-badge ${article.badgeClass}">${article.badge}</span>
                </div>
                <div class="news-card-content">
                    <span class="news-card-category">${article.category.replace('-', ' ')}</span>
                    <h3 class="news-card-title">${article.title}</h3>
                    <p class="news-card-excerpt">${article.excerpt}</p>
                    <div class="news-card-footer">
                        <span>${utils.formatDate(article.date)}</span>
                        <div class="news-card-stats">
                            <span><i class="fas fa-eye"></i> ${article.views.toLocaleString()}</span>
                            <span><i class="fas fa-comment"></i> ${article.comments}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    openArticle(article) {
        const modal = document.getElementById('articleModal');
        const body = document.getElementById('articleModalBody');
        
        if (!modal || !body) return;
        
        modal.style.display = 'flex';
        
        body.innerHTML = `
            <img src="${article.image}" alt="${article.animeTitle}" class="article-full-image" onerror="this.style.display='none'">
            <h1 class="article-full-title">${article.title}</h1>
            <div class="article-full-meta">
                <span><i class="fas fa-calendar"></i> ${utils.formatDate(article.date)}</span>
                <span><i class="fas fa-folder"></i> ${article.category.replace('-', ' ')}</span>
                <span><i class="fas fa-eye"></i> ${article.views.toLocaleString()} views</span>
                <span><i class="fas fa-star"></i> Score: ${article.score || 'N/A'}</span>
            </div>
            <div class="article-full-body">
                <p>${article.excerpt}</p>
                <p>${article.synopsis || 'No additional details available.'}</p>
                ${article.genres.length > 0 ? `
                    <p><strong>Genres:</strong> ${article.genres.join(', ')}</p>
                ` : ''}
                ${article.studios.length > 0 ? `
                    <p><strong>Studios:</strong> ${article.studios.join(', ')}</p>
                ` : ''}
                ${article.type ? `
                    <p><strong>Type:</strong> ${article.type} ${article.episodes ? `• ${article.episodes} episodes` : ''}</p>
                ` : ''}
            </div>
            <div class="article-cta">
                <p>Want to learn more about this anime?</p>
                <a href="anime.html?id=${article.animeId}" class="btn btn-primary">
                    <i class="fas fa-arrow-right"></i> View Full Details
                </a>
            </div>
        `;
        
        // Scroll to top of modal
        document.getElementById('articleModalContent').scrollTop = 0;
    }
    
    updateQuickStats() {
        const seasonalCount = this.allArticles.filter(a => a.category === 'seasonal').length;
        const upcomingCount = this.allArticles.filter(a => a.category === 'upcoming').length;
        const trendingCount = this.allArticles.filter(a => a.category === 'trending').length;
        
        document.getElementById('statNewSeason').textContent = seasonalCount;
        document.getElementById('statUpcoming').textContent = upcomingCount;
        document.getElementById('statTopCount').textContent = trendingCount;
    }
    
    generateTopics() {
        const topicsList = document.getElementById('topicsList');
        if (!topicsList) return;
        
        // Collect all genres as topics
        const allGenres = new Set();
        this.allArticles.forEach(article => {
            article.genres?.forEach(genre => allGenres.add(genre));
        });
        
        const topics = Array.from(allGenres).slice(0, 15);
        
        topicsList.innerHTML = topics.map(topic => `
            <span class="topic-tag" onclick="window.location.href='explore.html?genre=${encodeURIComponent(topic)}'">
                #${topic}
            </span>
        `).join('');
    }
    
    loadMore() {
        // Since we load all at once, just show a message
        const btn = document.getElementById('loadMoreBtn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-check"></i> All News Loaded';
        }
    }
    
    updateLoadMoreButton() {
        const wrapper = document.getElementById('loadMoreWrapper');
        const btn = document.getElementById('loadMoreBtn');
        
        if (this.filteredArticles.length > 12) {
            wrapper.style.display = 'block';
        } else {
            wrapper.style.display = 'none';
        }
    }
    
    setupEventListeners() {
        // Category chips
        document.querySelectorAll('.category-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.activeCategory = chip.dataset.category;
                this.filterAndRender();
                
                // Scroll to news grid
                document.querySelector('.news-content').scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            });
        });
        
        // Load more button
        document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
            this.loadMore();
        });
        
        // Modal close
        document.getElementById('articleModalClose')?.addEventListener('click', () => {
            document.getElementById('articleModal').style.display = 'none';
        });
        
        document.getElementById('articleModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                document.getElementById('articleModal').style.display = 'none';
            }
        });
        
        // Close modal with Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.getElementById('articleModal').style.display = 'none';
            }
        });
        
        // Newsletter form
        document.getElementById('newsletterForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = e.target.querySelector('input');
            if (input.value) {
                this.showToast('Thanks for subscribing! (Coming soon with Supabase)');
                input.value = '';
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
            box-shadow: var(--shadow-lg);
            animation: fadeInUp 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    showError() {
        document.getElementById('newsGrid').innerHTML = `
            <div class="error-state" style="grid-column: 1/-1;">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Failed to load news</h3>
                <p>Please try again later.</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

// Initialize news page
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('news.html')) {
        new NewsPage();
    }
});
