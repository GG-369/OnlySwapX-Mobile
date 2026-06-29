import { useCallback, useEffect, useState } from 'react';
import { Audio } from 'expo-av';

export function useVoiceRecorder() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const startRecording = useCallback(async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Permite acceso al micrófono para grabar notas de voz.');
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    const { recording: nextRecording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    setRecording(nextRecording);
    setRecordingUri(null);
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recording) return null;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    setRecordingUri(uri);
    setIsRecording(false);
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    return uri;
  }, [recording]);

  const play = useCallback(async (uri?: string | null) => {
    const target = uri || recordingUri;
    if (!target) return;

    setIsPlaying(true);
    const { sound } = await Audio.Sound.createAsync({ uri: target });
    sound.setOnPlaybackStatusUpdate((status) => {
      if ('didJustFinish' in status && status.didJustFinish) {
        setIsPlaying(false);
        sound.unloadAsync();
      }
    });
    await sound.playAsync();
  }, [recordingUri]);

  useEffect(() => () => {
    if (recording) {
      recording.stopAndUnloadAsync();
    }
  }, [recording]);

  return {
    recordingUri,
    isRecording,
    isPlaying,
    startRecording,
    stopRecording,
    play,
    clearRecording: () => setRecordingUri(null),
  };
}
