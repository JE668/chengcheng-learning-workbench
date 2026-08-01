export default function ChildLoading() {
  return (
    <div className="max-w-3xl mx-auto py-20 flex flex-col items-center justify-center text-center">
      <div className="text-6xl mb-4 animate-bounce">🐰</div>
      <p className="text-moko-violet font-bold">萌可正在准备…</p>
      <div className="mt-4 w-40 h-2 rounded-full bg-gray-200 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-moko-pink to-moko-rose animate-pulse" />
      </div>
    </div>
  );
}
