import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useMultiplayer } from './useMultiplayer';
import { API_BASE_URL } from '@/api/api';

interface VoiceChatState {
  isConnected: boolean;
  isMuted: boolean;
  isRecording: boolean;
  participants: Record<string, boolean>; // playerId -> isSpeaking
  voicePlayers: Record<string, boolean>; // playerId -> connected
}

export const useVoiceChat = () => {
  const { localPlayerId, players, isConnected: multiplayerConnected } = useMultiplayer();
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [state, setState] = useState<VoiceChatState>({
    isConnected: false,
    isMuted: false,
    isRecording: false,
    participants: {},
    voicePlayers: {},
  });

  // Initialize WebRTC and Socket.IO for voice chat
  useEffect(() => {
    if (!multiplayerConnected || !localPlayerId) return;

    const socket = io(`${API_BASE_URL}`);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Voice chat connected');
      setState(prev => ({ ...prev, isConnected: true }));
    });

    socket.on('disconnect', () => {
      console.log('Voice chat disconnected');
      setState(prev => ({ ...prev, isConnected: false, participants: {}, voicePlayers: {} }));
      cleanupConnections();
    });

    // Handle incoming voice offers
    socket.on('voice-offer', async (data: { from: string; offer: RTCSessionDescriptionInit }) => {
      try {
        const peerConnection = createPeerConnection(data.from);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit('voice-answer', { to: data.from, answer });
      } catch (error) {
        console.error('Error handling voice offer:', error);
      }
    });

    // Handle incoming voice answers
    socket.on('voice-answer', async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
      try {
        const peerConnection = peerConnectionsRef.current[data.from];
        if (peerConnection) {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      } catch (error) {
        console.error('Error handling voice answer:', error);
      }
    });

    // Handle incoming ICE candidates
    socket.on('voice-ice-candidate', (data: { from: string; candidate: RTCIceCandidateInit }) => {
      try {
        const peerConnection = peerConnectionsRef.current[data.from];
        if (peerConnection) {
          peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    });

    // Handle participant speaking status
    socket.on('voice-speaking', (data: { playerId: string; isSpeaking: boolean }) => {
      setState(prev => ({
        ...prev,
        participants: {
          ...prev.participants,
          [data.playerId]: data.isSpeaking,
        },
      }));
    });

    // Handle player joined for voice connections
    socket.on('playerJoined', (playerId: string) => {
      setState(prev => ({
        ...prev,
        voicePlayers: {
          ...prev.voicePlayers,
          [playerId]: true,
        },
      }));
    });

    // Handle player disconnected
    socket.on('playerDisconnected', (playerId: string) => {
      setState(prev => {
        const newParticipants = { ...prev.participants };
        const newVoicePlayers = { ...prev.voicePlayers };
        delete newParticipants[playerId];
        delete newVoicePlayers[playerId];
        return { ...prev, participants: newParticipants, voicePlayers: newVoicePlayers };
      });
      // Close connection if exists
      if (peerConnectionsRef.current[playerId]) {
        peerConnectionsRef.current[playerId].close();
        delete peerConnectionsRef.current[playerId];
      }
    });

    return () => {
      socket.disconnect();
      cleanupConnections();
    };
  }, [multiplayerConnected, localPlayerId]);

  // Create WebRTC peer connection
  const createPeerConnection = useCallback((remotePlayerId: string) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    peerConnectionsRef.current[remotePlayerId] = peerConnection;

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const remoteAudio = new Audio();
      remoteAudio.srcObject = event.streams[0];
      remoteAudio.volume = 0.8;
      remoteAudio.play().catch(console.error);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('voice-ice-candidate', {
          to: remotePlayerId,
          candidate: event.candidate,
        });
      }
    };

    return peerConnection;
  }, []);

  // Initialize microphone access
  const initializeMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      localStreamRef.current = stream;

      // Create audio context for voice activity detection
      audioContextRef.current = new AudioContext();
      const analyser = audioContextRef.current.createAnalyser();
      const microphone = audioContextRef.current.createMediaStreamSource(stream);
      microphone.connect(analyser);

      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Monitor voice activity
      const checkVoiceActivity = () => {
        if (!state.isMuted && state.isRecording) {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          const isSpeaking = average > 10; // Threshold for voice detection

          // Send speaking status to other players
          if (socketRef.current) {
            socketRef.current.emit('voice-speaking', {
              playerId: localPlayerId,
              isSpeaking,
            });
          }
        }
        requestAnimationFrame(checkVoiceActivity);
      };
      checkVoiceActivity();

      return true;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      return false;
    }
  }, [state.isMuted, state.isRecording, localPlayerId]);

  // Start voice recording
  const startRecording = useCallback(async () => {
    if (!localStreamRef.current) {
      const success = await initializeMicrophone();
      if (!success) return false;
    }

    // Enable microphone tracks
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !state.isMuted;
      });
    }

    setState(prev => ({ ...prev, isRecording: true }));

    // Create connections with existing voice players
    Object.keys(state.voicePlayers).forEach(async (playerId) => {
      if (playerId !== localPlayerId && !peerConnectionsRef.current[playerId]) {
        try {
          const peerConnection = createPeerConnection(playerId);
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);

          if (socketRef.current) {
            socketRef.current.emit('voice-offer', { to: playerId, offer });
          }
        } catch (error) {
          console.error('Error creating voice connection:', error);
        }
      }
    });

    return true;
  }, [state.voicePlayers, localPlayerId, state.isMuted, createPeerConnection, initializeMicrophone]);

  // Stop voice recording
  const stopRecording = useCallback(() => {
    setState(prev => ({ ...prev, isRecording: false }));

    // Disable microphone tracks
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = false;
      });
    }

    // Notify others that we're no longer speaking
    if (socketRef.current) {
      socketRef.current.emit('voice-speaking', {
        playerId: localPlayerId,
        isSpeaking: false,
      });
    }
  }, [localPlayerId]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setState(prev => {
      const newMuted = !prev.isMuted;

      // Update microphone tracks
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(track => {
          track.enabled = !newMuted && prev.isRecording;
        });
      }

      return { ...prev, isMuted: newMuted };
    });
  }, []);

  // Cleanup connections
  const cleanupConnections = useCallback(() => {
    Object.values(peerConnectionsRef.current).forEach(connection => {
      connection.close();
    });
    peerConnectionsRef.current = {};

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    toggleMute,
  };
};
