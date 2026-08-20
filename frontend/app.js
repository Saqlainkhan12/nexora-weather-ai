let currentWeather = null;
let currentUnit = "C";
let lastCity = "Lahore";

const $ = id => document.getElementById(id);

function escapeHTML(value){
    return String(value ?? "")
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");
}

function weatherEmoji(code){

    const icons = {
        "01d":"☀️","01n":"🌙",
        "02d":"🌤️","02n":"☁️",
        "03d":"☁️","03n":"☁️",
        "04d":"☁️","04n":"☁️",
        "09d":"🌧️","09n":"🌧️",
        "10d":"🌦️","10n":"🌧️",
        "11d":"⛈️","11n":"⛈️",
        "13d":"❄️","13n":"❄️",
        "50d":"🌫️","50n":"🌫️"
    };

    return icons[code] || "🌤️";
}

function convertTemp(value){

    const n = Number(value);

    if(!Number.isFinite(n)) return "--";

    if(currentUnit === "F"){
        return Math.round((n * 9 / 5) + 32);
    }

    return Math.round(n);
}

function tempText(value){
    return `${convertTemp(value)}°`;
}

function formatTime(timestamp){

    if(!timestamp) return "--:--";

    return new Date(timestamp * 1000)
        .toLocaleTimeString([],{
            hour:"2-digit",
            minute:"2-digit"
        });
}

function formatDay(date){

    if(!date) return "--";

    return new Date(`${date}T12:00:00`)
        .toLocaleDateString([],{
            weekday:"short"
        });
}

