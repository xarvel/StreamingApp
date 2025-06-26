import React, { FC } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { login } from '../store/slices/authSlice';
import { AppDispatch, RootState } from '../store';
import { AuthScreenProps } from '../types/navigation';
import { colors } from '../theme/colors';

interface FormData {
  username: string;
  password: string;
}

export const AuthScreen: FC<AuthScreenProps> = ({}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    await dispatch(login(data));
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Controller
          control={control}
          name="username"
          rules={{ required: 'Имя пользователя обязательно' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.username && styles.inputError]}
              placeholder="Имя пользователя"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="none"
            />
          )}
        />
        {errors.username && (
          <Text style={styles.errorText}>{errors.username.message}</Text>
        )}

        <Controller
          control={control}
          name="password"
          rules={{ required: 'Пароль обязателен' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="Пароль"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
            />
          )}
        />
        {errors.password && (
          <Text style={styles.errorText}>{errors.password.message}</Text>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#fff" testID="activity-indicator" />
          ) : (
            <Text style={styles.buttonText}>Войти</Text>
          )}
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
  },
  buttonText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: colors.error,
    marginBottom: 10,
  },
  errorText: {
    color: colors.borderError,
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
  },
});
