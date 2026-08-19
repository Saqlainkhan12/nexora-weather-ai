import requests
import json
import re

inputs = [
    'gujranwala ka weather kese ha',
    'Lahore',
    'how is the weather in Karachi',
    'multan ka mausam kaisa hai',
    'rawalpindi ka weather batao'
]

def extract_city(s):
    if not s:
        return ''
    low = re.sub(r'[؟،,?!.]', ' ', s.lower()).strip()
    m = re.search(r'(.+?)\s+ka\b', low)
    if m:
        return m.group(1).strip()
    m = re.search(r'weather in\s+(.+)$', low)
    if m:
        return m.group(1).strip()
    m = re.search(r'\bin\s+(.+)$', low)
    if m:
        return m.group(1).strip()
    # remove filler words
    cleaned = re.sub(r"\b(ka|ke|ki|kese|kesay|kya|hai|ha|weather|mausam|please|batana|batayen)\b", '', low).strip()
    if cleaned and len(cleaned) > 0:
        return cleaned
    return s.strip().split()[-1]

def main():
    for inp in inputs:
        city = extract_city(inp)
        print('INPUT:', inp, '-> EXTRACTED:', city)
        try:
            r = requests.post('http://127.0.0.1:5000/weather', json={'city': city}, timeout=10)
            print(json.dumps(r.json(), indent=2, ensure_ascii=False))
        except Exception as e:
            print('ERROR:', e)
        print('---')

if __name__ == '__main__':
    main()
