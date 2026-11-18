// config/holidays.js
// ---------------------------------------------------------------------------
// Holiday specials. Edit or add your own!
//
// Each holiday has:
//   id         a short code name
//   name       shown in the developer menu
//   from, to   dates as "MM-DD". A range can cross New Year ("12-31" to "01-01").
//   greeting   (optional) replaces the normal greeting. {name} = your name.
//   hat        (optional) "santa" puts a Santa hat on every character
//   sound      (optional) "jingle" or "spooky" (made in sounds.js)
//   effect     (optional) "hearts" or "fireworks" around the character
//   character  (optional) a character id from the characters folder that
//              comes instead of the usual hourly character
//
// The first holiday in the list whose dates match today wins.
// ---------------------------------------------------------------------------

const HOLIDAYS = [
  {
    id: 'christmas',
    name: 'Christmas',
    from: '12-15',
    to: '12-26',
    greeting: "Ho ho ho! {name}, Santa says it's time to move!",
    hat: 'santa',
    sound: 'jingle',
  },
  {
    id: 'new-year',
    name: 'New Year',
    from: '12-31',
    to: '01-01',
    greeting: "Happy New Year, {name}! Let's start it moving!",
    effect: 'fireworks',
  },
  {
    id: 'valentines',
    name: "Valentine's Day",
    from: '02-10',
    to: '02-14',
    greeting: "{name}, show your heart some love. Let's move!",
    effect: 'hearts',
  },
  {
    id: 'halloween',
    name: 'Halloween',
    from: '10-25',
    to: '10-31',
    greeting: 'Boooo! {name}, the pumpkin says: time to move!',
    character: 'pumpkin',
    sound: 'spooky',
  },
];

// Turns "12-15" into the number 1215, so dates are easy to compare.
function toNumber(monthDay) {
  const [month, day] = monthDay.split('-').map(Number);
  return month * 100 + day;
}

// Gives back the holiday for a date, or null if it's a normal day.
function holidayOn(date = new Date()) {
  const today = (date.getMonth() + 1) * 100 + date.getDate();
  return (
    HOLIDAYS.find((holiday) => {
      const from = toNumber(holiday.from);
      const to = toNumber(holiday.to);
      // Normal range (Feb 10 to Feb 14), or one that wraps around New Year.
      return from <= to ? today >= from && today <= to : today >= from || today <= to;
    }) || null
  );
}

// Makes this file usable both in the windows (browser) and in Node.
if (typeof module !== 'undefined') module.exports = { HOLIDAYS, holidayOn };
else window.MoveNudgeHolidays = { HOLIDAYS, holidayOn };
