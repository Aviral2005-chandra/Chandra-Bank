"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { CreditCard, PlusCircle, ChevronLeft, ChevronRight } from "lucide-react";

export default function Cards() {
  const [userData, setUserData] = useState<any>(null);
  const [cardType, setCardType] = useState("Credit");
  const [cardNetwork, setCardNetwork] = useState("Visa");
  const [error, setError] = useState("");
  const [currentCardIndex, setCurrentCardIndex] = useState(0); // For switching cards
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
      } else {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        setUserData({ id: user.uid, ...userDoc.data() });
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleRequestCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    const cardRequest = {
      type: cardType,
      network: cardNetwork,
      status: "Pending",
      requestedDate: new Date().toISOString(),
    };

    try {
      await updateDoc(doc(db, "users", userData.id), {
        cardRequests: arrayUnion(cardRequest),
      });
      setUserData({
        ...userData,
        cardRequests: [...(userData.cardRequests || []), cardRequest],
      });
      setError("");
      alert("Card request submitted successfully!");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getExpiryDate = (dateAdded: string) => {
    const date = new Date(dateAdded);
    date.setFullYear(date.getFullYear() + 2);
    return `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear().toString().slice(-2)}`;
  };

  const handlePrevCard = () => {
    setCurrentCardIndex((prev) => (prev > 0 ? prev - 1 : userData.cards.length - 1));
  };

  const handleNextCard = () => {
    setCurrentCardIndex((prev) => (prev < userData.cards.length - 1 ? prev + 1 : 0));
  };

  if (!userData) return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center min-h-screen text-zinc-600 dark:text-zinc-400"
    >
      Loading...
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center font-poppins">
            <CreditCard className="mr-2 text-primary" size={28} />
            Your Cards
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1 bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg"
          >
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 flex items-center mb-4 font-poppins">
              <PlusCircle className="mr-2 text-primary" size={24} />
              Request a New Card
            </h2>
            {error && <p className="text-red-500 mb-4 text-sm font-roboto">{error}</p>}
            <form onSubmit={handleRequestCard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 font-roboto">
                  Card Type
                </label>
                <select
                  value={cardType}
                  onChange={(e) => setCardType(e.target.value)}
                  className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary font-roboto"
                >
                  <option value="Credit">Credit</option>
                  <option value="Debit">Debit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 font-roboto">
                  Card Network
                </label>
                <select
                  value={cardNetwork}
                  onChange={(e) => setCardNetwork(e.target.value)}
                  className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary font-roboto"
                >
                  <option value="Visa">Visa</option>
                  <option value="Rupay">Rupay</option>
                </select>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="w-full bg-primary text-white py-2 rounded-lg shadow-md hover:bg-blue-600 transition-colors font-poppins"
              >
                Request Card
              </motion.button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2 bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg"
          >
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 flex items-center mb-4 font-poppins">
              <CreditCard className="mr-2 text-primary" size={24} />
              Your Active Cards
            </h2>
            {userData.cards?.length ? (
              <div className="relative">
                {/* Card Display */}
                <motion.div
                  key={currentCardIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="relative bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-700 p-6 rounded-xl shadow-xl text-white h-56 w-full max-w-md mx-auto flex flex-col justify-between border border-gray-600"
                  style={{ fontFamily: "Roboto, sans-serif" }}
                >
                  {/* Chip */}
                  <div className="absolute top-6 left-6 w-12 h-8 bg-yellow-300 rounded-md shadow-inner"></div>

                  {/* Card Network */}
                  <div className="absolute top-4 right-4 text-lg font-bold font-poppins">
                    {userData.cards[currentCardIndex].network || "N/A"}
                  </div>

                  {/* Card Number */}
                  <div className="mt-16 text-xl tracking-widest font-roboto">
                    {userData.cards[currentCardIndex].number.match(/.{1,4}/g)?.join(" ") || userData.cards[currentCardIndex].number}
                  </div>

                  {/* Expiry and Name */}
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs uppercase text-gray-300 font-roboto">Expires</p>
                      <p className="text-base font-roboto">{getExpiryDate(userData.cards[currentCardIndex].dateAdded)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase text-gray-300 font-roboto">Cardholder</p>
                      <p className="text-base font-roboto">{userData.name || "N/A"}</p>
                    </div>
                  </div>

                  {/* Card Type */}
                  <div className="absolute bottom-4 left-6 text-xs uppercase text-gray-300 font-poppins">
                    {userData.cards[currentCardIndex].type}
                  </div>
                </motion.div>

                {/* Navigation Arrows (visible if more than one card) */}
                {userData.cards.length > 1 && (
                  <div className="flex justify-between mt-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handlePrevCard}
                      className="text-primary hover:text-accent"
                    >
                      <ChevronLeft size={24} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleNextCard}
                      className="text-primary hover:text-accent"
                    >
                      <ChevronRight size={24} />
                    </motion.button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-zinc-700 dark:text-zinc-300 font-roboto">No cards added yet.</p>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-6 bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg"
        >
          <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 flex items-center mb-4 font-poppins">
            <CreditCard className="mr-2 text-primary" size={24} />
            Card Requests
          </h2>
          {userData.cardRequests?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-zinc-700 dark:text-zinc-300 font-roboto">
                <thead className="text-sm text-zinc-600 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-700">
                  <tr>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Network</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Requested Date</th>
                  </tr>
                </thead>
                <tbody>
                  {userData.cardRequests.map((request: any, index: number) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="border-b border-zinc-200 dark:border-zinc-700"
                    >
                      <td className="px-4 py-2">{request.type}</td>
                      <td className="px-4 py-2">{request.network}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            request.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          }`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">{new Date(request.requestedDate).toLocaleDateString()}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-zinc-700 dark:text-zinc-300 font-roboto">No card requests yet.</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}