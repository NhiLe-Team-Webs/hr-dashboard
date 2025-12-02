// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Analytics from "./components/Analytics";
import CandidateList from "./components/CandidateList";
import QuestionEditor from "./components/QuestionEditor/QuestionEditor";
import LandingPageEditor from "./components/LandingPageEditor";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
                <AuthProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/" element={<ProtectedRoute><Index><Analytics /></Index></ProtectedRoute>} />
                        <Route path="/analytics" element={<ProtectedRoute><Index><Analytics /></Index></ProtectedRoute>} />
                        <Route path="/candidates" element={<ProtectedRoute><Index><CandidateList /></Index></ProtectedRoute>} />
                        <Route path="/questions" element={<ProtectedRoute><Index><QuestionEditor /></Index></ProtectedRoute>} />
                        <Route path="/landing-page" element={<ProtectedRoute><Index><LandingPageEditor /></Index></ProtectedRoute>} />
                        {/* Redirect old assessments route to questions */}
                        <Route path="/assessments" element={<Navigate to="/questions" replace />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </AuthProvider>
            </BrowserRouter>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;