// src/pages/Index.tsx
import { Sidebar } from '@/components/Sidebar';


export type PageType = 'analytics' | 'candidates' | 'questions' | 'landing-page' | 'settings';

interface IndexProps {
    children: React.ReactNode;
}

const Index = ({ children }: IndexProps) => {
    return (
        <div className="min-h-screen bg-background font-inter">
            <div className="flex w-full">
                <Sidebar />
                <main className="flex-1 p-6 lg:p-8">
                    <div className="max-w-[1400px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Index;