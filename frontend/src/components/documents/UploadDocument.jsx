import React, { useRef, useState } from "react";
import {
    UploadIcon,
    FileIcon,
    XIcon,
} from "../common/Icons";

export default function UploadDocument({ onUpload }) {
    const inputRef = useRef(null);

    const [selectedFile, setSelectedFile] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);

    const allowedExtensions = [
        ".pdf",
        ".docx",
        ".txt",
    ];

    const isValidFile = (file) => {
        if (!file) return false;

        const extension =
            "." +
            file.name
                .split(".")
                .pop()
                .toLowerCase();

        return allowedExtensions.includes(extension);
    };

    const selectFile = (file) => {
        if (!file) return;

        if (!isValidFile(file)) {
            alert(
                "Unsupported file type. Please upload PDF, DOCX, or TXT."
            );
            return;
        }

        setSelectedFile(file);
    };

    const handleInputChange = (event) => {
        const file = event.target.files?.[0];

        selectFile(file);

        event.target.value = "";
    };

    const handleDrop = (event) => {
        event.preventDefault();

        setDragging(false);

        const file = event.dataTransfer.files?.[0];

        selectFile(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        try {
            setIsUploading(true);
            setError(null);
            await onUpload?.(selectedFile);
            setSelectedFile(null);
        } catch (uploadError) {
            setError(uploadError?.message || "Unable to upload document.");
        } finally {
            setIsUploading(false);
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
    };

    return (
        <div className="upload-page">
            <div className="page-heading">
                <h1>Upload documents</h1>

                <p>
                    Add documents to your organization's
                    knowledge base.
                </p>
            </div>

            <div
                className={`upload-zone ${dragging ? "dragging" : ""
                    }`}
                onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
            >
                <div className="upload-zone-icon">
                    <UploadIcon size={21} />
                </div>

                <h3>
                    Drag and drop your document here
                </h3>

                <p>
                    PDF, DOCX, and TXT files are supported
                </p>

                <button
                    type="button"
                    className="upload-button"
                    onClick={() => inputRef.current?.click()}
                >
                    <FileIcon size={14} />
                    Browse files
                </button>

                <input
                    ref={inputRef}
                    type="file"
                    hidden
                    accept=".pdf,.docx,.txt"
                    onChange={handleInputChange}
                />
            </div>

            {selectedFile && (
                <div className="selected-upload">
                    <div className="selected-upload-info">
                        <div className="selected-upload-icon">
                            PDF
                        </div>

                        <div>
                            <strong>{selectedFile.name}</strong>

                            <span>
                                {(
                                    selectedFile.size /
                                    1024 /
                                    1024
                                ).toFixed(2)}{" "}
                                MB
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={removeFile}
                        aria-label="Remove selected file"
                    >
                        <XIcon size={15} />
                    </button>
                </div>
            )}

            {selectedFile && (
                <div className="upload-actions">
                    <button
                        type="button"
                        className="secondary-action"
                        onClick={removeFile}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="primary-action"
                        onClick={handleUpload}
                        disabled={isUploading}
                    >
                        <UploadIcon size={14} />
                        {isUploading ? "Uploading..." : "Upload document"}
                    </button>
                </div>
            )}

            {error && <div className="workspace-error">{error}</div>}

            <div className="upload-info-grid">
                <div className="upload-info-card">
                    <span className="upload-info-number">
                        01
                    </span>

                    <div>
                        <strong>Upload</strong>

                        <p>
                            Select an organizational document.
                        </p>
                    </div>
                </div>

                <div className="upload-info-card">
                    <span className="upload-info-number">
                        02
                    </span>

                    <div>
                        <strong>Process</strong>

                        <p>
                            Text will be extracted and chunked.
                        </p>
                    </div>
                </div>

                <div className="upload-info-card">
                    <span className="upload-info-number">
                        03
                    </span>

                    <div>
                        <strong>Index</strong>

                        <p>
                            Chunks will be prepared for retrieval.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
