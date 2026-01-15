"use client";

import { useCallback, useState, type ChangeEvent, type DragEvent, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UploadCloud, FileImage, X, Sparkles, Loader2, PlusCircle } from "lucide-react";
import { ImageFileCard, type ImageFileCardRef } from "./image-file-card";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";

export interface IFile {
  id: string;
  file: File;
  preview: string;
}

export type OutputFormat = "png" | "jpeg" | "webp" | "bmp" | "gif" | "tiff" | "pdf" | "ico";

export function ImageConverterClient() {
  const [files, setFiles] = useState<IFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const fileCardRefs = useRef<Map<string, ImageFileCardRef | null>>(new Map());
  const [batchOutputFormat, setBatchOutputFormat] = useState<OutputFormat>("png");
  const [isBatchConverting, setIsBatchConverting] = useState(false);


  const handleFiles = useCallback((incomingFiles: FileList | null) => {
    if (!incomingFiles) return;

    const newFiles: IFile[] = Array.from(incomingFiles)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        id: `${file.name}-${file.lastModified}-${file.size}`,
        file,
        preview: URL.createObjectURL(file),
      }));

    if (newFiles.length === 0) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please upload only image files.",
      });
      return;
    }
    
    setFiles(prevFiles => {
      const existingIds = new Set(prevFiles.map(f => f.id));
      const filteredNewFiles = newFiles.filter(f => !existingIds.has(f.id));
      return [...prevFiles, ...filteredNewFiles];
    });
  }, [toast]);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = "";
  };

  const removeFile = (id: string) => {
    setFiles(prevFiles => {
      const fileToRemove = prevFiles.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      fileCardRefs.current.delete(id);
      return prevFiles.filter(f => f.id !== id);
    });
  };
  
  const removeAll = () => {
    files.forEach(f => URL.revokeObjectURL(f.preview));
    setFiles([]);
    fileCardRefs.current.clear();
  };

  const handleConvertAll = async () => {
    if (files.length === 0) return;

    setIsBatchConverting(true);
    const conversionPromises = files.map(file => {
      const ref = fileCardRefs.current.get(file.id);
      if(ref) {
        return ref.handleConvert(batchOutputFormat);
      }
      return Promise.resolve();
    });

    try {
      await Promise.all(conversionPromises);
      toast({
        title: "Batch Conversion Complete",
        description: `Converted ${files.length} images to ${batchOutputFormat.toUpperCase()}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Batch Conversion Failed",
        description: "Some images could not be converted.",
      });
    } finally {
      setIsBatchConverting(false);
    }
  };

  return (
    <Card className="w-full max-w-5xl h-full flex-1 flex flex-col shadow-lg">
      <CardContent className="p-4 sm:p-6 flex-1 flex flex-col gap-4">
        {files.length === 0 ? (
          <div
            className={`relative flex flex-col items-center justify-center w-full flex-1 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ${
              isDragging ? "border-primary bg-accent/20" : "border-border hover:border-primary/50"
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <div className="text-center p-8">
              <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-semibold text-foreground">
                Drag & drop images here
              </p>
              <p className="mt-1 text-sm text-muted-foreground">or click to browse</p>
              <p className="mt-4 text-xs text-muted-foreground">Supports JPG, PNG, WEBP, etc.</p>
            </div>
            <input
              id="file-input"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleInputChange}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4">
             <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <FileImage className="w-6 h-6 text-primary" />
                    <span>Your Images ({files.length})</span>
                </h2>
                <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" onClick={() => document.getElementById("file-input")?.click()}>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add More
                    </Button>
                    <Button variant="destructive" onClick={removeAll}>
                        <X className="w-4 h-4 mr-2" />
                        Remove All
                    </Button>
                </div>
            </div>

            <Card className="bg-background/50">
              <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-1 w-full sm:w-auto">
                    <Label htmlFor="batch-format" className="mb-2 block text-sm font-medium">Convert all to</Label>
                    <Select value={batchOutputFormat} onValueChange={(v) => setBatchOutputFormat(v as OutputFormat)} disabled={isBatchConverting}>
                      <SelectTrigger id="batch-format" className="bg-background">
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
                  <div className="w-full sm:w-auto self-end">
                     <Button onClick={handleConvertAll} disabled={isBatchConverting || files.length === 0} className="w-full sm:w-auto">
                      {isBatchConverting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      Convert All
                    </Button>
                  </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 -mr-2 flex-1">
              {files.map(f => (
                <ImageFileCard 
                  key={f.id} 
                  ref={ref => fileCardRefs.current.set(f.id, ref)}
                  fileData={f} 
                  onRemove={removeFile} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
