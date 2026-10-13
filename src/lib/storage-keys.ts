/** Kunci localStorage dan skrip tema. Tanpa kebergantungan React supaya boleh diimport oleh Server Component. */

export const PREFS_KEY = "hezy:prefs:v1";

/**
 * Skrip sebaris untuk `<head>`: pasang tema dan bahasa tersimpan sebelum halaman dilukis, dan
 * tandakan `data-welcome` bagi pengguna baharu di "/" (skrin alu-aluan statik; navigasi disembunyikan).
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(PREFS_KEY)})||"{}");if(p.theme==="light"||p.theme==="dark")document.documentElement.setAttribute("data-theme",p.theme);if(p.lang==="en")document.documentElement.lang="en";if(!p.current&&location.pathname==="/")document.documentElement.setAttribute("data-welcome","")}catch(e){}})()`;
