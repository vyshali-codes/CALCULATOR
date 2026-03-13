import React, { useState, useEffect, useRef } from "react";
import { Calculator, Divide, Minus, Plus, X, RotateCcw, History, Trash2, Copy, Check, Moon, Sun, Parentheses, Percent, Hash } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HistoryItem {
  id: number;
  expression: string;
  result: number | null;
  error?: string;
  status: "success" | "error";
  timestamp: string;
}

const HistoryCard: React.FC<{ item: HistoryItem; colors: any }> = ({ item, colors }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 ${item.status === 'error' ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20' : colors.input} rounded-2xl border ${colors.border} hover:border-[#3B82F6] transition-all group relative overflow-hidden`}
    >
      {item.status === 'error' && (
        <div className="absolute top-0 right-0 p-2 opacity-20">
          <Hash className="w-4 h-4 text-red-500" />
        </div>
      )}
      <div className="flex justify-between items-start mb-1">
        <span className={`text-[10px] font-bold ${item.status === 'error' ? 'text-red-400' : colors.secondary} uppercase tracking-tighter`}>
          {item.timestamp}
        </span>
      </div>
      <div className={`${item.status === 'error' ? 'text-red-700 dark:text-red-300' : colors.secondary} text-sm font-medium mb-1`}>
        {item.expression} =
      </div>
      {item.status === 'error' ? (
        <div className="text-red-500 text-xs font-bold italic">
          Error: {item.error}
        </div>
      ) : (
        <div className={`${colors.text} text-xl font-bold`}>
          {item.result !== null ? item.result.toLocaleString(undefined, { maximumFractionDigits: 8 }) : 'N/A'}
        </div>
      )}
    </motion.div>
  );
};

