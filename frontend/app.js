const $ = (id) => document.getElementById(id);

let currentWeather = null;

function icon(code) {
    const map = {
        "01d":"☀️","01n":"🌙","02d":"🌤️","02n":"☁️",
        "03d":"☁️","03n":"☁️","04d":"☁️","04n":"☁️",
        "09d":"🌧️","09n":"🌧️","10d":"🌦️","10n":"🌧️",
        "11d":"⛈️","11n":"⛈️","13d":"❄️","13n":"❄️",
        "50d":"🌫️","50n":"🌫️"
    };
    return map[code] || "🌤️";
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");
}

function weatherClass(condition) {
    const c = String(condition || "").toLowerCase();

    if (c.includes("thunder")) return "storm";
    if (c.includes("rain") || c.includes("drizzle")) return "rain";
    if (c.includes("snow")) return "snow";
    if (c.includes("cloud")) return "clouds";
    return "clear";
}

function setLoading(loading) {
    document.body.classList.toggle("loading", loading);
}

function showToast(message) {
    const toast = $("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => toast.classList.remove("show"), 2800);
}

function formatTime(timestamp) {
    if (!timestamp) return "--";

    return new Date(timestamp * 1000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatDay(date) {
    return new Date(date + "T12:00:00").toLocaleDateString([], {
        weekday: "short"
    });
}

function updateClock() {
    const now = new Date();

    if ($("clock")) {
        $("clock").textContent = now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    if ($("date")) {
        $("date").textContent = now.toLocaleDateString([], {
            weekday: "long",
            month: "long",
            day: "numeric"
        });
    }
}

async function searchWeather(cityOverride) {
    const input = $("cityInput");
    const city = String(cityOverride || input?.value || "").trim();

    if (!city) {
        showToast("Enter a city name first.");
        input?.focus();
        return;
    }

    setLoading(true);

    try {
        const response = await fetch(
            `/api/weather?city=${encodeURIComponent(city)}`,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Weather could not be loaded.");
        }

        currentWeather = data;
        renderWeather(data);

        if (input) input.value = data.city || city;

        showToast(`Weather updated for ${data.city}, ${data.country}`);
    } catch (error) {
        console.error(error);
        showToast(error.message || "Weather service unavailable.");
    } finally {
        setLoading(false);
    }
}

function renderWeather(data) {
    const condition = data.condition || "Clear";

    document.body.className = weatherClass(condition);

    if ($("city")) $("city").textContent = data.city || "Unknown";
    if ($("country")) $("country").textContent = data.country || "--";

    if ($("weatherIcon")) {
        $("weatherIcon").textContent = icon(data.icon);
    }

    if ($("temperature")) {
        $("temperature").textContent = data.temperature ?? "--";
    }

    if ($("condition")) {
        $("condition").textContent =
            data.description ||
            condition;
    }

    if ($("feels")) {
        $("feels").textContent =
            `${data.feels_like ?? "--"}°C`;
    }

    if ($("humidity")) {
        $("humidity").textContent =
            `${data.humidity ?? "--"}%`;
    }

    if ($("wind")) {
        $("wind").textContent =
            `${data.wind ?? "--"} km/h`;
    }

    if ($("visibility")) {
        $("visibility").textContent =
            `${data.visibility ?? "--"} km`;
    }

    if ($("pressure")) {
        $("pressure").textContent =
            `${data.pressure ?? "--"} hPa`;
    }

    if ($("sunrise")) {
        $("sunrise").textContent =
            formatTime(data.sunrise);
    }

    if ($("sunset")) {
        $("sunset").textContent =
            formatTime(data.sunset);
    }

    if ($("windDirection")) {
        $("windDirection").textContent =
            `${data.wind_direction ?? 0}°`;
    }

    if ($("description")) {
        $("description").textContent =
            data.description || "--";
    }

    renderHourly(data.hourly || []);
    renderDaily(data.daily || []);
}

function renderHourly(items) {
    const container = $("hourly");
    if (!container) return;

    if (!items.length) {
        container.innerHTML =
            `<div class="empty-state">Hourly forecast unavailable.</div>`;
        return;
    }

    container.innerHTML = items.map((item, index) => `
        <div class="hour ${index === 0 ? "active" : ""}">
            <div class="hour-time">
                ${escapeHtml(item.time || "--")}
            </div>

            <div class="hour-icon">
                ${icon(item.icon)}
            </div>

            <div class="hour-temp">
                ${escapeHtml(item.temp)}°C
            </div>

            <div class="hour-rain">
                ${escapeHtml(item.humidity)}% humidity
            </div>
        </div>
    `).join("");
}

function renderDaily(items) {
    const container = $("daily");
    if (!container) return;

    if (!items.length) {
        container.innerHTML =
            `<div class="empty-state">Daily forecast unavailable.</div>`;
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="day">
            <div class="day-name">
                ${escapeHtml(formatDay(item.date))}
            </div>

            <div class="day-icon">
                ${icon(item.icon)}
            </div>

            <div class="day-temp">
                ${escapeHtml(item.temp)}°C
            </div>

            <div class="day-range">
                ${escapeHtml(item.min)}° / ${escapeHtml(item.max)}°
            </div>

            <div class="day-range">
                ${escapeHtml(item.condition || "")}
            </div>
        </div>
    `).join("");
}

function addAIMessage(text, type = "ai") {
    const container = $("aiMessages");
    if (!container) return;

    const wrapper = document.createElement("div");
    wrapper.className = "ai-message";

    if (type === "user") {
        wrapper.style.justifyContent = "flex-end";
        wrapper.style.textAlign = "right";
        wrapper.innerHTML =
            `<div>${escapeHtml(text)}</div>`;
    } else {
        wrapper.innerHTML = `
            <div class="ai-mini">✦</div>
            <div>${escapeHtml(text)}</div>
        `;
    }

    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;
}

async function askAI(message) {
    const question = String(
        message || $("aiInput")?.value || ""
    ).trim();

    if (!question) return;

    if ($("aiInput")) $("aiInput").value = "";

    addAIMessage(question, "user");

    const loading = document.createElement("div");
    loading.className = "ai-message";
    loading.innerHTML = `
        <div class="ai-mini">✦</div>
        <div>Thinking about your weather...</div>
    `;

    $("aiMessages")?.appendChild(loading);

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                message: question,
                weather: currentWeather || {}
            })
        });

        const data = await response.json();

        loading.remove();

        addAIMessage(
            data.reply ||
            data.error ||
            "I couldn't generate a weather answer."
        );
    } catch (error) {
        console.error(error);
        loading.remove();
        addAIMessage(
            "AI connection failed. Please try again."
        );
    }
}

function sendAI() {
    askAI();
}

function useLocation() {
    if (!navigator.geolocation) {
        showToast("Location is not supported by this browser.");
        return;
    }

    showToast("Getting your location...");

    navigator.geolocation.getCurrentPosition(
        async position => {
            try {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                const response = await fetch(
                    `/api/weather?lat=${lat}&lon=${lon}`
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.error || "Location weather unavailable."
                    );
                }

                currentWeather = data;
                renderWeather(data);

                if ($("cityInput")) {
                    $("cityInput").value = data.city || "";
                }

                showToast("Showing weather for your location.");
            } catch (error) {
                showToast(error.message);
            }
        },
        () => {
            showToast(
                "Location permission was not available."
            );
        }
    );
}

document.addEventListener("DOMContentLoaded", () => {
    updateClock();
    setInterval(updateClock, 1000);

    $("cityInput")?.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            searchWeather();
        }
    });

    $("aiInput")?.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            sendAI();
        }
    });

    searchWeather("Lahore");
});
