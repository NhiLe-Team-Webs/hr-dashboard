// src/components/Router.tsx
import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Analytics from './Analytics';
import CandidateList from './CandidateList';
import QuestionEditor from './QuestionEditor';
import LandingPageEditor from './LandingPageEditor';
import NotFound from '../pages/NotFound';
import { PageType } from '../pages/Index';

const Router = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<PageType>('candidates');

  const onPageChange = (page: PageType) => {
    setCurrentPage(page);
    // Use navigate to change the URL based on the selected page
    navigate(`/${page}`);
  };

  return (
    <Routes>
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/candidates" element={<CandidateList />} />
      <Route path="/questions" element={<QuestionEditor />} />
      <Route path="/landing-page" element={<LandingPageEditor />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default Router;