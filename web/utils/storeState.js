

export const localStore = () => {
  return window.store.getState()
}

export const dockerStore = () => localStore() ? localStore().docker : null
export const loginStore = () => localStore() ? localStore().login : null
export const navigationStore = () => localStore() ? localStore().navigation : null
export const storageStore = () => localStore() ? localStore().storage : null
export const appstoreStore = () => localStore() ? localStore().appstore : null
export const installedStore = () => localStore() ? localStore().installed : null
export const serverOpStore = () => localStore() ? localStore().serverOp : null
export const snackbarStore = () => localStore() ? localStore().snackbar : null
export const themeStore = () => localStore() ? localStore().themeColor : null

export const serverState = () => {
  let server = window.store.getState().server
  return server ? server.state : null
}

export const storageState = () => serverState() ? serverState().storage : null
export const dockerState = () => serverState() ? serverState().docker : null 
export const appstoreState = () => serverState() ? serverState().appstore : null
export const taskStates = () => serverState() ? serverState().tasks : null
export const configState = () => serverState() ? serverState().config : null
export const networkState = () => serverState() ? serverState().network : null
export const timeDateState = () => serverState() ? serverState().timeDate : null

export const dispatch = (action) => window.store.dispatch(action)

