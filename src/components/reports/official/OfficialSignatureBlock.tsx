import React from 'react';

interface SignaturePerson {
  roleTitle: string;
  name: string;
  nipOrTitle?: string;
  signatureImage?: string;
}

interface OfficialSignatureBlockProps {
  locationDate: string;
  leftPerson?: SignaturePerson;
  rightPerson: SignaturePerson;
  centerPerson?: SignaturePerson;
}

export default function OfficialSignatureBlock({
  locationDate,
  leftPerson,
  rightPerson,
  centerPerson,
}: OfficialSignatureBlockProps) {
  return (
    <div className="w-full mt-10 text-black font-calibri text-xs sm:text-sm break-inside-avoid">
      {/* Date Alignment */}
      <div className="flex justify-end mb-4">
        <p className="font-semibold text-right pr-6">{locationDate}</p>
      </div>

      {/* Grid of Signatures */}
      <div className="grid grid-cols-2 gap-8 items-start text-center">
        {/* Left Signature (Mengetahui / Ketua PPI / Direktur) */}
        <div>
          {leftPerson ? (
            <div className="flex flex-col items-center">
              <p className="font-bold">{leftPerson.roleTitle},</p>
              <div className="h-20 sm:h-24 flex items-center justify-center">
                {leftPerson.signatureImage ? (
                  <img src={leftPerson.signatureImage} alt="TTD" className="max-h-16 object-contain" />
                ) : (
                  <div className="text-slate-300 italic text-[11px]">(Tanda Tangan)</div>
                )}
              </div>
              <p className="font-bold underline decoration-1 underline-offset-2">{leftPerson.name}</p>
              {leftPerson.nipOrTitle && (
                <p className="text-[11px] text-slate-700">{leftPerson.nipOrTitle}</p>
              )}
            </div>
          ) : (
            <div />
          )}
        </div>

        {/* Right Signature (Penyusun / IPCN) */}
        <div>
          <div className="flex flex-col items-center">
            <p className="font-bold">{rightPerson.roleTitle},</p>
            <div className="h-20 sm:h-24 flex items-center justify-center">
              {rightPerson.signatureImage ? (
                <img src={rightPerson.signatureImage} alt="TTD" className="max-h-16 object-contain" />
              ) : (
                <div className="text-slate-300 italic text-[11px]">(Tanda Tangan)</div>
              )}
            </div>
            <p className="font-bold underline decoration-1 underline-offset-2">{rightPerson.name}</p>
            {rightPerson.nipOrTitle && (
              <p className="text-[11px] text-slate-700">{rightPerson.nipOrTitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* Center Signature (Optional for Direktur endorsement below) */}
      {centerPerson && (
        <div className="mt-8 flex flex-col items-center text-center">
          <p className="font-bold">{centerPerson.roleTitle},</p>
          <div className="h-20 sm:h-24 flex items-center justify-center">
            {centerPerson.signatureImage ? (
              <img src={centerPerson.signatureImage} alt="TTD" className="max-h-16 object-contain" />
            ) : (
              <div className="text-slate-300 italic text-[11px]">(Tanda Tangan)</div>
            )}
          </div>
          <p className="font-bold underline decoration-1 underline-offset-2">{centerPerson.name}</p>
          {centerPerson.nipOrTitle && (
            <p className="text-[11px] text-slate-700">{centerPerson.nipOrTitle}</p>
          )}
        </div>
      )}
    </div>
  );
}
