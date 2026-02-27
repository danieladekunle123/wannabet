import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { GoogleOAuthProvider } from "@react-oauth/google";

createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId="743287490556-fa23eu8pmdicl8pp3c32chosjack7aqm.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>,
);
