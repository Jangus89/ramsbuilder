import { useState, useRef, useCallback } from 'react';

export function useVoiceInput({ onTranscript, onError }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const hasSpeechRecognition =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  const hasMediaRecorder =
    typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined';

  const supported = hasSpeechRecognition || hasMediaRecorder;

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    if (listening) return;

    if (hasSpeechRecognition) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SR();
      recognition.lang = 'en-GB';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        const text = event.results[0]?.[0]?.transcript || '';
        if (text) onTranscript(text);
        setListening(false);
      };
      recognition.onerror = (event) => {
        onError?.(event.error);
        setListening(false);
      };
      recognition.onend = () => {
        recognitionRef.current = null;
        setListening(false);
      };
      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
      return;
    }

    if (hasMediaRecorder) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          const recorder = new MediaRecorder(stream);
          chunksRef.current = [];
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
          };
          recorder.onstop = async () => {
            stream.getTracks().forEach((t) => t.stop());
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('audio', blob, 'recording.webm');
            try {
              const resp = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData,
              });
              if (!resp.ok) throw new Error('Transcription failed');
              const data = await resp.json();
              if (data.text) onTranscript(data.text);
            } catch (err) {
              onError?.(err.message);
            }
            setListening(false);
          };
          recorderRef.current = recorder;
          recorder.start();
          setListening(true);
        })
        .catch((err) => {
          onError?.(err.message);
          setListening(false);
        });
      return;
    }
  }, [listening, hasSpeechRecognition, hasMediaRecorder, onTranscript, onError]);

  return { listening, start, stop, supported };
}
