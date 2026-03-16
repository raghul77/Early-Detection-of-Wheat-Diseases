import { Mail, Phone, MapPin } from "lucide-react";
import Layout from "@/components/Layout";
import supportIllustration from "@/assets/support-illustration.png";

const Contact = () => {
  return (
    <Layout>
      <div className="py-16 bg-agri-mint min-h-[calc(100vh-64px)]">
        <div className="container mx-auto px-4">
          <h1 className="section-title text-center mb-12">Support</h1>

          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-2xl p-8 shadow-md border border-border">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Illustration */}
                <div className="text-center">
                  <img
                    src={supportIllustration}
                    alt="Customer support"
                    className="max-w-xs mx-auto"
                  />
                </div>

                {/* Contact Info */}
                <div className="space-y-6">
                  <h2 className="font-heading text-2xl font-semibold text-primary">
                    Get in Touch
                  </h2>
                  <p className="text-muted-foreground">
                    Have questions or need assistance? Our support team is here
                    to help you with any queries related to the AgriLens
                    application.
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium text-foreground">
                          support@agrilens.com
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium text-foreground">
                          +91 XX-XXX-XXXX
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-medium text-foreground">
                          Agricultural Tech Hub, India
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground pt-4 border-t border-border">
                    For app related queries:{" "}
                    <a
                      href="mailto:abc@support.xyz.com"
                      className="text-primary hover:underline"
                    >
                      abc@support.xyz.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
