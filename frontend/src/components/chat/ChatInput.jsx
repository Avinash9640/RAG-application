import React, { useRef, useState } from "react";
import {
    PaperclipIcon,
    SendIcon,
    XIcon,
} from "../common/Icons";

export default function ChatInput({
    onSend,
    disabled = false,
}) {
    const [value, setValue] = useState("");
    const [files, setFiles] = useState([]);

    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);

    const handleChange = (event) => {
        setValue(event.target.value);

        const textarea = textareaRef.current;

        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${Math.min(
                textarea.scrollHeight,
                180
            )}px`;
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
        }
    };

    const submit = () => {
        const text = value.trim();

        if (!text || disabled) {
            return;
        }

        onSend?.({
            content: text,
            attachments: files,
        });

        setValue("");
        setFiles([]);

        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
    };

    const handleFiles = (event) => {
        const selectedFiles = Array.from(event.target.files || []);

        if (!selectedFiles.length) {
            return;
        }

        setFiles((current) => [
            ...current,
            ...selectedFiles,
        ]);

        event.target.value = "";
    };

    const removeFile = (index) => {
        setFiles((current) =>
            current.filter((_, fileIndex) => fileIndex !== index)
        );
    };

    return (
        <div className="chat-composer-wrapper">
            {files.length > 0 && (
                <div className="composer-attachments">
                    {files.map((file, index) => (
                        <div
                            className="composer-attachment"
                            key={`${file.name}-${index}`}
                        >
                            <div className="composer-file-icon">
                                PDF
                            </div>

                            <div className="composer-file-info">
                                <strong>{file.name}</strong>
                                <span>
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => removeFile(index)}
                                aria-label={`Remove ${file.name}`}
                            >
                                <XIcon size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="chat-composer">
                <button
                    type="button"
                    className="composer-icon-button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    aria-label="Attach document"
                >
                    <PaperclipIcon size={19} />
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    multiple
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFiles}
                />

                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything about your organization..."
                    rows={1}
                    disabled={disabled}
                />

                <button
                    type="button"
                    className={`composer-send-button ${value.trim() ? "ready" : ""
                        }`}
                    onClick={submit}
                    disabled={!value.trim() || disabled}
                    aria-label="Send message"
                >
                    <SendIcon size={17} />
                </button>
            </div>

            <div className="composer-footer">
                <span>
                    AI-generated responses may contain mistakes.
                </span>

                <span>
                    Enter to send · Shift + Enter for new line
                </span>
            </div>
        </div>
    );
}