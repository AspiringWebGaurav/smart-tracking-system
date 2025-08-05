"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import EnhancedVisitorStatusWatcher from "@/components/EnhancedVisitorStatusWatcher";
import { showSuccessToast, showErrorToast } from "@/components/ToastSystem";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  uuid: string;
}

function BanPageContent() {
  const searchParams = useSearchParams();
  const [uuid, setUuid] = useState<string>("");
  const [banReason, setBanReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ContactFormData>();

  useEffect(() => {
    const uuidParam = searchParams.get("uuid") || "";
    const reasonParam = searchParams.get("reason") || "Policy violation";
    
    setUuid(uuidParam);
    setBanReason(decodeURIComponent(reasonParam));
  }, [searchParams]);

  const onSubmitContact = async (data: ContactFormData) => {
    setIsSubmitting(true);
    
    try {
      // Add UUID to form data
      const formData = {
        ...data,
        uuid,
        banReason,
        timestamp: new Date().toISOString()
      };

      // Send contact form (you can integrate with EmailJS or your preferred service)
      const response = await fetch('/api/contact/ban-appeal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showSuccessToast("Your appeal has been submitted successfully. We'll review it shortly.");
        reset();
        setShowContactForm(false);
      } else {
        throw new Error('Failed to submit appeal');
      }
    } catch (error) {
      console.error("Error submitting contact form:", error);
      showErrorToast("Failed to submit your appeal. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black-100 flex items-center justify-center p-4">
      <EnhancedVisitorStatusWatcher />
      
      <div className="w-full max-w-2xl">
        {/* Main ban notice */}
        <div className="bg-black-100/80 backdrop-blur-md border border-red-500/20 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 p-6 border-b border-red-500/20">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Access Restricted</h1>
                <p className="text-red-300">Your access to this portfolio has been temporarily suspended</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Ban details */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">Restriction Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Reason:</span>
                  <span className="text-red-300">{banReason}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-red-300">Temporarily Suspended</span>
                </div>
                {uuid && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reference ID:</span>
                    <span className="text-gray-300 font-mono text-xs">{uuid.slice(0, 8)}...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Information */}
            <div className="text-center space-y-4">
              <p className="text-gray-300">
                If you believe this restriction was applied in error, you can contact the administrator 
                to request a review of your case.
              </p>
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">What happens next?</h4>
                <ul className="text-sm text-gray-300 space-y-1 text-left">
                  <li>• Your appeal will be reviewed within 24-48 hours</li>
                  <li>• You'll receive an email response if contact information is provided</li>
                  <li>• Access will be restored automatically if the restriction is lifted</li>
                </ul>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowContactForm(!showContactForm)}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{showContactForm ? 'Hide Contact Form' : 'Contact Administrator'}</span>
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Check Status</span>
              </button>
            </div>
          </div>
        </div>

        {/* Contact form */}
        {showContactForm && (
          <div className="mt-6 bg-black-100/80 backdrop-blur-md border border-white/[0.2] rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Submit an Appeal</h3>
            
            <form onSubmit={handleSubmit(onSubmitContact)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Name *
                  </label>
                  <input
                    {...register("name", { required: "Name is required" })}
                    className="w-full px-4 py-2 bg-black-100/50 border border-white/[0.2] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="Your full name"
                  />
                  {errors.name && (
                    <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    {...register("email", { 
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address"
                      }
                    })}
                    className="w-full px-4 py-2 bg-black-100/50 border border-white/[0.2] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="your.email@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subject *
                </label>
                <input
                  {...register("subject", { required: "Subject is required" })}
                  className="w-full px-4 py-2 bg-black-100/50 border border-white/[0.2] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="Appeal for access restriction"
                />
                {errors.subject && (
                  <p className="text-red-400 text-xs mt-1">{errors.subject.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message *
                </label>
                <textarea
                  {...register("message", { 
                    required: "Message is required",
                    minLength: {
                      value: 20,
                      message: "Message must be at least 20 characters"
                    }
                  })}
                  rows={4}
                  className="w-full px-4 py-2 bg-black-100/50 border border-white/[0.2] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Please explain why you believe this restriction was applied in error..."
                />
                {errors.message && (
                  <p className="text-red-400 text-xs mt-1">{errors.message.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white py-3 px-6 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>Submit Appeal</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    }>
      <BanPageContent />
    </Suspense>
  );
}