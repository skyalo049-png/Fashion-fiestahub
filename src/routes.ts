import { createBrowserRouter } from "react-router";
import Store from "./pages/Store";
import Admin from "./pages/Admin";

export const router = createBrowserRouter([
  { path: "/", Component: Store },
  { path: "/admin", Component: Admin },
]);
