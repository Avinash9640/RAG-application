import React, { useState } from "react";

const strategies = [
    {
        id: "fixed",
        name: "Fixed size",
        description:
            "Splits content into consistent character or token lengths.",
    },
    {
        id: "recursive",
        name: "Recursive character",
        description:
            "Splits content hierarchically while preserving natural boundaries.",
    },
    {
        id: "sentence",
        name: "Sentence",
        description:
            "Creates chunks based on sentence boundaries.",
    },
    {
        id: "paragraph",
        name: "Paragraph",
        description:
            "Keeps complete paragraphs together when possible.",
    },
];

export default function ChunkingSettings() {
    let initial = {};
    try {
        initial = JSON.parse(localStorage.getItem("rag-chunking-settings") || "{}");
    } catch {
        initial = {};
    }
    const [strategy, setStrategy] = useState(initial.strategy || "recursive");

    const [chunkSize, setChunkSize] =
        useState(initial.chunkSize || 1000);

    const [overlap, setOverlap] =
        useState(initial.overlap ?? 200);

    const [unit, setUnit] =
        useState("Characters");

    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);

    const saveSettings = () => {
        const size = Number(chunkSize);
        const overlapSize = Number(overlap);
        if (!Number.isInteger(size) || !Number.isInteger(overlapSize) ||
            size < 100 || size > 10000 || overlapSize < 0 || overlapSize >= size) {
            setError("Use a chunk size from 100 to 10,000 and an overlap smaller than the chunk size.");
            return;
        }
        setError(null);
        localStorage.setItem("rag-chunking-settings", JSON.stringify({
            strategy,
            chunkSize: size,
            overlap: overlapSize,
        }));
        setSaved(true);

        setTimeout(() => {
            setSaved(false);
        }, 1800);
    };

    return (
        <div className="chunking-page">
            <div className="page-heading">
                <h1>Chunking configuration</h1>

                <p>
                    Configure how uploaded documents are divided
                    before embedding and retrieval.
                </p>
            </div>

            <div className="chunking-layout">
                <div className="chunking-card">
                    <h3>Chunking strategy</h3>

                    <p>
                        Select how document content should be
                        segmented.
                    </p>

                    <div className="chunk-strategies">
                        {strategies.map((item) => (
                            <button
                                type="button"
                                key={item.id}
                                className={`chunk-strategy ${strategy === item.id
                                        ? "active"
                                        : ""
                                    }`}
                                onClick={() =>
                                    setStrategy(item.id)
                                }
                            >
                                <strong>{item.name}</strong>

                                <span>
                                    {item.description}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="chunking-card">
                    <h3>Chunk parameters</h3>

                    <p>
                        Configure chunk size and overlap used during
                        document processing.
                    </p>

                    <div className="chunk-field">
                        <label htmlFor="chunk-size">
                            Chunk size
                        </label>

                        <input
                            id="chunk-size"
                            type="number"
                            min="100"
                            max="10000"
                            value={chunkSize}
                            onChange={(event) =>
                                setChunkSize(event.target.value)
                            }
                        />

                        <small>
                            Recommended range: 500–2000
                        </small>
                    </div>

                    <div className="chunk-field">
                        <label htmlFor="chunk-overlap">
                            Overlap
                        </label>

                        <input
                            id="chunk-overlap"
                            type="number"
                            min="0"
                            max="2000"
                            value={overlap}
                            onChange={(event) =>
                                setOverlap(event.target.value)
                            }
                        />

                        <small>
                            Overlap preserves context between adjacent
                            chunks.
                        </small>
                    </div>

                    <div className="chunk-field">
                        <label htmlFor="chunk-unit">
                            Measurement unit
                        </label>

                        <select
                            id="chunk-unit"
                            value={unit}
                            onChange={(event) =>
                                setUnit(event.target.value)
                            }
                        >
                            <option value="Characters">
                                Characters
                            </option>

                        </select>
                    </div>

                    <button
                        type="button"
                        className="chunk-save-button"
                        onClick={saveSettings}
                    >
                        {saved
                            ? "Settings saved"
                            : "Save configuration"}
                    </button>
                    {error && <div className="chunk-settings-error">{error}</div>}
                    <small className="chunk-settings-help">
                        Saved settings apply to new uploads. Use Reprocess on an existing document to apply them there.
                    </small>
                </div>
            </div>

            <div className="chunking-note">
                <div className="chunking-note-icon">
                    ◈
                </div>

                <div>
                    <strong>
                        Chunk storage model
                    </strong>

                    <p>
                        Each generated chunk is stored
                        as an individual row in the{" "}
                        <code>document_chunks</code> table. Each row
                        will retain its document ID, page number, chunk
                        index, content, chunk size, overlap, metadata,
                        and 384-dimensional embedding.
                    </p>
                </div>
            </div>

            <div className="chunk-preview">
                <div className="chunk-preview-header">
                    <div>
                        <strong>Processing preview</strong>

                        <span>
                            Example document segmentation
                        </span>
                    </div>

                    <span className="preview-badge">
                        {strategy}
                    </span>
                </div>

                <div className="preview-document">
                    <div className="preview-page">
                        <span className="preview-page-number">
                            Page 1
                        </span>

                        <div className="preview-lines">
                            <span />
                            <span />
                            <span />
                            <span />
                            <span />
                        </div>

                        <div className="preview-chunk">
                            <small>Chunk 001</small>

                            <p>
                                Document content is divided according
                                to the selected strategy while retaining
                                enough surrounding context for retrieval.
                            </p>
                        </div>

                        <div className="preview-chunk second">
                            <small>Chunk 002</small>

                            <p>
                                Adjacent chunks can share overlapping
                                content to reduce context loss at
                                boundaries.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
