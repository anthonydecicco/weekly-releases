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
            logger.warn(`Status Code: 429. Will re-try in ${retryAfter} seconds.`);

            const retryAfterMs = parseInt(retryAfter) * 1000;
            await new Promise(resolve => setTimeout(resolve, retryAfterMs));
            //wait the amount of time in retry-after header

            return await handleRequest(url, method, headers, body, errorMessage);
            //retry the request
        
        } else if (response.status === 502) {
            const threeSeconds = 3000;
            logger.warn(`Status Code: 502. Will re-try in ${threeSeconds / 1000} seconds.`);

            await new Promise(resolve => setTimeout(resolve, threeSeconds));

            return await handleRequest(url, method, headers, body, errorMessage);
        } else {
            const errorText = await response.text();
            logger.error(response.status + ": " + errorText);
        }
    } catch (error) {
        if (errorMessage !== null) {
            logger.error(`Error handling request: ${errorMessage}`)
        } else {
            logger.error(`Error handling request: ${error}`)
        }
    }

    return null;
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
            ); //each subsequent call should be awaited

        } else {
            return;
        }
    } else return;
}

async function getFollowedArtists(user) {
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

    if (data && data.artists && data.artists.items) {
        let followedArtists = data.artists.items;
        //if successful API call, and the format is as expected

        await getNextPageOfArtists(
            data.artists.next,
            followedArtistsOptions.method,
            followedArtistsOptions.headers,
            followedArtists
        );

        return followedArtists;
    } else {
        logger.error("Unable to retrieve followed artists or response is null");
        return [];
        //return an empty array if unable to retrieve followed artists
        //this keeps the for loop in weeklyReleases.js cycling
    }
}

async function getNextPageOfRecommendedArtists(url, method, headers, followedArtists) {
    if (url !== null) {
        const errorMessage = 'Unable to get the next page of followed artists'

        const additionalArtists = await handleRequest(
            url,
            method,
            headers,
            null,
            errorMessage);
        
        followedArtists.push(...additionalArtists.items);

        if (additionalArtists.next !== null) {
            await getNextPageOfRecommendedArtists(
                additionalArtists.next,
                method,
                headers,
                followedArtists
            ); //each subsequent call should be awaited

        } else {
            return;
        }
    } else return;
}

async function getRecommendedArtists(user) {
    const access_token = user.userTempAccessToken;

    const recommendedArtistsOptions = {
        url: 'https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=50',
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + access_token },
        errorMessage: 'unable to get initial request for followed artists'
    };

    const data = await handleRequest(
        recommendedArtistsOptions.url,
        recommendedArtistsOptions.method,
        recommendedArtistsOptions.headers,
        null,
        recommendedArtistsOptions.errorMessage,
    );

    if (data && data.items) {
        let recommendedArtists = data.items;
    
        await getNextPageOfRecommendedArtists(
            data.next,
            recommendedArtistsOptions.method,
            recommendedArtistsOptions.headers,
            recommendedArtists
        );  
    
        return recommendedArtists;
    } else {
        logger.error("Unable to retrieve recommended artists or response null");
        return [];
    }

}

async function getNextPageOfReleases(url, method, headers, releases) {
    if (url !== null) {
        const errorMessage = 'Unable to get next page of releases from followed artist'

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

        if (data && data.items) {
            let artistReleases = data.items;
    
            await getNextPageOfReleases(
                data.next,
                releasesOptions.method,
                releasesOptions.headers,
                releases
            );
    
            releases.push(...artistReleases);
        } else {
            logger.error("Unable to get releases by artists or response null");
        }
    }

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
        release.release_date = await date.formatSpotifyDate(release.release_date);

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

module.exports = {
    handleRequest,
    getFollowedArtists,
    getRecommendedArtists,
    getReleasesByArtist,
    sortReleasesByMostRecent,
    filterReleases,
    formatReleases,
}