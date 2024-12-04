import { Link } from "react-router-dom";
import { useState } from "react";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-white font-bold">Live Translator App</h1>
        
        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:flex">
          <Link to="/" className="text-white hover:underline">
            Live Translator
          </Link>
          <Link to="/transcriber" className="text-white hover:underline ml-4">
            File Transcriber
          </Link>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} transition-all duration-300`}>
        <div className="flex flex-col items-center space-y-4 pt-4">
          <Link to="/" className="text-white hover:underline">
            Live Translator
          </Link>
          <Link to="/transcriber" className="text-white hover:underline">
            File Transcriber
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;