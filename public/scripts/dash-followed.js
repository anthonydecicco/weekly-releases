//Get user's followed artists
const dashMain = document.querySelector(".dash-main");
const loadingIndicator = document.querySelector(".loading-indicator");

const baseUrl = "https://www.weeklyreleases.com/";
// const baseUrl = "http://localhost:10000/";
const route = "api/followedartists";
const url = `${baseUrl}${route}`;

async function fetchFollowedArtists() {
    //check if data is stored in session storage
    const preloadedData = sessionStorage.getItem('followed-data');

    //if not then fetch data
    if (!preloadedData) {
        const response = await fetch(url);
        
        if (response.ok) {
            const data = await response.json();
            sessionStorage.setItem('followed-data', JSON.stringify(data));
            return data;
        } else {
            const data = "Unable to load user data at the moment. Try refreshing the page."
            return data;
        }
    //if yes then use that data as is
    } else {
        const data = JSON.parse(preloadedData);
        return data;
    }
}

function setLoading(isLoading) {
    if (isLoading) {
        //show loading indicator
        loadingIndicator.classList.remove("display-none");
    } else {
        //hide loading indicator
        loadingIndicator.classList.add("display-none");
    }
}

async function attachDataToCards(followedArtists) {
    for (i = 0; i < followedArtists.length; i++) {
        const card = document.createElement("a")
        card.classList.add("card");
        card.setAttribute("href", followedArtists[i].external_urls.spotify);
        card.setAttribute("target", "_blank");

        const imgContainer = document.createElement("div");
        imgContainer.classList.add("card-img-container");

        const img = document.createElement("img");
        img.classList.add("card-img");
        img.setAttribute("src", followedArtists[i].images[1].url);
        
        const artistName = document.createElement("p");
        artistName.classList.add("card-artist-name");
        artistName.innerText = (followedArtists[i].name);
        
        card.appendChild(imgContainer);
        imgContainer.appendChild(img);
        card.appendChild(artistName);
        dashMain.appendChild(card);
    }
}

async function populateFollowedArtistsCards() {
    setLoading(true);
    const followedArtists = await fetchFollowedArtists();

    if (followedArtists.length > 0) {
        await attachDataToCards(followedArtists);
    } else {
        const p = document.createElement("p");
        p.classList.add("no-artists-indicator");
        p.innerText = ("You don't follow any artists, check out the Recommended tab to see your top recommendations.")
        dashMain.appendChild(p);
    }

    setLoading(false);
}

populateFollowedArtistsCards();