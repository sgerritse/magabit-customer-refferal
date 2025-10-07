import React from "react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { NavigationBar } from "@/components/dashboard/NavigationBar";
import { NavigationDrawer } from "@/components/dashboard/NavigationDrawer";
import { AdminSwitchFooter } from "@/components/AdminSwitchFooter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { AvatarCropper } from "@/components/profile/AvatarCropper";
import { updateWordPressUser, getWordPressErrorMessage } from "@/services/wordpressApi";

const profileSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(100),
  last_name: z.string().trim().min(1, "Last name is required").max(100),
  phone: z.string().trim().optional(),
  display_name: z.string().trim().min(1, "Display name is required").max(100),
  date_of_birth: z.string().optional(),
  father_type: z.string().optional(),
  number_of_kids: z.string().optional(),
});

const Profile = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [fatherType, setFatherType] = useState("");
  const [numberOfKids, setNumberOfKids] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [childNames, setChildNames] = useState<{ [key: number]: string }>({});
  const [childAges, setChildAges] = useState<{ [key: number]: string }>({});
  const [wpUserId, setWpUserId] = useState<number | null>(null);
  const [syncingWordPress, setSyncingWordPress] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Use secure decryption to load user data
      const { data: userData, error: userError } = await supabase
        .rpc('get_user_decrypted', { target_user_id: user.id });

      if (userError) throw userError;

      const userInfo = userData && userData.length > 0 ? userData[0] : null;

      // Store WordPress user ID if available
      if (userInfo?.wp_user_id) {
        setWpUserId(userInfo.wp_user_id);
      }

      // Load from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (userInfo) {
        setFirstName(userInfo.first_name || "");
        setLastName(userInfo.last_name || "");
        setEmail(userInfo.email || "");
        setPhone(userInfo.phone || "");
        setDateOfBirth(userInfo.date_of_birth || "");
        setFatherType(userInfo.father_type || "");
        
        // Handle number of kids: 0 or null means expecting, otherwise show the number
        if (userInfo.number_of_kids === null || userInfo.number_of_kids === 0) {
          setNumberOfKids("expecting");
          setDueDate(userInfo.due_date || "");
          setChildNames({});
          setChildAges({});
        } else {
          setNumberOfKids(userInfo.number_of_kids.toString());
          setDueDate("");
          
          // Parse age_of_kids from comma-separated string (format: "Name1:Age1, Name2:Age2")
          if (userInfo.age_of_kids) {
            const children = userInfo.age_of_kids.split(",").map(child => child.trim());
            const namesObj: { [key: number]: string } = {};
            const agesObj: { [key: number]: string } = {};
            
            children.forEach((child, index) => {
              if (child.includes(":")) {
                const [name, age] = child.split(":").map(s => s.trim());
                namesObj[index + 1] = name || "";
                agesObj[index + 1] = age || "";
              } else {
                // Legacy format - just ages
                agesObj[index + 1] = child || "";
              }
            });
            
            setChildNames(namesObj);
            setChildAges(agesObj);
          } else {
            setChildNames({});
            setChildAges({});
          }
        }
      }

      if (profileData) {
        setDisplayName(profileData.display_name || "");
        setAvatarUrl(profileData.avatar_url || "");
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    const validation = profileSchema.safeParse({
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      display_name: displayName,
      date_of_birth: dateOfBirth,
      father_type: fatherType,
      number_of_kids: numberOfKids,
    });

    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0]?.message || "Please check your inputs",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      // Update users table
      // Format child info as "Name1:Age1, Name2:Age2"
      let childInfo = null;
      if (numberOfKids && numberOfKids !== "expecting") {
        const numKids = parseInt(numberOfKids);
        const childPairs = [];
        for (let i = 1; i <= numKids; i++) {
          const name = childNames[i] || "";
          const age = childAges[i] || "";
          if (name || age) {
            childPairs.push(`${name}:${age}`);
          }
        }
        childInfo = childPairs.length > 0 ? childPairs.join(", ") : null;
      }

      // Encrypt PII fields before storing
      const { data: encryptedFirstName } = await supabase
        .rpc('encrypt_sensitive_data', { data: firstName });
      
      const { data: encryptedLastName } = await supabase
        .rpc('encrypt_sensitive_data', { data: lastName });
      
      const { data: encryptedDob } = dateOfBirth 
        ? await supabase.rpc('encrypt_sensitive_data', { data: dateOfBirth })
        : { data: null };

      const { data: encryptedEmail } = await supabase
        .rpc('encrypt_sensitive_data', { data: email });

      const { data: encryptedPhone } = phone
        ? await supabase.rpc('encrypt_sensitive_data', { data: phone })
        : { data: null };

      const { error: userError } = await supabase
        .from('users')
        .update({
          first_name_encrypted: encryptedFirstName,
          last_name_encrypted: encryptedLastName,
          date_of_birth_encrypted: encryptedDob,
          email_encrypted: encryptedEmail,
          phone_encrypted: encryptedPhone,
          father_type: fatherType || null,
          number_of_kids: numberOfKids && numberOfKids !== "expecting" ? parseInt(numberOfKids) : null,
          due_date: numberOfKids === "expecting" && dueDate ? dueDate : null,
          age_of_kids: childInfo,
        })
        .eq('id', user.id);

      if (userError) throw userError;

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Sync with WordPress if user has a WordPress ID
      if (wpUserId) {
        setSyncingWordPress(true);
        const wpResult = await updateWordPressUser({
          user_id: wpUserId,
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone || undefined,
          password: '', // Empty password means no password change
          date_of_birth: dateOfBirth || undefined,
          father_type: (fatherType as 'blood_father' | 'flex_dad') || 'blood_father',
          how_many_kids: numberOfKids && numberOfKids !== "expecting" ? parseInt(numberOfKids) : 0,
          agree_terms: 1, // Always 1 for existing users
        });

        setSyncingWordPress(false);

        if (!wpResult.success) {
          console.error('WordPress sync error:', wpResult);
          toast({
            title: "Warning",
            description: `Profile saved but WordPress sync failed: ${getWordPressErrorMessage(wpResult.code)}`,
            variant: "default",
          });
        } else {
          toast({
            title: "Success",
            description: "Profile updated and synced with WordPress",
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChildNameChange = (childIndex: number, value: string) => {
    setChildNames(prev => ({
      ...prev,
      [childIndex]: value
    }));
  };

  const handleChildAgeChange = (childIndex: number, value: string) => {
    setChildAges(prev => ({
      ...prev,
      [childIndex]: value
    }));
  };

  const renderChildInputs = () => {
    const numKids = parseInt(numberOfKids);
    if (!numKids || numKids === 0 || numberOfKids === "expecting") return null;

    return Array.from({ length: numKids }, (_, index) => (
      <div key={index} className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`child-name-${index + 1}`}>Child {index + 1} Name</Label>
          <Input
            id={`child-name-${index + 1}`}
            placeholder="e.g., Alex"
            value={childNames[index + 1] || ""}
            onChange={(e) => handleChildNameChange(index + 1, e.target.value)}
            className="bg-white text-card-foreground"
          />
        </div>
        <div>
          <Label htmlFor={`child-age-${index + 1}`}>Child {index + 1} Age</Label>
          <Input
            id={`child-age-${index + 1}`}
            placeholder="e.g., 5 years old"
            value={childAges[index + 1] || ""}
            onChange={(e) => handleChildAgeChange(index + 1, e.target.value)}
            className="bg-white text-card-foreground"
          />
        </div>
      </div>
    ));
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Create a temporary URL for the cropper
    const imageUrl = URL.createObjectURL(file);
    setSelectedImageUrl(imageUrl);
    setCropperOpen(true);
  };

  const handleCroppedImage = async (croppedBlob: Blob) => {
    if (!user) return;

    try {
      setUploading(true);

      // Create unique filename
      const fileName = `${user.id}/${Date.now()}.jpg`;

      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').slice(-2).join('/');
        await supabase.storage.from('avatars').remove([oldPath]);
      }

      // Upload new avatar
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedBlob, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const newAvatarUrl = urlData.publicUrl;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(newAvatarUrl);
      
      // Clean up the temporary URL
      URL.revokeObjectURL(selectedImageUrl);
      
      toast({
        title: "Success",
        description: "Profile photo updated successfully",
      });
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload photo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center bg-card p-8 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return "U";
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar onMenuClick={() => setDrawerOpen(true)} />
      <NavigationDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 mt-16">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-primary-foreground/80 mt-2">Manage your personal information and profile photo</p>
        </div>

        <Card className="card-gradient border-card-border">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Photo */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-primary/20">
                  {avatarUrl && <AvatarImage src={avatarUrl} />}
                  <AvatarFallback className="text-2xl bg-success text-primary-foreground">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full bg-accent hover:bg-accent/90 text-white border-none shadow-lg"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Click the camera icon to upload a new photo
              </p>
            </div>

            {/* Avatar Cropper Dialog */}
            <AvatarCropper
              open={cropperOpen}
              onOpenChange={setCropperOpen}
              imageUrl={selectedImageUrl}
              onCropComplete={handleCroppedImage}
            />

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How you'd like to be called"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email cannot be changed here
              </p>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <Label htmlFor="dateOfBirth">Date of Birth (Optional)</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="fatherType" className="text-card-foreground">Father Type</Label>
              <select
                id="fatherType"
                value={fatherType}
                onChange={(e) => setFatherType(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-input text-input-foreground border-2 border-input-border"
              >
                <option value="">Select type</option>
                <option value="blood_father">Biological Father</option>
                <option value="flex_dad">Flex Dad</option>
              </select>
            </div>

            <div>
              <Label htmlFor="numberOfKids">Number of Kids</Label>
              <Select value={numberOfKids} onValueChange={setNumberOfKids}>
                <SelectTrigger className="bg-white text-card-foreground border-input-border">
                  <SelectValue placeholder="Select option" className="text-card-foreground" />
                </SelectTrigger>
                <SelectContent className="bg-white border-input-border">
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
            {numberOfKids === "expecting" && (
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-white text-card-foreground"
                />
              </div>
            )}

            {/* Child Inputs - Dynamic inputs based on number of kids */}
            {renderChildInputs()}

            <Button
              onClick={handleSaveProfile}
              disabled={saving || syncingWordPress}
              className="w-full"
              size="lg"
            >
              {saving || syncingWordPress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {syncingWordPress ? 'Syncing with WordPress...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Profile
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <AdminSwitchFooter />
    </div>
  );
};

export default Profile;
