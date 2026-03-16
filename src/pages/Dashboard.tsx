import Layout from "@/components/Layout";
import MetricCircle from "@/components/MetricCircle";
import { useEffect, useState } from "react";
import { Download, FileText, TrendingUp } from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

const Dashboard = () => {
  const [weeklyData, setWeeklyData] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalScans: 0,
    diseasesDetected: 0,
    avgConfidence: 0,
    healthIndex: 100,
    avgRiskLevel: 0,
    successRate: 0,
    fieldsMonitored: 2
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  
  const increaseFields = () => {
    setDashboardStats(prev => ({
      ...prev,
      fieldsMonitored: prev.fieldsMonitored + 1
    }));
  };

  const decreaseFields = () => {
    setDashboardStats(prev => ({
      ...prev,
      fieldsMonitored: prev.fieldsMonitored > 1
        ? prev.fieldsMonitored - 1
        : 1
    }));
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        
        if (!user || !user.id) {
          setError("User not logged in");
          setLoading(false);
          return;
        }
        
        const clientId = user.id;
        
        // Fetch weekly disease data
        const weeklyResponse = await fetch(`http://127.0.0.1:5001/weekly-dashboard/${clientId}`);
        if (!weeklyResponse.ok) {
          throw new Error(`HTTP error! status: ${weeklyResponse.status}`);
        }
        const weeklyDataJson = await weeklyResponse.json();
        
        if (weeklyDataJson.error) {
          throw new Error(weeklyDataJson.error);
        }
        
        const formattedWeekly = Object.entries(weeklyDataJson).map(([disease, count]) => ({
          disease,
          count,
          fill: disease === 'Healthy' ? '#4CAF50' : '#FF6B6B'
        }));
        setWeeklyData(formattedWeekly);
        
        // Fetch dashboard statistics
        const statsResponse = await fetch(`http://127.0.0.1:5001/dashboard-stats/${clientId}`);
        if (!statsResponse.ok) {
          throw new Error(`HTTP error! status: ${statsResponse.status}`);
        }
        const statsData = await statsResponse.json();
        
        if (statsData.error) {
          throw new Error(statsData.error);
        }
        
        setDashboardStats(statsData);
        setError(null);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message);
        setWeeklyData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    
    // Listen for prediction complete events
    const handlePredictionComplete = () => {
      console.log("Prediction completed, refreshing dashboard...");
      fetchDashboardData();
    };
    window.addEventListener('predictionComplete', handlePredictionComplete);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('predictionComplete', handlePredictionComplete);
    };
  }, []);

  const handleDownloadReport = async () => {
    try {
      setDownloading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const clientId = user?.id;

      if (!clientId) {
        alert("Please log in to download the report");
        return;
      }

      // Open download in new tab
      window.open(`http://127.0.0.1:5001/download-report/${clientId}`, "_blank");
      
      // Show success message after a short delay
      setTimeout(() => {
        setDownloading(false);
      }, 2000);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download report");
      setDownloading(false);
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-primary/20">
          <p className="font-semibold text-primary">{payload[0].payload.disease}</p>
          <p className="text-sm text-muted-foreground">
            Cases: <span className="font-bold text-foreground">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Layout>
      <div className="py-8 bg-agri-mint min-h-[calc(100vh-64px)]">
        <div className="container mx-auto px-4">
          {/* Header with Download Button */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="section-title mb-2">Wheat Disease Detection Model</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Real-time monitoring and analysis
              </p>
            </div>
            
            <button
              onClick={handleDownloadReport}
              disabled={downloading}
              className="group relative inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary to-green-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {downloading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generating Report...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 group-hover:animate-bounce" />
                  <span>Download Report</span>
                  <FileText className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
          
          {/* Loading and Error States */}
          {loading && (
            <div className="text-center py-12 bg-card rounded-xl shadow-md border border-border">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-primary mb-4"></div>
              <p className="text-lg font-medium">Loading dashboard data...</p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-800 px-6 py-4 rounded-xl mb-6 shadow-md">
              <p className="font-bold text-lg">⚠️ Error loading dashboard: {error}</p>
              <p className="text-sm mt-2">Please ensure:</p>
              <ul className="text-sm mt-2 list-disc list-inside space-y-1">
                <li>You are logged in</li>
                <li>Python backend is running on http://127.0.0.1:5001</li>
                <li>Check browser console for detailed errors</li>
              </ul>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Metrics Grid */}
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-8 shadow-lg border-2 border-green-200 hover:shadow-xl transition-shadow flex flex-col items-center">
                  <MetricCircle
                    value={dashboardStats.healthIndex}
                    label="Health Index"
                    type="success"
                    size="lg"
                  />
                  <p className="text-sm text-muted-foreground mt-3 font-medium">
                    {dashboardStats.totalScans - dashboardStats.diseasesDetected} healthy scans
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 shadow-lg border-2 border-blue-200 hover:shadow-xl transition-shadow flex flex-col items-center">
                  <MetricCircle
                    value={dashboardStats.avgConfidence}
                    label="Avg Confidence (Weekly)"
                    type="success"
                    size="lg"
                  />
                  <p className="text-sm text-muted-foreground mt-3 font-medium">
                    Based on {weeklyData.reduce((acc, item) => acc + item.count, 0)} predictions
                  </p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-8 shadow-lg border-2 border-orange-200 hover:shadow-xl transition-shadow flex flex-col items-center">
                  <MetricCircle
                    value={dashboardStats.avgRiskLevel}
                    label="Avg Risk Level (Weekly)"
                    type={dashboardStats.avgRiskLevel > 70 ? "danger" : dashboardStats.avgRiskLevel > 40 ? "warning" : "success"}
                    size="lg"
                  />
                  <p className="text-sm text-muted-foreground mt-3 font-medium">
                    {dashboardStats.avgRiskLevel > 70 ? "⚠️ High risk detected" : 
                     dashboardStats.avgRiskLevel > 40 ? "⚡ Moderate risk" : "✅ Low risk"}
                  </p>
                </div>
              </div>

              {/* Chart Section */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-primary/20 hover:shadow-xl transition-shadow mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-heading font-bold text-2xl text-primary">
                    📊 Weekly Disease Report
                  </h2>
                  <span className="text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                    Last 7 days
                  </span>
                </div>

                <div className="h-96">
                  {weeklyData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <FileText className="w-16 h-16 mb-4 opacity-30" />
                      <p className="text-lg">No disease predictions found for the past week</p>
                      <p className="text-sm mt-2">Upload images to start tracking</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData}>
                        <defs>
                          <linearGradient id="healthyGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4CAF50" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#4CAF50" stopOpacity={0.3}/>
                          </linearGradient>
                          <linearGradient id="diseaseGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FF6B6B" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#FF6B6B" stopOpacity={0.3}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis 
                          dataKey="disease" 
                          angle={-45} 
                          textAnchor="end" 
                          height={120}
                          interval={0}
                          tick={{ fontSize: 12, fontWeight: 500 }}
                        />
                        <YAxis 
                          allowDecimals={false}
                          tick={{ fontSize: 12, fontWeight: 500 }}
                        />
                        <Tooltip content={<CustomTooltip active={undefined} payload={undefined} />} />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                          formatter={() => 'Number of Cases'}
                        />
                        <Bar
                          dataKey="count"
                          name="Number of Cases"
                          radius={[8, 8, 0, 0]}
                        >
                          {weeklyData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.disease === 'Healthy' ? 'url(#healthyGradient)' : 'url(#diseaseGradient)'}
                              stroke={entry.disease === 'Healthy' ? '#4CAF50' : '#FF6B6B'}
                              strokeWidth={2}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-100 hover:shadow-xl transition-all hover:scale-105 group">
                  <div className="inline-block p-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white text-2xl mb-3">
                    📸
                  </div>
                  <p className="text-4xl font-bold text-primary mb-1 group-hover:scale-110 transition-transform">
                    {dashboardStats.totalScans}
                  </p>
                  <p className="text-muted-foreground font-semibold">Total Scans</p>
                  <p className="text-xs text-muted-foreground mt-1">All time</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-100 hover:shadow-xl transition-all hover:scale-105 group">
                  <div className="inline-block p-3 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white text-2xl mb-3">
                    ⚠️
                  </div>
                  <p className="text-4xl font-bold text-primary mb-1 group-hover:scale-110 transition-transform">
                    {dashboardStats.diseasesDetected}
                  </p>
                  <p className="text-muted-foreground font-semibold">Diseases Detected</p>
                  <p className="text-xs text-muted-foreground mt-1">All time</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-100 hover:shadow-xl transition-all hover:scale-105 group">
                  <div className="inline-block p-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white text-2xl mb-3">
                    🌾
                  </div>
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <button
                      onClick={decreaseFields}
                      className="w-8 h-8 flex items-center justify-center bg-red-100 hover:bg-red-200 rounded-lg font-bold text-red-700 transition-colors"
                    >
                      −
                    </button>
                    <span className="text-4xl font-bold text-primary">
                      {dashboardStats.fieldsMonitored}
                    </span>
                    <button
                      onClick={increaseFields}
                      className="w-8 h-8 flex items-center justify-center bg-green-100 hover:bg-green-200 rounded-lg font-bold text-green-700 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-muted-foreground font-semibold">Fields Monitored</p>
                  <p className="text-xs text-muted-foreground mt-1">Active fields</p>
                </div>

                {/* <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-100 hover:shadow-xl transition-all hover:scale-105 group">
                  <div className="inline-block p-3 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white text-2xl mb-3">
                    ✨
                  </div>
                  <p className="text-4xl font-bold text-primary mb-1 group-hover:scale-110 transition-transform">
                    {dashboardStats.successRate.toFixed(0)}%
                  </p>
                  <p className="text-muted-foreground font-semibold">Success Rate</p>
                  <p className="text-xs text-muted-foreground mt-1">High confidence</p>
                </div> */}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;