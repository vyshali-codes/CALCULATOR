import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import * as math from "mathjs";

console.log("Starting server.ts...");

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // In-memory history storage
  let calculationHistory: any[] = [];

  // API Route for Calculation
  app.post("/api/calculate", (req, res) => {
    console.log("Received calculation request:", req.body);
    const { num1, num2, operation, expression: rawExpression, angleUnit = "deg" } = req.body;

    let result: any;
    let displayExpression: string = "";

    try {
      // If a full expression is provided (for parentheses support)
      if (rawExpression) {
        const evalResult = math.evaluate(rawExpression);
        // Ensure result is a primitive (number or string)
        result = typeof evalResult === "number" ? evalResult : evalResult.toString();
        displayExpression = rawExpression;
      } else {
        const n1 = parseFloat(num1);
        const n2 = parseFloat(num2);

        if (isNaN(n1) && !["sin", "cos", "tan", "sqrt", "abs", "factorial"].includes(operation)) {
          return res.status(400).json({ error: "Please enter a valid number." });
        }

        let evalResult: any;
        const unitSuffix = angleUnit === "deg" ? " deg" : "";
        const unitSymbol = angleUnit === "deg" ? "°" : " rad";

        switch (operation) {
          case "+":
            evalResult = math.evaluate(`${n1} + ${n2}`);
            displayExpression = `${n1} + ${n2}`;
            break;
          case "-":
            evalResult = math.evaluate(`${n1} - ${n2}`);
            displayExpression = `${n1} - ${n2}`;
            break;
          case "*":
            evalResult = math.evaluate(`${n1} * ${n2}`);
            displayExpression = `${n1} × ${n2}`;
            break;
          case "/":
            if (n2 === 0) return res.status(400).json({ error: "Division by zero is not allowed." });
            evalResult = math.evaluate(`${n1} / ${n2}`);
            displayExpression = `${n1} ÷ ${n2}`;
            break;
          case "^":
            evalResult = math.evaluate(`${n1} ^ ${n2}`);
            displayExpression = `${n1} ^ ${n2}`;
            break;
          case "sqrt":
            evalResult = math.evaluate(`sqrt(${n1})`);
            displayExpression = `√(${n1})`;
            break;
          case "abs":
            evalResult = math.evaluate(`abs(${n1})`);
            displayExpression = `|${n1}|`;
            break;
          case "factorial":
            if (n1 < 0 || !Number.isInteger(n1)) return res.status(400).json({ error: "Factorial requires a non-negative integer." });
            evalResult = math.factorial(n1);
            displayExpression = `${n1}!`;
            break;
          case "percentage":
            evalResult = n1 / 100;
            displayExpression = `${n1}%`;
            break;
          case "sin":
            evalResult = math.evaluate(`sin(${n1}${unitSuffix})`);
            displayExpression = `sin(${n1}${unitSymbol})`;
            break;
          case "cos":
            evalResult = math.evaluate(`cos(${n1}${unitSuffix})`);
            displayExpression = `cos(${n1}${unitSymbol})`;
            break;
          case "tan":
            evalResult = math.evaluate(`tan(${n1}${unitSuffix})`);
            displayExpression = `tan(${n1}${unitSymbol})`;
            break;
          case "asin":
            evalResult = math.evaluate(`asin(${n1})`);
            if (angleUnit === "deg" && math.typeOf(evalResult) !== 'Complex') {
              evalResult = math.unit(evalResult, 'rad').toNumber('deg');
            }
            displayExpression = `asin(${n1})`;
            break;
          case "acos":
            evalResult = math.evaluate(`acos(${n1})`);
            if (angleUnit === "deg" && math.typeOf(evalResult) !== 'Complex') {
              evalResult = math.unit(evalResult, 'rad').toNumber('deg');
            }
            displayExpression = `acos(${n1})`;
            break;
          case "atan":
            evalResult = math.evaluate(`atan(${n1})`);
            if (angleUnit === "deg" && math.typeOf(evalResult) !== 'Complex') {
              evalResult = math.unit(evalResult, 'rad').toNumber('deg');
            }
            displayExpression = `atan(${n1})`;
            break;
          case "sinh":
            evalResult = math.evaluate(`sinh(${n1})`);
            displayExpression = `sinh(${n1})`;
            break;
          case "cosh":
            evalResult = math.evaluate(`cosh(${n1})`);
            displayExpression = `cosh(${n1})`;
            break;
          case "tanh":
            evalResult = math.evaluate(`tanh(${n1})`);
            displayExpression = `tanh(${n1})`;
            break;
          case "log":
            evalResult = math.evaluate(`log10(${n1})`);
            displayExpression = `log₁₀(${n1})`;
            break;
          case "ln":
            evalResult = math.evaluate(`log(${n1})`);
            displayExpression = `ln(${n1})`;
            break;
          case "exp":
            evalResult = math.evaluate(`exp(${n1})`);
            displayExpression = `e^(${n1})`;
            break;
          case "ceil":
            evalResult = math.evaluate(`ceil(${n1})`);
            displayExpression = `ceil(${n1})`;
            break;
          case "floor":
            evalResult = math.evaluate(`floor(${n1})`);
            displayExpression = `floor(${n1})`;
            break;
          case "mod":
            evalResult = math.evaluate(`${n1} % ${n2}`);
            displayExpression = `${n1} mod ${n2}`;
            break;
          case "round":
            evalResult = math.evaluate(`round(${n1})`);
            displayExpression = `round(${n1})`;
            break;
          case "cbrt":
            evalResult = math.evaluate(`cbrt(${n1})`);
            displayExpression = `∛(${n1})`;
            break;
          case "log2":
            evalResult = math.evaluate(`log2(${n1})`);
            displayExpression = `log₂(${n1})`;
            break;
          case "sign":
            evalResult = math.evaluate(`sign(${n1})`);
            displayExpression = `sign(${n1})`;
            break;
          default:
            return res.status(400).json({ error: "Invalid operation." });
        }
        result = typeof evalResult === "number" ? evalResult : evalResult.toString();
      }

      const historyItem = {
        id: Date.now(),
        expression: displayExpression,
        result,
        status: "success",
        timestamp: new Date().toLocaleTimeString()
      };

      calculationHistory.unshift(historyItem);
      if (calculationHistory.length > 10) calculationHistory.pop();

      res.json({ result, history: calculationHistory });
    } catch (err: any) {
      const errorMsg = err.message || "Calculation error.";
      
      // Store failed calculation in history too
      const historyItem = {
        id: Date.now(),
        expression: displayExpression || rawExpression || "Unknown",
        result: null,
        error: errorMsg,
        status: "error",
        timestamp: new Date().toLocaleTimeString()
      };
      
      calculationHistory.unshift(historyItem);
      if (calculationHistory.length > 10) calculationHistory.pop();

      res.status(400).json({ error: errorMsg, history: calculationHistory });
    }
  });

  app.get("/api/history", (req, res) => {
    res.json(calculationHistory);
  });

  app.delete("/api/history", (req, res) => {
    calculationHistory = [];
    res.json({ success: true });
  });

  // Catch-all for undefined API routes
  app.all("/api/*", (req, res) => {
    console.warn(`404 - API Route not found: ${req.method} ${req.url}`);
    res.status(404).json({ 
      error: "API endpoint not found",
      method: req.method,
      path: req.url 
    });
  });

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled Server Error:", err);
    res.status(500).json({ 
      error: "Internal Server Error",
      message: err.message 
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

startServer();
