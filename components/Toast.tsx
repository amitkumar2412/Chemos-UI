interface ToastProps {
  message: string;
  ok: boolean;
  visible: boolean;
}

export default function Toast({ message, ok, visible }: ToastProps) {
  return (
    <div className={`toast${visible ? ' show' : ''} ${ok ? 'ok' : 'err'}`}>
      {ok ? '✅ ' : '❌ '}
      {message}
    </div>
  );
}
