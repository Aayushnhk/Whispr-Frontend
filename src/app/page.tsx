import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6 cursor-default">
      <div className="relative overflow-hidden bg-gray-800/80 backdrop-blur-lg p-8 sm:p-10 rounded-2xl shadow-2xl shadow-black/40 w-full max-w-md border border-gray-700 hover:border-blue-500/50 transition-all duration-300 group">
        {/* Animated background elements */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full filter blur-xl animate-float-slow"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-cyan-400/10 rounded-full filter blur-xl animate-float-slower"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          {/* Logo with better animation */}
          <div className="mb-6 w-24 h-24 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-400/20 p-4 shadow-inner shadow-black/30 group-hover:shadow-blue-500/20 transition-all duration-500">
            <svg
              className="w-16 h-16 text-blue-400 group-hover:text-cyan-300 transition-all duration-500 group-hover:scale-110"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>

          {/* Headline with better gradient */}
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent bg-size-200 animate-gradient">
              Welcome to Whispr
            </span>
          </h1>
          
          <p className="text-gray-300/90 text-lg mb-8 text-center leading-relaxed">
            Secure, real-time messaging with end-to-end encryption and seamless collaboration
          </p>

          {/* Buttons with improved styling */}
          <div className="w-full space-y-4">
            <Link href="/login" passHref>
              <button className="w-full relative overflow-hidden px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all duration-300 group/button cursor-pointer">
                <span className="relative z-10 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-5 h-5 mr-2 group-hover/button:translate-x-1 transition-transform rotate-180"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                    />
                  </svg>
                  Sign In
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-400 opacity-0 group-hover/button:opacity-100 transition-opacity duration-300"></span>
              </button>
            </Link>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-600/50 transition-all duration-500 group-hover:border-blue-500/30"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-sm font-medium group-hover:text-blue-300 transition-colors duration-300">
                New to Whispr?
              </span>
              <div className="flex-grow border-t border-gray-600/50 transition-all duration-500 group-hover:border-blue-500/30"></div>
            </div>

            <Link href="/register" passHref>
              <button className="w-full relative px-6 py-3.5 bg-gray-700/50 border border-gray-600 text-blue-400 font-semibold rounded-lg hover:bg-gray-700 hover:text-blue-300 hover:border-blue-400 transition-all duration-300 group/button cursor-pointer">
                <span className="relative z-10 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 mr-2 group-hover/button:scale-110 transition-transform"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Create Account
                </span>
                <span className="absolute inset-0 bg-gray-700/30 opacity-0 group-hover/button:opacity-100 transition-opacity duration-300 rounded-lg"></span>
              </button>
            </Link>
          </div>

          {/* Footer text with better animation */}
          <p className="text-gray-400/80 text-sm mt-8 text-center leading-snug">
            <span className="inline-block transition-all duration-300 hover:text-blue-300 hover:scale-105 cursor-default">
              Join thousands of users in secure, real-time conversations
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}