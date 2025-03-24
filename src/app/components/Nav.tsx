"use client";

import { useRouter } from "next/navigation";
import { auth } from "@/firebase";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { motion } from "framer-motion";
import { LogIn, UserPlus, Home, CreditCard, BarChart2, DollarSign, Banknote, LogOut } from "lucide-react";

export default function Nav() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setIsAdmin(user?.email === "aviralchandra2005@gmail.com");
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
    setIsMobileMenuOpen(false);
  };

  const navVariants = {
    hover: { scale: 1.05, color: "var(--accent)" },
    tap: { scale: 0.95 },
  };

  const navItems = !isLoggedIn ? (
    <>
      <motion.li variants={navVariants} whileHover="hover" whileTap="tap">
        <button
          onClick={() => router.push("/login")}
          className="flex items-center w-full text-primary hover:text-accent font-medium py-2 px-4 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
        >
          <LogIn className="mr-3" size={20} /> Login
        </button>
      </motion.li>
      <motion.li variants={navVariants} whileHover="hover" whileTap="tap">
        <button
          onClick={() => router.push("/signup")}
          className="flex items-center w-full text-primary hover:text-accent font-medium py-2 px-4 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
        >
          <UserPlus className="mr-3" size={20} /> Sign Up
        </button>
      </motion.li>
    </>
  ) : (
    <>
      <motion.li variants={navVariants} whileHover="hover" whileTap="tap">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center w-full text-primary hover:text-accent font-medium py-2 px-4 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
        >
          <Home className="mr-3" size={20} /> Dashboard
        </button>
      </motion.li>
      <motion.li variants={navVariants} whileHover="hover" whileTap="tap">
        <button
          onClick={() => router.push("/cards")}
          className="flex items-center w-full text-primary hover:text-accent font-medium py-2 px-4 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
        >
          <CreditCard className="mr-3" size={20} /> Cards
        </button>
      </motion.li>
      <motion.li variants={navVariants} whileHover="hover" whileTap="tap">
        <button
          onClick={() => router.push("/investments")}
          className="flex items-center w-full text-primary hover:text-accent font-medium py-2 px-4 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
        >
          <BarChart2 className="mr-3" size={20} /> Investments
        </button>
      </motion.li>
      <motion.li variants={navVariants} whileHover="hover" whileTap="tap">
        <button
          onClick={() => router.push("/fixed-deposit")}
          className="flex items-center w-full text-primary hover:text-accent font-medium py-2 px-4 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
        >
          <DollarSign className="mr-3" size={20} /> Fixed Deposit
        </button>
      </motion.li>
      {isAdmin && (
        <motion.li variants={navVariants} whileHover="hover" whileTap="tap">
          <button
            onClick={() => router.push("/bank-stats")}
            className="flex items-center w-full text-primary hover:text-accent font-medium py-2 px-4 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <Banknote className="mr-3" size={20} /> Bank Stats
          </button>
        </motion.li>
      )}
      {isAdmin && (
        <motion.li variants={navVariants} whileHover="hover" whileTap="tap">
          <button
            onClick={() => router.push("/admin")}
            className="flex items-center w-full text-primary hover:text-accent font-medium py-2 px-4 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <UserPlus className="mr-3" size={20} /> Admin Panel
          </button>
        </motion.li>
      )}
      <motion.li variants={navVariants} whileHover="hover" whileTap="tap">
        <button
          onClick={handleLogout}
          className="flex items-center w-full text-red-500 hover:text-red-600 font-medium py-2 px-4 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
        >
          <LogOut className="mr-3" size={20} /> Logout
        </button>
      </motion.li>
    </>
  );

  return (
    <nav className="bg-white dark:bg-zinc-800 p-4 shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center">   

        {/* Hamburger Menu for Mobile */}
        <button
          className="md:hidden text-primary focus:outline-none p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            ></path>
          </svg>
        </button>

        {/* Desktop Navigation */}
        <ul className="hidden md:flex space-x-6 justify-center items-center">
          {navItems}
        </ul>

        {/* Mobile Navigation */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: isMobileMenuOpen ? 1 : 0, height: isMobileMenuOpen ? "auto" : 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-zinc-800 shadow-lg rounded-b-xl overflow-hidden"
        >
          <ul className="flex flex-col space-y-2 p-4">
            {navItems}
          </ul>
        </motion.div>
      </div>
    </nav>
  );
}