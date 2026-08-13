import { useState } from "react";
import { Send, CheckCircle2, Phone, Mail, Store } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";

import { WhatsAppIcon, FacebookIcon } from "@/components/BrandIcons";
import { SectionHeading } from "@/components/home/SectionHeading";
import { site } from "@/data/site";
import { submitLead } from "@/lib/leads.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ContactSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const submitLeadFn = useServerFn(submitLead);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string || null,
      message: formData.get("message") as string || null,
      source: "contact_form",
    };

    setIsSubmitting(true);
    try {
      await submitLeadFn({ data });
      setIsSuccess(true);
      toast.success("Message sent successfully! We'll contact you soon.");
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Lead submission error:", error);
      toast.error("Failed to send message. Please try again or use WhatsApp.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWhatsAppHref = () => {
    const text = encodeURIComponent("Hello Customz Paradise BD, I'm interested in modifying my bike. Can you help me?");
    return `https://wa.me/${site.whatsappNumber}?text=${text}`;
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24" id="contact">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
        <div>
          <SectionHeading
            eyebrow="Get in touch"
            title="Contact Us"
            align="left"
            className="mb-8"
          />
          
          <p className="mb-10 max-w-lg text-lg text-muted-foreground">
            Have questions about our modification kits or need advice for your build? 
            Reach out to our experts directly or visit our office.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <a
              href={getWhatsAppHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card transition-colors hover:border-primary/60"
            >
              <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-whatsapp/10 text-brand-whatsapp">
                <WhatsAppIcon className="size-6" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold uppercase tracking-tight">WhatsApp</h3>
                <p className="text-sm text-muted-foreground">{site.phoneDisplay}</p>
              </div>
            </a>

            <a
              href="https://m.me/customzparadisebd"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card transition-colors hover:border-primary/60"
            >
              <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-facebook/10 text-brand-facebook">
                <FacebookIcon className="size-6" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold uppercase tracking-tight">Messenger</h3>
                <p className="text-sm text-muted-foreground">Customz Paradise BD</p>
              </div>
            </a>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Store className="size-6" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold uppercase tracking-tight">Office</h3>
                <p className="text-sm text-muted-foreground">{site.address}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-8 shadow-2xl">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-6 rounded-full bg-green-500/10 p-4 text-green-500">
                <CheckCircle2 className="size-12" />
              </div>
              <h3 className="mb-2 font-display text-2xl font-bold uppercase">Message Received</h3>
              <p className="max-w-xs text-muted-foreground">
                Thank you for reaching out! Our team will get back to you shortly.
              </p>
              <Button 
                variant="outline" 
                className="mt-8"
                onClick={() => setIsSuccess(false)}
              >
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Full Name *</label>
                  <Input 
                    id="name" 
                    name="name" 
                    placeholder="e.g. Rahul Hasan" 
                    required 
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">Phone Number *</label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    type="tel" 
                    placeholder="01xxxxxxxxx" 
                    required 
                    className="bg-background/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email Address (Optional)</label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">How can we help? (Optional)</label>
                <Textarea 
                  id="message" 
                  name="message" 
                  placeholder="Tell us about your bike or modification needs..." 
                  rows={4}
                  className="resize-none bg-background/50"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-bold uppercase tracking-wider" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : (
                  <>
                    Send Message
                    <Send className="ml-2 size-4" />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
