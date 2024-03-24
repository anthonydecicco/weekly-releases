const today = new Date();
    
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const day = days[today.getDay()];
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
const month = months[today.getMonth()];
const date = today.getDate();

const todayDateString = `${day}, ${month} ${date}`;

function formatSpotifyDate(date) {
  //format of spotify's date is yyyy-mm-dd
  const datePartsArr = date.split('-')

  const year = datePartsArr[0];
  const month = datePartsArr[1].replace(/^0/, '');
  const day = datePartsArr[2].replace(/^0/, '');

  return `${month}/${day}/${year}`;
}

exports.todayDateString = todayDateString;
exports.formatSpotifyDate = formatSpotifyDate;