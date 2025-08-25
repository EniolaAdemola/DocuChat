import React from 'react';
import { DocumentQAApp } from '../components/DocumentQAApp';
import { ErrorBoundary } from '../components/ErrorBoundary';

const Index = () => {
  return (
    <ErrorBoundary>
      <DocumentQAApp />
    </ErrorBoundary>
  );
};

export default Index;
