import React, { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw, Compass } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught cosmic anomaly:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          id="error-boundary-screen"
          className="min-h-screen w-full flex items-center justify-center bg-[#071330] text-sky-100 p-6"
        >
          <div className="max-w-md w-full bg-sky-950/80 backdrop-blur-md border border-amber-500/40 rounded-2xl p-8 text-center shadow-2xl shadow-amber-950/30">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-8 h-8 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2 font-display">
              Tàu Vũ Trụ Gặp Nhiễu Loạn Từ Trường
            </h2>
            <p className="text-sm text-sky-200/80 mb-6 leading-relaxed">
              Hệ thống điều hướng READVERSE vừa kích hoạt khiên chắn an toàn để bảo vệ dữ liệu đọc của bạn.
            </p>
            {this.state.error && (
              <div className="mb-6 p-3 bg-slate-900/80 rounded-lg text-left text-xs font-mono text-amber-300/80 overflow-x-auto border border-amber-500/20 max-h-28">
                {this.state.error.message}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                id="error-reload-btn"
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-medium shadow-lg shadow-sky-500/25 transition-all text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Khởi động lại hành trình
              </button>
              <button
                id="error-home-btn"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = "/";
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sky-200 border border-white/10 transition-all text-sm"
              >
                <Compass className="w-4 h-4" />
                Về trạm vũ trụ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
