import { ArrowUp, Maximize2, Mic, Paperclip, Sparkles, X } from "lucide-react";
import { useState } from "react";

const MeetingChatbot = () => {
  const [width, setWidth] = useState(420);
  const [height, setHeight] = useState(430);

  const startResizeLeft = (e: React.PointerEvent) => {
    e.preventDefault();

    const startX = e.clientX;
    const startWidth = width;

    const handleMove = (event: PointerEvent) => {
      const newWidth = startWidth + (startX - event.clientX);

      setWidth(Math.min(800, Math.max(360, newWidth)));
    };

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const startResizeHeight = (e: React.PointerEvent) => {
    e.preventDefault();

    const startY = e.clientY;
    const startHeight = height;

    const handleMove = (event: PointerEvent) => {
      const newHeight = startHeight + (startY - event.clientY);

      setHeight(Math.min(750, Math.max(350, newHeight)));
    };

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  return (
    <div
      style={{
        width,
        height
      }}
      className="
        fixed
        bottom-5
        right-5
        z-50
        flex
        flex-col
        overflow-visible
        rounded-2xl
        border
        border-gray-200
        bg-white
        shadow-2xl
      "
    >
      {/* LEFT RESIZE HANDLE */}
      <div
        onPointerDown={startResizeLeft}
        className="
          absolute
          left-0
          top-0
          h-full
          w-1.5
          -translate-x-1/2
          cursor-ew-resize
        "
      />

      {/* TOP RESIZE HANDLE */}
      <div
        onPointerDown={startResizeHeight}
        className="
          absolute
          left-0
          top-0
          h-1.5
          w-full
          -translate-y-1/2
          cursor-ns-resize
        "
      />

      {/* HEADER */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
            <Sparkles size={15} />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-900">
              Meeting Assistant
            </p>

            <p className="text-[11px] text-gray-400">
              Ask anything about this meeting
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <Maximize2 size={16} />
          </button>

          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <X size={17} />
          </button>
        </div>
      </div>

      {/* CONTEXT */}
      <div className="shrink-0 border-b border-gray-100 bg-gray-50 px-4 py-2">
        <div className="flex items-center gap-2 text-[11px] text-gray-500">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Using transcript & recording
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-4">
          {/* AI MESSAGE */}
          <div className="max-w-[85%]">
            <p className="mb-1 text-[11px] font-medium text-gray-400">
              Assistant
            </p>

            <div className="rounded-xl bg-gray-50 px-3 py-2.5 text-sm leading-5 text-gray-700">
              I can answer questions about the meeting, transcript, decisions,
              action items, and shared screen.
            </div>
          </div>

          {/* USER MESSAGE */}
          <div className="ml-auto max-w-[80%]">
            <div className="rounded-xl bg-blue-50 px-3 py-2.5 text-sm leading-5 text-gray-700">
              What were the main decisions?
            </div>
          </div>

          {/* AI MESSAGE */}
          <div className="max-w-[85%]">
            <p className="mb-1 text-[11px] font-medium text-gray-400">
              Assistant
            </p>

            <div className="rounded-xl bg-gray-50 px-3 py-2.5 text-sm leading-5 text-gray-700">
              The team agreed to move forward with the new authentication
              architecture and review the integration changes before the next
              meeting.
            </div>
          </div>
        </div>
      </div>

      {/* SUGGESTIONS */}
      <div className="shrink-0 overflow-x-auto border-t border-gray-100 px-3 py-2">
        <div className="flex gap-2">
          <button className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
            Summarize
          </button>

          <button className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
            Action items
          </button>

          <button className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
            Decisions
          </button>
        </div>
      </div>

      {/* INPUT */}
      <div className="shrink-0 p-3">
        <div className="rounded-xl border border-gray-200 bg-white">
          <textarea
            placeholder="Ask about this meeting..."
            rows={2}
            className="
              w-full
              resize-none
              border-0
              bg-transparent
              px-3
              pt-3
              text-sm
              outline-none
              placeholder:text-gray-400
            "
          />

          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex items-center gap-1">
              <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                <Paperclip size={17} />
              </button>

              <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                <Mic size={17} />
              </button>
            </div>

            <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white hover:bg-gray-800">
              <ArrowUp size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* CORNER RESIZE */}
      <div
        onPointerDown={(e) => {
          e.preventDefault();

          const startX = e.clientX;
          const startY = e.clientY;
          const startWidth = width;
          const startHeight = height;

          const handleMove = (event: PointerEvent) => {
            const newWidth = startWidth + (startX - event.clientX);

            const newHeight = startHeight + (startY - event.clientY);

            setWidth(Math.min(800, Math.max(360, newWidth)));
            setHeight(Math.min(750, Math.max(350, newHeight)));
          };

          const handleUp = () => {
            window.removeEventListener("pointermove", handleMove);
            window.removeEventListener("pointerup", handleUp);
          };

          window.addEventListener("pointermove", handleMove);
          window.addEventListener("pointerup", handleUp);
        }}
        className="
          absolute
          bottom-0
          left-0
          h-5
          w-5
          -translate-x-1/2
          translate-y-1/2
          cursor-sw-resize
        "
      />
    </div>
  );
};

export default MeetingChatbot;
