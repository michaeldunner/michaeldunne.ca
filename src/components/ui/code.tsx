"use client";
import { motion } from "motion/react";
import { Pokedex } from "./pokedex";
import { CodeBlock } from "./code-block";
import type { EmscriptenModule } from "../../cpp/rref.js";
import { useState, useEffect, useRef } from "react";
import { IconMaximize, IconMinimize } from "@tabler/icons-react";
import { parseExpression } from "../../lib/expression-parser";

interface CodeProps {
  title: string;
  subtitle: string;
  date: string;
  description: React.ReactNode;
  code: string;
}

export function Code({ title, subtitle, date, description, code }: CodeProps) {
  const [Module, setModule] = useState<EmscriptenModule | null>(null);
  type Tab = 'original' | 'rref';
  const [activeTab, setActiveTab] = useState<Tab>('original');
  const [isMobile, setIsMobile] = useState(false);
  const [displayMode, setDisplayMode] = useState<'fraction' | 'decimal'>('fraction');
  const [history, setHistory] = useState<Record<Tab, { matrix: string[], rows: number, cols: number }>>({
    original: { matrix: new Array(12).fill("0"), rows: 3, cols: 4 },
    rref: { matrix: new Array(12).fill("0"), rows: 3, cols: 4 }
  });

  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(4);
  const [matrix, setMatrix] = useState<string[]>(new Array(12).fill("0"));

  // Focus Mode State
  const [isFocusMode, setIsFocusMode] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef<number>(0);
  const [inputErrors, setInputErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleFocusMode = (val: boolean) => {
    if (val === isFocusMode) return;

    if (val) {
      // Entering: Capture scroll position
      if (scrollContainerRef.current) {
        scrollPosRef.current = scrollContainerRef.current.scrollTop;
      }
    }

    setIsFocusMode(val);

    if (!val) {
      // Exiting: Restore scroll position after a short delay for layout to settle
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollPosRef.current;
        }
      }, 10);
    }
  };

  // Keyboard support for ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFocusMode) {
        toggleFocusMode(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocusMode]);

  const handleTabChange = (newTab: Tab) => {
    if (newTab === activeTab) return;

    // Save current working copy to history
    setHistory(prev => ({
      ...prev,
      [activeTab]: { matrix, rows, cols }
    }));

    // Switch tab
    setActiveTab(newTab);

    // Load new tab's history into working copy
    const target = history[newTab];
    setRows(target.rows);
    setCols(target.cols);
    setMatrix(target.matrix);
  };

  // Helper to convert expressions/fractions to decimals using the BEDMAS parser
  const toDecimal = (val: string): number => {
    const result = parseExpression(val);
    return result.value;
  };

  // Validate a matrix value and return error if invalid
  const validateValue = (val: string): string | undefined => {
    if (!val || !val.trim()) return undefined;
    const result = parseExpression(val);
    return result.error;
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

    // Validate and update errors
    const error = validateValue(val);
    setInputErrors(prev => {
      const next = { ...prev };
      if (error) {
        next[index] = error;
      } else {
        delete next[index];
      }
      return next;
    });
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
        const fractionalResults = resultData.map(v => toFraction(v));

        // Commit current state and result to history
        setHistory({
          original: { matrix: [...matrix], rows, cols },
          rref: { matrix: fractionalResults, rows, cols }
        });

        // Load RREF into editor and switch tab
        setMatrix(fractionalResults);
        setActiveTab('rref');

        // Free memory
        Module._free(dataPtr);
      } catch (e) {
        console.error("RREF failed:", e);
      }
    }
  };
  return (
    <div
      ref={scrollContainerRef}
      className="min-h-screen w-full bg-white dark:bg-neutral-950 p-4 md:p-8"
    >
      <Pokedex>
        <div className="flex flex-col w-full">
          {/* Top Row: Split View / Panel Takeover - COORDINATED GRID ANIMATION */}
          <motion.div
            animate={{
              gridTemplateColumns: isMobile ? "1fr" : (isFocusMode ? "1fr 0fr" : "1fr 1fr")
            }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={`grid grid-cols-1 md:grid-cols-[1fr_1fr] items-stretch w-full border-b border-neutral-300 dark:border-neutral-700 ${isFocusMode ? 'md:h-[800px]' : 'md:min-h-[800px]'} h-auto`}
          >
            {/* Top-Left: Editor Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className={`p-8 pt-24 md:p-8 md:pt-32 bg-neutral-100 dark:bg-neutral-800 flex flex-col gap-6 border-b md:border-b-0 border-neutral-300 dark:border-neutral-700 md:overflow-hidden relative z-0 ${!isFocusMode ? 'md:border-r' : ''}`}
            >
              <div className="flex flex-col">
                {/* Header with History Tabs and Expand Button */}
                <div className="flex items-center justify-between gap-1 -mb-[1px] relative z-20">
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleTabChange('original')}
                      className={`px-6 py-2 rounded-t-xl text-[10px] uppercase font-bold tracking-widest transition-all ${activeTab === 'original'
                        ? "bg-white dark:bg-neutral-900 text-red-600 border-t border-l border-r border-neutral-200 dark:border-neutral-700 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]"
                        : "bg-neutral-200/50 dark:bg-neutral-800/50 text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800"
                        }`}
                    >
                      Original
                    </button>
                    <button
                      onClick={() => handleTabChange('rref')}
                      className={`px-6 py-2 rounded-t-xl text-[10px] uppercase font-bold tracking-widest transition-all ${activeTab === 'rref'
                        ? "bg-white dark:bg-neutral-900 text-red-600 border-t border-l border-r border-neutral-200 dark:border-neutral-700 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]"
                        : "bg-neutral-200/50 dark:bg-neutral-800/50 text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800"
                        }`}
                    >
                      Results
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    {activeTab === 'rref' && (
                      <div className="flex bg-neutral-200/50 dark:bg-neutral-800/50 p-1 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-inner">
                        <button
                          onClick={() => setDisplayMode('fraction')}
                          className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all tracking-widest ${displayMode === 'fraction' ? 'bg-white dark:bg-neutral-700 text-red-600 shadow-md' : 'text-neutral-500 hover:text-neutral-700'}`}
                        >
                          FRACTIONS
                        </button>
                        <button
                          onClick={() => setDisplayMode('decimal')}
                          className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all tracking-widest ${displayMode === 'decimal' ? 'bg-white dark:bg-neutral-700 text-red-600 shadow-md' : 'text-neutral-500 hover:text-neutral-700'}`}
                        >
                          DECIMALS
                        </button>
                      </div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleFocusMode(!isFocusMode)}
                      className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
                      title={isFocusMode ? "Minimize Editor" : "Expand Editor"}
                    >
                      {isFocusMode ? <IconMinimize size={20} /> : <IconMaximize size={20} />}
                    </motion.button>
                  </div>
                </div>

                <div className="flex flex-col gap-8 bg-white dark:bg-neutral-900 p-6 rounded-b-2xl rounded-tr-2xl border border-neutral-200 dark:border-neutral-700 shadow-xl relative z-10">
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
                      <label className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 mb-1 tracking-wider">Columns</label>
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
                      className="mt-5 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-neutral-400 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 relative overflow-hidden group cursor-pointer ml-auto"
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
                      {matrix.map((val, i) => {
                        let displayVal = val === "0" ? "" : val;
                        if (activeTab === 'rref' && displayMode === 'decimal' && val !== "0") {
                          const num = toDecimal(val);
                          displayVal = Number.isInteger(num) ? num.toString() : num.toFixed(4);
                        }
                        const hasError = inputErrors[i] !== undefined;
                        return (
                          <input
                            key={i}
                            type="text"
                            value={displayVal}
                            placeholder="0"
                            title={hasError ? inputErrors[i] : undefined}
                            readOnly={activeTab === 'rref' && displayMode === 'decimal'}
                            onChange={(e) => updateMatrixValue(i, e.target.value)}
                            className={`w-full text-center rounded-lg border font-mono focus:ring-2 outline-none transition-all shadow-sm py-2 text-sm px-2 ${activeTab === 'rref' && displayMode === 'decimal' ? 'cursor-not-allowed' : ''} ${hasError ? 'border-red-500 bg-red-50 dark:bg-red-950/30 focus:ring-red-500/50' : 'border-neutral-100 dark:border-neutral-800 dark:bg-neutral-950 focus:ring-red-500/30 hover:bg-neutral-50 dark:hover:bg-neutral-900'}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Top-Right: Description Section (Collapsed in Focus Mode) */}
            <motion.div
              initial={false}
              animate={{
                opacity: (!isMobile && isFocusMode) ? 0 : 1,
                paddingLeft: (!isMobile && isFocusMode) ? 0 : undefined,
                paddingRight: (!isMobile && isFocusMode) ? 0 : undefined,
                pointerEvents: (!isMobile && isFocusMode) ? 'none' : 'auto'
              }}
              className="p-8 pt-24 md:p-12 md:pt-32 bg-white dark:bg-neutral-900 md:overflow-hidden relative z-0 min-w-0"
            >
              <motion.div
                layout="position"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
              >
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-400 mb-2">
                  {title}
                </h1>
                <h2 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  {subtitle}
                </h2>
                <span className="inline-block bg-neutral-200 dark:bg-neutral-700 px-2 py-1 rounded text-xs font-bold tracking-widest text-neutral-500 uppercase mb-8">
                  {date}
                </span>

                <div className="prose prose-neutral dark:prose-invert">
                  {description}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Bottom Row: Full-width Code Block Section (Always visible) */}
          <div className="w-full p-8 md:p-12 bg-neutral-100 dark:bg-neutral-800 border-t border-neutral-300 dark:border-neutral-700">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="w-full h-full p-4 md:p-8"
            >
              <h4 className="font-bold text-neutral-900 dark:text-white mb-4">
                Source Code (C++)
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
