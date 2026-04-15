import google.generativeai as genai
from PIL import Image
import json, re

GEMINI_API_KEY = "AIzaSyCspXqGxZblQdBbIVKgOdyB_5rsJoWIHWI"

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

def describe_image(image_path: str) -> tuple[str, str]:
    """
    Analizuje zdjęcie i zwraca:
    - query: zapytanie do Vinted po angielsku (marka + typ + rozmiar)
    - opis_pl: opis po polsku dla użytkownika
    """
    img = Image.open(image_path)

    prompt = """Jesteś ekspertem od mody i resellingu ubrań.

Przeanalizuj to zdjęcie ubrania lub akcesoria i odpowiedz TYLKO w formacie JSON:

{
  "brand": "nazwa marki (np. Nike, Stone Island, Zara) lub null jeśli nieznana",
  "type": "typ ubrania po angielsku (np. hoodie, jacket, t-shirt, sneakers)",
  "type_pl": "typ ubrania po polsku (np. bluza, kurtka, koszulka, buty)",
  "color": "główny kolor po angielsku",
  "details": "dodatkowe szczegóły (np. logo, wzór, model)",
  "search_query": "gotowe zapytanie do wyszukiwarki po angielsku, max 5 słów",
  "search_query_pl": "gotowe zapytanie po polsku, max 5 słów",
  "confidence": "high/medium/low - pewność rozpoznania"
}

Jeśli nie widzisz marki, wpisz null dla brand i stwórz ogólne zapytanie.
Odpowiedz TYLKO JSONem, bez żadnego tekstu przed ani po."""

    response = model.generate_content([prompt, img])
    text = response.text.strip()

    # Wyciągnij JSON z odpowiedzi
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if not match:
        raise ValueError(f"Gemini nie zwrócił JSONa: {text}")

    data = json.loads(match.group())

    brand    = data.get("brand") or ""
    type_en  = data.get("type", "clothing")
    color    = data.get("color", "")
    details  = data.get("details", "")

    # Zbuduj query do Vinted
    query_en = data.get("search_query", f"{brand} {type_en}".strip())
    query_pl = data.get("search_query_pl", query_en)

    # Opis dla użytkownika
    brand_str = f"**{brand}**" if brand else "Nieznana marka"
    opis_pl = (
        f"{brand_str} · {data.get('type_pl', type_en)} · {color}"
        + (f" · {details}" if details else "")
        + f"\n_(pewność: {data.get('confidence', '?')})_"
    )

    return query_pl, opis_pl
