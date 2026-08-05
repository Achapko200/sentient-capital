"use client";

import { useState, useEffect } from "react";

export type Theme = "dark" | "light";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme ?? "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
    document.body.setAttribute("data-theme", saved);
  }, []);

  const toggleTheme = (t: Theme) => {
    setTheme(t);
    localStorage.setItem("theme", t);
    document.documentElement.setAttribute("data-theme", t);
    document.body.setAttribute("data-theme", t);
  };

  return { theme, toggleTheme };
}
