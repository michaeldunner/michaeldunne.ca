import "./App.css";
import { ThemeProvider } from "./components/ui/theme-provider";
import { MySidebar } from "./components/ui/my-sidebar";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <MySidebar />
    </ThemeProvider>
  );
}

export default App;
