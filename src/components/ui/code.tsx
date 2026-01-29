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
  const [result, setResult] = useState<string>('Initializing Wasm module...');

  useEffect(() => {
    console.log("useEffect started for Wasm initialization (Script Tag Mode)");
    const w = window as any;

    // Function to handle the module once it's ready
    const handleModuleReady = (mod: any) => {
      console.log("handleModuleReady triggered!");
      setModule(mod);
      setResult('Wasm module ready.');
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
        setResult('Error: Failed to load script.');
      };
      document.body.appendChild(script);
    } else {
      console.log("Script tag already exists, waiting for init...");
    }

    return () => {
      console.log("useEffect cleanup");
    };
  }, []);

  useEffect(() => {
    if (Module) {
      runCalculation();
    }
  }, [Module]);

  const runCalculation = () => {
    console.log("runCalculation called, Module exists:", !!Module);
    if (Module) {
      try {
        console.log("Trying to wrap 'multiply'...");
        // Replace 'yourFunctionName' with your actual function name
        const myFunc = Module.cwrap('multiply', 'number', ['number', 'number']);
        console.log("cwrap returned:", myFunc);
        const answer = myFunc(5, 10);
        console.log("Calculation answer:", answer);
        setResult(`Result: ${answer}`);
      } catch (e) {
        console.error("Calculation failed:", e);
        setResult(`Error: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  };
  return (
    <div className="h-full w-full bg-white dark:bg-neutral-950 p-4 md:p-8 overflow-y-auto">
      <Pokedex>
        <div className="md:w-1/2 p-8 pt-24 bg-neutral-100 dark:bg-neutral-800 flex flex-col gap-6 border-b md:border-b-0 md:border-r border-neutral-300 dark:border-neutral-700">
          <div className="flex flex-col gap-4">
            <div className="text-xl font-mono p-4 bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-700 shadow-sm">
              {result}
            </div>

            <button
              onClick={runCalculation}
              disabled={!Module}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-neutral-400 text-white font-bold rounded transition-colors"
            >
              Run Multiply(5, 10)
            </button>
          </div>
        </div>

        {/* Right Col: Content */}
        <div className="md:w-1/2 p-8 pt-24 md:p-12 md:pt-24 overflow-y-auto">
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

            <div className="mt-8 border-l-4 border-red-500 pl-4">
              {/* The Heading - You can change 'Field Footage' to any title */}
              <h4 className="font-bold text-neutral-900 dark:text-white mb-2">
                Section Title
              </h4>

              {/* Your New Wrapper Div */}
              <div className="w-full rounded bg-neutral-50 dark:bg-neutral-900/50 p-4">
                <CodeBlock
                  language="jsx"
                  filename="DummyComponent.jsx"
                  highlightLines={[9, 13, 14, 18]}
                  code={code}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </Pokedex>
      {/* Mobile Spacer */}
      <div className="h-32 w-full shrink-0 md:hidden" />
    </div>
  );
}