export default function App() {
  const [num1, setNum1] = useState<string>("");
  const [num2, setNum2] = useState<string>("");
  const [operation, setOperation] = useState<string>("+");
  const [expression, setExpression] = useState<string>("");
  const [isManualMode, setIsManualMode] = useState<boolean>(false);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [angleUnit, setAngleUnit] = useState<"deg" | "rad">("deg");

  const num1Ref = useRef<HTMLInputElement>(null);
  const num2Ref = useRef<HTMLInputElement>(null);
  const exprRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check API health
    fetch("/api/health")
      .then(res => res.json())
      .then(data => console.log("API Health:", data))
      .catch(err => console.error("API Health Check Failed:", err));

    fetchHistory();
    // Load theme from local storage
    const savedTheme = localStorage.getItem("calculator-theme") as "light" | "dark";
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem("calculator-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/history");
      const contentType = response.headers.get("content-type");
      
      if (response.ok && contentType && contentType.includes("application/json")) {
        const data = await response.json();
        setHistory(data);
      } else {
        const text = await response.text();
        console.error("History fetch failed. Status:", response.status, "Content-Type:", contentType, "Body:", text.substring(0, 100));
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const clearHistory = async () => {
    try {
      await fetch("/api/history", { method: "DELETE" });
      setHistory([]);
    } catch (err) {
      console.error("Failed to clear history", err);
    }
  };

  const handleCalculate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const sciRegex = /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/;

    try {
      // Client-side validation
      if (isManualMode) {
        if (!expression.trim()) {
          throw new Error("Please enter an expression.");
        }
      } else {
        if (!num1.trim() || !sciRegex.test(num1.trim())) {
          throw new Error("Please enter a valid first number (e.g. 1.23 or 1.2e3).");
        }

        if (!isScientific && (!num2.trim() || !sciRegex.test(num2.trim()))) {
          throw new Error("Please enter a valid second number.");
        }

        const n1 = parseFloat(num1);
        const n2 = parseFloat(num2);

        // Specific validation for division by zero
        if (operation === "/" && n2 === 0) {
          throw new Error("Division by zero is not allowed.");
        }

        // Specific validation for factorial
        if (operation === "factorial") {
          if (n1 < 0) throw new Error("Factorial requires a non-negative number.");
          if (!Number.isInteger(n1)) throw new Error("Factorial requires an integer.");
        }
      }

      const payload = isManualMode 
        ? { expression } 
        : { num1, num2, operation, angleUnit };

      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Calculation failed. Status:", response.status, "Content-Type:", contentType, "Body:", text.substring(0, 100));
        throw new Error(`Server returned non-JSON response: ${response.status}`);
      }

      const data = await response.json();
      if (data.history) setHistory(data.history);

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setResult(data.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setNum1("");
    setNum2("");
    setExpression("");
    setOperation("+");
    setResult(null);
    setError(null);
    if (isManualMode) exprRef.current?.focus();
    else num1Ref.current?.focus();
  };

  const copyToClipboard = () => {
    if (result !== null) {
      navigator.clipboard.writeText(result.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = document.activeElement?.tagName === "INPUT";

      if (e.key === "Enter") {
        e.preventDefault();
        handleCalculate();
      } else if (e.key === "Escape") {
        e.preventDefault();
        reset();
      } else if (!isInput) {
        if (e.key === "+") setOperation("+");
        else if (e.key === "-") setOperation("-");
        else if (e.key === "*") setOperation("*");
        else if (e.key === "/") setOperation("/");
        else if (e.key === "^") setOperation("^");
        else if (e.key >= "0" && e.key <= "9") {
          if (isManualMode) exprRef.current?.focus();
          else if (!num1) num1Ref.current?.focus();
          else if (!num2) num2Ref.current?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [num1, num2, operation, expression, isManualMode]);

  const formatResult = (val: any) => {
    if (typeof val !== 'number') return val;
    if (Math.abs(val) > 1e12 || (Math.abs(val) < 1e-7 && val !== 0)) {
      return val.toExponential(6);
    }
    return val.toLocaleString(undefined, { maximumFractionDigits: 10 });
  };

  const isScientific = ["sqrt", "sin", "cos", "tan", "abs", "factorial", "percentage", "asin", "acos", "atan", "sinh", "cosh", "tanh", "log", "ln", "exp", "ceil", "floor", "round", "cbrt", "log2", "sign"].includes(operation);
  const isTrig = ["sin", "cos", "tan", "asin", "acos", "atan"].includes(operation);

  // Auto-recalculate when angle unit changes for trig operations
  useEffect(() => {
    if (isTrig && result !== null && !loading) {
      handleCalculate(new Event('submit') as any);
    }
  }, [angleUnit]);

  const colors = {
    bg: theme === "light" ? "bg-[#F7F8FA]" : "bg-[#0F172A]",
    text: theme === "light" ? "text-[#1F2933]" : "text-[#E5E7EB]",
    accent: "bg-[#3B82F6]",
    accentHover: "hover:bg-[#2563EB]",
    secondary: theme === "light" ? "text-[#64748B]" : "text-[#94A3B8]",
    card: theme === "light" ? "bg-[#FFFFFF]" : "bg-[#1E293B]",
    border: theme === "light" ? "border-[#E2E8F0]" : "border-[#334155]",
    input: theme === "light" ? "bg-[#F1F5F9]" : "bg-[#0F172A]",
    btn: theme === "light" ? "bg-[#F1F5F9] hover:bg-[#E2E8F0]" : "bg-[#334155] hover:bg-[#475569]",
  };

  return (
    <div className={`min-h-screen ${colors.bg} ${colors.text} flex items-center justify-center p-4 font-sans transition-colors duration-300`}>
      <div className={`w-full max-w-5xl grid grid-cols-1 ${showHistory ? 'lg:grid-cols-4' : 'lg:grid-cols-1'} gap-6 transition-all duration-500`}>
        
        {/* Main Calculator */}
        <motion.div 
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${showHistory ? 'lg:col-span-3' : 'lg:col-span-1'} ${colors.card} rounded-3xl shadow-xl overflow-hidden border ${colors.border}`}
        >
          {/* Header */}
          <div className="bg-[#1F2933] p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`${colors.accent} p-2 rounded-xl`}>
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight">Pro Scientific Calculator</h1>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="p-2 hover:bg-white/10 rounded-full transition-all hover:scale-110 active:scale-95"
                title="Toggle Theme"
              >
                {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => setIsManualMode(!isManualMode)}
                className={`p-2 rounded-full transition-all hover:scale-110 active:scale-95 ${isManualMode ? colors.accent : "hover:bg-white/10"}`}
                title="Manual Expression Mode"
              >
                <Parentheses className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowHistory(true)}
                className={`p-2 rounded-full transition-all hover:scale-110 active:scale-95 ${showHistory ? colors.accent : "hover:bg-white/10"}`}
                title="View History"
              >
                <History className="w-5 h-5" />
              </button>
              <button 
                onClick={reset}
                className="p-2 hover:bg-white/10 rounded-full transition-all hover:scale-110 active:scale-95"
                title="Reset (Esc)"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleCalculate} className="p-8 space-y-6">
            {isManualMode ? (
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider ${colors.secondary} ml-1`}>
                  Expression (Parentheses supported)
                </label>
                <input
                  ref={exprRef}
                  type="text"
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  placeholder="e.g. (2 + 3) * 4"
                  className={`w-full px-5 py-4 ${colors.input} border ${colors.border} rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] transition-all text-lg font-medium ${colors.text}`}
                  required
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={`text-xs font-bold uppercase tracking-wider ${colors.secondary} ml-1`}>
                    {isScientific ? "Value" : "First Number"}
                  </label>
                  <div className="relative">
                    <input
                      ref={num1Ref}
                      type="text"
                      value={num1}
                      onChange={(e) => setNum1(e.target.value)}
                      placeholder="0.00 (e.g. 1.2e3)"
                      className={`w-full px-5 py-4 ${colors.input} border ${colors.border} rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] transition-all text-lg font-medium ${colors.text} pr-16`}
                      required
                    />
                    {isTrig && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={angleUnit}
                        className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-blue-500/20 shadow-sm"
                      >
                        {angleUnit}
                      </motion.div>
                    )}
                  </div>
                </div>

                {!isScientific && (
                  <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase tracking-wider ${colors.secondary} ml-1`}>
                      Second Number
                    </label>
                    <input
                      ref={num2Ref}
                      type="text"
                      value={num2}
                      onChange={(e) => setNum2(e.target.value)}
                      placeholder="0.00"
                      className={`w-full px-5 py-4 ${colors.input} border ${colors.border} rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] transition-all text-lg font-medium ${colors.text}`}
                      required
                    />
                  </div>
                )}
              </div>
            )}

            {!isManualMode && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <label className={`text-xs font-bold uppercase tracking-wider ${colors.secondary} ml-1`}>
                    Operation
                  </label>
                  <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-xl border border-gray-300 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setAngleUnit("deg")}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        angleUnit === "deg" 
                          ? "bg-blue-600 text-white shadow-lg scale-105" 
                          : `${colors.secondary} hover:text-blue-500`
                      }`}
                    >
                      Degrees
                    </button>
                    <button
                      type="button"
                      onClick={() => setAngleUnit("rad")}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        angleUnit === "rad" 
                          ? "bg-purple-600 text-white shadow-lg scale-105" 
                          : `${colors.secondary} hover:text-purple-500`
                      }`}
                    >
                      Radians
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {[
                    { id: "+", label: "+" },
                    { id: "-", label: "-" },
                    { id: "*", label: "×" },
                    { id: "/", label: "÷" },
                    { id: "^", label: "xʸ" },
                    { id: "sqrt", label: "√" },
                    { id: "abs", label: "|x|" },
                    { id: "factorial", label: "n!" },
                    { id: "percentage", label: "%" },
                    { id: "sin", label: "sin" },
                    { id: "cos", label: "cos" },
                    { id: "tan", label: "tan" },
                    { id: "asin", label: "asin" },
                    { id: "acos", label: "acos" },
                    { id: "atan", label: "atan" },
                    { id: "sinh", label: "sinh" },
                    { id: "cosh", label: "cosh" },
                    { id: "tanh", label: "tanh" },
                    { id: "log", label: "log₁₀" },
                    { id: "ln", label: "ln" },
                    { id: "exp", label: "eˣ" },
                    { id: "ceil", label: "ceil" },
                    { id: "floor", label: "floor" },
                    { id: "mod", label: "mod" },
                    { id: "round", label: "round" },
                    { id: "cbrt", label: "∛" },
                    { id: "log2", label: "log₂" },
                    { id: "sign", label: "sign" },
                  ].map((op) => (
                    <motion.button
                      key={op.id}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setOperation(op.id)}
                      className={`flex items-center justify-center py-3 rounded-xl transition-all font-medium text-sm hover:shadow-lg ${
                        operation === op.id
                          ? "bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/30"
                          : `${colors.btn} ${colors.secondary} border ${colors.border} hover:border-[#3B82F6] hover:text-[#3B82F6] hover:bg-opacity-80`
                      }`}
                    >
                      {op.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-5 bg-[#1F2933] text-white rounded-2xl font-bold text-lg hover:bg-[#2D3748] hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md`}
            >
              {loading ? "Calculating..." : "Calculate (Enter)"}
            </motion.button>
          </form>

          {/* Result Section */}
          <AnimatePresence mode="wait">
            {(result !== null || error) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`border-t ${colors.border} ${colors.input} overflow-hidden`}
              >
                <div className="result-card relative group">
                  {error ? (
                    <div className="text-red-500 font-medium bg-red-50 dark:bg-red-900/20 py-3 px-4 rounded-xl border border-red-100 dark:border-red-900/30">
                      {error}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <p className={`expression-label ${colors.secondary}`}>
                        Result {["sin", "cos", "tan", "asin", "acos", "atan"].includes(operation) ? `(${angleUnit === 'deg' ? 'Degrees' : 'Radians'})` : ""}
                      </p>
                      <div className="w-full relative">
                        <span className={`result-number ${colors.text}`}>
                          {formatResult(result)}
                        </span>
                        
                        <div className="mt-4 flex justify-center">
                          <motion.button
                            onClick={copyToClipboard}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            animate={copied ? { scale: [1, 1.2, 1], backgroundColor: theme === "light" ? "#D1FAE5" : "#064E3B" } : {}}
                            transition={{ duration: 0.3 }}
                            className={`p-2 rounded-lg ${colors.input} border ${colors.border} hover:border-[#3B82F6] transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2 text-xs font-medium ${colors.secondary}`}
                            title="Copy Result"
                          >
                            {copied ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-500" />
                                <motion.span 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="text-emerald-500"
                                >
                                  Copied!
                                </motion.span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>Copy Result</span>
                              </>
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Full Screen History View */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
            >
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowHistory(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
              />
              
              <motion.div 
                layoutId="history-modal"
                className={`relative w-full max-w-4xl h-full max-h-[85vh] ${colors.card} rounded-[2.5rem] shadow-2xl border ${colors.border} flex flex-col overflow-hidden`}
              >
                <div className={`${colors.input} p-8 border-b ${colors.border} flex items-center justify-between`}>
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-500/10 p-3 rounded-2xl">
                      <History className="w-8 h-8 text-[#3B82F6]" />
                    </div>
                    <div>
                      <h2 className={`text-2xl font-black uppercase tracking-tighter ${colors.text}`}>Calculation History</h2>
                      <p className={`text-xs ${colors.secondary} font-medium`}>Your recent mathematical journeys</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {history.length > 0 && (
                      <button 
                        onClick={clearHistory}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all font-bold text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear All
                      </button>
                    )}
                    <button 
                      onClick={() => setShowHistory(false)}
                      className={`p-3 ${colors.btn} rounded-2xl transition-all hover:rotate-90`}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8">
                  {history.length === 0 ? (
                    <div className={`h-full flex flex-col items-center justify-center ${colors.secondary} space-y-6 py-20`}>
                      <div className="p-8 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse">
                        <History className="w-16 h-16 opacity-10" />
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold italic mb-1">The void is silent...</p>
                        <p className="text-sm opacity-60">No recent calculations found</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {history.map((item) => (
                        <HistoryCard key={item.id} item={item} colors={colors} />
                      ))}
                    </div>
                  )}
                </div>

                <div className={`p-6 border-t ${colors.border} ${colors.input} flex justify-center`}>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="px-8 py-3 bg-[#1F2933] text-white rounded-xl font-bold hover:scale-105 transition-all shadow-lg"
                  >
                    Back to Calculator
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
