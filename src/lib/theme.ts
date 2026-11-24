import { useEffect } from "react";
import { STORAGE_KEY, type ThemePref } from "./store";

/** Runs before paint so the saved theme never flashes. */
export const THEME_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem('${STORAGE_KEY}')||'{}');var t=(s.settings&&s.settings.theme)||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export function useApplyTheme(pref: ThemePref, ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = pref === "dark" || (pref === "system" && media.matches);
      document.documentElement.classList.toggle("dark", dark);
    };
    apply();
    if (pref !== "system") return;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [pref, ready]);
}
