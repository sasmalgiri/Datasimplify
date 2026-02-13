import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-emerald-400 mb-4">404</div>
        <h1 className="text-2xl font-semibold text-white mb-2">Page not found</h1>
        <p className="text-gray-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
          >
            Go home
          </Link>
          <Link
            href="/live-dashboards"
            className="px-6 py-2.5 border border-gray-700 hover:border-gray-600 text-gray-300 font-medium rounded-lg transition-colors"
          >
            Dashboards
          </Link>
        </div>
      </div>
    </div>
  );
}
