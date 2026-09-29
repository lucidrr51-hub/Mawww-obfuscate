const { encryptStrings } = require('./stringEncrypt');
const { applyControlFlowFlattening } = require('./controlFlow');
const { injectAntiDebug } = require('./antiDebug');

// ==================== UTILITAS ====================

function generateRandomName(length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '_';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function generateHexString(length = 16) {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += Math.floor(Math.random() * 16).toString(16);
    }
    return result;
}

// ==================== LAPIS 1: VARIABLE RENAMING ====================

function renameVariables(code) {
    // Daftar kata kunci Lua yang tidak boleh di-rename
    const keywords = new Set([
        'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for',
        'function', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat',
        'return', 'then', 'true', 'until', 'while', 'goto',
        // Global functions yang umum
        'print', 'pairs', 'ipairs', 'type', 'tostring', 'tonumber',
        'string', 'table', 'math', 'os', 'io', 'coroutine', 'debug',
        'loadstring', 'load', 'require', 'setmetatable', 'getmetatable',
        'rawget', 'rawset', 'rawequal', 'rawlen', 'select', 'next',
        'pcall', 'xpcall', 'error', 'assert', 'unpack', 'collectgarbage',
        'game', 'workspace', 'script', 'Instance', 'Vector3', 'CFrame',
        'Color3', 'UDim2', 'Enum', 'wait', 'spawn', 'delay', 'tick',
        'warn', 'typeof', 'task', 'shared', 'getgenv', 'getfenv', 'setfenv',
        'hookfunction', 'newcclosure', 'checkcaller', 'islclosure', 'getrawmetatable',
        'setreadonly', 'isreadonly', 'getnamecallmethod', 'firetouchinterest'
    ]);

    // Pola untuk mendeteksi identifier
    // Kita hanya me-rename variabel local dan parameter fungsi
    let counter = 0;
    const nameMap = new Map();

    // Ganti semua identifier yang bukan keyword dan bukan global
    // Ini adalah pendekatan regex-based sederhana; untuk produksi sebaiknya gunakan AST parser
    const identifierRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;

    let result = code.replace(identifierRegex, (match, identifier) => {
        // Jangan rename keyword atau global
        if (keywords.has(identifier)) return match;

        // Jangan rename jika diawali dengan __ (internal)
        if (identifier.startsWith('__')) return match;

        // Jangan rename jika huruf kapital di awal (kemungkinan kelas/Instance)
        if (/^[A-Z]/.test(identifier)) return match;

        // Jangan rename jika diikuti oleh tanda titik (method call)
        // Ini dicek di sekitar match

        if (!nameMap.has(identifier)) {
            nameMap.set(identifier, generateRandomName(10));
        }

        return nameMap.get(identifier);
    });

    return result;
}

// ==================== LAPIS 3: NUMERIC CONSTANT OBFUSCATION ====================

