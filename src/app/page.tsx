import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from gray-900 via-gray-900 to-gray-900 text-gray-100 p-4 sm:p-6">
      {/* Central Card Container with effects */}
      <div className="bg-gray-800/90 backdrop-blur-sm p-8 sm:p-10 rounded-xl shadow-2xl shadow-black/50 max-w-md w-full text-center flex flex-col items-center border border-gray-600 hover:border-blue-500 transition-all duration-500 transform hover:-translate-y-1 hover:scale-[1.01] group/card">
        {/* Chat Icon/Logo Area with floating animation */}
        <div className="mb-6 animate-float">
          <svg
            className="w-20 h-20 mx-auto text-blue-400 group-hover/card:text-blue-300 transition-colors duration-500"
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

        {/* Welcome Text with gradient */}
        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent mb-3">
          Welcome to Chatopia
        </h2>
        <p className="text-gray-300/90 text-lg mb-8 px-4">
          Connect with friends and colleagues instantly in dynamic chat rooms
        </p>

        {/* Login Button with effects */}
        <Link href="/login" passHref>
          <button className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-blue-500/40 hover:from-blue-500 hover:to-blue-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 text-lg group cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-6 h-6 mr-2 group-hover:rotate-12 transition-transform"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
              />
            </svg>
            Login
          </button>
        </Link>

        {/* OR Separator with animation */}
        <div className="flex items-center w-full my-6">
          <div className="flex-grow border-t border-gray-500/80 transition-all duration-500 group-hover/card:border-blue-500/30"></div>
          <span className="mx-4 text-gray-300/80 text-sm font-medium group-hover/card:text-blue-300 transition-colors duration-500">
            or
          </span>
          <div className="flex-grow border-t border-gray-500/80 transition-all duration-500 group-hover/card:border-blue-500/30"></div>
        </div>

        {/* Create Account Button with effects */}
        <Link href="/register" passHref>
          <button className="w-full flex items-center justify-center px-6 py-3 border border-gray-700 text-blue-400 font-semibold rounded-lg hover:bg-gray-700/50 hover:text-blue-300 hover:border-blue-400/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-800 text-lg group cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 mr-2 group-hover:scale-110 transition-transform"
            >
              <path
                fillRule="evenodd"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z"
                clipRule="evenodd"
              />
            </svg>
            Create Account
          </button>
        </Link>

        {/* Footer Text with animation */}
        <p className="text-gray-300/80 text-sm mt-8 animate-pulse hover:animate-none cursor-default">
          Join thousands of users managing their conversations with ChatApp
        </p>
      </div>
    </div>
  );
}