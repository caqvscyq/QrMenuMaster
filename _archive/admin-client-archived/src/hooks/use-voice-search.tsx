import { useState, useEffect, useRef } from "react";

interface UseVoiceSearchOptions {
  onResult: (transcript: string) => void;
  onError: (error: string) => void;
  lang?: string;
}

export function useVoiceSearch({ onResult, onError, lang = "zh-TW" }: UseVoiceSearchOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang;
      recognition.maxAlternatives = 1;
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        setIsRecording(false);
      };
      
      recognition.onerror = (event) => {
        setIsRecording(false);
        onError(event.error);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      
      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [lang, onResult, onError]);

  const startRecording = () => {
    if (!recognitionRef.current || isRecording) return;
    
    try {
      setIsRecording(true);
      recognitionRef.current.start();
    } catch (error) {
      setIsRecording(false);
      onError("Failed to start voice recognition");
    }
  };

  const stopRecording = () => {
    if (!recognitionRef.current || !isRecording) return;
    
    recognitionRef.current.stop();
    setIsRecording(false);
  };

  return {
    isRecording,
    isSupported,
    startRecording,
    stopRecording,
  };
}

// Extend the Window interface to include speech recognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
