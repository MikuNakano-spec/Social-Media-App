export default function SuccessPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-green-50">
      <div className="bg-white shadow-lg rounded-2xl p-10 text-center max-w-md">
        <svg
          className="mx-auto mb-4 text-green-500"
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <h1 className="text-2xl font-bold text-green-600 mb-2">Payment Successful</h1>
        <p className="text-gray-600 mb-6">Thank you! Your payment has been processed successfully.</p>
        <a
          href="/"
          className="inline-block bg-green-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-green-700 transition"
        >
          Go to Home
        </a>
      </div>
    </div>
  );
}
