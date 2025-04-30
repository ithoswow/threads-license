from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json, datetime

app = FastAPI()

# Habilitar CORS para cualquier origen
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = "database.json"

def load_db():
    with open(DB_FILE, "r") as f:
        return json.load(f)

@app.get("/validar")
def validar_licencia(licencia: str):
    db = load_db()
    entry = db.get(licencia)

    if not entry:
        raise HTTPException(status_code=404, detail="Licencia no encontrada")

    hoy = datetime.datetime.utcnow().date()
    vencimiento = datetime.datetime.strptime(entry["expires"], "%Y-%m-%d").date()

    return { "valid": hoy <= vencimiento }
