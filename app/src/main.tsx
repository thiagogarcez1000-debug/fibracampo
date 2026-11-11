import { createRoot } from "react-dom/client";
import { App } from "./App";

createRoot(document.getElementById("raiz")!).render(<App />);

if ("serviceWorker" in navigator) {
  addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
