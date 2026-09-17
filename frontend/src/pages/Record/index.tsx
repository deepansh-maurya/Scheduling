import {
  Maximize,
  Pause,
  Play,
  MessageCircle,
  Volume2,
  Film,
  Ban
} from "lucide-react";
import MeetingChatbot from "./_components/MeetingChatbot";
import { useCallback, useEffect, useRef, useState } from "react";
import { Socket } from "@/lib/socket";
import { toast } from "sonner";
import getudioVideo from "@/lib/audio-video";
import { useNavigate } from "react-router-dom";

interface Transcript {
  channel: number;
  transcript: string;
}

const Record = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showBot, setShowBot] = useState(false);
  const [pause, setPause] = useState(false);
  const [transcript, setTranscript] = useState<Transcript[]>([]);
  const transcriptContainerRef = useRef<HTMLDivElement | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const channelledAudioRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const nav = useNavigate();

  console.log(transcript);
  useEffect(() => {
    meetSetup();
  }, []);

  const meetSetup = async () => {
    try {
      const { channelledAudio, video, micStream, screenStream, audioContext } =
        await getudioVideo();

      micStreamRef.current = micStream;
      screenStreamRef.current = screenStream;
      channelledAudioRef.current = channelledAudio;
      audioContextRef.current = audioContext;

      if (videoRef.current) {
        videoRef.current.srcObject = video;
      }

      const recorder = new MediaRecorder(channelledAudio);

      recorder.ondataavailable = async (event) => {
        if (event.data.size === 0) return;

        const buffer = await event.data.arrayBuffer();

        Socket.liveMeetCon?.send(buffer);
      };

      recorder.start(250);

      if (Socket.liveMeetCon) {
        Socket.liveMeetCon.onmessage = (event) => {
          const data = JSON.parse(event.data);

          setTranscript((t) => [...t, data]);
        };
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to start meeting");
    }
  };

  const stopMeeting = useCallback(() => {
    if (recorderRef.current?.state !== "inactive") {
      recorderRef.current?.stop();
    }

    micStreamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    screenStreamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    channelledAudioRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    if (audioContextRef.current?.state !== "closed") {
      audioContextRef.current?.close();
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    Socket.liveMeetCon?.close();
    Socket.liveMeetCon = null;
    toast.success("Meeting recorded successfully, saving in progress");
    nav("/app/scheduled_events");
  }, [nav]);

  useEffect(() => {
    const element = transcriptContainerRef.current;

    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [transcript]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <main className="w-full h-[88vh] overflow-hidden bg-[#fafafa]">
      <section className="w-full h-full flex min-h-0">
        <div className="w-1/2 h-full min-h-0 border-r border-gray-200">
          <div className="w-full h-1/2 p-4">
            <div className=" group  relative w-full h-full overflow-hidden rounded-xl bg-black shadow-sm">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />

              <div className="pointer-events-none absolute inset-0 flex flex-col justify-end opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
                <button
                  className="
                    absolute left-1/2 top-1/2
                    -translate-x-1/2 -translate-y-1/2
                    flex h-12 w-12 items-center justify-center
                    rounded-full bg-white/90
                    text-black shadow-md
                    hover:bg-white
                  "
                  onClick={() => setPause(!pause)}
                >
                  {!pause ? <Pause size={20} /> : <Play size={20} />}
                </button>

                <div className="w-full bg-gradient-to-t from-black/80 to-transparent px-4 pt-10 pb-3">
                  <div className="mb-3 flex items-center gap-3">
                    {/* Live indicator */}
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                      </span>

                      <span className="text-[11px] font-medium uppercase tracking-wide text-white">
                        Live
                      </span>
                    </div>

                    {/* Live timeline */}
                    <div className="relative h-1 flex-1 rounded-full bg-white/30">
                      <div className="absolute left-0 top-0 h-full w-[100%] rounded-full bg-red-500" />
                    </div>

                    <span className="text-[11px] text-white/80">35:20</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 ">
                      <button
                        title="Cinema mode"
                        className="text-white/90 hover:text-white cursor-pointer"
                      >
                        <Film size={17} />
                      </button>
                      <button
                        title="Stop meeting"
                        onClick={stopMeeting}
                        className="text-white/90 hover:text-white cursor-pointer"
                      >
                        <Ban size={17} />
                      </button>
                      <button
                        title="Volume"
                        className="text-white/90 hover:text-white cursor-pointer"
                      >
                        <Volume2 size={17} />
                      </button>
                    </div>

                    <button
                      title="Full screen"
                      className="text-white/90 hover:text-white cursor-pointer"
                    >
                      <Maximize size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full h-1/2 px-5 pb-5">
            <div
              className="h-full overflow-y-auto pr-2"
              ref={transcriptContainerRef}
            >
              <div className="flex flex-col items-end gap-2">
                {Array.isArray(transcript) &&
                  transcript.length > 0 &&
                  transcript.map((t) => {
                    return (
                      <div
                        className={`w-fit  max-w-[80%]  ${t.channel == 1 ? "bg-amber-50" : "bg-blue-50"} px-3 py-2 text-sm text-gray-700   rounded-tl-lg rounded-tr-lg rounded-bl-lg `}
                      >
                        {t.transcript}
                      </div>
                    );
                  })}
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
        onClick={() => {
          setShowBot(!showBot);
        }}
      >
        <MessageCircle size={20} />
      </button>
      {showBot && (
        <MeetingChatbot
          onClose={() => {
            setShowBot(!showBot);
          }}
        />
      )}
    </main>
  );
};

export default Record;
