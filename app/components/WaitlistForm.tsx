"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { waitlistSchema, type WaitlistFormData } from "../../lib/validations";

export function WaitlistForm() {
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
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
  } = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
  });

  const onSubmit = async (data: WaitlistFormData) => {
    // Debouncing & Throttling: Prevent rapid double submissions
    if (isSubmitting) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    // API Optimization & Caching: skip repeat API call for already-submitted email
    const cacheKey = `waitlist_submitted_${data.email}`;
    if (sessionStorage.getItem(cacheKey)) {
      setIsSuccess(true);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/waitlist", {
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
        setError(err instanceof Error ? err.message : "Failed to submit");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="space-y-5 w-full animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="h-16 bg-muted/20 rounded-md"></div>
          <div className="h-16 bg-muted/20 rounded-md"></div>
        </div>
        <div className="h-16 bg-muted/20 rounded-md"></div>
        <div className="h-12 bg-muted/30 rounded-md mt-6"></div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-10 bg-editorial-light rounded-xl border border-border/50 shadow-sm"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <CheckCircle className="w-16 h-16 text-editorial-green mx-auto mb-4" />
        </motion.div>
        <h3 className="text-2xl font-heading font-bold text-navy-deep mb-2">
          Intelligence Secured.
        </h3>
        <p className="text-ocean-muted max-w-md mx-auto">
          You are on the priority list. We will contact you within 48 hours with your early access credentials.
        </p>
      </motion.div>
    );
  }

  const handleFormSubmit = (e: any) => {
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-navy-deep">
            Full Name
          </Label>
          <Input
            id="name"
            placeholder="e.g. Rajesh Kumar"
            className="bg-white border-border text-navy-deep placeholder:text-ocean-soft focus-visible:ring-ocean-deep focus-visible:ring-offset-0 transition-all"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-destructive text-xs">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-navy-deep">
            Business Email
          </Label>
          <Input
            id="email"
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
        <Label htmlFor="company" className="text-sm font-medium text-navy-deep">
          Company Name
        </Label>
        <Input
          id="company"
          placeholder="Kumar Engineering Pvt Ltd"
          className="bg-white border-border text-navy-deep placeholder:text-ocean-soft focus-visible:ring-ocean-deep focus-visible:ring-offset-0 transition-all"
          {...register("company")}
        />
        {errors.company && (
          <p className="text-red-400 text-xs">{errors.company.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-navy-deep">
            Product Category
          </Label>
          <Select
            onValueChange={(value) =>
              setValue("category", value as WaitlistFormData["category"])
            }
          >
            <SelectTrigger className="bg-white border-border text-navy-deep focus:ring-ocean-deep focus:ring-offset-0">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="bg-white border-border text-navy-deep">
              <SelectItem value="engineering">Engineering Goods</SelectItem>
              <SelectItem value="textiles">Textiles</SelectItem>
              <SelectItem value="pharma">Pharmaceuticals</SelectItem>
              <SelectItem value="agriculture">Agriculture</SelectItem>
              <SelectItem value="chemicals">Chemicals</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-destructive text-xs">{errors.category.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-navy-deep">
            Monthly Shipments
          </Label>
          <Select
            onValueChange={(value) =>
              setValue("volume", value as WaitlistFormData["volume"])
            }
          >
            <SelectTrigger className="bg-white border-border text-navy-deep focus:ring-ocean-deep focus:ring-offset-0">
              <SelectValue placeholder="Select volume" />
            </SelectTrigger>
            <SelectContent className="bg-white border-border text-navy-deep">
              <SelectItem value="1-5">1 - 5</SelectItem>
              <SelectItem value="6-20">6 - 20</SelectItem>
              <SelectItem value="21-50">21 - 50</SelectItem>
              <SelectItem value="50+">50+</SelectItem>
            </SelectContent>
          </Select>
          {errors.volume && (
            <p className="text-destructive text-xs">{errors.volume.message}</p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-14 bg-ocean-deep hover:bg-navy-deep text-black font-medium text-base tracking-wide transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Securing Your Spot...
          </>
        ) : (
          "Join Early Access"
        )}
      </Button>

      <p className="text-xs text-center text-ocean-muted mt-4">
        Early access users receive lifetime beta benefits. Secure compliance guaranteed.
      </p>
    </form>
  );
}
