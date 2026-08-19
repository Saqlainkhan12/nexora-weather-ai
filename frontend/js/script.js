const form = document.getElementById("weatherForm");
const cityInput = document.getElementById("city");
const chat = document.getElementById("chat");

function addMessage(html, type) {
    const div = document.createElement("div");
    div.className = `message ${type}`;
    div.innerHTML = html;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
    return div;
}

function extractCity(input) {
    if (!input) return "";
    let s = input.toLowerCase().trim();

    // replace Urdu/Persian question mark and punctuation and normalize spaces
    s = s.replace(/[؟،,?!.]/g, " ").replace(/\s+/g, " ").trim();

    // common patterns: "<city> ka ..." (Urdu/Hinglish)
    let m = s.match(/(.+?)\s+ka\b/);
    if (m && m[1]) return m[1].trim();

    // English patterns: "weather in <city>", "how is the weather in <city>"
    m = s.match(/(?:weather\s+in|how is the weather in|what(?:'s| is) the weather in|how's the weather in)\s+(.+)$/);
    if (m && m[1]) return m[1].trim();

    // pattern: ends with city after 'in' e.g. "how is in karachi" (less common)
    m = s.match(/\bin\s+(.+)$/);
    if (m && m[1]) return m[1].trim();

    // remove common filler words
    s = s.replace(/\b(ka|ke|ki|kese|kesay|kya|hai|ha|weather|mausam|please|please tell|batana|batayen)\b/g, "").replace(/\s+/g, " ").trim();

    // if result looks like a city (not empty), return it
    if (s && s.length > 1 && s.split(' ').length <= 5) return s;

    // fallback: try last word (often city name)
    const parts = input.trim().split(/\s+/);
    if (parts.length) return parts[parts.length - 1].replace(/[?!.]/g, "");

    return "";
}

function summarizeWeather(data) {
    const t = Number(data.temperature);
    const p = Number(data.precipitation || 0);
    const desc = (data.description || "").toLowerCase();

    let tempPhrase = "";
    if (t >= 40) tempPhrase = "Bahut zyada garmi hai";
    else if (t >= 35) tempPhrase = "Aaj kafi garmi hai";
    else if (t >= 30) tempPhrase = "Garam mausam hai";
    else if (t >= 20) tempPhrase = "Halka garam/khushgawar mausam hai";
    else tempPhrase = "Thand hai";

    let rainPhrase = "aaj barish ki ummeed nahi";
    if (p > 0.5 || /rain|drizzle|shower|thunder/.test(desc)) {
        // if precipitation is already present
        if (p > 0.1 || /rain|drizzle/.test(desc)) rainPhrase = "aaj barish ho rahi hai";
        else rainPhrase = "aaj barish ho sakti hai";
    }

    // combine into a single Urdu/Hinglish sentence
    return `${tempPhrase}, ${rainPhrase}.`;
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const original = cityInput.value.trim();
    if (!original) return;

    // show the user's original message in chat
    addMessage(original, "user");
    cityInput.value = "";
    cityInput.disabled = true;

    const loading = addMessage("🔎 Weather check ho raha hai...", "bot");

    // extract a cleaned city name from natural language input
    const extracted = extractCity(original);

    if (!extracted) {
        loading.textContent = "? City name samajh nahi aaya — sirf city name likhein (e.g. Lahore).";
        cityInput.disabled = false;
        cityInput.focus();
        return;
    }

    try {
        const response = await fetch("/weather", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ city: extracted })
        });

        const data = await response.json();

        if (!response.ok) {
            loading.textContent = "? " + (data.error || "Weather nahi mil saka.");
            return;
        }

        const summary = summarizeWeather(data);

        loading.innerHTML = `
            <div style="margin-bottom:12px;color:#0f172a;font-weight:700">${summary}</div>
            <div class="weather-card">
                <h2>🌤 ${data.city}, ${data.country}</h2>
                <div class="temperature">${data.temperature}°C</div>
                <strong>${data.description}</strong>
                <div class="weather-row">Feels like: ${data.feels_like}°C</div>
                <div class="weather-row">Humidity: ${data.humidity}%</div>
                <div class="weather-row">Wind: ${data.wind_speed} km/h</div>
                <div class="weather-row">Precipitation: ${data.precipitation} mm</div>
            </div>
        `;

    } catch (error) {
        loading.textContent = "? Weather server se connection nahi ho saka.";
    } finally {
        cityInput.disabled = false;
        cityInput.focus();
    }
});
