const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/input/index.tsx', 'utf8');

const target1 = `      return {
        ...mod,
        passStandard: mod.id === "kewaspadaan-isolasi" ? isTerpenuhi : passStandard,
        computed: {`;

const repl1 = `      return {
        ...mod,
        passStandard: mod.id === "kewaspadaan-isolasi" ? isTerpenuhi : passStandard,
        computed: {
          standardLabel: mod.id === "kewaspadaan-isolasi" ? (isTerpenuhi ? "SUDAH TERPENUHI" : "BELUM TERPENUHI") : (passStandard ? "DI ATAS STANDAR" : "DI BAWAH STANDAR"),`;

const target2 = `{mod.passStandard ? "DI ATAS STANDAR" : "DI BAWAH STANDAR"}`;
const repl2 = `{mod.computed.standardLabel || (mod.passStandard ? "DI ATAS STANDAR" : "DI BAWAH STANDAR")}`;

code = code.replace(target1, repl1);
code = code.replace(target2, repl2);

fs.writeFileSync('src/pages/dashboard/input/index.tsx', code);
console.log('Patched label');
