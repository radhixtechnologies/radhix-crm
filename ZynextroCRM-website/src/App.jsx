import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Pricing from "./pages/Pricing";
import Terms from "./pages/TermsAndServices";
import Privacy from "./pages/PrivacyPolicy";
import Contact from "./pages/Contact";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-['Inter',sans-serif] text-slate-900 flex flex-col">
        <Header />
        <div className="grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about-us" element={<About />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/terms-and-services" element={<Terms />} />
            <Route path="/privacy-policy" element={<Privacy />} />
            <Route path="/contact-us" element={<Contact />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
