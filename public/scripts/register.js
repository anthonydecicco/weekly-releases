const authButton = document.getElementById("auth-button");

function redirectToSpotifyAuth() {
    window.location.href = '/auth/login';
}

if (authButton) {
    authButton.addEventListener("click", redirectToSpotifyAuth);
}
