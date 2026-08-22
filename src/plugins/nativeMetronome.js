import { registerPlugin } from '@capacitor/core'

const NativeMetronome = registerPlugin('NativeMetronome', {
  web: () => import('./nativeMetronomeWeb').then(m => new m.NativeMetronomeWeb())
})

export default NativeMetronome
