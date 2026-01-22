document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const city = params.get("city");

    if (city) {
        document.getElementById("city-name").textContent = city;
        loadWeather(city);
    } else {
        document.getElementById("city-name").textContent = "Città non specificata";
    }
});

async function loadWeather(city) {
    try {
        const coords = await getLatLon(city);
        if (coords) {
            const data = await meteo(coords.lat, coords.lon);
            renderWeather(data);
        } else {
            document.getElementById("city-name").textContent = "Città non trovata";
            alert("Coordinate non trovate per " + city);
        }
    } catch (error) {
        console.error("Errore chiamate meteo:", error);
        alert("Errore nel caricamento dei dati meteo.");
    }
}

async function getLatLon(citta) {
    try {
        let x = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${citta}&language=it&format=json&countryCode=IT`);
        let data = await x.json();
        // Robustness fix: check for results array
        if (!data.results || data.results.length === 0) return null;
        return { lat: data.results[0].latitude, lon: data.results[0].longitude };
    } catch (e) {
        console.error("Geocoding Error", e);
        return null; // Return null to handle gracefully in caller
    }
}

async function meteo(lat, lon) {
    const url = "https://api.open-meteo.com/v1/forecast?" + new URLSearchParams({
        latitude: lat,
        longitude: lon,
        daily: "sunrise,sunset,uv_index_max,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,precipitation_hours,weathercode",
        current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,surface_pressure,wind_speed_10m,wind_gusts_10m,wind_direction_10m,weathercode",
        timezone: "auto"
    });

    const response = await fetch(url);
    const data = await response.json();

    if (!data.current || !data.daily) {
        console.error("Risposta API non valida:", data);
        throw new Error("Invalid API response");
    }

    return data;
}

function renderWeather(data) {
    // Current Weather Hero
    document.getElementById("current-weather-container").style.display = "block";
    document.getElementById("current-temp").textContent = `${Math.round(data.current.temperature_2m)}°`;
    document.getElementById("current-condition").textContent = getWeatherDescription(data.current.weathercode);

    // Today's High/Low
    document.getElementById("today-max").textContent = `${Math.round(data.daily.temperature_2m_max[0])}°`;
    document.getElementById("today-min").textContent = `${Math.round(data.daily.temperature_2m_min[0])}°`;

    // Grid Details
    document.getElementById("current-details-container").style.display = "flex";

    // Wind
    const windSpeed = data.current.wind_speed_10m;
    document.getElementById("current-wind").textContent = `${windSpeed} km/h`;
    // Scale: 0-50 km/h for bar visual (just an estimation for UI)
    const windPct = Math.min((windSpeed / 50) * 100, 100);
    document.getElementById("bar-wind").style.width = `${windPct}%`;

    // Humidity
    const humidity = data.current.relative_humidity_2m;
    document.getElementById("current-humidity").textContent = `${humidity}%`;
    document.getElementById("bar-humidity").style.width = `${humidity}%`;

    // UV Index
    const uvIndex = data.daily.uv_index_max[0];
    document.getElementById("current-uv").textContent = `${uvIndex}`;
    // Scale: 0-11
    const uvPct = Math.min((uvIndex / 11) * 100, 100);
    document.getElementById("bar-uv").style.width = `${uvPct}%`;

    // Pressure
    document.getElementById("current-pressure").textContent = `${data.current.surface_pressure} hPa`;


    // Daily Forecast
    const dailyContainer = document.getElementById("forecast-container");
    dailyContainer.innerHTML = "";

    for (let i = 0; i < data.daily.time.length; i++) {
        const date = new Date(data.daily.time[i]);
        const dayName = date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric' });

        const cardHtml = `
            <div class="col-6 col-md-3">
                <div class="m3-card-daily text-center d-flex flex-column justify-content-center align-items-center">
                    <p class="mb-2 fw-semibold text-capitalize">${dayName}</p>
                    <p class="text-muted small mb-2 text-truncate w-100">${getWeatherDescription(data.daily.weathercode[i])}</p>
                    <div class="d-flex gap-2">
                        <span class="badge badge-m3-max rounded-pill px-3 py-2">${Math.round(data.daily.temperature_2m_max[i])}°</span>
                        <span class="badge badge-m3-min rounded-pill px-3 py-2">${Math.round(data.daily.temperature_2m_min[i])}°</span>
                    </div>
                </div>
            </div>
        `;
        dailyContainer.insertAdjacentHTML('beforeend', cardHtml);
    }
}

// WMO Weather interpretation codes
function getWeatherDescription(code) {
    const codes = {
        0: "Sereno",
        1: "Poco nuvoloso",
        2: "Parz. nuvoloso",
        3: "Nuvoloso",
        45: "Nebbia",
        48: "Nebbia con brina",
        51: "Pioggerella",
        53: "Pioggerella mod.",
        55: "Pioggerella densa",
        61: "Pioggia debole",
        63: "Pioggia",
        65: "Pioggia forte",
        80: "Rovesci lievi",
        81: "Rovesci mod.",
        82: "Rovesci forti",
        95: "Temporale",
        96: "Temporale/Grandine",
        99: "Temp. forte/Grandine"
    };
    return codes[code] || "Varie";
}
