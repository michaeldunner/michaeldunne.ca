"use client";
import { motion, Reorder } from "motion/react";
import { Pokedex } from "./pokedex";
import PDFMerger from "pdf-merger-js/browser";
import { ChangeEvent, useState } from "react";
import {
    IconFileTypePdf,
    IconX,
    IconDragDrop,
    IconDownload,
    IconPlus,
} from "@tabler/icons-react";

interface FileItem {
    id: string;
    file: File;
}

export function PDF() {
    const [mergedUrl, setMergedUrl] = useState<string | null>(null);
    const [files, setFiles] = useState<FileItem[]>([]);
    const [isMerging, setIsMerging] = useState(false);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map((file) => ({
                id: crypto.randomUUID(),
                file,
            }));
            setFiles((prev) => [...prev, ...newFiles]);
            setMergedUrl(null);
        }
    };

    const removeFile = (id: string) => {
        setFiles((prev) => prev.filter((item) => item.id !== id));
        setMergedUrl(null);
    };

    const mergePdfs = async (): Promise<void> => {
        if (files.length === 0) return;

        setIsMerging(true);
        try {
            const merger = new PDFMerger();
            for (const item of files) {
                await merger.add(item.file);
            }
            const mergedBlob: Blob = await merger.saveAsBlob();
            const objectUrl: string = URL.createObjectURL(mergedBlob);
            setMergedUrl(objectUrl);
        } catch (error) {
            console.error("Error merging PDFs", error);
        } finally {
            setIsMerging(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-white dark:bg-neutral-950 p-4 md:p-8 overflow-y-auto">
            <Pokedex>
                {/* Left Col: Controls & File List */}
                <div className="md:w-1/2 p-8 pt-24 bg-neutral-100 dark:bg-neutral-800 flex flex-col gap-6 border-b md:border-b-0 md:border-r border-neutral-300 dark:border-neutral-700 overflow-hidden">
                    {/* File Input Zone */}
                    <div className="relative group">
                        <input
                            type="file"
                            multiple
                            accept="application/pdf"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-xl p-6 flex flex-col items-center justify-center gap-2 transition-colors group-hover:border-red-500 group-hover:bg-red-50/50 dark:group-hover:bg-red-900/10">
                            <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-400 group-hover:text-red-500 transition-colors">
                                <IconPlus className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-bold text-neutral-600 dark:text-neutral-300">
                                Add PDF Files
                            </p>
                            <p className="text-xs text-neutral-400">
                                Drag and drop or click to upload
                            </p>
                        </div>
                    </div>

                    {/* Reorderable List */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2">
                        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <IconDragDrop className="w-3 h-3" />
                            Order
                        </h3>

                        <Reorder.Group
                            axis="y"
                            values={files}
                            onReorder={setFiles}
                            className="flex flex-col gap-2"
                        >
                            {files.map((item) => (
                                <Reorder.Item
                                    key={item.id}
                                    value={item}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    onDragEnd={() => setMergedUrl(null)}
                                    className="cursor-move relative z-10"
                                    whileDrag={{
                                        // scale: 1.12,
                                        boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
                                        zIndex: 50,
                                    }}
                                >
                                    <div className="bg-white dark:bg-neutral-900 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm flex items-center gap-3 group select-none transition-colors hover:border-red-500 hover:bg-[#faf5f5] dark:hover:bg-[#1a1414]">
                                        <div className="w-8 h-8 rounded bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0 group-hover:scale-110 transition-transform">
                                            <IconFileTypePdf className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200 truncate">
                                                {item.file.name}
                                            </p>
                                            <p className="text-[10px] text-neutral-400">
                                                {(item.file.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                        <button
                                            onPointerDown={(e) => e.stopPropagation()}
                                            onClick={() => removeFile(item.id)}
                                            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-red-500 transition-colors"
                                        >
                                            <IconX className="w-4 h-4" />
                                        </button>
                                    </div>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>

                        {files.length === 0 && (
                            <div className="text-center py-8 text-neutral-400 text-sm">
                                No files uploaded.
                            </div>
                        )}
                    </div>

                    <div className="bg-neutral-200 dark:bg-neutral-700 text-green-700 dark:text-green-400 font-mono p-4 rounded-lg text-sm">
                        &gt; RELEASED ON 01/09/2026
                        <br />
                        &gt; FILES_LOADED: {files.length}
                        {isMerging && (
                            <>
                                <br />
                                <span className="animate-pulse">&gt; PROCESSING...</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Right Col: Output & Actions */}
                <div className="md:w-1/2 p-8 pt-24 md:p-12 md:pt-24 overflow-y-auto">
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-400 mb-2 pb-2">
                            PDF Merger
                        </h1>
                        <h2 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                            Drag and drop PDF files on the left to organize your document
                            sequence.
                        </h2>
                        <span className="inline-block bg-neutral-200 dark:bg-neutral-700 px-2 py-1 rounded text-xs font-bold tracking-widest text-neutral-500 uppercase mb-8">
                            Version 1.0.0
                        </span>

                        <div className="prose prose-neutral dark:prose-invert mb-8">
                            <p>
                                I needed a simple way to merge PDF files, and I didn't want to
                                deal with any third-party services. So, I built this tool to
                                merge PDF files in your browser.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* Merge Action */}
                            <motion.div
                                animate={files.length > 0 ? {
                                    boxShadow: [
                                        "0 0 0px rgba(220, 38, 38, 0)",
                                        "0 0 20px rgba(220, 38, 38, 0.3)",
                                        "0 0 0px rgba(220, 38, 38, 0)"
                                    ]
                                } : {}}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="p-1 rounded-2xl bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 shadow-inner"
                            >
                                <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-6 flex flex-col items-center text-center gap-4 overflow-hidden relative">
                                    {mergedUrl ? (
                                        <motion.div
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="flex flex-col items-center gap-4"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center border-4 border-green-200 dark:border-green-800">
                                                <IconDownload className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                                                    Merge Complete!
                                                </h3>
                                                <p className="text-sm text-neutral-500">
                                                    Your document is ready.
                                                </p>
                                            </div>
                                            <motion.a
                                                href={mergedUrl}
                                                download="merged_document.pdf"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg shadow-red-500/30 transition-all flex items-center gap-2 relative overflow-hidden"
                                            >
                                                <motion.div
                                                    initial={{ x: "-100%" }}
                                                    animate={{ x: "100%" }}
                                                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                                />
                                                Download PDF
                                            </motion.a>
                                        </motion.div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-4 w-full">
                                            <div
                                                className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${files.length > 0
                                                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                                    : "bg-neutral-200 dark:bg-neutral-800 text-neutral-400"
                                                    }`}
                                            >
                                                <IconFileTypePdf className="w-8 h-8" />
                                            </div>
                                            <motion.button
                                                onClick={mergePdfs}
                                                disabled={files.length === 0 || isMerging}
                                                whileHover={files.length > 0 ? { scale: 1.05 } : {}}
                                                whileTap={files.length > 0 ? { scale: 0.95 } : {}}
                                                className={`w-full py-3 px-6 rounded-lg font-bold transition-all flex items-center justify-center gap-2 relative overflow-hidden
                             ${files.length > 0
                                                        ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-lg cursor-pointer"
                                                        : "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
                                                    }
                           `}
                                            >
                                                {files.length > 0 && !isMerging && (
                                                    <motion.div
                                                        initial={{ x: "-100%" }}
                                                        animate={{ x: "100%" }}
                                                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                                                    />
                                                )}
                                                {isMerging ? "Processing..." : "Merge Files"}
                                            </motion.button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </Pokedex>
            {/* Mobile Spacer */}
            <div className="h-32 w-full shrink-0 md:hidden" />
        </div>
    );
}
