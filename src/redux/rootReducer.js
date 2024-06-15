import { combineReducers } from 'redux';
import storage from 'redux-persist/lib/storage';//access to local storage to persistently store the states


// slices
import appReducer from './slices/app';
import themeSliceReducer from "./slices/theme"
import audioCallReducer from './slices/audioCall';
import videoCallReducer from './slices/videoCall';
import authReducer from './slices/auth';
import conversationReducer from './slices/conversation';

// ----------------------------------------------------------------------

const rootPersistConfig = {
  key: 'root',//stored in local storage as name of redux-root
  storage,//local storage of browser
  keyPrefix: 'redux-',
  //   whitelist: [],//states that we want to persist
  //   blacklist: [],//states that we not want to persist
};

const rootReducer = combineReducers({
  app: appReducer,
  theme: themeSliceReducer,
  auth: authReducer,
  conversation: conversationReducer,
  audioCall: audioCallReducer,
  videoCall: videoCallReducer,
});

export { rootPersistConfig, rootReducer };