function generateRandomName(length = 10) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '_';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function xorEncrypt(str, key) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
        result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
}

function encryptStrings(code) {
    // Enkripsi semua string literal dan inject decryptor runtime
    const decryptorName = generateRandomName(12);
    const keyName = generateRandomName(8);
    const key = Array.from({length: 16}, () => 
        Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join('');

    // Cari semua string literal (single quote dan double quote)
    // Pendekatan regex sederhana - untuk produksi gunakan AST parser
    let stringIndex = 0;
    const encryptedStrings = [];

    // Ganti string literal dengan panggilan decryptor
    let result = code.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, (match) => {
        // Jangan enkripsi string yang sangat pendek atau yang berisi pola khusus
        const content = match.slice(1, -1);
        if (content.length < 2) return match;
        if (content.includes('\\n') || content.includes('\\t')) return match; // Hindari escape sequences kompleks

        const encrypted = xorEncrypt(content, key);
        const encryptedHex = Buffer.from(encrypted, 'binary').toString('hex');
        const varName = `__str_${stringIndex++}`;
        encryptedStrings.push(`local ${varName} = "${encryptedHex}"`);
        return `${decryptorName}("${encryptedHex}")`;
    });

    if (encryptedStrings.length === 0) return code;

    // Inject decryptor runtime di awal
    const decryptorRuntime = `
-- Runtime String Decryptor
local ${keyName} = "${key}"
local function ${decryptorName}(hex)
    local str = ""
    for i = 1, #hex, 2 do
        str = str .. string.char(tonumber(hex:sub(i, i+1), 16))
    end
    local result = {}
    for i = 1, #str do
        result[i] = string.char(bit32.bxor(string.byte(str, i), string.byte(${keyName}, (i - 1) % #${keyName} + 1)))
    end
    return table.concat(result)
end
`.trim();

    return decryptorRuntime + '\n' + result;
}

module.exports = { encryptStrings };
