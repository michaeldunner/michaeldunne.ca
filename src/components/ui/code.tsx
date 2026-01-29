"use client";
import { motion } from "motion/react";
import { Pokedex } from "./pokedex";
import { CodeBlock } from "./code-block";
import type { EmscriptenModule } from "../../cpp/rref.js";
import { useState, useEffect } from "react";

interface CodeProps {
  title: string;
  subtitle: string;
  date: string;
  description: React.ReactNode;
  code: string;
}

export function Code({ title, subtitle, date, description, code }: CodeProps) {
  const [Module, setModule] = useState<EmscriptenModule | null>(null);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(4);
  const [matrix, setMatrix] = useState<string[]>(new Array(12).fill("0"));

  // Helper to convert fractions (1/2) to decimals (0.5)
  const toDecimal = (val: string): number => {
    if (val.includes('/')) {
      const [num, den] = val.split('/').map(Number);
      if (den === 0) return 0;
      return num / den;
    }
    return parseFloat(val) || 0;
  };

  // Helper to convert decimals (0.3333) to fractions (1/3) using continued fractions
  const toFraction = (decimal: number): string => {
    if (Math.abs(decimal) < 1e-10) return "0";
    if (Math.abs(decimal - Math.round(decimal)) < 1e-10) return Math.round(decimal).toString();

    const precision = 1e-6;

    let x = decimal;
    let a = Math.floor(x);
    let h1 = 1, h2 = a, k1 = 0, k2 = 1;

    while (Math.abs(decimal - h2 / k2) > precision && k2 < 1000) {
      x = 1 / (x - a);
      a = Math.floor(x);
      let h = a * h2 + h1;
      let k = a * k2 + k1;
      h1 = h2; h2 = h;
      k1 = k2; k2 = k;
    }

    // Simplify signs
    if (k2 < 0) { h2 = -h2; k2 = -k2; }

    return k2 === 1 ? h2.toString() : `${h2}/${k2}`;
  };

  useEffect(() => {
    console.log("useEffect started for Wasm initialization (Script Tag Mode)");
    const w = window as any;

    // Function to handle the module once it's ready
    const handleModuleReady = (mod: any) => {
      console.log("handleModuleReady triggered!");
      setModule(mod);
    };

    // Define Module globally BEFORE script loads
    if (!w.Module) {
      console.log("Creating new global window.Module");
      w.Module = {};
    }

    w.Module.locateFile = (path: string) => {
      console.log("GLOBAL locateFile called for:", path);
      if (path.endsWith('.wasm')) {
        return '/rref.wasm';
      }
      return path;
    };

    w.Module.onRuntimeInitialized = () => {
      console.log("onRuntimeInitialized via global Module");
      handleModuleReady(w.Module);
    };

    if (w.Module.calledRun || w.Module.runtimeInitialized) {
      console.log("Module already present and initialized");
      handleModuleReady(w.Module);
      return;
    }

    // Check if script already exists to avoid double loading
    const existingScript = document.getElementById('rref-script');
    if (!existingScript) {
      console.log("Creating script tag for /rref.js");
      const script = document.createElement('script');
      script.id = 'rref-script';
      script.src = '/rref.js';
      script.async = true;
      script.onload = () => {
        console.log("/rref.js script loaded into DOM");
      };
      script.onerror = (e) => {
        console.error("Failed to load /rref.js script:", e);
      };
      document.body.appendChild(script);
    } else {
      console.log("Script tag already exists, waiting for init...");
    }

    return () => {
      console.log("useEffect cleanup");
    };
  }, []);

  const handleDimensionChange = (newRows: number, newCols: number) => {
    const r = Math.max(1, Math.min(10, newRows));
    const c = Math.max(1, Math.min(10, newCols));
    setRows(r);
    setCols(c);
    setMatrix(new Array(r * c).fill("0"));
  };

  const updateMatrixValue = (index: number, val: string) => {
    const newMatrix = [...matrix];
    newMatrix[index] = val;
    setMatrix(newMatrix);
  };

  const solveRREF = () => {
    if (Module) {
      try {
        const numElements = rows * cols;
        const bytesPerElement = 8; // double
        const dataPtr = Module._malloc(numElements * bytesPerElement);

        // Map strings to decimals and copy to Wasm
        const numericData = matrix.map(toDecimal);
        const dataHeap = new Float64Array(Module.HEAPF64.buffer, dataPtr, numElements);
        dataHeap.set(numericData);

        // Call RREF
        Module._rref(dataPtr, rows, cols);

        // Get result and convert back to fractions
        const resultData = Array.from(new Float64Array(Module.HEAPF64.buffer, dataPtr, numElements));
        setMatrix(resultData.map(v => toFraction(v)));

        // Free memory
        Module._free(dataPtr);
      } catch (e) {
        console.error("RREF failed:", e);
      }
    }
  };

  return (
    <div className="h-full w-full bg-white dark:bg-neutral-950 p-4 md:p-8 overflow-y-auto">
      <Pokedex>
        <div className="flex flex-col w-full">
          {/* Top Row: Split View */}
          <div className="flex flex-col md:flex-row w-full border-b border-neutral-300 dark:border-neutral-700 min-h-[720px]">
            {/* Top-Left: Editor Section */}
            <div className="md:w-1/2 p-4 md:p-8 pt-24 md:pt-32 bg-neutral-100 dark:bg-neutral-800 flex flex-col gap-6 border-b md:border-b-0 md:border-r border-neutral-300 dark:border-neutral-700">
              <div className="flex flex-col gap-8">
                <div className="flex gap-4 items-center">
                  <div className="flex flex-col">
                    <label className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 mb-1 tracking-wider">Rows</label>
                    <input
                      type="number"
                      value={rows}
                      onChange={(e) => handleDimensionChange(parseInt(e.target.value), cols)}
                      className="w-16 p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 font-mono focus:ring-2 focus:ring-red-500/50 outline-none transition-all shadow-sm"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 mb-1 tracking-wider">Cols</label>
                    <input
                      type="number"
                      value={cols}
                      onChange={(e) => handleDimensionChange(rows, parseInt(e.target.value))}
                      className="w-16 p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 font-mono focus:ring-2 focus:ring-red-500/50 outline-none transition-all shadow-sm"
                    />
                  </div>
                  <motion.button
                    onClick={solveRREF}
                    disabled={!Module}
                    whileHover={Module ? { scale: 1.02, translateY: -2 } : {}}
                    whileTap={Module ? { scale: 0.98 } : {}}
                    className="mt-5 flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-neutral-400 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 relative overflow-hidden group cursor-pointer"
                  >
                    {Module && (
                      <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                      />
                    )}
                    <span className="relative z-10">SOLVE RREF</span>
                  </motion.button>
                </div>

                <div className="w-full">
                  <div
                    className="grid gap-1 p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-xl max-h-[650px] overflow-y-auto"
                    style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
                  >
                    {matrix.map((val, i) => (
                      <input
                        key={i}
                        type="text"
                        value={val === "0" ? "" : val}
                        placeholder="0"
                        onChange={(e) => updateMatrixValue(i, e.target.value)}
                        className="w-full px-1 py-2 text-center rounded-lg border border-neutral-100 dark:border-neutral-800 dark:bg-neutral-950 font-mono text-sm focus:ring-2 focus:ring-red-500/30 outline-none transition-all hover:bg-neutral-50 dark:hover:bg-neutral-900 shadow-sm"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Top-Right: Description Section */}
            <div className="flex-1 p-8 pt-24 md:p-12 md:pt-32 bg-white dark:bg-neutral-900">
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-400 mb-2">
                  {title}
                </h1>
                <h2 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  {subtitle}
                </h2>
                <span className="inline-block bg-neutral-200 dark:bg-neutral-700 px-2 py-1 rounded text-xs font-bold tracking-widest text-neutral-500 uppercase mb-8">
                  Data Entry: {date}
                </span>

                <div className="prose prose-neutral dark:prose-invert">
                  {description}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Bottom Row: Full-width Code Block Section */}
          <div className="w-full p-8 md:p-12 bg-neutral-100 dark:bg-neutral-800">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="border-l-4 border-red-500 pl-4"
            >
              <h4 className="font-bold text-neutral-900 dark:text-white mb-4">
                Algorithm Implementation (C++)
              </h4>
              <div className="w-full rounded bg-white dark:bg-neutral-900/50 shadow-2xl overflow-hidden p-1">
                <CodeBlock
                  language="cpp"
                  filename="rref.cpp"
                  highlightLines={[]}
                  code={code}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </Pokedex>
      {/* Mobile Spacer */}
      <div className="h-32 w-full shrink-0 md:hidden" />
    </div>
  );
}
