// ========================================
// AnimeVerse
// Jikan API
// ========================================

const BASE_URL = "https://api.jikan.moe/v4";

// Wait until the page loads
document.addEventListener("DOMContentLoaded", () => {

    loadTrendingAnime();

});

// ========================================
// Trending Anime
// ========================================

async function loadTrendingAnime(){

    const container = document.getElementById("trendingAnime");

    if(!container) return;

    container.innerHTML = "<h2>Loading anime...</h2>";

    try{

        const response = await fetch(`${BASE_URL}/top/anime`);

        const result = await response.json();

        displayAnime(result.data.slice(0,12));

    }

    catch(error){

        container.innerHTML = "<h2>Failed to load anime.</h2>";

        console.error(error);

    }

}

// ========================================
// Display Anime
// ========================================

function displayAnime(animeList){

    const container = document.getElementById("trendingAnime");

    container.innerHTML = "";

    animeList.forEach(anime=>{

        container.innerHTML += `

        <div class="anime-card">

            <img src="${anime.images.jpg.large_image_url}">

            <div class="card-content">

                <h3>${anime.title}</h3>

                <p>⭐ ${anime.score ?? "N/A"}</p>

                <p>${anime.episodes ?? "?"} Episodes</p>

            </div>

        </div>

        `;

    });

}
