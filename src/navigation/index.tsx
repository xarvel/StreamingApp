import React, { FC } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootStackParamList } from '../types/navigation';
import { AuthScreen } from '../screens/AuthScreen.tsx';
import { RoomScreen } from '../screens/RoomScreen.tsx';
import { CallScreen } from '../screens/CallScreen.tsx';
import { RootState } from '../store';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const Navigation: FC = () => {
  const token = useSelector((state: RootState) => state.auth.token);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!token ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <>
            <Stack.Screen name="Room" component={RoomScreen} />
            <Stack.Screen name="Call" component={CallScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
