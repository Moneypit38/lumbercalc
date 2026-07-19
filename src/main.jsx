import React from "react";
import { createRoot } from "react-dom/client";
import LumberCalculator from "./LumberCalculator.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LumberCalculator />
  </React.StrictMode>
);
