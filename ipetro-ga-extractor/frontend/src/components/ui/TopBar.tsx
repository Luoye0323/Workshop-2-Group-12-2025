interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-8 py-5">
      <h1 className="text-gray-900">{title}</h1>
    </div>
  );
}
