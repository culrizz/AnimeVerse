/* ==========================================
   AnimeVerse
   Main Application
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    console.log("🚀 AnimeVerse Loaded");

    initializeApp();

});

function initializeApp(){

    initializeTheme();

    initializeNavbar();

    initializeSearch();

    initializeSlider();

    initializeProfile();

    detectCurrentPage();

}

function detectCurrentPage(){

    const page = window.location.pathname.split("/").pop();

    switch(page){

        case "index.html":
        case "":
            console.log("🏠 Home Page");
            loadHomePage();
            break;

        case "anime.html":
            console.log("🎬 Anime Page");
            loadAnimePage();
            break;

        case "characters.html":
            console.log("👥 Characters Page");
            loadCharactersPage();
            break;

        case "news.html":
            console.log("📰 News Page");
            break;

        case "wallpapers.html":
            console.log("🖼 Wallpapers Page");
            break;

        case "profile.html":
            console.log("👤 Profile Page");
            break;

        case "login.html":
            console.log("🔐 Login Page");
            break;

        case "register.html":
            console.log("📝 Register Page");
            break;

        default:
            console.log("Unknown Page");

    }

}
