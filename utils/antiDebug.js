function generateRandomName(length = 10) {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let result = '_';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function injectAntiDebug(code) {
    const debugCheckName = generateRandomName(12);
    const timeCheckName = generateRandomName(12);
    const stackCheckName = generateRandomName(12);

    const antiDebugRuntime = `
-- Anti-Debugging Layer
local function ${debugCheckName}()
    if debug and debug.getinfo then
        local info = debug.getinfo(1, "S")
        if info and info.what == "C" then
            return true -- Terdeteksi dipanggil dari C (kemungkinan debugger)
        end
    end
    return false
end

local function ${timeCheckName}(func)
    local start = os.clock()
    local result = func()
    local elapsed = os.clock() - start
    if elapsed > 10 then -- Jika eksekusi lebih dari 10 detik, kemungkinan ada debugging
        error("Execution timeout")
    end
    return result
end

local function ${stackCheckName}()
    local depth = 0
    local function count()
        depth = depth + 1
        if depth > 100 then return end
        local info = debug and debug.getinfo and debug.getinfo(depth + 2, "S")
        if info then count() end
    end
    count()
    return depth
end

-- Jalankan pemeriksaan
if ${debugCheckName}() then
    return -- Hentikan eksekusi jika terdeteksi debugger
end

if ${stackCheckName}() > 50 then
    return -- Stack terlalu dalam, kemungkinan hook
end
`.trim();

    return antiDebugRuntime + '\n' + code;
}

module.exports = { injectAntiDebug };
