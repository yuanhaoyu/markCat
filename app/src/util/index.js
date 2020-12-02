import catImage from '../assets/cat-dev.png'
import CryptoJS from 'crypto-js'
import hash from 'object-hash'
const APPKEY = 'MARK_CAT'

const JsonFormatter = {
    stringify: function(cipherParams) {
      const jsonObj = { ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64) }
      if (cipherParams.iv) {
        jsonObj.iv = cipherParams.iv.toString()
      }
      if (cipherParams.salt) {
        jsonObj.s = cipherParams.salt.toString()
      }
      return JSON.stringify(jsonObj)
    },
    parse: function(jsonStr) {
      var jsonObj = JSON.parse(jsonStr)

      var cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: CryptoJS.enc.Base64.parse(jsonObj.ct)
      })

      if (jsonObj.iv) {
        cipherParams.iv = CryptoJS.enc.Hex.parse(jsonObj.iv)
      }

      if (jsonObj.s) {
        cipherParams.salt = CryptoJS.enc.Hex.parse(jsonObj.s)
      }

      return cipherParams
    }
}

export const linkNewTab = url => {
    let index = 0
    window.chrome.tabs.getAllInWindow(null,(tabs) => {
        tabs.some((tab, i) => {
          if (tab.active) {
            index = i
            return true
          }
        })
        window.chrome.tabs.create({
          windowId: null,
          index,
          url
        })
    })
}

export const getCurrentPageInfo = () => {
    return new Promise(resolve => {
      window.chrome.tabs.getSelected(null, ({ url, title, favIconUrl = catImage }) => {
        resolve({
          url,
          title,
          favIconUrl,
        })
      })
    })
}

export const setStorage = obj => {
    return new Promise((resolve, reject) => {
        try {
            window.chrome.storage.sync.set(JSON.parse(JSON.stringify(obj)), d => {
                resolve(d)
            })
        } catch (error) {
            reject(error)
        }
    })
}

export const getStorage = key => {
    return new Promise(resolve => {
      window.chrome.storage.sync.get(key, (result) => {
        resolve(result[key] || [])
      })
    })
}

export const removeStorage = key => {
    return new Promise(resolve => {
      window.chrome.storage.sync.remove(key, (d) => {
        this.getMarkLists()
        resolve(d)
      })
    })
}

export const clearAllStorage = () => {
    return new Promise(resolve => {
      window.chrome.storage.sync.clear(async (d) => {
        this.getMarkLists()
        resolve(d)
      })
    })
}

export const localMd5 = val => {
    return hash.MD5(val + APPKEY);
}

export const encryptedMsg = (msg, pwd) => {
   const encrypted = CryptoJS.AES.encrypt(msg, pwd, {
    format: JsonFormatter
  })
  return CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Utf8.parse(encrypted))
}

export const decryptedMsg = (msg, pwd) => {
    const decrypted = CryptoJS.AES.decrypt(msg, pwd, {
        format: JsonFormatter
    })
    return CryptoJS.enc.Utf8.stringify(decrypted)
}