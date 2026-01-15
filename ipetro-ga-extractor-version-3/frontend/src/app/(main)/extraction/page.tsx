"use client";

import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  FileText,
  Download,
  Eye,
  Calendar,
  Zap,
  Upload,
  X,
  PlusCircle,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  listExtractions,
  downloadFile,
  generateSyncedPPTX,
  type Extraction,
} from "@/lib/api";
import "../../globals.css";

export default function ExtractionListPage() {
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadExtractions();
  }, []);

  const loadExtractions = async () => {
    try {
      const data = await listExtractions();
      setExtractions(data);
    } catch (error) {
      console.error("Failed to load extractions: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (
    fileType: "excel" | "pptx",
    filename: string
  ) => {
    try {
      await downloadFile(fileType, filename);
    } catch (error) {
      console.error("Download failed: ", error);
      alert("Download failed. File might be missing or server error.");
    }
  };

  const filteredExtractions = extractions.filter((ext) => {
    if (filter === "all") return true;
    return ext.status === filter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto min-h-screen">
        {/* header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Extractions</h1>
            <p className="text-muted-foreground">
              Manage your extractions here
            </p>
          </div>

          <Link href="/extraction/new">
            <Button className="flex items-center gap-2">
              <PlusCircle size={18} />
              New Extraction
            </Button>
          </Link>
        </div>

        <div className="flex gap-2 mb-6">
          {["all", "complete", "processing", "failed"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === status
                  ? "bg-primary text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-secondary-foreground dark:hover:bg-accent dark:text-white "
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* --- Synced Generation Section --- */}
        <div className="bg-white dark:bg-[#30302e] border dark:border-stone-700 rounded-lg p-6 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold mb-1 dark:text-white">
                Generate from Master File
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create a PPTX for any equipment tag present in the Master File.
              </p>
              <a
                href={`https://docs.google.com/spreadsheets/d/1RyzHPFmO9axcVc-one-K0Iy9IL4hXm1ucXzRicYlN5k/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm flex items-center gap-1 mt-1"
              >
                <FileText size={14} /> Open Master File (Google Sheets)
              </a>
            </div>

            <div className="flex w-full md:w-auto items-center gap-3">
              <input
                type="text"
                placeholder="Enter Tag (e.g. V-001)"
                className="px-4 py-2 border rounded-lg dark:bg-black dark:border-stone-600 dark:text-white"
                id="tagInput"
              />
              <Button
                onClick={async () => {
                  const input = document.getElementById(
                    "tagInput"
                  ) as HTMLInputElement;
                  const tag = input.value.trim();
                  if (!tag) return alert("Please enter a tag");

                  try {
                    const btn = document.activeElement as HTMLButtonElement;
                    const originalText = btn.innerText;
                    btn.innerText = "Generating...";
                    btn.disabled = true;

                    const res = await generateSyncedPPTX(tag);
                    if (res.success && res.pptx_file) {
                      await downloadFile("pptx", res.pptx_file);
                      alert(`PPTX for ${tag} downloaded!`);
                    }

                    btn.innerText = originalText;
                    btn.disabled = false;
                  } catch (e: any) {
                    alert("Error: " + e.message);
                    const btn = document.activeElement as HTMLButtonElement;
                    btn.innerText = "Generate";
                    btn.disabled = false;
                  }
                }}
              >
                <Zap size={16} className="mr-2" />
                Generate PPTX
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Loading extractions...
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredExtractions.length === 0 && (
          <div className="text-center py-12 bg-accent rounded-lg border border-gray-200">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Extractions Found</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {filter === "all"
                ? "Start by uploading your first equipment drawing"
                : `No ${filter} extractions`}
            </p>
            <Link
              href="/extraction/new"
              className="flex items-center justify-center mt-5"
            >
              <Button variant="outline" className="flex items-center gap-2">
                <Plus size={18} className="mr-2" />
                Create New Extraction
              </Button>
            </Link>
          </div>
        )}

        {/* Extraction Grid */}
        {!loading && filteredExtractions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExtractions.map((extraction) => (
              <div
                key={extraction.id}
                className="bg-white rounded-lg border-1 border-gray-200 hover:shadow-lg transition-shadow dark:bg-[#30302e] dark:border-stone-700 dark:hover:shadow-lg"
              >
                <div className="p-6">
                  {/* status badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        extraction.status === "complete"
                          ? "bg-green-100 text-green-800"
                          : extraction.status === "processing"
                          ? "bg-blue-100 text-blue-800"
                          : extraction.status === "failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {extraction.status}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Zap size={14} />
                      <span>{extraction.provider}</span>
                    </div>
                  </div>

                  {/* filename */}
                  <h3 className="font-semibold text-lg mb-2 truncate dark:text-white">
                    {extraction.filename}
                  </h3>

                  {/* equipment tag if available */}
                  {extraction.equipment_data?.equipment_tag && (
                    <p className="text-sm text-gray-600 mb-3">
                      Tag:{" "}
                      <span className="font-medium">
                        {extraction.equipment_data.equipment_tag}
                      </span>
                    </p>
                  )}

                  {/* date */}
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <Calendar size={14} />
                    <span>{formatDate(extraction.created_at)}</span>
                  </div>

                  {/* action */}
                  <div className="flex gap-2">
                    <Link
                      href={`/extraction/${extraction.id}`}
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye size={16} className="mr-2" />
                        View
                      </Button>
                    </Link>

                    {extraction.excel_file && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDownload("excel", extraction.excel_file!)
                        }
                        title="Download Excel"
                      >
                        <Download size={16} />
                        Excel
                      </Button>
                    )}

                    {extraction.pptx_file && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const tag = extraction.equipment_data?.equipment_tag;
                          if (tag) {
                            try {
                              // Trigger regeneration from Master File
                              const res = await generateSyncedPPTX(tag);
                              if (res.success && res.pptx_file) {
                                await downloadFile("pptx", res.pptx_file);
                              } else {
                                alert("Failed to generate synced PPTX.");
                              }
                            } catch (e) {
                              console.error(e);
                              alert("Error generating synced PPTX.");
                            }
                          } else {
                            // Fallback to static file if no Tag
                            handleDownload("pptx", extraction.pptx_file!);
                          }
                        }}
                        title="Download PowerPoint (Synced from Master File)"
                        className=""
                      >
                        <Download size={16} />
                        PPTX
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// export default function Extraction() {
//   const [isDragging, setIsDragging] = useState(false);
//   const [files, setFiles] = useState<File[]>([]);

//   const handleDragOver = useCallback((e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragging(true);
//   }, []);

//   const handleDragLeave = useCallback((e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragging(false);
//   }, []);

//   const handleDrop = useCallback((e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragging(false);

//     const droppedFiles = Array.from(e.dataTransfer.files);
//     setFiles(prev => [...prev, ...droppedFiles]);
//   }, []);

//   const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files) {
//       const selectedFiles = Array.from(e.target.files);
//       setFiles(prev => [...prev, ...selectedFiles]);
//     }
//   }, []);

//   const removeFile = useCallback((index: number) => {
//     setFiles(prev => prev.filter((_, i) => i !== index));
//   }, []);

//   const formatFileSize = (bytes: number) => {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
//   };

//   return (
//    <div className='p-4'>
//     <div className='w-full'>
//     </div>
//     <div className="w-full p-8">
//       <div className="max-w-4xl mx-auto">
//         <h1 className="text-3xl font-bold mb-2">File Extraction</h1>
//         <p className="text-muted-foreground mb-8">Upload your files to extract data</p>

//         {/* Drag and Drop Zone */}
//         <div
//           onDragOver={handleDragOver}
//           onDragLeave={handleDragLeave}
//           onDrop={handleDrop}
//           className={`
//             relative border-2 border-dashed rounded-xl p-12
//             transition-all duration-200 ease-in-out
//             ${isDragging
//               ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
//               : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
//             }
//           `}
//         >
//           <input
//             type="file"
//             multiple
//             onChange={handleFileInput}
//             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
//             id="file-upload"
//           />

//           <div className="flex flex-col items-center justify-center text-center">
//             <div className={`
//               mb-4 p-4 rounded-full transition-colors
//               ${isDragging ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'}
//             `}>
//               <Upload className={`w-12 h-12 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
//             </div>

//             <h3 className="text-xl font-semibold mb-2">
//               {isDragging ? 'Drop files here' : 'Drag & drop files here'}
//             </h3>

//             <p className="text-sm text-muted-foreground mb-4">
//               or click to browse from your computer
//             </p>

//             <Button variant="outline" size="sm" asChild>
//               <label htmlFor="file-upload" className="cursor-pointer">
//                 Browse Files
//               </label>
//             </Button>
//           </div>
//         </div>

//         {/* File List */}
//         {files.length > 0 && (
//           <div className="mt-8">
//             <h2 className="text-xl font-semibold mb-4">
//               Uploaded Files ({files.length})
//             </h2>

//             <div className="space-y-2">
//               {files.map((file, index) => (
//                 <div
//                   key={index}
//                   className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
//                 >
//                   <div className="flex items-center gap-3 flex-1 min-w-0">
//                     <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
//                       <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
//                     </div>

//                     <div className="flex-1 min-w-0">
//                       <p className="font-medium truncate">{file.name}</p>
//                       <p className="text-sm text-muted-foreground">
//                         {formatFileSize(file.size)}
//                       </p>
//                     </div>
//                   </div>

//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={() => removeFile(index)}
//                     className="ml-2"
//                   >
//                     <X className="w-4 h-4" />
//                   </Button>
//                 </div>
//               ))}
//             </div>

//             <div className="mt-6 flex gap-3">
//               <Button className="flex-1">
//                 Process Files
//               </Button>
//               <Button variant="outline" onClick={() => setFiles([])}>
//                 Clear All
//               </Button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//     </div>
//   );
// }
