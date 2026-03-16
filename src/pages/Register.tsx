import { useState } from "react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-wheat-field.jpg";
import { useNavigate, useLocation } from "react-router-dom";
import { Wheat, CheckCircle, AlertCircle,Menu, X} from "lucide-react";
import {  User, Home, FlaskConical, LayoutDashboard, Cloud, Sprout, Bot, Sparkles, Info, Phone } from "lucide-react";

const Register = () => {
 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
    
  
    const navLinks = [
      { name: "Home", path: "/" ,icon: <Home className="h-4 w-4" />},
  
      { name: "About us", path: "/about",icon: <Info className="h-4 w-4" /> },
      { name: "Contact us", path: "/contact", icon: <Phone className="h-4 w-4" /> },
    ];
  
  
    const navigate = useNavigate();
    const location = useLocation();
    
    const isActive = (path: string) => location.pathname === path;

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    pin: "",
    confirmPin: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "warning";
    show: boolean;
  }>({ message: "", type: "success", show: false });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const showNotification = (
    message: string,
    type: "success" | "error" | "warning"
  ) => {
    setNotification({ message, type, show: true });
    setTimeout(() => {
      setNotification({ message: "", type: "success", show: false });
    }, 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate PINs match
    if (formData.pin !== formData.confirmPin) {
      showNotification("PINs do not match! Please try again.", "warning");
      setIsLoading(false);
      return;
    }

    // Validate PIN length
    if (formData.pin.length !== 6) {
      showNotification("PIN must be exactly 6 digits", "warning");
      setIsLoading(false);
      return;
    }

    // Validate phone number (basic Indian format)
    if (!/^(\+91|91)?[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, ""))) {
      showNotification("Please enter a valid Indian phone number", "warning");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          pin: formData.pin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showNotification(
          data.message || "Registration failed. Please try again.",
          "error"
        );
        setIsLoading(false);
        return;
      }

      // Show success notification
      showNotification("Registration successful! Redirecting to login...", "success");

      // Clear form
      setFormData({
        name: "",
        phone: "",
        pin: "",
        confirmPin: "",
      });

      // Navigate to login after delay
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      showNotification(
        "Network error. Please check your connection and try again.",
        "error"
      );
      setIsLoading(false);
    }
  };

  // Notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-6 w-6" />;
      case "warning":
        return <AlertCircle className="h-6 w-6" />;
      case "error":
        return (
          <div className="h-6 w-6 rounded-full bg-red-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">!</span>
          </div>
        );
      default:
        return null;
    }
  };

  // Notification background color based on type
  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200";
      case "warning":
        return "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200";
      case "error":
        return "bg-gradient-to-r from-red-50 to-rose-50 border-red-200";
      default:
        return "";
    }
  };

  // Notification text color based on type
  const getNotificationTextColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-800";
      case "warning":
        return "text-yellow-800";
      case "error":
        return "text-red-800";
      default:
        return "";
    }
  };

  // Notification icon color based on type
  const getNotificationIconColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "error":
        return "text-red-600";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Notification Toast */}
      {notification.show && (
        <div
          className={`fixed top-20 right-4 z-50 animate-slideIn ${getNotificationBgColor(
            notification.type
          )} border rounded-2xl shadow-xl max-w-md overflow-hidden transition-all duration-300`}
        >
          <div className="p-5">
            <div className="flex items-start">
              <div
                className={`flex-shrink-0 mr-3 ${getNotificationIconColor(
                  notification.type
                )}`}
              >
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1">
                <p
                  className={`font-semibold mb-1 ${getNotificationTextColor(
                    notification.type
                  )}`}
                >
                  {notification.type === "success"
                    ? "Success!"
                    : notification.type === "warning"
                    ? "Warning"
                    : "Error"}
                </p>
                <p className={`text-sm ${getNotificationTextColor(notification.type)}`}>
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => setNotification({ ...notification, show: false })}
                className={`ml-4 text-lg font-bold hover:opacity-70 ${getNotificationTextColor(
                  notification.type
                )}`}
              >
                ×
              </button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 w-full bg-gray-200">
            <div
              className={`h-full ${
                notification.type === "success"
                  ? "bg-green-500"
                  : notification.type === "warning"
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{
                animation: "progressBar 4s linear",
                animationFillMode: "forwards",
              }}
            />
          </div>
        </div>
      )}

     
      <header className="gradient-header sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary rounded-full p-2">
              <Wheat className="h-6 w-6 text-agri-yellow" />
            </div>
            <span className="font-heading font-bold text-xl text-primary">
              AGRILENS
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-medium transition-colors hover:text-primary ${
                  isActive(link.path)
                    ? "text-primary font-semibold"
                    : "text-foreground/80"
                }`}
              >
                <div className="flex items-center gap-2">
  {link.icon}
  {link.name}
</div>
              </Link>
            ))}
            
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-primary" />
            ) : (
              <Menu className="h-6 w-6 text-primary" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border/30 animate-fade-in">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`font-medium py-2 px-4 rounded-lg transition-colors ${
                    isActive(link.path)
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/80 hover:bg-secondary"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
             
            </div>
          </nav>
        )}
      </div>
    </header>

      {/* Main Content */}
      <main
        className="flex-1 relative bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-72px)]">
          <div className="w-full max-w-md">
            <div className="bg-card/95 backdrop-blur rounded-3xl p-8 shadow-2xl">
              {/* Title */}
              <div className="text-center mb-8">
                <span className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg font-heading font-bold text-2xl italic shadow-lg">
                  Register
                </span>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 XXX-XXX-XXXX"
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200"
                    required
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter a valid Indian mobile number
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    6-Digit PIN
                  </label>
                  <input
                    type="password"
                    name="pin"
                    value={formData.pin}
                    onChange={handleChange}
                    placeholder="●●●●●●"
                    maxLength={6}
                    pattern="\d{6}"
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200"
                    required
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Must be exactly 6 digits
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Confirm PIN
                  </label>
                  <input
                    type="password"
                    name="confirmPin"
                    value={formData.confirmPin}
                    onChange={handleChange}
                    placeholder="●●●●●●"
                    maxLength={6}
                    pattern="\d{6}"
                    className={`w-full px-4 py-3 rounded-lg border ${
                      formData.confirmPin && formData.pin !== formData.confirmPin
                        ? "border-red-500"
                        : "border-input"
                    } bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200`}
                    required
                    disabled={isLoading}
                  />
                  {formData.confirmPin && formData.pin !== formData.confirmPin && (
                    <p className="text-xs text-red-500 mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      PINs do not match
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-300 flex items-center justify-center ${
                    isLoading
                      ? "bg-primary/70 cursor-not-allowed"
                      : "bg-primary hover:bg-primary/90 hover:shadow-lg"
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating Account...
                    </>
                  ) : (
                    "Register Now"
                  )}
                </button>

                <p className="text-center text-sm text-muted-foreground pt-4">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-primary font-semibold hover:underline hover:text-primary/80 transition-colors duration-200"
                  >
                    Login
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Add CSS for animations */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes progressBar {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Register;