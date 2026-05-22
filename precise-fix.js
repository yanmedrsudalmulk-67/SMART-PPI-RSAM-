const fs = require('fs');
const path = require('path');

function fixFile(filePath, startMarker, endMarker, replacement) {
  let content = fs.readFileSync(filePath, 'utf8');
  let startIndex = content.indexOf(startMarker);
  let endIndex = content.indexOf(endMarker, startIndex);
  
  if (startIndex !== -1 && endIndex !== -1) {
    let newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex + endMarker.length);
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log("Fixed " + filePath);
  } else {
    console.log("Could not find markers in " + filePath);
  }
}

// Fix hand-hygiene.tsx
// It has issues in the observer map probably
fixFile('src/pages/dashboard/input/hand-hygiene.tsx', '<div className="max-h-[250px]', '</AnimatePresence>', 
`<div className="max-h-[250px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {observers.map((obs) => (
                    <motion.div
                      key={obs.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                          <UserCircle className="w-4 h-4 text-blue-500" />
                        </div>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {obs.nama}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteObserver(obs.id)}
                        className="p-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>`);

// Fix monitoring-airborne.tsx observers
fixFile('src/pages/dashboard/input/monitoring-airborne.tsx', '<div className="max-h-[300px]', '</motion.div>',
`<div className="max-h-[300px] overflow-y-auto space-y-2">
                {observers.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl"
                  >
                    <span className="text-sm font-medium text-slate-300">
                      {o.nama}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => editObserver(o)}
                        className="p-2 text-slate-500 hover:text-blue-400"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteObserver(o.id)}
                        className="p-2 text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>`);

// Fix apd.tsx
fixFile('src/pages/dashboard/input/apd.tsx', '<div className="space-y-4">', '<LiveStatisticsCard', 
`<div className="space-y-4">
          {apdItems.map((apd) => {
            const selected = apdData[apd.id];
            const borderLeftColor =
              selected === "ya"
                ? "border-l-blue-500"
                : selected === "tidak"
                  ? "border-l-red-500"
                  : selected === "na"
                    ? "border-l-slate-500"
                    : "border-l-transparent";
            return (
              <div
                key={apd.id}
                className={\`bg-white/5 p-6 rounded-[24px] border border-white/5 border-l-4 \${borderLeftColor} transition-colors duration-300\`}
              >
                <h3 className="text-sm font-bold text-white mb-4">
                  {apd.label}
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {["ya", "tidak", "na"].map((choice) => {
                    let activeClass = "";
                    if (choice === "ya")
                      activeClass =
                        "bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]";
                    if (choice === "tidak")
                      activeClass =
                        "bg-red-500 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]";
                    if (choice === "na")
                      activeClass =
                        "bg-slate-500 text-white border-slate-400 shadow-[0_0_15px_rgba(100,116,139,0.3)]";
                    return (
                      <button
                        key={choice}
                        type="button"
                        onClick={() => handleActionClick(apd.id, choice as any)}
                        className={\`py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border \${
                          selected === choice
                            ? activeClass
                            : "bg-white/5 text-slate-400 border-transparent hover:bg-white/10 hover:text-white"
                        }\`}
                      >
                        {choice === "na" ? "N/A" : choice}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        `);
