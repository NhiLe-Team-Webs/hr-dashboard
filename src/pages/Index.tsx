// src/pages/Index.tsx
import { Sidebar } from '@/components/Sidebar';


export type PageType = 'analytics' | 'candidates' | 'questions' | 'landing-page' | 'settings';

interface IndexProps {
    children: React.ReactNode;
}

const Index = ({ children }: IndexProps) => {
    return (
        <div className="flex h-screen bg-[#f0f4f8] text-foreground font-sans overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col h-full overflow-hidden relative pt-4 pr-4 pb-4 pl-0">
                <div className="flex-1 overflow-y-auto overflow-x-hidden rounded-[2rem] lg:glass-panel lg:border lg:border-white/40 lg:bg-white/40 lg:shadow-inner scroll-smooth p-4 md:p-6 lg:p-8">
                    <div className="max-w-[1400px] mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Index;