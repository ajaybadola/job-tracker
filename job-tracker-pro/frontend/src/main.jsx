import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "react-oidc-context";

const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-west-1.amazonaws.com/us-west-1_kUvDNO3K2",
  client_id: "5fipvmst2f886tips7ft4d6t5l",
  redirect_uri: "http://localhost:5173",   // Must match EXACTLY what's in Cognito Console → App Client → Allowed Callback URLs
  response_type: "code",
  scope: "openid email",                   // openid MUST be first. Remove 'phone'/'profile' unless enabled in your User Pool.
  automaticSilentRenew: false,
  monitorSession: false,
  checkSessionIntervalInSeconds: 0,
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
);