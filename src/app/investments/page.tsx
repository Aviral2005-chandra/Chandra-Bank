"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { CandlestickController, CandlestickElement } from "chartjs-chart-financial";
import { Chart } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import { BarChart2, Wallet, TrendingUp } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  CandlestickController,
  CandlestickElement
);

export default function Investments() {
  const [userData, setUserData] = useState<any>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [selectedStock, setSelectedStock] = useState("TCS.BSE");
  const [stockData, setStockData] = useState<any[]>([]);
  const [view, setView] = useState<"24h" | "1y">("24h"); // Toggle between 24h and 1y
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Simulated stock prices for 20 Indian stocks
  const indianStocks = [
    "TCS.BSE", "RELIANCE.BSE", "HDFCBANK.BSE", "INFY.BSE", "ICICIBANK.BSE",
    "SBIN.BSE", "HINDUNILVR.BSE", "BAJFINANCE.BSE", "KOTAKBANK.BSE", "BHARTIARTL.BSE",
    "ASIANPAINT.BSE", "ITC.BSE", "AXISBANK.BSE", "MARUTI.BSE", "LT.BSE",
    "SUNPHARMA.BSE", "TITAN.BSE", "ULTRACEMCO.BSE", "NESTLEIND.BSE", "WIPRO.BSE"
  ];

  // Mock trending stocks data
  const trendingStocks = [
    { symbol: "RELIANCE.BSE", change: 2.5 },
    { symbol: "INFY.BSE", change: -1.2 },
    { symbol: "HDFCBANK.BSE", change: 1.8 },
    { symbol: "SBIN.BSE", change: 3.1 },
  ];

  // Simulated initial stock prices
  const [simulatedPrices, setSimulatedPrices] = useState<{ [key: string]: number }>(
    indianStocks.reduce((acc, stock) => ({ ...acc, [stock]: Math.random() * 2000 + 1000 }), {})
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
      } else {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const data = userDoc.data();
        setUserData({
          id: user.uid,
          ...data,
          portfolio: data?.portfolio || { balance: 0, investments: [] },
        });
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Simulate stock price updates and chart data
  useEffect(() => {
    const updateStockPrices = () => {
      setSimulatedPrices((prev) => {
        const newPrices = { ...prev };
        indianStocks.forEach((stock) => {
          const change = (Math.random() - 0.5) * 10; // Random fluctuation between -5 and +5
          newPrices[stock] = Math.max(100, prev[stock] + change);
        });
        return newPrices;
      });

      const currentPrice = simulatedPrices[selectedStock];
      const now = new Date();
      setStockData((prev) => {
        if (view === "24h") {
          const timestamp = now.toISOString();
          const newData = [...prev.slice(-1439), { // 1440 minutes = 24 hours
            t: timestamp,
            o: currentPrice * 0.98,
            h: currentPrice * 1.02,
            l: currentPrice * 0.96,
            c: currentPrice,
          }];
          return newData;
        } else {
          const timestamp = now.toISOString().split("T")[0];
          const newData = [...prev.slice(-364), { // 365 days = 1 year
            t: timestamp,
            o: currentPrice * 0.95,
            h: currentPrice * 1.05,
            l: currentPrice * 0.90,
            c: currentPrice,
          }];
          return newData;
        }
      });
    };

    // Initial data setup
    const generateInitialData = () => {
      const now = Date.now();
      if (view === "24h") {
        return Array(1440).fill(0).map((_, i) => {
          const timestamp = new Date(now - (1439 - i) * 60 * 1000).toISOString();
          const basePrice = simulatedPrices[selectedStock];
          const close = basePrice + (Math.random() - 0.5) * 10;
          return {
            t: timestamp,
            o: basePrice * 0.98,
            h: basePrice * 1.02,
            l: basePrice * 0.96,
            c: close,
          };
        });
      } else {
        return Array(365).fill(0).map((_, i) => {
          const timestamp = new Date(now - (364 - i) * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
          const basePrice = simulatedPrices[selectedStock] * (1 + (i / 365) * (Math.random() - 0.5) * 0.5); // Simulate yearly growth
          const close = basePrice + (Math.random() - 0.5) * 50;
          return {
            t: timestamp,
            o: basePrice * 0.95,
            h: basePrice * 1.05,
            l: basePrice * 0.90,
            c: close,
          };
        });
      }
    };

    setStockData(generateInitialData());
    const interval = setInterval(updateStockPrices, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [selectedStock, view]);

  const candlestickChartData = {
    datasets: [
      {
        label: `${selectedStock} Stock Price`,
        data: stockData,
        borderColor: (context: any) => {
          const data = context.dataset.data[context.dataIndex];
          return data.c > data.o ? "green" : "red"; // Green for profit, red for loss
        },
        backgroundColor: (context: any) => {
          const data = context.dataset.data[context.dataIndex];
          return data.c > data.o ? "rgba(0, 255, 0, 0.2)" : "rgba(255, 0, 0, 0.2)"; // Green for profit, red for loss
        },
      },
    ],
  };

  const candlestickOptions = {
    responsive: true,
    scales: {
      x: {
        type: "time" as const,
        time: { unit: view === "24h" ? "minute" as const : "day" as const },
      },
      y: { title: { display: true, text: "Price (₹)" } },
    },
    plugins: {
      legend: { display: true },
      title: { display: true, text: `${selectedStock} Stock Price (${view === "24h" ? "24 Hours" : "1 Year"})` },
    },
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (!userData || amount <= 0 || amount > userData.balance) {
      setError("Invalid amount or insufficient balance");
      return;
    }

    const updatedPortfolio = {
      balance: (userData.portfolio?.balance || 0) + amount,
      investments: userData.portfolio?.investments || [],
    };

    await updateDoc(doc(db, "users", userData.id), {
      balance: userData.balance - amount,
      portfolio: updatedPortfolio,
      transactions: arrayUnion({
        type: "Portfolio Deposit",
        amount,
        from: userData.accountNumber,
        to: "Portfolio",
        date: new Date().toISOString(),
      }),
    });

    setUserData({
      ...userData,
      balance: userData.balance - amount,
      portfolio: updatedPortfolio,
      transactions: [
        ...(userData.transactions || []),
        { type: "Portfolio Deposit", amount, from: userData.accountNumber, to: "Portfolio", date: new Date().toISOString() },
      ],
    });
    setDepositAmount("");
    setError("");
    alert("Deposit successful!");
  };

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(investmentAmount);
    if (!userData || amount <= 0 || amount > (userData.portfolio?.balance || 0)) {
      setError("Invalid amount or insufficient portfolio balance");
      return;
    }

    const investment = {
      stock: selectedStock,
      amount,
      date: new Date().toISOString(),
      status: "Active",
    };

    const updatedPortfolio = {
      balance: (userData.portfolio?.balance || 0) - amount,
      investments: [...(userData.portfolio?.investments || []), investment],
    };

    await updateDoc(doc(db, "users", userData.id), {
      portfolio: updatedPortfolio,
      transactions: arrayUnion({
        type: "Investment",
        amount,
        from: "Portfolio",
        to: selectedStock,
        date: new Date().toISOString(),
      }),
    });

    setUserData({
      ...userData,
      portfolio: updatedPortfolio,
      transactions: [
        ...(userData.transactions || []),
        { type: "Investment", amount, from: "Portfolio", to: selectedStock, date: new Date().toISOString() },
      ],
    });
    setInvestmentAmount("");
    setError("");
    alert("Investment successful!");
  };

  if (!userData) return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-zinc-600 dark:text-zinc-400">Loading...</motion.div>;

  return (
    <div className="flex-grow p-8 zinc-bg min-h-screen relative overflow-hidden">
      <svg className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" viewBox="0 0 1440 900">
        <path fill="var(--primary)" d="M0,224L80,240C160,256,320,288,480,277.3C640,267,800,213,960,197.3C1120,181,1280,203,1360,213.3L1440,224L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z" />
      </svg>

      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-6xl mx-auto relative z-10"
      >
        <h1 className="text-5xl font-bold text-zinc-800 dark:text-zinc-100 mb-10 tracking-tight text-center flex items-center justify-center">
          <BarChart2 className="mr-4" size={40} /> Investment Hub
        </h1>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-2xl mb-10"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-semibold text-zinc-800 dark:text-zinc-100 flex items-center">
              <BarChart2 className="mr-2" size={28} /> Market Trends
            </h2>
            <div className="flex items-center space-x-4">
              <select
                value={selectedStock}
                onChange={(e) => setSelectedStock(e.target.value)}
                className="border border-zinc-300 dark:border-zinc-700 px-4 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {indianStocks.map((stock) => (
                  <option key={stock} value={stock}>{stock.split(".")[0]}</option>
                ))}
              </select>
              <div className="flex space-x-2">
                <button
                  onClick={() => setView("24h")}
                  className={`px-4 py-2 rounded-lg ${view === "24h" ? "bg-primary text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100"}`}
                >
                  24 Hours
                </button>
                <button
                  onClick={() => setView("1y")}
                  className={`px-4 py-2 rounded-lg ${view === "1y" ? "bg-primary text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100"}`}
                >
                  1 Year
                </button>
              </div>
            </div>
          </div>
          {loading ? (
            <p className="text-zinc-700 dark:text-zinc-300 text-center">Loading stock data...</p>
          ) : error ? (
            <p className="text-red-500 text-center">{error}</p>
          ) : (
            <Chart type="candlestick" data={candlestickChartData} options={candlestickOptions} />
          )}
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
            Current Price: ₹{simulatedPrices[selectedStock].toFixed(2)} (Updates every minute)
          </p>
        </motion.div>

        {/* Trending Stocks Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-2xl mb-10"
        >
          <h2 className="text-3xl font-semibold text-zinc-800 dark:text-zinc-100 mb-6 flex items-center">
            <TrendingUp className="mr-2" size={28} /> Trending Stocks
          </h2>
          <ul className="space-y-4">
            {trendingStocks.map((stock, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`flex justify-between items-center text-zinc-700 dark:text-zinc-300 ${
                  stock.change >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                <span>{stock.symbol.split(".")[0]}</span>
                <span>{stock.change >= 0 ? "+" : ""}{stock.change}%</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-xl flex flex-col items-center"
          >
            <Wallet className="text-primary mb-4" size={40} />
            <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100 mb-4">Deposit to Portfolio</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form onSubmit={handleDeposit} className="w-full">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">Amount (₹)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full border border-zinc-300 dark:border-zinc-700 px-4 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="w-full bg-primary text-white py-3 rounded-lg shadow-md hover:bg-blue-600 transition-colors"
              >
                Deposit
              </motion.button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-xl flex flex-col items-center"
          >
            <BarChart2 className="text-primary mb-4" size={40} />
            <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100 mb-4">Invest in Stock</h2>
            <form onSubmit={handleInvest} className="w-full">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">Amount (₹)</label>
                <input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  className="w-full border border-zinc-300 dark:border-zinc-700 px-4 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="w-full bg-primary text-white py-3 rounded-lg shadow-md hover:bg-blue-600 transition-colors"
              >
                Invest
              </motion.button>
            </form>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-2xl"
        >
          <h2 className="text-3xl font-semibold text-zinc-800 dark:text-zinc-100 mb-6 flex items-center">
            <Wallet className="mr-2" size={28} /> Your Portfolio
          </h2>
          <p className="text-lg text-zinc-700 dark:text-zinc-300 mb-4">
            Portfolio Balance: ₹{(userData.portfolio?.balance || 0).toLocaleString()}
          </p>
          <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 mb-4">Stock Investments</h3>
          {userData.portfolio?.investments?.length ? (
            <ul className="space-y-4">
              {userData.portfolio.investments.map((inv: any, index: number) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700 pb-2 flex items-center"
                >
                  <BarChart2 className="mr-2" size={20} /> Invested ₹{inv.amount.toLocaleString()} in {inv.stock} on{" "}
                  {new Date(inv.date).toLocaleString()}
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="text-zinc-700 dark:text-zinc-300">No investments yet.</p>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}