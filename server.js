const express = require('express');
const multer = require('multer');
const path = require('path');
const { obfuscateLua } = require('./utils/obfuscator'); // Kita akan buat ini nanti

const app = express();
const port = process.env.PORT || 3000;

// Konfigurasi penyimpanan file sementara
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Sajikan file statis dari folder 'public'
app.use(express.static('public'));

// Endpoint untuk memproses obfuscation
app.post('/obfuscate', upload.single('luaFile'), async (req, res) => {
    try {
        let luaCode = '';

        // Cek apakah ada file yang diupload
        if (req.file) {
            luaCode = req.file.buffer.toString('utf-8');
        } 
        // Jika tidak ada file, cek apakah ada teks yang dikirim
        else if (req.body.luaCode) {
            luaCode = req.body.luaCode;
        } else {
            return res.status(400).json({ error: 'Tidak ada kode Lua yang diberikan.' });
        }

        if (!luaCode.trim()) {
            return res.status(400).json({ error: 'Kode Lua kosong.' });
        }

        // Panggil fungsi obfuscation
        const obfuscatedCode = await obfuscateLua(luaCode);

        // Kirim hasil kembali sebagai file .lua
        res.setHeader('Content-Disposition', 'attachment; filename="obfuscated.lua"');
        res.setHeader('Content-Type', 'text/plain');
        res.send(obfuscatedCode);

    } catch (error) {
        console.error('Obfuscation error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan saat mengobfuscate kode.' });
    }
});

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
