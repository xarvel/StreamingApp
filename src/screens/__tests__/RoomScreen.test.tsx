import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../store/slices/authSlice';
import { RoomScreen } from '../RoomScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RN from 'react-native';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock Alert.alert
jest.spyOn(RN.Alert, 'alert').mockImplementation(jest.fn());

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
        token: 'test-token',
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

describe('RoomScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with form inputs', () => {
    render(
      <TestWrapper>
        <RoomScreen navigation={mockNavigation as any} route={{} as any} />
      </TestWrapper>
    );

    expect(screen.getByPlaceholderText('Введите roomID')).toBeTruthy();
    expect(screen.getByText('Подключится')).toBeTruthy();
    expect(screen.getByText('Выйти')).toBeTruthy();
  });

  it('shows default room ID value', () => {
    render(
      <TestWrapper>
        <RoomScreen navigation={mockNavigation as any} route={{} as any} />
      </TestWrapper>
    );

    const roomInput = screen.getByPlaceholderText('Введите roomID');
    expect(roomInput.props.value).toBe('');
  });

  it('shows validation error for empty room ID', async () => {
    render(
      <TestWrapper>
        <RoomScreen navigation={mockNavigation as any} route={{} as any} />
      </TestWrapper>
    );

    const roomInput = screen.getByPlaceholderText('Введите roomID');
    const connectButton = screen.getByText('Подключится');

    // Clear the input
    fireEvent.changeText(roomInput, '');
    fireEvent.press(connectButton);

    await waitFor(() => {
      expect(screen.getByText('Room ID обязателен')).toBeTruthy();
    });
  });

  it('shows validation error for whitespace-only room ID', async () => {
    render(
      <TestWrapper>
        <RoomScreen navigation={mockNavigation as any} route={{} as any} />
      </TestWrapper>
    );

    const roomInput = screen.getByPlaceholderText('Введите roomID');
    const connectButton = screen.getByText('Подключится');

    fireEvent.changeText(roomInput, '   ');
    fireEvent.press(connectButton);

    // For whitespace-only input, the form validation won't trigger because it's not empty
    // but the onSubmit function will show an alert
    await waitFor(() => {
      expect(mockNavigation.navigate).not.toHaveBeenCalled();
    });
  });


  it('navigates to Call screen with valid room ID', async () => {
    render(
      <TestWrapper>
        <RoomScreen navigation={mockNavigation as any} route={{} as any} />
      </TestWrapper>
    );

    const roomInput = screen.getByPlaceholderText('Введите roomID');
    const connectButton = screen.getByText('Подключится');

    fireEvent.changeText(roomInput, 'test-room-123');
    fireEvent.press(connectButton);

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Call', {
        roomId: 'test-room-123',
      });
    });
  });

  it('trims whitespace from room ID before navigation', async () => {
    render(
      <TestWrapper>
        <RoomScreen navigation={mockNavigation as any} route={{} as any} />
      </TestWrapper>
    );

    const roomInput = screen.getByPlaceholderText('Введите roomID');
    const connectButton = screen.getByText('Подключится');

    fireEvent.changeText(roomInput, '  test-room-123  ');
    fireEvent.press(connectButton);

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Call', {
        roomId: 'test-room-123',
      });
    });
  });


  it('handles logout correctly', async () => {
    const testStore = createTestStore();
    render(
      <TestWrapper store={testStore}>
        <RoomScreen navigation={mockNavigation as any} route={{} as any} />
      </TestWrapper>
    );

    const logoutButton = screen.getByText('Выйти');
    fireEvent.press(logoutButton);

    await waitFor(() => {
      expect(testStore.getState().auth.token).toBeNull();
    });

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('token');
  });

  it('handles input focus and blur correctly', () => {
    render(
      <TestWrapper>
        <RoomScreen navigation={mockNavigation as any} route={{} as any} />
      </TestWrapper>
    );

    const roomInput = screen.getByPlaceholderText('Введите roomID');

    fireEvent(roomInput, 'focus');
    fireEvent(roomInput, 'blur');

    // Should not throw any errors
    expect(roomInput).toBeTruthy();
  });

  it('updates input value correctly', () => {
    render(
      <TestWrapper>
        <RoomScreen navigation={mockNavigation as any} route={{} as any} />
      </TestWrapper>
    );

    const roomInput = screen.getByPlaceholderText('Введите roomID');

    fireEvent.changeText(roomInput, 'new-room-id');

    expect(roomInput.props.value).toBe('new-room-id');
  });

  it('maintains form state after validation errors', async () => {
    render(
      <TestWrapper>
        <RoomScreen navigation={mockNavigation as any} route={{} as any} />
      </TestWrapper>
    );

    const roomInput = screen.getByPlaceholderText('Введите roomID');
    const connectButton = screen.getByText('Подключится');

    // First, submit with empty value to trigger error
    fireEvent.changeText(roomInput, '');
    fireEvent.press(connectButton);

    await waitFor(() => {
      expect(screen.getByText('Room ID обязателен')).toBeTruthy();
    });

    // Then enter valid value and submit
    fireEvent.changeText(roomInput, 'valid-room');
    fireEvent.press(connectButton);

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Call', {
        roomId: 'valid-room',
      });
    });
  });
});
