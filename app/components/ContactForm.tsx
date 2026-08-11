"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Loader2, AlertCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { contactSchema, type ContactFormData } from "@/lib/validations";

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    // Debouncing & Throttling: Prevent rapid double submissions
    if (isSubmitting) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    setIsSubmitting(true);
    setError("");

    // API Optimization & Caching: skip repeat API call for already-sent message from same email
    const cacheKey = `contact_submitted_${data.email}`;
    if (sessionStorage.getItem(cacheKey)) {
      setIsSuccess(true);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("Unexpected server response. Please try again.");
      }

      if (!response.ok) {
        throw new Error(result.error || "Something went wrong");
      }

      sessionStorage.setItem(cacheKey, "true");
      setIsSuccess(true);
      reset();
    } catch (err) {
      if (err instanceof TypeError) {
        setError("Network error. Please check your connection.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to send message. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="space-y-6 w-full animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-16 bg-muted/20 rounded-md"></div>
          <div className="h-16 bg-muted/20 rounded-md"></div>
        </div>
        <div className="h-16 bg-muted/20 rounded-md"></div>
        <div className="h-16 bg-muted/20 rounded-md"></div>
        <div className="h-32 bg-muted/20 rounded-md"></div>
        <div className="h-14 bg-muted/30 rounded-md mt-6"></div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12 bg-editorial-light rounded-2xl border border-border/50 shadow-sm"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <CheckCircle className="w-16 h-16 text-ocean-deep mx-auto mb-4" />
        </motion.div>
        <h3 className="text-2xl font-heading font-bold text-navy-deep mb-2">
          Message Secured.
        </h3>
        <p className="text-ocean-muted">
          Our intelligence team will respond within 24 hours.
        </p>
      </motion.div>
    );
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      handleSubmit(onSubmit)(e);
    }, 300);
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="contact-name" className="text-sm font-medium text-navy-deep">
            Full Name
          </Label>
          <Input
            id="contact-name"
            placeholder="e.g. Rajesh Kumar"
            className="bg-white border-border text-navy-deep placeholder:text-ocean-soft focus-visible:ring-ocean-deep focus-visible:ring-offset-0 transition-all"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-destructive text-xs">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-email" className="text-sm font-medium text-navy-deep">
            Business Email
          </Label>
          <Input
            id="contact-email"
            type="email"
            placeholder="rajesh@company.com"
            className="bg-white border-border text-navy-deep placeholder:text-ocean-soft focus-visible:ring-ocean-deep focus-visible:ring-offset-0 transition-all"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-destructive text-xs">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-company" className="text-sm font-medium text-navy-deep">
          Company Name (Optional)
        </Label>
        <Input
          id="contact-company"
          placeholder="Kumar Engineering Pvt Ltd"
          className="bg-white border-border text-navy-deep placeholder:text-ocean-soft focus-visible:ring-ocean-deep focus-visible:ring-offset-0 transition-all"
          {...register("company")}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-navy-deep">Subject</Label>
        <Select
          onValueChange={(value) =>
            setValue("subject", value as ContactFormData["subject"])
          }
        >
          <SelectTrigger className="bg-white border-border text-navy-deep focus:ring-ocean-deep focus:ring-offset-0">
            <SelectValue placeholder="Select a subject" />
          </SelectTrigger>
          <SelectContent className="bg-white border-border">
            <SelectItem value="general">General Inquiry</SelectItem>
            <SelectItem value="partnership">Enterprise Partnership</SelectItem>
            <SelectItem value="media">Media & Press</SelectItem>
            <SelectItem value="support">Compliance Support</SelectItem>
          </SelectContent>
        </Select>
        {errors.subject && (
          <p className="text-destructive text-xs">{errors.subject.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message" className="text-sm font-medium text-navy-deep">
          Message
        </Label>
        <textarea
          id="contact-message"
          rows={5}
          placeholder="Tell us about your export volume and compliance needs..."
          className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-navy-deep placeholder:text-ocean-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-deep focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all"
          {...register("message")}
        />
        {errors.message && (
          <p className="text-destructive text-xs">{errors.message.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-14 bg-navy-deep hover:bg-ocean-deep text-black font-medium text-base tracking-wide transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-70 mt-4"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Transmitting...
          </>
        ) : (
          <>
            <Send className="w-5 h-5 mr-2" />
            Send Intelligence Request
          </>
        )}
      </Button>
    </form>
  );
}
