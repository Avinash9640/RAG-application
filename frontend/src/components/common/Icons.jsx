import React from "react";

const baseProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
};

function Icon({ children, size = 18, className = "" }) {
    return (
        <svg
            {...baseProps}
            width={size}
            height={size}
            className={className}
            aria-hidden="true"
        >
            {children}
        </svg>
    );
}

export function PlusIcon(props) {
    return (
        <Icon {...props}>
            <path d="M12 5v14M5 12h14" />
        </Icon>
    );
}

export function MessageIcon(props) {
    return (
        <Icon {...props}>
            <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-4 2v-5.2A7.5 7.5 0 1 1 20 11.5Z" />
        </Icon>
    );
}

export function ClockIcon(props) {
    return (
        <Icon {...props}>
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 7v5l3 2" />
        </Icon>
    );
}

export function SettingsIcon(props) {
    return (
        <Icon {...props}>
            <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 1.7-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-2.4v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.7-1.7.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H7v-2.4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L10 6.9l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.7 1.7-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2V14h-.2a1.7 1.7 0 0 0-1.5 1Z" />
        </Icon>
    );
}

export function UserIcon(props) {
    return (
        <Icon {...props}>
            <circle cx="12" cy="8" r="3.2" />
            <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
        </Icon>
    );
}

export function ChevronDownIcon(props) {
    return (
        <Icon {...props}>
            <path d="m7 10 5 5 5-5" />
        </Icon>
    );
}

export function ChevronRightIcon(props) {
    return (
        <Icon {...props}>
            <path d="m9 6 6 6-6 6" />
        </Icon>
    );
}

export function TrashIcon(props) {
    return (
        <Icon {...props}>
            <path d="M5 7h14M10 11v5M14 11v5" />
            <path d="M8 7l.7-2h6.6l.7 2M7 7l.7 13h8.6L17 7" />
        </Icon>
    );
}

export function UploadIcon(props) {
    return (
        <Icon {...props}>
            <path d="M12 15V4" />
            <path d="m8 8 4-4 4 4" />
            <path d="M5 14v5h14v-5" />
        </Icon>
    );
}

export function FileIcon(props) {
    return (
        <Icon {...props}>
            <path d="M7 3.5h7l4 4V20.5H7z" />
            <path d="M14 3.5v4h4M10 12h5M10 16h5" />
        </Icon>
    );
}

export function PaperclipIcon(props) {
    return (
        <Icon {...props}>
            <path d="m9.5 12.5 5.7-5.7a3 3 0 0 1 4.2 4.2l-7.7 7.7a4.5 4.5 0 0 1-6.4-6.4l7.4-7.4" />
        </Icon>
    );
}

export function SendIcon(props) {
    return (
        <Icon {...props}>
            <path d="m4 4 16 8-16 8 3-8-3-8Z" />
            <path d="M7 12h13" />
        </Icon>
    );
}

export function SearchIcon(props) {
    return (
        <Icon {...props}>
            <circle cx="10.8" cy="10.8" r="6.2" />
            <path d="m16 16 4 4" />
        </Icon>
    );
}

export function MenuIcon(props) {
    return (
        <Icon {...props}>
            <path d="M4 7h16M4 12h16M4 17h16" />
        </Icon>
    );
}

export function SparklesIcon(props) {
    return (
        <Icon {...props}>
            <path d="m12 3 1.2 4.8L18 9l-4.8 1.2L12 15l-1.2-4.8L6 9l4.8-1.2L12 3Z" />
            <path d="m19 15 .6 2.4L22 18l-2.4.6L19 21l-.6-2.4L16 18l2.4-.6L19 15Z" />
        </Icon>
    );
}

export function DatabaseIcon(props) {
    return (
        <Icon {...props}>
            <ellipse cx="12" cy="5.5" rx="7" ry="3" />
            <path d="M5 5.5v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
            <path d="M5 11.5v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
        </Icon>
    );
}

export function LayersIcon(props) {
    return (
        <Icon {...props}>
            <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" />
            <path d="m4 12 8 4.5 8-4.5M4 16.5l8 4.5 8-4.5" />
        </Icon>
    );
}

export function LogOutIcon(props) {
    return (
        <Icon {...props}>
            <path d="M10 4H5v16h5" />
            <path d="M13 8l4 4-4 4M17 12H8" />
        </Icon>
    );
}

export function CheckIcon(props) {
    return (
        <Icon {...props}>
            <path d="m5 12 4 4L19 6" />
        </Icon>
    );
}

export function XIcon(props) {
    return (
        <Icon {...props}>
            <path d="m7 7 10 10M17 7 7 17" />
        </Icon>
    );
}

export function MoreIcon(props) {
    return (
        <Icon {...props}>
            <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
            <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
        </Icon>
    );
}

export function CopyIcon(props) {
    return (
        <Icon {...props}>
            <rect x="8" y="8" width="10" height="10" rx="1.5" />
            <path d="M16 8V6a1.5 1.5 0 0 0-1.5-1.5h-7A1.5 1.5 0 0 0 6 6v8a1.5 1.5 0 0 0 1.5 1.5H8" />
        </Icon>
    );
}

export function RefreshIcon(props) {
    return (
        <Icon {...props}>
            <path d="M19 8a7.5 7.5 0 0 0-13.2-1.8L4 8.5" />
            <path d="M4 4.5v4h4" />
            <path d="M5 16a7.5 7.5 0 0 0 13.2 1.8l1.8-2.3" />
            <path d="M20 19.5v-4h-4" />
        </Icon>
    );
}

/*
 * Backward-compatible default export.
 *
 * Older components such as Login.jsx may use:
 *
 * import Icons from "../components/common/Icons";
 *
 * This keeps those components working while the new components
 * use named imports such as:
 *
 * import { SparklesIcon } from "../common/Icons";
 */

const Icons = {
    PlusIcon,
    MessageIcon,
    ClockIcon,
    SettingsIcon,
    UserIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    TrashIcon,
    UploadIcon,
    FileIcon,
    PaperclipIcon,
    SendIcon,
    SearchIcon,
    MenuIcon,
    SparklesIcon,
    DatabaseIcon,
    LayersIcon,
    LogOutIcon,
    CheckIcon,
    XIcon,
    MoreIcon,
    CopyIcon,
    RefreshIcon,
};

export default Icons;