import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-white font-bold">Live Translator App</h1>
        <div>
          <Link to="/" className="text-white hover:underline">
            Live Translator
          </Link>
          <Link to="/transcriber" className="text-white hover:underline ml-4">
            File Transcriber
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
