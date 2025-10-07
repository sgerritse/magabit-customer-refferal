import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut } from "lucide-react";

interface AvatarCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onCropComplete: (croppedBlob: Blob) => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const AvatarCropper = ({ open, onOpenChange, imageUrl, onCropComplete }: AvatarCropperProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropCompleteCallback = useCallback(
    (_croppedArea: any, croppedAreaPixels: CropArea) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createCroppedImage = async (): Promise<Blob> => {
    if (!croppedAreaPixels) throw new Error("No crop area");

    const image = new Image();
    image.src = imageUrl;
    
    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No canvas context");

    // Set canvas size to desired avatar size (400x400)
    const targetSize = 400;
    canvas.width = targetSize;
    canvas.height = targetSize;

    // Draw the cropped portion scaled to fit
    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      targetSize,
      targetSize
    );

    // Compress until under 5MB
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    let quality = 0.9;
    let blob: Blob | null = null;

    while (quality > 0.1) {
      blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(
          (b) => resolve(b),
          "image/jpeg",
          quality
        );
      });

      if (!blob) throw new Error("Canvas to Blob failed");
      if (blob.size <= maxSize) break;
      
      quality -= 0.1;
    }

    if (!blob) throw new Error("Failed to compress image");
    return blob;
  };

  const handleSave = async () => {
    try {
      setProcessing(true);
      const croppedBlob = await createCroppedImage();
      onCropComplete(croppedBlob);
      onOpenChange(false);
    } catch (error) {
      console.error("Error cropping image:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adjust Your Photo</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Cropper Area */}
          <div className="relative h-[400px] bg-black rounded-lg overflow-hidden">
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropCompleteCallback}
              onZoomChange={setZoom}
            />
          </div>

          {/* Zoom Controls */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Zoom</label>
              <span className="text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <ZoomOut className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                min={1}
                max={3}
                step={0.1}
                className="flex-1"
              />
              <ZoomIn className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Drag the image to reposition • Pinch or use the slider to zoom
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={processing}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={processing}>
            {processing ? "Processing..." : "Save Photo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
