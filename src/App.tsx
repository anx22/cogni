import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Project from "./pages/Project.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import OrbLab from "./pages/OrbLab.tsx";
import PipelineHealth from "./pages/PipelineHealth.tsx";
import { DialogProvider } from "./components/dialog/DialogProvider";
import { ManualOverridesProvider } from "./lib/dialog/manualOverrides";
import DevLogPanel from "./components/devlog/DevLogPanel";
import { attachGlobalErrorHandlers, devlog } from "./lib/devlog/devlog";
import { attachPipelineSink } from "./lib/devlog/pipelineSink";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    attachGlobalErrorHandlers();
    attachPipelineSink();
    // Cogni-Theme: data-theme am <html>, aus localStorage hydrieren (Default: day).
    const stored = (() => {
      try { return window.localStorage.getItem("cogniTheme"); } catch { return null; }
    })();
    const theme = stored === "night" || stored === "day" ? stored : "day";
    document.documentElement.setAttribute("data-theme", theme);
    devlog.ui("App mounted");
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ManualOverridesProvider>
              <DialogProvider>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/projekt/:id" element={<Project />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/orb-lab" element={<OrbLab />} />
                  <Route path="/pipeline-health" element={<PipelineHealth />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </DialogProvider>
            </ManualOverridesProvider>
            <DevLogPanel />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
