"use client";
import { motion } from "motion/react";
import { Pokedex } from "./pokedex";
import PDFMerger from "pdf-merger-js/browser"; // browser build
import { ChangeEvent, useState } from "react";



export function PDF() {
const [mergedUrl, setMergedUrl] = useState<string | null>(null);
const [files, setFiles] = useState<File[]>([]);

  const mergePdfs = async (): Promise<void> => {
    const merger = new PDFMerger();

    for (const file of Array.from(files)) {
      await merger.add(file);
    }

    const mergedBlob: Blob = await merger.saveAsBlob();
    const objectUrl: string = URL.createObjectURL(mergedBlob);

    setMergedUrl(objectUrl);
  };




    


  return (
    <div className="h-full w-full bg-white dark:bg-neutral-950 p-4 md:p-8 overflow-y-auto">
      <Pokedex>
        {/* Left Col: Visuals (Sticky on Desktop) */}
        <div className="md:w-1/2 p-8 pt-24 bg-neutral-100 dark:bg-neutral-800 flex flex-col gap-6 border-b md:border-b-0 md:border-r border-neutral-300 dark:border-neutral-700">
          <input
      type="file"
      multiple
      accept="application/pdf"
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        setFiles(selectedFiles);
      }}    />
      <button
        onClick={mergePdfs}
      >Merge PDFs</button>
{mergedUrl && (
        <a href={mergedUrl} download="merged.pdf">
          Download merged PDF
        </a>
      )}
      </div>

        {/* Right Col: Content */}
        <div className="md:w-1/2 p-8 pt-24 md:p-12 md:pt-24 overflow-y-auto">
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-400 mb-2">
              PDF Merger
            </h1>
            <h2 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
              Merge PDF Files
            </h2>
            <span className="inline-block bg-neutral-200 dark:bg-neutral-700 px-2 py-1 rounded text-xs font-bold tracking-widest text-neutral-500 uppercase mb-8">
              {/* This was a date or some different type */}
              Test Date
            </span>

            <div className="prose prose-neutral dark:prose-invert">
              I needed this to merge PDF files for Rashid 
            </div>

            <div className="mt-8 border-l-4 border-red-500 pl-4">
              {/* The Heading - You can change 'Field Footage' to any title */}
              <h4 className="font-bold text-neutral-900 dark:text-white mb-2">
                Section Title
              </h4>

              
            </div>
          </motion.div>
        </div>
      </Pokedex>
    </div>
  );



}