import React, { useState, useRef } from 'react';
import { saveCondition } from '../services/api';

/**
 * Voice-enabled condition form component
 * - Uses Web Speech API for speech-to-text
 * - Always shows transcription in editable field before saving
 * - Never auto-saves
 * - Manual review mandatory
 */
export default function VoiceConditionForm({ accessToken, patientId, onConditionSaved, onCancel }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [micStatus, setMicStatus] = useState('idle'); // idle, listening, stopped, error
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const recognitionRef = useRef(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  // Initialize Web Speech API
  const initSpeechRecognition = () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      setSpeechSupported(false);
      setMicStatus('error');
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let interimTranscript = '';

    recognition.onstart = () => {
      console.log('[Voice] Speech recognition started');
      setMicStatus('listening');
      setIsListening(true);
      setSaveError('');
    };

    recognition.onresult = (event) => {
      interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptSegment = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          // Final result - add to main transcript
          setTranscript(prev => prev + (prev ? ' ' : '') + transcriptSegment);
        } else {
          // Interim result
          interimTranscript += transcriptSegment;
        }
      }

      // Show interim results in console for debugging
      if (interimTranscript) {
        console.log('[Voice] Interim:', interimTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('[Voice] Error:', event.error);
      setMicStatus('error');
      setIsListening(false);
      
      if (event.error === 'no-speech') {
        setSaveError('No speech detected. Please try again.');
      } else if (event.error === 'permission-denied') {
        setSaveError('Microphone permission denied. Please enable it in your browser settings.');
      } else if (event.error === 'network') {
        setSaveError('Network error. Please check your internet connection.');
      } else {
        setSaveError(`Error: ${event.error}. Please try again.`);
      }
    };

    recognition.onend = () => {
      console.log('[Voice] Speech recognition ended');
      setMicStatus('stopped');
      setIsListening(false);
    };

    return recognition;
  };

  const handleStartListening = () => {
    if (!recognitionRef.current) {
      recognitionRef.current = initSpeechRecognition();
    }

    if (!recognitionRef.current) {
      setSaveError('Speech recognition not supported in your browser');
      return;
    }

    try {
      setTranscript('');
      setSaveError('');
      recognitionRef.current.start();
    } catch (err) {
      console.error('[Voice] Error starting recognition:', err);
      setSaveError('Failed to start microphone. Please try again.');
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleRetry = () => {
    setTranscript('');
    setSaveError('');
    setMicStatus('idle');
    handleStartListening();
  };

  const handleSave = async () => {
    if (!transcript.trim()) {
      setSaveError('Please provide a condition name');
      return;
    }

    setIsSaving(true);
    setSaveError('');

    try {
      const conditionData = {
        name: transcript.trim(),
        description: 'Added via voice input',
        severity: 'moderate',
        diagnosedDate: new Date().toISOString().split('T')[0],
        status: 'active'
      };

      const result = await saveCondition(accessToken, patientId, 'create', conditionData);
      
      console.log('[Voice] Condition saved:', result.id);
      
      // Notify parent component
      if (onConditionSaved) {
        onConditionSaved(result.data);
      }

      // Reset form
      setTranscript('');
      setMicStatus('idle');
    } catch (err) {
      console.error('[Voice] Error saving condition:', err.message);
      setSaveError(`Failed to save condition: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    setTranscript('');
    setMicStatus('idle');
    setSaveError('');
    if (onCancel) onCancel();
  };

  if (!speechSupported) {
    return (
      <div className="card p-4 border border-red-200 bg-red-50 dark:bg-red-900/10">
        <p className="text-sm text-red-600 dark:text-red-400">
          ⚠️ Speech-to-text is not supported in your browser. Please use Chrome, Edge, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6 space-y-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Condition via Voice</h3>

      {/* Microphone Status */}
      <div className="flex items-center gap-2 text-sm">
        <div
          className={`h-3 w-3 rounded-full animate-pulse ${
            micStatus === 'listening'
              ? 'bg-red-500'
              : micStatus === 'stopped'
              ? 'bg-yellow-500'
              : micStatus === 'error'
              ? 'bg-red-600'
              : 'bg-gray-400'
          }`}
        />
        <span className="text-gray-600 dark:text-gray-300">
          {micStatus === 'idle' && 'Ready to listen'}
          {micStatus === 'listening' && '🎤 Listening...'}
          {micStatus === 'stopped' && '⏹️ Stopped'}
          {micStatus === 'error' && '❌ Error'}
        </span>
      </div>

      {/* Transcription Display */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Condition Name (editable)
        </label>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Speak your condition or type here..."
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
          disabled={isListening}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Your voice input appears here. You can edit it before saving.
        </p>
      </div>

      {/* Error Message */}
      {saveError && (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded text-sm text-red-700 dark:text-red-300">
          {saveError}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        {!isListening ? (
          <button
            onClick={handleStartListening}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 transition"
          >
            <span>🎤</span> Start Listening
          </button>
        ) : (
          <button
            onClick={handleStopListening}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
          >
            <span>⏹️</span> Stop Listening
          </button>
        )}

        {transcript && (
          <>
            <button
              onClick={handleRetry}
              disabled={isSaving || isListening}
              className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-medium disabled:opacity-50 transition"
            >
              Retry
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isListening}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 transition"
            >
              {isSaving ? 'Saving...' : 'Save Condition'}
            </button>
          </>
        )}

        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium disabled:opacity-50 transition"
        >
          Cancel
        </button>
      </div>

      {/* Info */}
      <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-3">
        💡 Click "Start Listening" to begin, speak naturally, then click "Stop Listening" when done.
        Review the transcription and edit if needed before saving.
      </div>
    </div>
  );
}
