export default function FailurePage() {
  return (
    <div className="bg-gray-100 px-4 pt-32 pb-12 min-h-screen">
      <div className="bg-white border border-red-200 shadow-xl rounded-xl p-12 w-full max-w-3xl mx-auto flex gap-8 items-center">
        <div className="flex-shrink-0">
          <svg
            className="text-red-500"
            xmlns="http://www.w3.org/2000/svg"
            width="80"
            height="80"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-red-600 mb-3">Payment Failed</h1>
          <p className="text-gray-700 text-lg mb-6">
            Unfortunately, your payment could not be completed. Please try again or contact support if the issue persists.
          </p>
          <div className="flex gap-4">
            <a
              href="/users/subscribe"
              className="bg-red-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-red-700 transition"
            >
              Try Again
            </a>
            <a
              href="/"
              className="bg-gray-200 text-gray-700 font-medium px-6 py-3 rounded-lg hover:bg-gray-300 transition"
            >
              Return Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
