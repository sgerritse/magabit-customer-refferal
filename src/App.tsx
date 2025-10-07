import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import BrandAmbassador from "./pages/BrandAmbassador";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BrandAmbassador />} />
        <Route path="/customer-referral" element={<BrandAmbassador />} />
        <Route path="*" element={<BrandAmbassador />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
