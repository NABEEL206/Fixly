import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Sidebar from "../components/Sidebar/sidebar";


const isDesktop = () => window.innerWidth >= 768;

export default function Layout({ children }) {
  const [isOpen, setIsOpen] = useState(isDesktop());

  const toggleSidebar = () => setIsOpen((prev) => !prev);
  const closeSidebar = () => setIsOpen(false);

  useEffect(() => {
    const handleResize = () => {
      if (isDesktop()) setIsOpen(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar toggleSidebar={toggleSidebar} />

      {/* Sidebar */}
      <Sidebar isOpen={isOpen} closeSidebar={closeSidebar} />

      {/* Main content */}
      <main
        className={`pt-16 p-4 transition-all duration-300 min-h-screen ${
          isOpen ? "md:ml-64" : "md:ml-0"
        }`}
      >
        {children || <Outlet />}
      </main>

      {/* Mobile overlay */}
      {isOpen && !isDesktop() && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={closeSidebar}
        />
      )}
    </div>
  );
}