"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ShieldCheck, LogIn, UserPlus } from "lucide-react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) router.push("/dashboard");
    });
    return () => unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <ShieldCheck 
                className="text-blue-500 dark:text-blue-400" 
                size={64} 
                strokeWidth={1.5} 
              />
            </div>
            <h1 className="text-4xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600 dark:from-blue-400 dark:to-green-400">
              Chandra Bank
            </h1>
            <p className="text-lg mb-8 text-gray-600 dark:text-gray-300">
              Secure, Smart, Simple Banking
            </p>
            
            <div className="space-y-4">
              <button
                onClick={() => router.push("/login")}
                className="w-full flex items-center justify-center gap-2 bg-blue-500 dark:bg-blue-700 text-white py-3 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-800 transition-all duration-300 ease-in-out transform hover:scale-[1.02] shadow-md hover:shadow-lg"
              >
                <LogIn size={20} />
                Log In
              </button>
              <button
                onClick={() => router.push("/signup")}
                className="w-full flex items-center justify-center gap-2 bg-green-500 dark:bg-green-700 text-white py-3 rounded-lg hover:bg-green-600 dark:hover:bg-green-800 transition-all duration-300 ease-in-out transform hover:scale-[1.02] shadow-md hover:shadow-lg"
              >
                <UserPlus size={20} />
                Sign Up
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900 p-4 text-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
            Secured with Bank-Grade Encryption
          </div>
        </div>
        
        <div className="text-center mt-6 text-gray-500 dark:text-gray-400">
          <p className="text-sm">
            © {new Date().getFullYear()} Chandra Bank. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

