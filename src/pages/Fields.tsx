import { useState, useEffect } from "react";
import { Loader2, AlertCircle, CheckCircle, Cloud, Droplets, ThermometerSun } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const FertilizerRecommendation = () => {
  const [formData, setFormData] = useState({
    temperature: "",
    humidity: "",
    moisture: "",
    soilType: "Black",
    cropType: "Wheat",
    nitrogen: "",
    potassium: "",
    phosphorous: "",
  });

  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherFetched, setWeatherFetched] = useState(false);

const API_KEY = "3933c2e207f24c09ba362557262401";
const BACKEND_URL = "http://127.0.0.1:5001";

  const soilTypes = ["Black", "Red", "Clayey", "Loamy", "Sandy"];
  const cropTypes = [
    "Wheat",
    "Barley",
    "Maize",
    "Cotton",
    "Sugarcane",
    "Ground Nuts",
    "Pulses",
    "Paddy",
    "rice"
  ];

  // Auto-fetch weather data on component mount
  useEffect(() => {
    fetchWeatherData();
  }, []);

  const fetchWeatherData = async () => {
    setWeatherLoading(true);
    setError(null);

    try {
      // Try to get user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            await getWeatherByCoords(latitude, longitude);
          },
          async (error) => {
            console.error("Geolocation error:", error);
            // Fallback to default location (e.g., Delhi)
            await getWeatherByCity("Delhi");
          }
        );
      } else {
        // Browser doesn't support geolocation
        await getWeatherByCity("Delhi");
      }
    } catch (err) {
      console.error("Error fetching weather:", err);
      setError("Failed to fetch weather data. Please enter values manually.");
      setWeatherLoading(false);
    }
  };

  const getWeatherByCoords = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${lat},${lon}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch weather data");
      }

      const data = await response.json();
      updateWeatherData(data);
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to fetch weather data");
      setWeatherLoading(false);
    }
  };

  const getWeatherByCity = async (city) => {
    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${city}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch weather data");
      }

      const data = await response.json();
      updateWeatherData(data);
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to fetch weather data");
      setWeatherLoading(false);
    }
  };

  const updateWeatherData = (data) => {
    setFormData((prev) => ({
      ...prev,
      temperature: Math.round(data.current.temp_c).toString(),
      humidity: data.current.humidity.toString(),
    }));
    setWeatherFetched(true);
    setWeatherLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user makes changes
    if (error) setError(null);
  };

  const validateForm = () => {
    const { temperature, humidity, moisture, nitrogen, potassium, phosphorous } = formData;

    if (!temperature || !humidity || !moisture || !nitrogen || !potassium || !phosphorous) {
      setError("Please fill in all fields");
      return false;
    }

    if (parseFloat(humidity) < 0 || parseFloat(humidity) > 100) {
      setError("Humidity must be between 0 and 100");
      return false;
    }

    if (parseFloat(moisture) < 0 || parseFloat(moisture) > 100) {
      setError("Moisture must be between 0 and 100");
      return false;
    }

    if (parseFloat(temperature) < -50 || parseFloat(temperature) > 60) {
      setError("Temperature seems unusual. Please check the value.");
      return false;
    }

    return true;
  };

  const handlePredict = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setRecommendation(null);

    try {
      const response = await fetch(`${BACKEND_URL}/predict-fertilizer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          temperature: parseFloat(formData.temperature),
          humidity: parseFloat(formData.humidity),
          moisture: parseFloat(formData.moisture),
          soilType: formData.soilType,
          cropType: formData.cropType,
          nitrogen: parseFloat(formData.nitrogen),
          potassium: parseFloat(formData.potassium),
          phosphorous: parseFloat(formData.phosphorous),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Prediction failed");
      }

      if (data.success) {
        setRecommendation(data);
      } else {
        throw new Error("Unexpected response from server");
      }
    } catch (err) {
      console.error("Prediction error:", err);
      setError(err.message || "Failed to get fertilizer recommendation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-400 to-yellow-500 px-8 py-6">
              <h1 className="text-3xl md:text-4xl font-bold text-white text-center tracking-wide">
                RECOMMENDING FERTILIZER FOR YOUR CROP
              </h1>
            </div>

            {/* Weather Status Banner */}
            {weatherLoading && (
              <div className="bg-blue-50 border-b-2 border-blue-200 px-8 py-4">
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <p className="text-blue-700 font-medium">Fetching weather data...</p>
                </div>
              </div>
            )}

            {weatherFetched && (
              <div className="bg-green-50 border-b-2 border-green-200 px-8 py-4">
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-green-700 font-medium">
                    Weather data auto-filled! Temperature and humidity values updated.
                  </p>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border-b-2 border-red-200 px-8 py-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-red-700 font-medium">Error</p>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <div className="p-8 md:p-12 space-y-6">
              {/* Temperature & Humidity Row */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Temperature */}
                <div className="space-y-2">
                  <label className="block text-gray-600 font-semibold text-lg flex items-center gap-2">
                    <ThermometerSun className="h-5 w-5 text-orange-500" />
                    Temperature (°C)
                  </label>
                  <input
                    type="number"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleChange}
                    placeholder="Enter temperature"
                    step="0.1"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors text-gray-700 placeholder-gray-400"
                  />
                  {weatherFetched && formData.temperature && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Auto-filled from weather data
                    </p>
                  )}
                </div>

                {/* Humidity */}
                <div className="space-y-2">
                  <label className="block text-gray-600 font-semibold text-lg flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    Humidity (%)
                  </label>
                  <input
                    type="number"
                    name="humidity"
                    value={formData.humidity}
                    onChange={handleChange}
                    placeholder="Enter humidity"
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors text-gray-700 placeholder-gray-400"
                  />
                  {weatherFetched && formData.humidity && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Auto-filled from weather data
                    </p>
                  )}
                </div>
              </div>

              {/* Moisture */}
              <div className="space-y-2">
                <label className="block text-gray-600 font-semibold text-lg">
                  Soil Moisture (%)
                </label>
                <input
                  type="number"
                  name="moisture"
                  value={formData.moisture}
                  onChange={handleChange}
                  placeholder="Enter soil moisture percentage"
                  step="0.1"
                  min="0"
                  max="100"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors text-gray-700 placeholder-gray-400"
                />
              </div>

              {/* Soil Type & Crop Type Row */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Soil Type */}
                <div className="space-y-2">
                  <label className="block text-gray-600 font-semibold text-lg">
                    Soil Type
                  </label>
                  <select
                    name="soilType"
                    value={formData.soilType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors text-gray-700 bg-white cursor-pointer"
                  >
                    {soilTypes.map((soil) => (
                      <option key={soil} value={soil}>
                        {soil}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Crop Type */}
                <div className="space-y-2">
                  <label className="block text-gray-600 font-semibold text-lg">
                    Crop Type
                  </label>
                  <select
                    name="cropType"
                    value={formData.cropType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors text-gray-700 bg-white cursor-pointer"
                  >
                    {cropTypes.map((crop) => (
                      <option key={crop} value={crop}>
                        {crop}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* NPK Values Row */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Nitrogen */}
                <div className="space-y-2">
                  <label className="block text-gray-600 font-semibold text-lg">
                    Nitrogen (kg/ha)
                  </label>
                  <input
                    type="number"
                    name="nitrogen"
                    value={formData.nitrogen}
                    onChange={handleChange}
                    placeholder="N content"
                    step="0.1"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors text-gray-700 placeholder-gray-400"
                  />
                </div>

                {/* Phosphorous */}
                <div className="space-y-2">
                  <label className="block text-gray-600 font-semibold text-lg">
                    Phosphorous (kg/ha)
                  </label>
                  <input
                    type="number"
                    name="phosphorous"
                    value={formData.phosphorous}
                    onChange={handleChange}
                    placeholder="P content"
                    step="0.1"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors text-gray-700 placeholder-gray-400"
                  />
                </div>

                {/* Potassium */}
                <div className="space-y-2">
                  <label className="block text-gray-600 font-semibold text-lg">
                    Potassium (kg/ha)
                  </label>
                  <input
                    type="number"
                    name="potassium"
                    value={formData.potassium}
                    onChange={handleChange}
                    placeholder="K content"
                    step="0.1"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors text-gray-700 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Predict Button */}
              <button
                onClick={handlePredict}
                disabled={loading}
                className={`w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-xl py-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  "Get Recommendation"
                )}
              </button>

              {/* Recommendation Display */}
              {recommendation && (
                <div className="mt-8 bg-gradient-to-r from-green-700 to-emerald-800 rounded-2xl p-8 shadow-xl animate-fadeIn">
                  <div className="flex items-center justify-center mb-4">
                    <CheckCircle className="h-10 w-10 text-white mr-3" />
                    <h2 className="text-2xl md:text-3xl font-bold text-white">
                      Recommended Fertilizer
                    </h2>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
                    <p className="text-4xl font-bold text-white text-center mb-2">
                      {recommendation.fertilizer}
                    </p>
                    <p className="text-green-100 text-center text-lg">
                      NPK Ratio: {recommendation.npk_ratio}
                    </p>
                    <div className="mt-4 flex justify-center">
                      <div className="bg-green-600 px-4 py-2 rounded-full">
                        <p className="text-white text-sm font-semibold">
                          Confidence: {recommendation.confidence}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <h3 className="text-white font-bold text-lg mb-2">Description</h3>
                      <p className="text-green-50">{recommendation.description}</p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <h3 className="text-white font-bold text-lg mb-2">Usage Instructions</h3>
                      <p className="text-green-50">{recommendation.usage_instructions}</p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <h3 className="text-white font-bold text-lg mb-2">Applied Parameters</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                        <div>
                          <p className="text-green-200 text-xs">Temperature</p>
                          <p className="text-white font-semibold">{recommendation.input_parameters.temperature}°C</p>
                        </div>
                        <div>
                          <p className="text-green-200 text-xs">Humidity</p>
                          <p className="text-white font-semibold">{recommendation.input_parameters.humidity}%</p>
                        </div>
                        <div>
                          <p className="text-green-200 text-xs">Soil Type</p>
                          <p className="text-white font-semibold">{recommendation.input_parameters.soil_type}</p>
                        </div>
                        <div>
                          <p className="text-green-200 text-xs">Crop</p>
                          <p className="text-white font-semibold">{recommendation.input_parameters.crop_type}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Refresh Weather Button */}
          <div className="mt-6 text-center">
            <button
              onClick={fetchWeatherData}
              disabled={weatherLoading}
              className="inline-flex items-center gap-2 bg-white text-green-700 px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all font-semibold"
            >
              <Cloud className="h-5 w-5" />
              {weatherLoading ? "Fetching..." : "Refresh Weather Data"}
            </button>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default FertilizerRecommendation;