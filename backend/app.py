import os
import requests

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND = os.path.join(ROOT, "frontend")

OPENWEATHER_API_KEY = os.getenv(
    "OPENWEATHER_API_KEY",
    ""
).strip()

GEMINI_API_KEY = os.getenv(
    "GEMINI_API_KEY",
    ""
).strip()

app = Flask(__name__, static_folder=None)
CORS(app)


@app.route("/")
def home():

    return send_from_directory(
        FRONTEND,
        "index.html"
    )


@app.route("/style.css")
def style():

    return send_from_directory(
        FRONTEND,
        "style.css"
    )


@app.route("/app.js")
def javascript():

    return send_from_directory(
        FRONTEND,
        "app.js"
    )


@app.route("/api/weather")
def weather():

        city = request.args.get("city", "").strip()
    lat = request.args.get("lat", "").strip()
    lon = request.args.get("lon", "").strip()

    if not city:

        return jsonify({
            "error": "City required."
        }), 400

    if not OPENWEATHER_API_KEY:

        return jsonify({
            "error":
                "OPENWEATHER_API_KEY missing in .env"
        }), 500

    try:

        current_url = (
            "https://api.openweathermap.org/data/2.5/weather"
        )

        forecast_url = (
            "https://api.openweathermap.org/data/2.5/forecast"
        )

                params = {
            "appid": OPENWEATHER_API_KEY,
            "units": "metric"
        }

        if lat and lon:
            params["lat"] = lat
            params["lon"] = lon
        elif city:
            params["q"] = city
        else:
            return jsonify({"error": "City or coordinates required."}), 400

        current_response = requests.get(
            current_url,
            params=params,
            timeout=15
        )

        current = current_response.json()

        if current_response.status_code != 200:

            return jsonify({
                "error":
                    current.get(
                        "message",
                        "City not found."
                    )
            }), current_response.status_code

        forecast_response = requests.get(
            forecast_url,
            params=params,
            timeout=15
        )

        forecast = forecast_response.json()

        hourly = []

        for item in forecast.get("list", [])[:8]:

            hourly.append({

                "time":
                    item["dt_txt"][11:16],

                "temp":
                    round(
                        item["main"]["temp"]
                    ),

                "feels":
                    round(
                        item["main"]["feels_like"]
                    ),

                "humidity":
                    item["main"]["humidity"],

                "wind":
                    round(
                        item["wind"]["speed"] * 3.6,
                        1
                    ),

                "description":
                    item["weather"][0]["description"],

                "condition":
                    item["weather"][0]["main"],

                "icon":
                    item["weather"][0]["icon"]

            })

        daily = {}

        for item in forecast.get("list", []):

            date = item["dt_txt"][:10]

            if date not in daily:

                daily[date] = {

                    "date": date,

                    "temp": round(
                        item["main"]["temp"]
                    ),

                    "min": round(
                        item["main"]["temp_min"]
                    ),

                    "max": round(
                        item["main"]["temp_max"]
                    ),

                    "condition":
                        item["weather"][0]["main"],

                    "description":
                        item["weather"][0]["description"],

                    "icon":
                        item["weather"][0]["icon"]

                }

            else:

                daily[date]["min"] = min(
                    daily[date]["min"],
                    round(item["main"]["temp_min"])
                )

                daily[date]["max"] = max(
                    daily[date]["max"],
                    round(item["main"]["temp_max"])
                )

        daily_list = list(
            daily.values()
        )[:5]

        return jsonify({

            "city":
                current["name"],

            "country":
                current["sys"]["country"],

            "temperature":
                round(current["main"]["temp"]),

            "feels_like":
                round(
                    current["main"]["feels_like"]
                ),

            "humidity":
                current["main"]["humidity"],

            "pressure":
                current["main"]["pressure"],

            "visibility":
                round(
                    current.get(
                        "visibility",
                        0
                    ) / 1000,
                    1
                ),

            "wind":
                round(
                    current["wind"]["speed"] * 3.6,
                    1
                ),

            "wind_direction":
                current["wind"].get(
                    "deg",
                    0
                ),

            "condition":
                current["weather"][0]["main"],

            "description":
                current["weather"][0]["description"],

            "icon":
                current["weather"][0]["icon"],

            "sunrise":
                current["sys"]["sunrise"],

            "sunset":
                current["sys"]["sunset"],

            "hourly":
                hourly,

            "daily":
                daily_list

        })

    except Exception as error:

        return jsonify({
            "error": str(error)
        }), 500


@app.route("/api/chat", methods=["POST"])
def chat():

    data = request.get_json(
        silent=True
    ) or {}

    message = str(
        data.get("message", "")
    ).strip()

    weather_context = data.get(
        "weather",
        {}
    )

    if not message:

        return jsonify({
            "error": "Message required."
        }), 400

    if not GEMINI_API_KEY:

        return jsonify({
            "reply":
                "Gemini API key .env mein add nahi hai."
        })

    prompt = f"""
You are NEXORA Weather AI.

You are a professional weather assistant.

Current weather data:
{weather_context}

User question:
{message}

Rules:
- Give accurate answers using the supplied weather data.
- Do not invent weather information.
- Keep answers clear and useful.
- If the user asks whether they should travel, exercise,
  go outside, carry an umbrella, etc., explain based on
  the available weather conditions.
- Mention uncertainty if the data does not contain enough
  information.
- Answer naturally and briefly.
"""

    try:

        url = (
            "https://generativelanguage.googleapis.com/"
            "v1beta/models/gemini-3.6-flash:generateContent"
            "?key=" + GEMINI_API_KEY
        )

        payload = {

            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ],

            "generationConfig": {

                "temperature": 0.2,

                "maxOutputTokens": 700

            }

        }

        response = requests.post(
            url,
            json=payload,
            timeout=30
        )

        result = response.json()

        if response.status_code != 200:

            return jsonify({
                "reply":
                    "AI service error: "
                    + str(
                        result.get(
                            "error",
                            result
                        )
                    )
            })

        answer = (
            result
            ["candidates"]
            [0]
            ["content"]
            ["parts"]
            [0]
            ["text"]
        )

        return jsonify({
            "reply": answer
        })

    except Exception as error:

        return jsonify({
            "reply":
                "AI connection error: "
                + str(error)
        })


if __name__ == "__main__":

    print("")
    print("=" * 60)
    print("             NEXORA WEATHER AI")
    print("=" * 60)
    print("")
    print("URL: http://127.0.0.1:5000")
    print("")
    print("Weather API:", bool(OPENWEATHER_API_KEY))
    print("Gemini AI:", bool(GEMINI_API_KEY))
    print("")
    print("=" * 60)
    print("")

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )

