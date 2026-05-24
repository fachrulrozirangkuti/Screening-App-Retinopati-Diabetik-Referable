// ============================================================
// BACKEND MAIN SERVER (NODE.JS + EXPRESS) - ENTERPRISE EDITION
// ============================================================

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const winston = require('winston'); // Pustaka Audit Trail

const app = express();
const prisma = new PrismaClient();
const PORT = 5000;
const JWT_SECRET = 'RDR_SECRET_KEY_SKRIPSI_2026'; // Kunci Rahasia JWT

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/datasets', express.static('datasets'));
app.use('/models_ai', express.static('models_ai'));

// ============================================================
// 1. KONFIGURASI AUDIT TRAIL (WINSTON LOGGER)
// ============================================================
const auditLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(info => JSON.stringify({ timestamp: info.timestamp, level: info.level, message: info.message, user: info.user, action: info.action }))
    ),
    transports: [
        new winston.transports.File({ filename: path.join(__dirname, 'logs', 'audit.log') }),
        new winston.transports.Console({ format: winston.format.simple() }) // Tetap tampil di terminal
    ]
});

// Pastikan folder logs tersedia
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

// Fungsi pembantu untuk mencatat jejak
const logAction = (user, action, message) => {
    auditLogger.info({ user: user || 'SYSTEM', action, message });
};

// ============================================================
// 2. MIDDLEWARE KEAMANAN (JWT & RBAC)
// ============================================================
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({ error: "Akses ditolak. Token tidak tersedia." });

    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Token tidak valid atau kedaluwarsa." });
        req.user = decoded; // Berisi id, username, role
        next();
    });
};

const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        logAction(req.user.username, 'UNAUTHORIZED_ACCESS', 'Mencoba mengakses rute khusus Admin');
        return res.status(403).json({ error: "Akses ditolak. Fitur ini khusus Administrator." });
    }
    next();
};

// Konfigurasi Multer
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// ============================================================
// ENDPOINT 1: SKRINING BARU (Dilindungi Token)
// ============================================================
app.post('/api/screening', verifyToken, upload.single('fundus_image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "Citra fundus wajib diunggah." });
        const { kode_pasien, nama_pasien, umur, jenis_kelamin, catatan_dokter } = req.body;

        const patient = await prisma.patient.upsert({
            where: { kode_pasien: kode_pasien },
            update: { nama_pasien, umur: parseInt(umur), jenis_kelamin },
            create: { kode_pasien, nama_pasien, umur: parseInt(umur), jenis_kelamin }
        });

        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path));

        const aiResponse = await axios.post('http://127.0.0.1:8000/api/v1/predict', formData, { headers: formData.getHeaders() });
        // PERUBAHAN: Menangkap heatmap_base64 dari API Python
        const { probability_referable, predicted_class, predicted_label, screening_decision, detected_eye, heatmap_base64 } = aiResponse.data;

        const screening = await prisma.screening.create({
            data: {
                patientId: patient.id, userId: req.user.id, mata: detected_eye, gambar_path: req.file.filename,
                catatan_dokter, predicted_class, predicted_label, probability_referable
            }
        });

        logAction(req.user.username, 'SCREENING_CREATED', `Melakukan skrining untuk pasien ${kode_pasien} dengan hasil ${predicted_label}`);

        // PERUBAHAN: Meneruskan heatmap_base64 ke Frontend
        res.status(201).json({ message: "Berhasil.", data: screening, ai_details: { ...aiResponse.data, heatmap_base64 } });
    } catch (error) {
        logAction(req.user.username, 'SCREENING_ERROR', error.message);
        res.status(500).json({ error: "Gagal memproses AI." });
    }
});

// ============================================================
// ENDPOINT 2 & 3: RIWAYAT & STATISTIK (Dilindungi Token)
// ============================================================
app.get('/api/history', verifyToken, async (req, res) => {
    try {
        const historyData = await prisma.screening.findMany({ orderBy: { createdAt: 'desc' }, include: { patient: true } });
        res.status(200).json(historyData);
    } catch (error) { res.status(500).json({ error: "Gagal menarik data riwayat." }); }
});

// PERUBAHAN: Endpoint Stats Sekarang Mendukung Filter Waktu (startDate & endDate)
app.get('/api/stats', verifyToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let whereClause = {};

        if (startDate && endDate) {
            whereClause.createdAt = {
                gte: new Date(startDate + "T00:00:00.000Z"),
                lte: new Date(endDate + "T23:59:59.999Z")
            };
        }

        const total = await prisma.screening.count({ where: whereClause });
        const referable = await prisma.screening.count({ where: { ...whereClause, predicted_class: 1 } });
        const nonReferable = await prisma.screening.count({ where: { ...whereClause, predicted_class: 0 } });
        const recent = await prisma.screening.findMany({ where: whereClause, take: 5, orderBy: { createdAt: 'desc' }, include: { patient: true } });
        res.status(200).json({ total, referable, nonReferable, recent });
    } catch (error) { res.status(500).json({ error: "Gagal mengambil data statistik." }); }
});

// ============================================================
// FITUR BARU: ENDPOINT PROFIL MANDIRI & BACKUP DATABASE
// ============================================================
// Update Profil Mandiri
app.put('/api/profile', verifyToken, async (req, res) => {
    try {
        const { nama_lengkap, password } = req.body;
        let dataToUpdate = { nama_lengkap };
        if (password && password.trim() !== '') {
            dataToUpdate.password = await bcrypt.hash(password, 10);
        }
        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: dataToUpdate
        });
        logAction(req.user.username, 'UPDATE_PROFILE', 'Memperbarui profil mandiri');
        res.status(200).json({ message: "Profil berhasil diperbarui!", user: { id: updatedUser.id, username: updatedUser.username, nama_lengkap: updatedUser.nama_lengkap, role: updatedUser.role } });
    } catch (error) { res.status(500).json({ error: "Gagal memperbarui profil." }); }
});

// Backup Keseluruhan Database (Hanya Admin)
app.get('/api/backup-database', verifyToken, requireAdmin, async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        const patients = await prisma.patient.findMany();
        const screenings = await prisma.screening.findMany();

        const backupData = {
            exportedAt: new Date().toISOString(),
            systemVersion: "1.0.0-Enterprise",
            data: { users, patients, screenings }
        };

        logAction(req.user.username, 'DATABASE_BACKUP', 'Mengekspor cadangan database sistem');
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=RDR_BACKUP_${Date.now()}.json`);
        res.status(200).send(JSON.stringify(backupData, null, 2));
    } catch (error) { res.status(500).json({ error: "Gagal mengekspor database." }); }
});

// ============================================================
// ENDPOINT 4: AUTENTIKASI (LOGIN DENGAN JWT & BCRYPT)
// ============================================================
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await prisma.user.findUnique({ where: { username } });

        // Cek apakah user ada dan bandingkan password yang di-hash
        if (!user) return res.status(401).json({ error: "Username tidak ditemukan!" });

        // Kompatibilitas mundur: Cek plain text (akun lama) atau bcrypt (akun baru)
        const isPasswordValid = user.password.startsWith('$2b$') ? await bcrypt.compare(password, user.password) : user.password === password;
        if (!isPasswordValid) return res.status(401).json({ error: "Password salah!" });

        // Buat Token Sesi (Berlaku 12 Jam)
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '12h' });

        const { password: _, ...userWithoutPassword } = user;

        logAction(user.username, 'LOGIN_SUCCESS', 'Berhasil masuk ke dalam sistem');
        res.status(200).json({ message: "Login berhasil", token, user: userWithoutPassword });
    } catch (error) { res.status(500).json({ error: "Terjadi kesalahan pada server." }); }
});

// ============================================================
// ENDPOINT KHUSUS ADMIN: MANAJEMEN PETUGAS & AUDIT
// ============================================================
// BACA AUDIT LOGS (KHUSUS ADMIN)
app.get('/api/audit-logs', verifyToken, requireAdmin, (req, res) => {
    try {
        const logPath = path.join(__dirname, 'logs', 'audit.log');
        if (!fs.existsSync(logPath)) return res.status(200).json([]);

        const logs = fs.readFileSync(logPath, 'utf8').trim().split('\n').map(line => JSON.parse(line)).reverse();
        res.status(200).json(logs);
    } catch (error) { res.status(500).json({ error: "Gagal membaca log sistem." }); }
});

// HAPUS RIWAYAT (Khusus Admin)
app.delete('/api/history/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const recordId = isNaN(req.params.id) ? req.params.id : parseInt(req.params.id);
        await prisma.screening.delete({ where: { id: recordId } });
        logAction(req.user.username, 'DELETE_HISTORY', `Menghapus data rekam medis ID: ${recordId}`);
        res.status(200).json({ message: "Data dihapus." });
    } catch (error) { res.status(500).json({ error: "Gagal menghapus data." }); }
});

// MANAJEMEN USER (Tambah/Edit dengan Hashing Password)
app.get('/api/users', verifyToken, requireAdmin, async (req, res) => {
    try {
        const users = await prisma.user.findMany({ select: { id: true, username: true, nama_lengkap: true, role: true } });
        res.status(200).json(users);
    } catch (error) { res.status(500).json({ error: "Gagal mengambil data." }); }
});

app.post('/api/users', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { id, username, password, nama_lengkap, role } = req.body;
        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) return res.status(400).json({ error: "Username sudah dipakai!" });

        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.create({ data: { id, username, password: hashedPassword, nama_lengkap, role: role || 'DOKTER' } });

        logAction(req.user.username, 'CREATE_USER', `Mendaftarkan petugas baru: ${username}`);
        res.status(201).json({ message: "Petugas berhasil didaftarkan!" });
    } catch (error) { res.status(500).json({ error: "Gagal mendaftarkan." }); }
});

app.put('/api/users/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { username, nama_lengkap, role, password } = req.body;
        let dataToUpdate = { username, nama_lengkap, role };

        if (password && password.trim() !== '') {
            dataToUpdate.password = await bcrypt.hash(password, 10);
        }

        await prisma.user.update({ where: { id: req.params.id }, data: dataToUpdate });
        logAction(req.user.username, 'UPDATE_USER', `Memperbarui data petugas ID: ${req.params.id}`);
        res.status(200).json({ message: "Data petugas diperbarui." });
    } catch (error) { res.status(500).json({ error: "Gagal memperbarui." }); }
});

app.delete('/api/users/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        await prisma.user.delete({ where: { id: req.params.id } });
        logAction(req.user.username, 'DELETE_USER', `Menghapus petugas ID: ${req.params.id}`);
        res.status(200).json({ message: "Petugas dihapus." });
    } catch (error) { res.status(500).json({ error: "Gagal menghapus." }); }
});

// ============================================================
// JALUR PENYELAMAT DARURAT (EMERGENCY RESCUE)
// ============================================================
app.get('/api/rescue', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = await prisma.user.upsert({
            where: { username: 'admin_utama' },
            update: { password: hashedPassword, role: 'ADMIN', nama_lengkap: 'Administrator Sistem' },
            create: {
                id: 'ADM-999',
                username: 'admin_utama',
                password: hashedPassword,
                nama_lengkap: 'Administrator Sistem',
                role: 'ADMIN'
            }
        });
        res.status(200).send(`
            <h1>Sistem Berhasil Dipulihkan!</h1>
            <p>Silakan kembali ke halaman Login dan gunakan akses berikut:</p>
            <ul>
                <li>Username: <b>admin_utama</b></li>
                <li>Password: <b>admin123</b></li>
            </ul>
        `);
    } catch (error) {
        res.status(500).send("Gagal memulihkan sistem: " + error.message);
    }
});

// ============================================================
// ENDPOINT 5: MANAJEMEN DATASET & MODEL AI (KHUSUS ADMIN)
// ============================================================

// 1. Buat folder otomatis jika belum ada
const datasetDir = path.join(__dirname, 'datasets');
const modelDir = path.join(__dirname, 'models_ai');
if (!fs.existsSync(datasetDir)) fs.mkdirSync(datasetDir);
if (!fs.existsSync(modelDir)) fs.mkdirSync(modelDir);

// 2. Konfigurasi Multer Khusus Dataset & Model
const storageFile = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'dataset_image') cb(null, 'datasets/');
        else if (file.fieldname === 'model_file') cb(null, 'models_ai/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '_' + file.originalname.replace(/\s+/g, '_'));
    }
});
const uploadFile = multer({ storage: storageFile });

// 3. API Upload Dataset Gambar
app.post('/api/datasets', verifyToken, requireAdmin, uploadFile.single('dataset_image'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "File gambar tidak ditemukan." });
        logAction(req.user.username, 'UPLOAD_DATASET', `Mengunggah citra dataset baru: ${req.file.filename}`);
        res.status(201).json({ message: "Dataset citra berhasil ditambahkan!", filename: req.file.filename });
    } catch (error) { res.status(500).json({ error: "Gagal mengunggah dataset." }); }
});

// 4. API Ambil Daftar Dataset
app.get('/api/datasets', verifyToken, requireAdmin, (req, res) => {
    try {
        const files = fs.readdirSync(datasetDir).map(file => {
            const stats = fs.statSync(path.join(datasetDir, file));
            return { name: file, size: (stats.size / 1024).toFixed(2) + ' KB', date: stats.birthtime };
        }).sort((a, b) => b.date - a.date);
        res.status(200).json(files);
    } catch (error) { res.status(500).json({ error: "Gagal membaca dataset." }); }
});

// 5. API Upload Model AI (.h5 / .keras)
app.post('/api/models', verifyToken, requireAdmin, uploadFile.single('model_file'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "File model tidak ditemukan." });
        logAction(req.user.username, 'UPLOAD_MODEL', `Mengunggah model AI baru: ${req.file.filename}`);
        res.status(201).json({ message: "Model AI berhasil diunggah ke repositori!", filename: req.file.filename });
    } catch (error) { res.status(500).json({ error: "Gagal mengunggah model." }); }
});

// 6. API Ambil Daftar Model AI
app.get('/api/models', verifyToken, requireAdmin, (req, res) => {
    try {
        const files = fs.readdirSync(modelDir).map(file => {
            const stats = fs.statSync(path.join(modelDir, file));
            return { name: file, size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB', date: stats.birthtime };
        }).sort((a, b) => b.date - a.date);
        res.status(200).json(files);
    } catch (error) { res.status(500).json({ error: "Gagal membaca repositori model." }); }
});

// 7. API Hapus Dataset Gambar
app.delete('/api/datasets/:filename', verifyToken, requireAdmin, (req, res) => {
    try {
        const filePath = path.join(datasetDir, req.params.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); // Menghapus file secara fisik dari hardisk
            logAction(req.user.username, 'DELETE_DATASET', `Menghapus dataset citra: ${req.params.filename}`);
            res.status(200).json({ message: "Dataset berhasil dihapus." });
        } else {
            res.status(404).json({ error: "File tidak ditemukan." });
        }
    } catch (error) { res.status(500).json({ error: "Gagal menghapus dataset." }); }
});

// 8. API Hapus Model AI
app.delete('/api/models/:filename', verifyToken, requireAdmin, (req, res) => {
    try {
        const filePath = path.join(modelDir, req.params.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            logAction(req.user.username, 'DELETE_MODEL', `Menghapus model AI: ${req.params.filename}`);
            res.status(200).json({ message: "Model berhasil dihapus." });
        } else {
            res.status(404).json({ error: "File tidak ditemukan." });
        }
    } catch (error) { res.status(500).json({ error: "Gagal menghapus model." }); }
});

app.listen(PORT, () => {
    console.log(`✅ Backend Node.js Enterprise Service menyala di http://localhost:${PORT}`);
});