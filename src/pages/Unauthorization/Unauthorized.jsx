// src/pages/Unauthorization/Unauthorized.jsx
import React from "react";
import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">403 - Unauthorized</h1>
        <p className="text-gray-600 mb-6">
          You do not have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <div className="space-y-3">
          <Link
            to="/login"
            className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
          >
            Go to Login
          </Link>
          <Link
            to="/"
            className="inline-block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition duration-200"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;