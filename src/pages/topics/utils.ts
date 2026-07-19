import { toast } from '@/components/Toast'

/** 复制文本到剪贴板（clipboard API 失败时回退 execCommand），成功/失败均 toast */
export async function copyText(text: string, toastMsg: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    toast(toastMsg)
  } catch {
    // 非安全上下文回退
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      toast(toastMsg)
    } catch {
      toast('复制失败，请手动选择文本复制')
    }
  }
}
