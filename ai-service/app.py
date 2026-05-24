import os
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import load_img, img_to_array

app = Flask(__name__)
CORS(app) # Mengizinkan akses dari Node.js

# 1. KONFIGURASI MODEL
# Ganti nama file ini dengan nama file model .h5 asli Anda nanti
MODEL_PATH = 'rdr_inceptionv3_final.h5'
TARGET_SIZE = (299, 299) # Resolusi wajib Inception-V3 sesuai skripsi

# Coba muat model ke dalam memori RAM
try:
    model = load_model(MODEL_PATH)
    print("✅ Model Inception-V3 berhasil dimuat!")
except Exception as e:
    print(f"⚠️ Peringatan: Model {MODEL_PATH} tidak ditemukan. Berjalan dalam Mode Simulasi.")
    model = None

# 2. ENDPOINT PREDIKSI
@app.route('/predict', methods=['POST'])
def predict_image():
    if 'image' not in request.files:
        return jsonify({'error': 'Tidak ada gambar yang dikirim'}), 400
        
    file = request.files['image']
    
    try:
        # Baca citra fundus yang diunggah
        img = load_img(file, target_size=TARGET_SIZE)
        img_array = img_to_array(img)
        
        # Pra-pemrosesan: Normalisasi piksel dari [0, 255] menjadi [0, 1] sesuai metode skripsi
        img_array = img_array / 255.0 
        
        # Tambahkan dimensi batch: dari (299, 299, 3) menjadi (1, 299, 299, 3)
        img_array = np.expand_dims(img_array, axis=0)
        
        # 3. PROSES INFERENSI (PREDIKSI)
        if model is not None:
            # Eksekusi model asli
            prediction = model.predict(img_array)
            probability = float(prediction[0][0])
        else:
            # Mode Simulasi (Jika file .h5 belum dimasukkan)
            # Menghasilkan probabilitas acak untuk keperluan testing sistem
            probability = float(np.random.uniform(0.1, 0.99))
            
        # Penentuan Threshold Klasifikasi Biner (Batas kritis 0.5 atau 50%)
        # 1 = Referable (Moderate/Severe/Proliferative), 0 = Non-Referable (Normal/Mild)
        predicted_class = 1 if probability > 0.5 else 0
        predicted_label = "REFERABLE DR" if predicted_class == 1 else "NON-REFERABLE DR"
        
        return jsonify({
            'status': 'success',
            'probability_referable': probability,
            'predicted_class': predicted_class,
            'predicted_label': predicted_label
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Menjalankan server AI di port 8000
    app.run(host='0.0.0.0', port=8000, debug=True)