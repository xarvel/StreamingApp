import { useEffect, useRef, useState } from 'react';
import {
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';
import { Device } from 'mediasoup-client';
import * as protoo from 'protoo-client';
import { Consumer, Transport } from 'mediasoup-client/types';

const SIGNALING_URL = 'wss://v3demo.mediasoup.org:4443';

type RemotePeer = {
  peerId: string;
  stream: MediaStream;
};

type PeerDevice = {
  flag: string;
  name: string;
  version: string;
};

type PeerData = {
  device: PeerDevice;
  displayName: string;
  id: string;
};

export const localPeerData = {
  displayName: 'WebRTCTest',
  device: {
    flag: 'react-native',
    name: 'React Native',
    version: '0.78.2',
  },
};

const maxPeersCount = 4;

export const useMediasoup = (roomId: string) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<RemotePeer[]>([]);
  const [peersData, setPeersData] = useState<Record<PeerData['id'], PeerData>>({});
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const protooRef = useRef<protoo.Peer | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<Transport | null>(null);
  const recvTransportRef = useRef<Transport | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const peerId = 'peer_' + Math.random().toString(36).substring(2, 8);
        const protooUrl = `${SIGNALING_URL}/?roomId=${roomId}&peerId=${peerId}`;

        const WebSocketTransport = protoo.WebSocketTransport;
        const transport = new WebSocketTransport(protooUrl);
        const protooPeer = new protoo.Peer(transport);
        protooRef.current = protooPeer;

        setupProtooEvents(protooPeer);
      } catch (err) {
        setError('WebRTC connection error: ' + err);
      }
    };

    const setupProtooEvents = (protoo: protoo.Peer) => {
      protoo.on('open', () => onProtooOpen(protoo));
      protoo.on('failed', () => setError('WebSocket connection failed'));
      protoo.on('disconnected', () => setConnected(false));
      protoo.on('close', () => setConnected(false));
    };

    const onProtooOpen = async (protoo: protoo.Peer) => {
      const device = new Device();
      deviceRef.current = device;

      const routerRtpCapabilities = await protoo.request(
        'getRouterRtpCapabilities',
      );
      await device.load({ routerRtpCapabilities });

      await setupRecvTransport(protoo, device);
      await joinRoom(protoo, device);
      await setupSendTransport(protoo, device);
    };

    const setupRecvTransport = async (
      protoo: protoo.Peer,
      device: Device,
    ) => {
      const recvInfo = await protoo.request('createWebRtcTransport', {
        producing: false,
        consuming: true,
      });
      const recvTransport = device.createRecvTransport(recvInfo);
      recvTransportRef.current = recvTransport;

      recvTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
        protoo
          .request('connectWebRtcTransport', {
            transportId: recvTransport.id,
            dtlsParameters,
          })
          .then(callback)
          .catch(errback);
      });
    };

    const joinRoom = async (protoo: protoo.Peer, device: Device) => {
      const { peers } = await protoo.request('join', {
        ...localPeerData,
        rtpCapabilities: device.rtpCapabilities,
      });

      const peersMap = (peers as PeerData[]).reduce<Record<PeerData['id'], PeerData>>(
        (acc, it) => {
          acc[it.id] = it;
          return acc;
        },
        {},
      );
      setPeersData(peersMap);

      protoo.on('request', async (request, accept, reject) => {
        if (request.method === 'newConsumer') {
          const { peerId, producerId, id, kind, rtpParameters, appData } =
            request.data;

          try {
            const recvTransport = recvTransportRef.current;
            if (!recvTransport) {
              throw new Error('No recv transport');
            }

            const consumer: Consumer = await recvTransport.consume({
              id,
              producerId,
              kind,
              rtpParameters,
              streamId: `${peerId}-${appData.share ? 'share' : 'mic-webcam'}`,
              appData: { ...appData, peerId },
            });

            setRemotePeers(prev => {
              const existing = prev.find(p => p.peerId === peerId);
              if (existing) {
                const updated = new MediaStream([
                  ...existing.stream.getTracks(),
                  consumer.track,
                ]);
                return prev.map(p =>
                  p.peerId === peerId ? { ...p, stream: updated } : p,
                ).slice(0, maxPeersCount);
              } else {
                return [
                  ...prev,
                  { peerId, stream: new MediaStream([consumer.track]) },
                ].slice(0, maxPeersCount);
              }
            });

            accept();
          } catch (err: any) {
            reject(err);
          }
        }
      });

      protoo.on(
        'notification',
        (notification: any) => {
          if (notification.method === 'peerClosed') {
            const { peerId } = notification.data;
            setRemotePeers(prev => prev.filter(p => p.peerId !== peerId));
            setPeersData(it => {
              const newData = { ...it };
              delete newData[peerId];
              return newData;
            });
          }
          if (notification.method === 'newPeer') {
            const peer: PeerData = notification.data;
            setPeersData(it => ({ ...it, [peer.id]: peer }));
          }
        },
      );
    };

    const setupSendTransport = async (
      protoo: protoo.Peer,
      device: Device,
    ) => {
      const local = await mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setLocalStream(local);

      const sendInfo = await protoo.request('createWebRtcTransport', {
        producing: true,
        consuming: false,
      });
      const sendTransport = device.createSendTransport(sendInfo);
      sendTransportRef.current = sendTransport;

      sendTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
        protoo
          .request('connectWebRtcTransport', {
            transportId: sendTransport.id,
            dtlsParameters,
          })
          .then(callback)
          .catch(errback);
      });

      sendTransport.on(
        'produce',
        ({ kind, rtpParameters }, callback, errback) => {
          protoo
            .request('produce', {
              transportId: sendTransport.id,
              kind,
              rtpParameters,
            })
            .then(({ id }: { id: string }) => callback({ id }))
            .catch(errback);
        },
      );

      for (const track of local.getTracks()) {
        await sendTransport.produce({ track });
      }

      setConnected(true);
    };

    run();

    return () => {
      protooRef.current?.close();
      sendTransportRef.current?.close();
      recvTransportRef.current?.close();
      localStream?.getTracks().forEach(t => t.stop());
    };
  }, [roomId]);

  const endCall = () => {
    protooRef.current?.close();
    sendTransportRef.current?.close();
    recvTransportRef.current?.close();
    localStream?.getTracks().forEach(t => t.stop());
    setLocalStream(null);
    setRemotePeers([]);
    setConnected(false);
  };

  return { localStream, remotePeers, peersData, connected, error, endCall };
};
