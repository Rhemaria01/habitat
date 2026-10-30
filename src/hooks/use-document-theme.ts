"use client";

import { useSyncExternalStore } from "react";

function readTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function subscribe(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

export function useDocumentTheme(): "light" | "dark" {
  return useSyncExternalStore(subscribe, readTheme, () => "dark");
}
