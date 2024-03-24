const date = require('./date');

async function handleRequest(url, headers) {
    try {
        const response = await fetch(url, { method: 'GET', headers: headers });
        if (response.ok) {
            return await response.json();

        } else if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            console.log("Status Code: 429. Will re-try in " + retryAfter + " seconds");

            const retryAfterMs = parseInt(retryAfter) * 1000;
            await new Promise(resolve => setTimeout(resolve, retryAfterMs));

        } else {
            console.log(response.status + response.body);
        }
    } catch (error) {
        console.error("Error handling request: ", error);
    }
}

async function getNextPageOfArtists(url, headers, followedArtists) {
    if (url !== null) {
        const additionalArtists = await handleRequest(url, headers)
        followedArtists.push(...additionalArtists.artists.items);

        if (additionalArtists.artists.next !== null) {
            await getNextPageOfArtists(additionalArtists.artists.next, headers, followedArtists) //each subsequent call should be awaited
        } else {
            return;
        }
    } else return;
}

async function getFollowedArtists(user) {
    console.log("Currently fetching " + user.userId + "'s followed artists...")
    const access_token = user.userTempAccessToken;

    const followedArtistsOptions = {
        url: 'https://api.spotify.com/v1/me/following?type=artist&limit=50',
        headers: { 'Authorization': 'Bearer ' + access_token },
    };

    const data = await handleRequest(followedArtistsOptions.url, followedArtistsOptions.headers);

    let followedArtists = data.artists.items;

    await getNextPageOfArtists(data.artists.next, followedArtistsOptions.headers, followedArtists);

    return followedArtists;
}

async function getNextPageOfReleases(url, headers, releases) {
    if (url !== null) {
        const additionalReleases = await handleRequest(url, headers);
        releases.push(...additionalReleases.items);

        if (additionalReleases.next !== null) {
            await getNextPageOfReleases(additionalReleases.next, headers, releases);
        } else {
            return;
        }
    } else {
        return;
    }
}

async function getReleasesByArtist(user, followedArtists) {
    console.log("Currently fetching releases from the array of followed artists...")
    const access_token = user.userTempAccessToken;
    let releases = [];

    for (const artist of followedArtists) {

        const releasesOptions = {
            url: `https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=album,single&market=US&limit=50`,
            headers: { 'Authorization': 'Bearer ' + access_token },
        };

        const data = await handleRequest(releasesOptions.url, releasesOptions.headers);

        let artistReleases = data.items;

        await getNextPageOfReleases(data.next, releasesOptions.headers, releases);

        releases.push(...artistReleases);
    }

    console.log("The " + followedArtists.length + " followed artists collectively have " + releases.length + " releases.")
    return releases;
}

async function filterReleases(releases, numberOfDaysToFilterBy) {
    
    //filter releases by a certain number of days
    const timeFrame = Date.now() - (numberOfDaysToFilterBy * 24 * 60 * 60 * 1000);
    const filteredReleases = releases.filter(release => Date.parse(release.release_date) > timeFrame);

    //remove duplicates
    const releaseIds = filteredReleases.map(({ id }) => id);
    const uniqueFilteredReleases = filteredReleases.filter(({ id }, index) => !releaseIds.includes(id, index + 1));

    return uniqueFilteredReleases;
}

async function sortReleasesByMostRecent(releases) {
    return releases.sort((a, b) => 
        Date.parse(b.release_date) - Date.parse(a.release_date)
    )
}

async function formatReleases(releases) {
    for (let release of releases) {
        //format release dates from YYYY-MM-DD to MM/DD/YYYY format
        release.release_date = date.formatSpotifyDate(release.release_date);

        //create a new array that converts .artists to a nicely formatted string
        let listOfArtists = [];
        for (const artist of release.artists) {
            if (artist === release.artists[0] && release.artists.length === 1) {
                listOfArtists.push(artist.name)
            } else if (artist === release.artists[0] && release.artists.length <= 2) {
                listOfArtists.push(artist.name + " ")
            } else if (artist === release.artists[release.artists.length - 1]) {
                listOfArtists.push("and " + artist.name)
            } else if (artist === release.artists[release.artists.length - 2] && artist !== release.artists[0]) {
                listOfArtists.push(artist.name + " ")
            } else if (artist === release.artists[0]) {
                listOfArtists.push(artist.name + ", ")
            }
        }
        release.artists = listOfArtists.join('');
    }
    return releases;
}

exports.getFollowedArtists = getFollowedArtists;
exports.getReleasesByArtist = getReleasesByArtist;
exports.sortReleasesByMostRecent = sortReleasesByMostRecent;
exports.filterReleases = filterReleases;
exports.formatReleases = formatReleases;