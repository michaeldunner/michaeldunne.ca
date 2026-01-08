"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { DJButton } from "./dj-button";
import { DPad } from "./d-pad";
import { ImageSlideshow } from "./image-slideshow";
import { Pokedex } from "./pokedex";
import { CodeBlock } from "./code-block";

interface CodeProps {
  title: string;
  subtitle: string;
  date: string;
  description: React.ReactNode;
  code: string;
}

export function Code({ title, subtitle, date, description, code }: CodeProps) {
  return (
    <div className="h-full w-full bg-white dark:bg-neutral-950 p-4 md:p-8 overflow-y-auto">
      <Pokedex>
        {/* Left Col: Visuals (Sticky on Desktop) */}
        <div className="md:w-1/2 p-8 pt-24 bg-neutral-100 dark:bg-neutral-800 flex flex-col gap-6 border-b md:border-b-0 md:border-r border-neutral-300 dark:border-neutral-700"></div>

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
    </div>
  );
}
