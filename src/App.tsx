// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Analytics from "./components/Analytics";
import CandidateList from "./components/CandidateList";
import QuestionEditor from "./components/QuestionEditor";
import LandingPageEditor from "./components/LandingPageEditor";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Index><Analytics /></Index>} />
                    <Route path="/analytics" element={<Index><Analytics /></Index>} />
                    <Route path="/candidates" element={<Index><CandidateList /></Index>} />
                    <Route path="/questions" element={<Index><QuestionEditor /></Index>} />
                    <Route path="/landing-page" element={<Index><LandingPageEditor /></Index>} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;