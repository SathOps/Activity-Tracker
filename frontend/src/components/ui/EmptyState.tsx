interface Props {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, message, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-4xl text-slate-300">{icon}</div>}
      <h3 className="text-base font-semibold text-slate-600">{title}</h3>
      {message && (
        <p className="mt-1 text-sm text-slate-400 max-w-sm">{message}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
