import { createRoot } from "react-dom/client";
import App from "./App";
import "./i18n";
import "./index.css";
import "./styles/responsive-overrides.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <GoogleOAuthProvider clientId="743287490556-fa23eu8pmdicl8pp3c32chosjack7aqm.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </BrowserRouter>,
);
