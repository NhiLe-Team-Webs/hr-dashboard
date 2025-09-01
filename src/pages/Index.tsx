import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { CandidateList } from '@/components/CandidateList';
import { Analytics } from '@/components/Analytics';
import { QuestionEditor } from '@/components/QuestionEditor';
import { LandingPageEditor } from '@/components/LandingPageEditor';

export type PageType = 'analytics' | 'candidates' | 'questions' | 'landing-page' | 'settings';

const Index = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('candidates');

  const renderPage = () => {
    switch (currentPage) {
      case 'analytics':
        return <Analytics />;
      case 'candidates':
        return <CandidateList />;
      case 'questions':
        return <QuestionEditor />;
      case 'landing-page':
        return <LandingPageEditor />;
      default:
        return <CandidateList />;
    }
  };

  return (
    <div className="min-h-screen bg-background font-inter">
      <div className="flex w-full">
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
        
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;