let weatherData = null;

const cityInput =
document.getElementById("cityInput");

const aiInput =
document.getElementById("aiInput");


function toast(message){

    const box =
        document.getElementById("toast");

    box.textContent = message;

    box.classList.add("show");

    setTimeout(
        () => box.classList.remove("show"),
        2500
    );
}


function weatherEmoji(condition, icon){

    const c =
        String(condition || "").toLowerCase();

    if(icon && icon.endsWith("n")){

        if(c.includes("cloud")) return "☁️";

        if(c.includes("rain")) return "🌧️";

        return "🌙";
    }

    if(c.includes("thunder")) return "⛈️";

    if(c.includes("rain")) return "🌧️";

    if(c.includes("drizzle")) return "🌦️";

    if(c.includes("snow")) return "❄️";

    if(c.includes("cloud")) return "☁️";

    if(c.includes("mist") ||
       c.includes("fog") ||
       c.includes("haze")){

        return "🌫️";
    }

    return "☀️";
}


function setBackground(condition, icon){

    const c =
        String(condition || "").toLowerCase();

    document.body.className = "";

    if(icon && icon.endsWith("n")){

        document.body.classList.add("night");

    }else if(c.includes("thunder")){

        document.body.classList.add("storm");

    }else if(c.includes("rain") ||
            c.includes("drizzle")){

        document.body.classList.add("rain");

    }else if(c.includes("snow")){

        document.body.classList.add("snow");

    }else if(c.includes("cloud")){

        document.body.classList.add("clouds");

    }else{

        document.body.classList.add("clear");

    }

}


async function searchWeather(){

    const city =
        cityInput.value.trim();

    if(!city){

        toast("City ka naam enter karo.");

        return;
    }

    try{

        toast("Weather loading...");

        const response =
            await fetch(
                "/api/weather?city="
                +
                encodeURIComponent(city)
            );

        const data =
            await response.json();

        if(!response.ok){

            throw new Error(
                data.error ||
                "Weather unavailable."
            );
        }

        weatherData = data;

        renderWeather(data);

    }catch(error){

        toast(error.message);

    }

}


function renderWeather(data){

    document.getElementById("city")
        .textContent = data.city;

    document.getElementById("country")
        .textContent = data.country;

    document.getElementById("temperature")
        .textContent = data.temperature;

    document.getElementById("feels")
        .textContent =
        data.feels_like + "°C";

    document.getElementById("condition")
        .textContent =
        data.description;

    document.getElementById("humidity")
        .textContent =
        data.humidity + "%";

    document.getElementById("wind")
        .textContent =
        data.wind + " km/h";

    document.getElementById("visibility")
        .textContent =
        data.visibility + " km";

    document.getElementById("pressure")
        .textContent =
        data.pressure + " hPa";

    document.getElementById("weatherIcon")
        .textContent =
        weatherEmoji(
            data.condition,
            data.icon
        );

    document.getElementById("description")
        .textContent =
        data.description;

    document.getElementById("windDirection")
        .textContent =
        windDirection(
            data.wind_direction
        );

    document.getElementById("sunrise")
        .textContent =
        formatTime(
            data.sunrise
        );

    document.getElementById("sunset")
        .textContent =
        formatTime(
            data.sunset
        );

    setBackground(
        data.condition,
        data.icon
    );

    renderHourly(
        data.hourly
    );

    renderDaily(
        data.daily
    );

}


function renderHourly(items){

    const box =
        document.getElementById("hourly");

    box.innerHTML = "";

    items.forEach(
        (item,index)=>{

            const div =
                document.createElement("div");

            div.className = "hour";

            div.innerHTML = `

                <div class="hour-time">
                    ${index === 0 ? "NOW" : item.time}
                </div>

                <div class="hour-icon">
                    ${weatherEmoji(
                        item.condition,
                        item.icon
                    )}
                </div>

                <div class="hour-temp">
                    ${item.temp}°
                </div>

                <div class="hour-rain">
                    💧 ${item.humidity}%
                </div>

            `;

            box.appendChild(div);

        }
    );

}


