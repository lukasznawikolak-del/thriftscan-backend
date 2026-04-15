import requests
import time

HEADERS = {
    "User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept":          "application/json, text/plain, */*",
    "Accept-Language": "pl-PL,pl;q=0.9",
    "Referer":         "https://www.vinted.pl/",
}

def search_vinted(query: str, max_price: int = 2000, per_page: int = 20) -> list:
    session = requests.Session()

    # Inicjuj sesję (potrzebne do cookies)
    try:
        session.get("https://www.vinted.pl/", headers=HEADERS, timeout=10)
    except Exception:
        pass

    url = "https://www.vinted.pl/api/v2/catalog/items"
    params = {
        "search_text": query,
        "price_to":    max_price,
        "order":       "relevance",
        "per_page":    per_page,
    }

    try:
        resp = session.get(url, headers=HEADERS, params=params, timeout=15)
        if resp.status_code != 200:
            print(f"Vinted error: {resp.status_code}")
            return []

        items = resp.json().get("items", [])
        results = []

        for item in items:
            try:
                # Cena
                price_data = item.get("price", {})
                if isinstance(price_data, dict):
                    price = float(price_data.get("amount", 0))
                else:
                    price = float(price_data or 0)

                # Zdjęcie
                photos = item.get("photos", [])
                photo_url = None
                if photos:
                    photo_url = (
                        photos[0].get("url") or
                        photos[0].get("full_size_url") or
                        photos[0].get("thumb_url")
                    )

                item_id = str(item.get("id", ""))
                results.append({
                    "id":       item_id,
                    "title":    item.get("title", "Brak tytułu"),
                    "price":    price,
                    "size":     item.get("size_title", ""),
                    "brand":    item.get("brand_title", ""),
                    "url":      f"https://www.vinted.pl/items/{item_id}",
                    "photo":    photo_url,
                    "source":   "vinted",
                    "currency": "PLN",
                })
            except Exception as e:
                print(f"  Błąd przy ofercie: {e}")
                continue

        return results

    except Exception as e:
        print(f"Vinted scraper error: {e}")
        return []
