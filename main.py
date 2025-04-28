from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json, datetime

app = FastAPI()

# Activar CORS correctamente
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir todas las fuentes
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True
)

DB_FILE = "database.json"

def load_db():
    with open(DB_FILE, "r") as f:
        return json.load(f)

@app.get("/validar")
def validar_licencia(licencia: str, dispositivo: str):
    db = load_db()
    entry = db.get(licencia)

    if not entry:
        raise HTTPException(status_code=404, detail="Licencia no encontrada")

    if entry["device_id"] != dispositivo:
        raise HTTPException(status_code=403, detail="Licencia no válida para este dispositivo")

    hoy = datetime.datetime.utcnow().date()
    vencimiento = datetime.datetime.strptime(entry["expires"], "%Y-%m-%d").date()

    return { "valid": hoy <= vencimiento }