function renderDaily(items){

    const box =
        document.getElementById("daily");

    box.innerHTML = "";

    items.forEach(item=>{

        const date =
            new Date(
                item.date + "T12:00:00"
            );

        const day =
            date.toLocaleDateString(
                "en-US",
                {
                    weekday:"short"
                }
            );

        const div =
            document.createElement("div");

        div.className = "day";

        div.innerHTML = `

            <div class="day-name">
                ${day}
            </div>

            <div class="day-icon">
                ${weatherEmoji(
                    item.condition,
                    item.icon
                )}
            </div>

            <div class="day-temp">
                ${item.max}° / ${item.min}°
            </div>

            <div class="day-range">
                ${item.description}
            </div>

        `;

        box.appendChild(div);

    });

}


function windDirection(deg){

    const directions = [
        "N","NE","E","SE",
        "S","SW","W","NW"
    ];

    return directions[
        Math.round(deg / 45) % 8
    ];

}


function formatTime(timestamp){

    if(!timestamp) return "--";

    return new Date(
        timestamp * 1000
    ).toLocaleTimeString(
        [],
        {
            hour:"2-digit",
            minute:"2-digit"
        }
    );

}


function updateClock(){

    const now =
        new Date();

    document.getElementById("clock")
        .textContent =
        now.toLocaleTimeString(
            [],
            {
                hour:"2-digit",
                minute:"2-digit"
            }
        );

    document.getElementById("date")
        .textContent =
        now.toLocaleDateString(
            "en-US",
            {
                weekday:"long",
                month:"long",
                day:"numeric"
            }
        );

}


async function useLocation(){

    if(!navigator.geolocation){

        toast(
            "Browser location support nahi karta."
        );

        return;
    }

    navigator.geolocation.getCurrentPosition(
        async position => {

            try{

                toast(
                    "Location weather load ho raha hai..."
                );

                const lat =
                    position.coords.latitude;

                const lon =
                    position.coords.longitude;

                /*
                 OpenWeather reverse geocoding
                 backend endpoint ko city chahiye,
                 isliye coordinates se city naam
                 nikalne ke liye direct OpenWeather
                 endpoint yahan use nahi kar rahe.
                 Browser geolocation fallback:
                 nearest common city lookup nahi.
                */

                toast(
                    "Location detected. Search bar mein city use karein."
                );

            }catch(error){

                toast(
                    "Location weather unavailable."
                );

            }

        },

        () => {

            toast(
                "Location permission allow karo."
            );

        }

    );

}


function addAIMessage(text, user=false){

    const box =
        document.getElementById(
            "aiMessages"
        );

    const div =
        document.createElement("div");

    div.className =
        "ai-message";

    div.style.marginBottom =
        "10px";

    div.innerHTML = `

        <div class="ai-mini">
            ${user ? "U" : "✦"}
        </div>

        <div>
            ${escapeHTML(text)}
        </div>

    `;

    box.appendChild(div);

    box.scrollTop =
        box.scrollHeight;

}


async function sendAI(){

    const message =
        aiInput.value.trim();

    if(!message) return;

    if(!weatherData){

        toast(
            "Pehle kisi city ka weather search karo."
        );

        return;

    }

    addAIMessage(
        message,
        true
    );

    aiInput.value = "";

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

                    body:
                        JSON.stringify({
                            message,
                            weather:
                                weatherData
                        })
                }
            );

        const data =
            await response.json();

        addAIMessage(
            data.reply ||
            "AI response unavailable."
        );

    }catch(error){

        addAIMessage(
            "Weather AI temporarily unavailable."
        );

    }

}


function askAI(question){

    aiInput.value =
        question;

    sendAI();

}


function escapeHTML(text){

    return String(text)
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");

}


cityInput.addEventListener(
    "keydown",
    event => {

        if(event.key === "Enter"){

            searchWeather();

        }

    }
);


aiInput.addEventListener(
    "keydown",
    event => {

        if(
            event.key === "Enter"
            &&
            !event.shiftKey
        ){

            event.preventDefault();

            sendAI();

        }

    }
);


updateClock();

setInterval(
    updateClock,
    1000
);


/*
Default city.
Change this if you want another
initial location.
*/

cityInput.value = "Vehari";

searchWeather();

