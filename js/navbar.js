/* ==========================================
   NAVBAR
========================================== */

function initializeNavbar(){

    highlightCurrentPage();

    navbarScrollEffect();

}

function highlightCurrentPage(){

    const currentPage = window.location.pathname.split("/").pop();

    const links = document.querySelectorAll(".nav-links a");

    links.forEach(link=>{

        const href = link.getAttribute("href");

        if(href===currentPage){

            link.classList.add("active");

        }

    });

}

function navbarScrollEffect(){

    const header = document.querySelector("header");

    if(!header) return;

    window.addEventListener("scroll",()=>{

        if(window.scrollY>40){

            header.classList.add("scrolled");

        }

        else{

            header.classList.remove("scrolled");

        }

    });

}
