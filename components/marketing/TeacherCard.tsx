import Image from "next/image";

type TeacherCardProps = {
  name: string;
  credentials: string;
  languages: string;
  imageSrc?: string;
  imageAlt?: string;
};

export function TeacherCard({
  name,
  credentials,
  languages,
  imageSrc,
  imageAlt = name,
}: TeacherCardProps) {
  return (
    <div className="w-full max-w-[300px] rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-md">
      <div className="relative h-[230px] w-full bg-slate-100">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="300px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
            <span className="text-4xl text-slate-400">?</span>
          </div>
        )}
      </div>
      <div className="p-4 text-center">
        <div className="font-semibold text-[#3d4236]">{name}</div>
        <div className="mt-1 text-sm text-[#5a5f57]">{credentials}</div>
        <div className="mt-1 text-sm text-[#429ead]">{languages}</div>
      </div>
    </div>
  );
}
