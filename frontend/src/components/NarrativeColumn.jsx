import React from 'react';

const NarrativeColumn = ({ story, quote }) => {
  return (
    <div className="flex flex-col gap-10 p-10 bg-white border border-accent-sage rounded-2xl w-full max-w-2xl mx-auto shadow-sm">
      <div className="flex flex-col gap-1">
        <span className="text-label">Analysis</span>
        <h3 className="text-xl font-bold">Summary</h3>
      </div>

      <div className="space-y-8">
        <p className="text-lg leading-relaxed text-text-ink/80 font-medium">
          {story || "Data synthesis incomplete. Please record to generate summary."}
        </p>

        {quote && (
          <div className="pl-6 border-l-2 border-accent-sage">
            <span className="text-label italic block mb-2">Note</span>
            <p className="text-sm text-text-ink/60">
              {quote}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NarrativeColumn;
