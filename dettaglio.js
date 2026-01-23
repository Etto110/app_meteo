// Inizializzazione pagina dettaglio: legge parametri URL e carica dati meteo
document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const nome = params.get("nome");

    if (nome) {
        document.title = `Dettaglio meteo: ${nome}`;
        document.getElementById("city-name").textContent = nome;
        loadWeather(nome);
    } else {
        document.title = "Dettaglio meteo: Città non specificata";
        document.getElementById("city-name").textContent = "Città non specificata";
    }
});

// Variabile globale del grafico Chart.js per permettere aggiornamenti dinamici
let chart24hInstance = null;

/**
 * Carica e visualizza i dati meteo per una città
 * @param {string} city - Nome della città
 */
async function loadWeather(city) {
    try {
        const coords = await getLatLon(city);
        if (coords) {
            const data = await getMeteo(coords.lat, coords.lon);
            renderWeather(data);
        } else {
            const cityNameEl = document.getElementById("city-name");
            if (cityNameEl) {
                cityNameEl.textContent = "Città non trovata";
            }
            showError("Coordinate non trovate per " + city);
        }
    } catch (error) {
        console.error("Errore chiamate meteo:", error);
        showError("Errore nel caricamento dei dati meteo.");
    }
}

/**
 * Mostra un messaggio di errore all'utente
 * Crea l'elemento se non esiste, altrimenti aggiorna il messaggio
 * @param {string} message - Messaggio di errore da visualizzare
 */
function showError(message) {
    let errorEl = document.getElementById("error-message");
    if (!errorEl) {
        errorEl = document.createElement("div");
        errorEl.id = "error-message";
        errorEl.className = "alert alert-danger mt-3";
        errorEl.setAttribute("role", "alert");
        const container = document.querySelector(".container");
        if (container) {
            container.insertBefore(errorEl, container.firstChild);
        }
    }
    errorEl.textContent = message;
    errorEl.style.display = "block";
}

/**
 * Ottiene le coordinate geografiche di una città tramite API geocoding
 * @param {string} citta - Nome della città
 * @returns {Object|null} Oggetto con lat e lon, o null in caso di errore
 */
