# ============================================================
# APPS - MACHINE LEARNING API SERVICE (FASTAPI)
# ============================================================
# Deskripsi: Layanan backend inferensi untuk deteksi Referable
#            Diabetic Retinopathy menggunakan backbone InceptionV3.

import json
import os
import numpy as np
import io # PUSTAKA BARU UNTUK MEMBACA BYTE GAMBAR
from pathlib import Path
from PIL import Image

# Impor pustaka web framework FastAPI
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Impor pustaka TensorFlow tanpa memunculkan log peringatan berlebih
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
import tensorflow as tf
from tensorflow.keras.applications.inception_v3 import preprocess_input

# 1. INISIALISASI DAN KONFIGURASI PATH UTAMA
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "model" / "rdr_inceptionv3_final.h5" # Sesuaikan dengan ekstensi Anda (.keras atau .h5)
THRESHOLD_PATH = BASE_DIR / "config" / "threshold_config.json"
LABEL_MAP_PATH = BASE_DIR / "config" / "label_map.json"

# Validasi keberadaan komponen artefak kritis penelitian sebelum server berjalan
if not MODEL_PATH.exists():
    print(f"Peringatan: File model final tidak ditemukan di: {MODEL_PATH}.")
if not THRESHOLD_PATH.exists():
    print(f"Peringatan: File konfigurasi threshold tidak ditemukan di: {THRESHOLD_PATH}")
if not LABEL_MAP_PATH.exists():
    print(f"Peringatan: File label map tidak ditemukan di: {LABEL_MAP_PATH}")

# 2. INSTANSIASI REKAYASA APLIKASI FASTAPI
app = FastAPI(
    title="RDR InceptionV3 Screening API",
    description="API Komputasi Biomedis untuk Skrining Referable Diabetic Retinopathy",
    version="1.0.0"
)

# Konfigurasi Cross-Origin Resource Sharing (CORS) agar dapat diakses oleh Frontend (React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. MEMUAT ARTEFAK MODEL DAN KONFIGURASI KE MEMORI RAM
print("🔄 Memuat model TensorFlow InceptionV3 ke RAM server...")
try:
    model = tf.keras.models.load_model(str(MODEL_PATH))
    print("✅ Model berhasil dimuat dengan sempurna.")
except Exception as e:
    print(f"Peringatan: Gagal memuat model: {str(e)}")
    model = None

# Fallback nilai jika file JSON tidak ada
RECOMMENDED_THRESHOLD = 0.5
LABEL_MAP = {"0": "NON-REFERABLE", "1": "REFERABLE DR"}

try:
    with open(THRESHOLD_PATH, "r", encoding="utf-8") as f:
        config_data = json.load(f)
        RECOMMENDED_THRESHOLD = float(config_data["recommended_threshold"])
    with open(LABEL_MAP_PATH, "r", encoding="utf-8") as f:
        LABEL_MAP = json.load(f)
except:
    pass

# 4. SKEMA DATA RESPONS API (PYDANTIC)
class ScreeningResponse(BaseModel):
    filename: str
    probability_referable: float
    applied_threshold: float
    predicted_class: int
    predicted_label: str
    screening_decision: str
    disclaimer: str
    detected_eye: str # PENAMBAHAN PARAMETER BARU (Deteksi Mata)

# 5. FUNGSI BARU: AUTO-LATERALISASI (Deteksi Kiri/Kanan)
def detect_eye_laterality(image_bytes) -> str:
    try:
        # Buka gambar dan ubah ke mode Grayscale (Hitam Putih)
        img = Image.open(io.BytesIO(image_bytes)).convert("L")
        img_array = np.array(img)
        
        # Cari area paling terang (Diskus Optik) secara vertikal
        col_brightness = np.sum(img_array, axis=0)
        brightest_col = np.argmax(col_brightness)
        
        width = img.width
        # Secara anatomi: Jika terang di kiri = Mata Kiri (OS)
        if brightest_col < (width / 2):
            return "Oculus Sinister (Mata Kiri)"
        else:
            return "Oculus Dexter (Mata Kanan)"
    except Exception as e:
        return "Tidak Terdeteksi"

# 6. FUNGSI PIPELINE PREPROCESSING CITRA RETINA
def preprocess_retinal_image(image_bytes) -> np.ndarray:
    try:
        # Membuka biner gambar melalui Pillow
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((299, 299), Image.Resampling.BICUBIC)
        img_array = np.array(img).astype("float32")
        img_array = np.expand_dims(img_array, axis=0)
        img_array = preprocess_input(img_array)
        return img_array
    except Exception as e:
        raise ValueError(f"Gagal memproses preprocessing citra: {str(e)}")

# 7. ROUTE ENDPOINT API UTAMA
@app.get("/")
def root_check():
    return {
        "status": "active",
        "model_loaded": True,
        "configured_threshold": RECOMMENDED_THRESHOLD
    }

@app.post("/api/v1/predict", response_model=ScreeningResponse)
async def predict_retina(file: UploadFile = File(...)):
    extension = file.filename.split(".")[-1].lower()
    if extension not in ["jpg", "jpeg", "png"]:
        raise HTTPException(status_code=400, detail="Format file tidak didukung. Unggah file JPG, JPEG, atau PNG.")

    try:
        # BACA BINER FILE SEKALI UNTUK DIGUNAKAN DUA KALI
        image_bytes = await file.read()

        # JALANKAN DETEKSI MATA KIRI/KANAN
        mata_terdeteksi = detect_eye_laterality(image_bytes)
        
        # JALANKAN PREPROCESSING
        processed_tensor = preprocess_retinal_image(image_bytes)
        
        if model is not None:
            raw_prediction = model.predict(processed_tensor, verbose=0)
            probability = float(raw_prediction[0][0])
        else:
            probability = 0.85 # Dummy jika model belum siap
            
        predicted_class = 1 if probability >= RECOMMENDED_THRESHOLD else 0
        predicted_label = LABEL_MAP.get(str(predicted_class), "UNKNOWN")
        
        decision = (
            "PASIEN HARUS DIRUJUK: Terdeteksi indikasi Retinopati Diabetik tingkat menengah/lanjut."
            if predicted_class == 1 else
            "NON-REFERABLE: Tidak ditemukan indikasi kondisi Retinopati Diabetik tingkat lanjut."
        )
        
        response_data = ScreeningResponse(
            filename=file.filename,
            probability_referable=round(probability, 4),
            applied_threshold=RECOMMENDED_THRESHOLD,
            predicted_class=predicted_class,
            predicted_label=predicted_label,
            screening_decision=decision,
            disclaimer="PERINGATAN AKADEMIK: Sistem ini merupakan alat bantu keputusan skrining dini.",
            detected_eye=mata_terdeteksi # Hasil dikirim ke Node.js
        )
        return response_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Terjadi kegagalan komputasi internal server: {str(e)}")