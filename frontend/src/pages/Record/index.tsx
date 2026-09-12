import {
  Maximize,
  Pause,
  Play,
  MessageCircle,
  Volume2,
  Film
} from "lucide-react";
import MeetingChatbot from "./_components/MeetingChatbot";

const Record = () => {
  return (
    <main className="w-full h-[88vh] overflow-hidden bg-[#fafafa]">
      <section className="w-full h-full flex min-h-0">
        {/* LEFT */}
        <div className="w-1/2 h-full min-h-0 border-r border-gray-200">
          {/* VIDEO */}
          <div className="w-full h-1/2 p-4">
            <div className="relative w-full h-full overflow-hidden rounded-xl bg-black shadow-sm">
              <video src="" className="w-full h-full object-contain" />

              {/* Video overlay */}
              <div className="absolute inset-0 flex flex-col justify-end">
                {/* Center play/pause */}
                <button
                  className="
                    absolute left-1/2 top-1/2
                    -translate-x-1/2 -translate-y-1/2
                    flex h-12 w-12 items-center justify-center
                    rounded-full bg-white/90
                    text-black shadow-md
                    hover:bg-white
                  "
                >
                  <Pause size={20} />
                  {/* <Play size={20} /> */}
                </button>

                {/* Controls */}
                <div className="w-full bg-gradient-to-t from-black/80 to-transparent px-4 pt-10 pb-3">
                  {/* Timeline */}
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-[11px] text-white/80">12:42</span>

                    <div className="relative h-1 flex-1 rounded-full bg-white/30">
                      <div className="absolute left-0 top-0 h-full w-[35%] rounded-full bg-white" />

                      <div className="absolute left-[35%] top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
                    </div>

                    <span className="text-[11px] text-white/80">35:20</span>
                  </div>

                  {/* Bottom controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button className="text-white/90 hover:text-white">
                        <Film size={17} />
                      </button>

                      <button className="text-white/90 hover:text-white">
                        <Volume2 size={17} />
                      </button>

                      <span className="text-xs text-white/70">
                        Screen recording
                      </span>
                    </div>

                    <button className="text-white/90 hover:text-white">
                      <Maximize size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TRANSCRIPT / CAPTIONS */}
          <div className="w-full h-1/2 px-5 pb-5">
            <div className="h-full overflow-y-auto pr-2">
              <div className="mb-5">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Transcript
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="w-fit max-w-[80%] bg-blue-50 px-3 py-2 text-sm text-gray-700   rounded-tl-lg rounded-tr-lg rounded-bl-lg ">
                  Hey, this is the first caption.
                </div>

                <div className="w-fit max-w-[80%] bg-blue-50 px-3 py-2 text-sm text-gray-700 rounded-tl-lg rounded-tr-lg rounded-bl-lg">
                  We are going to discuss the project architecture.
                </div>

                <div className="w-fit max-w-[80%] bg-blue-50 px-3 py-2 text-sm text-gray-700 rounded-tl-lg rounded-tr-lg rounded-bl-lg">
                  The main focus today is the new meeting system.
                </div>

                <div className="w-fit max-w-[80%] bg-blue-50 px-3 py-2 text-sm text-gray-700 rounded-tl-lg rounded-tr-lg rounded-bl-lg">
                  We also need to review the integrations.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-1/2 h-full min-h-0 bg-white">
          <div className="h-full p-6">
            <div className="border-b border-gray-200 pb-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Meeting
              </p>

              <h1 className="mt-1 text-lg font-semibold text-gray-900">
                Project Discussion
              </h1>

              <p className="mt-1 text-sm text-gray-500">Today · 35 minutes</p>
            </div>

            {/* Right-side content goes here */}
            <div className="mt-6">
              {/* Summary / Notes / Action Items / AI */}
            </div>
          </div>
        </div>
      </section>

      {/* CHATBOT */}
      <button
        className="
          fixed bottom-6 right-6
          flex h-12 w-12
          items-center justify-center
          rounded-full
          bg-black text-white
          shadow-lg
          hover:bg-gray-800
        "
      >
        <MessageCircle size={20} />
      </button>
      <MeetingChatbot />
    </main>
  );
};

export default Record;
