import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../store/slices/authSlice';
import { AuthScreen } from '../AuthScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// Create test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        token: null,
        loading: false,
        error: null,
        ...initialState,
      },
    },
  });
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode; store?: any }> = ({
  children,
  store = createTestStore(),
}) => (
  <Provider store={store}>
    {children}
  </Provider>
);

describe('AuthScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with form inputs', () => {
    render(
      <TestWrapper>
        <AuthScreen navigation={mockNavigation as any} route={{} as any} />
      </TestWrapper>
    );

    expect(screen.getByPlaceholderText('Имя пользователя')).toBeTruthy();
    expect(screen.getByPlaceholderText('Пароль')).toBeTruthy();
    expect(screen.getByText('Войти')).toBeTruthy();
  });

  it('shows validation errors for empty fields', async () => {
    render(
      <TestWrapper>
        <AuthScreen navigation={mockNavigation as any} route={{} as any} />
      </TestWrapper>
    );

    const loginButton = screen.getByText('Войти');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(screen.getByText('Имя пользователя обязательно')).toBeTruthy();
      expect(screen.getByText('Пароль обязателен')).toBeTruthy();
    });
  });

  it('shows validation error for empty username only', async () => {
    render(
      <TestWrapper>
        <AuthScreen navigation={mockNavigation as any} route={{} as any} />
      </TestWrapper>
    );

    const passwordInput = screen.getByPlaceholderText('Пароль');
    const loginButton = screen.getByText('Войти');

    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(screen.getByText('Имя пользователя обязательно')).toBeTruthy();
      expect(screen.queryByText('Пароль обязателен')).toBeNull();
    });
  });

  it('shows validation error for empty password only', async () => {
    render(
      <TestWrapper>
        <AuthScreen navigation={mockNavigation as any} route={{} as any} />
      </TestWrapper>
    );

    const usernameInput = screen.getByPlaceholderText('Имя пользователя');
    const loginButton = screen.getByText('Войти');

    fireEvent.changeText(usernameInput, 'testuser');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(screen.getByText('Пароль обязателен')).toBeTruthy();
      expect(screen.queryByText('Имя пользователя обязательно')).toBeNull();
    });
  });

  it('submits form with valid data', async () => {
    const testStore = createTestStore();
    render(
      <TestWrapper store={testStore}>
        <AuthScreen navigation={mockNavigation as any} route={{} as any} />
      </TestWrapper>
    );

    const usernameInput = screen.getByPlaceholderText('Имя пользователя');
    const passwordInput = screen.getByPlaceholderText('Пароль');
    const loginButton = screen.getByText('Войти');

    fireEvent.changeText(usernameInput, 'testuser');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(testStore.getState().auth.loading).toBe(true);
    });

    // Wait for the async login to complete
    await waitFor(() => {
      expect(testStore.getState().auth.loading).toBe(false);
    }, { timeout: 2000 });

    expect(testStore.getState().auth.token).toBeTruthy();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('token', expect.any(String));
  });

  it('shows loading state during login', async () => {
    const testStore = createTestStore();
    render(
      <TestWrapper store={testStore}>
        <AuthScreen navigation={mockNavigation as any} route={{} as any} />
      </TestWrapper>
    );

    const usernameInput = screen.getByPlaceholderText('Имя пользователя');
    const passwordInput = screen.getByPlaceholderText('Пароль');
    const loginButton = screen.getByText('Войти');

    fireEvent.changeText(usernameInput, 'testuser');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('activity-indicator')).toBeTruthy();
    });
  });

  it('shows error message from Redux state', () => {
    const testStore = createTestStore({
      error: 'Invalid credentials',
    });

    render(
      <TestWrapper store={testStore}>
        <AuthScreen navigation={mockNavigation as any} route={{} as any} />
      </TestWrapper>
    );

    expect(screen.getByText('Invalid credentials')).toBeTruthy();
  });

  it('disables button during loading', async () => {
    const testStore = createTestStore({ loading: true });
    render(
      <TestWrapper store={testStore}>
        <AuthScreen navigation={mockNavigation as any} route={{} as any} />
      </TestWrapper>
    );

    const button = screen.getByRole('button');
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it('handles input focus and blur correctly', () => {
    render(
      <TestWrapper>
        <AuthScreen navigation={mockNavigation as any} route={{} as any} />
      </TestWrapper>
    );

    const usernameInput = screen.getByPlaceholderText('Имя пользователя');
    const passwordInput = screen.getByPlaceholderText('Пароль');

    fireEvent(usernameInput, 'focus');
    fireEvent(usernameInput, 'blur');
    fireEvent(passwordInput, 'focus');
    fireEvent(passwordInput, 'blur');

    // Should not throw any errors
    expect(usernameInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
  });

  it('applies error styles to inputs with validation errors', async () => {
    render(
      <TestWrapper>
        <AuthScreen navigation={mockNavigation as any} route={{} as any} />
      </TestWrapper>
    );

    const loginButton = screen.getByText('Войти');
    fireEvent.press(loginButton);

    await waitFor(() => {
      const usernameInput = screen.getByPlaceholderText('Имя пользователя');
      const passwordInput = screen.getByPlaceholderText('Пароль');

      expect(usernameInput.props.style).toContainEqual(
        expect.objectContaining({ borderColor: '#ff3b30' })
      );
      expect(passwordInput.props.style).toContainEqual(
        expect.objectContaining({ borderColor: '#ff3b30' })
      );
    });
  });

  it('clears validation errors when user starts typing', async () => {
    render(
      <TestWrapper>
        <AuthScreen navigation={mockNavigation as any} route={{} as any} />
      </TestWrapper>
    );

    const usernameInput = screen.getByPlaceholderText('Имя пользователя');
    const loginButton = screen.getByText('Войти');

    // Trigger validation error
    fireEvent.press(loginButton);
    await waitFor(() => {
      expect(screen.getByText('Имя пользователя обязательно')).toBeTruthy();
    });

    // Start typing to clear error
    fireEvent.changeText(usernameInput, 'test');
    await waitFor(() => {
      expect(screen.queryByText('Имя пользователя обязательно')).toBeNull();
    });
  });
});
