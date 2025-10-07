import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import dadderUpLogo from "@/assets/dadderup-logo-white.png";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { z } from "zod";

// Zod validation schema
const registrationSchema = z.object({
  firstName: z.string()
    .trim()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters"),
  lastName: z.string()
    .trim()
    .min(1, "Last name is required")
    .max(50, "Last name must be less than 50 characters"),
  email: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
  phone: z.string()
    .trim()
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  dateOfBirth: z.string().optional(),
  fatherType: z.enum(["blood_father", "flex_dad"], {
    required_error: "Please select a father type",
  }),
  numberOfKids: z.string().optional(),
  dueDate: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    dateOfBirth: "",
    fatherType: "",
    numberOfKids: "",
    childNames: {} as { [key: number]: string },
    childAges: {} as { [key: number]: string },
    dueDate: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleChildNameChange = (childIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      childNames: { ...prev.childNames, [childIndex]: value }
    }));
  };

  const handleChildAgeChange = (childIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      childAges: { ...prev.childAges, [childIndex]: value }
    }));
  };

  const renderChildInputs = () => {
    const numKids = parseInt(formData.numberOfKids);
    if (!numKids || numKids === 0) return null;

    return Array.from({ length: numKids }, (_, index) => (
      <div key={index} className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`child-name-${index + 1}`}>Child {index + 1} Name</Label>
          <Input
            id={`child-name-${index + 1}`}
            placeholder="e.g., Alex"
            value={formData.childNames[index + 1] || ""}
            onChange={(e) => handleChildNameChange(index + 1, e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`child-age-${index + 1}`}>Child {index + 1} Age</Label>
          <Input
            id={`child-age-${index + 1}`}
            placeholder="e.g., 5 years old"
            value={formData.childAges[index + 1] || ""}
            onChange={(e) => handleChildAgeChange(index + 1, e.target.value)}
          />
        </div>
      </div>
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions",
        variant: "destructive",
      });
      return;
    }

    // Validate form data with Zod
    try {
      registrationSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast({
          title: "Validation Error",
          description: firstError.message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      // Import WordPress API service
      const { createWordPressUser, getWordPressErrorMessage } = await import("@/services/wordpressApi");

      // Convert form data to WordPress format
      const numKids = formData.numberOfKids === "expecting" 
        ? 0 
        : parseInt(formData.numberOfKids) || 0;

      // Build child data arrays
      const childNames: string[] = [];
      const childAges: string[] = [];
      if (numKids > 0) {
        for (let i = 1; i <= numKids; i++) {
          childNames.push(formData.childNames[i] || "");
          childAges.push(formData.childAges[i] || "");
        }
      }

      const wpPayload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
        date_of_birth: formData.dateOfBirth || undefined,
        father_type: formData.fatherType as 'blood_father' | 'flex_dad',
        how_many_kids: numKids,
        agree_terms: accepted ? 1 as const : 0 as const,
        child_names: childNames.length > 0 ? JSON.stringify(childNames) : undefined,
        child_ages: childAges.length > 0 ? JSON.stringify(childAges) : undefined,
        due_date: formData.numberOfKids === "expecting" ? formData.dueDate : undefined,
      };

      // Call WordPress API
      const wpResponse = await createWordPressUser(wpPayload);

      if (!wpResponse.success) {
        // Handle WordPress errors
        const code = wpResponse.code || '';
        if (
          code === 'email_exists' ||
          code === 'registration-error-email-exists' ||
          code === 'existing_user_email' ||
          code === 'existing_user_login'
        ) {
          toast({
            title: "Account Exists",
            description: "An account with this email already exists. Redirecting to sign in...",
            variant: "destructive",
          });
          setTimeout(() => navigate('/auth?existing=true'), 2000);
          return;
        }

        toast({
          title: "Registration Error",
          description: getWordPressErrorMessage(wpResponse.code),
          variant: "destructive",
        });
        return;
      }

      // Store WordPress user ID temporarily for sync tracking
      // This is used to link Supabase and WordPress accounts during registration
      if (wpResponse.data?.user_id) {
        sessionStorage.setItem('wp_user_id', wpResponse.data.user_id.toString());
      }

      // Show success message with sync status
      toast({
        title: "Creating Account",
        description: "Finalizing your account setup...",
        duration: 10000,
      });

      // Poll for Supabase sync completion (max 10 seconds)
      const startTime = Date.now();
      const maxWaitTime = 10000;
      const wpUserId = wpResponse.data?.user_id;

      const checkSync = async (): Promise<void> => {
        if (!wpUserId) {
          // No user ID to check, proceed to plans
          navigate("/plans");
          return;
        }

        const { data: user } = await supabase
          .from('users')
          .select('sync_status, id')
          .eq('wp_user_id', wpUserId)
          .maybeSingle();

        if (user?.sync_status === 'synced') {
          // Success! Clear WordPress user ID from sessionStorage after successful sync
          sessionStorage.removeItem('wp_user_id');
          
          // Redirect to plans
          toast({
            title: "Account Created!",
            description: "Redirecting to plan selection...",
          });
          setTimeout(() => navigate("/plans"), 1500);
        } else if (Date.now() - startTime > maxWaitTime) {
          // Timeout - proceed anyway, clear sessionStorage
          sessionStorage.removeItem('wp_user_id');
          
          toast({
            title: "Account Created",
            description: "You can now sign in and select a plan",
          });
          navigate("/plans");
        } else {
          // Keep polling
          setTimeout(checkSync, 1000);
        }
      };

      checkSync();
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#2c70b6' }}>
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side - Content */}
        <div className="text-white space-y-6 text-center lg:text-left">
          <div className="mb-8">
            <img 
              src={dadderUpLogo} 
              alt="DadderUp Logo" 
              className="h-16 lg:h-20 mx-auto lg:mx-0"
            />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
              Join Our
              <br />
              Community
            </h1>
            <p className="text-xl lg:text-2xl opacity-90 max-w-lg">
              Connect with like-minded individuals and be part of something amazing.
            </p>
          </div>
          
          <div className="space-y-4">
            <p className="opacity-80">
              Register today and unlock exclusive benefits, connect with our community, 
              and stay updated on the latest developments.
            </p>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="p-8">
            <div className="space-y-6">
              
              <div className="text-center space-y-2">
                <div className="text-sm text-muted-foreground mb-2">
                  Step 1 of 2
                </div>
                <h2 className="text-2xl font-bold text-card-foreground">
                  Create Your Account
                </h2>
                <p className="text-muted-foreground">
                  Register your DadderUP account today, or if you already have an account,{" "}
                  <a href="/auth" className="text-accent hover:text-accent/80 underline">
                    click here to sign in!
                  </a>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <PasswordStrengthIndicator password={formData.password} />
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Your Date of Birth (optional)</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                  />
                </div>

                {/* Father Type */}
                <div className="space-y-2">
                  <Label htmlFor="fatherType">
                    Father Type <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.fatherType} onValueChange={(value) => handleInputChange("fatherType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blood_father">Biological Father</SelectItem>
                      <SelectItem value="flex_dad">Flex Dad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Number of Kids */}
                <div className="space-y-2">
                  <Label htmlFor="numberOfKids">How Many Kids Do You Have? (optional)</Label>
                  <Select value={formData.numberOfKids} onValueChange={(value) => handleInputChange("numberOfKids", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expecting">Expecting Child</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Due Date - shown when expecting */}
                {formData.numberOfKids === "expecting" && (
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">When is the due date?</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => handleInputChange("dueDate", e.target.value)}
                    />
                  </div>
                )}

                {/* Child Inputs - Dynamic inputs based on number of kids */}
                {renderChildInputs()}

                {/* Terms Checkbox */}
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={accepted}
                    onCheckedChange={(checked) => setAccepted(checked as boolean)}
                  />
                  <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                    Yes, I agree to Dadder Enterprises LLC's Terms of Service and Privacy Policy, and consent to receive text updates about services, meetings, and your representative. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help.
                  </Label>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    "Register Now"
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;