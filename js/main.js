async function getLatLon (citta) {
    let x = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${citta}&count=1&language=en&format=json`)
    let data = await x.json()
    return {lat: data.results[0].latitude, lon: data.results[0].longitude}
}

async function meteoDiz(coords){
    return await meteo(coords["lat"], coords["lon"])
}

async function meteo(lat, lon) {

    const url = "https://api.open-meteo.com/v1/forecast?" + new URLSearchParams({
        latitude: lat,
        longitude: lon,
        daily: "sunrise,sunset,uv_index_max,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,precipitation_hours",
        hourly: "temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,rain,showers,snowfall,snow_depth,surface_pressure,cloud_cover,visibility,wind_speed_120m,wind_direction_120m,temperature_80m",
        current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,surface_pressure,wind_speed_10m,wind_gusts_10m,wind_direction_10m",
        past_days: 1,
        timezone: "auto"
    });

    const response = await fetch(url);
    const data = await response.json();

    if (!data.current || !data.hourly || !data.daily) {
        console.error("Risposta API non valida:", data);
        return;
    }

    let weatherData = {
        current: {
            time: new Date(data.current.time),
            temperature_2m: data.current.temperature_2m,
            relative_humidity_2m: data.current.relative_humidity_2m,
            apparent_temperature: data.current.apparent_temperature,
            is_day: data.current.is_day,
            precipitation: data.current.precipitation,
            surface_pressure: data.current.surface_pressure,
            wind_speed_10m: data.current.wind_speed_10m,
            wind_gusts_10m: data.current.wind_gusts_10m,
            wind_direction_10m: data.current.wind_direction_10m,
        },

        hourly: {
            time: data.hourly.time.map(t => new Date(t)),
            temperature_2m: data.hourly.temperature_2m,
            relative_humidity_2m: data.hourly.relative_humidity_2m,
            dew_point_2m: data.hourly.dew_point_2m,
            apparent_temperature: data.hourly.apparent_temperature,
            precipitation_probability: data.hourly.precipitation_probability,
            precipitation: data.hourly.precipitation,
            rain: data.hourly.rain,
            showers: data.hourly.showers,
            snowfall: data.hourly.snowfall,
            snow_depth: data.hourly.snow_depth,
            surface_pressure: data.hourly.surface_pressure,
            cloud_cover: data.hourly.cloud_cover,
            visibility: data.hourly.visibility,
            wind_speed_120m: data.hourly.wind_speed_120m,
            wind_direction_120m: data.hourly.wind_direction_120m,
            temperature_80m: data.hourly.temperature_80m,
        },

        daily: {
            time: data.daily.time.map(t => new Date(t)),
            sunrise: data.daily.sunrise.map(t => new Date(t)),
            sunset: data.daily.sunset.map(t => new Date(t)),
            uv_index_max: data.daily.uv_index_max,
            temperature_2m_max: data.daily.temperature_2m_max,
            temperature_2m_min: data.daily.temperature_2m_min,
            precipitation_sum: data.daily.precipitation_sum,
            precipitation_probability_max: data.daily.precipitation_probability_max,
            precipitation_hours: data.daily.precipitation_hours,
        }
    };

    return weatherData
}

async function main() {    
    
    // creazione mappa
    var map = L.map('map').setView([45, 12], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    //metodi test
    console.log(await getLatLon("Padova"))
    console.log(await meteoDiz(await getLatLon("Padova")))
    
    // creazione popup con latlon
    var popup = L.popup();

    function onMapClick(e) {
        console.log(e.latlng);
        popup
            .setLatLng(e.latlng)
            .setContent("You clicked the map at " + e.latlng.toString())
            .openOn(map)
        return e.latlng
        
    }

    map.panTo([10.737, -73.923], 13)
    
    map.on('click', onMapClick)

    
}
main()