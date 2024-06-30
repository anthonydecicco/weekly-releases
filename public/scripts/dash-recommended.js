//Get user's recommended and followed artists and filter
const dashMain = document.querySelector(".dash-main");
const loadingIndicator = document.querySelector(".loading-indicator");

const baseUrl = "https://www.weeklyreleases.com/";
// const baseUrl = "http://localhost:10000/";

const recommendedRoute = "api/recommendedartists";
const recommendedUrl = `${baseUrl}${recommendedRoute}`;

const followedRoute = "api/followedartists";
const followedUrl = `${baseUrl}${followedRoute}`;

async function fetchRecommendedArtists() {
    //check if data is stored in session storage
    const preloadedData = sessionStorage.getItem('recommended-data');

    //if not then fetch data
    if (!preloadedData) {
        const response = await fetch(recommendedUrl);
        
        if (response.ok) {
            const data = await response.json();
            sessionStorage.setItem('recommended-data', JSON.stringify(data));
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

async function fetchFollowedArtists() {
    //check if data is stored in session storage
    const preloadedData = sessionStorage.getItem('followed-data');

    //if not then fetch data
    if (!preloadedData) {
        const response = await fetch(followedUrl);
        
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

async function compareRecommendedToFollowed(recommendedArr, followedArr) {
    //filter artists in the recommendedArr based on presence in followedArr
    recommendedArr = recommendedArr.filter(recommendedArtist => !followedArr.some(followedArtist => followedArtist.id === recommendedArtist.id));
    return recommendedArr;
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

async function attachDataToCards(recommendedArtists) {
    for (i = 0; i < recommendedArtists.length; i++) {
        const card = document.createElement("a")
        card.classList.add("card");
        card.setAttribute("href", recommendedArtists[i].external_urls.spotify);
        card.setAttribute("target", "_blank");

        const imgContainer = document.createElement("div");
        imgContainer.classList.add("card-img-container");

        const img = document.createElement("img");
        img.classList.add("card-img");
        img.setAttribute("src", recommendedArtists[i].images[1].url);
        
        const artistName = document.createElement("p");
        artistName.classList.add("card-artist-name");
        artistName.innerText = (recommendedArtists[i].name);
        
        card.appendChild(imgContainer);
        imgContainer.appendChild(img);
        card.appendChild(artistName);
        dashMain.appendChild(card);
    }
}

async function populateRecommendedArtistsCards() {
    setLoading(true);
    const recommendedArtists = await fetchRecommendedArtists();
    const followedArtists = await fetchFollowedArtists();
    const filteredRecommendations = await compareRecommendedToFollowed(recommendedArtists, followedArtists);
    await attachDataToCards(filteredRecommendations);
    setLoading(false);
}

populateRecommendedArtistsCards();