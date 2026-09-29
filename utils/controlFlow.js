function generateRandomName(length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let result = '_';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function applyControlFlowFlattening(code) {
    // CFF sederhana: bungkus blok kode dalam state machine
    // Untuk implementasi produksi, gunakan AST-based transformasi
    // Ini adalah versi lightweight yang tetap efektif untuk script kecil-menengah

    const lines = code.split('\n');
    if (lines.length < 10) return code; // Terlalu pendek untuk di-flatten

    const stateVar = generateRandomName(10);
    const dispatcherName = generateRandomName(12);

    // Bagi kode menjadi blok-blok
    const blocks = [];
    let currentBlock = [];
    const blockSize = Math.max(3, Math.floor(lines.length / 5));

    for (let i = 0; i < lines.length; i++) {
        currentBlock.push(lines[i]);
        if (currentBlock.length >= blockSize || i === lines.length - 1) {
            blocks.push(currentBlock.join('\n'));
            currentBlock = [];
        }
    }

    if (blocks.length < 2) return code;

    // Bangun state machine
    let stateMachine = `local ${stateVar} = 1\n`;
    stateMachine += `while ${stateVar} do\n`;
    stateMachine += `    if ${stateVar} == 1 then\n`;
    stateMachine += `        -- Block 1\n`;
    stateMachine += `        ${blocks[0]}\n`;
    stateMachine += `        ${stateVar} = 2\n`;
    stateMachine += `    elseif ${stateVar} == 2 then\n`;
    stateMachine += `        -- Block 2\n`;
    stateMachine += `        ${blocks[1]}\n`;
    stateMachine += `        ${stateVar} = 3\n`;

    for (let i = 2; i < blocks.length; i++) {
        stateMachine += `    elseif ${stateVar} == ${i + 1} then\n`;
        stateMachine += `        -- Block ${i + 1}\n`;
        stateMachine += `        ${blocks[i]}\n`;
        stateMachine += `        ${stateVar} = ${i + 2}\n`;
    }

    stateMachine += `    else\n`;
    stateMachine += `        break\n`;
    stateMachine += `    end\n`;
    stateMachine += `end\n`;

    // Bungkus dalam fungsi untuk mempertahankan scope
    const funcName = generateRandomName(12);
    return `local function ${funcName}()\n${stateMachine}\nend\n${funcName}()`;
}

module.exports = { applyControlFlowFlattening };
