/* ==========================================
   THEME
========================================== */

function initializeTheme(){

    const button = document.getElementById("theme-toggle");

    if(!button) return;

    const saved = localStorage.getItem("theme");

    if(saved==="light"){

        document.body.classList.add("light-theme");

    }

    button.addEventListener("click",toggleTheme);

}

function toggleTheme(){

    document.body.classList.toggle("light-theme");

    const mode = document.body.classList.contains("light-theme")

    ? "light"

    : "dark";

    localStorage.setItem("theme",mode);

}
