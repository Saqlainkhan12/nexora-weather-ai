import requests

def summarize_weather(data):
    t = float(data.get('temperature', 0))
    p = float(data.get('precipitation', 0) or 0)
    desc = (data.get('description') or '').lower()

    if t >= 40:
        tempPhrase = 'Bahut zyada garmi hai'
    elif t >= 35:
        tempPhrase = 'Aaj kafi garmi hai'
    elif t >= 30:
        tempPhrase = 'Garam mausam hai'
    elif t >= 20:
        tempPhrase = 'Halka garam/khushgawar mausam hai'
    else:
        tempPhrase = 'Thand hai'

    rainPhrase = 'aaj barish ki ummeed nahi'
    if p > 0.5 or any(x in desc for x in ['rain', 'drizzle', 'shower', 'thunder']):
        if p > 0.1 or any(x in desc for x in ['rain', 'drizzle']):
            rainPhrase = 'aaj barish ho rahi hai'
        else:
            rainPhrase = 'aaj barish ho sakti hai'

    return f"{tempPhrase}, {rainPhrase}."

def main():
    city = 'Multan'
    r = requests.post('http://127.0.0.1:5000/weather', json={'city': city}, timeout=10)
    data = r.json()
    print('weather data for', city, data)
    print('summary:', summarize_weather(data))

if __name__ == '__main__':
    main()
