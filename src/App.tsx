import "./App.css";
import { ThemeProvider } from "./components/ui/theme-provider";
import { MySidebar } from "./components/ui/my-sidebar";
import { Route, Routes } from "react-router-dom";
import Home from "./components/ui/home";
import Pool from "./components/ui/pool";
import Rref from "./components/ui/rref";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Routes>
        <Route path="/" element={<MySidebar />}>
          <Route index element={<Home />} />
          <Route path="pool" element={<Pool />} />
          <Route path="rref" element={<Rref />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
