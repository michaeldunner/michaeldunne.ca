import "./App.css";
import { ThemeProvider } from "./components/ui/theme-provider";
import { MySidebar } from "./components/ui/my-sidebar";
import { Route, Routes } from "react-router-dom";
import Home from "./components/ui/home";
import Pool from "./components/ui/pool";
import { RREF } from "./components/ui/rref";
import { PDF } from "./components/ui/pdf";
import Choreo from "./components/ui/choreo";
import LinkedInPuzzles from "./components/ui/linkedin";
import TriviaBuzzer, { TriviaHost } from "./components/ui/trivia";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Routes>
        <Route path="/" element={<MySidebar />}>
          <Route index element={<Home />} />
          <Route path="pool" element={<Pool />} />
          <Route path="rref" element={<RREF />} />
          <Route path="pdf" element={<PDF />} />
          <Route path="choreo" element={<Choreo />} />
          <Route path="linkedin-puzzles" element={<LinkedInPuzzles />} />
          <Route path="trivia-buzzer" element={<TriviaBuzzer />} />
          <Route path="trivia-buzzer/host" element={<TriviaHost />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
