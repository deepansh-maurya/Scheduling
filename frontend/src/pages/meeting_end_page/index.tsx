import { MessageCircle } from "lucide-react";

export const MeetingEnd = () => {
  return (
    <main className="w-full h-[88vh] overflow-hidden bg-[#fafafa]">
      <section className="h-[90%] flex min-h-0">
        <div className="w-1/2 h-full min-h-0 border-r border-gray-200 bg-white">
          <div className="h-full overflow-y-auto px-6 py-5">
            <div className="mb-5">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Transcript
              </p>
            </div>

            <div className="space-y-4">{/* transcript items */}</div>
          </div>
        </div>

        <div className="relative w-1/2 h-full min-h-0 bg-white">
          <div className="h-full overflow-y-auto p-6"></div>

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
        </div>
      </section>
    </main>
  );
};
