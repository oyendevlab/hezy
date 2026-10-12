import { useSyncExternalStore } from "react";

const KEY = "hezy:onboarded";
const EVENT = "hezy-onboarded";

function read(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    // Storan disekat: anggap sudah dilihat supaya pengenalan tidak muncul setiap kali.
    return true;
  }
}

const subscribe = (listener: () => void) => {
  window.addEventListener(EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener("storage", listener);
  };
};

/** Pengenalan sudah dilihat (atau dilangkau). Pelayan: `true` supaya tiada kelipan. */
export function useOnboarded(): boolean {
  return useSyncExternalStore(subscribe, read, () => true);
}

export function markOnboarded() {
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    // Storan disekat: pengenalan ditutup untuk sesi ini sahaja.
  }
  window.dispatchEvent(new Event(EVENT));
}
