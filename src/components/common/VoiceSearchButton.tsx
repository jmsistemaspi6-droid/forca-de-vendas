import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, AlertCircle, Loader2 } from 'lucide-react';
import { useSales } from '../../context/SalesContext';

interface VoiceSearchButtonProps {
  onTranscript: (transcript: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  placeholderHint?: string;
  title?: string;
}

// Declare Web Speech API types for TypeScript
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = ({
  onTranscript,
  className = '',
  size = 'md',
  placeholderHint = 'Diga o nome do produto, código ou cliente...',
  title = 'Pesquisar por Voz (Microfone)',
}) => {
  const { showToast } = useSales();
  const [isListening, setIsListening] = useState(false);
  const [transcriptPreview, setTranscriptPreview] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscriptPreview('');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        setTranscriptPreview(currentText);

        if (finalTranscript.trim()) {
          const cleaned = finalTranscript.trim();
          onTranscript(cleaned);
          showToast('Voz Reconhecida', `Buscando por: "${cleaned}"`, 'info');
          setIsListening(false);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          showToast(
            'Permissão de Microfone',
            'Por favor, permita o acesso ao microfone no navegador para pesquisar por voz.',
            'warning'
          );
        } else if (event.error === 'no-speech') {
          showToast('Nenhuma voz detectada', 'Tente falar novamente mais próximo ao microfone.', 'info');
        } else {
          showToast('Aviso de Voz', `Não foi possível capturar o áudio (${event.error}).`, 'info');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Error initializing speech recognition:', e);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, [onTranscript, showToast]);

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSupported) {
      // Browser fallback prompt
      const manualInput = window.prompt('O navegador não suporta reconhecimento nativo de voz. Digite sua busca:');
      if (manualInput && manualInput.trim()) {
        onTranscript(manualInput.trim());
      }
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (_) {}
      setIsListening(false);
    } else {
      try {
        setTranscriptPreview('');
        recognitionRef.current?.start();
        showToast('Ouvindo...', placeholderHint, 'info');
      } catch (err) {
        console.warn('Recognition start error:', err);
        try {
          recognitionRef.current?.abort();
          setTimeout(() => {
            recognitionRef.current?.start();
          }, 100);
        } catch (_) {}
      }
    }
  };

  // Size styling
  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-2.5 text-base',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={toggleListening}
        title={isListening ? 'Clique para parar de ouvir' : title}
        className={`relative rounded-lg transition-all flex items-center justify-center shrink-0 cursor-pointer ${
          isListening
            ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/40 ring-2 ring-rose-400'
            : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
        } ${sizeClasses[size]} ${className}`}
        aria-label="Pesquisa por voz"
      >
        {isListening ? (
          <>
            <Mic className={`${iconSizes[size]} text-white animate-bounce`} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-400 rounded-full animate-ping" />
          </>
        ) : (
          <Mic className={iconSizes[size]} />
        )}
      </button>

      {/* Floating Active Voice Listening Banner */}
      {isListening && (
        <div className="fixed sm:absolute bottom-6 sm:bottom-auto sm:top-full sm:mt-2 left-1/2 -translate-x-1/2 z-50 w-72 sm:w-80 p-3 rounded-xl bg-slate-900/95 border border-rose-500/80 shadow-2xl backdrop-blur-md text-slate-100 flex flex-col gap-1.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span>Ouvindo voz em Português...</span>
            </div>
            <button
              type="button"
              onClick={() => {
                recognitionRef.current?.stop();
                setIsListening(false);
              }}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline"
            >
              Cancelar
            </button>
          </div>

          <div className="text-xs text-slate-300 italic min-h-[20px] bg-slate-950/80 p-2 rounded-lg border border-slate-800">
            {transcriptPreview ? (
              <span className="font-semibold text-emerald-300">"{transcriptPreview}"</span>
            ) : (
              <span className="text-slate-400">{placeholderHint}</span>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>Fale com clareza perto do microfone</span>
            <span className="text-rose-400 font-medium">Gravando</span>
          </div>
        </div>
      )}
    </div>
  );
};
