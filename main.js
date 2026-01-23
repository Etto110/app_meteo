// Inizializzazione dell'applicazione al caricamento del DOM
document.addEventListener("DOMContentLoaded", () => {
    main()
})

// Variabili globali per la mappa Leaflet e i marker
let map;
let comuneMarkers = [];

/**
 * Funzione principale di inizializzazione
 * Crea la mappa, carica i comuni e configura gli event listener
 */
async function main() {
    try {
        // Inizializzazione mappa Leaflet centrata sull'Italia (lat 41, lon 12, zoom 6)
        map = L.map('map').setView([41, 12], 6);

        // Aggiunta tile layer OpenStreetMap
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 12,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        // Caricamento elenco comuni italiani
        const comuni = await getComuni();
        const inputRegione = document.querySelector("#regione");
        const inputProvincia = document.querySelector("#provincia");

        if (!inputRegione || !inputProvincia) {
            throw new Error("Elementi select non trovati nel DOM");
        }

        // Popolamento iniziale del selettore regioni
        aggiornaSelettoreRegioni(comuni, inputRegione, inputProvincia);

        // Event listener per aggiornamento province quando cambia la regione
        inputRegione.addEventListener("change", () => {
            aggiornaSelettoreProvincie(comuni, inputRegione, inputProvincia);
        });

        // Event listener per aggiornamento mappa quando cambia la provincia
        inputProvincia.addEventListener("change", () => {
            aggiornaMappa(filtraComuni(comuni, inputProvincia));
        });
    } catch (error) {
        console.error("Errore nell'inizializzazione:", error);
    }
}

/**
 * Ottiene le coordinate geografiche (latitudine e longitudine) di una città
 * utilizzando l'API di geocoding di Open-Meteo
 * @param {string} citta - Nome della città
 * @returns {Object|null} Oggetto con lat e lon, o null in caso di errore
 */
