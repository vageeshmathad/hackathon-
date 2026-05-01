from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import os
import numpy as np

app = FastAPI(title="Flood Prediction API")

# Allow CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directory for plots
import shutil
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)

# Fix for flattened GitHub structure: copy images from root to static folder
for img in ["flood_distribution.png", "place_vs_flood.png", "correlation_heatmap.png"]:
    src_path = os.path.join(os.path.dirname(__file__), img)
    dst_path = os.path.join(static_dir, img)
    if os.path.exists(src_path) and not os.path.exists(dst_path):
        shutil.copy(src_path, dst_path)

app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Robust model loading path to handle different GitHub upload structures
base_dir = os.path.dirname(__file__)
parent_dir = os.path.dirname(base_dir)

# Check all possible locations depending on how GitHub was structured
MODEL_PATH = os.path.join(parent_dir, "model", "flood_model.pkl")
if not os.path.exists(MODEL_PATH):
    MODEL_PATH = os.path.join(base_dir, "model", "flood_model.pkl")
    if not os.path.exists(MODEL_PATH):
        MODEL_PATH = os.path.join(base_dir, "flood_model.pkl")

ENCODER_PATH = os.path.join(parent_dir, "model", "label_encoder.pkl")
if not os.path.exists(ENCODER_PATH):
    ENCODER_PATH = os.path.join(base_dir, "model", "label_encoder.pkl")
    if not os.path.exists(ENCODER_PATH):
        ENCODER_PATH = os.path.join(base_dir, "label_encoder.pkl")

# We use exception handling in case the files are missing
try:
    model = joblib.load(MODEL_PATH)
    encoder = joblib.load(ENCODER_PATH)
except Exception as e:
    print(f"Warning: Model or Encoder could not be loaded. Ensure train.py has been run. Error: {e}")
    model, encoder = None, None

from pydantic import BaseModel, Field

class PredictionRequest(BaseModel):
    place: str = Field(..., min_length=1, description="Region name or coordinates")
    monsoonintensity: float = Field(..., ge=0.0, le=1.0, description="Intensity of monsoon (0.0 to 1.0)")
    urbanization: float = Field(..., ge=0.0, le=1.0, description="Level of urbanization (0.0 to 1.0)")
    topographydrainage: float = Field(..., ge=0.0, le=1.0, description="Topography drainage factor (0.0 to 1.0)")

@app.post("/predict")
def predict(req: PredictionRequest):
    if not model or not encoder:
        return {"error": "Model not loaded on the server."}
        
    # Machine Learning Integration: Graceful fallback for custom/unseen regions
    # If the user clicks a random spot on the map or enters a new city, the LabelEncoder will fail.
    # We catch the error and default the categorical feature to a neutral value (0).
    # This ensures the model still predicts heavily based on the numerical factors (monsoon, etc).
    try:
        place_encoded = encoder.transform([req.place.upper()])[0]
    except Exception as e:
        print(f"Unseen region detected: {req.place}. Defaulting to baseline geographical encoding.")
        place_encoded = 0
    
    features = [[place_encoded, req.monsoonintensity, req.urbanization, req.topographydrainage]]
    prediction = model.predict(features)[0]
    probability = model.predict_proba(features)[0][1]
    
    return {
        "prediction": int(prediction),
        "flood_probability": float(probability),
        "status": "Flood Risk High ⚠️" if prediction == 1 else "Low Flood Risk ✅",
        "region_processed": req.place
    }

@app.get("/")
def read_root():
    return {"message": "Flood Prediction API is running!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
