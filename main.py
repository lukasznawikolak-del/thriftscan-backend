from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil, uuid, os
from ai import describe_image
from search import search_vinted

app = FastAPI(title="ThriftScan API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("temp", exist_ok=True)

@app.get("/")
def root():
    return {"status": "ThriftScan API działa!"}

@app.post("/scan")
async def scan(file: UploadFile = File(...)):
    # Zapisz zdjęcie tymczasowo
    file_id = str(uuid.uuid4()) + ".jpg"
    file_path = f"temp/{file_id}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 1. AI rozpoznaje co jest na zdjęciu
        query, opis_pl = describe_image(file_path)

        # 2. Szukaj na Vinted
        wyniki = search_vinted(query)

        # 3. Oblicz statystyki cen
        ceny = [w["price"] for w in wyniki if w["price"] > 0]
        stats = {}
        if ceny:
            stats = {
                "min": round(min(ceny), 2),
                "max": round(max(ceny), 2),
                "avg": round(sum(ceny) / len(ceny), 2),
                "count": len(ceny)
            }

        return {
            "query": query,
            "opis": opis_pl,
            "stats": stats,
            "results": wyniki
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if os.path.exists(file_path):
            os.remove(file_path)
