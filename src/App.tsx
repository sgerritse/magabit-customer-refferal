import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CustomerReferral from "./pages/CustomerReferral";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <BrowserRouter>
      <Routes>
        <Route path="/customer-referral" element={<CustomerReferral />} />
        <Route path="/" element={<CustomerReferral />} />
        <Route path="*" element={<CustomerReferral />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
