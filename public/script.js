const authButton = document.getElementById("auth-button");

function redirectToSpotifyAuth() {
    window.location.href = '/auth/login';
}

if (authButton) {
    //Check for existence to remove error messages on pages that do not have button
    authButton.addEventListener("click", redirectToSpotifyAuth);
}