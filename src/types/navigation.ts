import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Auth: undefined;
  Room: undefined;
  Call: {
    roomId: string;
  };
};

export type AuthScreenProps = NativeStackScreenProps<RootStackParamList, 'Auth'>;
export type RoomScreenProps = NativeStackScreenProps<RootStackParamList, 'Room'>;
export type CallScreenProps = NativeStackScreenProps<RootStackParamList, 'Call'>;
