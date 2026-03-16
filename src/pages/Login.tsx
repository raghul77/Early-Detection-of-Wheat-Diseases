import { useState } from "react";
import { Link, useNavigate,useLocation } from "react-router-dom";
import { Wheat, CheckCircle, Info ,Menu, X} from "lucide-react";
import farmerTech from "@/assets/farmer-tech-illustration.png";
import farmerField from "@/assets/farmer-field.jpg";
import { User, Home, FlaskConical, LayoutDashboard, Cloud, Sprout, Bot, Sparkles, Phone } from "lucide-react";



const Login = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  

  const navLinks = [
    { name: "Home", path: "/" ,icon: <Home className="h-4 w-4" />},
    { name: "About us", path: "/about", icon: <Info className="h-4 w-4" /> },
    { name: "Contact us", path: "/contact" ,icon: <Phone className="h-4 w-4" />},
  ];


  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const message = location.state?.message;

  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
    show: boolean;
  }>({ message: "", type: "success", show: false });

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type, show: true });
    setTimeout(() => {
      setNotification({ message: "", type: "success", show: false });
    }, 3000);
  };


  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setIsLoading(true);

  //   try {
  //     const res = await fetch("http://localhost:5000/api/auth/login", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ phone, pin }),
  //     });

  //     const data = await res.json();

  //     if (!res.ok) {
  //       showNotification(data.message || "Login failed", "error");
  //       setIsLoading(false);
  //       return;
  //     }

  //     localStorage.setItem("user", JSON.stringify(data));
  //     showNotification("Login successful! Redirecting...", "success");

  //     setTimeout(() => {
  //       navigate("/model");
  //     }, 1500);
  //   } catch {
  //     showNotification("Network error. Please try again.", "error");
  //     setIsLoading(false);
  //   }
  // };
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, pin }),
    });

    const data = await res.json();

    if (!res.ok) {
      showNotification(data.message || "Login failed", "error");
      setIsLoading(false);
      return;
    }

    // ✅ Store token separately
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    showNotification("Login successful! Redirecting...", "success");

    setTimeout(() => {
      navigate("/model");
    }, 1500);
  } catch {
    showNotification("Network error. Please try again.", "error");
    setIsLoading(false);
  }
};


  return (
    <div className="min-h-screen flex flex-col">

      {/* Notification Toast */}
      {notification.show && (
        <div
          className={`fixed top-20 right-4 z-50 animate-slideIn ${
            notification.type === "success"
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          } border rounded-xl shadow-lg max-w-md`}
        >
          <div className="flex items-center p-4">
            <div
              className={`mr-3 ${
                notification.type === "success"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {notification.type === "success" ? (
                <CheckCircle className="h-6 w-6" />
              ) : (
                <span className="text-lg font-bold">!</span>
              )}
            </div>
            <p className="font-medium">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      {/* <header className="gradient-header py-4">
        <div className="container mx-auto px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary rounded-full p-2">
              <Wheat className="h-6 w-6 text-agri-yellow" />
            </div>
            <span className="font-heading font-bold text-xl text-primary">
              AGRILENS
            </span>
          </Link>
        </div>
      </header> */}
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

        {/*Mobile Navigation*/}
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
      <main className="flex-1 bg-agri-mint py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="bg-primary/10 rounded-3xl p-8 md:p-12">

              {/* 🔔 LOGIN REQUIRED MESSAGE */}
              {message && (
                <div className="mb-6 flex items-center gap-3 bg-secondary border border-primary/30 text-primary px-5 py-4 rounded-xl font-medium">
                  <Info className="h-5 w-5" />
                  {message}
                </div>
              )}

              {/* Title */}
              <div className="text-center mb-8">
                <span className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg font-heading font-bold text-2xl shadow-lg">
                  Login
                </span>
              </div>

              <div className="grid md:grid-cols-3 gap-8 items-center">

                {/* Illustration */}
                <div className="hidden md:block">
                  <img
                    src={farmerTech}
                    alt="Farmer with technology"
                    className="rounded-2xl shadow-lg"
                  />
                </div>

                {/* Form */}
                <div className="bg-card rounded-2xl p-8 shadow-lg">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-2">
                        Ph.no
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 XXX-XXX-XXXX"
                        className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-primary mb-2">
                        PIN
                      </label>
                      <input
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="6 - digit pin code"
                        maxLength={6}
                        className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`btn-submit w-full ${
                        isLoading ? "opacity-80 cursor-not-allowed" : ""
                      }`}
                    >
                      {isLoading ? "Logging in..." : "Login"}
                    </button>

                    <p className="text-center text-sm text-muted-foreground">
                      Don't have an account?{" "}
                      <Link
                        to="/register"
                        className="text-primary font-semibold hover:underline"
                      >
                        Register
                      </Link>
                    </p>
                  </form>
                </div>

                {/* Image */}
                <div className="hidden md:block">
                  <img
                    src={farmerField}
                    alt="Farmer in wheat field"
                    className="rounded-2xl shadow-lg h-80 object-cover"
                  />
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Animations */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Login;
