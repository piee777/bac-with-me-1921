import React from 'react';

const HomeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.953-8.953a.75.75 0 0 1 1.06 0L21.75 12M3 10.5V21A.75.75 0 0 0 3.75 21H8.25v-5.25a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v5.25H19.5a.75.75 0 0 0 .75-.75V10.5M19.5 9l-7.5-7.5-7.5 7.5" />
  </svg>
);

export default HomeIcon;