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
            alert("Coordinate non trovate per " + city);
        }
    } catch (error) {
        console.error("Errore chiamate meteo:", error);
        alert("Errore nel caricamento dei dati meteo.");
    }
}

async function getLatLon(citta) {
    let x = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${citta}&count=1&language=it&format=json`) // changed lang to it just in case
    let data = await x.json()
    if (!data.results) return null;
    return { lat: data.results[0].latitude, lon: data.results[0].longitude }
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
    // Current Weather
    document.getElementById("current-weather-container").style.display = "flex";
    document.getElementById("current-temp").textContent = `${data.current.temperature_2m}${data.current_units.temperature_2m}`;
    document.getElementById("current-wind").textContent = `${data.current.wind_speed_10m} ${data.current_units.wind_speed_10m}`;
    document.getElementById("current-humidity").textContent = `${data.current.relative_humidity_2m}${data.current_units.relative_humidity_2m}`;
    document.getElementById("current-condition").textContent = getWeatherDescription(data.current.weathercode);


    // Daily Forecast
    const dailyContainer = document.getElementById("forecast-container");
    dailyContainer.innerHTML = "";

    for (let i = 0; i < data.daily.time.length; i++) {
        const date = new Date(data.daily.time[i]);
        const dayName = date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'short' });

        const cardHtml = `
            <div class="col-6 col-md-4 col-lg-3">
                <div class="card border-0 shadow-sm rounded-4 h-100">
                    <div class="card-body text-center">
                        <h5 class="card-title text-capitalize mb-3">${dayName}</h5>
                        <div class="mb-3">
                            <span class="badge bg-danger bg-opacity-10 text-danger rounded-pill px-3 py-2 mb-2">Max ${data.daily.temperature_2m_max[i]}°</span>
                            <span class="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-2">Min ${data.daily.temperature_2m_min[i]}°</span>
                        </div>
                        <p class="text-muted small mb-0">${getWeatherDescription(data.daily.weathercode[i])}</p>
                    </div>
                </div>
            </div>
        `;
        dailyContainer.insertAdjacentHTML('beforeend', cardHtml);
    }
}

// WMO Weather interpretation codes (https://open-meteo.com/en/docs)
function getWeatherDescription(code) {
    const codes = {
        0: "Cielo Sereno",
        1: "Prevalentemente sereno",
        2: "Parzialmente nuvoloso",
        3: "Nuvoloso",
        45: "Nebbia",
        48: "Nebbia con brina",
        51: "Pioggerella leggera",
        53: "Pioggerella moderata",
        55: "Pioggerella densa",
        61: "Pioggia debole",
        63: "Pioggia moderata",
        65: "Pioggia forte",
        80: "Rovesci di pioggia lievi",
        81: "Rovesci di pioggia moderati",
        82: "Rovesci di pioggia violenti",
        95: "Temporale",
        96: "Temporale con grandine leggera",
        99: "Temporale con grandine forte"
    };
    return codes[code] || "Condizioni varie";
}
