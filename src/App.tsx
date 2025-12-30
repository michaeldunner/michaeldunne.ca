import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { ThemeProvider } from "./components/ui/theme-provider";
import { EncryptedText } from "./components/ui/encrypted-text";
import { MySidebar } from "./components/ui/my-sidebar";

function App() {
  const [count, setCount] = useState(0);

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <MySidebar />
    </ThemeProvider>
  );
}

export default App;
