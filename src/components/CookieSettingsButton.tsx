'use client';

export function CookieSettingsButton() {
  const handleClick = () => {
    if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).showCookieSettings) {
      ((window as unknown as Record<string, () => void>).showCookieSettings)();
    } else {
      alert('Cookie settings are managed through your browser settings. Analytics cookies require consent (EU/UK).');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="hover:text-white cursor-pointer underline"
    >
      Cookie Settings
    </button>
  );
}
