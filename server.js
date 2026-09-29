const express = require('express');
const multer = require('multer');
const path = require('path');
const { fullObfuscate } = require('./utils/obfuscator');

const app = express();
const port = process.env.PORT || 3000;

const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Max 5MB
});

app.use(express.static('public'));
app.use(express.json({ limit: '10mb' }));

app.post('/obfuscate', upload.single('luaFile'), async (req, res) => {
    try {
        let luaCode = '';
        let options = {};

        if (req.file) {
            luaCode = req.file.buffer.toString('utf-8');
        } else if (req.body.luaCode) {
            luaCode = req.body.luaCode;
        } else {
            return res.status(400).json({ error: 'Tidak ada kode Lua yang diberikan.' });
        }

        if (!luaCode.trim()) {
            return res.status(400).json({ error: 'Kode Lua kosong.' });
        }

        // Parse opsi konfigurasi
        if (req.body.options) {
            try { options = JSON.parse(req.body.options); } catch(e) {}
        }

        const obfuscatedCode = await fullObfuscate(luaCode, options);

        res.setHeader('Content-Disposition', 'attachment; filename="protected.lua"');
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.send(obfuscatedCode);

    } catch (error) {
        console.error('Obfuscation error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan: ' + error.message });
    }
});

app.listen(port, () => {
    console.log(`Mawww Obfuscator berjalan di port ${port}`);
});
