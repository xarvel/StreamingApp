import React, { useEffect, FC } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { Navigation } from './navigation';
import { checkAuth } from './store/slices/authSlice';
import { registerGlobals } from 'react-native-webrtc';

registerGlobals();

const App: FC = () => {
    useEffect(() => {
        store.dispatch(checkAuth());
    }, []);

    return (
        <Provider store={store}>
            <Navigation />
        </Provider>
    );
};


export default App;