async function getLatLon(citta) {
    try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${citta}&language=it&format=json&countryCode=IT`);
        const data = await response.json();
        
        // Verifica che l'API abbia restituito risultati validi
        if (!data.results || data.results.length === 0) return null;
        
        return { lat: data.results[0].latitude, lon: data.results[0].longitude };
    } catch (e) {
        console.error("Geocoding Error", e);
        return null;
    }
}

/**
 * Carica l'elenco completo dei comuni italiani dal repository GitHub
 * @returns {Promise<Array>} Array di oggetti rappresentanti i comuni italiani
 * @throws {Error} Se il caricamento fallisce
 */
async function getComuni() {
    try {
        const response = await fetch("https://raw.githubusercontent.com/matteocontrini/comuni-json/master/comuni.json");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Errore nel caricamento dei comuni:", error);
        alert("Errore nel caricamento dell'elenco dei comuni. Riprova più tardi.");
        throw error;
    }
}

/**
 * Popola il selettore delle regioni con le regioni estratte dall'elenco comuni
 * @param {Array} comuni - Array completo dei comuni
 * @param {HTMLElement} inputRegione - Elemento select per le regioni
 * @param {HTMLElement} inputProvincia - Elemento select per le province (viene resettato)
 */
function aggiornaSelettoreRegioni(comuni, inputRegione, inputProvincia) {
    // Estrae i nomi delle regioni, rimuove duplicati e ordina alfabeticamente
    const regioni = rimuoviDuplicati(comuni.map(x => x.regione.nome));
    
    // Costruisce le opzioni HTML per il select
    // Nota: alcuni nomi contengono "/" seguito da varianti, prendiamo solo la prima parte
    let opzioni = '<option value="">Seleziona Regione</option>';
    regioni.forEach(regione => {
        const nomeRegione = regione.split("/")[0];
        opzioni += `<option value="${nomeRegione}">${nomeRegione}</option>`;
    });
    
    inputRegione.innerHTML = opzioni;
    // Reset del selettore province quando cambia la regione
    inputProvincia.innerHTML = '<option value="">Seleziona Provincia</option>';
}

/**
 * Popola il selettore delle province filtrando per la regione selezionata
 * @param {Array} comuni - Array completo dei comuni
 * @param {HTMLElement} inputRegione - Elemento select per le regioni (per leggere il valore selezionato)
 * @param {HTMLElement} inputProvincia - Elemento select per le province da popolare
 */
function aggiornaSelettoreProvincie(comuni, inputRegione, inputProvincia) {
    // Filtra i comuni per regione, estrae le province, rimuove duplicati e ordina
    const provincie = rimuoviDuplicati(filtraProvincie(comuni, inputRegione).map(x => x.provincia.nome));
    
    let opzioni = '<option value="">Seleziona Provincia</option>';
    provincie.forEach(provincia => {
        const nomeProvincia = provincia.split("/")[0];
        opzioni += `<option value="${nomeProvincia}">${nomeProvincia}</option>`;
    });
    
    inputProvincia.innerHTML = opzioni;
}

/**
 * Aggiorna la mappa aggiungendo marker per tutti i comuni della provincia selezionata
 * Per ogni comune: ottiene coordinate, temperatura attuale e crea un marker con popup
 * @param {Array} comuniSelezionati - Array di comuni appartenenti alla provincia selezionata
 */
async function aggiornaMappa(comuniSelezionati) {
    if (comuniSelezionati.length === 0) return;

    // Rimozione marker esistenti dalla mappa
    comuneMarkers.forEach(marker => map.removeLayer(marker));
    comuneMarkers = [];

    // Calcolo centro provincia per filtraggio geografico e zoom iniziale
    // Usa il comune a metà array come riferimento
    const provinceCenter = await getLatLon(comuniSelezionati[Math.floor(comuniSelezionati.length / 2)].nome);
    if (provinceCenter) {
        map.flyTo([provinceCenter.lat, provinceCenter.lon], 10);
    }

    // Creazione marker per ogni comune in parallelo (Promise.all)
    const markerPromises = comuniSelezionati.map(async (comune) => {
        try {
            const coords = await getLatLon(comune.nome);
            if (coords) {
                // Filtro geografico: esclude comuni troppo distanti dal centro provincia
                // Utile per gestire casi di omonimia (es. comuni con stesso nome in province diverse)
                if (provinceCenter) {
                    const dist = map.distance([provinceCenter.lat, provinceCenter.lon], [coords.lat, coords.lon]);
                    // Soglia di 70km (70000 metri)
                    if (dist > 70000) {
                        return null;
                    }
                }

                // Fetch temperatura attuale dall'API Open-Meteo
                const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true`);
                if (!weatherResponse.ok) {
                    throw new Error(`Weather API error: ${weatherResponse.status}`);
                }
                const weatherData = await weatherResponse.json();
                const temperature = weatherData.current_weather?.temperature ?? "N/A";

                // Creazione marker Leaflet con popup contenente info comune e link dettaglio
                const marker = L.marker([coords.lat, coords.lon])
                    .addTo(map)
                    .bindPopup(`<b>${comune.nome}</b><br>Provincia: ${comune.provincia.nome}<br>Temperatura: ${temperature}°C<br><a href="dettaglio.html?nome=${encodeURIComponent(comune.nome)}" class="btn btn-primary btn-sm mt-2 text-white" style="text-decoration: none;">Dettagli Meteo</a>`);

                return marker;
            }
        } catch (e) {
            console.warn(`Could not get coords for ${comune.nome}:`, e);
            return null;
        }
    });

    // Attesa completamento di tutte le Promise e aggiunta marker validi
    const newMarkers = await Promise.all(markerPromises);
    comuneMarkers.push(...newMarkers.filter(m => m !== null && m !== undefined));

    // Adattamento vista mappa per includere tutti i marker visibili
    if (comuneMarkers.length > 0) {
        const group = new L.featureGroup(comuneMarkers);
        map.fitBounds(group.getBounds());
    }
}

/**
 * Filtra i comuni per regione selezionata
 * @param {Array} comuni - Array completo dei comuni
 * @param {HTMLElement} inputRegione - Select element con la regione selezionata
 * @returns {Array} Array di comuni filtrati per regione
 */
function filtraProvincie(comuni, inputRegione) {
    if (inputRegione.value === "") return []
    // Confronta solo la prima parte del nome (prima di "/") per gestire varianti
    return comuni.filter((x) => x.regione.nome.split("/")[0] === inputRegione.value)
}

/**
 * Filtra i comuni per provincia selezionata
 * @param {Array} comuni - Array completo dei comuni
 * @param {HTMLElement} inputProvincia - Select element con la provincia selezionata
 * @returns {Array} Array di comuni filtrati per provincia
 */
function filtraComuni(comuni, inputProvincia) {
    if (inputProvincia.value === "") return []
    return comuni.filter((x) => x.provincia.nome.split("/")[0] === inputProvincia.value)
}

/**
 * Rimuove duplicati da un array e lo ordina alfabeticamente
 * @param {Array} arr - Array da processare
 * @returns {Array} Array senza duplicati, ordinato
 */
function rimuoviDuplicati(arr) {
    return Array.from(new Set(arr)).sort()
}