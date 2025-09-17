import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { esES } from "@clerk/localizations";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/desing-system/index.css";

// Vite uses import.meta.env.VITE_* for env vars
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as
  | string
  | undefined;

const rootEl = document.getElementById("root") as HTMLElement;

if (!PUBLISHABLE_KEY) {
  console.error("Missing VITE_CLERK_PUBLISHABLE_KEY in your environment.");
  createRoot(rootEl).render(
    <StrictMode>
      {/* Render app without Clerk or show a friendly message */}
      <div style={{ padding: 16, fontFamily: "system-ui" }}>
        <p>
          <strong>Clerk configuration missing.</strong>
        </p>
        <p>
          Please set VITE_CLERK_PUBLISHABLE_KEY in your frontend/.env.local.
        </p>
      </div>
    </StrictMode>
  );
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} localization={esES}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ClerkProvider>
    </StrictMode>
  );
}
