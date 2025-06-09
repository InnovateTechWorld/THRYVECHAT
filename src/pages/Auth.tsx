import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useToast } from "../components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Chrome, Mail } from "lucide-react";
import { supabase } from "../supabaseClient";
import { API_URL } from "../lib/api";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOTP] = useState("");
  const [name, setName] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [resetStep, setResetStep] = useState<'request' | 'verify' | 'newPassword'>('request');
  const [newPassword, setNewPassword] = useState("");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const PROFILE_ENDPOINT = `${API_URL}/profile`;

  // Handle OAuth callback
  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        localStorage.setItem('access_token', session.access_token);
        localStorage.setItem('refresh_token', session.refresh_token);
        const from = location.state?.from?.pathname || '/chat';
        navigate(from);
      }
    };

    // Check if this is a callback from OAuth
    if (window.location.hash.includes('access_token')) {
      handleAuthCallback();
    }
  }, [navigate, location]);

  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) throw new Error('No session available');

      // Store token in localStorage
      localStorage.setItem('access_token', session.access_token);
      localStorage.setItem('refresh_token', session.refresh_token);

      // Test the token with profile endpoint
      const profileResponse = await fetch(PROFILE_ENDPOINT, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!profileResponse.ok) {
        console.warn('Profile endpoint not available, proceeding with authentication');
      }
  
      if (error) throw error;
      
      toast({
        title: "Sign in successful!",
        description: "Welcome back!",
      });
      const from = location.state?.from?.pathname || '/chat';
      navigate(from);
    } catch (error: any) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
        }
      });
  
      if (error) throw error;
  
      setShowOTPInput(true);
      toast({
        title: "Verification code sent!",
        description: "Please check your email for the verification code",
      });
    } catch (error: any) {
      toast({
        title: "Error signing up",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const verifyOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup'
      });
  
      if (error) throw error;

      // Get session after verification
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        localStorage.setItem('access_token', session.access_token);
        localStorage.setItem('refresh_token', session.refresh_token);
      }
  
      toast({
        title: "Email verified!",
        description: "Your account has been verified successfully",
      });
      const from = location.state?.from?.pathname || '/chat';
      navigate(from);
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setResetStep('verify');
      toast({
        title: "Reset code sent",
        description: "Check your email for the verification code"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVerifyAndReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery'
      });
      if (error) throw error;

      // Update password after OTP verification
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (updateError) throw updateError;

      toast({
        title: "Password reset successful",
        description: "You can now login with your new password"
      });
      setShowResetPassword(false);
      setResetStep('request');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/chat`,
        },
      });
      if (error) throw error;
      
    } catch (error: any) {
      toast({
        title: "Error during Google Sign-In",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setShowOTPInput(true);
      toast({
        title: "Reset code sent",
        description: "Check your email for the verification code"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetWithOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery'
      });
      if (error) throw error;

      // Update password after OTP verification
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (updateError) throw updateError;

      toast({
        title: "Password reset successful",
        description: "You can now login with your new password"
      });
      setShowResetDialog(false);
      setShowOTPInput(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderResetForm = () => {
    switch (resetStep) {
      case 'request':
        return (
          <form onSubmit={handleResetPassword}>
            <div className="space-y-4">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Code"}
              </Button>
            </div>
          </form>
        );
      case 'verify':
        return (
          <form onSubmit={handleVerifyAndReset}>
            <div className="space-y-4">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                value={otp}
                onChange={(e) => setOTP(e.target.value)}
                required
              />
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </form>
        );
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen px-3 py-6 md:p-4 bg-background text-foreground safe-top safe-bottom"> {/* Added safe areas and mobile padding */}
      <Card className="w-full max-w-md bg-card shadow-lg border-border/50"> {/* Added shadow and border */}
        <Tabs defaultValue="signin" className="w-full">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl font-bold text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              <TabsList className="grid w-full grid-cols-2 p-1 gap-1">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showResetPassword ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-11 touch-manipulation" disabled={isLoading}>
                  Send Reset Link
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full h-11 touch-manipulation"
                  onClick={() => setShowResetPassword(false)}
                >
                  Back to Sign In
                </Button>
              </form>
            ) : (
              <>
                <TabsContent value="signin">
                  <form onSubmit={handleEmailSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        className="h-11"
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        className="h-11"
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-sm text-blue-600"
                      onClick={() => setShowResetDialog(true)}
                    >
                      Forgot Password?
                    </Button>
                    <Button type="submit" className="w-full h-11 touch-manipulation" disabled={isLoading}>
                      <Mail className="mr-2" />
                      Sign In with Email
                    </Button>
                  </form>
                </TabsContent>

                <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {showOTPInput ? "Enter Reset Code" : "Reset Password"}
                      </DialogTitle>
                    </DialogHeader>
                    {!showOTPInput ? (
                      <form onSubmit={handleResetRequest} className="space-y-4">
                        <Label htmlFor="reset-email">Email</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                        <Button type="submit" className="w-full h-11 touch-manipulation" disabled={isLoading}>
                          Send Reset Code
                        </Button>
                      </form>
                    ) : (
                      <form onSubmit={handleResetWithOTP} className="space-y-4">
                        <Label htmlFor="otp">Verification Code</Label>
                        <Input
                          id="otp"
                          value={otp}
                          onChange={(e) => setOTP(e.target.value)}
                          required
                        />
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                        <Button type="submit" className="w-full h-11 touch-manipulation" disabled={isLoading}>
                          Reset Password
                        </Button>
                      </form>
                    )}
                  </DialogContent>
                </Dialog>
                
                <TabsContent value="signup">
                  {showOTPInput ? (
                    <form onSubmit={verifyOTP} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="otp">Verification Code</Label>
                        <Input
                          id="otp"
                          value={otp}
                          onChange={(e) => setOTP(e.target.value)}
                          placeholder="Enter verification code"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full h-11 touch-manipulation" disabled={isLoading}>
                        Verify Code
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleEmailSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          className="h-11"
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          className="h-11"
                          id="signup-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          className="h-11"
                          id="signup-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create a password"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full h-11 touch-manipulation" disabled={isLoading}>
                        <Mail className="mr-2" />
                        Sign Up with Email
                      </Button>
                    </form>
                  )}
                </TabsContent>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground text-[11px] md:text-xs">Or continue with</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  className="w-full h-11 touch-manipulation"
                  disabled={isLoading}
                >
                  <Chrome className="mr-2" />
                  Continue with Google
                </Button>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-center text-xs md:text-sm text-muted-foreground px-3">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </CardFooter>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;