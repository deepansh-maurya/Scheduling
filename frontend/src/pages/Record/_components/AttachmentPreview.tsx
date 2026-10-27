import { FileText, X } from "lucide-react";
import { useEffect, useState } from "react";

type AttachmentPreviewProps = {
  files: File[];
  onRemove: (index: number) => void;
};

export function AttachmentPreview({ files, onRemove }: AttachmentPreviewProps) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((file) =>
      file.type.startsWith("image/") ? URL.createObjectURL(file) : ""
    );

    setImageUrls(urls);

    return () => {
      urls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [files]);

  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3 px-3 pb-3">
      {files.map((file, index) => {
        const isImage = file.type.startsWith("image/");

        return (
          <div
            key={`${file.name}-${index}`}
            className="group relative h-20 w-20 overflow-visible"
          >
            {isImage ? (
              <img
                src={imageUrls[index]}
                alt={file.name || "Pasted image"}
                className="h-full w-full rounded-xl border border-gray-200 bg-gray-50 object-contain"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-2">
                <FileText size={25} className="text-gray-500" />
                <span className="w-full truncate text-center text-[10px] text-gray-600">
                  {file.name || "Text file"}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label={`Remove ${file.name || "attachment"}`}
              className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow hover:bg-red-50 hover:text-red-600"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
