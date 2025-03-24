"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDocs, collection } from "firebase/firestore";
import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [accountType, setAccountType] = useState("Savings");
  const [error, setError] = useState("");
  const router = useRouter();

  const generateUniqueAccountNumber = async () => {
    const accountsSnapshot = await getDocs(collection(db, "users"));
    const existingAccounts = accountsSnapshot.docs.map((doc) => doc.data().accountNumber);
    let accountNumber;
    do {
      accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    } while (existingAccounts.includes(accountNumber));
    return accountNumber;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const accountNumber = await generateUniqueAccountNumber();

      const userData = {
        name,
        email: user.email,
        city,
        state,
        accountType,
        accountNumber,
        isAdmin: email === "aviralchandra2005@gmail.com", // Consider using custom claims for production
        balance: 0,
        transactions: [],
      };

      console.log("Data to be saved:", userData); // Debugging

      await setDoc(doc(db, "users", user.uid), userData);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-white dark:bg-zinc-800 p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-md"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center mb-6">
          <UserPlus className="mr-2 text-primary" size={28} />
          Sign Up
        </h2>
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">State</label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Account Type</label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
            >
              <option value="Savings">Savings</option>
              <option value="Current">Current</option>
            </select>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full bg-green-500 dark:bg-green-600 text-white py-2 rounded-lg shadow-md hover:bg-green-600 dark:hover:bg-green-700 transition-colors text-sm sm:text-base"
          >
            Sign Up
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}