import Layout from "@/components/Layout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import farmerField from "@/assets/farmer-field.jpg";
import farmerTech from "@/assets/farmer-tech-illustration.png";

const About = () => {
  const faqs = [
    {
      question: "How accurate is the Agri Lens disease detection?",
      answer:
        "AgriLens achieves up to 95% accuracy in detecting common wheat diseases such as Rust, Septoria, and Powdery Mildew. Our AI model is continuously trained on thousands of verified samples.",
    },
    {
      question: "What should I do if the app cannot identify the disease?",
      answer:
        "If the app cannot identify the disease, you can submit the image for expert review. Our team of agronomists will analyze your sample and provide personalized guidance within 24-48 hours.",
    },
    {
      question:
        "Do I need a constant internet connection to use the app?",
      answer:
        "While an internet connection is recommended for the best experience and real-time analysis, AgriLens offers limited offline functionality for basic scanning and viewing previously saved results.",
    },
    {
      question:
        "Can the app help me if my wheat is just 'stressed' but not diseased?",
      answer:
        "Yes! AgriLens can detect signs of nutrient deficiency, water stress, and other non-disease related issues. The app provides recommendations for improving overall crop health.",
    },
    {
      question: "How often is the weather data updated?",
      answer:
        "Weather data is updated every hour from multiple reliable sources. Disease outbreak predictions are refreshed every 6 hours based on current meteorological conditions.",
    },
  ];

  return (
    <Layout>
      {/* Vision Section */}
      <section className="py-16 bg-agri-mint">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="section-title mb-6">Our Vision</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Agri Lens was founded with a mission to empower wheat farmers by
                bridging the gap between traditional farming and modern
                technology. We believe that by providing accessible, AI-driven
                insights, we can help growers protect their livelihoods and
                ensure global food security.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our goal is to make precision agriculture a standard tool for
                every farmer, regardless of their scale or location.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img
                src={farmerField}
                alt="Farmer inspecting wheat"
                className="w-full h-80 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <img
                src={farmerTech}
                alt="Smart farming technology"
                className="rounded-2xl shadow-xl max-w-md mx-auto"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="section-title mb-6">Our Technology</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Agri Lens was founded with a mission to empower wheat farmers by
                bridging the gap between traditional farming and modern
                technology. We believe that by providing accessible, AI-driven
                insights, we can help growers protect their livelihoods and
                ensure global food security.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our goal is to make precision agriculture a standard tool for
                every farmer, regardless of their scale or location.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Expert-Backed Solutions */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="section-title mb-6">Expert-Backed Solutions</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Agri Lens was founded with a mission to empower wheat farmers by
                bridging the gap between traditional farming and modern
                technology. We believe that by providing accessible, AI-driven
                insights, we can help growers protect their livelihoods and
                ensure global food security.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our goal is to make precision agriculture a standard tool for
                every farmer, regardless of their scale or location.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img
                src={farmerField}
                alt="Expert farmer"
                className="w-full h-80 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="section-title text-center mb-12">
            Frequently Asked Questions (FAQs)
          </h2>
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-xl px-6"
              >
                <AccordionTrigger className="text-left font-medium text-primary hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </Layout>
  );
};

export default About;
