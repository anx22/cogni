import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import { DialogProvider } from "./components/dialog/DialogProvider";
import { ManualOverridesProvider } from "./lib/dialog/manualOverrides";
import DevLogPanel from "./components/devlog/DevLogPanel";
import { attachGlobalErrorHandlers, devlog } from "./lib/devlog/devlog";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    attachGlobalErrorHandlers();
    devlog.ui("App mounted");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ManualOverridesProvider>
            <DialogProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </DialogProvider>
          </ManualOverridesProvider>
          <DevLogPanel />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
