import React from 'react';

const ChallengesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-6.75c-.621 0-1.125.504-1.125 1.125v3.375m9 0h-9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15V9h6v6m-6 0h6m-6 0H6.75a1.5 1.5 0 01-1.5-1.5V9.75a1.5 1.5 0 011.5-1.5H9m6 0h2.25a1.5 1.5 0 011.5 1.5V13.5a1.5 1.5 0 01-1.5 1.5H15m-6 0h6" />
  </svg>
);

export default ChallengesIcon;