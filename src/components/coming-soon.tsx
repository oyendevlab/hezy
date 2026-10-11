/** Kandungan sementara untuk skrin yang akan dibina dalam fasa seterusnya. */
export function ComingSoon({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-5 pt-13 md:px-10 md:pt-10">
      <h1 className="font-display text-[30px] font-bold">{title}</h1>
      <div className="bg-surface text-muted mt-4 rounded-3xl p-5 text-[15px] leading-relaxed">
        {children}
      </div>
    </div>
  );
}
