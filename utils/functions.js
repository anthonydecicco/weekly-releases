const date = require('./date');
const logger = require('../utils/logger');

async function handleRequest(url, method, headers, body = null, errorMessage = null) {
    let options = {
        method: method,
        headers: headers,
    }
    
    if (body !== null) {
        options.body = body;
    }

    try {
        const response = await fetch(url, options);
        
        if (response.ok) {
            return await response.json();

        } else if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            logger.warn("Status Code: 429. Will re-try in " + retryAfter + " seconds");

            const retryAfterMs = parseInt(retryAfter) * 1000;
            await new Promise(resolve => setTimeout(resolve, retryAfterMs));

        } else {
            logger.error(response.status + response.body);
        }
    } catch (error) {
        if (errorMessage !== null) {
            logger.error("Error handling request: ", errorMessage)
        } else {
            logger.error("Error handling request: ", error)
        }
    }
}

async function getNextPageOfArtists(url, method, headers, followedArtists) {
    if (url !== null) {
        const errorMessage = 'unable to get the next page of followed artists'

        const additionalArtists = await handleRequest(
            url,
            method,
            headers,
            null,
            errorMessage);
        
        followedArtists.push(...additionalArtists.artists.items);

        if (additionalArtists.artists.next !== null) {
            await getNextPageOfArtists(
                additionalArtists.artists.next,
                method,
                headers,
                followedArtists
            ) //each subsequent call should be awaited

        } else {
            return;
        }
    } else return;
}

async function getFollowedArtists(user) {
    logger.info("Currently fetching " + user.userId + "'s followed artists...")
    const access_token = user.userTempAccessToken;

    const followedArtistsOptions = {
        url: 'https://api.spotify.com/v1/me/following?type=artist&limit=50',
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + access_token },
        errorMessage: 'unable to get initial request for followed artists'
    };

    const data = await handleRequest(
        followedArtistsOptions.url,
        followedArtistsOptions.method,
        followedArtistsOptions.headers,
        null,
        followedArtistsOptions.errorMessage,
    );

    let followedArtists = data.artists.items;

    await getNextPageOfArtists(
        data.artists.next,
        followedArtistsOptions.method,
        followedArtistsOptions.headers,
        followedArtists
    );

    return followedArtists;
}

async function getNextPageOfReleases(url, method, headers, releases) {
    if (url !== null) {
        const errorMessage = 'unable to get next page of releases from followed artist'

        const additionalReleases = await handleRequest(
            url,
            method,
            headers,
            null,
            errorMessage
        );

        releases.push(...additionalReleases.items);

        if (additionalReleases.next !== null) {
            await getNextPageOfReleases(
                additionalReleases.next,
                method,
                headers,
                releases
            );

        } else {
            return;
        }
    } else {
        return;
    }
}

async function getReleasesByArtist(user, followedArtists) {
    logger.info("Currently fetching releases from the array of followed artists...")
    const access_token = user.userTempAccessToken;
    let releases = [];

    for (const artist of followedArtists) {

        const releasesOptions = {
            url: `https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=album,single&market=US&limit=50`,
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + access_token },
            errorMessage: `unable to get initial request for releases from artist id: ${artist.id}`,
        };

        const data = await handleRequest(
            releasesOptions.url,
            releasesOptions.method,
            releasesOptions.headers,
            null,
            releasesOptions.errorMessage,
        );

        let artistReleases = data.items;

        await getNextPageOfReleases(
            data.next,
            releasesOptions.method,
            releasesOptions.headers,
            releases);

        releases.push(...artistReleases);
    }

    logger.info("The " + followedArtists.length + " followed artists collectively have " + releases.length + " releases.")
    return releases;
}

async function filterReleases(releases, numberOfDaysToFilterBy) {
    
    //filter releases by a certain number of days
    const timeFrame = Date.now() - (numberOfDaysToFilterBy * 24 * 60 * 60 * 1000);
    const filteredReleases = await releases.filter(release => Date.parse(release.release_date) > timeFrame);

    //remove duplicates
    const releaseIds = await filteredReleases.map(({ id }) => id);
    const uniqueFilteredReleases = await filteredReleases.filter(({ id }, index) => !releaseIds.includes(id, index + 1));

    return uniqueFilteredReleases;
}

async function sortReleasesByMostRecent(releases) {
    return await releases.sort((a, b) => 
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

exports.handleRequest = handleRequest;
exports.getFollowedArtists = getFollowedArtists;
exports.getReleasesByArtist = getReleasesByArtist;
exports.sortReleasesByMostRecent = sortReleasesByMostRecent;
exports.filterReleases = filterReleases;
exports.formatReleases = formatReleases;