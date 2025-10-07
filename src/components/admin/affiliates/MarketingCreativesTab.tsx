import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, Eye, Trash2, Image as ImageIcon, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export const MarketingCreativesTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [creativeName, setCreativeName] = useState("");
  const [creativeCategory, setCreativeCategory] = useState("banner");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Fetch marketing creatives
  const { data: creatives, isLoading } = useQuery({
    queryKey: ["marketing-creatives"],
    queryFn: async () => {
      const { data, error } = await supabase
        .storage
        .from("marketing-creatives")
        .list("", {
          limit: 100,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) throw error;

      // Get public URLs for all files
      const creativesWithUrls = data.map((file) => {
        const { data: urlData } = supabase.storage
          .from("marketing-creatives")
          .getPublicUrl(file.name);

        return {
          ...file,
          url: urlData.publicUrl,
        };
      });

      return creativesWithUrls;
    },
  });

  // Upload creative
  const uploadCreativeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("No file selected");

      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${creativeCategory}/${creativeName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("marketing-creatives")
        .upload(fileName, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      return fileName;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-creatives"] });
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setCreativeName("");
      setCreativeCategory("banner");
      toast({
        title: "Success",
        description: "Marketing creative uploaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete creative
  const deleteCreativeMutation = useMutation({
    mutationFn: async (fileName: string) => {
      const { error } = await supabase.storage
        .from("marketing-creatives")
        .remove([fileName]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-creatives"] });
      toast({
        title: "Success",
        description: "Creative deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const getCategoryBadge = (fileName: string) => {
    if (fileName.includes("banner")) return <Badge>Banner</Badge>;
    if (fileName.includes("social")) return <Badge variant="secondary">Social</Badge>;
    if (fileName.includes("email")) return <Badge variant="outline">Email</Badge>;
    if (fileName.includes("logo")) return <Badge variant="default">Logo</Badge>;
    return <Badge variant="secondary">Other</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Marketing Creatives</h3>
          <p className="text-sm text-muted-foreground">
            Upload and manage marketing assets for brand ambassadors
          </p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Creative
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Marketing Creative</DialogTitle>
              <DialogDescription>
                Add a new marketing asset for ambassadors to download and use
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="creative-name">Asset Name</Label>
                <Input
                  id="creative-name"
                  placeholder="e.g., Holiday Banner 2024"
                  value={creativeName}
                  onChange={(e) => setCreativeName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={creativeCategory} onValueChange={setCreativeCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banner">Banner</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="logo">Logo</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                />
              </div>
              {previewUrl && (
                <div className="border rounded-lg p-4">
                  <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto" />
                </div>
              )}
              <Button
                onClick={() => uploadCreativeMutation.mutate()}
                disabled={!selectedFile || !creativeName || uploadCreativeMutation.isPending}
                className="w-full"
              >
                {uploadCreativeMutation.isPending ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Creatives</CardTitle>
          <CardDescription>Ambassadors can download these assets from their dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : creatives?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No marketing creatives uploaded yet
                  </TableCell>
                </TableRow>
              ) : (
                creatives?.map((creative) => (
                  <TableRow key={creative.name}>
                    <TableCell className="font-medium flex items-center gap-2">
                      {getFileIcon(creative.name)}
                      {creative.name.split("/").pop()}
                    </TableCell>
                    <TableCell>{getCategoryBadge(creative.name)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {creative.name.split(".").pop()?.toUpperCase()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(creative.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(creative.url, "_blank")}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const a = document.createElement("a");
                            a.href = creative.url;
                            a.download = creative.name.split("/").pop() || creative.name;
                            a.click();
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteCreativeMutation.mutate(creative.name)}
                          disabled={deleteCreativeMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
