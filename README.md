<div align="center">

# ☁️ WeatherNow

**A fast, animated real-time weather dashboard built with React, Vite and Framer Motion.**

Search any city in the world for live conditions, an interactive hourly chart and 7-day forecast, air quality, "what to wear" tips, and a live weather map of India with rain radar.

[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Framer Motion](https://img.shields.io/badge/Framer%20Motion-animations-0055FF?logo=framer&logoColor=white)](https://motion.dev)
[![Open-Meteo](https://img.shields.io/badge/Data-Open--Meteo-F5B544)](https://open-meteo.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**[Live demo](https://adityak0012.github.io/weather-dashboard/)**

<img src="docs/screenshot-desktop.jpg" alt="WeatherNow dashboard showing the current weather in Pune, a large weather illustration and the 7-day forecast strip" width="900" />

</div>

---

## ✨ Features

**Weather data**
- 🔎 **City search with live suggestions.** Type 2+ letters to see matching cities worldwide. Works fully with the keyboard (↑ ↓ Enter Esc), and pressing <kbd>/</kbd> anywhere focuses the search.
- 📍 **Use my location.** One tap uses your browser's location (with a readable place name).
- 🌡️ **Current conditions:** temperature, "feels like", today's high/low, the city's **local time** and time zone, and a one-line summary such as *"Rain likely around 4 PM (60% chance)"*.
- 📅 **Interactive 7-day strip:** tap any day and the whole page switches to it: the big card, the background glow and the hourly chart all animate to that day's forecast.
- 📈 **Hourly chart with three views:** switch between temperature, rain and wind. Hover (or tap) any hour to scrub through the day and see its details in a tooltip.
- 🧩 **Live detail tiles:** wind streaks that move at the real wind speed, a liquid humidity globe, a UV ring, a pressure dial, a thermometer for "feels like", haze bars for visibility and rain bars for the next 12 hours. **Tap any tile to flip it** and read what the number means.
- 🗺️ **Weather map of India:** live temperature or rain chance for all 28 states and 6 union territories on a dark interactive map. See the hottest, coolest and wettest places at a glance, click any marker or name to fly there and see details, and open that place's full forecast in one tap.
- 📡 **Live rain radar:** switch on "Rain radar" to see the last two hours of rain clouds over India as an animation, with play/pause and a time slider (data from RainViewer).
- 👕 **What to wear & carry:** practical tips worked out from the forecast: whether to take an umbrella, what to wear for the "feels like" temperature, sun protection, hydration, whether the air is good for a run, and the best time to head outside.
- ☀️ **Sun tracker:** an arc showing where the sun is now, hours of daylight, and a countdown to the next sunrise or sunset.
- 🍃 **Air quality:** US AQI with a colour scale and health advice, plus PM2.5, PM10 and ozone.

**Personalisation**
- ⭐ **Saved cities.** Star a city to save it. The saved-cities drawer shows live temperatures for all of them and supports **drag-to-reorder**.
- 🕘 **Recent searches** appear when you focus the search box.
- 🌡️ **°C / °F toggle.** Wind, visibility, pressure and rainfall switch units too, and the change is instant (no extra request).
- 💾 Everything (units, saved cities, last city) is remembered in `localStorage`.
- 🔗 **Shareable links.** The URL always points to the current city (`?lat=…&lon=…&name=…`), and the share button copies it.

**Experience**
- 🌤️ **Realistic weather illustrations** drawn in SVG (glowing sun, shaded moon, soft clouds, falling rain and snow, flickering lightning) instead of flat icons.
- 📌 **Sticky mini-bar** with the city and temperature slides in when you scroll down, plus a scroll progress line.
- 🌑 **"Deep ink" background:** a still, near-black base with a soft glow tinted by the weather (warm for sun, indigo at night, blue for rain, violet for storms) and a faint dot grid. It's built to stay smooth: no animated blur, no backdrop filters.
- 🎬 **Framer Motion animations:** letter-by-letter city names, counting temperatures, direction-aware day transitions, shared-layout tab and day highlights (`layoutId`), 3D flip tiles, scroll-linked parallax (`useScroll`), cursor-following parallax on the weather art, a spring-loaded drawer, a draggable list (`Reorder`), and animated charts and gauges.
- 🔄 **Auto-refresh** every 10 minutes and when you return to the tab, with a manual refresh button and "Updated 3 min ago" label.
- ⏳ **Proper loading, empty and error states:** skeleton screens on first load, a retry screen if the service is down, and a toast message if a background refresh fails (the old data stays on screen).
- ♿ **Accessible:** semantic HTML, ARIA combobox for search, keyboard-friendly controls, visible focus rings, screen-reader text for the charts, and support for the system **Reduce motion** setting.
- 📱 **Responsive** from 360 px phones to wide desktop screens.
- 🔑 **No API key needed.**

<p align="center">
  <img src="docs/screenshot-mobile.jpg" alt="WeatherNow on a phone during light rain at night" width="300" />
</p>

---

## 🛠️ Tech stack

| Area | Tools |
| --- | --- |
| UI | [React 19](https://react.dev) |
| Build tool | [Vite](https://vite.dev) |
| Animation | [Framer Motion](https://motion.dev) |
| Icons | [Lucide](https://lucide.dev) |
| Rain radar | [RainViewer](https://www.rainviewer.com/api.html) (free, no key) |
| Map | [Leaflet](https://leafletjs.com) + [React Leaflet](https://react-leaflet.js.org) with free [OpenStreetMap](https://www.openstreetmap.org) tiles (no key) |
| Weather, air quality and city search | [Open-Meteo](https://open-meteo.com) (free, no key) |
| Place name for "my location" | [BigDataCloud reverse geocoding](https://www.bigdatacloud.com/free-api/free-reverse-geocode-to-city-api) (free, no key) |
| Styling | Plain CSS with design tokens (CSS custom properties) |
| Fonts | Fraunces (display) and Inter (interface) |

---

## 🚀 Getting started

**Requirements:** [Node.js](https://nodejs.org) 20.19+ or 22.12+.

```bash
# 1. Clone the repository
git clone https://github.com/Adityak0012/weather-dashboard.git
cd weather-dashboard

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Then open the address printed in the terminal (usually http://localhost:5173).

### Other commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the dev server with hot reload |
| `npm run build` | Creates an optimised production build in `dist/` |
| `npm run preview` | Serves the production build locally to check it |
| `npm run deploy` | Builds the site and publishes it to GitHub Pages |

---

## 🌍 Deploying to GitHub Pages

The project uses the [`gh-pages`](https://www.npmjs.com/package/gh-pages) package, so publishing is one command:

```bash
npm run deploy
```

This builds the site and pushes the result to a `gh-pages` branch. The first time only:

1. Run `npm run deploy`.
2. On GitHub, open the repo's **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**, pick the **gh-pages** branch and the **/ (root)** folder, then **Save**.

After a minute the site is live at `https://adityak0012.github.io/weather-dashboard/`. Run `npm run deploy` again whenever you want to publish changes.

The app also works on Netlify or Vercel: use the build command `npm run build` and the output folder `dist`.

---

## 📁 Project structure

```
weather-dashboard/
├── index.html                 # HTML entry point (fonts, meta tags)
├── public/favicon.svg
├── src/
│   ├── main.jsx               # React entry point
│   ├── App.jsx                # Page layout, state, location, saved cities, URL sharing
│   ├── index.css              # Design tokens and all styles
│   ├── hooks/
│   │   └── hooks.js           # useWeather (fetch + auto-refresh), useLocalStorage, useDebounce, useNow
│   ├── lib/
│   │   ├── advice.js          # Rules that turn the forecast into tips
│   │   ├── api.js             # Open-Meteo forecast, air quality, geocoding
│   │   ├── weatherCodes.js    # WMO weather codes → labels, icons, background scenes
│   │   ├── insights.js        # Plain-English labels (UV advice, AQI level, rain summary…)
│   │   ├── regions.js         # States/UTs of India and their capitals
│   │   ├── units.js           # °C/°F, km/h/mph, km/mi, hPa/inHg conversions
│   │   └── time.js            # City-local time helpers
│   └── components/
│       ├── Background.jsx     # "Deep ink" background with weather-tinted glow
│       ├── Header.jsx         # Logo, search, location, unit toggle, saved button
│       ├── SearchBar.jsx      # Autocomplete combobox
│       ├── Advice.jsx         # "What to wear & carry" tips
│       ├── Hero.jsx           # Main card: current weather, selected day, 7-day strip
│       ├── HeroArt.jsx        # Large animated weather illustration with parallax
│       ├── WeatherArt.jsx     # Realistic SVG weather illustrations
│       ├── HourlyForecast.jsx # Hourly chart (temperature / rain / wind) with scrubber
│       ├── Widgets.jsx        # Bento grid of live, flippable detail tiles
│       ├── StickyBar.jsx      # Compact bar shown while scrolling
│       ├── StateMap.jsx       # Interactive weather map of Indian states
│       ├── SunCard.jsx        # Sunrise/sunset arc
│       ├── AirQualityCard.jsx # US AQI
│       ├── SavedDrawer.jsx    # Saved cities with drag-to-reorder
│       ├── AnimatedNumber.jsx # Spring-animated numbers
│       ├── WeatherIcon.jsx    # Weather code → icon
│       └── States.jsx         # Skeleton, error, toast, progress bar
└── docs/                      # README screenshots
```

---

## ⚙️ How it works

1. **Search.** As you type, `SearchBar` calls the Open-Meteo **Geocoding API** (debounced by 250 ms) and shows matching cities.
2. **Fetch.** When a city is picked, `useWeather` requests the **Forecast API** (current, hourly and daily data) and the **Air Quality API** in parallel. Data is always requested in metric units and converted in the browser, so the °C/°F toggle is instant.
3. **Local time.** Requests use `timezone=auto`, so times come back in the city's own time zone. `lib/time.js` reads them as the city's wall-clock time, which means "Sunset in 2h 10m" is correct even when you look at a city on the other side of the world.
4. **Display.** Weather codes are mapped to labels, icons and a background "scene" (`clear-day`, `rain-night`…), and components animate in with Framer Motion.
5. **Stay fresh.** Data refreshes every 10 minutes while the tab is visible. In-flight requests are cancelled with `AbortController` when you switch cities, so a slow old response never overwrites a new one.
6. **India map.** `StateMap` fetches all 34 state and union-territory capitals in **one** Open-Meteo request, and the Leaflet map is only loaded when you scroll near it. The rain radar plays the last two hours of RainViewer radar frames.
7. **Tips.** `lib/advice.js` turns the next 12 hours of forecast, UV and air quality into simple rules ("carry an umbrella", "light layer", "best time outside").

> **Note on accuracy:** Open-Meteo's values come from weather models, so they can differ by a degree or two from other apps that use local weather stations.

---

## 🗺️ Ideas for the future

- Weather alerts and severe-weather warnings
- Compare two cities side by side
- Light theme
- Installable PWA with offline support
- Hindi and Marathi language options

---

## 🙏 Credits

- Weather, air quality and geocoding data from [Open-Meteo](https://open-meteo.com), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Icons from [Lucide](https://lucide.dev).
- Rain radar by [RainViewer](https://www.rainviewer.com).
- Map data and tiles © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.

## 📄 License

Released under the [MIT License](LICENSE).

---

<div align="center">

Made by **Aditya Kale** · [GitHub](https://github.com/Adityak0012) · [LinkedIn](https://www.linkedin.com/in/adityak0012)

</div>
