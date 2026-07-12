// 1. HYPER-LOCAL TOWNSVILLE REGION RADAR CONFIGURATION
const SYSTEM_SETTINGS = {
    postcodes: ["4810", "4811", "4812", "4814", "4815", "4817", "4818", "4820"], // Townsville, Thuringowa, Outer Regions & Charters Towers
    minPrice: 5.00,
    maxPrice: 150.00,
    quietStart: "20:00",
    quietEnd: "06:00"
};

// Top 5 active deals holder for the 3-second background slideshow rotation
let activeDealImages = [];
let currentBgIndex = 0;
let rotationTimer = null;

// REGISTER PWA SERVICE WORKER WITH SKIP WAITING CAPABILITY
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
    .then((reg) => {
        // Automatically check for modifications on GitHub deployment
        reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('New update pulled from GitHub. Swapping assets instantly.');
                    window.location.reload(); // Refresh screen smoothly with zero memory cache loss
                }
            };
        };
    })
    .catch(err => console.error('Service Worker Link Failed:', err));
}

// 2. LIVE QUEENSLAND FUEL PRICE DATA TRACKER
async function fetchTownsvilleFuel() {
    try {
        // Calls the live QLD government fuel data endpoint
        const response = await fetch('https://data.qld.gov.au');
        const data = await response.json();
        const records = data.result.records;

        let lowestPrice = 999;
        let bestStation = "";

        // Filter through records strictly checking regional stations
        records.forEach(station => {
            if (SYSTEM_SETTINGS.postcodes.includes(station.Postcode)) {
                const currentPrice = parseFloat(station.Price);
                
                // CRITICAL ALARM TRIGGER: Instant notification rule
                if (currentPrice <= 0.99) {
                    triggerEmergencyAlert(`99c FUEL FLASH SALE!`, `${station.Name} - ${station.Address}`, 'Ends shortly');
                }

                // Check for regular daily lowest price marker
                if (currentPrice < lowestPrice) {
                    lowestPrice = currentPrice;
                    bestStation = `${station.Name} (${station.Suburb})`;
                }
            }
        });

        // Update the layout display slot quietly without phone vibration
        const fuelDisplay = document.getElementById('cheapest-fuel-price');
        if (bestStation) {
            fuelDisplay.innerText = `$${(lowestPrice / 100).toFixed(2)} at ${bestStation}`;
        } else {
            fuelDisplay.innerText = "No regional fuel feed detected right now.";
        }
    } catch (error) {
        document.getElementById('cheapest-fuel-price').innerText = "Fuel stream offline.";
    }
}