async function getLatLon(citta) {
    try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${citta}&language=it&format=json&countryCode=IT`);
        const data = await response.json();

        if (!data.results || data.results.length === 0) return null;
        return { lat: data.results[0].latitude, lon: data.results[0].longitude };
    } catch (e) {
        console.error("Geocoding Error", e);
        return null;
    }
}

/**
 * Recupera i dati meteo completi dall'API Open-Meteo
 * Include dati correnti, giornalieri e orari per le previsioni
 * @param {number} lat - Latitudine
 * @param {number} lon - Longitudine
 * @returns {Promise<Object>} Oggetto con dati meteo (current, daily, hourly)
 * @throws {Error} Se la risposta API non è valida
 */
async function getMeteo(lat, lon) {
    const url = "https://api.open-meteo.com/v1/forecast?" + new URLSearchParams({
        latitude: lat,
        longitude: lon,

        // Dati giornalieri: alba/tramonto, UV, temperature, precipitazioni, codice meteo
        daily: "sunrise,sunset,uv_index_max,temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode",

        // Dati correnti: temperatura, umidità, pressione, vento, visibilità, copertura nuvolosa
        current: "temperature_2m,relative_humidity_2m,is_day,precipitation,surface_pressure,wind_speed_10m,wind_direction_10m,weathercode,cloud_cover,visibility",

        // Dati orari per grafico 24h: temperatura, umidità, precipitazioni, vento, nuvolosità
        hourly: "temperature_2m,relative_humidity_2m,precipitation,precipitation_probability,weathercode,wind_speed_10m,wind_direction_10m,cloud_cover",

        timezone: "auto",
        forecast_hours: 24
    });

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Validazione struttura risposta
    if (!data.current || !data.daily) {
        console.error("Risposta API non valida:", data);
        throw new Error("Invalid API response structure");
    }

    return data;
}

/**
 * Renderizza tutti i dati meteo nella pagina
 * Aggiorna elementi DOM con temperature, condizioni, previsioni e grafici
 * @param {Object} data - Dati meteo dall'API (current, daily, hourly)
 */
function renderWeather(data) {
    // Cache degli elementi DOM per migliorare le performance (evita ripetute query)
    const elements = {
        currentContainer: document.getElementById("current-weather-container"),
        weatherIcon: document.getElementById("current-weather-icon"),
        currentTemp: document.getElementById("current-temp"),
        currentCondition: document.getElementById("current-condition"),
        todayMax: document.getElementById("today-max"),
        todayMin: document.getElementById("today-min"),
        observationTime: document.getElementById("observation-time"),
        detailsContainer: document.getElementById("current-details-container"),
        sunriseSunset: document.getElementById("sunrise-sunset"),
        barSunrise: document.getElementById("bar-sunrise"),
        currentWind: document.getElementById("current-wind"),
        barWind: document.getElementById("bar-wind"),
        currentHumidity: document.getElementById("current-humidity"),
        barHumidity: document.getElementById("bar-humidity"),
        currentUv: document.getElementById("current-uv"),
        barUv: document.getElementById("bar-uv"),
        currentPressure: document.getElementById("current-pressure"),
        barPressure: document.getElementById("bar-pressure"),
        currentPrecipitation: document.getElementById("current-precipitation"),
        barPrecipitation: document.getElementById("bar-precipitation"),
        currentCloud: document.getElementById("current-cloud"),
        barCloud: document.getElementById("bar-cloud"),
        currentVisibility: document.getElementById("current-visibility"),
        barVisibility: document.getElementById("bar-visibility")
    };

    // Verifica presenza elementi DOM critici prima di procedere
    if (!elements.currentContainer || !elements.currentTemp) {
        console.error("Elementi DOM critici non trovati");
        return;
    }

    const isDay = data.current.is_day === 1;
    const weatherIcon = getWeatherIcon(data.current.weathercode, isDay);

    // Current Weather Hero - Add icon
    elements.currentContainer.style.display = "block";
    if (elements.weatherIcon) {
        elements.weatherIcon.textContent = weatherIcon;
    }
    elements.currentTemp.textContent = `${Math.round(data.current.temperature_2m)}°`;
    elements.currentCondition.textContent = getWeatherDescription(data.current.weathercode);

    // Today's High/Low
    elements.todayMax.textContent = `${Math.round(data.daily.temperature_2m_max[0])}°`;
    elements.todayMin.textContent = `${Math.round(data.daily.temperature_2m_min[0])}°`;

    // Observation time
    if (data.current?.time && elements.observationTime) {
        const obsTime = new Date(data.current.time);
        const timeStr = obsTime.toLocaleString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        elements.observationTime.textContent = `Orario di rilevazione: ${timeStr}`;
    }

    // Grid Details
    if (elements.detailsContainer) {
        elements.detailsContainer.style.display = "flex";
    }

    // Alba e tramonto: estrazione orari e calcolo progresso giornata
    const sunriseTime = data.daily.sunrise[0].split("T")[1].substring(0, 5);
    const sunsetTime = data.daily.sunset[0].split("T")[1].substring(0, 5);
    if (elements.sunriseSunset) {
        elements.sunriseSunset.textContent = `${sunriseTime} - ${sunsetTime}`;
    }

    const now = new Date();
    const sunrise = new Date(data.daily.sunrise[0]);
    const sunset = new Date(data.daily.sunset[0]);

    // Calcolo progresso giornata per la progress bar (0-100% durante il giorno, 100% dopo tramonto fino a mezzanotte)
    let daylightProgress = 0;
    if (now >= sunrise && now <= sunset) {
        const totalDaylight = sunset - sunrise;
        const elapsedDaylight = now - sunrise;
        daylightProgress = Math.min(Math.max((elapsedDaylight / totalDaylight) * 100, 0), 100);
    } else if (now < sunrise) {
        daylightProgress = 0;
    } else {
        // Dopo il tramonto mostra 100% fino a mezzanotte
        daylightProgress = 100;
    }

    if (elements.barSunrise) {
        elements.barSunrise.style.width = `${daylightProgress}%`;
        elements.barSunrise.style.minWidth = '0px';
    }

    // Vento: velocità e direzione, normalizzazione su scala 0-50 km/h per progress bar
    const windSpeed = data.current.wind_speed_10m;
    const windDirection = getWindDirection(data.current.wind_direction_10m);
    if (elements.currentWind) {
        elements.currentWind.textContent = `${windSpeed} km/h ${windDirection}`;
    }
    // Calcolo percentuale: velocità / 50 * 100, limitata a 100%
    const windPct = Math.min((windSpeed / 50) * 100, 100);
    if (elements.barWind) {
        elements.barWind.style.width = `${windPct}%`;
    }

    // Humidity
    const humidity = data.current.relative_humidity_2m;
    if (elements.currentHumidity) {
        elements.currentHumidity.textContent = `${humidity}%`;
    }
    if (elements.barHumidity) {
        elements.barHumidity.style.width = `${humidity}%`;
    }

    // Indice UV: normalizzazione su scala 0-11 (valore massimo standard)
    const uvIndex = data.daily.uv_index_max[0];
    if (elements.currentUv) {
        elements.currentUv.textContent = `${uvIndex}`;
    }
    const uvPct = Math.min((uvIndex / 11) * 100, 100);
    if (elements.barUv) {
        elements.barUv.style.width = `${uvPct}%`;
    }

    // Pressione: normalizzazione su scala 950-1050 hPa per la progress bar
    const pressure = data.current.surface_pressure;
    if (elements.currentPressure) {
        elements.currentPressure.textContent = `${Math.round(pressure)} hPa`;
    }
    // Calcolo percentuale: (pressione - 950) / 100 * 100, limitata tra 0 e 100
    const pressurePct = Math.min(Math.max(((pressure - 950) / 100) * 100, 0), 100);
    if (elements.barPressure) {
        elements.barPressure.style.width = `${pressurePct}%`;
    }

    // Precipitazioni: normalizzazione su scala 0-10 mm per progress bar
    const precipValue = data.current.precipitation || 0;
    if (elements.currentPrecipitation) {
        elements.currentPrecipitation.textContent = `${precipValue} mm`;
    }
    const precipPct = Math.min((precipValue / 10) * 100, 100);
    if (elements.barPrecipitation) {
        elements.barPrecipitation.style.width = `${precipPct}%`;
    }

    // Cloud Cover
    const cloudCover = data.current.cloud_cover || 0;
    if (elements.currentCloud) {
        elements.currentCloud.textContent = `${cloudCover}%`;
    }
    if (elements.barCloud) {
        elements.barCloud.style.width = `${cloudCover}%`;
    }

    // Visibilità: conversione da metri a km e normalizzazione su scala 0-20km
    const visibility = data.current.visibility ? (data.current.visibility / 1000).toFixed(1) : "N/A";
    const visibilityValue = data.current.visibility ? (data.current.visibility / 1000) : 0;
    const visibilityPct = Math.min((visibilityValue / 20) * 100, 100);
    if (elements.currentVisibility) {
        elements.currentVisibility.textContent = `${visibility} km`;
    }
    if (elements.barVisibility) {
        elements.barVisibility.style.width = `${visibilityPct}%`;
    }

    // 24h Forecast Graph
    if (data.hourly && data.hourly.time) {
        render24hGraph(data);
    }

    // Previsioni giornaliere: creazione card per ogni giorno con icona, temperature e precipitazioni
    const dailyContainer = document.getElementById("forecast-container");
    if (!dailyContainer) return;

    // Costruzione HTML tramite array.map per migliori performance rispetto a concatenazione
    const cardsHtml = data.daily.time.map((time, i) => {
        const date = new Date(time);
        const dayName = date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric' });
        const dayIcon = getWeatherIcon(data.daily.weathercode[i], true);
        const precipitation = data.daily.precipitation_sum[i] || 0;

        return `
            <div class="col-6 col-md-3">
                <div class="m3-card-daily text-center d-flex flex-column justify-content-center align-items-center">
                    <p class="mb-2 fw-semibold text-capitalize">${dayName}</p>
                    <span class="material-symbols-outlined mb-2" style="font-size: 2.5rem;">${dayIcon}</span>
                    <p class="text-muted small mb-2 text-truncate w-100">${getWeatherDescription(data.daily.weathercode[i])}</p>
                    <div class="d-flex gap-2 mb-2">
                        <span class="badge badge-m3-max rounded-pill px-3 py-2">${Math.round(data.daily.temperature_2m_max[i])}°</span>
                        <span class="badge badge-m3-min rounded-pill px-3 py-2">${Math.round(data.daily.temperature_2m_min[i])}°</span>
                    </div>
                    <span class="badge badge-m3-min rounded-pill px-3 py-2">${precipitation.toFixed(1)} mm</span>
                </div>
            </div>
        `;
    });

    dailyContainer.innerHTML = cardsHtml.join('');
}

/**
 * Crea e renderizza il grafico delle previsioni per le prossime 24 ore
 * Supporta visualizzazione di diverse metriche selezionabili dall'utente
 * @param {Object} data - Dati meteo con array hourly
 */
function render24hGraph(data) {
    if (!data.hourly || !data.hourly.time) return;

    const ctx = document.getElementById('chart-24h');
    if (!ctx) return;

    // Estrazione dati per le prossime 24 ore (dall'ora corrente in poi)
    const now = new Date();
    const hours24 = [];
    const labels = [];
    const temps = [];
    const humidity = [];
    const precipitation = [];
    const windSpeed = [];
    const cloudCover = [];

    // Filtraggio dati: solo ore future, massimo 24
    for (let i = 0; i < Math.min(24, data.hourly.time.length); i++) {
        const hourTime = new Date(data.hourly.time[i]);
        if (hourTime < now) continue;
        if (hours24.length >= 24) break;

        hours24.push(i);
        labels.push(hourTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }));
        temps.push(data.hourly.temperature_2m[i]);
        humidity.push(data.hourly.relative_humidity_2m[i]);
        precipitation.push(data.hourly.precipitation[i] || 0);
        windSpeed.push(data.hourly.wind_speed_10m[i]);
        cloudCover.push(data.hourly.cloud_cover[i] || 0);
    }

    if (hours24.length === 0) return;

    // Distruzione grafico esistente se presente (per evitare memory leak)
    if (chart24hInstance) {
        chart24hInstance.destroy();
    }

    // Preparazione datasets per tutte le metriche disponibili
    // L'utente può selezionare quale visualizzare tramite il dropdown
    const allDatasets = {
        temperature: {
            label: 'Temperatura (°C)',
            data: temps,
            borderColor: '#006493',
            backgroundColor: 'rgba(0, 100, 147, 0.1)',
            yAxisID: 'y',
            tension: 0.4,
            fill: true
        },
        humidity: {
            label: 'Umidità (%)',
            data: humidity,
            borderColor: '#006493',
            backgroundColor: 'rgba(0, 100, 147, 0.1)',
            yAxisID: 'y1',
            tension: 0.4,
            fill: true
        },
        precipitation: {
            label: 'Precipitazioni (mm)',
            data: precipitation,
            borderColor: '#006493',
            backgroundColor: 'rgba(0, 100, 147, 0.1)',
            yAxisID: 'y2',
            tension: 0.4,
            fill: true
        },
        wind: {
            label: 'Vento (km/h)',
            data: windSpeed,
            borderColor: '#006493',
            backgroundColor: 'rgba(0, 100, 147, 0.1)',
            yAxisID: 'y3',
            tension: 0.4,
            fill: true
        },
        cloud: {
            label: 'Nuvolosità (%)',
            data: cloudCover,
            borderColor: '#006493',
            backgroundColor: 'rgba(0, 100, 147, 0.1)',
            yAxisID: 'y1',
            tension: 0.4,
            fill: true
        }
    };

    /**
     * Aggiorna il grafico in base alla metrica selezionata dall'utente
     * @param {string} selectedMetric - Chiave della metrica selezionata (temperature, humidity, etc.)
     */
    function updateChart(selectedMetric) {
        const selectedDataset = allDatasets[selectedMetric];
        if (!selectedDataset) return;

        // Aggiorna dataset e usa sempre l'asse Y sinistro per semplicità
        const updatedDataset = { ...selectedDataset };
        updatedDataset.yAxisID = 'y';

        chart24hInstance.data.datasets = [updatedDataset];

        // Aggiorna visibilità e label degli assi
        const scales = chart24hInstance.options.scales;
        scales.y.display = true;
        scales.y.title.display = true;
        scales.y.title.text = selectedDataset.label;

        // Nascondi altri assi non utilizzati
        scales.y1.display = false;
        scales.y2.display = false;
        scales.y3.display = false;

        chart24hInstance.update();
    }

    // Initialize with temperature
    chart24hInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [allDatasets.temperature]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Ora'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Temperatura (°C)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: false,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Umidità / Nuvolosità (%)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                },
                y2: {
                    type: 'linear',
                    display: false,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Precipitazioni (mm)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                },
                y3: {
                    type: 'linear',
                    display: false,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Vento (km/h)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            }
        }
    });

    // Add event listener to selector
    const selector = document.getElementById('chart-selector');
    if (selector) {
        selector.addEventListener('change', (e) => {
            updateChart(e.target.value);
        });
    }
}

/**
 * Converte il codice WMO (World Meteorological Organization) in descrizione testuale italiana
 * @param {number} code - Codice WMO weather interpretation
 * @returns {string} Descrizione meteo in italiano
 */
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

/**
 * Restituisce l'icona Material Symbols corrispondente al codice meteo
 * Le icone variano in base all'ora del giorno (giorno/notte) per alcuni codici
 * @param {number} code - Codice WMO weather interpretation
 * @param {boolean} isDay - true se è giorno, false se è notte
 * @returns {string} Nome dell'icona Material Symbols
 */
function getWeatherIcon(code, isDay = true) {
    const iconMap = {
        0: isDay ? "wb_sunny" : "dark_mode", // Clear sky
        1: isDay ? "partly_cloudy_day" : "partly_cloudy_night",
        2: isDay ? "partly_cloudy_day" : "partly_cloudy_night",
        3: "cloud", // Overcast
        45: "foggy", // Fog
        48: "foggy", // Depositing rime fog
        51: "grain", // Light drizzle
        53: "grain", // Moderate drizzle
        55: "grain", // Dense drizzle
        61: "rainy", // Slight rain
        63: "rainy", // Moderate rain
        65: "rainy", // Heavy rain
        80: "rainy", // Slight rain showers
        81: "rainy", // Moderate rain showers
        82: "rainy", // Violent rain showers
        95: "thunderstorm", // Thunderstorm
        96: "thunderstorm", // Thunderstorm with slight hail
        99: "thunderstorm" // Thunderstorm with heavy hail
    };
    // Fallback: icona di default se codice non riconosciuto
    return iconMap[code] || (isDay ? "wb_sunny" : "cloud");
}

/**
 * Converte i gradi di direzione del vento (0-360°) in abbreviazione cardinale
 * @param {number} degrees - Direzione vento in gradi (0 = Nord, 90 = Est, etc.)
 * @returns {string} Abbreviazione direzione (N, NE, E, etc.)
 */
function getWindDirection(degrees) {
    // 16 direzioni cardinali, ogni direzione copre 22.5 gradi (360/16)
    const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return directions[Math.round(degrees / 22.5) % 16];
}