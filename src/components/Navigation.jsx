"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { logoutSuccess } from "@/redux/reducer/userReducer";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const pathname = usePathname();
  const { isAuth } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const router = useRouter();

  if (!isAuth) return null;

  const logoutHandler = () => {
    Cookies.remove("token", { path: "/" });
    dispatch(logoutSuccess());
    router.push("/login");
  };

  const navItems = [
    { name: "Organization", path: "/chart" },
    { name: "Departments", path: "/chatbot" },
    { name: "AI Assistant", path: "/ai-chat" },
  ];

  return (
    <div className="bg-white border-b border-gray-200 py-4 px-6 mb-6">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center space-x-1">
          <Link href="/chart" className="text-xl font-bold text-blue-600 mr-8">
            ReeOrg
          </Link>
          
          <nav className="flex space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === item.path
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        
        <Button variant="destructive" onClick={logoutHandler} size="sm">
          Logout
        </Button>
      </div>
    </div>
  );
}