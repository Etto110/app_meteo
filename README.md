# 🌤️ Meteo Comuni Italiani

<div align="center">

![Badge Licenza](https://img.shields.io/github/license/Etto110/app_meteo?style=for-the-badge&label=Licenza&color=blue)
![Badge Versione](https://img.shields.io/badge/Versione-1.0.0-green?style=for-the-badge)
![Badge Stato](https://img.shields.io/badge/Stato-Attivo-success?style=for-the-badge)

**Un'applicazione web moderna e reattiva per consultare le previsioni meteo di tutti i comuni italiani.**

[Segnala un Problema](https://github.com/Etto110/app_meteo/issues) · [Richiedi Funzionalità](https://github.com/Etto110/app_meteo/issues)

</div>

---

## 📖 Panoramica

**Meteo Comuni Italiani** è una web app *client-side* leggera e veloce, sviluppata con tecnologie standard (HTML, CSS, JS). Permette agli utenti di cercare qualsiasi comune italiano tramite una mappa interattiva o campi di ricerca e visualizzare istantaneamente le condizioni meteo attuali e le previsioni dettagliate.

L'applicazione sfrutta l'API open-source di **Open-Meteo** per fornire dati precisi senza necessità di chiavi API complesse o costi di gestione.

## ✨ Funzionalità Principali

*   🌍 **Mappa Interattiva**: Esplora l'Italia e seleziona i comuni direttamente dalla mappa (basata su Leaflet).
*   🔍 **Ricerca Intelligente**: Filtra per Regione e Provincia per trovare rapidamente il comune desiderato.
*   ⚡ **Meteo in Tempo Reale**: Temperatura, condizioni, umidità, vento e altri dati aggiornati.
*   📅 **Previsioni Dettagliate**:
    *   Grafici interattivi per le prossime 24 ore.
    *   Previsioni giornaliere per i prossimi 7 giorni.
    *   Dettagli su alba, tramonto, indice UV e qualità dell'aria (se disponibile).
*   📱 **Design Responsivo**: Ottimizzato per desktop, tablet e smartphone grazie a Bootstrap 5.

## 🛠️ Stack Tecnologico

Il progetto è costruito mantenendo la semplicità e le performance al primo posto:

| Categoria | Tecnologie |
| :--- | :--- |
| **Frontend Core** | ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black) |
| **UI Framework** | ![Bootstrap](https://img.shields.io/badge/Bootstrap_5-7952B3?style=flat-square&logo=bootstrap&logoColor=white) |
| **Mappe** | ![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=flat-square&logo=leaflet&logoColor=white) |
| **Grafici** | ![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=flat-square&logo=chartdotjs&logoColor=white) |
| **Dati Meteo** | [Open-Meteo API](https://open-meteo.com/) |

## 🚀 Guida Rapida

Non è necessaria alcuna installazione complessa o server backend.

### Prerequisiti
*   Un qualsiasi browser web moderno (Chrome, Firefox, Edge, Safari).
*   Connessione internet attiva (per caricare mappe e dati API).

### Avvio
1.  **Clona o Scarica** questo repository.
2.  Apri il file `index.html` con il tuo browser preferito.
    *   *Opzionale ma consigliato*: Per evitare limitazioni di sicurezza CORS locali su alcuni browser, usa un semplice server locale (es. Estensione "Live Server" di VS Code, o `python -m http.server`).

## 📁 Struttura del Progetto

```text
app_meteo/
├── 📄 index.html        # Home page con mappa e selezione località
├── 📄 dettaglio.html    # Pagina di dettaglio previsioni meteo
├── 🎨 style.css         # Stili personalizzati
├── ⚙️ main.js           # Logica per la home page e la mappa
└── ⚙️ dettaglio.js      # Logica per recupero dati meteo e grafici
```

## 🤝 Contribuire

I contributi sono benvenuti! Se hai idee per migliorare l'app:

1.  Fai un **Fork** del progetto.
2.  Crea un branch per la tua funzionalità (`git checkout -b feature/NuovaFeature`).
3.  Effettua il **Commit** delle modifiche.
4.  Fai il **Push** sul branch.
5.  Apri una **Pull Request**.

## 📄 Licenza

Distribuito con licenza GPL 3.0. Vedi `LICENSE` per maggiori informazioni.

---
<div align="center">
  <sub>Realizzato con ❤️ da <a href="https://github.com/Etto110">Etto110</a> e <a href="https://github.com/MrPanda376">MrPanda376</a></sub>
</div>