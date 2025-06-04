import { createRoot } from "react-dom/client";
import App from "./App-simple";
import "./index.css";

// Add global CSS for RTL layout and fontface
const style = document.createElement('style');
style.textContent = `
  body {
    font-family: 'Rubik', sans-serif;
  }
  
  /* Custom scrollbar styles */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  ::-webkit-scrollbar-thumb {
    background: #3466ad;
    border-radius: 3px;
  }
`;
document.head.appendChild(style);

createRoot(document.getElementById("root")!).render(<App />);
