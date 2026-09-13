import { createRoot } from "react-dom/client";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { Toaster } from "sonner";
import QueryProvider from "./context/query-provider.tsx";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <QueryProvider>
    <NuqsAdapter>
      <App />
    </NuqsAdapter>
    <Toaster />
  </QueryProvider>
);
