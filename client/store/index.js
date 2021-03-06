import { createStore, combineReducers, applyMiddleware } from "redux"
import { createLogger } from "redux-logger"
import thunkMiddleware from "redux-thunk"
import { composeWithDevTools } from "redux-devtools-extension"
import auth from "./auth"
import singleUserReducer from "./singleUser"
import singleProjectReducer from "./singleProject"

const reducer = combineReducers({
  auth,
  user: singleUserReducer,
  project: singleProjectReducer
})
const middleware = composeWithDevTools(
  applyMiddleware(thunkMiddleware, createLogger({ collapsed: true }))
)
const store = createStore(reducer, middleware)

export default store
export * from "./auth"
