import React from 'react';

interface F4PageProps {
  pageNumber?: number;
  customPageNumber?: string | number;
  totalPages?: number;
  isCover?: boolean;
  orientation?: 'portrait' | 'landscape';
  children: React.ReactNode;
  className?: string;
  showFooterMeta?: boolean;
  padding?: string;
  contentClassName?: string;
}

export default function F4Page({
  pageNumber,
  customPageNumber,
  totalPages,
  isCover = false,
  orientation = 'portrait',
  children,
  className = '',
  showFooterMeta = false,
  padding,
  contentClassName,
}: F4PageProps) {
  const displayPageNum = customPageNumber !== undefined ? customPageNumber : pageNumber;
  const isLandscape = orientation === 'landscape';
  
  const defaultPadding = isCover
    ? 'p-0 overflow-hidden'
    : isLandscape
    ? 'p-[25mm]'
    : 'p-[25mm]';
    
  const paddingClass = padding || defaultPadding;

  return (
    <div
      data-pdf-page="true"
      data-is-cover={isCover ? 'true' : 'false'}
      data-orientation={orientation}
      className={`f4-page ${isLandscape ? 'f4-page-landscape' : 'f4-page-portrait'} official-pdf-page relative bg-white text-black mx-auto transition-all ${paddingClass} ${className}`}
      style={{
        width: isLandscape ? '330mm' : '215mm',
        minHeight: isLandscape ? '215mm' : '330mm',
        height: isLandscape ? '215mm' : '330mm',
        boxSizing: 'border-box',
        marginBottom: '36px',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: 'Arial, Helvetica, sans-serif',
        border: '1px solid #cbd5e1',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25), 0 2px 6px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Printable page styling container */}
      <div
        className="w-full h-full flex flex-col justify-start"
        style={{ backgroundColor: '#ffffff', color: isCover ? 'inherit' : '#000000', fontFamily: 'Arial, Helvetica, sans-serif' }}
      >
        {/* Page Main Content Area (strictly bounded by 25mm = 2.5cm margins on all 4 sides) */}
        <div
          className={`w-full flex-1 flex flex-col justify-start text-[12pt] leading-[1.5] text-justify ${isCover ? '' : 'text-black'} ${
            contentClassName || 'overflow-visible'
          }`}
          style={{ color: isCover ? 'inherit' : '#000000', fontFamily: 'Arial, Helvetica, sans-serif', lineHeight: '1.5' }}
        >
          {children}
        </div>
      </div>

      {/* Bottom Page Numbering Footer inside bottom margin zone (MS Word F4 standard) */}
      {!isCover && displayPageNum !== undefined && (
        <div
          className="flex items-center justify-end text-[10pt] text-black font-sans pointer-events-none select-none"
          style={{
            position: 'absolute',
            left: '25mm',
            right: '25mm',
            bottom: '11mm',
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          {showFooterMeta ? (
            <div className="w-full flex items-center justify-between border-t border-slate-300 pt-1 text-[9pt] text-slate-600">
              <span className="italic">Tim PPI - UOBK RSUD Al-Mulk Kota Sukabumi</span>
              <span className="font-semibold text-slate-800">
                {totalPages ? `Halaman ${displayPageNum} dari ${totalPages}` : `${displayPageNum}`}
              </span>
            </div>
          ) : (
            <span className="font-normal">{displayPageNum}</span>
          )}
        </div>
      )}
    </div>
  );
}
