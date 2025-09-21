import React from 'react';

const CommunityIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h8.25M8.25 12h5.25M5.25 6.75h.008v.008H5.25V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 5.25h.008v.008H5.625v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-2.625 5.25h13.5A2.25 2.25 0 0 0 18.75 18V6.75A2.25 2.25 0 0 0 16.5 4.5h-12A2.25 2.25 0 0 0 2.25 6.75v11.25a2.25 2.25 0 0 0 2.25 2.25Z" />
  </svg>
);

export default CommunityIcon;