import React, { useState } from 'react';
import EWalletAgentOverlay from '../components/EWalletAgentOverlay';

export default function EWalletAgentPage() {
  // Mock userData for the page
  const userData = { isEWalletAgent: true, username: 'Agent' };
  
  return (
    <div className="h-screen w-screen relative">
      <EWalletAgentOverlay onClose={() => window.location.href = '/'} userData={userData} />
    </div>
  );
}