function obfuscateNumbers(code) {
    // Ganti angka dengan ekspresi matematika
    // Contoh: 42 -> (21 * 2) atau (100 - 58)
    // Menggunakan regex untuk angka yang bukan bagian dari identifier atau string
    // Ini pendekatan sederhana; AST-based lebih baik untuk produksi

    const lines = code.split('\n');
    const processedLines = lines.map(line => {
        // Lewati baris yang mengandung string literal (untuk menghindari merusak string)
        // Deteksi sederhana: jika baris memiliki quote, kita lebih hati-hati
        let hasString = /["']/.test(line);

        return line.replace(/\b(\d+)\b/g, (match, numStr) => {
            const num = parseInt(numStr);
            if (num === 0 || num === 1 || num === -1) return match; // Biarkan angka sederhana
            if (hasString && Math.random() > 0.3) return match; // Kurangi risiko merusak string

            // Buat ekspresi acak yang menghasilkan num
            const a = Math.floor(Math.random() * num) + 1;
            const b = num - a;

            if (Math.random() > 0.5) {
                return `(${a}+${b})`;
            } else {
                const c = num + Math.floor(Math.random() * 100) + 1;
                const d = c - num;
                return `(${c}-${d})`;
            }
        });
    });

    return processedLines.join('\n');
}

// ==================== LAPIS 5: DEAD CODE INJECTION ====================

function injectDeadCode(code) {
    const deadCodeSnippets = [
        `local ${generateRandomName(12)} = ${Math.floor(Math.random() * 1000)}; if ${generateRandomName(12)} > 999999 then ${generateRandomName(8)}() end;`,
        `do local ${generateRandomName(10)} = "${generateHexString(8)}"; local ${generateRandomName(10)} = #${generateRandomName(10)}; end;`,
        `local ${generateRandomName(8)} = {${generateRandomName(6)}, ${generateRandomName(6)}, ${generateRandomName(6)}}; for _,_ in pairs(${generateRandomName(8)}) do end;`,
        `if false then local ${generateRandomName(8)} = ${generateRandomName(6)} or ${generateRandomName(6)}; end;`,
        `local ${generateRandomName(10)} = function() return ${generateRandomName(6)} end;`
    ];

    const lines = code.split('\n');
    const result = [];

    for (let i = 0; i < lines.length; i++) {
        result.push(lines[i]);
        // Sisipkan dead code secara acak setiap beberapa baris
        if (Math.random() < 0.15 && i < lines.length - 1) {
            const snippet = deadCodeSnippets[Math.floor(Math.random() * deadCodeSnippets.length)];
            result.push('-- ' + generateHexString(8) + '\n' + snippet);
        }
    }

    return result.join('\n');
}

// ==================== LAPIS 7: VM WRAPPER ====================

function wrapInVM(code) {
    const runtimeName = generateRandomName(12);
    const loadName = generateRandomName(10);
    const decryptName = generateRandomName(10);
    const keyName = generateRandomName(8);

    // Encode kode sebagai array byte untuk menghindari deteksi string
    const encoded = Buffer.from(code, 'utf-8').toString('base64');

    // Runtime dekripsi + loadstring
    const wrapper = `
local ${keyName} = "${generateHexString(16)}"

local function ${decryptName}(data, key)
    local result = {}
    local keyLen = #key
    for i = 1, #data do
        local char = data:sub(i, i)
        local keyChar = key:sub((i - 1) % keyLen + 1, (i - 1) % keyLen + 1)
        result[i] = string.char(bit32.bxor(string.byte(char), string.byte(keyChar)))
    end
    return table.concat(result)
end

local ${runtimeName} = (function()
    local encoded = "${encoded}"
    -- Decode base64
    local decoded = encoded:gsub("[^A-Za-z0-9+/=]", "")
    local b = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    local result = {}
    local buffer = 0
    local bits = 0
    for i = 1, #decoded do
        local char = decoded:sub(i, i)
        if char ~= '=' then
            local value = b:find(char, 1, true) - 1
            buffer = buffer * 64 + value
            bits = bits + 6
            if bits >= 8 then
                bits = bits - 8
                table.insert(result, string.char(math.floor(buffer / 2^bits) % 256))
            end
        end
    end
    return table.concat(result)
end)()

local ${loadName} = loadstring or load
return ${loadName}(${runtimeName})()
`.trim();

    return wrapper;
}

// ==================== FUNGSI UTAMA ====================

async function fullObfuscate(luaCode, options = {}) {
    const config = {
        renameVars: options.renameVars !== false,
        encryptStrings: options.encryptStrings !== false,
        obfuscateNumbers: options.obfuscateNumbers !== false,
        controlFlow: options.controlFlow !== false,
        deadCode: options.deadCode !== false,
        antiDebug: options.antiDebug !== false,
        vmWrapper: options.vmWrapper !== false,
        watermark: options.watermark || 'Protected by Mawww Obfuscator'
    };

    let result = luaCode;

    // Lapis 1: Rename Variables
    if (config.renameVars) {
        result = renameVariables(result);
    }

    // Lapis 2: String Encryption
    if (config.encryptStrings) {
        result = encryptStrings(result);
    }

    // Lapis 3: Numeric Obfuscation
    if (config.obfuscateNumbers) {
        result = obfuscateNumbers(result);
    }

    // Lapis 4: Control Flow Flattening
    if (config.controlFlow) {
        result = applyControlFlowFlattening(result);
    }

    // Lapis 5: Dead Code Injection
    if (config.deadCode) {
        result = injectDeadCode(result);
    }

    // Lapis 6: Anti-Debugging
    if (config.antiDebug) {
        result = injectAntiDebug(result);
    }

    // Tambahkan watermark sebagai komentar
    result = `-- ${config.watermark}\n-- Build: ${generateHexString(32)}\n` + result;

    // Lapis 7: VM Wrapper
    if (config.vmWrapper) {
        result = wrapInVM(result);
    }

    return result;
}

module.exports = { fullObfuscate };
