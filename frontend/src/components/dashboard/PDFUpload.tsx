import React, { useState, useCallback } from "react";
import {
  Paper,
  Typography,
  Box,
  Button,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
} from "@mui/material";
import {
  CloudUpload,
  InsertDriveFile,
  CheckCircle,
  Error,
  Delete,
  PictureAsPdf,
} from "@mui/icons-material";
import { useDropzone } from "react-dropzone";
import axios, { AxiosProgressEvent } from "axios"; // Import AxiosProgressEvent

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: "uploading" | "processing" | "completed" | "error";
  error?: string;
}

const PDFUpload: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map((file, index) => ({
      id: Date.now() + index.toString(),
      name: file.name,
      size: file.size,
      progress: 0,
      status: "uploading" as const,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // Process each file with REAL upload (not simulated)
    newFiles.forEach(async (fileRecord, index) => {
      const actualFile = acceptedFiles[index];
      await uploadFile(actualFile, fileRecord.id);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: true,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  const uploadFile = async (file: File, fileId: string) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/upload/pdf",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            // Use AxiosProgressEvent type
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            // Update progress using file.id
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileId ? { ...f, progress: percentCompleted } : f
              )
            );
          },
        }
      );

      // Handle successful upload
      console.log("Upload successful:", response.data);

      // Mark as completed
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                progress: 100,
                status: "completed" as const,
              }
            : f
        )
      );

      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("Upload failed:", error);

      // Mark as error
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "error" as const,
                error: error.message || "Upload failed",
              }
            : f
        )
      );

      return { success: false, error: error.message || "Upload failed" };
    }
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
        return <CloudUpload color="primary" />;
      case "processing":
        return <LinearProgress sx={{ width: 24 }} />;
      case "completed":
        return <CheckCircle color="success" />;
      case "error":
        return <Error color="error" />;
      default:
        return <InsertDriveFile />;
    }
  };

  const getStatusColor = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
        return "primary";
      case "processing":
        return "warning";
      case "completed":
        return "success";
      case "error":
        return "error";
      default:
        return "default";
    }
  };

  const handleProcessAll = () => {
    // Get only completed files for processing
    const completedFiles = files.filter((f) => f.status === "completed");

    if (completedFiles.length === 0) {
      alert("No completed files to process. Please upload files first.");
      return;
    }

    alert(
      `Processing ${completedFiles.length} files with LLM... Check console for details.`
    );

    // Send processing request to backend
    completedFiles.forEach(async (file) => {
      try {
        const response = await axios.post(
          "http://localhost:5000/api/process/pdf",
          { fileName: file.name }
        );
        console.log(`Processing started for ${file.name}:`, response.data);
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
      }
    });
  };

  return (
    <Paper elevation={3} sx={{ p: 3, height: "100%" }}>
      <Typography variant="h6" gutterBottom>
        📄 GA Drawing Upload
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Upload General Arrangement (GA) drawings for automated data extraction
      </Typography>

      {/* Drag & Drop Zone */}
      <Box
        {...getRootProps()}
        sx={{
          border: "2px dashed",
          borderColor: isDragActive ? "primary.main" : "grey.300",
          borderRadius: 2,
          p: 4,
          textAlign: "center",
          backgroundColor: isDragActive ? "action.hover" : "background.default",
          cursor: "pointer",
          mb: 3,
          transition: "all 0.2s",
          "&:hover": {
            backgroundColor: "action.hover",
            borderColor: "primary.main",
          },
        }}
      >
        <input {...getInputProps()} />
        <CloudUpload sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? "Drop PDF files here" : "Drag & Drop GA Drawings"}
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          or click to select PDF files
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Supports: .pdf files only
        </Typography>
      </Box>

      {/* Upload Stats */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="subtitle1">
          Uploaded Files ({files.filter((f) => f.status === "completed").length}
          /{files.length})
        </Typography>
        {files.length > 0 && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleProcessAll}
            disabled={files.length === 0}
          >
            Process All with LLM
          </Button>
        )}
      </Box>

      {/* File List */}
      {files.length > 0 ? (
        <List sx={{ maxHeight: 300, overflow: "auto" }}>
          {files.map((file) => (
            <ListItem
              key={file.id}
              divider
              secondaryAction={
                <IconButton edge="end" onClick={() => removeFile(file.id)}>
                  <Delete />
                </IconButton>
              }
            >
              <ListItemIcon>
                <PictureAsPdf color="error" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box>
                    <Typography variant="body2" noWrap>
                      {file.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {formatFileSize(file.size)}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getStatusIcon(file.status)}
                      <Typography
                        variant="caption"
                        color={`${getStatusColor(file.status)}.main`}
                      >
                        {file.status.toUpperCase()}
                      </Typography>
                    </Box>
                    {file.status === "uploading" && (
                      <LinearProgress
                        variant="determinate"
                        value={file.progress}
                        sx={{ mt: 1 }}
                      />
                    )}
                    {file.error && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        {file.error}
                      </Alert>
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Box textAlign="center" py={4}>
          <InsertDriveFile sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
          <Typography color="textSecondary">No files uploaded yet</Typography>
          <Typography variant="caption" color="textSecondary">
            Upload GA drawings to begin automated extraction
          </Typography>
        </Box>
      )}

      {/* Instructions */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Supported formats:</strong> PDF drawings with equipment data
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          <strong>Automated extraction:</strong> Equipment specs, dimensions,
          materials
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          <strong>LLM processing:</strong> AI-powered data extraction and
          validation
        </Typography>
      </Alert>
    </Paper>
  );
};

export default PDFUpload;
