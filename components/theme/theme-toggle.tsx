"use client";

import { useEffect, useState } from "react";
import { Moon, SunMedium } from "lucide-react";

import { Button } from "@/components/ui/button";

type ThemeMode = "light" | "dark";
const THEME_KEY = "pos-theme";

function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof document === "undefined") {
      return "light";
    }

    const current = document.documentElement.getAttribute("data-theme");
    if (current === "dark" || current === "light") {
      return current;
    }

    const fromStorage = localStorage.getItem(THEME_KEY);
    if (fromStorage === "dark" || fromStorage === "light") {
      return fromStorage;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => {
        setTheme(nextTheme);
      }}
      aria-label="Ganti tema"
      title="Ganti tema"
    >
      {theme === "dark" ? <SunMedium size={16} /> : <Moon size={16} />}
    </Button>
  );
}
