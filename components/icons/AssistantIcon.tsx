import React from 'react';

const AssistantIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a.375.375 0 0 1 .265-.112c.836-.061 1.649-.126 2.44-.201a9.006 9.006 0 0 0-2.707-3.228A5.98 5.98 0 0 0 18 9.75c0-1.26-.44-2.45-1.22-3.375a6.002 6.002 0 0 0-4.28-1.875 6.005 6.005 0 0 0-4.28 1.875A6.002 6.002 0 0 0 3.75 9.75c0 1.26.44 2.45 1.22 3.375a6.003 6.003 0 0 0 1.398 1.482Z" />
    </svg>
);

export default AssistantIcon;