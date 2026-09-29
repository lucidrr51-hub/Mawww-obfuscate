// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
    });
});

// File drop
const fileDrop = document.getElementById('fileDrop');
const luaFile = document.getElementById('luaFile');
const fileName = document.getElementById('fileName');

fileDrop.addEventListener('click', () => luaFile.click());
fileDrop.addEventListener('dragover', (e) => { e.preventDefault(); fileDrop.classList.add('dragover'); });
fileDrop.addEventListener('dragleave', () => fileDrop.classList.remove('dragover'));
fileDrop.addEventListener('drop', (e) => {
    e.preventDefault();
    fileDrop.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
        luaFile.files = e.dataTransfer.files;
        fileName.textContent = e.dataTransfer.files[0].name;
    }
});
luaFile.addEventListener('change', () => {
    if (luaFile.files.length) fileName.textContent = luaFile.files[0].name;
});

// Obfuscate
document.getElementById('obfuscateBtn').addEventListener('click', async () => {
    const luaCode = document.getElementById('luaCode').value.trim();
    const file = luaFile.files[0];
    const statusDiv = document.getElementById('status');
    const btn = document.getElementById('obfuscateBtn');

    if (!luaCode && !file) {
        statusDiv.textContent = '⚠️ Harap masukkan kode atau pilih file.';
        statusDiv.className = 'status error';
        return;
    }

    const options = {
        renameVars: document.getElementById('optRename').checked,
        encryptStrings: document.getElementById('optStrings').checked,
        obfuscateNumbers: document.getElementById('optNumbers').checked,
        controlFlow: document.getElementById('optControlFlow').checked,
        deadCode: document.getElementById('optDeadCode').checked,
        antiDebug: document.getElementById('optAntiDebug').checked,
        vmWrapper: document.getElementById('optVM').checked
    };

    const formData = new FormData();
    if (file) {
        formData.append('luaFile', file);
    } else {
        formData.append('luaCode', luaCode);
    }
    formData.append('options', JSON.stringify(options));

    btn.disabled = true;
    statusDiv.textContent = '🔄 Sedang memproses...';
    statusDiv.className = 'status loading';

    try {
        const response = await fetch('/obfuscate', { method: 'POST', body: formData });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Gagal memproses');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'protected.lua';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        statusDiv.textContent = '✅ Berhasil! File protected.lua sedang diunduh.';
        statusDiv.className = 'status success';

    } catch (error) {
        statusDiv.textContent = '❌ Error: ' + error.message;
        statusDiv.className = 'status error';
    } finally {
        btn.disabled = false;
    }
});
