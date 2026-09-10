import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { exportElementToA4Pdf } from '@/utils/pdfExport';

interface PdfDownloadButtonProps {
  /** Target element ID to export */
  targetElementId?: string;
  /** Direct ref to element to export */
  targetRef?: React.RefObject<HTMLElement>;
  /** Function returning element to export */
  getTargetElement?: () => HTMLElement | null;
  /** Filename for the downloaded PDF */
  filename?: string;
  /** Title tooltip */
  title?: string;
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Disabled state */
  disabled?: boolean;
  /** Page orientation */
  orientation?: 'portrait' | 'landscape';
  /** Paper size */
  paperSize?: 'f4' | 'a4';
}

/**
 * Recognizable PDF Document Icon
 */
export function PdfIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* File Page Body with Folded Top Right Corner */}
      <path
        d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Folded Corner flap */}
      <path
        d="M14 2V8H20"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Letter 'P' */}
      <path
        d="M6.5 13H8.2C8.9732 13 9.6 13.5373 9.6 14.2C9.6 14.8627 8.9732 15.4 8.2 15.4H7.6V17.5H6.5V13ZM7.6 14.4H8.15C8.39853 14.4 8.6 14.3105 8.6 14.2C8.6 14.0895 8.39853 14 8.15 14H7.6V14.4Z"
        fill="currentColor"
      />
      {/* Letter 'D' */}
      <path
        d="M10.6 13H12.1C13.2046 13 14.1 13.8954 14.1 15C14.1 16.1046 13.2046 17 12.1 17H10.6V13ZM11.7 14V16H12.1C12.6523 16 13.1 15.5523 13.1 15C13.1 14.4477 12.6523 14 12.1 14H11.7Z"
        fill="currentColor"
      />
      {/* Letter 'F' */}
      <path
        d="M15.1 13H17.8V14H16.2V14.8H17.5V15.7H16.2V17.5H15.1V13Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function PdfDownloadButton({
  targetElementId,
  targetRef,
  getTargetElement,
  filename,
  title = 'Download Laporan Resmi (PDF)',
  className = '',
  size = 'md',
  disabled = false,
  orientation,
  paperSize = 'f4',
}: PdfDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloading || disabled) return;

    let element: HTMLElement | null = null;
    if (getTargetElement) {
      element = getTargetElement();
    } else if (targetRef && targetRef.current) {
      element = targetRef.current;
    } else if (targetElementId) {
      element = document.getElementById(targetElementId);
    }

    if (!element) {
      console.warn('Target element for PDF download not found:', targetElementId);
      return;
    }

    setDownloading(true);
    try {
      await exportElementToA4Pdf(element, {
        filename: filename || `Laporan_Resmi_${Date.now()}.pdf`,
        margin: 6,
        scale: 2.5,
        orientation,
        paperSize,
      });
    } catch (err) {
      console.error('Failed to download PDF:', err);
      // Fallback to window.print if critical error
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2 sm:w-11 sm:h-11 sm:p-2.5',
    lg: 'w-12 h-12 p-3',
  }[size];

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5 sm:w-6 sm:h-6',
    lg: 'w-7 h-7',
  }[size];

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={disabled || downloading}
      title={downloading ? 'Sedang memproses PDF...' : title}
      aria-label={title}
      data-html2canvas-ignore="true"
      className={`relative group inline-flex items-center justify-center rounded-2xl transition-all duration-200 cursor-pointer select-none no-print shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} bg-gradient-to-br from-rose-500/15 via-red-500/10 to-rose-600/20 hover:from-rose-500 hover:via-red-600 hover:to-rose-600 text-rose-500 hover:text-white border border-rose-500/30 hover:border-rose-400/80 shadow-[0_4px_12px_rgba(244,63,94,0.15)] hover:shadow-[0_6px_20px_rgba(244,63,94,0.35)] active:scale-95 ${className}`}
    >
      {downloading ? (
        <Loader2 className={`${iconSizes} animate-spin text-rose-400 group-hover:text-white`} />
      ) : (
        <PdfIcon className={`${iconSizes} transition-transform group-hover:scale-110 drop-shadow-sm`} />
      )}
    </button>
  );
}
