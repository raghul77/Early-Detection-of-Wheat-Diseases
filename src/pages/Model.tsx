import { useState } from "react";
import { Upload, Camera } from "lucide-react";
import Layout from "@/components/Layout";
import MetricCircle from "@/components/MetricCircle";

interface DetectionResult {
  diseaseName: string;
  riskLevel: number;
  confidenceLevel: number;
  remedies: string[];
}

const Model = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      if (!user.id) {
        alert("Please log in to use the disease detection model");
        setIsAnalyzing(false);
        return;
      }

      // Convert base64 → File
      const response = await fetch(selectedImage);
      const blob = await response.blob();
      const file = new File([blob], "wheat-image.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("client_id", user.id.toString());

      console.log("Sending prediction request for client:", user.id);

      const res = await fetch("http://127.0.0.1:5001/predict", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Prediction failed");
      }

      const data = await res.json();

      console.log("Prediction result:", data);

      setResult({
        diseaseName: data.diseaseName,
        riskLevel: data.riskLevel,
        confidenceLevel: data.confidenceLevel,
        remedies: data.remedies,
      });

      // Trigger a custom event to refresh dashboard if it's open
      window.dispatchEvent(new CustomEvent('predictionComplete'));
      
    } catch (error) {
      console.error("Prediction error:", error);
      alert(`Prediction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Layout>
      <div className="py-8 bg-agri-mint min-h-[calc(100vh-64px)]">
        <div className="container mx-auto px-4">
          <h1 className="section-title mb-8">Wheat Disease Detection Model</h1>
{/* Disclaimer */}
<div className="mb-8 rounded-xl border border-yellow-300 bg-yellow-50 px-6 py-4 text-sm text-yellow-900 shadow-sm">
  <p className="font-semibold mb-1">⚠️ Disclaimer</p>
  <p>
    This AI model can detect <span className="font-semibold">only 15 predefined wheat diseases </span> 
    based on image analysis. Results may vary depending on image quality and disease stage, 
    and should be used for <span className="font-semibold">preliminary assessment only</span>. 
    Always consult an agricultural expert for confirmation and treatment.
  </p>
</div>

          {/* Upload Section */}
          <div className="bg-card rounded-xl p-8 shadow-md border border-border mb-8">
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              {/* File Upload */}
              <label className="cursor-pointer group">
                <div className="border-2 border-dashed border-primary/40 rounded-xl p-8 text-center hover:border-primary transition-colors group-hover:bg-secondary/50">
                  <Upload className="h-12 w-12 mx-auto mb-3 text-primary/60 group-hover:text-primary" />
                  <p className="font-medium text-primary">
                    Select Photo to upload
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Supported formats: PNG, JPG, JPEG
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <span className="text-xl font-semibold text-muted-foreground">
                OR
              </span>

              {/* Camera Capture */}
              <label className="cursor-pointer group">
                <div className="border-2 border-dashed border-primary/40 rounded-xl p-8 text-center hover:border-primary transition-colors group-hover:bg-secondary/50">
                  <Camera className="h-12 w-12 mx-auto mb-3 text-primary/60 group-hover:text-primary" />
                  <p className="font-medium text-primary">Capture live photo</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Image Preview */}
            {selectedImage && (
              <div className="mt-6 text-center">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="max-h-64 mx-auto rounded-xl shadow-md"
                />
              </div>
            )}

            {/* Submit Button */}
            <div className="text-center mt-6">
              <button
                onClick={handleSubmit}
                disabled={!selectedImage || isAnalyzing}
                className="btn-submit disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? "Analyzing..." : "Submit"}
              </button>
            </div>
          </div>

          {/* Results Section */}
          {result && (
            <div className="bg-card rounded-xl p-8 shadow-md border border-border animate-fade-in">
              {result.diseaseName !== "Healthy" ? (
                <p className="text-destructive font-semibold mb-2">
                  Disease Detected!!
                </p>
              ) : (
                <p className="text-green-600 font-semibold mb-2">
                  Healthy Wheat Detected!
                </p>
              )}
              <h2 className="font-heading text-4xl font-bold text-primary mb-8">
                {result.diseaseName}
              </h2>

              {/* Metrics */}
              <div className="flex flex-wrap justify-center gap-8 mb-8">
                <MetricCircle
                  value={result.riskLevel}
                  label="Risk Level"
                  type={result.riskLevel > 70 ? "danger" : result.riskLevel > 40 ? "warning" : "success"}
                />
                <MetricCircle
                  value={result.confidenceLevel}
                  label="Confidence Level"
                  type="success"
                />
              </div>

              {/* Remedies */}
              <div className="bg-secondary rounded-xl p-6">
                <h3 className="font-heading font-semibold text-lg text-primary mb-4">
                  {result.diseaseName === "Healthy" ? "Recommendations:" : "Remedy:"}
                </h3>
                <ol className="list-decimal list-inside space-y-2">
                  {result.remedies.map((remedy, index) => (
                    <li key={index} className="text-foreground">
                      {remedy}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Model;