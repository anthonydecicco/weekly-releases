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