import React, { FC } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { RoomScreenProps } from '../types/navigation';
import { logout } from '../store/slices/authSlice';
import { AppDispatch } from '../store';
import { colors } from '../theme/colors';

interface FormData {
  roomId: string;
}

export const RoomScreen: FC<RoomScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      roomId: '',
    },
  });

  const onSubmit = (data: FormData) => {
    if (data.roomId.trim()) {
      navigation.navigate('Call', { roomId: data.roomId.trim() });
    } else {
      Alert.alert('Error', 'Please enter a room ID');
    }
  };

  const handleLogout = async () => {
    await dispatch(logout());
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Controller
          control={control}
          name="roomId"
          rules={{ required: 'Room ID обязателен' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.roomId && styles.inputError]}
              placeholder="Введите roomID"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="none"
            />
          )}
        />
        {errors.roomId && (
          <Text style={styles.errorText}>{errors.roomId.message}</Text>
        )}

        <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)}>
          <Text style={styles.buttonText}>Подключится</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Выйти</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  form: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 10,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  inputError: {
    borderColor: colors.borderError,
  },
  button: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: colors.secondary,
  },
  buttonText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: colors.borderError,
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
  },
});
