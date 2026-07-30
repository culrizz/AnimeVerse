/* ==========================================
   AnimeVerse
   Anime Functions
========================================== */

const API = "https://api.jikan.moe/v4";

/* ==========================================
   HOME PAGE
========================================== */

async function loadHomePage(){

    loadTrendingAnime();

    loadTopAnime();

    loadAiringAnime();

}

/* ==========================================
   TRENDING
========================================== */

async function loadTrendingAnime(){

    const container = document.getElementById("trendingAnime");

    if(!container) return;

    container.innerHTML = "<h2>Loading...</h2>";

    try{

        const response = await fetch(`${API}/top/anime`);

        const data = await response.json();

        createAnimeCards(data.data.slice(0,12),container);

    }

    catch(error){

        console.error(error);

        container.innerHTML="<h2>Failed to load.</h2>";

    }

}

/* ==========================================
   TOP RATED
========================================== */

async function loadTopAnime(){

    const container=document.getElementById("topAnime");

    if(!container) return;

    try{

        const response=await fetch(`${API}/top/anime`);

        const data=await response.json();

        createAnimeCards(data.data.slice(12,24),container);

    }

    catch(error){

        console.log(error);

    }

}

/* ==========================================
   AIRING
========================================== */

async function loadAiringAnime(){

    const container=document.getElementById("airingAnime");

    if(!container) return;

    try{

        const response=await fetch(`${API}/seasons/now`);

        const data=await response.json();

        createAnimeCards(data.data.slice(0,12),container);

    }

    catch(error){

        console.log(error);

    }

}

/* ==========================================
   CREATE CARDS
========================================== */

function createAnimeCards(animeList,container){

    container.innerHTML="";

    animeList.forEach(anime=>{

        container.innerHTML+=`

        <div class="anime-card">

            <img
            src="${anime.images.jpg.large_image_url}"
            alt="${anime.title}">

            <div class="card-content">

                <h3>${anime.title}</h3>

                <p>⭐ ${anime.score ?? "N/A"}</p>

                <p>

                ${anime.episodes ?? "?"}

                Episodes

                </p>

                <a
                href="anime.html?id=${anime.mal_id}"
                class="btn btn-primary">

                View Details

                </a>

            </div>

        </div>

        `;

    });

}

/* ==========================================
   ANIME DETAILS PAGE
========================================== */

async function loadAnimePage(){

    const params=new URLSearchParams(window.location.search);

    const id=params.get("id");

    if(!id) return;

    try{

        const response=await fetch(`${API}/anime/${id}/full`);

        const anime=await response.json();

        displayAnimeDetails(anime.data);

    }

    catch(error){

        console.log(error);

    }

}

/* ==========================================
   DISPLAY DETAILS
========================================== */

function displayAnimeDetails(anime){

    const title=document.getElementById("anime-title");

    if(title){

        title.textContent=anime.title;

    }

}
