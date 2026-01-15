"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  X,
  ChevronDown,
  Eye,
  Download,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  uploadDrawing,
  getAvailableModels,
  downloadFile,
  type AvailableModels,
} from "@/lib/api";

interface FileItem {
  id: string;
  file: File;
  status: "pending" | "processing" | "complete" | "error";
  extractionId?: string;
  error?: string;
  excelFile?: string;
  pptxFile?: string;
  pptxGoogleLink?: string;
  equipmentData?: any;
  duration?: number;
}

export default function NewExtractionPage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [provider, setProvider] = useState("gemini");
  const [model, setModel] = useState("");
  const [availableModels, setAvailableModels] =
    useState<AvailableModels | null>(null);
  const [processing, setProcessing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedItem = files.find((f) => f.id === selectedId) || null;
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const data = await getAvailableModels();
      setAvailableModels(data);

      if (data.models[provider as keyof typeof data.models]) {
        setModel(data.models[provider as keyof typeof data.models][0]);
      }
    } catch (err) {
      console.error("Failed to load models: ", err);
    }
  };

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    if (
      availableModels?.models[
        newProvider as keyof typeof availableModels.models
      ]
    ) {
      setModel(
        availableModels.models[
          newProvider as keyof typeof availableModels.models
        ][0]
      );
    }
  };

  const generateId = () => Math.random().toString(36).substring(2, 15);

  const addFiles = (newFiles: File[]) => {
    const fileItems: FileItem[] = newFiles.map((file) => ({
      id: generateId(),
      file,
      status: "pending",
    }));
    setFiles((prev) => [...prev, ...fileItems]);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) =>
        file.type === "application/pdf" || file.type.startsWith("image/")
    );

    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files).filter(
          (file) =>
            file.type === "application/pdf" || file.type.startsWith("image/")
        );
        if (selectedFiles.length > 0) {
          addFiles(selectedFiles);
        }
      }
    },
    []
  );

  const removeFile = useCallback(
    (itemId: string) => {
      setFiles((prev) => prev.filter((f) => f.id !== itemId));
      if (selectedId === itemId) {
        setSelectedId(null);
      }
    },
    [selectedId]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setProcessing(false);
  };

  const processFiles = async () => {
    if (files.length === 0) return;

    setProcessing(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    for (let i = 0; i < files.length; i++) {
      if (abortControllerRef.current?.signal.aborted) break;

      const item = files[i];
      if (item.status === "complete") continue;

      const startTime = Date.now();

      // update status to processing
      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: "processing" } : f))
      );

      try {
        const result = await uploadDrawing(
          item.file,
          provider,
          model,
          controller.signal
        );
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;

        // update with 'success' message
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  status: "complete",
                  duration,
                  extractionId: result.extraction_id,
                  excelFile: result.excel_file,
                  pptxFile: result.pptx_file,
                  pptxGoogleLink: result.pptx_google_link,
                  equipmentData: result.equipment_data,
                }
              : f
          )
        );
      } catch (error: any) {
        if (
          error.name === "AbortError" ||
          error.message === "The user aborted a request."
        ) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === item.id ? { ...f, status: "pending" } : f
            )
          );
          break;
        }

        // update with 'error' message
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  status: "error",
                  error: error.message,
                }
              : f
          )
        );
      }

      if (abortControllerRef.current?.signal.aborted) break;

      // small delay between files
      if (i < files.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    setProcessing(false);
    abortControllerRef.current = null;
  };

  const allProcessed =
    files.length > 0 &&
    files.every((f) => f.status === "complete" || f.status === "error");
  const hasCompleted = files.some((f) => f.status === "complete");

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">New Extraction</h1>
          <p className="text-gray-500 font-medium">
            Upload equipment drawings to extract data
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* left column - upload $ settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* ai provider & model selection */}
            <div className="bg-white dark:bg-accent rounded-lg border p-6">
              <h2 className="font-semibold mb-4">AI Configuration</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    AI Provider
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option
                      value="gemini"
                      disabled={!availableModels?.configured.gemini}
                    >
                      Google Gemini{" "}
                      {!availableModels?.configured.gemini &&
                        "(Not Configured)"}
                    </option>
                    <option
                      value="openai"
                      disabled={!availableModels?.configured.openai}
                    >
                      OpenAI{" "}
                      {!availableModels?.configured.openai &&
                        "(Not Configured)"}
                    </option>
                    <option
                      value="groq"
                      disabled={!availableModels?.configured.groq}
                    >
                      Groq{" "}
                      {!availableModels?.configured.groq && "(Not Configured)"}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Model
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {availableModels?.models[
                      provider as keyof typeof availableModels.models
                    ]?.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* drag and drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                      relative border-2 border-dashed rounded-xl p-12 dark:bg-accent transition-all duration-200 ease-in-out
                      ${
                        isDragging
                          ? "border-primary glowing"
                          : "border-gray-300 hover:border-gray-400"
                      } 
                      ${processing ? "opacity-50 pointer-events-none" : ""}
                      `}
            >
              <input
                type="file"
                multiple
                accept=".pdf, .png, .jpg, jpeg"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="file-upload"
                disabled={processing}
              />

              <div className="flex flex-col items-center justify-center text-center">
                <div
                  className={`
                          mb-4 p-4 rounded-full transition-colors
                          ${isDragging ? "bg-primary" : "bg-gray-100"}
                          `}
                >
                  <Upload
                    className={`w-12 h-12  ${
                      isDragging ? "text-accent" : "text-gray-400"
                    }`}
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-500 dark:text-gray-400">
                  {isDragging
                    ? "Drop files here"
                    : "Drag & drop files here or click to upload"}
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Accepted format: .pdf, .png, .jpg, .jpeg
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={processing}
                >
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Browse files
                  </label>
                </Button>
              </div>
            </div>

            {/* file list */}
            {files.length > 0 && (
              <div className="bg-white rounded-lg border p-6 dark:bg-accent">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">
                    Uploaded Files ({files.length})
                  </h2>

                  <div className="flex gap-2">
                    {processing && (
                      <Button
                        variant="destructive"
                        onClick={handleCancel}
                        className="flex items-center gap-2"
                      >
                        <X size={16} />
                        Cancel
                      </Button>
                    )}
                    <Button
                      onClick={processFiles}
                      disabled={processing || files.length === 0}
                      className="flex items-center gap-2"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Process All Files"
                      )}
                    </Button>

                    {!processing && (
                      <Button variant={"outline"} onClick={() => setFiles([])}>
                        Clear All
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {files.map((item) => (
                    <div
                      key={item.id}
                      className={`
                      flex items-center justify-between p-4 border rounded-lg transition-colors cursor-pointer dark:bg-muted
                      ${
                        selectedId === item.id
                          ? "border-blue-500 bg-blue-50"
                          : "hover:bg-gray-50"
                      }
                      `}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`p-2 rounded ${
                            item.status === "complete"
                              ? "bg-green-100"
                              : item.status === "processing"
                              ? "bg-blue-100"
                              : item.status === "error"
                              ? "bg-red-100"
                              : "bg-gray-100"
                          }`}
                        >
                          {item.status === "processing" ? (
                            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                          ) : (
                            <FileText
                              className={`w-5 h-5 ${
                                item.status === "complete"
                                  ? "text-green-600"
                                  : item.status === "error"
                                  ? "text-red-600"
                                  : "text-gray-600"
                              }`}
                            />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {item.file.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.duration
                              ? `Done in ${item.duration.toFixed(1)}s`
                              : `${formatFileSize(item.file.size)} • ${
                                  item.status
                                }`}
                          </p>
                        </div>
                      </div>

                      {item.status === "pending" && !processing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(item.id);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {allProcessed && hasCompleted && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={() => router.push("/extraction")}
                      className="flex-1"
                    >
                      View All Extractions
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* right column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6 sticky top-6 dark:bg-accent">
              <h2 className="font-semibold mb-4">Preview</h2>

              {selectedItem ? (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <p className="text-md underline dark:text-white font-semibold mb-2">
                      File details
                    </p>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Name:</strong>
                        {selectedItem.file.name}
                      </p>
                      <p>
                        <strong>Size:</strong>
                        {formatFileSize(selectedItem.file.size)}
                      </p>
                      <p>
                        <strong>Status:</strong>
                        {selectedItem.status}
                      </p>
                      {selectedItem.duration && (
                        <p>
                          <strong>Time taken:</strong>
                          {selectedItem.duration.toFixed(2)}s
                        </p>
                      )}
                    </div>
                  </div>

                  {selectedItem.status === "complete" &&
                    selectedItem.equipmentData && (
                      <>
                        <div className="border rounded-lg p-4">
                          <p className="text-sm font-medium mb-2">
                            Extracted data
                          </p>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>
                              <strong>Tag:</strong>
                              {selectedItem.equipmentData.equipment_tag ||
                                "N/A"}
                            </p>
                            <p>
                              <strong>Type:</strong>
                              {selectedItem.equipmentData.equipment_type ||
                                "N/A"}
                            </p>
                            <p>
                              <strong>Pressure:</strong>
                              {selectedItem.equipmentData.design_pressure ||
                                "N/A"}
                            </p>
                            <p>
                              <strong>Temperature:</strong>
                              {selectedItem.equipmentData.design_temp || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={async () => {
                              if (selectedItem.excelFile) {
                                try {
                                  await downloadFile(
                                    "excel",
                                    selectedItem.excelFile
                                  );
                                } catch (error) {
                                  console.error("Download failed:", error);
                                  alert("Download failed.");
                                }
                              }
                            }}
                          >
                            <Download size={16} className="mr-2" />
                            Download .xlsx
                          </Button>

                          <Button
                            variant={"outline"}
                            className="w-full"
                            onClick={async () => {
                              if (selectedItem.pptxFile) {
                                try {
                                  await downloadFile(
                                    "pptx",
                                    selectedItem.pptxFile
                                  );
                                } catch (error) {
                                  console.error("Download failed:", error);
                                  alert("Download failed.");
                                }
                              }
                            }}
                          >
                            <Download size={16} className="mr-2" />
                            Download .pptx
                          </Button>

                          <Button
                            variant="default"
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                            onClick={() => {
                              window.open(
                                selectedItem.pptxGoogleLink,
                                "_blank"
                              );
                            }}
                          >
                            <FileText size={16} className="mr-2" />
                            Open in Google Slides
                          </Button>

                          <Button
                            variant="link"
                            className="w-full text-blue-600 underline cursor-pointer"
                            onClick={async () => {
                              if (selectedItem.excelFile) {
                                try {
                                  await downloadFile(
                                    "excel",
                                    selectedItem.excelFile
                                  );
                                  // 2. Open Google Sheets in new tab
                                  window.open(
                                    "https://docs.google.com/spreadsheets/u/0/",
                                    "_blank"
                                  );
                                  // 3. Inform user
                                  alert(
                                    "Opening Google Sheets. Please upload the downloaded 'MasterFile' to view it."
                                  );
                                } catch (error) {
                                  console.error(
                                    "Failed to open master file flow:",
                                    error
                                  );
                                }
                              }
                            }}
                          >
                            View Masterfile in Google Sheets
                          </Button>
                        </div>
                      </>
                    )}

                  {selectedItem.status === "error" && (
                    <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-red-800 mb-1">
                        Error
                      </p>
                      <p className="text-sm text-red-600">
                        {selectedItem.error}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Eye className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">Select a file to preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
