"use client";

import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();

  const handleHomeClick = () => {
    router.push("/");
  };

  return (
    <header className="w-full py-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center">
          <button
            onClick={handleHomeClick}
            className="group transition-all duration-200 hover:scale-105"
          >
            <h1 className="text-4xl font-bold header-text mb-2 group-hover:text-opacity-80">
              Artorial
            </h1>
          </button>
        </div>
      </div>
    </header>
  );
}
