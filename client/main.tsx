import * as React from 'react';
import { Store, createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import * as ReactDOM from 'react-dom';

import App from './containers/App';
import rootReducer from './reducer'
import { startBackgroundSession, backgroundMiddleware } from './background'

import config from './config';
import { Logger } from './logger';

Logger.setLevel(config.logLevel);

const store: Store<any> =
  createStore(rootReducer, applyMiddleware(backgroundMiddleware));

startBackgroundSession(config.socketEndpoint, store)

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('app')
);

