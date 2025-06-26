import React, { useEffect, FC, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  AppState,
  AppStateStatus,
} from 'react-native';
import PipAndroid from 'react-native-pip-android';
import { RTCView } from 'react-native-webrtc';
import { CallScreenProps } from '../types/navigation';
import { useMediasoup } from '../hooks/useMediasoup';
import { colors } from '../theme/colors';

export const CallScreen: FC<CallScreenProps> = ({ navigation, route }) => {
  const { roomId } = route.params;
  const { localStream, remotePeers, connected, endCall } = useMediasoup(roomId);
  const [isPipMode, setIsPipMode] = useState(false);

  const remoteStream = remotePeers[0]?.stream;

  const handleEndCall = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' && remoteStream) {
        PipAndroid.enterPipMode( 214, 300);
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    const pipModeListener = PipAndroid.onPipModeChanged((isModeEnabled: Boolean) => {
      setIsPipMode(Boolean(isModeEnabled));
    });

    return () => {
      appStateSubscription.remove();
      pipModeListener?.remove();
    };
  }, [remoteStream]);


  if(isPipMode){
    if(remoteStream){
      return  (
        <RTCView
          streamURL={remoteStream.toURL()}
          objectFit="cover"
          style={styles.remoteStream}
        />
      );
    }
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Local Stream */}
      {localStream && (
        <RTCView
          streamURL={localStream.toURL()}
          style={styles.localStream}
          objectFit="cover"
          zOrder={1}
        />
      )}

      {/* Remote Stream */}
      {remoteStream && (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.remoteStream}
          objectFit="cover"
          zOrder={0}
        />
      )}

      {/* End Call Button */}
      <TouchableOpacity
        style={styles.endCallButton}
        onPress={handleEndCall}
      >
        <Text style={styles.endCallText}>Завершить</Text>
      </TouchableOpacity>

      {/* Connection Status */}
      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, connected ? styles.statusConnected : styles.statusConnecting]}>
          {connected ? 'Подлючено' : 'Подключение...'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  localStream: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 100,
    height: 150,
    backgroundColor: colors.streamBackgroundSecondary,
    borderRadius: 10,
    zIndex: 2,
  },
  remoteStream: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.streamBackground,
    zIndex: 1,
  },
  endCallButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    zIndex: 3,
  },
  endCallText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: colors.overlay,
    padding: 8,
    borderRadius: 5,
    zIndex: 3,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusConnected: {
    color: colors.success,
  },
  statusConnecting: {
    color: colors.error,
  },
});
