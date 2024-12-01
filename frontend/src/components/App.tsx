import { Routes, Route } from "react-router-dom";
import Navbar from "./Navbar";
import Home from "./home-page-components/Home";
import Transcriber from "./transcriber-page-components/Transcriber";

function App() {
  return (
    <>
      <Navbar />
      <div className="container mx-auto p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/transcriber" element={<Transcriber />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
