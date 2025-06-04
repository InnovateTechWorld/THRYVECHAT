import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground"> {/* Changed bg-gray-100 to bg-background, added text-foreground */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-4">Oops! Page not found</p> {/* Changed text-gray-600 to text-muted-foreground */}
        <a href="/" className="text-primary hover:text-primary/80 underline"> {/* Changed to primary color */}
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
