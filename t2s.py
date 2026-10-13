import ctypes
_i = ctypes.CDLL('libicui18n.so.74')
_u = ctypes.CDLL('libicuuc.so.74')
V='_74'
openU=getattr(_i,'utrans_openU'+V); trans=getattr(_i,'utrans_transUChars'+V)
openU.restype=ctypes.c_void_p
def _buf(s):
    b=s.encode('utf-16-le'); return b
_tid=_buf('Traditional-Simplified')
err=ctypes.c_int(0)
_tr=openU(ctypes.c_char_p(_tid),ctypes.c_int32(len(_tid)//2),0,None,0,None,ctypes.byref(err))
assert err.value<=0, err.value
FIX={'甚么':'什么','着':'着'}
def t2s(s):
    if not s: return s
    b=s.encode('utf-16-le'); n=len(b)//2; cap=n*2+16
    arr=(ctypes.c_uint16*cap).from_buffer_copy(b+b'\0\0'*(cap-n))
    tl=ctypes.c_int32(n); lim=ctypes.c_int32(n); e=ctypes.c_int(0)
    trans(ctypes.c_void_p(_tr),arr,ctypes.byref(tl),ctypes.c_int32(cap),ctypes.c_int32(0),ctypes.byref(lim),ctypes.byref(e))
    assert e.value<=0,e.value
    out=bytes(arr)[:tl.value*2].decode('utf-16-le')
    for k,v in FIX.items(): out=out.replace(k,v)
    return out
if __name__=='__main__':
    print(t2s('舊人有己生命檢視表，為甚麼看見你弟兄眼中有刺，卻不想自己眼中有梁木呢？說話溫柔，著急，數算主恩，裡面'))
