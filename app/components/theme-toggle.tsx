"use client";

export function ThemeToggle() {
  function toggleTheme() {
    const root = document.documentElement;
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = nextTheme;
    localStorage.setItem("podium-theme", nextTheme);
  }

  return <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label="Toggle light and dark theme">◐</button>;
}
