//Authorization

const authButton = document.getElementById("auth-button");

function redirectToSpotifyAuth() {
    window.location.href = '/auth/login';
}

if (authButton) {
    //Check for existence to remove error messages on pages that do not have button
    authButton.addEventListener("click", redirectToSpotifyAuth);
}



//Hamburger

const hamburger = document.querySelector(".hamburger-container");
const hamburgerMenu = document.querySelector(".hamburger-menu");
let isOpen = false;

function toggleHamburgerMenu(event) {
    isOpen = !isOpen;

    if (isOpen === true) {
        hamburgerMenu.classList.remove("display-none");
        hamburger.classList.add("invert");
    } else {
        hamburgerMenu.classList.add("display-none");
        hamburger.classList.remove("invert");
    }   
}

hamburger.addEventListener("click", toggleHamburgerMenu)