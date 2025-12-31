"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "../ui/sidebar";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
  IconTerminal,
  IconBrandLinkedin,
  IconBrandGithub,
  IconBrandLetterboxd,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { EncryptedText } from "./encrypted-text";
import Home from "./home";

export function MySidebar() {
  const links = [
    {
      label: "Linkedin",
      href: "https://www.linkedin.com/in/michaeldunner",
      icon: (
        <IconBrandLinkedin className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Github",
      href: "/github",
      icon: (
        <IconBrandGithub className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Letterboxd",
      href: "/letterboxd",
      icon: (
        <IconBrandLetterboxd className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
  ];
  const [open, setOpen] = useState(false);
return (
    // fixed fullscreen container so the sidebar module truly spans the viewport
    <div className="fixed inset-0 z-50 flex h-screen">
      {/* Left wrapper uses the collapsed width and allows the inner sidebar to overflow */}
      <div className="relative w-[60px] flex-shrink-0 h-full overflow-visible">
        <Sidebar open={open} setOpen={setOpen} animate={true}>
          <SidebarBody className="justify-between gap-10 h-full">
            <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
              <Logo />
              <div className="mt-8 flex flex-col gap-2">
                {links.map((link, idx) => (
                  <SidebarLink key={idx} link={link} />
                ))}
              </div>
            </div>
            <div />
          </SidebarBody>
        </Sidebar>
      </div>

      {/* Main content area — margin matches collapsed width, transitions when open */}
      <div
        className={cn(
          "flex-1 h-full overflow-auto bg-neutral-50 dark:bg-neutral-800 transition-all duration-200",
          open ? "ml-[90px]" : "ml-[0px]"
        )}
      >
        <Dashboard />
      </div>
    </div>
  );
}
export const Logo = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      {/* <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" /> */}

      <IconTerminal className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-neutral-700 dark:text-neutral-200"
      >
        Platforms
      </motion.span>
    </a>
  );
};
export const LogoIcon = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
    </a>
  );
};

// This is like homepage
const Dashboard = () => {
  return <Home />;
};
