import { useState, useEffect } from "react";
import { Sun, Cloud, CloudRain, CloudSun, CloudSnow, Wind, Droplets, Eye, Gauge, MapPin, Loader2, AlertCircle, Leaf, TrendingUp, Users, BookOpen ,Search, Navigation} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Weather = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const [searchInput, setSearchInput] = useState("");


 const API_KEY = "3933c2e207f24c09ba362557262401";

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    if (location) {
      fetchWeatherData();
    }
  }, [location]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(`${latitude},${longitude}`);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Fallback to Chennai if location access is denied
          setLocation("Chennai");
        }
      );
    } else {
      // Fallback to Chennai if geolocation is not supported
      setLocation("Chennai");
    }
  };

  const handleSearchLocation = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setLocation(searchInput.trim());
      setSearchInput("");
    }
  };
  const fetchWeatherData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${location}&days=5&aqi=no`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch weather data");
      }
      
      const data = await response.json();
      setWeatherData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition) => {
    const code = condition?.code || 1000;
    
    if (code === 1000) return Sun;
    if ([1003, 1006].includes(code)) return CloudSun;
    if ([1009, 1030, 1135, 1147].includes(code)) return Cloud;
    if ([1063, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246].includes(code)) return CloudRain;
    if ([1066, 1114, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(code)) return CloudSnow;
    
    return CloudSun;
  };

  const calculateDiseaseRisk = (current) => {
    if (!current) return null;
    
    const humidity = current.humidity;
    const temp = current.temp_c;
    
    if (humidity > 70 && temp > 15 && temp < 25) {
      return {
        level: "High",
        color: "text-red-600",
        bgColor: "bg-red-50 border-red-300",
        message: "High risk of fungal diseases like Septoria leaf blotch. Consider immediate preventive fungicide application."
      };
    } else if (humidity > 60 && temp > 10 && temp < 30) {
      return {
        level: "Moderate",
        color: "text-amber-700",
        bgColor: "bg-amber-50 border-amber-300",
        message: "Moderate risk of disease outbreak. Monitor crops closely and prepare for preventive measures."
      };
    } else {
      return {
        level: "Low",
        color: "text-green-700",
        bgColor: "bg-green-50 border-green-300",
        message: "Low disease risk. Continue regular monitoring practices."
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex flex-col">
        {/* Header */}
      <Header />

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-700 text-lg">Loading weather data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex flex-col">
       <Header />

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">Error Loading Weather</h2>
            <p className="text-gray-600 text-center mb-4">{error}</p>
            <button
              onClick={fetchWeatherData}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { location: loc, current, forecast } = weatherData;
  const WeatherIcon = getWeatherIcon(current.condition);
  const diseaseRisk = calculateDiseaseRisk(current);

  const hourlyData = forecast.forecastday[0].hour
    .filter((_, index) => index % 3 === 0)
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex flex-col">
      {/* Header */}
     <Header />

      {/* Main Content */}
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Weather Dashboard</h1>
            <div className="flex items-center text-gray-600">
              <MapPin className="h-5 w-5 mr-2 text-green-600" />
              <span className="text-lg">{loc.name}, {loc.region}, {loc.country}</span>
            </div>
          </div>
{/* Location Search */}
        <form onSubmit={handleSearchLocation} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search location..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-full"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Search
          </button>
          <button
            type="button"
            onClick={getUserLocation}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            title="Use my location"
          >
            <Navigation className="h-5 w-5" />
            <span className="hidden sm:inline">My Location</span>
          </button>
        </form>
      

          {/* Current Weather - Hero Section */}
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl p-8 mb-8 shadow-2xl text-white">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-green-100 text-lg mb-2">Current Weather</p>
                <div className="flex items-baseline mb-4">
                  <h2 className="text-7xl font-bold">{Math.round(current.temp_c)}°</h2>
                  <span className="text-3xl ml-2 text-green-100">C</span>
                </div>
                <p className="text-2xl mb-2">{current.condition.text}</p>
                <p className="text-green-100">Feels like {Math.round(current.feelslike_c)}°C</p>
                <p className="text-sm text-green-100 mt-4">
                  Last updated: {new Date(current.last_updated).toLocaleTimeString()}
                </p>
              </div>
              
              <div className="flex justify-center">
                <WeatherIcon className="h-40 w-40 text-amber-300 drop-shadow-lg" />
              </div>
            </div>

            {/* Weather Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <Wind className="h-5 w-5 mr-2" />
                  <span className="text-sm text-green-100">Wind</span>
                </div>
                <p className="text-2xl font-semibold">{current.wind_kph} km/h</p>
                <p className="text-xs text-green-100">{current.wind_dir}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <Droplets className="h-5 w-5 mr-2" />
                  <span className="text-sm text-green-100">Humidity</span>
                </div>
                <p className="text-2xl font-semibold">{current.humidity}%</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <Eye className="h-5 w-5 mr-2" />
                  <span className="text-sm text-green-100">Visibility</span>
                </div>
                <p className="text-2xl font-semibold">{current.vis_km} km</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <Gauge className="h-5 w-5 mr-2" />
                  <span className="text-sm text-green-100">Pressure</span>
                </div>
                <p className="text-2xl font-semibold">{current.pressure_mb} mb</p>
              </div>
            </div>
          </div>

          {/* Hourly and Daily Forecast */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Hourly Forecast */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <Cloud className="h-6 w-6 mr-2 text-green-600" />
                Hourly Forecast
              </h3>
              <div className="grid grid-cols-4 gap-4">
                {hourlyData.map((hour, index) => {
                  const HourIcon = getWeatherIcon(hour.condition);
                  const time = new Date(hour.time).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    hour12: true 
                  });
                  
                  return (
                    <div key={index} className="text-center p-3 rounded-xl hover:bg-green-50 transition-colors">
                      <p className="text-sm text-gray-600 mb-2 font-medium">{time}</p>
                      <HourIcon className="h-8 w-8 mx-auto text-green-600 mb-2" />
                      <p className="font-bold text-gray-800 text-lg">{Math.round(hour.temp_c)}°</p>
                      <p className="text-xs text-gray-500 mt-1">{hour.condition.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5-Day Forecast */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <Sun className="h-6 w-6 mr-2 text-amber-500" />
                3-Day Forecast
              </h3>
              <div className="space-y-3">
                {forecast.forecastday.map((day, index) => {
                  const DayIcon = getWeatherIcon(day.day.condition);
                  const date = new Date(day.date);
                  const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 rounded-xl hover:bg-green-50 transition-colors">
                      <div className="flex items-center flex-1">
                        <p className="font-semibold text-gray-700 w-16">{dayName}</p>
                        <DayIcon className="h-8 w-8 mx-4 text-green-600" />
                        <p className="text-sm text-gray-600 flex-1">{day.day.condition.text}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-800 text-lg">{Math.round(day.day.maxtemp_c)}°</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-600">{Math.round(day.day.mintemp_c)}°</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Disease Risk Alert */}
          {diseaseRisk && (
            <div className={`${diseaseRisk.bgColor} border-2 rounded-2xl p-6 shadow-md`}>
              <div className="flex items-start">
                <AlertCircle className={`h-6 w-6 ${diseaseRisk.color} mr-3 flex-shrink-0 mt-1`} />
                <div>
                  <h3 className={`text-xl font-bold ${diseaseRisk.color} mb-2`}>
                    {diseaseRisk.level} Disease Risk Alert
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {diseaseRisk.message}
                  </p>
                  <div className="mt-3 text-sm text-gray-600">
                    <span className="font-medium">Current conditions:</span> {current.humidity}% humidity, {Math.round(current.temp_c)}°C temperature
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
</div>
      
    
  );
};

export default Weather;