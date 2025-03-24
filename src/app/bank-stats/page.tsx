"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";
import { DollarSign, BarChart2, Banknote, Search } from "lucide-react";

// Define TypeScript interface for user data
interface UserData {
  id: string;
  name?: string;
  accountNumber?: string;
  city?: string;
  state?: string;
  isAdmin?: boolean;
  investments?: { type: string; amount: number; interestRate?: number; date?: string }[];
  portfolio?: { investments?: { stockName?: string; amount: number }[] };
}

export default function BankStats() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [totalFDs, setTotalFDs] = useState(0);
  const [totalFDAmount, setTotalFDAmount] = useState(0);
  const [totalInvestments, setTotalInvestments] = useState(0);
  const [totalInvestmentAmount, setTotalInvestmentAmount] = useState(0);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
      } else {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const data = userDoc.data() as UserData | undefined;
        const userDataWithId = { id: user.uid, ...data };
        setUserData(userDataWithId);

        if (data?.isAdmin) {
          const usersSnapshot = await getDocs(collection(db, "users"));
          const usersList = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as UserData));
          setAllUsers(usersList);
          setFilteredUsers(usersList);

          let fdCount = 0;
          let fdAmount = 0;
          let invCount = 0;
          let invAmount = 0;

          usersList.forEach((user) => {
            if (user.investments) {
              user.investments.forEach((inv) => {
                if (inv.type === "Fixed Deposit") {
                  fdCount++;
                  fdAmount += inv.amount;
                }
              });
            }
            if (user.portfolio?.investments) {
              invCount += user.portfolio.investments.length;
              invAmount += user.portfolio.investments.reduce((sum, inv) => sum + inv.amount, 0);
            }
          });

          setTotalFDs(fdCount);
          setTotalFDAmount(fdAmount);
          setTotalInvestments(invCount);
          setTotalInvestmentAmount(invAmount);
        } else {
          // Non-admin: Safely handle optional investments and portfolio
          setTotalFDs(data?.investments?.filter((inv) => inv.type === "Fixed Deposit").length || 0);
          setTotalFDAmount(
            data?.investments?.reduce((sum, inv) => (inv.type === "Fixed Deposit" ? sum + inv.amount : sum), 0) || 0
          );
          setTotalInvestments(data?.portfolio?.investments?.length || 0);
          setTotalInvestmentAmount(data?.portfolio?.investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0);
        }
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    if (query === "") {
      setFilteredUsers(allUsers);
    } else {
      setFilteredUsers(
        allUsers.filter(
          (user) =>
            user.name?.toLowerCase().includes(query) ||
            user.accountNumber?.toLowerCase().includes(query) ||
            user.city?.toLowerCase().includes(query) ||
            user.state?.toLowerCase().includes(query)
        )
      );
    }
  };

  if (!userData || loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-screen text-zinc-600 dark:text-zinc-400"
      >
        Loading...
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900 p-6">
      <div className="max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center justify-center">
            <Banknote className="mr-3 text-primary" size={36} />
            Chandra Bank Statistics
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            {userData.isAdmin ? "Bank-wide overview and user details" : "Your personal banking stats"}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8"
        >
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg flex items-center space-x-4">
            <DollarSign className="text-primary" size={32} />
            <div>
              <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">Fixed Deposits</h2>
              <p className="text-zinc-700 dark:text-zinc-300">Total: {totalFDs}</p>
              <p className="text-zinc-700 dark:text-zinc-300">Amount: ₹{totalFDAmount.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg flex items-center space-x-4">
            <BarChart2 className="text-primary" size={32} />
            <div>
              <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">Investments</h2>
              <p className="text-zinc-700 dark:text-zinc-300">Total: {totalInvestments}</p>
              <p className="text-zinc-700 dark:text-zinc-300">Amount: ₹{totalInvestmentAmount.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        {userData.isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg"
          >
            <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100 mb-4">User Details</h2>

            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search by name, account number, or location..."
                className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-zinc-700 dark:text-zinc-300">
                <thead className="text-sm text-zinc-600 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-700">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Account Number</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Stocks</th>
                    <th className="px-4 py-3">FDs</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="border-b border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    >
                      <td className="px-4 py-3">{user.name || "N/A"}</td>
                      <td className="px-4 py-3">{user.accountNumber || "N/A"}</td>
                      <td className="px-4 py-3">{`${user.city || "N/A"}, ${user.state || "N/A"}`}</td>
                      <td className="px-4 py-3">
                        {user.portfolio?.investments?.length ? (
                          <ul className="list-disc list-inside">
                            {user.portfolio.investments.map((inv, idx) => (
                              <li key={idx}>
                                {inv.stockName || "Unknown"}: ₹{inv.amount.toLocaleString()}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          "None"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {user.investments?.filter((inv) => inv.type === "Fixed Deposit").length ? (
                          <ul className="list-disc list-inside">
                            {user.investments
                              .filter((inv) => inv.type === "Fixed Deposit")
                              .map((inv, idx) => (
                                <li key={idx}>
                                  ₹{inv.amount.toLocaleString()} ({inv.interestRate || 0}% -{" "}
                                  {new Date(inv.date || Date.now()).toLocaleDateString()})
                                </li>
                              ))}
                          </ul>
                        ) : (
                          "None"
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}