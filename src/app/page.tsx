"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) router.push("/dashboard");
    });
    return () => unsubscribe();
  }, [router]);

  return (
    <div className="flex items-center justify-center flex-grow">
      <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-100">Welcome to Chandra Bank of India</h2>
        <p className="text-lg mb-6 text-gray-600 dark:text-gray-300">
          Manage your finances securely. Please log in or sign up to get started.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push("/login")}
            className="bg-blue-500 dark:bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-800 transition-colors"
          >
            Login
          </button>
          <button
            onClick={() => router.push("/signup")}
            className="bg-green-500 dark:bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-600 dark:hover:bg-green-800 transition-colors"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}