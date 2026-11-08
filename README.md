# יפן של שמחה ובני

A Hebrew, offline-capable travel companion for a 15-day organised tour of Japan (9 to 25 Nov 2026), built for two travellers who install it from Safari to the home screen.

- **היום**: the right day by the clock in Japan, weather for that day's place (Open-Meteo), one local tip, the stops with travel times, a mini map.
- **המסע**: the whole route on a map of Japan, nights per city, the full day list.
- **מפה**: every stop on OpenStreetMap, filter by day, "where am I".
- **טיפים**: kosher, bargains, tech, Shabbat times, useful numbers, ten phrases.

Vanilla HTML/CSS/JS, no build. Data lives in `data/trip.json`. Deploy with `./deploy.sh` (GitHub Pages). Bump `CACHE` in `sw.js` when shipping an update.

Force a date for testing: `?date=2026-11-19`.
