document.addEventListener("DOMContentLoaded", () => {
    main()
})

let map; // Global scope for map
let comuneMarkers = []; // Global scope for markers

async function main() {
    // creazione mappa
    map = L.map('map').setView([45, 12], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // creazione popup con latlon
    var popup = L.popup();

    function onMapClick(e) {
        popup
            .setLatLng(e.latlng)
            .setContent("You clicked the map at " + e.latlng.toString())
            .openOn(map)
        return e.latlng

    }

    map.on('click', onMapClick)

    // Selettori regioni e province

    const comuni = await getComuni()

    let inputRegione = document.querySelector("#regione")
    let inputProvincia = document.querySelector("#provincia")

    aggiornaSelettoreRegioni(comuni, inputRegione, inputProvincia)

    inputRegione.addEventListener("change", () => {
        aggiornaSelettoreProvincie(comuni, inputRegione, inputProvincia)
    })

    inputProvincia.addEventListener("change", () => {
        aggiornaMappa(filtraComuni(comuni, inputProvincia), inputProvincia.value)
        // Zoom mappa
    })
}

async function getLatLon(citta) {
    let x = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${citta}&count=1&language=en&format=json&countryCode=IT`)
    let data = await x.json()
    return { lat: data.results[0].latitude, lon: data.results[0].longitude }
}

async function getComuni() {
    return await fetch("https://raw.githubusercontent.com/matteocontrini/comuni-json/master/comuni.json")
        .then((response) => response.json())
}

function aggiornaSelettoreRegioni(comuni, inputRegione, inputProvincia) {
    let regioni = rimuoviDuplicati(comuni.map(x => x.regione.nome))

    let opzioni = '<option value="">Seleziona Regione</option>'
    for (let i = 0; i < regioni.length; i++) {
        opzioni += `<option value="${regioni[i].split("/")[0]}">${regioni[i].split("/")[0]}</option>`
    }
    inputRegione.innerHTML = opzioni

    // Reset provincia selector too
    inputProvincia.innerHTML = '<option value="">Seleziona Provincia</option>'
}

function aggiornaSelettoreProvincie(comuni, inputRegione, inputProvincia) {
    let provincie = rimuoviDuplicati(filtraProvincie(comuni, inputRegione).map(x => x.provincia.nome))

    let opzioni = '<option value="">Seleziona Provincia</option>'
    for (let i = 0; i < provincie.length; i++) {
        opzioni += `<option value="${provincie[i].split("/")[0]}">${provincie[i].split("/")[0]}</option>`
    }
    inputProvincia.innerHTML = opzioni

    // Don't auto-trigger map update on province list change unless we want to clear it
    // aggiornaMappa([], "") // Clear map is safer
}

async function aggiornaMappa(comuniSelezionati, nomeProvincia) {

    // Clear existing markers
    if (window.comuneMarkers) {
        window.comuneMarkers.forEach(marker => map.removeLayer(marker));
    }
    window.comuneMarkers = [];

    // Fetch province coordinates for filtering
    let provinceCenter = null;
    let animationPromise = Promise.resolve();

    if (nomeProvincia) {
        try {
            provinceCenter = await getLatLon(nomeProvincia);
            if (provinceCenter && provinceCenter.lat) {
                animationPromise = new Promise(resolve => {
                    map.once('moveend', resolve);
                    map.flyTo([provinceCenter.lat, provinceCenter.lon], 10);
                });
            }
        } catch (e) {
            console.warn("Could not fetch province center:", e);
        }
    }

    // Add new markers
    const markerPromises = comuniSelezionati.map(async (comune) => {
        try {
            const coords = await getLatLon(comune.nome);
            if (coords && coords.lat && coords.lon) {
                // Check distance if we have a province center
                if (provinceCenter && provinceCenter.lat) {
                    const dist = map.distance([provinceCenter.lat, provinceCenter.lon], [coords.lat, coords.lon]);
                    // 70km threshold (70000 meters)
                    if (dist > 70000) {
                        return null;
                    }
                }

                const marker = L.marker([coords.lat, coords.lon])
                    .addTo(map)
                    .bindPopup(`<b>${comune.nome}</b><br>Provincia: ${comune.provincia.nome}<br><a href="dettagli.html?city=${encodeURIComponent(comune.nome)}" class="btn btn-primary btn-sm mt-2 text-white" style="text-decoration: none;">Dettagli Meteo</a>`);

                return marker;
            }
        } catch (e) {
            console.warn(`Could not get coords for ${comune.nome}:`, e);
            return null;
        }
    });

    const newMarkers = await Promise.all(markerPromises);
    window.comuneMarkers.push(...newMarkers.filter(m => m !== null));

    // Fit bounds if we have markers
    if (window.comuneMarkers.length > 0) {
        await animationPromise;
        const group = new L.featureGroup(window.comuneMarkers);
        map.fitBounds(group.getBounds());
    }
}

function filtraProvincie(comuni, inputRegione) {
    if (inputRegione.value === "") return comuni
    return comuni.filter((x) => x.regione.nome.split("/")[0] === inputRegione.value)
}

function filtraComuni(comuni, inputProvincia) {
    if (inputProvincia.value === "") return comuni
    return comuni.filter((x) => x.provincia.nome.split("/")[0] === inputProvincia.value)
}

function rimuoviDuplicati(arr) {
    return Array.from(new Set(arr)).sort()
}