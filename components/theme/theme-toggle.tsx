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
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (current === "dark" || current === "light") {
      setTheme(current);
      return;
    }

    const fromStorage = localStorage.getItem(THEME_KEY);
    if (fromStorage === "dark" || fromStorage === "light") {
      setTheme(fromStorage);
      applyTheme(fromStorage);
      return;
    }

    const preferredDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next: ThemeMode = preferredDark ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
  }, []);

  const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => {
        setTheme(nextTheme);
        applyTheme(nextTheme);
      }}
      aria-label="Ganti tema"
      title="Ganti tema"
    >
      {theme === "dark" ? <SunMedium size={16} /> : <Moon size={16} />}
    </Button>
  );
}
