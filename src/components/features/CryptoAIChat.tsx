'use client';

import CryptoAIChatReal from './CryptoAIChatReal';

export function CryptoAIChat({ showBeginnerTips = true }: { showBeginnerTips?: boolean }) {
  return <CryptoAIChatReal showBeginnerTips={showBeginnerTips} />;
}

export default CryptoAIChat;