function showToast(message){

    const toast = $("toast");

    if(!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(
        () => toast.classList.remove("show"),
        2800
    );
}

function updateClock(){

    const now = new Date();

    $("clock").textContent =
        now.toLocaleTimeString([],{
            hour:"2-digit",
            minute:"2-digit"
        });

    $("date").textContent =
        now.toLocaleDateString([],{
            weekday:"long",
            month:"long",
            day:"numeric"
        });
}

setInterval(updateClock,1000);
updateClock();


function toggleUnit(){

    currentUnit =
        currentUnit === "C" ? "F" : "C";

    $("unitButton").textContent =
        `°${currentUnit}`;

    if(currentWeather){
        renderWeather(currentWeather);
    }
}


function toggleTheme(){

    document.body.classList.toggle("light");

    const light =
        document.body.classList.contains("light");

    $("themeButton").textContent =
        light ? "☀" : "☾";

    localStorage.setItem(
        "nexora-theme",
        light ? "light" : "dark"
    );
}


if(localStorage.getItem("nexora-theme") === "light"){

    document.body.classList.add("light");

    if($("themeButton")){
        $("themeButton").textContent = "☀";
    }
}


function conditionClass(condition){

    document.body.classList.remove(
        "clear","clouds","rain","storm","snow"
    );

    const c =
        String(condition || "").toLowerCase();

    if(c.includes("thunder")){
        document.body.classList.add("storm");
    }
    else if(c.includes("rain") || c.includes("drizzle")){
        document.body.classList.add("rain");
    }
    else if(c.includes("snow")){
        document.body.classList.add("snow");
    }
    else if(c.includes("cloud")){
        document.body.classList.add("clouds");
    }
    else{
        document.body.classList.add("clear");
    }
}


function buildSummary(data){

    const temp = Number(data.temperature);
    const rain = Number(data.rain_probability || 0);

    let heat = "Cool conditions";

    if(temp >= 40){
        heat = "Very hot conditions";
    }
    else if(temp >= 35){
        heat = "Hot conditions";
    }
    else if(temp >= 30){
        heat = "Warm conditions";
    }
    else if(temp >= 20){
        heat = "Comfortable conditions";
    }

    let rainText = "low rain risk";

    if(rain >= 70){
        rainText = "high rain risk";
    }
    else if(rain >= 35){
        rainText = "moderate rain risk";
    }

    return `${heat} with ${rainText}. Humidity is ${data.humidity ?? "--"}% and wind is around ${data.wind ?? "--"} km/h.`;
}


function makeInsight(data){

    const temp = Number(data.temperature);
    const rain = Number(data.rain_probability || 0);

    if(rain >= 70){
        return {
            title:"Rain-ready day",
            text:"Rain risk is elevated. Keep an umbrella nearby and allow extra time for travel."
        };
    }

    if(temp >= 38){
        return {
            title:"Heat-aware planning",
            text:"It is hot outside. Hydration, shade and shorter outdoor exposure are sensible."
        };
    }

    if(temp >= 24 && temp <= 32 && rain < 35){
        return {
            title:"Good outdoor window",
            text:"Conditions look relatively comfortable. This is a reasonable window for outdoor plans."
        };
    }

    return {
        title:"Plan around the conditions",
        text:"Weather is moderate. Check the hourly forecast before longer outdoor plans."
    };
}


function renderWeather(data){

    currentWeather = data;

    lastCity =
        data.city || lastCity;

    conditionClass(data.condition);

    $("city").textContent =
        data.city || "--";

    $("country").textContent =
        data.country || "--";

    $("statusCity").textContent =
        `${data.city || "--"}, ${data.country || "--"}`;

    $("mapLocation").textContent =
        `${data.city || "--"}, ${data.country || "--"}`;

    $("weatherIcon").textContent =
        weatherEmoji(data.icon);

    $("temperature").textContent =
        convertTemp(data.temperature);

    $("tempUnit").textContent =
        `°${currentUnit}`;

    $("condition").textContent =
        data.description ||
        data.condition ||
        "--";

    $("feels").textContent =
        tempText(data.feels_like);

    $("humidity").textContent =
        `${data.humidity ?? "--"}%`;

    $("wind").textContent =
        `${data.wind ?? "--"} km/h`;

    $("visibility").textContent =
        `${data.visibility ?? "--"} km`;

    $("pressure").textContent =
        `${data.pressure ?? "--"} hPa`;

    $("sunrise").textContent =
        formatTime(data.sunrise);

    $("sunset").textContent =
        formatTime(data.sunset);

    $("windDirection").textContent =
        `${data.wind_direction ?? 0}°`;

    $("rainChance").textContent =
        `${data.rain_probability ?? 0}%`;

    $("description").textContent =
        data.description || "--";

    $("weatherSummary").textContent =
        buildSummary(data);

    $("lastUpdated").textContent =
        "Updated just now";

    const insight = makeInsight(data);

    $("insightTitle").textContent =
        insight.title;

    $("insightText").textContent =
        insight.text;

    renderHourly(data.hourly || []);
    renderDaily(data.daily || []);

    updateMap(
        data.latitude,
        data.longitude
    );
}


function renderHourly(items){

    const box = $("hourly");

    if(!items.length){

        box.innerHTML =
            `<div style="padding:20px;color:var(--muted);font-size:11px">
                Hourly forecast unavailable.
            </div>`;

        return;
    }

    box.innerHTML =
        items.map((item,index)=>`

            <div class="hour ${index === 0 ? "active" : ""}">

                <div class="hour-time">
                    ${escapeHTML(item.time || "--")}
                </div>

                <div class="hour-icon">
                    ${weatherEmoji(item.icon)}
                </div>

                <div class="hour-temp">
                    ${tempText(item.temp)}
                </div>

                <div class="hour-rain">
                    ${escapeHTML(item.humidity ?? "--")}% humidity
                </div>

            </div>

        `).join("");
}


function renderDaily(items){

    const box = $("daily");

    if(!items.length){

        box.innerHTML =
            `<div style="padding:20px;color:var(--muted);font-size:11px">
                Daily forecast unavailable.
            </div>`;

        return;
    }

    box.innerHTML =
        items.map(item=>`

            <div class="day">

                <div class="day-name">
                    ${escapeHTML(formatDay(item.date))}
                </div>

                <div class="day-icon">
                    ${weatherEmoji(item.icon)}
                </div>

                <div class="day-temp">
                    ${tempText(item.temp)}
                </div>

                <div class="day-range">
                    ${tempText(item.min)}
                    /
                    ${tempText(item.max)}
                    ·
                    ${escapeHTML(item.description || "")}
                </div>

            </div>

        `).join("");
}


function updateMap(lat,lon){

    if(!lat || !lon) return;

    const d = .12;

    const bbox =
        `${lon-d},${lat-d},${lon+d},${lat+d}`;

    $("weatherMap").src =
        "https://www.openstreetmap.org/export/embed.html"
        + `?bbox=${encodeURIComponent(bbox)}`
        + `&layer=mapnik`
        + `&marker=${lat},${lon}`;
}


function setLoading(state){

    document.body.classList.toggle(
        "loading",
        state
    );
}


async function searchWeather(cityOverride){

    const input = $("cityInput");

    const city =
        String(
            cityOverride ||
            input.value ||
            ""
        ).trim();

    if(!city){

        showToast("Enter a city first.");

        input.focus();

        return;
    }

    setLoading(true);

    try{

        const response =
            await fetch(
                `/api/weather?city=${encodeURIComponent(city)}`
            );

        const data =
            await response.json();

        if(!response.ok){

            throw new Error(
                data.error ||
                "Weather unavailable."
            );
        }

        renderWeather(data);

        input.value =
            data.city || city;

        showToast(
            `Weather loaded for ${data.city}`
        );

    }
    catch(error){

        console.error(error);

        showToast(
            error.message ||
            "Weather service unavailable."
        );

    }
    finally{

        setLoading(false);
    }
}


async function refreshWeather(){

    await searchWeather(
        lastCity || "Lahore"
    );
}


function useLocation(){

    if(!navigator.geolocation){

        showToast(
            "Location is not supported."
        );

        return;
    }

    showToast("Finding your location...");

    navigator.geolocation.getCurrentPosition(

        async position=>{

            try{

                setLoading(true);

                const lat =
                    position.coords.latitude;

                const lon =
                    position.coords.longitude;

                const response =
                    await fetch(
                        `/api/weather?lat=${lat}&lon=${lon}`
                    );

                const data =
                    await response.json();

                if(!response.ok){

                    throw new Error(
                        data.error ||
                        "Location weather unavailable."
                    );
                }

                renderWeather(data);

                $("cityInput").value =
                    data.city || "";

                showToast(
                    "Location weather loaded."
                );

            }
            catch(error){

                showToast(
                    error.message ||
                    "Location weather failed."
                );

            }
            finally{

                setLoading(false);
            }

        },

        ()=>{
            showToast(
                "Location permission was not granted."
            );
        },

        {
            enableHighAccuracy:true,
            timeout:10000,
            maximumAge:300000
        }
    );
}


/* AI */

function addAIMessage(text,type="bot"){

    const box =
        $("aiMessages");

    const el =
        document.createElement("div");

    el.className =
        `message ${type}`;

    if(type === "bot"){

        el.innerHTML = `
            <div class="avatar">✦</div>
            <p>${escapeHTML(text)}</p>
        `;

    }else{

        el.innerHTML = `
            <p>${escapeHTML(text)}</p>
        `;
    }

    box.appendChild(el);

    box.scrollTop =
        box.scrollHeight;

    return el;
}


async function askAI(message){

    const question =
        String(
            message ||
            $("aiInput").value ||
            ""
        ).trim();

    if(!question) return;

    $("aiInput").value = "";

    addAIMessage(
        question,
        "user"
    );

    const loading =
        addAIMessage(
            "Thinking with the current weather..."
        );

    try{

        const response =
            await fetch(
                "/api/chat",
                {
                    method:"POST",
                    headers:{
                        "Content-Type":
                            "application/json"
                    },
                    body:JSON.stringify({
                        message:question,
                        weather:
                            currentWeather || {}
                    })
                }
            );

        const data =
            await response.json();

        loading.remove();

        addAIMessage(
            data.reply ||
            data.error ||
            "I couldn't generate an answer."
        );

    }
    catch(error){

        console.error(error);

        loading.remove();

        addAIMessage(
            "AI connection failed. Please try again."
        );
    }
}


function sendAI(){
    askAI();
}


/* EVENTS */

$("cityInput").addEventListener(
    "keydown",
    event=>{
        if(event.key === "Enter"){
            event.preventDefault();
            searchWeather();
        }
    }
);

$("aiInput").addEventListener(
    "keydown",
    event=>{
        if(event.key === "Enter"){
            event.preventDefault();
            sendAI();
        }
    }
);


/* START */

searchWeather("Lahore");