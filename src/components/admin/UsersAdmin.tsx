import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Users, Calendar, Phone, Mail, Trash2, Shield, ShieldCheck, UserCheck, RotateCcw, MoreHorizontal, Edit, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAdminSwitch } from "@/contexts/AdminSwitchContext";
import { useNavigate } from "react-router-dom";
import { CompletedChallengesView } from "./CompletedChallengesView";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  father_type: string | null;
  number_of_kids: number | null;
  age_of_kids: string | null;
  created_at: string;
  profiles: {
    display_name: string | null;
  } | null;
  user_roles: Array<{
    role: string;
  }> | null;
}

const UsersAdmin = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Get the admin switch context
  const adminSwitchContext = useAdminSwitch();
  const { switchToUser } = adminSwitchContext;

  const handleSwitchToUser = async (userId: string, userName: string) => {
    try {
      await switchToUser(userId, userName);
      toast({
        title: "Switched to User View",
        description: `Now viewing as ${userName}`,
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Switch Failed",
        description: error.message || "Failed to switch to user view.",
        variant: "destructive",
      });
    }
  };

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Use admin bulk decryption function to get all users with decrypted PII
      const { data: usersData, error: usersError } = await supabase
        .rpc('get_all_users_decrypted');

      if (usersError) throw usersError;

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, display_name");

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Create a map of profiles by user_id for easy lookup
      const profilesMap = profilesData.reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>);

      // Create a map of roles by user_id
      const rolesMap = rolesData.reduce((acc, roleEntry) => {
        if (!acc[roleEntry.user_id]) {
          acc[roleEntry.user_id] = [];
        }
        acc[roleEntry.user_id].push({ role: roleEntry.role });
        return acc;
      }, {} as Record<string, any[]>);

      // Combine users with their profiles and roles
      const combinedData = usersData.map(user => ({
        ...user,
        profiles: profilesMap[user.id] || null,
        user_roles: rolesMap[user.id] || null
      }));

      return combinedData;
    },
  });

  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.first_name.toLowerCase().includes(term) ||
          user.last_name.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          (user.phone && user.phone.includes(term))
      );
    }

    // Apply category filter
    if (filterBy !== "all") {
      filtered = filtered.filter((user) => {
        switch (filterBy) {
          case "recent":
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return new Date(user.created_at) > weekAgo;
          case "blood-father":
            return user.father_type === 'blood_father';
          case "flex-dad":
            return user.father_type === 'flex_dad';
          case "kids-0":
            return user.number_of_kids === 0;
          case "kids-1":
            return user.number_of_kids === 1;
          case "kids-2":
            return user.number_of_kids === 2;
          case "kids-3":
            return user.number_of_kids === 3;
          case "kids-4":
            return user.number_of_kids === 4;
          case "kids-5+":
            return user.number_of_kids && user.number_of_kids >= 5;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [users, searchTerm, filterBy]);

  // Helper function to check if user has a specific role
  const hasRole = (user: User, role: string) => {
    return user.user_roles?.some(r => r.role === role) || false;
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, pageSize]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, filterBy]);

  // Calculate maximum number of kids across all users for dynamic columns
  const maxKids = useMemo(() => {
    return users.reduce((max, user) => {
      if (!user.age_of_kids) return max;
      const ages = user.age_of_kids.split(',').map(a => a.trim()).filter(a => a);
      return Math.max(max, ages.length);
    }, 0);
  }, [users]);

  // Helper function to parse kid ages
  const parseKidAges = (ageString: string | null): string[] => {
    if (!ageString) return [];
    return ageString.split(',').map(a => a.trim()).filter(a => a);
  };

  const stats = useMemo(() => {
    // Filter out admin users from statistics
    const regularUsers = users.filter(user => 
      !user.user_roles?.some(r => r.role === 'admin')
    );
    
    const totalUsers = regularUsers.length;
    const usersWithKids = regularUsers.filter(u => u.number_of_kids && u.number_of_kids > 0);
    const averageKids = usersWithKids.length > 0 
      ? Math.round(usersWithKids.reduce((sum, u) => sum + (u.number_of_kids || 0), 0) / usersWithKids.length)
      : 0;
    const flexDads = regularUsers.filter(u => u.father_type === 'flex_dad').length;
    const biologicalDads = regularUsers.filter(u => u.father_type === 'blood_father').length;
    const recentUsers = regularUsers.filter(u => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(u.created_at) > weekAgo;
    }).length;

    return { totalUsers, averageKids, flexDads, biologicalDads, recentUsers };
  }, [users]);

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      // Call the edge function to delete the user from both auth and database
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });

      if (error) throw error;

      toast({
        title: "User Deleted",
        description: `${userName} has been completely deleted from the system.`,
      });

      // Refresh the users list
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (error: any) {
      toast({
        title: "Delete Failed", 
        description: error.message || "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: string, userName: string) => {
    try {
      // Verify current user is admin
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('Not authenticated');
      }

      // Additional frontend validation (backend will also validate)
      if (currentUser.user.id === userId) {
        toast({
          title: "Role Update Failed",
          description: "You cannot change your own role.",
          variant: "destructive",
        });
        return;
      }

      // Check if this would remove the last admin
      if (newRole !== 'admin') {
        const { data: adminCount } = await supabase
          .from('user_roles')
          .select('user_id', { count: 'exact' })
          .eq('role', 'admin')
          .neq('user_id', userId);

        if (adminCount && adminCount.length === 0) {
          toast({
            title: "Role Update Failed",
            description: "Cannot remove the last administrator.",
            variant: "destructive",
          });
          return;
        }
      }

      // Update role in user_roles table (delete old role, insert new one)
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      const { error } = await supabase
        .from("user_roles")
        .insert([{ user_id: userId, role: newRole as 'admin' | 'moderator' | 'user' }]);

      if (error) throw error;

      toast({
        title: "Role Updated",
        description: `${userName} is now a${newRole === 'admin' ? 'n' : ''} ${newRole}.`,
      });

      // Refresh the users list
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (error: any) {
      toast({
        title: "Role Update Failed", 
        description: error.message || "Failed to update user role. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleResetUser = async (userId: string, userName: string) => {
    try {
      // Reset user points
      const { error: pointsError } = await supabase
        .from("user_points")
        .delete()
        .eq("user_id", userId);

      if (pointsError) throw pointsError;

      // Reset user badges  
      const { error: badgesError } = await supabase
        .from("user_badges")
        .delete()
        .eq("user_id", userId);

      if (badgesError) throw badgesError;

      // Reset answer logs
      const { error: logsError } = await supabase
        .from("answer_logs")
        .delete()
        .eq("user_id", userId);

      if (logsError) throw logsError;

      toast({
        title: "User Progress Reset",
        description: `${userName}'s progress, points, badges, and challenge logs have been completely reset.`,
      });

      // Refresh the users list
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (error) {
      toast({
        title: "Reset Failed", 
        description: "Failed to reset user progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUser = async (userId: string, updatedData: any) => {
    try {
      // Encrypt PII fields if they are being updated
      const dataToUpdate = { ...updatedData };
      
      if (updatedData.first_name) {
        const { data: encrypted } = await supabase
          .rpc('encrypt_sensitive_data', { data: updatedData.first_name });
        dataToUpdate.first_name_encrypted = encrypted;
        delete dataToUpdate.first_name;
      }
      
      if (updatedData.last_name) {
        const { data: encrypted } = await supabase
          .rpc('encrypt_sensitive_data', { data: updatedData.last_name });
        dataToUpdate.last_name_encrypted = encrypted;
        delete dataToUpdate.last_name;
      }
      
      if (updatedData.date_of_birth) {
        const { data: encrypted } = await supabase
          .rpc('encrypt_sensitive_data', { data: updatedData.date_of_birth });
        dataToUpdate.date_of_birth_encrypted = encrypted;
        delete dataToUpdate.date_of_birth;
      }

      const { error } = await supabase
        .from("users")
        .update(dataToUpdate)
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "User Updated",
        description: "User information has been successfully updated.",
      });

      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update user information. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-red-600">
          Error loading users: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Recent (7 days)</p>
                <p className="text-2xl font-bold">{stats.recentUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Dads</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Biological Dads</p>
                <p className="text-2xl font-bold">{stats.biologicalDads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Flex Dads</p>
                <p className="text-2xl font-bold">{stats.flexDads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Average Kids per Dad</p>
                <p className="text-2xl font-bold">{stats.averageKids}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-full sm:w-40">
              <Label>Filter By</Label>
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="recent">Recent (7 days)</SelectItem>
                  <SelectItem value="blood-father">Biological Fathers</SelectItem>
                  <SelectItem value="flex-dad">Flex Dads</SelectItem>
                  <SelectItem value="kids-0">0 Kids</SelectItem>
                  <SelectItem value="kids-1">1 Kid</SelectItem>
                  <SelectItem value="kids-2">2 Kids</SelectItem>
                  <SelectItem value="kids-3">3 Kids</SelectItem>
                  <SelectItem value="kids-4">4 Kids</SelectItem>
                  <SelectItem value="kids-5+">5+ Kids</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-32">
              <Label>Per Page</Label>
              <Select value={pageSize.toString()} onValueChange={(val) => setPageSize(Number(val))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pagination Info */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredUsers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} users
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Users Table - Horizontal Scroll */}
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-card z-10">Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Father Type</TableHead>
                  <TableHead>Total Kids</TableHead>
                  {Array.from({ length: maxKids }, (_, i) => (
                    <TableHead key={`kid-${i}`}>Kid {i + 1} Age</TableHead>
                  ))}
                  <TableHead>Registered</TableHead>
                  <TableHead className="sticky right-0 bg-card z-10">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9 + maxKids} className="text-center py-8 text-muted-foreground">
                      No users found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => {
                    const kidAges = parseKidAges(user.age_of_kids);
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium sticky left-0 bg-card z-10">
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="whitespace-nowrap">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.phone ? (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span className="whitespace-nowrap">{user.phone}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {hasRole(user, 'admin') ? (
                              <ShieldCheck className="h-4 w-4 text-red-600" />
                            ) : (
                              <Shield className="h-4 w-4 text-blue-600" />
                            )}
                            <Badge variant={hasRole(user, 'admin') ? 'destructive' : 'secondary'}>
                              {hasRole(user, 'admin') ? 'Admin' : 'User'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.father_type ? (
                            <Badge variant={user.father_type === 'flex_dad' ? 'default' : 'secondary'}>
                              {user.father_type === 'flex_dad' ? 'Flex Dad' : 'Biological Father'}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.number_of_kids !== null ? (
                            <Badge variant="secondary">
                              {user.number_of_kids === 0 ? "None" : user.number_of_kids}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        {Array.from({ length: maxKids }, (_, i) => (
                          <TableCell key={`${user.id}-kid-${i}`}>
                            {kidAges[i] ? (
                              <Badge variant="outline" className="whitespace-nowrap">
                                {kidAges[i]}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                        ))}
                        <TableCell className="text-gray-600 whitespace-nowrap">
                          {format(new Date(user.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="sticky right-0 bg-card z-10">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-card border-card-border">
                            {/* Switch to User */}
                            {!hasRole(user, 'admin') && (
                              <DropdownMenuItem
                                onClick={() => handleSwitchToUser(user.id, `${user.first_name} ${user.last_name}`)}
                                className="cursor-pointer text-card-foreground hover:bg-accent/10"
                              >
                                <UserCheck className="h-4 w-4 mr-2 text-green-500" />
                                Switch to User
                              </DropdownMenuItem>
                            )}

                            {/* Edit User */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <DropdownMenuItem 
                                  onSelect={(e) => e.preventDefault()}
                                  className="cursor-pointer text-card-foreground hover:bg-accent/10"
                                >
                                  <Edit className="h-4 w-4 mr-2 text-blue-500" />
                                  Edit User
                                </DropdownMenuItem>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Edit User Information</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                      id="firstName"
                                      defaultValue={user.first_name}
                                      onBlur={(e) => handleUpdateUser(user.id, { first_name: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                      id="lastName"
                                      defaultValue={user.last_name}
                                      onBlur={(e) => handleUpdateUser(user.id, { last_name: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                      id="email"
                                      type="email"
                                      defaultValue={user.email}
                                      onBlur={(e) => handleUpdateUser(user.id, { email: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                      id="phone"
                                      defaultValue={user.phone || ''}
                                      onBlur={(e) => handleUpdateUser(user.id, { phone: e.target.value || null })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="numberOfKids">Number of Kids</Label>
                                    <Input
                                      id="numberOfKids"
                                      type="number"
                                      defaultValue={user.number_of_kids || ''}
                                      onBlur={(e) => handleUpdateUser(user.id, { number_of_kids: parseInt(e.target.value) || null })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="ageOfKids">Age of Kids</Label>
                                    <Input
                                      id="ageOfKids"
                                      defaultValue={user.age_of_kids || ''}
                                      onBlur={(e) => handleUpdateUser(user.id, { age_of_kids: e.target.value || null })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="fatherType">Father Type</Label>
                                    <Select 
                                      defaultValue={user.father_type || ''} 
                                      onValueChange={(value) => handleUpdateUser(user.id, { father_type: value || null })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select father type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="blood_father">Biological Father</SelectItem>
                                        <SelectItem value="flex_dad">Flex Dad</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            {/* Completed Challenges */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <DropdownMenuItem 
                                  onSelect={(e) => e.preventDefault()}
                                  className="cursor-pointer text-card-foreground hover:bg-accent/10"
                                >
                                  <FileText className="h-4 w-4 mr-2 text-purple-500" />
                                  Completed Challenges
                                </DropdownMenuItem>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Completed Challenges - {user.first_name} {user.last_name}</DialogTitle>
                                </DialogHeader>
                                <CompletedChallengesView userId={user.id} />
                              </DialogContent>
                            </Dialog>

                            {/* Role Toggle */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  onSelect={(e) => e.preventDefault()}
                                  className="cursor-pointer text-card-foreground hover:bg-accent/10"
                                >
                                  {hasRole(user, 'admin') ? (
                                    <>
                                      <Shield className="h-4 w-4 mr-2 text-blue-500" />
                                      Make User
                                    </>
                                  ) : (
                                    <>
                                      <ShieldCheck className="h-4 w-4 mr-2 text-amber-500" />
                                      Make Admin
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Change User Role</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to make {user.first_name} {user.last_name} {hasRole(user, 'admin') ? 'a regular user' : 'an admin'}? 
                                    {!hasRole(user, 'admin') && ' This will give them full administrative privileges.'}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className={hasRole(user, 'admin') 
                                      ? "bg-blue-600 hover:bg-blue-700" 
                                      : "bg-red-600 hover:bg-red-700"
                                    }
                                    onClick={() => handleRoleChange(
                                      user.id, 
                                      hasRole(user, 'admin') ? 'user' : 'admin',
                                      `${user.first_name} ${user.last_name}`
                                    )}
                                  >
                                    Make {hasRole(user, 'admin') ? 'User' : 'Admin'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            {/* Reset Progress */}
                            <>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem 
                                      onSelect={(e) => e.preventDefault()}
                                      className="cursor-pointer text-card-foreground hover:bg-accent/10"
                                    >
                                      <RotateCcw className="h-4 w-4 mr-2 text-orange-500" />
                                      Reset Progress
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Reset User Progress</AlertDialogTitle>
                                       <AlertDialogDescription>
                                         Are you sure you want to reset all progress for {user.first_name} {user.last_name}? 
                                         This will permanently delete their points, badges, and challenge logs.
                                       </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-destructive hover:bg-destructive/90"
                                        onClick={() => handleResetUser(user.id, `${user.first_name} ${user.last_name}`)}
                                      >
                                        Reset Progress
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            </>

                            {/* Delete User */}
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  onSelect={(e) => e.preventDefault()}
                                  className="cursor-pointer text-red-500 hover:bg-red-500/10 hover:text-red-500 focus:text-red-500"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to permanently delete {user.first_name} {user.last_name}? 
                                    This action cannot be undone and will remove all their data.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => handleDeleteUser(user.id, `${user.first_name} ${user.last_name}`)}
                                  >
                                    Delete User
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersAdmin;