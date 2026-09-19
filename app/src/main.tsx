import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { initSupabase } from "./lib/supabase";
import "./index.css";

const root = document.getElementById("root")!;

function showBootError(message: string) {
  root.innerHTML = `<div style="font-family:system-ui;padding:2rem;max-width:28rem;margin:0 auto"><h1 style="color:#0f3a5f">MyPainter app</h1><p style="color:#b91c1c;margin-top:1rem">${message}</p><p style="margin-top:1rem;font-size:0.875rem;color:#64748b">Set <strong>VITE_SUPABASE_ANON_KEY</strong> in Cloudflare Pages → Settings → Environment variables, then redeploy.</p></div>`;
}

initSupabase()
  .then(() => {
    createRoot(root).render(
      <StrictMode>
        <BrowserRouter basename="/app">
          <App />
        </BrowserRouter>
      </StrictMode>,
    );
  })
  .catch((e) => {
    showBootError(e instanceof Error ? e.message : "Could not connect to database");
  });
