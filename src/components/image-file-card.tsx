"use client";

import { useState, useImperativeHandle, forwardRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Download, Loader2, X, XCircle, Sparkles } from "lucide-react";
import type { IFile, OutputFormat } from "./image-converter-client";
import { jsPDF } from "jspdf";

type ConversionStatus = "idle" | "converting" | "success" | "error";

interface ImageFileCardProps {
  fileData: IFile;
  onRemove: (id: string) => void;
}

export interface ImageFileCardRef {
  handleConvert: (format?: OutputFormat) => Promise<void>;
}

const formatToMime: Record<string, string> = {
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  ico: "image/x-icon",
  webp: "image/webp",
  bmp: "image/bmp",
  gif: "image/gif",
  tiff: "image/tiff",
  pdf: "application/pdf",
};

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


export const ImageFileCard = forwardRef<ImageFileCardRef, ImageFileCardProps>(({ fileData, onRemove }, ref) => {
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");
  const [status, setStatus] = useState<ConversionStatus>("idle");
  const [result, setResult] = useState<{ url: string; fileName: string; } | null>(null);
  const { toast } = useToast();
  
  const getFileExtension = (format: OutputFormat) => {
    if (format === 'jpeg') return 'jpg';
    return format;
  };

  const convertImage = async (dataUrl: string, format: OutputFormat): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img");
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        if (format === 'ico') {
          width = 32;
          height = 32;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Could not get canvas context"));

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);

        if (format === 'pdf') {
          const doc = new jsPDF({
            orientation: width > height ? 'l' : 'p',
            unit: 'px',
            format: [width, height]
          });
          ctx.drawImage(img, 0, 0, width, height);
          doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, width, height);
          resolve(doc.output('datauristring'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        const mimeType = format === 'ico' ? 'image/png' : formatToMime[format];
        const quality = format === 'jpeg' ? 0.9 : undefined;
        
        try {
            const data = canvas.toDataURL(mimeType, quality);
            resolve(data);
        } catch (e: any) {
            if (e.name === 'SecurityError') {
                reject(new Error(`Conversion to ${format.toUpperCase()} is not supported due to browser security restrictions.`));
            } else {
                reject(new Error(`Your browser may not support conversion to ${format.toUpperCase()}.`));
            }
        }
      };
      img.onerror = (e) => {
        console.error("Image loading error:", e);
        reject(new Error("Could not load image. It might be corrupted or in an unsupported format."));
      };
      img.crossOrigin = "Anonymous";
      img.src = dataUrl;
    });
  };

  const handleConvert = async (format?: OutputFormat) => {
    const finalFormat = format || outputFormat;
    if (format) {
      setOutputFormat(format);
    }
    setResult(null);
    setStatus("converting");
    try {
      const convertedUrl = await convertImage(fileData.preview, finalFormat);
      const originalName = fileData.file.name.substring(0, fileData.file.name.lastIndexOf('.'));
      const newExtension = getFileExtension(finalFormat);

      setResult({
        url: convertedUrl,
        fileName: `${originalName}.${newExtension}`,
      });
      setStatus("success");
    } catch (error: any) {
      console.error("Conversion failed", error);
      toast({
        variant: "destructive",
        title: "Conversion Failed",
        description: error.message || "An unexpected error occurred during conversion.",
      });
      setStatus("error");
      throw error;
    }
  };

  useImperativeHandle(ref, () => ({
    handleConvert
  }));

  const StatusIndicator = () => {
    const isProcessing = status === 'converting';
    if(isProcessing) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Converting...</span>
        </div>
      );
    }
    switch (status) {
      case 'success':
        return (
          <div className="flex items-center gap-2 text-sm text-green-500">
            <CheckCircle className="w-4 h-4" />
            <span>Success!</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <XCircle className="w-4 h-4" />
            <span>Failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  const isProcessing = status === 'converting';

  return (
    <Card className="flex flex-col overflow-hidden relative group/card bg-card/50">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 z-10 h-7 w-7 bg-background/50 hover:bg-destructive hover:text-destructive-foreground opacity-50 group-hover/card:opacity-100 transition-opacity"
        onClick={() => onRemove(fileData.id)}
      >
        <X className="h-4 w-4" />
      </Button>
      <div className="p-4 pb-0">
        <div className="aspect-video w-full relative rounded-md overflow-hidden bg-muted">
          <Image
            src={fileData.preview}
            alt={fileData.file.name}
            fill
            className="object-contain"
          />
        </div>
      </div>
      <CardContent className="p-4 flex-1 flex flex-col gap-4">
        <div className="flex-1">
          <p className="font-semibold text-sm truncate" title={fileData.file.name}>
            {fileData.file.name}
          </p>
          <p className="text-xs text-muted-foreground">{formatBytes(fileData.file.size)}</p>
        </div>

        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor={`format-${fileData.id}`}>Convert to</Label>
                <Select value={outputFormat} onValueChange={(v) => setOutputFormat(v as OutputFormat)} disabled={isProcessing}>
                    <SelectTrigger id={`format-${fileData.id}`} className="bg-background">
                        <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="png">PNG</SelectItem>
                        <SelectItem value="jpeg">JPG</SelectItem>
                        <SelectItem value="webp">WEBP</SelectItem>
                        <SelectItem value="bmp">BMP</SelectItem>
                        <SelectItem value="gif">GIF</SelectItem>
                        <SelectItem value="tiff">TIFF</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="ico">ICO (32x32)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex-col items-stretch gap-2">
        {isProcessing && <Progress value={66} className="h-2"/>}

        <div className="flex items-center justify-between h-10">
            <div className="w-2/5"><StatusIndicator /></div>
            {status === "success" && result ? (
              <Button asChild>
                <a href={result.url} download={result.fileName}>
                  <Download className="mr-2 h-4 w-4" /> Download
                </a>
              </Button>
            ) : (
              <Button onClick={() => handleConvert()} disabled={isProcessing}>
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                   <Sparkles className="mr-2 h-4 w-4" />
                )}
                Convert
              </Button>
            )}
        </div>
      </CardFooter>
    </Card>
  );
});

ImageFileCard.displayName = "ImageFileCard";
