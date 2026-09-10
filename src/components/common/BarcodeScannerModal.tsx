import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  X,
  FlipHorizontal,
  Volume2,
  VolumeX,
  Barcode,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  title?: string;
  subtitle?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Leitor de Código de Barras',
  subtitle = 'Aponte a câmera para o código de barras (EAN-13, EAN-8, Code128, QR Code)',
}) => {
  const [manualCode, setManualCode] = useState('');
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [scannedFeedback, setScannedFeedback] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'html5qr-code-scanner-element';

  // Play audio beep when a barcode is detected
  const playBeep = () => {
    if (!isAudioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, ctx.currentTime); // High pitch clear beep (A6)
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  const handleBarcodeDetected = (code: string) => {
    playBeep();
    if (navigator.vibrate) {
      try {
        navigator.vibrate(80);
      } catch {}
    }
    setScannedFeedback(code);
    setTimeout(() => {
      onScanSuccess(code);
      onClose();
    }, 450);
  };

  useEffect(() => {
    let isMounted = true;

    if (isOpen) {
      setScannerError(null);
      setScannedFeedback(null);
      setManualCode('');

      const startScanner = async () => {
        try {
          // Check if element exists
          const elem = document.getElementById(readerElementId);
          if (!elem) return;

          // Stop existing instance if any
          if (scannerRef.current) {
            try {
              await scannerRef.current.stop();
              scannerRef.current.clear();
            } catch {}
          }

          const html5QrCode = new Html5Qrcode(readerElementId, {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.QR_CODE,
            ],
            verbose: false,
          });

          scannerRef.current = html5QrCode;

          const config = {
            fps: 15,
            qrbox: { width: 280, height: 160 },
            aspectRatio: 1.0,
          };

          await html5QrCode.start(
            { facingMode: cameraFacing },
            config,
            (decodedText) => {
              if (isMounted) {
                handleBarcodeDetected(decodedText.trim());
              }
            },
            () => {
              // frame scanned with no code - ignore
            }
          );

          if (isMounted) {
            setIsScanning(true);
          }
        } catch (err: any) {
          console.warn('Erro ao inicializar câmera:', err);
          if (isMounted) {
            setScannerError(
              'Não foi possível acessar a câmera do dispositivo. Verifique as permissões de câmera do navegador ou utilize a digitação manual abaixo.'
            );
            setIsScanning(false);
          }
        }
      };

      // Slight delay to ensure DOM modal element is mounted
      const timer = setTimeout(() => {
        startScanner();
      }, 150);

      return () => {
        clearTimeout(timer);
        isMounted = false;
        if (scannerRef.current) {
          scannerRef.current
            .stop()
            .then(() => scannerRef.current?.clear())
            .catch(() => {});
        }
      };
    } else {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(() => {});
      }
      setIsScanning(false);
    }
  }, [isOpen, cameraFacing]);

  const toggleCameraFacing = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {}
    }
    setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleBarcodeDetected(manualCode.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">{title}</h3>
              <p className="text-[11px] text-slate-400">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera Viewfinder Area */}
        <div className="p-4 flex flex-col items-center justify-center bg-slate-950 relative min-h-[300px]">
          {/* Scanner Container */}
          <div className="relative w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center">
            <div
              id={readerElementId}
              className="w-full h-full object-cover [&_video]:rounded-2xl [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
            />

            {/* Target Reticle Overlay */}
            {isScanning && !scannedFeedback && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-64 h-36 border-2 border-blue-400 rounded-xl relative shadow-lg shadow-blue-500/20">
                  {/* Corner Markers */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br" />

                  {/* Animated Laser Beam */}
                  <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_8px_#f43f5e] animate-pulse top-1/2 -translate-y-1/2" />
                </div>
                <span className="text-[11px] font-bold text-slate-300 bg-slate-950/80 px-3 py-1 rounded-full border border-slate-700 mt-3 shadow">
                  Posicione o código de barras no centro
                </span>
              </div>
            )}

            {/* Scanned Success Feedback Overlay */}
            {scannedFeedback && (
              <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center p-4 text-center animate-fadeIn z-20">
                <div className="w-16 h-16 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/40 mb-3 animate-bounce">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h4 className="text-base font-black text-white">Código Detectado!</h4>
                <p className="text-sm font-mono font-bold text-emerald-300 mt-1 bg-emerald-900/60 px-3 py-1 rounded-lg border border-emerald-700/60">
                  {scannedFeedback}
                </p>
              </div>
            )}

            {/* Error or Fallback State */}
            {scannerError && (
              <div className="absolute inset-0 p-4 flex flex-col items-center justify-center text-center bg-slate-900/95 z-10">
                <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
                <p className="text-xs text-slate-300 leading-relaxed max-w-xs">{scannerError}</p>
              </div>
            )}
          </div>

          {/* Scanner Controls Toolbar */}
          <div className="flex items-center gap-3 mt-3">
            <button
              type="button"
              onClick={toggleCameraFacing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span>Alternar Câmera ({cameraFacing === 'environment' ? 'Traseira' : 'Frontal'})</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAudioEnabled((prev) => !prev)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title={isAudioEnabled ? 'Desativar Bipe' : 'Ativar Bipe'}
            >
              {isAudioEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
          </div>
        </div>

        {/* Manual Barcode Entry Fallback Form */}
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
            Ou digite / use leitor USB:
          </span>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ex: 7891000100015"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl pl-9 pr-3 py-2.5 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md"
            >
              Confirmar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
