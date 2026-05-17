import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, Trash2, ChevronLeft, ChevronRight, ImagePlus, Loader2, X, ZoomIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VehicleImage {
  key: string;
  url: string | null;
}

interface VehicleImageGalleryProps {
  vehicleId: number;
  vehicleName: string;
}

export function VehicleImageGallery({ vehicleId, vehicleName }: VehicleImageGalleryProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const { data: images, isLoading } = useQuery<VehicleImage[]>({
    queryKey: ["/api/vehicles", String(vehicleId), "images"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(f => formData.append("images", f));
      const res = await fetch(`/api/vehicles/${vehicleId}/images`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Upload fejlede");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles", String(vehicleId), "images"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles", String(vehicleId)] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({ title: `${data.uploaded} billede(r) uploadet` });
    },
    onError: (error: Error) => {
      toast({ title: "Upload fejlede", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (key: string) => {
      const res = await fetch(`/api/vehicles/${vehicleId}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Sletning fejlede");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles", String(vehicleId), "images"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles", String(vehicleId)] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      setSelectedIndex(0);
      toast({ title: "Billede slettet" });
    },
    onError: (error: Error) => {
      toast({ title: "Sletning fejlede", description: error.message, variant: "destructive" });
    },
  });

  const handleFiles = useCallback((files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f =>
      ["image/jpeg", "image/png", "image/webp", "image/avif"].includes(f.type)
    );
    if (validFiles.length === 0) {
      toast({ title: "Ingen gyldige billeder", description: "Brug JPG, PNG eller WebP format.", variant: "destructive" });
      return;
    }
    if (validFiles.length > 10) {
      toast({ title: "Maks 10 billeder ad gangen", variant: "destructive" });
      return;
    }
    uploadMutation.mutate(validFiles);
  }, [uploadMutation, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const validImages = (images || []).filter(img => img.url);
  const placeholderImg = `https://placehold.co/600x400/1a2332/B9D9EB?text=${encodeURIComponent(vehicleName)}`;
  const currentImage = validImages[selectedIndex];

  if (isLoading) {
    return <Skeleton className="w-full h-48 rounded-md" />;
  }

  return (
    <div className="space-y-2">
      <div
        className={`relative w-full h-48 rounded-md overflow-hidden ${isDragOver ? "ring-2 ring-[#FF6319]" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        data-testid="image-gallery-main"
      >
        <img
          src={currentImage?.url || placeholderImg}
          alt={vehicleName}
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => currentImage && setLightboxOpen(true)}
          data-testid="image-main-display"
        />

        {isDragOver && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <div className="text-center">
              <Upload className="w-8 h-8 mx-auto mb-1 text-[#FF6319]" />
              <p className="text-sm font-medium">Slip billeder her</p>
            </div>
          </div>
        )}

        {uploadMutation.isPending && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#FF6319]" />
            <span className="ml-2 text-sm font-medium">Uploader...</span>
          </div>
        )}

        {validImages.length > 1 && (
          <>
            <Button
              size="icon"
              variant="ghost"
              className="absolute left-1 top-1/2 -translate-y-1/2 bg-background/60 backdrop-blur-sm"
              onClick={() => setSelectedIndex((selectedIndex - 1 + validImages.length) % validImages.length)}
              data-testid="button-image-prev"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-background/60 backdrop-blur-sm"
              onClick={() => setSelectedIndex((selectedIndex + 1) % validImages.length)}
              data-testid="button-image-next"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}

        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          {currentImage && (
            <Button
              size="icon"
              variant="ghost"
              className="bg-background/60 backdrop-blur-sm"
              onClick={() => setLightboxOpen(true)}
              data-testid="button-image-zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          )}
        </div>

        {validImages.length > 0 && (
          <div className="absolute bottom-2 left-2">
            <span className="text-xs bg-background/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-foreground" data-testid="text-image-count">
              {selectedIndex + 1} / {validImages.length}
            </span>
          </div>
        )}
      </div>

      {validImages.length > 1 && (
        <div className="flex gap-1 overflow-x-auto pb-1">
          {validImages.map((img, i) => (
            <button
              key={img.key}
              onClick={() => setSelectedIndex(i)}
              className={`flex-shrink-0 w-14 h-10 rounded overflow-hidden border-2 transition-colors ${
                i === selectedIndex ? "border-[#FF6319]" : "border-transparent"
              }`}
              data-testid={`button-thumb-${i}`}
            >
              <img src={img.url || ""} alt="" className="w-full h-full object-cover" data-testid={`img-thumb-${i}`} />
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          data-testid="input-image-upload"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
          data-testid="button-upload-images"
        >
          <ImagePlus className="w-3.5 h-3.5 mr-1" />
          Upload Billeder
        </Button>
        {currentImage && (
          <Button
            size="sm"
            variant="outline"
            className="text-red-500"
            onClick={() => deleteMutation.mutate(currentImage.key)}
            disabled={deleteMutation.isPending}
            data-testid="button-delete-image"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Slet
          </Button>
        )}
      </div>

      {lightboxOpen && currentImage?.url && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
          data-testid="lightbox-overlay"
        >
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-4 right-4 text-white"
            onClick={() => setLightboxOpen(false)}
            data-testid="button-lightbox-close"
          >
            <X className="w-5 h-5" />
          </Button>
          {validImages.length > 1 && (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white"
                onClick={(e) => { e.stopPropagation(); setSelectedIndex((selectedIndex - 1 + validImages.length) % validImages.length); }}
                data-testid="button-lightbox-prev"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white"
                onClick={(e) => { e.stopPropagation(); setSelectedIndex((selectedIndex + 1) % validImages.length); }}
                data-testid="button-lightbox-next"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          )}
          <img
            src={currentImage.url}
            alt={vehicleName}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
            data-testid="image-lightbox"
          />
        </div>
      )}
    </div>
  );
}
