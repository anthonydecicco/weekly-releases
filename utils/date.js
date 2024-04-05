function getTodayDateString(now) {
	const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	const months = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December"
	];

	const day = days[now.getDay()];
	const month = months[now.getMonth()];
	const date = now.getDate();

	const todayDateString = `${day}, ${month} ${date}`;

	return todayDateString;
}

function formatSpotifyDate(date) {
	//format of spotify's date is yyyy-mm-dd
	const datePartsArr = date.split('-')

	const year = datePartsArr[0];
	const month = datePartsArr[1].replace(/^0/, '');
	const day = datePartsArr[2].replace(/^0/, '');

	return `${month}/${day}/${year}`;
}

exports.getTodayDateString = getTodayDateString;
exports.formatSpotifyDate = formatSpotifyDate;